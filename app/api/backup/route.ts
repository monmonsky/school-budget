import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

const DB_PATH = process.env.DB_PATH || "./data/app.db";
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

/**
 * Unduh satu arsip berisi database dan seluruh kuitansi.
 *
 * Database tidak disalin mentah: dengan mode WAL, menyalin berkas .db saja bisa
 * menghasilkan snapshot yang tertinggal. `VACUUM INTO` menulis salinan yang
 * konsisten dan sudah rapi ke lokasi sementara, dan itulah yang diarsipkan.
 */
export async function GET() {
  if (!(await isAuthed())) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const stagingDir = fs.mkdtempSync(path.join(os.tmpdir(), "buku-kas-backup-"));
  const snapshotPath = path.join(stagingDir, path.basename(DB_PATH));

  const cleanup = () => {
    try {
      fs.rmSync(stagingDir, { recursive: true, force: true });
    } catch {
      /* folder sementara mungkin sudah hilang */
    }
  };

  try {
    getDb().exec(`VACUUM INTO '${snapshotPath.replace(/'/g, "''")}'`);
  } catch (error) {
    cleanup();
    const detail = error instanceof Error ? error.message : "penyebab tidak diketahui";
    return new NextResponse(`Gagal menyiapkan salinan database: ${detail}`, { status: 500 });
  }

  // Arsipkan snapshot dan folder uploads tanpa menyalin kuitansi dua kali.
  const args = ["-czf", "-", "-C", stagingDir, path.basename(snapshotPath)];
  const uploadsAbsolute = path.resolve(process.cwd(), UPLOAD_DIR);
  if (fs.existsSync(uploadsAbsolute)) {
    args.push("-C", path.dirname(uploadsAbsolute), path.basename(uploadsAbsolute));
  }

  const child = spawn("tar", args, { stdio: ["ignore", "pipe", "pipe"] });

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      child.stdout.on("data", (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
      child.stdout.on("end", () => {
        controller.close();
        cleanup();
      });
      child.on("error", (error) => {
        controller.error(error);
        cleanup();
      });
    },
    cancel() {
      child.kill();
      cleanup();
    },
  });

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/gzip",
      "Content-Disposition": `attachment; filename="buku-kas-${stamp}.tar.gz"`,
      "Cache-Control": "private, no-store",
    },
  });
}

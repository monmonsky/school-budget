import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { getDb } from "@/lib/db";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthed())) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const { id } = await params;
  const att = getDb()
    .prepare("SELECT * FROM attachments WHERE id = ?")
    .get(Number(id)) as
    | { file_path: string; file_name: string; mime_type: string }
    | undefined;

  if (!att) return new NextResponse("Not found", { status: 404 });

  const abs = path.resolve(process.cwd(), UPLOAD_DIR, att.file_path);
  if (!abs.startsWith(path.resolve(process.cwd(), UPLOAD_DIR)) || !fs.existsSync(abs)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const buf = fs.readFileSync(abs);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": att.mime_type,
      "Content-Disposition": `inline; filename="${encodeURIComponent(att.file_name)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { getAttachment } from "@/lib/queries";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

// Hanya tipe ini yang aman ditampilkan langsung di dalam halaman.
const INLINE_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

function resolveInsideUploads(fileName: string): string | null {
  const root = path.resolve(process.cwd(), UPLOAD_DIR);
  const abs = path.resolve(root, fileName);
  // Jangan biarkan nama berkas keluar dari folder uploads.
  if (abs !== root && !abs.startsWith(root + path.sep)) return null;
  return fs.existsSync(abs) ? abs : null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthed())) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const attachment = getAttachment(Number(id));
  if (!attachment) return new NextResponse("Not found", { status: 404 });

  const url = new URL(request.url);
  const wantsThumb = url.searchParams.get("size") === "thumb";
  const forceDownload = url.searchParams.get("download") === "1";

  // Pratinjau dipakai kalau ada; kalau tidak, jatuh ke berkas asli.
  const useThumb = wantsThumb && Boolean(attachment.thumb_path);
  const fileName = useThumb ? attachment.thumb_path! : attachment.file_path;
  const contentType = useThumb ? "image/jpeg" : attachment.mime_type;

  const abs = resolveInsideUploads(fileName);
  if (!abs) return new NextResponse("Not found", { status: 404 });

  const canInline = INLINE_TYPES.includes(contentType);
  const disposition = forceDownload || !canInline ? "attachment" : "inline";
  const encodedName = encodeURIComponent(attachment.file_name);

  const body = fs.readFileSync(abs);
  return new NextResponse(new Uint8Array(body), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `${disposition}; filename*=UTF-8''${encodedName}`,
      // mime_type berasal dari browser saat upload, jadi jangan biarkan
      // peramban menebak ulang isi berkas dan menjalankannya sebagai HTML.
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}

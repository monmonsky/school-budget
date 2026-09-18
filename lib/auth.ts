import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const DEV_SECRET = "dev-secret-ganti-di-produksi";
const SECRET = process.env.SESSION_SECRET || DEV_SECRET;
const COOKIE = "rps_session";

/**
 * Cookie sesi hanya dilindungi oleh SECRET ini. Kalau nilainya masih bawaan
 * dan aplikasi jalan di produksi, siapa pun bisa memalsukan sesi — jadi
 * lebih baik menolak jalan daripada terlihat aman padahal tidak.
 * Fase build dikecualikan supaya `next build` tidak butuh env var.
 */
function assertUsableSecret() {
  const isBuild = process.env.NEXT_PHASE === "phase-production-build";
  if (process.env.NODE_ENV === "production" && !isBuild && SECRET === DEV_SECRET) {
    throw new Error(
      "SESSION_SECRET belum diatur. Isi env var tersebut dengan nilai acak sebelum menjalankan aplikasi di produksi."
    );
  }
}

function sign(value: string): string {
  assertUsableSecret();
  return crypto.createHmac("sha256", SECRET).update(value).digest("hex");
}

// Token sederhana untuk single-user: "ok.<signature>"
function makeToken(): string {
  const payload = "ok";
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (payload !== "ok" || !sig) return false;
  const expected = sign(payload);
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function createSession() {
  const store = await cookies();
  store.set(COOKIE, makeToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 hari
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  return verifyToken(store.get(COOKIE)?.value);
}

// Dipakai di server component / route handler untuk memproteksi akses
export async function requireAuth() {
  if (!(await isAuthed())) redirect("/login");
}

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SECRET = process.env.SESSION_SECRET || "dev-secret-ganti-di-produksi";
const COOKIE = "rps_session";

function sign(value: string): string {
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

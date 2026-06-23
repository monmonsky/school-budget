import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/auth";
import { loginAction } from "@/lib/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAuthed()) redirect("/");
  const { error } = await searchParams;

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="card w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-indigo-600 text-xl text-white">
            ₨
          </div>
          <h1 className="text-lg font-semibold">Pencatat Pembayaran Kuliah</h1>
          <p className="text-sm text-slate-500">Masukkan password untuk masuk</p>
        </div>
        <form action={loginAction} className="space-y-4">
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoFocus
              required
              className="input"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
              Password salah. Coba lagi.
            </p>
          )}
          <button type="submit" className="btn-primary w-full">
            Masuk
          </button>
        </form>
      </div>
    </div>
  );
}

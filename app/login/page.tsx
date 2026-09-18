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
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      {/* Sampul buku kas */}
      <aside className="relative flex flex-col justify-between overflow-hidden bg-ink p-8 lg:p-12">
        <div>
          <p className="font-display text-lg font-semibold uppercase leading-tight tracking-[0.14em] text-paper-card">
            Buku Kas
            <br />
            Dana Kuliah
          </p>
          <span className="mt-4 block h-px w-12 bg-brass" />
        </div>
        <p className="relative mt-10 max-w-sm text-sm leading-relaxed text-paper/45 lg:mt-0">
          Satu kantong dana, dicatat masuk dan keluarnya, lengkap dengan kuitansi.
        </p>
        {/* Arsir tipis — bahasa visual yang sama dengan meter dana. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rotate-12 bg-hatch opacity-[0.07]"
        />
      </aside>

      {/* Formulir */}
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="page-title">Masuk</h1>
          <p className="mt-2 text-sm text-ink-faint">
            Masukkan password untuk membuka buku kas.
          </p>

          <form action={loginAction} className="mt-7 space-y-4">
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
              <p
                role="alert"
                className="rounded-control border border-oxide/25 bg-oxide-soft px-3 py-2 text-sm text-oxide"
              >
                Password tidak cocok. Coba lagi.
              </p>
            )}
            <button type="submit" className="btn-primary w-full">
              Masuk
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

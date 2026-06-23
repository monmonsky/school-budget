import { requireAuth } from "@/lib/auth";
import { getSettings, listCategories, listSemesters } from "@/lib/queries";
import {
  updateSettings,
  addCategory,
  deleteCategory,
  addSemester,
  deleteSemester,
  changePassword,
} from "@/lib/actions";
import { rupiah } from "@/lib/format";
import ConfirmSubmit from "@/components/ConfirmSubmit";

export default async function PengaturanPage({
  searchParams,
}: {
  searchParams: Promise<{ pw?: string }>;
}) {
  await requireAuth();
  const { pw } = await searchParams;
  const s = getSettings();
  const categories = listCategories();
  const semesters = listSemesters();
  const outCats = categories.filter((c) => c.type === "out");
  const inCats = categories.filter((c) => c.type === "in");

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Pengaturan</h1>

      {/* Dana */}
      <form action={updateSettings} className="card space-y-4">
        <h2 className="font-semibold">Dana</h2>
        <div>
          <label className="label">Nama dana</label>
          <input name="fund_name" defaultValue={s.fund_name} className="input" />
        </div>
        <div>
          <label className="label">Saldo awal (Rp)</label>
          <input
            name="initial_balance"
            inputMode="numeric"
            defaultValue={s.initial_balance}
            className="input"
          />
          <p className="mt-1 text-xs text-slate-400">
            Saat ini: {rupiah(s.initial_balance)}. Mengubah ini menggeser semua saldo.
          </p>
        </div>
        <button className="btn-primary">Simpan</button>
      </form>

      {/* Kategori */}
      <div className="card space-y-4">
        <h2 className="font-semibold">Kategori</h2>
        <form action={addCategory} className="flex flex-wrap gap-2">
          <input name="name" placeholder="Nama kategori" required className="input flex-1" />
          <select name="type" defaultValue="out" className="input w-32">
            <option value="out">Keluar</option>
            <option value="in">Masuk</option>
          </select>
          <button className="btn-primary">Tambah</button>
        </form>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Pengeluaran</p>
            <ul className="space-y-1.5">
              {outCats.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-sm"
                >
                  <span>{c.name}</span>
                  <ConfirmSubmit
                    action={deleteCategory.bind(null, c.id)}
                    message="Hapus kategori ini? (hanya bisa jika belum dipakai)"
                    className="text-xs text-rose-400 hover:text-rose-600"
                  >
                    ✕
                  </ConfirmSubmit>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Pemasukan</p>
            <ul className="space-y-1.5">
              {inCats.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-sm"
                >
                  <span>{c.name}</span>
                  <ConfirmSubmit
                    action={deleteCategory.bind(null, c.id)}
                    message="Hapus kategori ini? (hanya bisa jika belum dipakai)"
                    className="text-xs text-rose-400 hover:text-rose-600"
                  >
                    ✕
                  </ConfirmSubmit>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Semester */}
      <div className="card space-y-4">
        <h2 className="font-semibold">Semester / Termin</h2>
        <form action={addSemester} className="flex gap-2">
          <input
            name="name"
            placeholder="mis. Ganjil 2027/2028"
            required
            className="input flex-1"
          />
          <button className="btn-primary">Tambah</button>
        </form>
        <ul className="space-y-1.5">
          {semesters.map((sem) => (
            <li
              key={sem.id}
              className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-sm"
            >
              <span>{sem.name}</span>
              <ConfirmSubmit
                action={deleteSemester.bind(null, sem.id)}
                message="Hapus semester ini? (hanya bisa jika belum dipakai)"
                className="text-xs text-rose-400 hover:text-rose-600"
              >
                ✕
              </ConfirmSubmit>
            </li>
          ))}
        </ul>
      </div>

      {/* Password */}
      <form action={changePassword} className="card space-y-4">
        <h2 className="font-semibold">Ubah Password</h2>
        {pw === "ok" && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Password berhasil diubah.
          </p>
        )}
        {pw === "salah" && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
            Password saat ini salah.
          </p>
        )}
        {pw === "pendek" && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
            Password baru minimal 6 karakter.
          </p>
        )}
        <div>
          <label className="label">Password saat ini</label>
          <input name="current" type="password" required className="input" />
        </div>
        <div>
          <label className="label">Password baru</label>
          <input name="next" type="password" required className="input" />
        </div>
        <button className="btn-primary">Ubah Password</button>
      </form>
    </div>
  );
}

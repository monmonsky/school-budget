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
import PageHeader from "@/components/PageHeader";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import { IconDownload, IconPlus, IconTrash } from "@/components/icons";

const PASSWORD_MESSAGES: Record<string, { text: string; className: string }> = {
  ok: {
    text: "Password berhasil diubah.",
    className: "border-ledger/25 bg-ledger-soft text-ledger",
  },
  salah: {
    text: "Password saat ini tidak cocok. Coba lagi.",
    className: "border-oxide/25 bg-oxide-soft text-oxide",
  },
  pendek: {
    text: "Password baru perlu minimal 6 karakter.",
    className: "border-oxide/25 bg-oxide-soft text-oxide",
  },
};

function DeletableList({
  items,
  buildAction,
  confirmMessage,
  emptyMessage,
}: {
  items: { id: number; name: string }[];
  buildAction: (id: number) => () => void | Promise<void>;
  confirmMessage: string;
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-ink-faint">{emptyMessage}</p>;
  }
  return (
    <ul className="divide-y divide-rule rounded-control border border-rule">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
          <span className="truncate text-ink">{item.name}</span>
          <ConfirmSubmit
            action={buildAction(item.id)}
            message={confirmMessage}
            className="inline-flex shrink-0 cursor-pointer items-center rounded-control p-1.5 text-ink-faint transition-colors duration-150 hover:bg-oxide-soft hover:text-oxide"
          >
            <IconTrash className="h-4 w-4" />
            <span className="sr-only">Hapus {item.name}</span>
          </ConfirmSubmit>
        </li>
      ))}
    </ul>
  );
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ pw?: string }>;
}) {
  await requireAuth();
  const { pw } = await searchParams;
  const settings = getSettings();
  const categories = listCategories();
  const semesters = listSemesters();
  const expenseCategories = categories.filter((category) => category.type === "out");
  const incomeCategories = categories.filter((category) => category.type === "in");
  const passwordMessage = pw ? PASSWORD_MESSAGES[pw] : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Buku kas"
        title="Pengaturan"
        description="Atur nama dana, saldo awal, daftar kategori dan semester, serta password masuk."
      />

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <form action={updateSettings} className="card overflow-hidden">
          <div className="border-b border-rule px-5 py-3.5">
            <h2 className="section-title">Dana</h2>
          </div>
          <div className="space-y-4 p-5">
            <div>
              <label className="label" htmlFor="fund-name">
                Nama dana
              </label>
              <input
                id="fund-name"
                name="fund_name"
                defaultValue={settings.fund_name}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="initial-balance">
                Saldo awal
              </label>
              <input
                id="initial-balance"
                name="initial_balance"
                inputMode="numeric"
                defaultValue={settings.initial_balance}
                className="input num"
              />
              <p className="mt-1.5 text-xs text-ink-faint">
                Sekarang <span className="num">{rupiah(settings.initial_balance)}</span>.
                Mengubah angka ini menggeser seluruh perhitungan saldo.
              </p>
            </div>
          </div>
          <div className="border-t border-rule bg-paper-sunk/50 px-5 py-4">
            <button className="btn-primary">Simpan dana</button>
          </div>
        </form>

        <form action={changePassword} className="card overflow-hidden">
          <div className="border-b border-rule px-5 py-3.5">
            <h2 className="section-title">Password</h2>
          </div>
          <div className="space-y-4 p-5">
            {passwordMessage && (
              <p
                role="status"
                className={`rounded-control border px-3 py-2 text-sm ${passwordMessage.className}`}
              >
                {passwordMessage.text}
              </p>
            )}
            <div>
              <label className="label" htmlFor="password-current">
                Password saat ini
              </label>
              <input
                id="password-current"
                name="current"
                type="password"
                required
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="password-next">
                Password baru
              </label>
              <input
                id="password-next"
                name="next"
                type="password"
                required
                className="input"
              />
              <p className="mt-1.5 text-xs text-ink-faint">Minimal 6 karakter.</p>
            </div>
          </div>
          <div className="border-t border-rule bg-paper-sunk/50 px-5 py-4">
            <button className="btn-primary">Ubah password</button>
          </div>
        </form>

        <div className="card overflow-hidden">
          <div className="border-b border-rule px-5 py-3.5">
            <h2 className="section-title">Kategori</h2>
          </div>
          <div className="space-y-5 p-5">
            <form action={addCategory} className="flex flex-wrap items-end gap-2">
              <div className="min-w-[10rem] flex-1">
                <label className="label" htmlFor="category-name">
                  Nama kategori
                </label>
                <input
                  id="category-name"
                  name="name"
                  placeholder="mis. Praktikum"
                  required
                  className="input"
                />
              </div>
              <div className="w-32">
                <label className="label" htmlFor="category-type">
                  Jenis
                </label>
                <select id="category-type" name="type" defaultValue="out" className="input">
                  <option value="out">Keluar</option>
                  <option value="in">Masuk</option>
                </select>
              </div>
              <button className="btn-primary">
                <IconPlus className="h-4 w-4" />
                Tambah
              </button>
            </form>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="eyebrow mb-2">Pengeluaran</p>
                <DeletableList
                  items={expenseCategories}
                  buildAction={(id) => deleteCategory.bind(null, id)}
                  confirmMessage="Hapus kategori ini? Hanya bisa dihapus jika belum dipakai transaksi."
                  emptyMessage="Belum ada kategori pengeluaran."
                />
              </div>
              <div>
                <p className="eyebrow mb-2">Pemasukan</p>
                <DeletableList
                  items={incomeCategories}
                  buildAction={(id) => deleteCategory.bind(null, id)}
                  confirmMessage="Hapus kategori ini? Hanya bisa dihapus jika belum dipakai transaksi."
                  emptyMessage="Belum ada kategori pemasukan."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-rule px-5 py-3.5">
            <h2 className="section-title">Semester</h2>
          </div>
          <div className="space-y-5 p-5">
            <form action={addSemester} className="flex flex-wrap items-end gap-2">
              <div className="min-w-[12rem] flex-1">
                <label className="label" htmlFor="semester-name">
                  Nama semester
                </label>
                <input
                  id="semester-name"
                  name="name"
                  placeholder="mis. Ganjil 2027/2028"
                  required
                  className="input"
                />
              </div>
              <button className="btn-primary">
                <IconPlus className="h-4 w-4" />
                Tambah
              </button>
            </form>
            <DeletableList
              items={semesters}
              buildAction={(id) => deleteSemester.bind(null, id)}
              confirmMessage="Hapus semester ini? Hanya bisa dihapus jika belum dipakai transaksi."
              emptyMessage="Belum ada semester."
            />
          </div>
        </div>

        <div className="card overflow-hidden lg:col-span-2">
          <div className="border-b border-rule px-5 py-3.5">
            <h2 className="section-title">Cadangan</h2>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 p-5">
            <p className="max-w-prose text-sm text-ink-soft">
              Unduh satu arsip berisi database dan seluruh kuitansi. Simpan di tempat lain
              secara berkala — ini satu-satunya cara memulihkan data kalau server hilang.
            </p>
            <a href="/api/backup" className="btn-primary shrink-0" download>
              <IconDownload className="h-4 w-4" />
              Unduh cadangan
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

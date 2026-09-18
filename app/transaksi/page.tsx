import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import {
  listTransactions,
  listCategories,
  listSemesters,
  countDeletedTransactions,
  type TxFilter,
} from "@/lib/queries";
import { rupiah } from "@/lib/format";
import PageHeader from "@/components/PageHeader";
import TxList from "@/components/TxList";
import { IconDownload, IconPlus, IconSearch, IconTrash } from "@/components/icons";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAuth();
  const params = await searchParams;

  const filter: TxFilter = {
    type: params.type === "in" || params.type === "out" ? params.type : undefined,
    categoryId: params.category ? Number(params.category) : undefined,
    semesterId: params.semester ? Number(params.semester) : undefined,
    from: params.from || undefined,
    to: params.to || undefined,
    q: params.q || undefined,
  };

  const transactions = listTransactions(filter);
  const categories = listCategories();
  const semesters = listSemesters();

  const shownIn = transactions.reduce(
    (sum, transaction) => sum + (transaction.type === "in" ? transaction.amount : 0),
    0
  );
  const shownOut = transactions.reduce(
    (sum, transaction) => sum + (transaction.type === "out" ? transaction.amount : 0),
    0
  );
  const net = shownIn - shownOut;
  const isFiltered = Object.values(filter).some(Boolean);
  const deletedCount = countDeletedTransactions();

  // Ekspor mengikuti saringan yang sedang aktif.
  const exportQuery = new URLSearchParams(
    Object.entries(params).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string" && entry[1] !== ""
    )
  ).toString();
  const exportHref = `/api/export/transaksi${exportQuery ? `?${exportQuery}` : ""}`;

  return (
    <>
      <PageHeader
        eyebrow="Buku kas"
        title="Transaksi"
        description="Semua dana masuk dan keluar yang tercatat. Klik kategori untuk melihat rincian dan kuitansinya."
        actions={
          <>
            <a href={exportHref} className="btn-secondary" download>
              <IconDownload className="h-4 w-4" />
              Unduh CSV
            </a>
            {deletedCount > 0 && (
              <Link href="/transaksi/terhapus" className="btn-secondary">
                <IconTrash className="h-4 w-4" />
                Kotak sampah
                <span className="num text-ink-faint">{deletedCount}</span>
              </Link>
            )}
            <Link href="/transaksi/baru" className="btn-primary">
              <IconPlus className="h-4 w-4" />
              Tambah transaksi
            </Link>
          </>
        }
      />

      <div className="space-y-5">
        <form method="get" className="card-pad">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
            <div>
              <label className="label" htmlFor="filter-type">
                Jenis
              </label>
              <select
                id="filter-type"
                name="type"
                defaultValue={params.type ?? ""}
                className="input"
              >
                <option value="">Semua</option>
                <option value="in">Dana masuk</option>
                <option value="out">Pengeluaran</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="filter-category">
                Kategori
              </label>
              <select
                id="filter-category"
                name="category"
                defaultValue={params.category ?? ""}
                className="input"
              >
                <option value="">Semua</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.type === "in" ? "masuk" : "keluar"})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="filter-semester">
                Semester
              </label>
              <select
                id="filter-semester"
                name="semester"
                defaultValue={params.semester ?? ""}
                className="input"
              >
                <option value="">Semua</option>
                {semesters.map((semester) => (
                  <option key={semester.id} value={semester.id}>
                    {semester.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="filter-from">
                Dari tanggal
              </label>
              <input
                id="filter-from"
                type="date"
                name="from"
                defaultValue={params.from ?? ""}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="filter-to">
                Sampai tanggal
              </label>
              <input
                id="filter-to"
                type="date"
                name="to"
                defaultValue={params.to ?? ""}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="filter-query">
                Cari catatan
              </label>
              <div className="relative">
                <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                <input
                  id="filter-query"
                  type="text"
                  name="q"
                  defaultValue={params.q ?? ""}
                  placeholder="kata kunci"
                  className="input pl-8"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2 border-t border-rule pt-4">
            <button type="submit" className="btn-primary">
              Terapkan saringan
            </button>
            {isFiltered && (
              <Link href="/transaksi" className="btn-ghost">
                Hapus saringan
              </Link>
            )}
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className="text-ink-soft">
            <span className="num font-medium text-ink">{transactions.length}</span> transaksi
            {isFiltered ? " cocok" : ""}
          </span>
          <span className="text-ink-soft">
            Masuk <span className="num font-medium text-ledger">+{rupiah(shownIn)}</span>
          </span>
          <span className="text-ink-soft">
            Keluar <span className="num font-medium text-oxide">−{rupiah(shownOut)}</span>
          </span>
          <span className="text-ink-soft">
            Selisih{" "}
            <span className={`num font-medium ${net >= 0 ? "text-ledger" : "text-oxide"}`}>
              {net >= 0 ? "+" : "−"}
              {rupiah(Math.abs(net))}
            </span>
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="card-pad text-center">
            <p className="text-sm text-ink-soft">
              {isFiltered
                ? "Tidak ada transaksi yang cocok dengan saringan ini."
                : "Belum ada transaksi tercatat."}
            </p>
            {isFiltered ? (
              <Link href="/transaksi" className="btn-secondary mt-4">
                Hapus saringan
              </Link>
            ) : (
              <Link href="/transaksi/baru?type=out" className="btn-primary mt-4">
                Catat pengeluaran pertama
              </Link>
            )}
          </div>
        ) : (
          <TxList transactions={transactions} />
        )}
      </div>
    </>
  );
}

import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import {
  listTransactions,
  listCategories,
  listSemesters,
  type TxFilter,
} from "@/lib/queries";
import { rupiah } from "@/lib/format";
import TxRow from "@/components/TxRow";

export default async function TransaksiPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAuth();
  const sp = await searchParams;

  const filter: TxFilter = {
    type: sp.type === "in" || sp.type === "out" ? sp.type : undefined,
    categoryId: sp.category ? Number(sp.category) : undefined,
    semesterId: sp.semester ? Number(sp.semester) : undefined,
    from: sp.from || undefined,
    to: sp.to || undefined,
    q: sp.q || undefined,
  };

  const txs = listTransactions(filter);
  const categories = listCategories();
  const semesters = listSemesters();
  const totalShown = txs.reduce(
    (acc, t) => acc + (t.type === "in" ? t.amount : -t.amount),
    0
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Transaksi</h1>
        <Link href="/transaksi/baru" className="btn-primary">
          + Tambah
        </Link>
      </div>

      <form method="get" className="card grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <label className="label">Jenis</label>
          <select name="type" defaultValue={sp.type ?? ""} className="input">
            <option value="">Semua</option>
            <option value="in">Masuk</option>
            <option value="out">Keluar</option>
          </select>
        </div>
        <div>
          <label className="label">Kategori</label>
          <select name="category" defaultValue={sp.category ?? ""} className="input">
            <option value="">Semua</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type === "in" ? "masuk" : "keluar"})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Semester</label>
          <select name="semester" defaultValue={sp.semester ?? ""} className="input">
            <option value="">Semua</option>
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Dari tanggal</label>
          <input type="date" name="from" defaultValue={sp.from ?? ""} className="input" />
        </div>
        <div>
          <label className="label">Sampai tanggal</label>
          <input type="date" name="to" defaultValue={sp.to ?? ""} className="input" />
        </div>
        <div>
          <label className="label">Cari catatan</label>
          <input
            type="text"
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="kata kunci…"
            className="input"
          />
        </div>
        <div className="col-span-2 flex gap-2 sm:col-span-3">
          <button type="submit" className="btn-primary">
            Terapkan
          </button>
          <Link href="/transaksi" className="btn-ghost">
            Reset
          </Link>
        </div>
      </form>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{txs.length} transaksi</span>
        <span>
          Net:{" "}
          <span className={totalShown >= 0 ? "text-emerald-600" : "text-rose-600"}>
            {rupiah(totalShown)}
          </span>
        </span>
      </div>

      {txs.length === 0 ? (
        <div className="card text-center text-sm text-slate-500">
          Tidak ada transaksi yang cocok.
        </div>
      ) : (
        <div className="card divide-y divide-slate-100 p-0">
          {txs.map((t) => (
            <TxRow key={t.id} tx={t} />
          ))}
        </div>
      )}
    </div>
  );
}

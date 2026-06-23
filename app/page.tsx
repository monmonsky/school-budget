import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { getBalance, getSettings, listTransactions } from "@/lib/queries";
import { rupiah } from "@/lib/format";
import TxRow from "@/components/TxRow";

export default async function Dashboard() {
  await requireAuth();
  const s = getSettings();
  const { balance, totalIn, totalOut, count } = getBalance();
  const recent = listTransactions().slice(0, 8);

  return (
    <div className="space-y-6">
      <section className="card bg-gradient-to-br from-indigo-600 to-violet-600 text-white ring-0">
        <p className="text-sm text-indigo-100">Saldo saat ini · {s.fund_name}</p>
        <p className="mt-1 text-4xl font-bold tracking-tight">{rupiah(balance)}</p>
        <p className="mt-2 text-sm text-indigo-100">
          Saldo awal {rupiah(s.initial_balance)}
        </p>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <div className="card">
          <p className="text-xs text-slate-500">Total Masuk</p>
          <p className="mt-1 text-base font-semibold text-emerald-600">{rupiah(totalIn)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500">Total Keluar</p>
          <p className="mt-1 text-base font-semibold text-rose-600">{rupiah(totalOut)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500">Transaksi</p>
          <p className="mt-1 text-base font-semibold">{count}</p>
        </div>
      </section>

      <div className="flex gap-3">
        <Link href="/transaksi/baru?type=out" className="btn-primary flex-1">
          + Catat Pengeluaran
        </Link>
        <Link href="/transaksi/baru?type=in" className="btn-ghost flex-1">
          + Dana Masuk
        </Link>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Transaksi Terbaru</h2>
          <Link href="/transaksi" className="text-sm text-indigo-600 hover:underline">
            Lihat semua
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="card text-center text-sm text-slate-500">
            Belum ada transaksi. Mulai dengan mencatat pengeluaran atau dana masuk.
          </div>
        ) : (
          <div className="card divide-y divide-slate-100 p-0">
            {recent.map((t) => (
              <TxRow key={t.id} tx={t} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

import { requireAuth } from "@/lib/auth";
import { recapBySemester, getBalance } from "@/lib/queries";
import { rupiah } from "@/lib/format";

export default async function RekapPage() {
  await requireAuth();
  const recap = recapBySemester();
  const { totalOut, balance } = getBalance();

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Rekap per Semester</h1>

      <section className="grid grid-cols-2 gap-3">
        <div className="card">
          <p className="text-xs text-slate-500">Total Pengeluaran</p>
          <p className="mt-1 text-lg font-semibold text-rose-600">{rupiah(totalOut)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500">Sisa Saldo</p>
          <p className="mt-1 text-lg font-semibold text-indigo-600">{rupiah(balance)}</p>
        </div>
      </section>

      {recap.every((s) => s.tx_count === 0) ? (
        <div className="card text-center text-sm text-slate-500">
          Belum ada pengeluaran yang tercatat per semester.
        </div>
      ) : (
        <div className="space-y-4">
          {recap.map((s) => (
            <div key={s.id} className="card space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">{s.name}</h2>
                  <p className="text-xs text-slate-500">{s.tx_count} transaksi keluar</p>
                </div>
                <p className="text-lg font-bold text-rose-600">{rupiah(s.total_out)}</p>
              </div>
              {s.categories.length > 0 && (
                <ul className="space-y-1.5 border-t border-slate-100 pt-3">
                  {s.categories.map((c, i) => (
                    <li key={i} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{c.category_name ?? "Tanpa kategori"}</span>
                      <span className="font-medium">{rupiah(c.total)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

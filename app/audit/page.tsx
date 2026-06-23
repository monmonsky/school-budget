import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { listAudit } from "@/lib/queries";
import { tanggalWaktu } from "@/lib/format";

const actionLabel: Record<string, { text: string; cls: string }> = {
  create: { text: "Tambah", cls: "bg-emerald-50 text-emerald-700" },
  update: { text: "Ubah", cls: "bg-amber-50 text-amber-700" },
  delete: { text: "Hapus", cls: "bg-rose-50 text-rose-700" },
};

export default async function AuditPage() {
  await requireAuth();
  const logs = listAudit(200);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Jejak Perubahan</h1>
      <p className="text-sm text-slate-500">
        Riwayat tambah, ubah, dan hapus transaksi. Transaksi yang dihapus tidak ikut
        perhitungan saldo, tetapi tetap tercatat di sini.
      </p>

      {logs.length === 0 ? (
        <div className="card text-center text-sm text-slate-500">Belum ada aktivitas.</div>
      ) : (
        <div className="card divide-y divide-slate-100 p-0">
          {logs.map((l) => {
            const a = actionLabel[l.action] ?? { text: l.action, cls: "bg-slate-100" };
            return (
              <div key={l.id} className="flex items-center gap-3 px-4 py-3">
                <span className={`badge ${a.cls}`}>{a.text}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    {l.transaction_id ? (
                      <Link
                        href={`/transaksi/${l.transaction_id}`}
                        className="text-indigo-600 hover:underline"
                      >
                        Transaksi #{l.transaction_id}
                      </Link>
                    ) : (
                      "Transaksi"
                    )}
                  </p>
                  <p className="truncate text-xs text-slate-400">
                    {tanggalWaktu(l.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

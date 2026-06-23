import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getTransaction, listAttachments } from "@/lib/queries";
import { deleteTransaction, deleteAttachment } from "@/lib/actions";
import { rupiah, tanggal, tanggalWaktu } from "@/lib/format";
import ConfirmSubmit from "@/components/ConfirmSubmit";

export default async function DetailTransaksi({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const txId = Number(id);
  const tx = getTransaction(txId);
  if (!tx || tx.deleted_at) notFound();

  const attachments = listAttachments(txId);
  const isIn = tx.type === "in";

  return (
    <div className="space-y-5">
      <Link href="/transaksi" className="text-sm text-indigo-600 hover:underline">
        ← Kembali
      </Link>

      <div className="card space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <span
              className={`badge ${isIn ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}
            >
              {isIn ? "Dana Masuk" : "Pengeluaran"}
            </span>
            <p
              className={`mt-2 text-3xl font-bold ${isIn ? "text-emerald-600" : "text-rose-600"}`}
            >
              {isIn ? "+" : "−"}
              {rupiah(tx.amount)}
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-slate-400">Tanggal</dt>
            <dd className="font-medium">{tanggal(tx.date)}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Kategori</dt>
            <dd className="font-medium">{tx.category_name ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Semester</dt>
            <dd className="font-medium">{tx.semester_name ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Dicatat</dt>
            <dd className="font-medium">{tanggalWaktu(tx.created_at)}</dd>
          </div>
          {tx.note && (
            <div className="col-span-2">
              <dt className="text-slate-400">Catatan</dt>
              <dd className="font-medium">{tx.note}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold">Kuitansi ({attachments.length})</h2>
        {attachments.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada lampiran.</p>
        ) : (
          <ul className="space-y-2">
            {attachments.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
              >
                <a
                  href={`/api/attachments/${a.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-w-0 items-center gap-2 text-sm text-indigo-600 hover:underline"
                >
                  <span>{a.mime_type === "application/pdf" ? "📄" : "🖼️"}</span>
                  <span className="truncate">{a.file_name}</span>
                </a>
                <ConfirmSubmit
                  action={deleteAttachment.bind(null, a.id, txId)}
                  message="Hapus lampiran ini?"
                  className="text-xs text-rose-500 hover:underline"
                >
                  Hapus
                </ConfirmSubmit>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex gap-2">
        <Link href={`/transaksi/${txId}/edit`} className="btn-ghost flex-1">
          Edit
        </Link>
        <ConfirmSubmit
          action={deleteTransaction.bind(null, txId)}
          message="Hapus transaksi ini? Data tetap tersimpan di jejak audit."
        >
          Hapus
        </ConfirmSubmit>
      </div>
    </div>
  );
}

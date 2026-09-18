import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getTransaction, listAttachments, listDeletedAttachments } from "@/lib/queries";
import { deleteTransaction, deleteAttachment, restoreAttachment } from "@/lib/actions";
import { rupiah, tanggal, tanggalWaktu } from "@/lib/format";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import ReceiptGallery from "@/components/ReceiptGallery";
import { IconChevronLeft, IconFileText, IconImage, IconPencil } from "@/components/icons";

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const transactionId = Number(id);
  const transaction = getTransaction(transactionId);
  if (!transaction || transaction.deleted_at) notFound();

  const attachments = listAttachments(transactionId);
  const deletedAttachments = listDeletedAttachments(transactionId);
  const isIncome = transaction.type === "in";

  // Bind the server action here so the client gallery stays serialisable.
  const receipts = attachments.map((attachment) => ({
    id: attachment.id,
    fileName: attachment.file_name,
    mimeType: attachment.mime_type,
    deleteAction: deleteAttachment.bind(null, attachment.id, transactionId),
  }));

  const details = [
    { label: "Tanggal", value: tanggal(transaction.date), mono: true },
    { label: "Kategori", value: transaction.category_name ?? "—", mono: false },
    { label: "Semester", value: transaction.semester_name ?? "—", mono: false },
    { label: "Dicatat", value: tanggalWaktu(transaction.created_at), mono: true },
  ];

  return (
    <>
      <Link
        href="/transaksi"
        className="mb-5 inline-flex items-center gap-1.5 font-display text-sm font-medium text-ink-faint transition-colors duration-150 hover:text-ink"
      >
        <IconChevronLeft className="h-4 w-4" />
        Kembali ke transaksi
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <div className="space-y-6">
          <section className="card overflow-hidden">
            <div className="border-b border-rule p-5 sm:p-6">
              <span className={isIncome ? "badge-in" : "badge-out"}>
                {isIncome ? "Dana masuk" : "Pengeluaran"}
              </span>
              <p
                className={`num mt-3 text-3xl font-semibold tracking-tight sm:text-4xl ${
                  isIncome ? "text-ledger" : "text-oxide"
                }`}
              >
                {isIncome ? "+" : "−"}
                {rupiah(transaction.amount)}
              </p>
            </div>

            <dl className="grid grid-cols-2">
              {details.map((detail, index) => (
                <div
                  key={detail.label}
                  className={`px-5 py-4 sm:px-6 ${index % 2 === 1 ? "border-l border-rule" : ""} ${
                    index < 2 ? "border-b border-rule" : ""
                  }`}
                >
                  <dt className="eyebrow">{detail.label}</dt>
                  <dd
                    className={`mt-1 text-sm font-medium text-ink ${detail.mono ? "num" : ""}`}
                  >
                    {detail.value}
                  </dd>
                </div>
              ))}
              {transaction.note && (
                <div className="col-span-2 border-t border-rule px-5 py-4 sm:px-6">
                  <dt className="eyebrow">Catatan</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-sm text-ink-soft">
                    {transaction.note}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          <section className="card overflow-hidden">
            <div className="flex items-baseline justify-between border-b border-rule px-5 py-3.5">
              <h2 className="section-title">Kuitansi</h2>
              <span className="num text-sm text-ink-faint">{receipts.length}</span>
            </div>
            <ReceiptGallery receipts={receipts} />

            {deletedAttachments.length > 0 && (
              <details className="border-t border-rule">
                <summary className="cursor-pointer px-5 py-3 font-display text-xs font-medium text-ink-faint transition-colors duration-150 hover:text-ink">
                  {deletedAttachments.length} lampiran terhapus
                </summary>
                <ul className="divide-y divide-rule border-t border-rule">
                  {deletedAttachments.map((attachment) => (
                    <li
                      key={attachment.id}
                      className="flex items-center gap-3 bg-paper-sunk/40 px-5 py-2.5"
                    >
                      {attachment.mime_type === "application/pdf" ? (
                        <IconFileText className="h-4 w-4 shrink-0 text-ink-faint" />
                      ) : (
                        <IconImage className="h-4 w-4 shrink-0 text-ink-faint" />
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm text-ink-faint line-through">
                        {attachment.file_name}
                      </span>
                      <form action={restoreAttachment.bind(null, attachment.id, transactionId)}>
                        <button className="cursor-pointer font-display text-xs font-medium text-brass-ink underline-offset-4 hover:underline">
                          Pulihkan
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
                <p className="px-5 py-3 text-xs text-ink-faint">
                  Berkasnya masih tersimpan. Baru benar-benar dihapus kalau transaksinya
                  dihapus permanen dari kotak sampah.
                </p>
              </details>
            )}
          </section>
        </div>

        <section className="card-pad">
          <h2 className="section-title">Tindakan</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/transaksi/${transactionId}/edit`} className="btn-secondary">
              <IconPencil className="h-4 w-4" />
              Ubah transaksi
            </Link>
            <ConfirmSubmit
              action={deleteTransaction.bind(null, transactionId)}
              message="Hapus transaksi ini? Angkanya berhenti dihitung di saldo, tapi catatannya tetap ada di Jejak."
            >
              Hapus transaksi
            </ConfirmSubmit>
          </div>
          <p className="mt-3 text-xs text-ink-faint">
            Transaksi yang dihapus berhenti dihitung di saldo, tetapi tetap tercatat di
            halaman Jejak.
          </p>
        </section>
      </div>
    </>
  );
}

import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getTransaction, listCategories, listSemesters } from "@/lib/queries";
import { updateTransaction } from "@/lib/actions";
import PageHeader from "@/components/PageHeader";
import TxForm from "@/components/TxForm";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const transactionId = Number(id);
  const transaction = getTransaction(transactionId);
  if (!transaction || transaction.deleted_at) notFound();

  const categories = listCategories();
  const semesters = listSemesters();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow={`Transaksi #${transactionId}`}
        title="Ubah transaksi"
        description="Perubahan tercatat di halaman Jejak."
      />
      <TxForm
        action={updateTransaction.bind(null, transactionId)}
        categories={categories}
        semesters={semesters}
        defaults={{
          type: transaction.type,
          amount: transaction.amount,
          date: transaction.date,
          category_id: transaction.category_id,
          semester_id: transaction.semester_id,
          note: transaction.note,
        }}
        submitLabel="Simpan perubahan"
      />
    </div>
  );
}

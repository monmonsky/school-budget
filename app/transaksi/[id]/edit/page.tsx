import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getTransaction, listCategories, listSemesters } from "@/lib/queries";
import { updateTransaction } from "@/lib/actions";
import TxForm from "@/components/TxForm";

export default async function EditTransaksi({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const txId = Number(id);
  const tx = getTransaction(txId);
  if (!tx || tx.deleted_at) notFound();

  const categories = listCategories();
  const semesters = listSemesters();

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Edit Transaksi</h1>
      <TxForm
        action={updateTransaction.bind(null, txId)}
        categories={categories}
        semesters={semesters}
        defaults={{
          type: tx.type,
          amount: tx.amount,
          date: tx.date,
          category_id: tx.category_id,
          semester_id: tx.semester_id,
          note: tx.note,
        }}
        submitLabel="Simpan Perubahan"
      />
    </div>
  );
}

import { requireAuth } from "@/lib/auth";
import { listCategories, listSemesters } from "@/lib/queries";
import { createTransaction } from "@/lib/actions";
import PageHeader from "@/components/PageHeader";
import TxForm from "@/components/TxForm";

export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  await requireAuth();
  const { type } = await searchParams;
  const categories = listCategories();
  const semesters = listSemesters();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow="Buku kas"
        title="Tambah transaksi"
        description="Catat dana yang masuk atau keluar, lalu lampirkan kuitansinya."
      />
      <TxForm
        action={createTransaction}
        categories={categories}
        semesters={semesters}
        defaults={{ type: type === "in" ? "in" : "out" }}
        submitLabel="Simpan transaksi"
      />
    </div>
  );
}

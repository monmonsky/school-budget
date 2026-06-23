import { requireAuth } from "@/lib/auth";
import { listCategories, listSemesters } from "@/lib/queries";
import { createTransaction } from "@/lib/actions";
import TxForm from "@/components/TxForm";

export default async function TambahTransaksi({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  await requireAuth();
  const { type } = await searchParams;
  const categories = listCategories();
  const semesters = listSemesters();

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Tambah Transaksi</h1>
      <TxForm
        action={createTransaction}
        categories={categories}
        semesters={semesters}
        defaults={{ type: type === "in" ? "in" : "out" }}
        submitLabel="Simpan Transaksi"
      />
    </div>
  );
}

import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { listDeletedTransactions } from "@/lib/queries";
import { purgeTransaction, restoreTransaction } from "@/lib/actions";
import { rupiah, tanggal, tanggalWaktu } from "@/lib/format";
import PageHeader from "@/components/PageHeader";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import { IconChevronLeft } from "@/components/icons";

export default async function TrashPage() {
  await requireAuth();
  const transactions = listDeletedTransactions();

  return (
    <>
      <Link
        href="/transaksi"
        className="mb-5 inline-flex items-center gap-1.5 font-display text-sm font-medium text-ink-faint transition-colors duration-150 hover:text-ink"
      >
        <IconChevronLeft className="h-4 w-4" />
        Kembali ke transaksi
      </Link>

      <PageHeader
        eyebrow="Buku kas"
        title="Kotak sampah"
        description="Transaksi yang sudah dihapus. Angkanya tidak dihitung di saldo, tetapi masih bisa dipulihkan selama belum dihapus permanen."
      />

      {transactions.length === 0 ? (
        <div className="card-pad text-center text-sm text-ink-soft">
          Kotak sampah kosong.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th scope="col" className="w-52">
                    Dihapus
                  </th>
                  <th scope="col" className="w-32">
                    Tanggal
                  </th>
                  <th scope="col">Kategori</th>
                  <th scope="col" className="w-40">
                    Semester
                  </th>
                  <th scope="col" className="w-40 !text-right">
                    Jumlah
                  </th>
                  <th scope="col" className="w-56 !text-right">
                    Tindakan
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => {
                  const isIncome = transaction.type === "in";
                  return (
                    <tr key={transaction.id}>
                      <td className="num whitespace-nowrap text-ink-faint">
                        {transaction.deleted_at ? tanggalWaktu(transaction.deleted_at) : "—"}
                      </td>
                      <td className="num whitespace-nowrap text-ink-soft">
                        {tanggal(transaction.date)}
                      </td>
                      <td className="font-medium text-ink">
                        {transaction.category_name ?? "Tanpa kategori"}
                      </td>
                      <td className="text-ink-soft">{transaction.semester_name ?? "—"}</td>
                      <td
                        className={`num whitespace-nowrap text-right font-medium ${
                          isIncome ? "text-ledger" : "text-oxide"
                        }`}
                      >
                        {isIncome ? "+" : "−"}
                        {rupiah(transaction.amount)}
                      </td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <form action={restoreTransaction.bind(null, transaction.id)}>
                            <button className="btn-secondary px-2.5 py-1.5 text-xs">
                              Pulihkan
                            </button>
                          </form>
                          <ConfirmSubmit
                            action={purgeTransaction.bind(null, transaction.id)}
                            message="Hapus permanen? Transaksi dan seluruh kuitansinya akan hilang dan tidak bisa dikembalikan."
                            className="btn-danger px-2.5 py-1.5 text-xs"
                          >
                            Hapus permanen
                          </ConfirmSubmit>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

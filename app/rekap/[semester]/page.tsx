import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getSemester, listTransactions, recapBySemester } from "@/lib/queries";
import { rupiah } from "@/lib/format";
import PageHeader from "@/components/PageHeader";
import TxList from "@/components/TxList";
import { IconChevronLeft } from "@/components/icons";

export default async function SemesterDetailPage({
  params,
}: {
  params: Promise<{ semester: string }>;
}) {
  await requireAuth();
  const { semester: semesterParam } = await params;
  const semesterId = Number(semesterParam);
  const semester = Number.isFinite(semesterId) ? getSemester(semesterId) : undefined;
  if (!semester) notFound();

  const transactions = listTransactions({ semesterId });
  const recap = recapBySemester().find((entry) => entry.id === semesterId);
  const categories = recap?.categories ?? [];

  const totalOut = transactions
    .filter((transaction) => transaction.type === "out")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalIn = transactions
    .filter((transaction) => transaction.type === "in")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const maxCategory = Math.max(1, ...categories.map((category) => category.total));

  const stats = [
    { label: "Pengeluaran", value: `−${rupiah(totalOut)}`, tone: "text-oxide" },
    { label: "Dana masuk", value: `+${rupiah(totalIn)}`, tone: "text-ledger" },
    { label: "Transaksi", value: String(transactions.length), tone: "text-ink" },
  ];

  return (
    <>
      <Link
        href="/rekap"
        className="mb-5 inline-flex items-center gap-1.5 font-display text-sm font-medium text-ink-faint transition-colors duration-150 hover:text-ink"
      >
        <IconChevronLeft className="h-4 w-4" />
        Kembali ke rekap
      </Link>

      <PageHeader
        eyebrow="Rekap semester"
        title={semester.name}
        description="Seluruh transaksi dan rincian kategori untuk semester ini."
      />

      <div className="space-y-6">
        <dl className="card grid grid-cols-1 divide-y divide-rule sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {stats.map((stat) => (
            <div key={stat.label} className="px-5 py-4">
              <dt className="eyebrow">{stat.label}</dt>
              <dd className={`num mt-1.5 text-lg font-semibold ${stat.tone}`}>{stat.value}</dd>
            </div>
          ))}
        </dl>

        {categories.length > 0 && (
          <section className="card overflow-hidden">
            <div className="border-b border-rule px-5 py-3.5">
              <h2 className="section-title">Pengeluaran per kategori</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th scope="col">Kategori</th>
                    <th scope="col" className="w-44 !text-right">
                      Total
                    </th>
                    <th scope="col" className="w-[34%]">
                      Porsi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category, index) => (
                    <tr key={index}>
                      <td className="font-medium text-ink">
                        {category.category_name ?? "Tanpa kategori"}
                      </td>
                      <td className="num text-right font-medium text-oxide">
                        {rupiah(category.total)}
                      </td>
                      <td>
                        <div className="h-2 w-full overflow-hidden rounded-[2px] bg-paper-sunk">
                          <div
                            className="h-full bg-brass"
                            style={{ width: `${(category.total / maxCategory) * 100}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section>
          <h2 className="section-title mb-3">Transaksi semester ini</h2>
          {transactions.length === 0 ? (
            <div className="card-pad text-center text-sm text-ink-soft">
              Belum ada transaksi untuk semester ini.
            </div>
          ) : (
            <TxList transactions={transactions} />
          )}
        </section>
      </div>
    </>
  );
}

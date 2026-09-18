import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { recapBySemester, getBalance, getFundMeter } from "@/lib/queries";
import { rupiah } from "@/lib/format";
import PageHeader from "@/components/PageHeader";
import { IconDownload } from "@/components/icons";

export default async function RecapPage() {
  await requireAuth();
  const recap = recapBySemester();
  const { totalOut, balance } = getBalance();
  const { avgPerSemester } = getFundMeter();

  const activeSemesters = recap.filter((semester) => semester.tx_count > 0);
  const maxOut = Math.max(1, ...recap.map((semester) => semester.total_out));

  const stats = [
    { label: "Total pengeluaran", value: rupiah(totalOut), tone: "text-oxide" },
    { label: "Sisa dana", value: rupiah(balance), tone: "text-ink" },
    { label: "Rata-rata per semester", value: rupiah(avgPerSemester), tone: "text-ink" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Buku kas"
        title="Rekap per semester"
        description="Ringkasan pengeluaran yang dikelompokkan per semester dan per kategori."
        actions={
          <a href="/api/export/transaksi" className="btn-secondary" download>
            <IconDownload className="h-4 w-4" />
            Unduh CSV
          </a>
        }
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

        {activeSemesters.length === 0 ? (
          <div className="card-pad text-center text-sm text-ink-soft">
            Belum ada pengeluaran yang tercatat per semester.
          </div>
        ) : (
          <>
            <section className="card overflow-hidden">
              <div className="border-b border-rule px-5 py-3.5">
                <h2 className="section-title">Pengeluaran per semester</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th scope="col">Semester</th>
                      <th scope="col" className="w-28 !text-right">
                        Transaksi
                      </th>
                      <th scope="col" className="w-44 !text-right">
                        Total
                      </th>
                      <th scope="col" className="w-[34%]">
                        Porsi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recap.map((semester) => (
                      <tr key={semester.id}>
                        <td>
                          <Link
                            href={`/rekap/${semester.id}`}
                            className="font-medium text-ink decoration-rule-strong underline-offset-4 hover:underline"
                          >
                            {semester.name}
                          </Link>
                        </td>
                        <td className="num text-right text-ink-soft">{semester.tx_count}</td>
                        <td className="num text-right font-medium text-oxide">
                          {semester.total_out > 0 ? rupiah(semester.total_out) : "—"}
                        </td>
                        <td>
                          <div className="h-2 w-full overflow-hidden rounded-[2px] bg-paper-sunk">
                            <div
                              className="h-full bg-brass"
                              style={{ width: `${(semester.total_out / maxOut) * 100}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="section-title mb-3">Rincian per kategori</h2>
              <div className="grid gap-5 lg:grid-cols-2">
                {activeSemesters.map((semester) => (
                  <div key={semester.id} className="card overflow-hidden">
                    <div className="flex items-baseline justify-between gap-4 border-b border-rule px-5 py-3.5">
                      <div className="min-w-0">
                        <h3 className="font-display text-sm font-semibold text-ink">
                          {semester.name}
                        </h3>
                        <p className="num mt-0.5 text-xs text-ink-faint">
                          {semester.tx_count} transaksi keluar
                        </p>
                      </div>
                      <p className="num shrink-0 text-base font-semibold text-oxide">
                        {rupiah(semester.total_out)}
                      </p>
                    </div>
                    {semester.categories.length === 0 ? (
                      <p className="px-5 py-4 text-sm text-ink-faint">Belum ada rincian.</p>
                    ) : (
                      <ul className="divide-y divide-rule">
                        {semester.categories.map((category, index) => (
                          <li
                            key={index}
                            className="flex items-baseline justify-between gap-4 px-5 py-2.5 text-sm"
                          >
                            <span className="truncate text-ink-soft">
                              {category.category_name ?? "Tanpa kategori"}
                            </span>
                            <span className="num shrink-0 font-medium text-ink">
                              {rupiah(category.total)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}

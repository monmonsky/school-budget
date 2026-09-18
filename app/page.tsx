import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { getBalance, getFundMeter, getSettings, listTransactions } from "@/lib/queries";
import { rupiah } from "@/lib/format";
import PageHeader from "@/components/PageHeader";
import FundMeter from "@/components/FundMeter";
import TxList from "@/components/TxList";
import { IconArrowDownLeft, IconArrowUpRight } from "@/components/icons";

const RECENT_LIMIT = 8;

export default async function DashboardPage() {
  await requireAuth();
  const settings = getSettings();
  const { totalIn, totalOut, count } = getBalance();
  const meter = getFundMeter();
  const recent = listTransactions().slice(0, RECENT_LIMIT);

  const stats = [
    { label: "Saldo awal", value: rupiah(settings.initial_balance), tone: "text-ink" },
    { label: "Dana masuk", value: `+${rupiah(totalIn)}`, tone: "text-ledger" },
    { label: "Dana keluar", value: `−${rupiah(totalOut)}`, tone: "text-oxide" },
    { label: "Transaksi", value: String(count), tone: "text-ink" },
  ];

  return (
    <>
      <PageHeader
        eyebrow={settings.fund_name}
        title="Beranda"
        actions={
          <>
            <Link href="/transaksi/baru?type=out" className="btn-primary">
              <IconArrowUpRight className="h-4 w-4" />
              Catat pengeluaran
            </Link>
            <Link href="/transaksi/baru?type=in" className="btn-secondary">
              <IconArrowDownLeft className="h-4 w-4" />
              Catat dana masuk
            </Link>
          </>
        }
      />

      <div className="space-y-6">
        <FundMeter data={meter} />

        {/* Headline figures, read across like a balance sheet. */}
        <dl className="card grid grid-cols-2 sm:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`px-5 py-4 ${index < 2 ? "border-b border-rule sm:border-b-0" : ""} ${
                index % 2 === 1 ? "border-l border-rule sm:border-l-0" : ""
              } ${index > 0 ? "sm:border-l sm:border-rule" : ""}`}
            >
              <dt className="eyebrow">{stat.label}</dt>
              <dd className={`num mt-1.5 text-lg font-semibold ${stat.tone}`}>{stat.value}</dd>
            </div>
          ))}
        </dl>

        <section>
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2 className="section-title">Transaksi terbaru</h2>
            <Link
              href="/transaksi"
              className="font-display text-sm font-medium text-brass-ink underline-offset-4 hover:underline"
            >
              Lihat semua
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="card-pad text-center">
              <p className="text-sm text-ink-soft">Belum ada transaksi tercatat.</p>
              <Link href="/transaksi/baru?type=out" className="btn-primary mt-4">
                Catat pengeluaran pertama
              </Link>
            </div>
          ) : (
            <TxList transactions={recent} />
          )}
        </section>
      </div>
    </>
  );
}

import Link from "next/link";
import type { Transaction } from "@/lib/queries";
import { rupiah, tanggal } from "@/lib/format";
import {
  IconArrowDownLeft,
  IconArrowUpRight,
  IconPaperclip,
} from "@/components/icons";

/**
 * Transactions in two shapes: a ledger table on wide screens, compact cards on
 * small ones.
 */
export default function TxList({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="card overflow-hidden">
      <div className="hidden md:block">
        <table className="ledger-table">
          <thead>
            <tr>
              <th scope="col" className="w-[8.5rem]">
                Tanggal
              </th>
              <th scope="col">Kategori</th>
              <th scope="col" className="w-44">
                Semester
              </th>
              <th scope="col">Catatan</th>
              <th scope="col" className="w-16 text-center">
                Bukti
              </th>
              <th scope="col" className="w-44 !text-right">
                Jumlah
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => {
              const isIncome = transaction.type === "in";
              return (
                <tr key={transaction.id}>
                  <td className="num whitespace-nowrap text-ink-soft">
                    {tanggal(transaction.date)}
                  </td>
                  <td>
                    <Link
                      href={`/transaksi/${transaction.id}`}
                      className="inline-flex items-center gap-2 font-medium text-ink decoration-rule-strong underline-offset-4 hover:underline"
                    >
                      <span
                        aria-hidden="true"
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-[3px] ${
                          isIncome ? "bg-ledger-soft text-ledger" : "bg-oxide-soft text-oxide"
                        }`}
                      >
                        {isIncome ? (
                          <IconArrowDownLeft className="h-3.5 w-3.5" />
                        ) : (
                          <IconArrowUpRight className="h-3.5 w-3.5" />
                        )}
                      </span>
                      <span className="truncate">
                        {transaction.category_name ?? "Tanpa kategori"}
                      </span>
                      <span className="sr-only">
                        · {isIncome ? "dana masuk" : "pengeluaran"}
                      </span>
                    </Link>
                  </td>
                  <td className="text-ink-soft">{transaction.semester_name ?? "—"}</td>
                  <td className="max-w-[16rem] truncate text-ink-faint">
                    {transaction.note || "—"}
                  </td>
                  <td className="text-center">
                    {transaction.attachment_count ? (
                      <span
                        className="inline-flex items-center gap-1 text-ink-faint"
                        title={`${transaction.attachment_count} lampiran`}
                      >
                        <IconPaperclip className="h-3.5 w-3.5" />
                        <span className="num text-xs">{transaction.attachment_count}</span>
                      </span>
                    ) : (
                      <span className="text-ink-faint/50">—</span>
                    )}
                  </td>
                  <td
                    className={`num whitespace-nowrap text-right font-medium ${
                      isIncome ? "text-ledger" : "text-oxide"
                    }`}
                  >
                    {isIncome ? "+" : "−"}
                    {rupiah(transaction.amount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="divide-y divide-rule md:hidden">
        {transactions.map((transaction) => {
          const isIncome = transaction.type === "in";
          return (
            <li key={transaction.id}>
              <Link
                href={`/transaksi/${transaction.id}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-paper-sunk/50"
              >
                <span
                  aria-hidden="true"
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-[3px] ${
                    isIncome ? "bg-ledger-soft text-ledger" : "bg-oxide-soft text-oxide"
                  }`}
                >
                  {isIncome ? (
                    <IconArrowDownLeft className="h-4 w-4" />
                  ) : (
                    <IconArrowUpRight className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">
                    {transaction.category_name ?? "Tanpa kategori"}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-ink-faint">
                    <span className="num">{tanggal(transaction.date)}</span>
                    {transaction.semester_name ? <span>· {transaction.semester_name}</span> : null}
                    {transaction.attachment_count ? (
                      <>
                        <IconPaperclip className="h-3 w-3 shrink-0" />
                        <span className="num">{transaction.attachment_count}</span>
                      </>
                    ) : null}
                  </p>
                </div>
                <span
                  className={`num shrink-0 text-sm font-medium ${
                    isIncome ? "text-ledger" : "text-oxide"
                  }`}
                >
                  {isIncome ? "+" : "−"}
                  {rupiah(transaction.amount)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

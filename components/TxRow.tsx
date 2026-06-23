import Link from "next/link";
import type { Transaction } from "@/lib/queries";
import { rupiah, tanggal } from "@/lib/format";

export default function TxRow({ tx }: { tx: Transaction }) {
  const isIn = tx.type === "in";
  return (
    <Link
      href={`/transaksi/${tx.id}`}
      className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50"
    >
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold ${
          isIn ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
        }`}
      >
        {isIn ? "↓" : "↑"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {tx.category_name ?? "Tanpa kategori"}
        </p>
        <p className="truncate text-xs text-slate-500">
          {tanggal(tx.date)}
          {tx.semester_name ? ` · ${tx.semester_name}` : ""}
          {tx.note ? ` · ${tx.note}` : ""}
          {tx.attachment_count ? ` · 📎${tx.attachment_count}` : ""}
        </p>
      </div>
      <span
        className={`shrink-0 text-sm font-semibold ${
          isIn ? "text-emerald-600" : "text-rose-600"
        }`}
      >
        {isIn ? "+" : "−"}
        {rupiah(tx.amount)}
      </span>
    </Link>
  );
}

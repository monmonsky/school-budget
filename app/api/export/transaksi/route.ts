import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { listTransactions, type TxFilter } from "@/lib/queries";

const COLUMNS = [
  "ID",
  "Tanggal",
  "Jenis",
  "Kategori",
  "Semester",
  "Jumlah",
  "Catatan",
  "Lampiran",
  "Dicatat",
];

function csvCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  // Kutip semua sel: aman untuk koma, tanda kutip, dan baris baru di catatan.
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  if (!(await isAuthed())) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Terima saringan yang sama dengan halaman Transaksi, supaya tombol unduh
  // mengekspor persis apa yang sedang dilihat.
  const params = new URL(request.url).searchParams;
  const type = params.get("type");
  const filter: TxFilter = {
    type: type === "in" || type === "out" ? type : undefined,
    categoryId: params.get("category") ? Number(params.get("category")) : undefined,
    semesterId: params.get("semester") ? Number(params.get("semester")) : undefined,
    from: params.get("from") || undefined,
    to: params.get("to") || undefined,
    q: params.get("q") || undefined,
  };

  const transactions = listTransactions(filter);

  const rows = transactions.map((transaction) =>
    [
      transaction.id,
      transaction.date,
      transaction.type === "in" ? "Masuk" : "Keluar",
      transaction.category_name ?? "",
      transaction.semester_name ?? "",
      // Bertanda supaya kolom ini bisa langsung dijumlahkan di spreadsheet.
      transaction.type === "in" ? transaction.amount : -transaction.amount,
      transaction.note ?? "",
      transaction.attachment_count ?? 0,
      transaction.created_at,
    ]
      .map(csvCell)
      .join(",")
  );

  const csv = [COLUMNS.map(csvCell).join(","), ...rows].join("\r\n");
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(
    // BOM supaya Excel membaca huruf beraksen dengan benar.
    "﻿" + csv,
    {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="transaksi-${stamp}.csv"`,
        "Cache-Control": "private, no-store",
      },
    }
  );
}

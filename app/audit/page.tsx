import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { countAudit, listAudit } from "@/lib/queries";
import { tanggalWaktu } from "@/lib/format";
import PageHeader from "@/components/PageHeader";

const ACTION_LABELS: Record<string, { text: string; className: string }> = {
  create: { text: "Tambah", className: "bg-ledger-soft text-ledger" },
  update: { text: "Ubah", className: "bg-brass-soft text-brass-ink" },
  delete: { text: "Hapus", className: "bg-oxide-soft text-oxide" },
};

const AUDIT_LIMIT = 200;

export default async function AuditLogPage() {
  await requireAuth();
  const entries = listAudit(AUDIT_LIMIT);
  const totalEntries = countAudit();
  const isTruncated = totalEntries > entries.length;

  return (
    <>
      <PageHeader
        eyebrow="Buku kas"
        title="Jejak perubahan"
        description="Riwayat tambah, ubah, dan hapus transaksi. Transaksi yang dihapus berhenti dihitung di saldo, tetapi catatannya tetap ada di sini."
      />

      {entries.length === 0 ? (
        <div className="card-pad text-center text-sm text-ink-soft">
          Belum ada aktivitas tercatat.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th scope="col" className="w-52">
                    Waktu
                  </th>
                  <th scope="col" className="w-28">
                    Aksi
                  </th>
                  <th scope="col">Transaksi</th>
                  <th scope="col">Kategori</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const label = ACTION_LABELS[entry.action] ?? {
                    text: entry.action,
                    className: "bg-paper-sunk text-ink-soft",
                  };
                  return (
                    <tr key={entry.id}>
                      <td className="num whitespace-nowrap text-ink-soft">
                        {tanggalWaktu(entry.created_at)}
                      </td>
                      <td>
                        <span className={`badge ${label.className}`}>{label.text}</span>
                      </td>
                      <td>
                        {entry.transaction_id ? (
                          <Link
                            href={`/transaksi/${entry.transaction_id}`}
                            className="num font-medium text-ink decoration-rule-strong underline-offset-4 hover:underline"
                          >
                            #{entry.transaction_id}
                          </Link>
                        ) : (
                          <span className="text-ink-faint">—</span>
                        )}
                      </td>
                      <td className="text-ink-faint">{entry.category_name ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {isTruncated && (
            <p className="border-t border-rule bg-paper-sunk/60 px-4 py-3 text-xs text-ink-faint">
              Menampilkan <span className="num">{entries.length}</span> aktivitas terbaru dari
              total <span className="num">{totalEntries}</span>.
            </p>
          )}
        </div>
      )}
    </>
  );
}

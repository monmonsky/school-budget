import { getDb } from "./db";

export type Transaction = {
  id: number;
  type: "in" | "out";
  amount: number;
  date: string;
  category_id: number | null;
  semester_id: number | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  category_name?: string | null;
  semester_name?: string | null;
  attachment_count?: number;
};

export type Settings = {
  id: number;
  initial_balance: number;
  fund_name: string;
  password_hash: string;
};

export function getSettings(): Settings {
  return getDb().prepare("SELECT * FROM settings WHERE id = 1").get() as Settings;
}

// Saldo = saldo awal + Σ masuk − Σ keluar (abaikan yang soft-deleted)
export function getBalance(): {
  balance: number;
  totalIn: number;
  totalOut: number;
  count: number;
  initial: number;
} {
  const db = getDb();
  const s = getSettings();
  const row = db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN type='in'  THEN amount END), 0) AS totalIn,
         COALESCE(SUM(CASE WHEN type='out' THEN amount END), 0) AS totalOut,
         COUNT(*) AS count
       FROM transactions WHERE deleted_at IS NULL`
    )
    .get() as { totalIn: number; totalOut: number; count: number };

  return {
    initial: s.initial_balance,
    totalIn: row.totalIn,
    totalOut: row.totalOut,
    count: row.count,
    balance: s.initial_balance + row.totalIn - row.totalOut,
  };
}

export type TxFilter = {
  type?: "in" | "out";
  categoryId?: number;
  semesterId?: number;
  from?: string;
  to?: string;
  q?: string;
};

export function listTransactions(filter: TxFilter = {}): Transaction[] {
  const where: string[] = ["t.deleted_at IS NULL"];
  const params: (string | number)[] = [];

  if (filter.type) {
    where.push("t.type = ?");
    params.push(filter.type);
  }
  if (filter.categoryId) {
    where.push("t.category_id = ?");
    params.push(filter.categoryId);
  }
  if (filter.semesterId) {
    where.push("t.semester_id = ?");
    params.push(filter.semesterId);
  }
  if (filter.from) {
    where.push("t.date >= ?");
    params.push(filter.from);
  }
  if (filter.to) {
    where.push("t.date <= ?");
    params.push(filter.to);
  }
  if (filter.q) {
    where.push("t.note LIKE ?");
    params.push(`%${filter.q}%`);
  }

  return getDb()
    .prepare(
      `SELECT t.*, c.name AS category_name, s.name AS semester_name,
              (SELECT COUNT(*) FROM attachments a
                WHERE a.transaction_id = t.id AND a.deleted_at IS NULL) AS attachment_count
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       LEFT JOIN semesters s ON s.id = t.semester_id
       WHERE ${where.join(" AND ")}
       ORDER BY t.date DESC, t.id DESC`
    )
    .all(...params) as Transaction[];
}

export function getTransaction(id: number): Transaction | undefined {
  return getDb()
    .prepare(
      `SELECT t.*, c.name AS category_name, s.name AS semester_name
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       LEFT JOIN semesters s ON s.id = t.semester_id
       WHERE t.id = ?`
    )
    .get(id) as Transaction | undefined;
}

export function logAudit(
  transactionId: number | null,
  action: "create" | "update" | "delete",
  changes: unknown
) {
  getDb()
    .prepare(
      "INSERT INTO audit_log (transaction_id, action, changes, created_at) VALUES (?, ?, ?, ?)"
    )
    .run(transactionId, action, changes ? JSON.stringify(changes) : null, new Date().toISOString());
}

export function listCategories(type?: "in" | "out") {
  if (type) {
    return getDb()
      .prepare("SELECT * FROM categories WHERE type = ? ORDER BY name")
      .all(type) as { id: number; name: string; type: "in" | "out" }[];
  }
  return getDb()
    .prepare("SELECT * FROM categories ORDER BY type, name")
    .all() as { id: number; name: string; type: "in" | "out" }[];
}

export function listSemesters() {
  return getDb()
    .prepare("SELECT * FROM semesters ORDER BY id DESC")
    .all() as { id: number; name: string }[];
}

export type Attachment = {
  id: number;
  transaction_id: number;
  file_path: string;
  file_name: string;
  mime_type: string;
  /** Small preview generated at upload time; null for files uploaded earlier. */
  thumb_path: string | null;
  deleted_at: string | null;
};

export function listAttachments(transactionId: number): Attachment[] {
  return getDb()
    .prepare(
      "SELECT * FROM attachments WHERE transaction_id = ? AND deleted_at IS NULL ORDER BY id"
    )
    .all(transactionId) as Attachment[];
}

export function listDeletedAttachments(transactionId: number): Attachment[] {
  return getDb()
    .prepare(
      "SELECT * FROM attachments WHERE transaction_id = ? AND deleted_at IS NOT NULL ORDER BY id"
    )
    .all(transactionId) as Attachment[];
}

export function getAttachment(id: number): Attachment | undefined {
  return getDb()
    .prepare("SELECT * FROM attachments WHERE id = ?")
    .get(id) as Attachment | undefined;
}

// Transaksi yang di-soft-delete, untuk kotak sampah.
export function listDeletedTransactions(): Transaction[] {
  return getDb()
    .prepare(
      `SELECT t.*, c.name AS category_name, s.name AS semester_name,
              (SELECT COUNT(*) FROM attachments a
                WHERE a.transaction_id = t.id AND a.deleted_at IS NULL) AS attachment_count
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       LEFT JOIN semesters s ON s.id = t.semester_id
       WHERE t.deleted_at IS NOT NULL
       ORDER BY t.deleted_at DESC`
    )
    .all() as Transaction[];
}

export function countDeletedTransactions(): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS c FROM transactions WHERE deleted_at IS NOT NULL")
    .get() as { c: number };
  return row.c;
}

export function getSemester(id: number): { id: number; name: string } | undefined {
  return getDb()
    .prepare("SELECT * FROM semesters WHERE id = ?")
    .get(id) as { id: number; name: string } | undefined;
}

// Rekap per semester (hanya pengeluaran)
export function recapBySemester() {
  const db = getDb();
  const semesters = db
    .prepare(
      `SELECT s.id, s.name,
              COALESCE(SUM(t.amount), 0) AS total_out,
              COUNT(t.id) AS tx_count
       FROM semesters s
       LEFT JOIN transactions t
         ON t.semester_id = s.id AND t.type = 'out' AND t.deleted_at IS NULL
       GROUP BY s.id, s.name
       ORDER BY s.id DESC`
    )
    .all() as { id: number; name: string; total_out: number; tx_count: number }[];

  const breakdown = db
    .prepare(
      `SELECT t.semester_id, c.name AS category_name, SUM(t.amount) AS total
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.type = 'out' AND t.deleted_at IS NULL AND t.semester_id IS NOT NULL
       GROUP BY t.semester_id, c.name
       ORDER BY total DESC`
    )
    .all() as { semester_id: number; category_name: string | null; total: number }[];

  return semesters.map((s) => ({
    ...s,
    categories: breakdown.filter((b) => b.semester_id === s.id),
  }));
}

export type FundMeter = {
  /** Every rupiah the fund ever held: initial balance plus all income. */
  capacity: number;
  /** Total spent so far. */
  spent: number;
  /** What is left: capacity − spent. */
  remaining: number;
  /** Consumed share of the fund, 0–1. */
  spentRatio: number;
  /** Spending per semester, oldest first. */
  segments: { id: number | null; name: string; total: number }[];
  /** Mean spend across semesters that actually have transactions. */
  avgPerSemester: number;
  /** Rough number of semesters the fund still covers; null without data. */
  semestersLeft: number | null;
};

// How much of the fund has been consumed, broken down by semester.
export function getFundMeter(): FundMeter {
  const db = getDb();
  const { initial, totalIn, totalOut, balance } = getBalance();
  const capacity = initial + totalIn;

  const rows = db
    .prepare(
      `SELECT s.id, s.name, COALESCE(SUM(t.amount), 0) AS total
       FROM semesters s
       JOIN transactions t
         ON t.semester_id = s.id AND t.type = 'out' AND t.deleted_at IS NULL
       GROUP BY s.id, s.name
       HAVING total > 0
       ORDER BY s.id ASC`
    )
    .all() as { id: number; name: string; total: number }[];

  // Expenses without a semester should not exist, but must never vanish from the meter.
  const orphan = db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM transactions
       WHERE type = 'out' AND deleted_at IS NULL AND semester_id IS NULL`
    )
    .get() as { total: number };

  const segments: FundMeter["segments"] = [...rows];
  if (orphan.total > 0) {
    segments.push({ id: null, name: "Tanpa semester", total: orphan.total });
  }

  const avgPerSemester = rows.length > 0 ? totalOut / rows.length : 0;

  return {
    capacity,
    spent: totalOut,
    remaining: balance,
    spentRatio: capacity > 0 ? Math.min(1, totalOut / capacity) : 0,
    segments,
    avgPerSemester,
    semestersLeft:
      avgPerSemester > 0 ? Math.max(0, balance / avgPerSemester) : null,
  };
}

export function listAudit(limit = 100) {
  return getDb()
    .prepare(
      `SELECT a.*, c.name AS category_name
       FROM audit_log a
       LEFT JOIN transactions t ON t.id = a.transaction_id
       LEFT JOIN categories c ON c.id = t.category_id
       ORDER BY a.id DESC LIMIT ?`
    )
    .all(limit) as {
    id: number;
    transaction_id: number | null;
    action: string;
    changes: string | null;
    created_at: string;
    category_name: string | null;
  }[];
}

export function countAudit(): number {
  const row = getDb().prepare("SELECT COUNT(*) AS c FROM audit_log").get() as { c: number };
  return row.c;
}

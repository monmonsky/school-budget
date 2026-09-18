"use server";

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "./db";
import { getSettings, getTransaction, logAudit, listAttachments } from "./queries";
import { createSession, destroySession, requireAuth } from "./auth";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

function parseAmount(raw: FormDataEntryValue | null): number {
  const digits = String(raw ?? "").replace(/[^\d]/g, "");
  return parseInt(digits || "0", 10);
}

function uploadRoot(): string {
  return path.resolve(process.cwd(), UPLOAD_DIR);
}

/**
 * Simpan lampiran beserta pratinjaunya.
 *
 * Berkas asli disimpan apa adanya karena ia bukti pembayaran. Pratinjau kecil
 * dibuat di browser (lihat TxForm) dan dikirim sebagai field `thumb_<index>`,
 * supaya galeri tidak perlu memuat foto 4 MB hanya untuk menampilkan ubin.
 */
async function saveFiles(transactionId: number, formData: FormData) {
  const files = formData.getAll("attachments").filter((f): f is File => f instanceof File);
  const root = uploadRoot();
  fs.mkdirSync(root, { recursive: true });
  const db = getDb();
  const ins = db.prepare(
    "INSERT INTO attachments (transaction_id, file_path, file_name, mime_type, thumb_path) VALUES (?, ?, ?, ?, ?)"
  );

  for (const [index, file] of files.entries()) {
    if (!file || file.size === 0) continue;
    if (file.size > MAX_SIZE) throw new Error(`File ${file.name} melebihi 10 MB`);
    if (!ALLOWED.includes(file.type)) throw new Error(`Tipe file ${file.name} tidak didukung`);

    const stem = `${transactionId}_${crypto.randomBytes(6).toString("hex")}`;
    const safe = `${stem}${path.extname(file.name) || ""}`;
    fs.writeFileSync(path.join(root, safe), Buffer.from(await file.arrayBuffer()));

    // Pratinjau opsional: kalau browser gagal membuatnya, galeri jatuh ke berkas asli.
    let thumbName: string | null = null;
    const thumb = formData.get(`thumb_${index}`);
    if (thumb instanceof File && thumb.size > 0 && thumb.size <= MAX_SIZE) {
      thumbName = `${stem}_thumb.jpg`;
      fs.writeFileSync(path.join(root, thumbName), Buffer.from(await thumb.arrayBuffer()));
    }

    ins.run(transactionId, safe, file.name, file.type, thumbName);
  }
}

// ---- AUTH ----
export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const s = getSettings();
  if (bcrypt.compareSync(password, s.password_hash)) {
    await createSession();
    redirect("/");
  }
  redirect("/login?error=1");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

// ---- TRANSAKSI ----
export async function createTransaction(formData: FormData) {
  await requireAuth();

  const type = String(formData.get("type") ?? "");
  const amount = parseAmount(formData.get("amount"));
  const date = String(formData.get("date") ?? "");
  const categoryId = formData.get("category_id") ? Number(formData.get("category_id")) : null;
  const semesterId = formData.get("semester_id") ? Number(formData.get("semester_id")) : null;
  const note = String(formData.get("note") ?? "").trim() || null;

  if (type !== "in" && type !== "out") throw new Error("Jenis transaksi tidak valid");
  if (amount <= 0) throw new Error("Jumlah harus lebih dari 0");
  if (!date) throw new Error("Tanggal wajib diisi");
  if (!categoryId) throw new Error("Kategori wajib dipilih");
  if (type === "out" && !semesterId)
    throw new Error("Semester wajib dipilih untuk transaksi keluar");

  const now = new Date().toISOString();
  const db = getDb();
  const info = db
    .prepare(
      `INSERT INTO transactions (type, amount, date, category_id, semester_id, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(type, amount, date, categoryId, semesterId, note, now, now);

  const id = Number(info.lastInsertRowid);

  await saveFiles(id, formData);

  logAudit(id, "create", { type, amount, date, categoryId, semesterId, note });
  revalidatePath("/");
  revalidatePath("/transaksi");
  revalidatePath("/rekap");
  redirect(`/transaksi/${id}`);
}

export async function updateTransaction(id: number, formData: FormData) {
  await requireAuth();
  const before = getTransaction(id);
  if (!before || before.deleted_at) throw new Error("Transaksi tidak ditemukan");

  const type = String(formData.get("type") ?? "");
  const amount = parseAmount(formData.get("amount"));
  const date = String(formData.get("date") ?? "");
  const categoryId = formData.get("category_id") ? Number(formData.get("category_id")) : null;
  const semesterId = formData.get("semester_id") ? Number(formData.get("semester_id")) : null;
  const note = String(formData.get("note") ?? "").trim() || null;

  if (type !== "in" && type !== "out") throw new Error("Jenis transaksi tidak valid");
  if (amount <= 0) throw new Error("Jumlah harus lebih dari 0");
  if (!date) throw new Error("Tanggal wajib diisi");
  if (!categoryId) throw new Error("Kategori wajib dipilih");
  if (type === "out" && !semesterId)
    throw new Error("Semester wajib dipilih untuk transaksi keluar");

  const now = new Date().toISOString();
  getDb()
    .prepare(
      `UPDATE transactions
       SET type=?, amount=?, date=?, category_id=?, semester_id=?, note=?, updated_at=?
       WHERE id=?`
    )
    .run(type, amount, date, categoryId, semesterId, note, now, id);

  await saveFiles(id, formData);

  logAudit(id, "update", {
    before: { type: before.type, amount: before.amount, date: before.date },
    after: { type, amount, date, categoryId, semesterId, note },
  });
  revalidatePath("/");
  revalidatePath("/transaksi");
  revalidatePath("/rekap");
  redirect(`/transaksi/${id}`);
}

// Soft delete
export async function deleteTransaction(id: number) {
  await requireAuth();
  const tx = getTransaction(id);
  if (!tx || tx.deleted_at) throw new Error("Transaksi tidak ditemukan");

  getDb()
    .prepare("UPDATE transactions SET deleted_at=?, updated_at=? WHERE id=?")
    .run(new Date().toISOString(), new Date().toISOString(), id);

  logAudit(id, "delete", { type: tx.type, amount: tx.amount, date: tx.date });
  revalidatePath("/");
  revalidatePath("/transaksi");
  revalidatePath("/rekap");
  redirect("/transaksi");
}

// Pulihkan transaksi dari kotak sampah.
export async function restoreTransaction(id: number) {
  await requireAuth();
  const tx = getDb()
    .prepare("SELECT * FROM transactions WHERE id=?")
    .get(id) as { deleted_at: string | null } | undefined;
  if (!tx || !tx.deleted_at) throw new Error("Transaksi tidak ada di kotak sampah");

  getDb()
    .prepare("UPDATE transactions SET deleted_at=NULL, updated_at=? WHERE id=?")
    .run(new Date().toISOString(), id);

  logAudit(id, "update", { kind: "restore" });
  revalidatePath("/");
  revalidatePath("/transaksi");
  revalidatePath("/transaksi/terhapus");
  revalidatePath("/rekap");
  redirect(`/transaksi/${id}`);
}

/**
 * Hapus permanen sebuah transaksi beserta berkas lampirannya.
 * Tidak bisa dibatalkan — hanya boleh dari kotak sampah.
 */
export async function purgeTransaction(id: number) {
  await requireAuth();
  const db = getDb();
  const tx = db
    .prepare("SELECT * FROM transactions WHERE id=?")
    .get(id) as { deleted_at: string | null; type: string; amount: number; date: string } | undefined;
  if (!tx || !tx.deleted_at) throw new Error("Transaksi tidak ada di kotak sampah");

  const files = db
    .prepare("SELECT file_path, thumb_path FROM attachments WHERE transaction_id=?")
    .all(id) as { file_path: string; thumb_path: string | null }[];

  for (const file of files) {
    for (const name of [file.file_path, file.thumb_path]) {
      if (!name) continue;
      try {
        fs.unlinkSync(path.join(uploadRoot(), name));
      } catch {
        /* berkas mungkin sudah hilang */
      }
    }
  }

  db.prepare("DELETE FROM attachments WHERE transaction_id=?").run(id);
  db.prepare("DELETE FROM transactions WHERE id=?").run(id);

  // Jejak sengaja disimpan walau transaksinya sudah tidak ada.
  logAudit(id, "delete", {
    kind: "purge",
    type: tx.type,
    amount: tx.amount,
    date: tx.date,
    attachments: files.length,
  });
  revalidatePath("/transaksi/terhapus");
  revalidatePath("/audit");
  redirect("/transaksi/terhapus");
}

/**
 * Lampiran ikut soft delete: barisnya ditandai, berkasnya tetap di disk supaya
 * bukti pembayaran masih bisa dipulihkan. Pembersihan permanen terjadi saat
 * transaksinya dihapus dari kotak sampah.
 */
export async function deleteAttachment(attachmentId: number, transactionId: number) {
  await requireAuth();
  const attachment = listAttachments(transactionId).find((a) => a.id === attachmentId);
  if (!attachment) return;

  getDb()
    .prepare("UPDATE attachments SET deleted_at=? WHERE id=?")
    .run(new Date().toISOString(), attachmentId);

  logAudit(transactionId, "delete", {
    kind: "attachment",
    attachmentId,
    fileName: attachment.file_name,
  });
  revalidatePath(`/transaksi/${transactionId}`);
  revalidatePath("/audit");
}

export async function restoreAttachment(attachmentId: number, transactionId: number) {
  await requireAuth();
  getDb()
    .prepare("UPDATE attachments SET deleted_at=NULL WHERE id=? AND transaction_id=?")
    .run(attachmentId, transactionId);

  logAudit(transactionId, "update", { kind: "attachment_restore", attachmentId });
  revalidatePath(`/transaksi/${transactionId}`);
  revalidatePath("/audit");
}

// ---- KATEGORI & SEMESTER ----
export async function addCategory(formData: FormData) {
  await requireAuth();
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  if (name && (type === "in" || type === "out")) {
    getDb().prepare("INSERT INTO categories (name, type) VALUES (?, ?)").run(name, type);
  }
  revalidatePath("/pengaturan");
}

export async function deleteCategory(id: number) {
  await requireAuth();
  const used = getDb()
    .prepare("SELECT COUNT(*) AS c FROM transactions WHERE category_id=?")
    .get(id) as { c: number };
  if (used.c === 0) getDb().prepare("DELETE FROM categories WHERE id=?").run(id);
  revalidatePath("/pengaturan");
}

export async function addSemester(formData: FormData) {
  await requireAuth();
  const name = String(formData.get("name") ?? "").trim();
  if (name) {
    getDb().prepare("INSERT OR IGNORE INTO semesters (name) VALUES (?)").run(name);
  }
  revalidatePath("/pengaturan");
}

export async function deleteSemester(id: number) {
  await requireAuth();
  const used = getDb()
    .prepare("SELECT COUNT(*) AS c FROM transactions WHERE semester_id=?")
    .get(id) as { c: number };
  if (used.c === 0) getDb().prepare("DELETE FROM semesters WHERE id=?").run(id);
  revalidatePath("/pengaturan");
}

// ---- PENGATURAN UMUM ----
export async function updateSettings(formData: FormData) {
  await requireAuth();
  const before = getSettings();
  const fundName = String(formData.get("fund_name") ?? "").trim() || "Dana";
  const initialBalance = parseAmount(formData.get("initial_balance"));

  // Saldo awal menggeser seluruh perhitungan, jadi jangan pernah diam-diam jadi 0.
  if (initialBalance <= 0) throw new Error("Saldo awal harus lebih dari 0");

  getDb()
    .prepare("UPDATE settings SET fund_name=?, initial_balance=? WHERE id=1")
    .run(fundName, initialBalance);

  const changed =
    before.fund_name !== fundName || before.initial_balance !== initialBalance;
  if (changed) {
    logAudit(null, "update", {
      kind: "settings",
      before: { fundName: before.fund_name, initialBalance: before.initial_balance },
      after: { fundName, initialBalance },
    });
  }

  revalidatePath("/");
  revalidatePath("/pengaturan");
  revalidatePath("/audit");
}

export async function changePassword(formData: FormData) {
  await requireAuth();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const s = getSettings();
  if (!bcrypt.compareSync(current, s.password_hash)) {
    redirect("/pengaturan?pw=salah");
  }
  if (next.length < 6) {
    redirect("/pengaturan?pw=pendek");
  }
  getDb()
    .prepare("UPDATE settings SET password_hash=? WHERE id=1")
    .run(bcrypt.hashSync(next, 10));
  redirect("/pengaturan?pw=ok");
}

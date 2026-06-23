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

async function saveFiles(transactionId: number, files: File[]) {
  const root = uploadRoot();
  fs.mkdirSync(root, { recursive: true });
  const db = getDb();
  const ins = db.prepare(
    "INSERT INTO attachments (transaction_id, file_path, file_name, mime_type) VALUES (?, ?, ?, ?)"
  );

  for (const file of files) {
    if (!file || file.size === 0) continue;
    if (file.size > MAX_SIZE) throw new Error(`File ${file.name} melebihi 10 MB`);
    if (!ALLOWED.includes(file.type)) throw new Error(`Tipe file ${file.name} tidak didukung`);

    const ext = path.extname(file.name) || "";
    const safe = `${transactionId}_${crypto.randomBytes(6).toString("hex")}${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(root, safe), buf);
    ins.run(transactionId, safe, file.name, file.type);
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

  const files = formData.getAll("attachments").filter((f): f is File => f instanceof File);
  await saveFiles(id, files);

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

  const files = formData.getAll("attachments").filter((f): f is File => f instanceof File);
  await saveFiles(id, files);

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

export async function deleteAttachment(attachmentId: number, transactionId: number) {
  await requireAuth();
  const atts = listAttachments(transactionId);
  const att = atts.find((a) => a.id === attachmentId);
  if (att) {
    try {
      fs.unlinkSync(path.join(uploadRoot(), att.file_path));
    } catch {
      /* file mungkin sudah hilang */
    }
    getDb().prepare("DELETE FROM attachments WHERE id=?").run(attachmentId);
  }
  revalidatePath(`/transaksi/${transactionId}`);
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
  const fundName = String(formData.get("fund_name") ?? "").trim();
  const initialBalance = parseAmount(formData.get("initial_balance"));
  getDb()
    .prepare("UPDATE settings SET fund_name=?, initial_balance=? WHERE id=1")
    .run(fundName || "Dana", initialBalance);
  revalidatePath("/");
  revalidatePath("/pengaturan");
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

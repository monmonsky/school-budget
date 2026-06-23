/// <reference types="bun-types" />
import { Database } from "bun:sqlite";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";

// ---- Konfigurasi (via env var, portabel lokal -> VPS) ----
const DB_PATH = process.env.DB_PATH || "./data/app.db";
const INITIAL_BALANCE = parseInt(process.env.INITIAL_BALANCE || "186000000", 10);
const FUND_NAME = process.env.FUND_NAME || "Kuliah Adik";
const APP_PASSWORD = process.env.APP_PASSWORD || "admin123";

// Kategori default
const DEFAULT_CATEGORIES: { name: string; type: "in" | "out" }[] = [
  { name: "UKT", type: "out" },
  { name: "Uang Pangkal / Daftar Ulang", type: "out" },
  { name: "TA / Skripsi", type: "out" },
  { name: "Kos / Tempat Tinggal", type: "out" },
  { name: "Buku & Alat Kuliah", type: "out" },
  { name: "Biaya Hidup", type: "out" },
  { name: "Praktikum / Lab", type: "out" },
  { name: "Internet / Pulsa", type: "out" },
  { name: "Kesehatan", type: "out" },
  { name: "Lainnya", type: "out" },
  { name: "Top-up Dana", type: "in" },
  { name: "Beasiswa", type: "in" },
  { name: "Pengembalian / Refund", type: "in" },
  { name: "Lainnya", type: "in" },
];

const DEFAULT_SEMESTERS = ["Ganjil 2026/2027", "Genap 2026/2027"];

// ---- Singleton koneksi (bertahan saat hot-reload dev) ----
const globalForDb = globalThis as unknown as { _db?: Database };

function createConnection(): Database {
  const abs = path.resolve(process.cwd(), DB_PATH);
  fs.mkdirSync(path.dirname(abs), { recursive: true });

  const db = new Database(abs, { create: true });
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");

  migrate(db);
  seed(db);
  return db;
}

function migrate(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      initial_balance INTEGER NOT NULL,
      fund_name TEXT NOT NULL,
      password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('in','out'))
    );

    CREATE TABLE IF NOT EXISTS semesters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK (type IN ('in','out')),
      amount INTEGER NOT NULL CHECK (amount > 0),
      date TEXT NOT NULL,
      category_id INTEGER REFERENCES categories(id),
      semester_id INTEGER REFERENCES semesters(id),
      note TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      mime_type TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER,
      action TEXT NOT NULL CHECK (action IN ('create','update','delete')),
      changes TEXT,
      created_at TEXT NOT NULL
    );
  `);
}

function seed(db: Database) {
  const hasSettings = db.query("SELECT 1 FROM settings WHERE id = 1").get();
  if (!hasSettings) {
    db.query(
      "INSERT INTO settings (id, initial_balance, fund_name, password_hash) VALUES (1, ?, ?, ?)"
    ).run(INITIAL_BALANCE, FUND_NAME, bcrypt.hashSync(APP_PASSWORD, 10));
  }

  const catCount = db.query("SELECT COUNT(*) AS c FROM categories").get() as { c: number };
  if (catCount.c === 0) {
    const ins = db.query("INSERT INTO categories (name, type) VALUES (?, ?)");
    db.transaction(() => {
      for (const c of DEFAULT_CATEGORIES) ins.run(c.name, c.type);
    })();
  }

  const semCount = db.query("SELECT COUNT(*) AS c FROM semesters").get() as { c: number };
  if (semCount.c === 0) {
    const ins = db.query("INSERT INTO semesters (name) VALUES (?)");
    db.transaction(() => {
      for (const s of DEFAULT_SEMESTERS) ins.run(s);
    })();
  }
}

export function getDb(): Database {
  if (!globalForDb._db) {
    globalForDb._db = createConnection();
  }
  return globalForDb._db;
}

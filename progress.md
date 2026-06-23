# Progress — Aplikasi Pencatatan Pembayaran Kuliah

Status keseluruhan: **v1 MVP selesai & berjalan di http://localhost:3004**
Acuan: [PRD.md](PRD.md) · konteks: [.claude/CLAUDE.md](.claude/CLAUDE.md) · cara jalan: [README.md](README.md)

Legenda: `[ ]` belum · `[~]` sedang dikerjakan · `[x]` selesai

> Stack final: **Next.js 15 (App Router) + bun:sqlite + bcryptjs**, dijalankan di runtime **Bun** (`bun --bun next`).

---

## Fase 0 — Setup Project
- [x] Inisialisasi app **Next.js** (App Router, TypeScript)
- [x] Pasang Tailwind CSS
- [x] Database: **bun:sqlite** (driver bawaan Bun; better-sqlite3 tidak didukung Bun)
- [x] Pasang `bcryptjs` untuk hash password
- [x] Struktur folder: `app/`, `lib/`, `components/`, `uploads/`, `data/`
- [x] File `.gitignore` (abaikan `*.db`, `/uploads`, `/data`)
- [x] **Env var** untuk lokasi `.db`, folder `/uploads`, password awal (portabel lokal → VPS)

## Fase 1 — Database & Skema
- [x] Tabel: `transactions`, `attachments`, `categories`, `semesters`, `settings`, `audit_log`
- [x] Seed kategori default + pemasukan
- [x] Seed `settings`: `initial_balance = 186000000`, `fund_name = "Kuliah Adik"`
- [x] Helper koneksi DB (singleton) di `lib/db.ts`
- [x] Fungsi hitung saldo di `lib/queries.ts`

## Fase 2 — Autentikasi (password)
- [x] Seed password awal (hash bcrypt) dari env `APP_PASSWORD`
- [x] Halaman login + verifikasi password
- [x] Proteksi semua halaman/route via `requireAuth()` (redirect ke login)
- [x] Sesi via cookie bertanda HMAC + logout
- [x] Ubah password di Pengaturan

## Fase 3 — Transaksi (CRUD inti)
- [x] Server actions: create / update / delete transaksi
- [x] Form tambah & edit (jenis, tanggal, jumlah, kategori, semester, catatan)
- [x] Validasi: jumlah > 0; semester wajib untuk semua transaksi keluar
- [x] Edit & hapus (konfirmasi) → soft delete
- [x] Saldo ter-update otomatis (abaikan soft-deleted)

## Fase 3b — Jejak / Audit Log
- [x] Kolom `updated_at`, `deleted_at` di `transactions`
- [x] Tabel `audit_log` + pencatatan create/update/delete
- [x] Halaman jejak perubahan (read-only) di `/audit`

## Fase 4 — Upload Kuitansi (multi-lampiran)
- [x] Upload multi-file ke `/uploads`, dicatat di `attachments`
- [x] Validasi tipe (JPG/PNG/WebP/PDF) & ukuran (maks 10 MB)
- [x] Preview & unduh via `/api/attachments/[id]` (dengan proteksi auth)
- [x] Hapus lampiran

## Fase 5 — Dashboard / Ringkasan
- [x] Kartu Saldo saat ini + saldo awal
- [x] Kartu Total Masuk, Total Keluar, Jumlah Transaksi
- [x] Daftar transaksi terbaru + tombol cepat

## Fase 6 — Riwayat & Filter
- [x] Daftar semua transaksi (urut tanggal terbaru)
- [x] Filter: jenis, kategori, semester, rentang tanggal, pencarian catatan
- [x] Ringkasan net dari hasil filter

## Fase 7 — Rekap per Semester
- [x] Total dana keluar per semester + rincian per kategori
- [x] Total pengeluaran & sisa saldo

## Fase 8 — Pengaturan
- [x] Edit saldo awal & nama dana
- [x] Kelola kategori (tambah/hapus — hapus hanya jika belum dipakai)
- [x] Kelola semester/termin
- [x] Ubah password

## Fase 9 — Polish & Rilis v1
- [x] Responsif di HP & desktop (Tailwind)
- [x] Format angka Rupiah (tanpa desimal)
- [x] Smoke test acceptance criteria (saldo, CRUD, soft delete, rekap) ✔
- [x] README + cara backup manual
- [ ] (Disarankan) ganti `APP_PASSWORD` & `SESSION_SECRET` di `.env` sebelum dipakai serius

## Fase 10 — Deploy ke VPS (school-mgmt.dokiva.id)
- [x] Config PM2: [ecosystem.config.cjs](ecosystem.config.cjs) (Bun, fork, port 3004)
- [x] Config Nginx: [deploy/nginx/school-mgmt.dokiva.id.conf](deploy/nginx/school-mgmt.dokiva.id.conf)
- [x] Panduan deploy: [DEPLOY.md](DEPLOY.md)
- [ ] Eksekusi di VPS: DNS A record → IP, `bun install` + `bun run build`
- [ ] `pm2 start ecosystem.config.cjs` + `pm2 save` + `pm2 startup`
- [ ] `certbot --nginx -d school-mgmt.dokiva.id` (HTTPS)
- [ ] Set `.env` produksi (`APP_PASSWORD`, `SESSION_SECRET` acak)

---

## Backlog (setelah v1)
- [ ] Ekspor data ke CSV/Excel (v1.1)
- [ ] Grafik saldo dari waktu ke waktu (v1.1)
- [ ] Pulihkan (restore) transaksi yang ke-soft-delete
- [ ] Backup otomatis terjadwal (v2)

---

## Catatan / Keputusan
- 2026-06-23 — PRD disetujui. Arsitektur: satu app Next.js + SQLite. Backup manual.
- 2026-06-23 — Saldo 186jt = saldo hari ini (mulai fresh, tanpa transaksi lama).
- 2026-06-23 — Deploy lokal dulu, nanti VPS (desain portabel via env var).
- 2026-06-23 — Hapus = soft delete + audit log. Semester wajib untuk semua transaksi keluar.
- 2026-06-23 — Selalu pakai **Bun**. Driver DB = `bun:sqlite` (better-sqlite3 tidak jalan di Bun). Next dijalankan via `bun --bun next`.
- 2026-06-23 — v1 MVP selesai; smoke test lulus; jalan di port 3004.

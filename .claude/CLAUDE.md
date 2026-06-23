# Project Memory — Aplikasi Pencatatan Pembayaran Kuliah

Konteks tetap untuk project ini. Baca [PRD.md](../PRD.md) untuk detail lengkap.

## Apa ini
Web app **single-user** untuk mencatat pembayaran kuliah adik pemilik: dana masuk,
dana keluar, saldo berjalan, dan upload kuitansi. Saldo awal **Rp186.000.000**.

## Keputusan yang sudah dikunci
- **Arsitektur**: SATU app fullstack (monolith) — **Next.js** (UI + API Routes), bukan FE/BE terpisah.
- **Database**: **SQLite** (satu file `.db`), akses via `better-sqlite3`.
- **Model saldo**: satu kantong. `Saldo = saldo_awal + Σmasuk − Σkeluar` (dihitung, tidak disimpan). Soft-deleted tidak dihitung.
- **Saldo awal**: 186jt = saldo hari ini, mulai fresh — TIDAK ada input transaksi masa lalu.
- **Kuitansi**: multi-lampiran per transaksi; file di folder `/uploads`, path di tabel `attachments`.
- **Kategori**: UKT, Uang Pangkal/Daftar Ulang, TA/Skripsi, Kos, Buku & Alat, Biaya Hidup, Praktikum/Lab, Internet/Pulsa, Kesehatan, Lainnya (pengeluaran); Top-up, Beasiswa, Refund, Lainnya (pemasukan). Bisa ditambah user.
- **Semester/termin**: WAJIB untuk semua transaksi keluar; opsional untuk pemasukan.
- **Rekap per semester**: termasuk di v1.
- **Jejak data**: soft delete (`deleted_at`) + `audit_log` (create/update/delete).
- **Auth**: password tunggal, disimpan sebagai hash (bcrypt).
- **Deploy**: lokal dulu, nanti VPS — desain portabel, path & config via ENV VAR.
- **Backup**: manual — copy file `.db` + folder `/uploads`. Tidak ada fitur backup in-app.
- **Mata uang**: IDR, tanpa desimal.

## Skema SQLite (ringkas)
`transactions(id, type[in|out], amount, date, category_id→categories, semester_id→semesters, note, created_at, updated_at, deleted_at)`
`audit_log(id, transaction_id, action[create|update|delete], changes(JSON), created_at)`
`attachments(id, transaction_id→transactions, file_path, file_name, mime_type)`
`categories(id, name, type[in|out])`
`semesters(id, name)`
`settings(initial_balance=186000000, fund_name, password_hash)`

## Status
PRD selesai & disetujui. Belum mulai implementasi. Lihat [progress.md](../progress.md).

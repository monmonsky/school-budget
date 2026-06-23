# Pencatat Pembayaran Kuliah

Web app single-user untuk mencatat dana masuk/keluar, saldo, dan kuitansi biaya kuliah.
Dibangun dengan **Next.js 15 + bun:sqlite**, dijalankan di runtime **Bun**.

## Menjalankan (lokal)

```bash
bun install
bun run dev      # http://localhost:3004
```

> Catatan: server dijalankan via `bun --bun next` agar `bun:sqlite` tersedia di runtime.
> Database & seed (saldo awal, kategori, semester) dibuat otomatis saat pertama dijalankan.

Login dengan password dari `.env` (`APP_PASSWORD`, default `admin123`).
**Ganti** `APP_PASSWORD` dan `SESSION_SECRET` di `.env` sebelum dipakai serius,
lalu ubah password lewat menu **Pengaturan**.

## Konfigurasi (`.env`)

| Variabel | Default | Keterangan |
|---|---|---|
| `DB_PATH` | `./data/app.db` | lokasi file SQLite |
| `UPLOAD_DIR` | `./uploads` | folder simpan kuitansi |
| `INITIAL_BALANCE` | `186000000` | saldo awal (IDR) |
| `FUND_NAME` | `Kuliah Adik` | nama dana |
| `APP_PASSWORD` | `admin123` | password awal (dipakai saat seed pertama) |
| `SESSION_SECRET` | — | kunci penanda cookie sesi (wajib diganti) |

## Fitur

- Dashboard saldo berjalan (`saldo = awal + Σmasuk − Σkeluar`)
- Catat transaksi masuk/keluar + kategori + semester
- Upload banyak kuitansi (JPG/PNG/WebP/PDF) per transaksi
- Riwayat + filter (jenis, kategori, semester, tanggal, pencarian)
- Rekap per semester (total + rincian kategori)
- Jejak/audit perubahan; hapus = soft delete (tidak benar-benar hilang)
- Login password, ubah password, kelola kategori & semester

## Backup (manual)

Salin dua hal ini secara berkala ke tempat aman:

```bash
cp -r data/ /lokasi/backup/data-$(date +%F)
cp -r uploads/ /lokasi/backup/uploads-$(date +%F)
```

`data/` berisi database SQLite, `uploads/` berisi file kuitansi. Itu saja yang perlu dicadangkan.

## Deploy ke VPS (school-mgmt.dokiva.id)

Panduan lengkap: **[DEPLOY.md](DEPLOY.md)**. Ringkas:

1. Install Bun + PM2 + Nginx + Certbot di VPS, `bun install`, buat `.env` produksi.
2. `bun run build` lalu `pm2 start ecosystem.config.cjs` (port 3004).
3. Pasang Nginx: `deploy/nginx/school-mgmt.dokiva.id.conf`, lalu `certbot --nginx -d school-mgmt.dokiva.id` untuk HTTPS.

File terkait: [ecosystem.config.cjs](ecosystem.config.cjs) (PM2) ·
[deploy/nginx/school-mgmt.dokiva.id.conf](deploy/nginx/school-mgmt.dokiva.id.conf) (Nginx).

## Struktur

```
app/            halaman & route (App Router)
  api/attachments/[id]   serve file kuitansi
components/      komponen UI
lib/
  db.ts         koneksi + skema + seed (bun:sqlite)
  queries.ts    query baca (saldo, daftar, rekap, audit)
  actions.ts    server actions (CRUD, upload, auth, settings)
  auth.ts       sesi cookie ber-HMAC
  format.ts     format Rupiah & tanggal
data/           file SQLite (tidak di-commit)
uploads/        kuitansi (tidak di-commit)
```

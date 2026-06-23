# PRD — Aplikasi Pencatatan Pembayaran Kuliah

| | |
|---|---|
| **Nama produk** | Pencatat Pembayaran Kuliah (working title) |
| **Tipe** | Web app |
| **Pengguna** | Single user (pemilik dana) |
| **Status** | Draft v1 |
| **Tanggal** | 23 Juni 2026 |
| **Pemilik** | hifajjar@gmail.com |

---

## 1. Latar Belakang & Masalah

Saya mengelola dana untuk biaya kuliah adik saya. Saat ini saldo yang tersedia
untuk keperluan kuliah adalah **Rp186.000.000**. Selama ini pencatatan dana
masuk, dana keluar (pembayaran kuliah), dan bukti pembayaran (kuitansi) belum
terpusat, sehingga sulit untuk:

- Mengetahui **saldo terkini** secara cepat dan akurat.
- Melacak **ke mana saja** dana sudah dikeluarkan (SPP, UKT, daftar ulang, dll).
- Menyimpan dan menemukan kembali **bukti/kuitansi** pembayaran.
- Melihat **riwayat** transaksi secara historis.

## 2. Tujuan (Goals)

1. Menyediakan satu tempat untuk mencatat seluruh **dana masuk** dan **dana keluar**.
2. Menampilkan **saldo berjalan** yang selalu akurat (otomatis terhitung dari transaksi).
3. Memungkinkan **upload & menyimpan kuitansi** untuk tiap transaksi pengeluaran.
4. Memberi **ringkasan** total masuk, total keluar, dan saldo saat ini dalam satu layar.

### Non-Goals (di luar lingkup v1)

- Multi-user / login banyak orang.
- Integrasi otomatis dengan bank / mutasi rekening.
- Aplikasi mobile native (cukup web yang responsif di HP).
- Notifikasi/pengingat jatuh tempo pembayaran.
- Integrasi pembayaran/payment gateway.

## 3. Pengguna & Skenario

**Persona tunggal:** Pemilik dana (Anda) — mencatat transaksi, upload kuitansi,
dan memantau saldo.

**Skenario utama:**
1. Membuka aplikasi → langsung melihat saldo terkini Rp186jt dan ringkasan.
2. Menerima tambahan dana → mencatat transaksi **masuk**.
3. Membayar kuliah → mencatat transaksi **keluar** + upload foto kuitansi.
4. Mengecek riwayat → melihat daftar transaksi, memfilter, membuka kuitansi.

## 4. Konsep & Aturan Saldo

- Model **satu kantong saldo** (single pot).
- **Saldo awal:** Rp186.000.000 = **saldo hari ini** (mulai fresh). Pencatatan dimulai dari sekarang; **tidak** ada input transaksi masa lalu. Nilai ini dapat dikonfigurasi saat setup pertama.
- **Saldo berjalan = Saldo awal + Σ(dana masuk) − Σ(dana keluar)**.
- Saldo dihitung otomatis; pengguna tidak mengedit saldo secara manual,
  hanya menambah/menghapus transaksi.
- Mata uang: **Rupiah (IDR)**, tanpa desimal.
- Saldo boleh ditampilkan jika mendekati/negatif sebagai peringatan (validasi:
  beri warning saat pengeluaran melebihi saldo, tapi tetap diizinkan dicatat).

## 5. Fitur & Kebutuhan (Functional Requirements)

### 5.1 Dashboard / Ringkasan
- Menampilkan **Saldo saat ini** (besar, menonjol).
- Kartu ringkasan: **Total dana masuk**, **Total dana keluar**, **Jumlah transaksi**.
- Daftar **transaksi terbaru** (5–10 terakhir).
- (Opsional v1.1) grafik sederhana saldo dari waktu ke waktu.

### 5.2 Manajemen Transaksi
- **Tambah transaksi** dengan field:
  - Jenis: `Masuk` / `Keluar` (wajib).
  - Tanggal (wajib, default hari ini).
  - Jumlah (wajib, IDR, > 0).
  - Kategori (wajib — lihat §5.6 Daftar Kategori).
  - **Semester/termin** (**wajib untuk semua transaksi keluar** — mis. "Ganjil 2026/2027"; opsional untuk pemasukan).
  - Keterangan/catatan (opsional).
  - Lampiran kuitansi: **mendukung banyak file** per transaksi (opsional untuk Masuk, **disarankan** untuk Keluar).
- **Edit** dan **Hapus** transaksi (dengan konfirmasi). Perubahan & penghapusan **dicatat jejaknya** (lihat §5.9).
- Saldo otomatis ter-update setelah setiap perubahan.

### 5.3 Upload Kuitansi
- Mendukung file gambar (JPG/PNG) dan **PDF**.
- Maksimum ukuran file (mis. 10 MB per file).
- Bisa **preview** dan **unduh** kuitansi dari detail transaksi.
- Satu transaksi mendukung **banyak lampiran** (multi-file upload).

### 5.4 Riwayat & Pencarian
- Daftar seluruh transaksi (urut tanggal terbaru).
- **Filter** berdasarkan: jenis (masuk/keluar), kategori, **semester**, rentang tanggal.
- **Pencarian** berdasarkan keterangan.
- Menampilkan saldo berjalan per baris (opsional).

### 5.5 Pengaturan
- Set **saldo awal** dan nama dana/penerima (mis. "Kuliah Adik").
- Kelola daftar **kategori** dan **semester/termin**.
- Ubah **password** akses.
- (Opsional) ekspor data ke **CSV/Excel** untuk arsip.

### 5.6 Daftar Kategori (default)

Kategori menjelaskan **untuk apa** dana dikeluarkan. Daftar awal yang disarankan
(dapat ditambah/ubah oleh pengguna):

**Pengeluaran (Keluar):**
- **UKT** — Uang Kuliah Tunggal / SPP
- **Uang Pangkal / Daftar Ulang** — biaya masuk atau registrasi ulang per semester
- **TA / Skripsi** — biaya tugas akhir, bimbingan, sidang, wisuda
- **Kos / Tempat Tinggal** — sewa kos, kontrakan
- **Buku & Alat Kuliah** — buku, alat tulis, perlengkapan praktikum
- **Biaya Hidup** — makan, transport, kebutuhan harian
- **Praktikum / Lab** — biaya praktikum, KKN, magang
- **Internet / Pulsa**
- **Kesehatan**
- **Lainnya**

**Pemasukan (Masuk):**
- **Top-up Dana** — penambahan dana ke kantong
- **Beasiswa**
- **Pengembalian / Refund**
- **Lainnya**

### 5.7 Akses & Keamanan
- Aplikasi dilindungi **password** saat dibuka (single user).
- Sesi login tersimpan sampai logout / kedaluwarsa.
- Password disimpan dalam bentuk **hash** (mis. bcrypt), bukan teks polos.

### 5.8 Rekap per Semester
- Halaman **rekap** yang menampilkan, per semester/termin:
  - Total **dana keluar** di semester tersebut.
  - **Rincian per kategori** (mis. UKT sekian, Kos sekian, TA sekian).
  - Jumlah transaksi.
- Tabel ringkas **semua semester** untuk perbandingan antar-periode.
- (Opsional) total keseluruhan & sisa saldo di bagian bawah rekap.

### 5.9 Jejak / Riwayat Perubahan (Audit)
- Transaksi tidak dihapus permanen, melainkan **soft delete** (ditandai, tidak ikut hitungan saldo).
- Setiap **tambah / ubah / hapus** transaksi dicatat ke **log audit**: aksi, waktu, dan ringkasan perubahan.
- Halaman/daftar untuk melihat riwayat perubahan (minimal: log read-only).
- Transaksi yang sudah di-soft-delete tidak masuk perhitungan saldo & rekap.

## 6. Kebutuhan Non-Fungsional

- **Responsif**: nyaman dipakai di HP (upload kuitansi langsung dari kamera) dan desktop.
- **Persistensi data**: seluruh data transaksi disimpan di **SQLite**; file kuitansi disimpan di folder/storage lokal dengan path direferensikan dari DB.
- **Keamanan dasar**: karena single user, proteksi akses dengan **password** (hash) agar tidak dibuka sembarang orang.
- **Backup**: manual — menyalin file `.db` dan folder `/uploads`. Tidak ada fitur backup di dalam aplikasi.
- **Akurasi angka**: perhitungan saldo harus konsisten (hindari error pembulatan).

## 7. Data Model (ringkas)

Skema relasional di **SQLite**:

**transactions**
| Field | Tipe | Keterangan |
|---|---|---|
| id | INTEGER PK | auto increment |
| type | TEXT | `in` \| `out` |
| amount | INTEGER | IDR |
| date | TEXT | tanggal transaksi (ISO) |
| category_id | INTEGER FK | → categories.id |
| semester_id | INTEGER FK | → semesters.id (wajib bila `type=out`, nullable bila `in`) |
| note | TEXT | opsional |
| created_at | TEXT | timestamp |
| updated_at | TEXT | timestamp perubahan terakhir |
| deleted_at | TEXT | null = aktif; terisi = soft-deleted (tidak dihitung) |

**audit_log** (jejak tambah/ubah/hapus)
| Field | Tipe | Keterangan |
|---|---|---|
| id | INTEGER PK | |
| transaction_id | INTEGER | transaksi terkait |
| action | TEXT | `create` \| `update` \| `delete` |
| changes | TEXT | ringkasan perubahan (JSON) |
| created_at | TEXT | waktu aksi |

**attachments** (relasi 1 transaksi → banyak file)
| Field | Tipe | Keterangan |
|---|---|---|
| id | INTEGER PK | |
| transaction_id | INTEGER FK | → transactions.id |
| file_path | TEXT | lokasi file kuitansi |
| file_name | TEXT | nama asli |
| mime_type | TEXT | image/png, application/pdf, dll |

**categories**
| Field | Tipe | Keterangan |
|---|---|---|
| id | INTEGER PK | |
| name | TEXT | mis. "UKT", "Kos", "TA/Skripsi" |
| type | TEXT | `in` \| `out` |

**semesters**
| Field | Tipe | Keterangan |
|---|---|---|
| id | INTEGER PK | |
| name | TEXT | mis. "Ganjil 2026/2027" |

**settings**
| Field | Tipe | Keterangan |
|---|---|---|
| initial_balance | INTEGER | default 186000000 |
| fund_name | TEXT | mis. "Kuliah Adik" |
| password_hash | TEXT | hash password akses |

> Saldo **tidak** disimpan sebagai kolom; selalu dihitung dari `initial_balance` + Σ transaksi.

## 8. Saran Teknis (untuk tahap build nanti)

> Tidak mengikat — hanya rekomendasi untuk single-user, **satu app fullstack** dengan SQLite.

- **Arsitektur**: **satu aplikasi (monolith)** — frontend & backend dalam satu codebase & satu proses, **bukan** dua app terpisah. Rekomendasi: **Next.js** (UI + API Routes/Route Handlers dalam satu app). Alternatif: **SvelteKit** atau **Remix** (juga fullstack satu app).
- **Database**: **SQLite** (sesuai keputusan). Ringan, satu file `.db`, di-backup cukup dengan **copy file secara manual**. Akses via `better-sqlite3` (atau Prisma/Drizzle dengan driver SQLite).
- **Penyimpanan kuitansi**: file disimpan di folder lokal (mis. `/uploads`), path-nya dicatat di tabel `attachments`.
- **Auth**: password tunggal, disimpan sebagai hash (bcrypt), sesi via cookie/token sederhana.
- **Deploy**: **lokal dulu** (jalan di laptop via localhost), **nanti pindah ke VPS**. Maka desain harus **portabel**: path file/DB relatif & dari env var, hindari hal yang hanya jalan di satu mesin. Saat di VPS, akses dari HP & laptop kapan saja.
- **Konfigurasi**: gunakan env var untuk lokasi file `.db`, folder `/uploads`, dan password awal — supaya pindah lokal → VPS tanpa ubah kode.

## 9. Kriteria Sukses (Acceptance Criteria)

- [ ] Saldo awal dapat di-set ke Rp186.000.000 dan tampil di dashboard.
- [ ] Bisa menambah transaksi masuk & keluar; saldo ter-update otomatis & benar.
- [ ] Bisa upload **beberapa** kuitansi (gambar/PDF) ke satu transaksi dan membukanya kembali.
- [ ] Setiap transaksi keluar bisa diberi **kategori** (UKT, Kos, TA, dll) dan **semester**.
- [ ] Riwayat transaksi bisa difilter per jenis/kategori/**semester**/tanggal.
- [ ] Setiap transaksi **keluar** wajib punya semester sebelum bisa disimpan.
- [ ] Aplikasi meminta **password** saat dibuka.
- [ ] Menghapus transaksi = soft delete; tercatat di audit log & tidak lagi mempengaruhi saldo.
- [ ] Data tersimpan di **SQLite** dan tetap ada setelah aplikasi ditutup & dibuka kembali.
- [ ] Total masuk, total keluar, dan saldo konsisten secara matematis.

## 10. Keputusan yang Sudah Ditetapkan

1. **Penyimpanan**: SQLite (satu file `.db` di server).
2. **Multi-lampiran**: ya, satu transaksi bisa punya banyak kuitansi.
3. **Semester/termin**: ya, transaksi dapat ditandai per semester untuk pelaporan.
4. **Proteksi akses**: ya, dengan **password**.
5. **Kategori**: tersedia daftar default (UKT, TA/Skripsi, Kos, dll — lihat §5.6) dan bisa ditambah pengguna.

6. **Arsitektur**: satu app fullstack (monolith, mis. Next.js) — frontend & backend menyatu, bukan terpisah.
7. **Backup**: manual (copy file `.db` + `/uploads`) — tanpa fitur backup di aplikasi.
8. **Rekap per semester**: termasuk di v1 (lihat §5.8).
9. **Saldo awal**: Rp186jt = saldo hari ini, mulai fresh — tanpa input transaksi masa lalu.
10. **Deploy**: lokal dulu, nanti VPS — desain portabel (path & config via env var).
11. **Jejak data**: soft delete + audit log; transaksi terhapus tidak dihitung saldo (lihat §5.9).
12. **Semester**: wajib untuk semua transaksi keluar; opsional untuk pemasukan.

---

## Roadmap singkat

- **v1 (MVP)**: satu app fullstack (Next.js + SQLite) — login password, dashboard saldo, CRUD transaksi, multi-upload kuitansi, kategori + semester, riwayat + filter, **rekap per semester**, set saldo awal.
- **v1.1**: ekspor CSV, grafik saldo.
- **v2**: akses multi-perangkat yang lebih aman, backup otomatis terjadwal.

> **Backup**: dilakukan manual dengan menyalin file `.db` (dan folder `/uploads`).

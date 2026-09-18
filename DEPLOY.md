# Deploy ke VPS — school-mgmt.dokiva.id

Stack: Next.js 15 + bun:sqlite, dijalankan di runtime **Bun**, dikelola **PM2**,
di-proxy oleh **Nginx** dengan HTTPS Let's Encrypt.

> Ada dua jalur menjalankan app; pilih **salah satu**, jangan dua-duanya
> (keduanya memakai port 3004 dan file SQLite yang sama):
>
> - **PM2** (bagian 1–6 di bawah) — proses langsung di host.
> - **Docker Compose** (bagian 7) — app dalam container, Nginx tetap di host.
>
> Bagian Nginx/HTTPS (bagian 4) dan backup (bagian 6) sama untuk keduanya.

## 1. Prasyarat di VPS

```bash
# Bun
curl -fsSL https://bun.sh/install | bash      # lalu pastikan ~/.bun/bin ada di PATH

# PM2 (via bun) + Nginx + Certbot
bun add -g pm2
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
```

Arahkan DNS: buat A record `school-mgmt.dokiva.id` → IP VPS.

## 2. Ambil kode & konfigurasi

```bash
sudo mkdir -p /var/www/school-mgmt && sudo chown -R $USER:$USER /var/www/school-mgmt
cd /var/www/school-mgmt
# salin project ke sini (git clone / rsync / scp), lalu:
bun install

# buat .env produksi (JANGAN commit) — minimal:
cat > .env <<'EOF'
DB_PATH=./data/app.db
UPLOAD_DIR=./uploads
INITIAL_BALANCE=186000000
FUND_NAME=Kuliah Adik
APP_PASSWORD=GANTI-password-kuat
SESSION_SECRET=GANTI-string-acak-panjang-rahasia
EOF

bun run build
```

> `SESSION_SECRET` acak: `openssl rand -hex 32`

## 3. Jalankan dengan PM2

```bash
pm2 start ecosystem.config.cjs
pm2 save                 # simpan daftar proses
pm2 startup              # ikuti perintah yang ditampilkan agar auto-start saat reboot
pm2 logs school-mgmt     # cek log
```

Cek lokal: `curl -I http://127.0.0.1:3004/login` → harus `200`.

> Jika PM2 tak menemukan bun, set `BUN_PATH` (mis. `BUN_PATH=$(which bun) pm2 start ecosystem.config.cjs`)
> atau edit konstanta `BUN` di `ecosystem.config.cjs`.

## 4. Nginx + HTTPS

```bash
sudo cp deploy/nginx/school-mgmt.dokiva.id.conf /etc/nginx/sites-available/school-mgmt.dokiva.id
sudo ln -s /etc/nginx/sites-available/school-mgmt.dokiva.id /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Terbitkan sertifikat + aktifkan HTTPS otomatis
sudo certbot --nginx -d school-mgmt.dokiva.id
```

Buka https://school-mgmt.dokiva.id → login dengan `APP_PASSWORD`, lalu ganti password
lewat menu **Pengaturan**.

## 5. Update versi baru

```bash
cd /var/www/school-mgmt
git pull            # atau rsync kode terbaru
bun install
bun run build
pm2 reload school-mgmt
```

## 6. Backup (manual)

```bash
cp -r data/    /backup/school-mgmt/data-$(date +%F)
cp -r uploads/ /backup/school-mgmt/uploads-$(date +%F)
```

Cukup `data/` (database) + `uploads/` (kuitansi). Sama persis untuk jalur Docker —
kedua folder itu dipasang sebagai bind mount, jadi tetap terlihat dari host.

---

## 7. Alternatif: jalankan dengan Docker Compose

Pengganti bagian 1–3 dan 5 (PM2). Nginx + certbot di host tetap dipakai apa adanya:
container hanya mendengarkan `127.0.0.1:3004`, yaitu upstream yang sudah ditunjuk
`deploy/nginx/school-mgmt.dokiva.id.conf`.

Berkasnya: [`Dockerfile`](Dockerfile), [`compose.yml`](compose.yml), [`.dockerignore`](.dockerignore).

### 7.1 Prasyarat

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER      # logout/login agar berlaku
```

Bun dan PM2 **tidak perlu** diinstal di host pada jalur ini.

### 7.2 Konfigurasi & izin folder

```bash
cd /var/www/school-mgmt
cp .env.example .env && nano .env          # isi APP_PASSWORD & SESSION_SECRET
# SESSION_SECRET acak: openssl rand -hex 32

mkdir -p data uploads
sudo chown -R 1000:1000 data uploads       # container jalan sebagai user `bun` (uid 1000)
```

`DB_PATH=./data/app.db` dan `UPLOAD_DIR=./uploads` di `.env` dipakai apa adanya —
cwd container adalah `/app`, dan kedua folder itu di-mount ke sana.

### 7.3 Jalankan

```bash
# Kalau sebelumnya pakai PM2, matikan dulu supaya port 3004 tidak bentrok:
pm2 delete school-mgmt

docker compose up -d --build
docker compose ps                  # STATUS harus "healthy" setelah ~20 detik
docker compose logs -f app
```

Cek lokal: `curl -I http://127.0.0.1:3004/login` → harus `200`.

> Image di-build **di VPS**, bukan di laptop lalu dikirim: binary Bun dan
> `@next/swc` bersifat native per arsitektur. Kalau memang mau build di laptop
> Apple Silicon untuk VPS x86, pakai `docker buildx build --platform linux/amd64`.

### 7.4 Update versi baru

```bash
cd /var/www/school-mgmt
git pull
docker compose up -d --build       # build ulang + ganti container
docker image prune -f              # buang image lama
```

Disk yang perlu diawasi bukan image-nya (562 MB), tapi **build cache** — satu kali
build saja menyisakan ~2,9 GB. Cek dan bersihkan berkala:

```bash
docker system df                   # lihat baris "Build Cache"
docker builder prune -af           # buang semua cache (build berikutnya lebih lama)
```

`restart: unless-stopped` membuat container hidup lagi otomatis setelah reboot VPS —
tidak perlu `pm2 startup`.

### 7.5 Hal yang perlu diingat

- **Jangan `docker compose up --scale app=2`.** SQLite satu file, satu penulis;
  dua container yang menulis bersamaan bisa merusak database.
- **`TZ=Asia/Jakarta` di `compose.yml` jangan dihapus.** Jam pada audit log
  dirender di server (`lib/format.ts` → `tanggalWaktu`); tanpa itu container
  memakai UTC dan jam tampil mundur 7 jam.
- Kalau server action (simpan/hapus transaksi) gagal dengan error origin,
  periksa `proxy_set_header X-Forwarded-Host $host;` masih ada di config Nginx —
  Next.js 15 mencocokkan header `Origin` dengan nilai itu.
- Masuk ke container: `docker compose exec app sh`.

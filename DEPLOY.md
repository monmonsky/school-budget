# Deploy ke VPS — school-mgmt.dokiva.id

Stack: Next.js 15 + bun:sqlite, dijalankan di runtime **Bun**, dikelola **PM2**,
di-proxy oleh **Nginx** dengan HTTPS Let's Encrypt.

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

Cukup `data/` (database) + `uploads/` (kuitansi).

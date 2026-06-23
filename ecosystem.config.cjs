// PM2 ecosystem — menjalankan Next.js di runtime Bun (bun:sqlite butuh Bun).
// Jalankan dari root project:  pm2 start ecosystem.config.cjs
//
// Catatan:
// - Secret & konfigurasi (DB_PATH, UPLOAD_DIR, APP_PASSWORD, SESSION_SECRET, dll)
//   diletakkan di file `.env` pada root project (TIDAK di-commit). Bun memuatnya otomatis.
// - SQLite = satu file, jadi pakai 1 instance (fork), JANGAN cluster.

const path = require("path");
const os = require("os");

// Lokasi binary bun. Jika bukan di ~/.bun/bin/bun, ganti dengan hasil `which bun`.
const BUN = process.env.BUN_PATH || path.join(os.homedir(), ".bun", "bin", "bun");

module.exports = {
  apps: [
    {
      name: "school-mgmt",
      script: BUN,
      interpreter: "none",            // jalankan binary bun langsung
      args: "--bun next start -p 3004",
      cwd: __dirname,                 // root project (DB_PATH relatif dihitung dari sini)
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      max_memory_restart: "400M",
      out_file: "./logs/out.log",
      error_file: "./logs/err.log",
      merge_logs: true,
      time: true,
      env: {
        NODE_ENV: "production",
        PORT: "3004",
        // Sisanya (DB_PATH, UPLOAD_DIR, INITIAL_BALANCE, FUND_NAME,
        // APP_PASSWORD, SESSION_SECRET) diambil dari `.env` di root project.
      },
    },
  ],
};

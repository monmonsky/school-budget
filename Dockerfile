# syntax=docker/dockerfile:1
#
# Next.js 15 di runtime Bun (wajib Bun — lib/db.ts memakai `bun:sqlite`).
# State (database + kuitansi) TIDAK disimpan di image, melainkan di volume:
#   /app/data     -> app.db
#   /app/uploads  -> file kuitansi
# Lihat compose.yml.

# ---- 1. Dependensi lengkap (termasuk devDeps: tailwind, postcss, typescript) ----
FROM oven/bun:1.3-slim AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ---- 2. Build Next.js ----
FROM oven/bun:1.3-slim AS builder
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Tidak ada secret yang diperlukan di sini: lib/auth.ts melewati validasi
# SESSION_SECRET saat NEXT_PHASE=phase-production-build.
RUN bun --bun next build

# ---- 3. Dependensi produksi saja (next, react, bcryptjs) ----
FROM oven/bun:1.3-slim AS prod-deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
# Pangkas ~290 MB yang tidak dipakai saat runtime:
# - @next/swc-*: compiler native, hanya dibutuhkan `next build` (sudah selesai di
#   stage 2). `next start` menyajikan hasil build, tidak pernah mengompilasi.
# - @img/sharp: hanya untuk optimasi next/image — app ini tidak memakai next/image.
RUN rm -rf node_modules/@next/swc-* node_modules/@img node_modules/sharp

# ---- 4. Runtime ----
FROM oven/bun:1.3-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3004 \
    TZ=Asia/Jakarta

COPY --from=prod-deps --chown=bun:bun /app/node_modules ./node_modules
COPY --from=builder   --chown=bun:bun /app/.next        ./.next
COPY --chown=bun:bun package.json next.config.mjs ./

# Mount point. DB_PATH & UPLOAD_DIR di .env bersifat relatif (./data, ./uploads)
# dan cwd container adalah /app, jadi .env yang sama dipakai apa adanya.
RUN mkdir -p data uploads && chown bun:bun data uploads
USER bun

EXPOSE 3004

# /login selalu 200 tanpa sesi — penanda sehat yang murah. Pakai `bun -e`
# supaya image tetap slim (tanpa curl/wget).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:3004/login').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"

# Jalankan binary next langsung agar SIGTERM dari `docker stop` diterima PID 1
# (penting untuk SQLite: shutdown bersih, WAL ter-checkpoint).
CMD ["bun", "node_modules/next/dist/bin/next", "start", "-p", "3004"]

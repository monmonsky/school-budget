export function rupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

export function rupiahShort(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `Rp${(n / 1_000_000_000).toFixed(1)} M`;
  if (abs >= 1_000_000) return `Rp${(n / 1_000_000).toFixed(1)} jt`;
  if (abs >= 1_000) return `Rp${(n / 1_000).toFixed(0)} rb`;
  return rupiah(n);
}

export function tanggal(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso.length <= 10 ? iso + "T00:00:00" : iso);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function tanggalWaktu(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

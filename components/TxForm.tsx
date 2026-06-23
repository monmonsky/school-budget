"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Category = { id: number; name: string; type: "in" | "out" };
type Semester = { id: number; name: string };
type Defaults = {
  type?: "in" | "out";
  amount?: number;
  date?: string;
  category_id?: number | null;
  semester_id?: number | null;
  note?: string | null;
};

function formatThousands(digits: string): string {
  const n = digits.replace(/[^\d]/g, "");
  if (!n) return "";
  return new Intl.NumberFormat("id-ID").format(parseInt(n, 10));
}

export default function TxForm({
  action,
  categories,
  semesters,
  defaults = {},
  submitLabel = "Simpan",
}: {
  action: (formData: FormData) => void | Promise<void>;
  categories: Category[];
  semesters: Semester[];
  defaults?: Defaults;
  submitLabel?: string;
}) {
  const router = useRouter();
  const [type, setType] = useState<"in" | "out">(defaults.type ?? "out");
  const [amount, setAmount] = useState(
    defaults.amount ? formatThousands(String(defaults.amount)) : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const cats = categories.filter((c) => c.type === type);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await action(new FormData(e.currentTarget));
    } catch (err) {
      // redirect() melempar NEXT_REDIRECT — itu sukses, jangan tampilkan
      const msg = err instanceof Error ? err.message : "Gagal menyimpan";
      if (msg.includes("NEXT_REDIRECT")) return;
      setError(msg);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4">
      {/* Jenis */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setType("out")}
          className={`btn ${type === "out" ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-600"}`}
        >
          Pengeluaran
        </button>
        <button
          type="button"
          onClick={() => setType("in")}
          className={`btn ${type === "in" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}
        >
          Dana Masuk
        </button>
      </div>
      <input type="hidden" name="type" value={type} />

      <div>
        <label className="label">Jumlah (Rp)</label>
        <input
          name="amount"
          inputMode="numeric"
          required
          className="input text-lg font-semibold"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(formatThousands(e.target.value))}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Tanggal</label>
          <input
            type="date"
            name="date"
            required
            defaultValue={defaults.date ?? new Date().toISOString().slice(0, 10)}
            className="input"
          />
        </div>
        <div>
          <label className="label">Kategori</label>
          <select
            name="category_id"
            required
            defaultValue={defaults.category_id ?? ""}
            className="input"
          >
            <option value="">Pilih…</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">
          Semester {type === "out" && <span className="text-rose-500">*</span>}
          {type === "in" && <span className="text-slate-400"> (opsional)</span>}
        </label>
        <select
          name="semester_id"
          required={type === "out"}
          defaultValue={defaults.semester_id ?? ""}
          className="input"
        >
          <option value="">{type === "out" ? "Pilih…" : "—"}</option>
          {semesters.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Catatan (opsional)</label>
        <textarea
          name="note"
          rows={2}
          defaultValue={defaults.note ?? ""}
          className="input"
          placeholder="mis. pembayaran UKT semester ganjil"
        />
      </div>

      <div>
        <label className="label">Kuitansi (boleh lebih dari satu)</label>
        <input
          type="file"
          name="attachments"
          multiple
          accept="image/png,image/jpeg,image/webp,application/pdf"
          className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-700"
        />
        <p className="mt-1 text-xs text-slate-400">JPG, PNG, atau PDF · maks 10 MB per file</p>
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="btn-primary flex-1">
          {busy ? "Menyimpan…" : submitLabel}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-ghost">
          Batal
        </button>
      </div>
    </form>
  );
}

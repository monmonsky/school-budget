"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconArrowDownLeft, IconArrowUpRight } from "@/components/icons";

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
  const numeric = digits.replace(/[^\d]/g, "");
  if (!numeric) return "";
  return new Intl.NumberFormat("id-ID").format(parseInt(numeric, 10));
}

const THUMBNAIL_MAX_EDGE = 640;

/**
 * Shrink a receipt photo into a small preview, in the browser.
 *
 * The original upload is left untouched — it is the payment evidence. This
 * only spares the gallery from loading several megabytes per tile. Returns
 * null for anything that is not an image, or when the browser cannot do it;
 * the gallery then falls back to the original file.
 */
async function createThumbnail(file: File): Promise<File | null> {
  if (!file.type.startsWith("image/")) return null;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, THUMBNAIL_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.72)
    );
    return blob ? new File([blob], "thumb.jpg", { type: "image/jpeg" }) : null;
  } catch {
    return null;
  }
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
  const [isSubmitting, setSubmitting] = useState(false);

  const availableCategories = categories.filter((category) => category.type === type);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const formData = new FormData(event.currentTarget);

      // Previews travel as thumb_<index>, matching the order of "attachments".
      const files = formData
        .getAll("attachments")
        .filter((entry): entry is File => entry instanceof File);
      for (const [index, file] of files.entries()) {
        if (file.size === 0) continue;
        const thumbnail = await createThumbnail(file);
        if (thumbnail) formData.append(`thumb_${index}`, thumbnail);
      }

      await action(formData);
    } catch (err) {
      // redirect() throws NEXT_REDIRECT on success — never surface that.
      const message = err instanceof Error ? err.message : "Gagal menyimpan";
      if (message.includes("NEXT_REDIRECT")) return;
      setError(message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card divide-y divide-rule">
      {/* Type drives which categories appear and whether semester is required. */}
      <fieldset className="p-5 sm:p-6">
        <legend className="label">Jenis transaksi</legend>
        <div className="grid grid-cols-2 overflow-hidden rounded-control border border-rule-strong">
          <button
            type="button"
            onClick={() => setType("out")}
            aria-pressed={type === "out"}
            className={`flex cursor-pointer items-center justify-center gap-2 border-r border-rule-strong px-4 py-2.5 font-display text-sm font-medium transition-colors duration-150 ${
              type === "out"
                ? "bg-oxide text-paper-card"
                : "bg-paper-card text-ink-faint hover:bg-paper-sunk"
            }`}
          >
            <IconArrowUpRight className="h-4 w-4" />
            Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => setType("in")}
            aria-pressed={type === "in"}
            className={`flex cursor-pointer items-center justify-center gap-2 px-4 py-2.5 font-display text-sm font-medium transition-colors duration-150 ${
              type === "in"
                ? "bg-ledger text-paper-card"
                : "bg-paper-card text-ink-faint hover:bg-paper-sunk"
            }`}
          >
            <IconArrowDownLeft className="h-4 w-4" />
            Dana masuk
          </button>
        </div>
        <input type="hidden" name="type" value={type} />
      </fieldset>

      {/* Amount is the most important field, so it gets its own band. */}
      <div className="bg-paper-sunk/50 p-5 sm:p-6">
        <label className="label" htmlFor="tx-amount">
          Jumlah
        </label>
        <div className="relative">
          <span className="num pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-ink-faint">
            Rp
          </span>
          <input
            id="tx-amount"
            name="amount"
            inputMode="numeric"
            required
            className="input num py-3 pl-12 text-2xl font-semibold"
            placeholder="0"
            value={amount}
            onChange={(event) => setAmount(formatThousands(event.target.value))}
          />
        </div>
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="tx-date">
              Tanggal
            </label>
            <input
              id="tx-date"
              type="date"
              name="date"
              required
              defaultValue={defaults.date ?? new Date().toISOString().slice(0, 10)}
              className="input num"
            />
          </div>
          <div>
            <label className="label" htmlFor="tx-category">
              Kategori
            </label>
            <select
              id="tx-category"
              name="category_id"
              required
              defaultValue={defaults.category_id ?? ""}
              className="input"
            >
              <option value="">Pilih kategori</option>
              {availableCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="tx-semester">
            Semester{" "}
            {type === "out" ? (
              <span className="text-oxide">wajib</span>
            ) : (
              <span className="text-ink-faint/70">opsional</span>
            )}
          </label>
          <select
            id="tx-semester"
            name="semester_id"
            required={type === "out"}
            defaultValue={defaults.semester_id ?? ""}
            className="input"
          >
            <option value="">{type === "out" ? "Pilih semester" : "Tanpa semester"}</option>
            {semesters.map((semester) => (
              <option key={semester.id} value={semester.id}>
                {semester.name}
              </option>
            ))}
          </select>
          {type === "out" && (
            <p className="mt-1.5 text-xs text-ink-faint">
              Pengeluaran perlu semester supaya masuk hitungan rekap dan meter dana.
            </p>
          )}
        </div>

        <div>
          <label className="label" htmlFor="tx-note">
            Catatan <span className="text-ink-faint/70">opsional</span>
          </label>
          <textarea
            id="tx-note"
            name="note"
            rows={2}
            defaultValue={defaults.note ?? ""}
            className="input"
            placeholder="mis. pembayaran UKT semester ganjil"
          />
        </div>

        <div>
          <label className="label" htmlFor="tx-files">
            Kuitansi <span className="text-ink-faint/70">boleh lebih dari satu</span>
          </label>
          <input
            id="tx-files"
            type="file"
            name="attachments"
            multiple
            accept="image/png,image/jpeg,image/webp,application/pdf"
            className="block w-full cursor-pointer rounded-control border border-dashed border-rule-strong bg-paper-card p-3 text-sm text-ink-faint file:mr-3 file:cursor-pointer file:rounded-control file:border-0 file:bg-ink file:px-3 file:py-1.5 file:font-display file:text-xs file:font-medium file:text-paper-card hover:file:bg-ink-soft"
          />
          <p className="mt-1.5 text-xs text-ink-faint">
            JPG, PNG, atau PDF · maks 10 MB per file
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-control border border-oxide/25 bg-oxide-soft px-3 py-2 text-sm text-oxide"
          >
            {error}
          </p>
        )}
      </div>

      <div className="flex gap-2 bg-paper-sunk/50 p-5 sm:p-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary flex-1 sm:flex-none"
        >
          {isSubmitting ? "Menyimpan…" : submitLabel}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-ghost">
          Batal
        </button>
      </div>
    </form>
  );
}

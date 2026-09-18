"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconFileText,
  IconTrash,
  IconX,
} from "@/components/icons";

export type Receipt = {
  id: number;
  fileName: string;
  mimeType: string;
  /** Server action already bound to the attachment id and transaction id. */
  deleteAction: () => void | Promise<void>;
};

const isPdf = (mimeType: string) => mimeType === "application/pdf";
const fileUrl = (id: number) => `/api/attachments/${id}`;
// Falls back to the original file server-side when no preview was generated.
const thumbUrl = (id: number) => `/api/attachments/${id}?size=thumb`;

export default function ReceiptGallery({ receipts }: { receipts: Receipt[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => {
    setOpenIndex((current) => {
      // Return focus to the thumbnail that opened the lightbox.
      if (current !== null) queueMicrotask(() => thumbRefs.current[current]?.focus());
      return null;
    });
  }, []);

  const step = useCallback(
    (delta: 1 | -1) =>
      setOpenIndex((current) =>
        current === null ? null : (current + delta + receipts.length) % receipts.length
      ),
    [receipts.length]
  );

  useEffect(() => {
    if (openIndex === null) return;

    dialogRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
      else if (event.key === "ArrowRight") step(1);
      else if (event.key === "ArrowLeft") step(-1);
    }
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [openIndex, close, step]);

  if (receipts.length === 0) {
    return (
      <p className="px-5 py-6 text-center text-sm text-ink-faint">
        Belum ada bukti terlampir. Tambahkan lewat tombol Ubah transaksi.
      </p>
    );
  }

  const active = openIndex === null ? null : receipts[openIndex];

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
        {receipts.map((receipt, index) => (
          <li key={receipt.id} className="group relative">
            <button
              type="button"
              ref={(element) => {
                thumbRefs.current[index] = element;
              }}
              onClick={() => setOpenIndex(index)}
              className="block w-full cursor-pointer overflow-hidden rounded-control border border-rule-strong bg-paper-sunk transition-colors duration-150 hover:border-ink"
            >
              <span className="flex aspect-[4/3] items-center justify-center overflow-hidden">
                {isPdf(receipt.mimeType) ? (
                  <span className="flex flex-col items-center gap-1.5 text-ink-faint">
                    <IconFileText className="h-7 w-7" />
                    <span className="font-display text-[10px] font-semibold uppercase tracking-[0.1em]">
                      PDF
                    </span>
                  </span>
                ) : (
                  <img
                    src={thumbUrl(receipt.id)}
                    alt={`Kuitansi ${receipt.fileName}`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                )}
              </span>
              <span className="block truncate border-t border-rule bg-paper-card px-2.5 py-1.5 text-left text-xs text-ink-soft">
                {receipt.fileName}
              </span>
            </button>

            {/* Delete control: revealed on hover, and on keyboard focus. */}
            <form
              action={receipt.deleteAction}
              onSubmit={(event) => {
                if (!confirm(`Hapus lampiran ${receipt.fileName}?`)) event.preventDefault();
              }}
              className="absolute right-1.5 top-1.5"
            >
              <button
                type="submit"
                aria-label={`Hapus lampiran ${receipt.fileName}`}
                className="cursor-pointer rounded-control bg-paper-card/90 p-1.5 text-ink-faint opacity-0 shadow-card backdrop-blur transition duration-150 hover:bg-oxide hover:text-paper-card focus-visible:opacity-100 group-hover:opacity-100"
              >
                <IconTrash className="h-3.5 w-3.5" />
              </button>
            </form>
          </li>
        ))}
      </ul>

      {active && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Kuitansi ${active.fileName}`}
          tabIndex={-1}
          className="fixed inset-0 z-50 flex flex-col bg-ink/90 outline-none backdrop-blur-sm"
        >
          {/* Backdrop click closes the lightbox. */}
          <button
            type="button"
            aria-label="Tutup pratinjau"
            onClick={close}
            className="absolute inset-0 h-full w-full cursor-zoom-out"
          />

          <header className="relative flex items-center gap-3 px-4 py-3 sm:px-6">
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-medium text-paper-card">
                {active.fileName}
              </p>
              {receipts.length > 1 && (
                <p className="num mt-0.5 text-xs text-paper/50">
                  {openIndex! + 1} dari {receipts.length}
                </p>
              )}
            </div>
            <a
              href={fileUrl(active.id)}
              download={active.fileName}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-control px-2.5 py-2 font-display text-xs font-medium text-paper/70 transition-colors duration-150 hover:bg-white/10 hover:text-paper-card"
            >
              <IconDownload className="h-4 w-4" />
              <span className="hidden sm:inline">Unduh</span>
            </a>
            <button
              type="button"
              onClick={close}
              aria-label="Tutup pratinjau"
              className="cursor-pointer rounded-control p-2 text-paper/70 transition-colors duration-150 hover:bg-white/10 hover:text-paper-card"
            >
              <IconX className="h-5 w-5" />
            </button>
          </header>

          <div className="pointer-events-none relative flex flex-1 items-center justify-center px-4 pb-6 sm:px-16">
            {isPdf(active.mimeType) ? (
              <iframe
                src={fileUrl(active.id)}
                title={active.fileName}
                className="pointer-events-auto h-full w-full max-w-4xl rounded-control border border-white/10 bg-paper-card"
              />
            ) : (
              <img
                src={fileUrl(active.id)}
                alt={`Kuitansi ${active.fileName}`}
                className="pointer-events-auto max-h-full max-w-full rounded-control object-contain shadow-raised"
              />
            )}
          </div>

          {receipts.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Kuitansi sebelumnya"
                className="absolute left-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-control bg-ink/60 p-2.5 text-paper/70 transition-colors duration-150 hover:bg-ink hover:text-paper-card sm:left-4"
              >
                <IconChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Kuitansi berikutnya"
                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-control bg-ink/60 p-2.5 text-paper/70 transition-colors duration-150 hover:bg-ink hover:text-paper-card sm:right-4"
              >
                <IconChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}

import type { FundMeter as FundMeterData } from "@/lib/queries";
import { rupiah } from "@/lib/format";

/**
 * The fund meter — the signature element of this app.
 *
 * Tuition money is one finite pot that drains, not a number that grows. So the
 * headline is not a rising chart but how much of the pot has been consumed: the
 * spent portion is filled in per semester, and what remains is hatched, like an
 * unopened section of a paper ledger.
 */

// Brass to oxide ramp. Older semesters read lighter, newer ones darker.
const SEGMENT_COLORS = ["#CBA463", "#BE8E42", "#B08430", "#A6702F", "#A4552C", "#A0402C"];

export default function FundMeter({ data }: { data: FundMeterData }) {
  const { capacity, spent, remaining, spentRatio, segments, avgPerSemester, semestersLeft } =
    data;
  const remainingPercent = capacity > 0 ? Math.round((remaining / capacity) * 100) : 0;

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 p-5 pb-4 sm:p-6 sm:pb-5">
        <div>
          <p className="eyebrow">Sisa dana</p>
          <p className="num mt-1.5 text-3xl font-semibold tracking-tight text-ink sm:text-[2.5rem] sm:leading-none">
            {rupiah(remaining)}
          </p>
          <p className="mt-2 text-sm text-ink-faint">
            dari <span className="num">{rupiah(capacity)}</span> total dana
          </p>
        </div>
        <div className="text-right">
          <p className="num text-2xl font-semibold text-brass-ink">{remainingPercent}%</p>
          <p className="eyebrow mt-0.5">Belum terpakai</p>
        </div>
      </div>

      <div className="px-5 sm:px-6">
        <div
          role="img"
          aria-label={`Sisa dana ${rupiah(remaining)} dari ${rupiah(capacity)}, ${remainingPercent} persen belum terpakai.`}
          className="flex h-9 w-full overflow-hidden rounded-control border border-rule-strong bg-paper-card"
        >
          {segments.map((segment, index) => (
            <div
              key={segment.id ?? `unassigned-${index}`}
              title={`${segment.name} · ${rupiah(segment.total)}`}
              style={{
                width: `${capacity > 0 ? (segment.total / capacity) * 100 : 0}%`,
                minWidth: "3px",
                backgroundColor: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
              }}
              className="border-r border-paper-card/70 last:border-r-0"
            />
          ))}
          {/* Remaining funds are hatched rather than left blank: "not yet opened". */}
          <div
            style={{ width: `${Math.max(0, (1 - spentRatio) * 100)}%` }}
            className="bg-hatch"
          />
        </div>
        <div className="mt-1.5 flex justify-between">
          <span className="num text-[11px] text-ink-faint">{rupiah(0)}</span>
          <span className="num text-[11px] text-ink-faint">{rupiah(capacity)}</span>
        </div>
      </div>

      {/* Legend — the figures stay readable without relying on colour alone. */}
      {segments.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 px-5 sm:px-6">
          {segments.map((segment, index) => (
            <li
              key={segment.id ?? `unassigned-${index}`}
              className="flex items-center gap-2 text-sm"
            >
              <span
                aria-hidden="true"
                style={{ backgroundColor: SEGMENT_COLORS[index % SEGMENT_COLORS.length] }}
                className="h-2.5 w-2.5 shrink-0 rounded-[1px]"
              />
              <span className="text-ink-soft">{segment.name}</span>
              <span className="num font-medium text-ink">{rupiah(segment.total)}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-5 border-t border-rule bg-paper-sunk/60 px-5 py-3 text-sm text-ink-soft sm:px-6">
        {semestersLeft === null ? (
          <>Catat pengeluaran pertama untuk melihat perkiraan daya tahan dana.</>
        ) : (
          <>
            Rata-rata <span className="num font-medium text-ink">{rupiah(avgPerSemester)}</span>{" "}
            per semester. Dengan laju ini dana cukup untuk sekitar{" "}
            <span className="num font-medium text-ink">{semestersLeft.toFixed(1)}</span>{" "}
            semester lagi.
          </>
        )}
      </p>

      <p className="sr-only">
        Total terpakai {rupiah(spent)} dari {rupiah(capacity)}.
      </p>
    </section>
  );
}

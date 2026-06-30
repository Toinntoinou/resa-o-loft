"use client";

import type { DayAvailability } from "@/lib/availability";
import { formatMonthYear } from "@/lib/dates";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

type Props = {
  monthCursor: string; // "YYYY-MM-01"
  days: Map<string, DayAvailability>;
  selected: string | null;
  onSelect: (key: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  canGoPrev: boolean;
  loading: boolean;
};

const STATUS_DOT: Record<string, string> = {
  available: "bg-emerald-500",
  limited: "bg-amber-500",
};

export function Calendar({
  monthCursor,
  days,
  selected,
  onSelect,
  onPrevMonth,
  onNextMonth,
  canGoPrev,
  loading,
}: Props) {
  const [y, m] = monthCursor.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const firstWeekday = (new Date(y, m - 1, 1).getDay() + 6) % 7; // lundi = 0

  const cells: (string | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(`${y}-${pad(m)}-${pad(d)}`);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onPrevMonth}
          disabled={!canGoPrev}
          aria-label="Mois précédent"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-600 ring-1 ring-inset ring-stone-200 transition-colors hover:bg-stone-50 disabled:opacity-30"
        >
          ‹
        </button>
        <div className="text-sm font-semibold capitalize text-stone-900">
          {formatMonthYear(monthCursor)}
        </div>
        <button
          type="button"
          onClick={onNextMonth}
          aria-label="Mois suivant"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-600 ring-1 ring-inset ring-stone-200 transition-colors hover:bg-stone-50"
        >
          ›
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w, i) => (
          <div
            key={i}
            className="py-1 text-center text-xs font-medium text-stone-400"
          >
            {w}
          </div>
        ))}
      </div>

      <div
        className={`grid grid-cols-7 gap-1 transition-opacity ${
          loading ? "opacity-40" : "opacity-100"
        }`}
      >
        {cells.map((key, i) => {
          if (!key) return <div key={`b${i}`} />;
          const day = days.get(key);
          const isSelected = selected === key;
          const dayNum = Number(key.split("-")[2]);
          const bookable = day?.bookable ?? false;
          const dot = day ? STATUS_DOT[day.status] : undefined;

          return (
            <button
              key={key}
              type="button"
              disabled={!bookable}
              onClick={() => onSelect(key)}
              title={
                day?.closed
                  ? day.closureReason ?? "Fermé"
                  : day?.status === "full"
                    ? "Complet"
                    : undefined
              }
              className={[
                "relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-colors",
                isSelected
                  ? "bg-brand-600 font-semibold text-white"
                  : bookable
                    ? "text-stone-800 ring-1 ring-inset ring-stone-200 hover:bg-brand-50 hover:ring-brand-200"
                    : "text-stone-300",
              ].join(" ")}
            >
              <span>{dayNum}</span>
              {!isSelected && dot && (
                <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${dot}`} />
              )}
              {!isSelected && day && !bookable && day.status === "full" && (
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-stone-300" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Disponible
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500" /> Bientôt complet
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-stone-300" /> Complet / fermé
        </span>
      </div>
    </div>
  );
}

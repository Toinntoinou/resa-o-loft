"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DayAvailability } from "@/lib/availability";
import { Calendar } from "./Calendar";
import {
  SLOT_LABELS,
  SLOT_HOURS,
  SLOT_PRICES,
  formatPrice,
  type Slot,
} from "@/lib/config";
import { formatLong, todayKey } from "@/lib/dates";

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n);
}
function firstOfMonth(key: string) {
  const [y, m] = key.split("-");
  return `${y}-${m}-01`;
}
function shiftMonth(cursor: string, delta: number) {
  const [y, m] = cursor.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
}

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  company: "",
  phone: "",
  notes: "",
};

type Confirmation = {
  reference: string;
  date: string;
  slot: Slot;
  firstName: string;
  emailSent: boolean;
};

const SLOT_ORDER: Slot[] = ["MORNING", "AFTERNOON", "FULL_DAY"];

export function BookingApp() {
  const today = useMemo(() => todayKey(), []);
  const currentMonth = useMemo(() => firstOfMonth(today), [today]);

  const [monthCursor, setMonthCursor] = useState(currentMonth);
  const [daysMap, setDaysMap] = useState<Map<string, DayAvailability>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const loadMonth = useCallback(async (cursor: string) => {
    setLoading(true);
    const [y, m] = cursor.split("-").map(Number);
    const from = `${y}-${pad(m)}-01`;
    const last = new Date(y, m, 0).getDate();
    const to = `${y}-${pad(m)}-${pad(last)}`;
    try {
      const res = await fetch(
        `/api/availability/range?from=${from}&to=${to}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      const map = new Map<string, DayAvailability>();
      if (Array.isArray(data.days)) {
        for (const d of data.days as DayAvailability[]) map.set(d.date, d);
      }
      setDaysMap(map);
    } catch {
      setDaysMap(new Map());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMonth(monthCursor);
  }, [monthCursor, loadMonth]);

  const selectedDay = selected ? (daysMap.get(selected) ?? null) : null;

  const slotOptions = useMemo(() => {
    if (!selectedDay) return [];
    const remainingBySlot: Record<Slot, number> = {
      MORNING: selectedDay.morningRemaining,
      AFTERNOON: selectedDay.afternoonRemaining,
      FULL_DAY: selectedDay.fullDayRemaining,
    };
    return SLOT_ORDER.filter((s) =>
      s === "FULL_DAY" ? selectedDay.allowFullDay : selectedDay.allowHalfDay,
    ).map((s) => ({
      slot: s,
      remaining: remainingBySlot[s],
      enabled: remainingBySlot[s] > 0,
    }));
  }, [selectedDay]);

  function handleSelectDate(key: string) {
    setSelected(key);
    setSlot(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !slot) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selected, slot, ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        if (res.status === 409) {
          setSlot(null);
          loadMonth(monthCursor);
        }
        return;
      }
      setConfirmation({
        reference: data.reservation.reference,
        date: selected,
        slot,
        firstName: form.firstName,
        emailSent: Boolean(data.email?.sent),
      });
    } catch {
      setError("Connexion impossible. Merci de réessayer.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetAll() {
    setConfirmation(null);
    setSelected(null);
    setSlot(null);
    setForm({ ...EMPTY_FORM });
    loadMonth(monthCursor);
  }

  if (confirmation) {
    return (
      <div className="card text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">
          ✓
        </div>
        <h2 className="text-xl font-semibold text-stone-900">
          Réservation confirmée
        </h2>
        <p className="mt-1 text-stone-600">
          Merci {confirmation.firstName} ! Votre poste est réservé.
        </p>

        <div className="mx-auto mt-6 max-w-sm rounded-xl bg-stone-50 p-4 text-left text-sm">
          <Row label="Date" value={capitalize(formatLong(confirmation.date))} />
          <Row
            label="Créneau"
            value={`${SLOT_LABELS[confirmation.slot]} · ${SLOT_HOURS[confirmation.slot]}`}
          />
          <Row label="Tarif" value={formatPrice(SLOT_PRICES[confirmation.slot])} />
          <Row label="Référence" value={confirmation.reference} last />
        </div>

        <p className="mt-4 text-sm text-stone-500">
          {confirmation.emailSent
            ? "Un email de confirmation vient de vous être envoyé."
            : "Conservez votre référence ci-dessus."}
        </p>

        <button onClick={resetAll} className="btn-primary mt-6">
          Faire une autre réservation
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="card">
        <StepTitle n={1} title="Choisissez une date" />
        <div className="mt-4">
          <Calendar
            monthCursor={monthCursor}
            days={daysMap}
            selected={selected}
            onSelect={handleSelectDate}
            onPrevMonth={() => setMonthCursor((c) => shiftMonth(c, -1))}
            onNextMonth={() => setMonthCursor((c) => shiftMonth(c, 1))}
            canGoPrev={monthCursor > currentMonth}
            loading={loading}
          />
        </div>
      </section>

      {selectedDay && (
        <section className="card">
          <StepTitle n={2} title="Choisissez un créneau" />
          <p className="mt-1 text-sm capitalize text-stone-500">
            {formatLong(selectedDay.date)}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {slotOptions.map((opt) => {
              const active = slot === opt.slot;
              return (
                <button
                  key={opt.slot}
                  type="button"
                  disabled={!opt.enabled}
                  onClick={() => {
                    setSlot(opt.slot);
                    setError(null);
                  }}
                  className={[
                    "flex flex-col rounded-xl p-4 text-left transition-colors",
                    active
                      ? "bg-brand-600 text-white ring-2 ring-brand-600"
                      : opt.enabled
                        ? "bg-white text-stone-800 ring-1 ring-inset ring-stone-200 hover:ring-brand-300"
                        : "cursor-not-allowed bg-stone-50 text-stone-300 ring-1 ring-inset ring-stone-100",
                  ].join(" ")}
                >
                  <span className="font-semibold">{SLOT_LABELS[opt.slot]}</span>
                  <span
                    className={`text-xs ${active ? "text-brand-100" : "text-stone-400"}`}
                  >
                    {SLOT_HOURS[opt.slot]}
                  </span>
                  <span
                    className={`mt-1.5 text-sm font-semibold ${active ? "text-white" : "text-brand-700"}`}
                  >
                    {formatPrice(SLOT_PRICES[opt.slot])}
                  </span>
                  <span
                    className={`mt-1 text-xs ${
                      !opt.enabled
                        ? "text-stone-300"
                        : active
                          ? "text-white"
                          : "text-emerald-600"
                    }`}
                  >
                    {opt.enabled
                      ? `${opt.remaining} poste${opt.remaining > 1 ? "s" : ""} restant${opt.remaining > 1 ? "s" : ""}`
                      : "Complet"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {selectedDay && slot && (
        <section className="card">
          <StepTitle n={3} title="Vos coordonnées" />
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Prénom"
                value={form.firstName}
                onChange={(v) => setForm((f) => ({ ...f, firstName: v }))}
                required
                autoComplete="given-name"
              />
              <Field
                label="Nom"
                value={form.lastName}
                onChange={(v) => setForm((f) => ({ ...f, lastName: v }))}
                required
                autoComplete="family-name"
              />
            </div>
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => setForm((f) => ({ ...f, email: v }))}
              required
              autoComplete="email"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Société"
                optional
                value={form.company}
                onChange={(v) => setForm((f) => ({ ...f, company: v }))}
                autoComplete="organization"
              />
              <Field
                label="Téléphone"
                optional
                type="tel"
                value={form.phone}
                onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                autoComplete="tel"
              />
            </div>
            <div>
              <label className="field-label">
                Remarque <span className="text-stone-400">(optionnel)</span>
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                maxLength={500}
                className="field-input"
                placeholder="Une précision pour l'équipe ?"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? "Réservation en cours…" : "Confirmer la réservation"}
            </button>

            <p className="text-center text-xs text-stone-400">
              En confirmant, vous acceptez le traitement de vos données pour la
              gestion de votre réservation.{" "}
              <a
                href="/confidentialite"
                target="_blank"
                className="underline hover:text-stone-600"
              >
                Politique de confidentialité
              </a>
              .
            </p>
          </form>
        </section>
      )}
    </div>
  );
}

function StepTitle({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
        {n}
      </span>
      <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  optional = false,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  optional?: boolean;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="field-label">
        {label}{" "}
        {optional && <span className="text-stone-400">(optionnel)</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        className="field-input"
      />
    </div>
  );
}

function Row({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-4 py-2 ${last ? "" : "border-b border-stone-200"}`}
    >
      <span className="text-stone-500">{label}</span>
      <span className="text-right font-medium text-stone-900">{value}</span>
    </div>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

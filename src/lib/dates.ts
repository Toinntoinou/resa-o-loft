import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Fuseau horaire de l'espace (pour déterminer "aujourd'hui").
export const BUSINESS_TZ = "Europe/Paris";

// Une "clé de jour" est une chaîne "YYYY-MM-DD". Comparable lexicographiquement
// (l'ordre alphabétique == l'ordre chronologique).
export type DateKey = string;

const KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateKey(key: unknown): key is DateKey {
  if (typeof key !== "string" || !KEY_RE.test(key)) return false;
  const [y, m, d] = key.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

function parts(key: DateKey): [number, number, number] {
  const [y, m, d] = key.split("-").map(Number);
  return [y, m, d];
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Date locale à minuit (sert pour l'affichage et le jour de la semaine). */
export function localDateFromKey(key: DateKey): Date {
  const [y, m, d] = parts(key);
  return new Date(y, m - 1, d);
}

/** Date à minuit UTC (sert pour le stockage en base). */
export function utcDateFromKey(key: DateKey): Date {
  const [y, m, d] = parts(key);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Clé "YYYY-MM-DD" depuis une Date stockée en base (minuit UTC). */
export function dateKeyFromUtc(date: Date): DateKey {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate(),
  )}`;
}

function keyFromLocalDate(date: Date): DateKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`;
}

/** Clé du jour courant, dans le fuseau de l'espace. */
export function todayKey(now: Date = new Date()): DateKey {
  // en-CA produit nativement le format "YYYY-MM-DD".
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addDaysKey(key: DateKey, n: number): DateKey {
  const d = localDateFromKey(key);
  d.setDate(d.getDate() + n);
  return keyFromLocalDate(d);
}

export function isWeekendKey(key: DateKey): boolean {
  const day = localDateFromKey(key).getDay(); // 0 = dimanche, 6 = samedi
  return day === 0 || day === 6;
}

/** Liste des clés de jour entre from et to (inclus). */
export function eachDayKey(fromKey: DateKey, toKey: DateKey): DateKey[] {
  const out: DateKey[] = [];
  let cur = fromKey;
  let guard = 0;
  while (cur <= toKey && guard < 1000) {
    out.push(cur);
    cur = addDaysKey(cur, 1);
    guard++;
  }
  return out;
}

// ─── Formatage français ────────────────────────────────────────────
export function formatLong(key: DateKey): string {
  return format(localDateFromKey(key), "EEEE d MMMM yyyy", { locale: fr });
}

export function formatMedium(key: DateKey): string {
  return format(localDateFromKey(key), "d MMM yyyy", { locale: fr });
}

export function formatDayMonth(key: DateKey): string {
  return format(localDateFromKey(key), "d MMM", { locale: fr });
}

export function formatMonthYear(key: DateKey): string {
  return format(localDateFromKey(key), "MMMM yyyy", { locale: fr });
}

import { prisma, getSettings } from "./prisma";
import { RESERVATION_STATUS, type Slot } from "./config";
import {
  type DateKey,
  addDaysKey,
  dateKeyFromUtc,
  eachDayKey,
  isWeekendKey,
  todayKey,
  utcDateFromKey,
} from "./dates";

export type DayStatus =
  | "available"
  | "limited"
  | "full"
  | "closed"
  | "weekend"
  | "past";

export type DayAvailability = {
  date: DateKey;
  capacity: number;
  morningRemaining: number;
  afternoonRemaining: number;
  fullDayRemaining: number;
  allowHalfDay: boolean;
  allowFullDay: boolean;
  closed: boolean;
  closureReason: string | null;
  isPast: boolean;
  isWeekend: boolean;
  beyondHorizon: boolean;
  bookable: boolean;
  status: DayStatus;
};

type SlotCounts = { MORNING: number; AFTERNOON: number; FULL_DAY: number };

function emptyCounts(): SlotCounts {
  return { MORNING: 0, AFTERNOON: 0, FULL_DAY: 0 };
}

function remainingFromCounts(counts: SlotCounts, capacity: number) {
  const morningOcc = counts.MORNING + counts.FULL_DAY;
  const afternoonOcc = counts.AFTERNOON + counts.FULL_DAY;
  const morningRemaining = Math.max(0, capacity - morningOcc);
  const afternoonRemaining = Math.max(0, capacity - afternoonOcc);
  // Un poste "journée" doit être libre matin ET après-midi.
  const fullDayRemaining = Math.min(morningRemaining, afternoonRemaining);
  return { morningRemaining, afternoonRemaining, fullDayRemaining };
}

type Settings = Awaited<ReturnType<typeof getSettings>>;

function buildDay(
  key: DateKey,
  counts: SlotCounts,
  closureReason: string | null,
  settings: Settings,
  today: DateKey,
): DayAvailability {
  const { capacity, allowHalfDay, allowFullDay, openWeekends, maxAdvanceDays } =
    settings;
  const { morningRemaining, afternoonRemaining, fullDayRemaining } =
    remainingFromCounts(counts, capacity);

  const isPast = key < today;
  const weekend = isWeekendKey(key);
  const isClosedByWeekend = weekend && !openWeekends;
  const closed = closureReason !== null || isClosedByWeekend;
  const beyondHorizon = key > addDaysKey(today, maxAdvanceDays);

  const halfAvailable = allowHalfDay && (morningRemaining > 0 || afternoonRemaining > 0);
  const fullAvailable = allowFullDay && fullDayRemaining > 0;
  const anySlotAvailable = halfAvailable || fullAvailable;

  const bookable =
    !isPast && !closed && !beyondHorizon && anySlotAvailable;

  let status: DayStatus;
  if (isPast) status = "past";
  else if (isClosedByWeekend) status = "weekend";
  else if (closureReason !== null || beyondHorizon) status = "closed";
  else if (!anySlotAvailable) status = "full";
  else {
    const lowThreshold = Math.max(1, Math.ceil(capacity * 0.25));
    const bestRemaining = Math.max(morningRemaining, afternoonRemaining);
    status = bestRemaining <= lowThreshold ? "limited" : "available";
  }

  return {
    date: key,
    capacity,
    morningRemaining,
    afternoonRemaining,
    fullDayRemaining,
    allowHalfDay,
    allowFullDay,
    closed,
    closureReason: closureReason,
    isPast,
    isWeekend: weekend,
    beyondHorizon,
    bookable,
    status,
  };
}

/** Disponibilités jour par jour sur une plage [fromKey, toKey] (inclus). */
export async function getAvailabilityRange(
  fromKey: DateKey,
  toKey: DateKey,
): Promise<DayAvailability[]> {
  const settings = await getSettings();
  const today = todayKey();

  const [reservations, closures] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        status: RESERVATION_STATUS.CONFIRMED,
        date: { gte: utcDateFromKey(fromKey), lte: utcDateFromKey(toKey) },
      },
      select: { date: true, slot: true },
    }),
    prisma.closure.findMany({
      where: { date: { gte: utcDateFromKey(fromKey), lte: utcDateFromKey(toKey) } },
      select: { date: true, reason: true },
    }),
  ]);

  const countsByDay = new Map<DateKey, SlotCounts>();
  for (const r of reservations) {
    const key = dateKeyFromUtc(r.date);
    const c = countsByDay.get(key) ?? emptyCounts();
    if (r.slot === "MORNING" || r.slot === "AFTERNOON" || r.slot === "FULL_DAY") {
      c[r.slot as Slot] += 1;
    }
    countsByDay.set(key, c);
  }

  const closureByDay = new Map<DateKey, string | null>();
  for (const c of closures) {
    closureByDay.set(dateKeyFromUtc(c.date), c.reason ?? "Fermé");
  }

  return eachDayKey(fromKey, toKey).map((key) =>
    buildDay(
      key,
      countsByDay.get(key) ?? emptyCounts(),
      closureByDay.has(key) ? closureByDay.get(key) ?? "Fermé" : null,
      settings,
      today,
    ),
  );
}

/** Disponibilité d'un seul jour (source de vérité côté serveur). */
export async function getDayAvailability(key: DateKey): Promise<DayAvailability> {
  const [day] = await getAvailabilityRange(key, key);
  return day;
}

/** Le créneau demandé est-il réservable ce jour-là ? (validation serveur) */
export function canBook(day: DayAvailability, slot: Slot): boolean {
  if (!day.bookable) return false;
  if (slot === "MORNING") return day.allowHalfDay && day.morningRemaining > 0;
  if (slot === "AFTERNOON") return day.allowHalfDay && day.afternoonRemaining > 0;
  if (slot === "FULL_DAY") return day.allowFullDay && day.fullDayRemaining > 0;
  return false;
}

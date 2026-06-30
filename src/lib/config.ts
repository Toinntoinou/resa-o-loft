// Constantes métier partagées (client + serveur).

export const SLOTS = ["MORNING", "AFTERNOON", "FULL_DAY"] as const;
export type Slot = (typeof SLOTS)[number];

export const SLOT_LABELS: Record<Slot, string> = {
  MORNING: "Matin",
  AFTERNOON: "Après-midi",
  FULL_DAY: "Journée",
};

export const SLOT_HOURS: Record<Slot, string> = {
  MORNING: "9h00 – 13h00",
  AFTERNOON: "13h00 – 18h00",
  FULL_DAY: "9h00 – 18h00",
};

export function isSlot(value: unknown): value is Slot {
  return typeof value === "string" && (SLOTS as readonly string[]).includes(value);
}

export const RESERVATION_STATUS = {
  CONFIRMED: "CONFIRMED",
  CANCELLED: "CANCELLED",
} as const;

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Le Loft";
export const SITE_TAGLINE =
  process.env.NEXT_PUBLIC_SITE_TAGLINE ?? "Espace de coworking";

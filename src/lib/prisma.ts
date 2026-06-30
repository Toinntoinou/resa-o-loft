import { PrismaClient } from "@prisma/client";

// Singleton : évite de créer plusieurs connexions lors du hot-reload en dev.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

const DEFAULT_SETTINGS = {
  id: 1,
  capacity: 12,
  allowFullDay: true,
  allowHalfDay: true,
  openWeekends: false,
  maxAdvanceDays: 60,
};

/** Récupère les paramètres (les crée avec les valeurs par défaut si absents). */
export async function getSettings() {
  const existing = await prisma.settings.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  return prisma.settings.create({ data: DEFAULT_SETTINGS });
}

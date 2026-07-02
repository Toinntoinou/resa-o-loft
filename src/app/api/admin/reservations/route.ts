import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api";
import { dateKeyFromUtc, isValidDateKey, utcDateFromKey } from "@/lib/dates";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // CONFIRMED | CANCELLED | all
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const q = searchParams.get("q")?.trim();

  const where: Prisma.ReservationWhereInput = {};
  if (status === "CONFIRMED" || status === "CANCELLED") {
    where.status = status;
  }
  if (isValidDateKey(from) || isValidDateKey(to)) {
    where.date = {};
    if (isValidDateKey(from)) where.date.gte = utcDateFromKey(from);
    if (isValidDateKey(to)) where.date.lte = utcDateFromKey(to);
  }
  if (q) {
    // mode "insensitive" : indispensable sur PostgreSQL (contains y est sensible à la casse).
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { company: { contains: q, mode: "insensitive" } },
      { reference: { contains: q, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.reservation.findMany({
    where,
    orderBy: [{ date: "asc" }, { slot: "asc" }, { createdAt: "asc" }],
    take: 1000,
  });

  const reservations = rows.map((r) => ({
    id: r.id,
    reference: r.reference,
    date: dateKeyFromUtc(r.date),
    slot: r.slot,
    status: r.status,
    firstName: r.firstName,
    lastName: r.lastName,
    email: r.email,
    company: r.company,
    phone: r.phone,
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
  }));

  return NextResponse.json({ reservations });
}

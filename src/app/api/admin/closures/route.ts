import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api";
import {
  dateKeyFromUtc,
  isValidDateKey,
  todayKey,
  utcDateFromKey,
} from "@/lib/dates";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const rows = await prisma.closure.findMany({
    where: { date: { gte: utcDateFromKey(todayKey()) } },
    orderBy: { date: "asc" },
  });
  const closures = rows.map((c) => ({
    id: c.id,
    date: dateKeyFromUtc(c.date),
    reason: c.reason,
  }));
  return NextResponse.json({ closures });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const date =
    body && typeof body === "object" && "date" in body
      ? String((body as { date: unknown }).date)
      : "";
  const reasonRaw =
    body && typeof body === "object" && "reason" in body
      ? String((body as { reason: unknown }).reason ?? "")
      : "";
  const reason = reasonRaw.trim().slice(0, 120) || null;

  if (!isValidDateKey(date)) {
    return NextResponse.json(
      { error: "Date invalide (AAAA-MM-JJ)." },
      { status: 400 },
    );
  }

  const dateUtc = utcDateFromKey(date);
  const closure = await prisma.closure.upsert({
    where: { date: dateUtc },
    update: { reason },
    create: { date: dateUtc, reason },
  });
  return NextResponse.json({
    closure: { id: closure.id, date: dateKeyFromUtc(closure.date), reason: closure.reason },
  });
}

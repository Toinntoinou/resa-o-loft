import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api";
import { SLOT_LABELS, type Slot } from "@/lib/config";
import {
  dateKeyFromUtc,
  formatMedium,
  isValidDateKey,
  utcDateFromKey,
} from "@/lib/dates";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

function csvCell(value: string | null | undefined): string {
  const v = value ?? "";
  return `"${v.replace(/"/g, '""')}"`;
}

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: "Confirmée",
  CANCELLED: "Annulée",
};

export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Prisma.ReservationWhereInput = {};
  if (status === "CONFIRMED" || status === "CANCELLED") where.status = status;
  if (isValidDateKey(from) || isValidDateKey(to)) {
    where.date = {};
    if (isValidDateKey(from)) where.date.gte = utcDateFromKey(from);
    if (isValidDateKey(to)) where.date.lte = utcDateFromKey(to);
  }

  const rows = await prisma.reservation.findMany({
    where,
    orderBy: [{ date: "asc" }, { slot: "asc" }],
  });

  const headers = [
    "Référence",
    "Date",
    "Créneau",
    "Statut",
    "Prénom",
    "Nom",
    "Email",
    "Société",
    "Téléphone",
    "Notes",
    "Réservée le",
  ];

  const lines = [headers.map(csvCell).join(";")];
  for (const r of rows) {
    const key = dateKeyFromUtc(r.date);
    lines.push(
      [
        csvCell(r.reference),
        csvCell(formatMedium(key)),
        csvCell(SLOT_LABELS[r.slot as Slot] ?? r.slot),
        csvCell(STATUS_LABELS[r.status] ?? r.status),
        csvCell(r.firstName),
        csvCell(r.lastName),
        csvCell(r.email),
        csvCell(r.company),
        csvCell(r.phone),
        csvCell(r.notes),
        csvCell(r.createdAt.toISOString().slice(0, 10)),
      ].join(";"),
    );
  }

  // BOM UTF-8 pour qu'Excel affiche correctement les accents.
  const csv = "﻿" + lines.join("\r\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reservations-le-loft.csv"`,
    },
  });
}

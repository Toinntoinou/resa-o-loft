import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LEGAL } from "@/lib/legal";

export const dynamic = "force-dynamic";

// Purge RGPD : supprime les réservations dont la date est antérieure
// à la durée de conservation (par défaut 24 mois). Déclenché par Vercel Cron.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (req.headers.get("authorization") !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }
  }

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - LEGAL.retentionMonths);

  const result = await prisma.reservation.deleteMany({
    where: { date: { lt: cutoff } },
  });

  return NextResponse.json({
    deleted: result.count,
    retentionMonths: LEGAL.retentionMonths,
    cutoff: cutoff.toISOString().slice(0, 10),
  });
}

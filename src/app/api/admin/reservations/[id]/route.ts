import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api";
import { RESERVATION_STATUS } from "@/lib/config";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const action =
    body && typeof body === "object" && "action" in body
      ? String((body as { action: unknown }).action)
      : "";

  const existing = await prisma.reservation.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
  }

  if (action === "cancel") {
    const updated = await prisma.reservation.update({
      where: { id },
      data: { status: RESERVATION_STATUS.CANCELLED, cancelledAt: new Date() },
    });
    return NextResponse.json({ ok: true, status: updated.status });
  }
  if (action === "restore") {
    const updated = await prisma.reservation.update({
      where: { id },
      data: { status: RESERVATION_STATUS.CONFIRMED, cancelledAt: null },
    });
    return NextResponse.json({ ok: true, status: updated.status });
  }

  return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;

  try {
    await prisma.reservation.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await ctx.params;

  try {
    await prisma.closure.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Fermeture introuvable." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

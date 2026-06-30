import { NextRequest, NextResponse } from "next/server";
import { prisma, getSettings } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api";
import { z } from "zod";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const settings = await getSettings();
  return NextResponse.json({ settings });
}

const settingsSchema = z
  .object({
    capacity: z.coerce.number().int().min(1).max(500),
    allowFullDay: z.coerce.boolean(),
    allowHalfDay: z.coerce.boolean(),
    openWeekends: z.coerce.boolean(),
    maxAdvanceDays: z.coerce.number().int().min(1).max(365),
  })
  .refine((d) => d.allowFullDay || d.allowHalfDay, {
    message: "Au moins un type de créneau (journée ou demi-journée) doit être activé.",
  });

export async function PUT(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides." },
      { status: 400 },
    );
  }

  await getSettings(); // garantit l'existence de la ligne
  const settings = await prisma.settings.update({
    where: { id: 1 },
    data: parsed.data,
  });
  return NextResponse.json({ settings });
}

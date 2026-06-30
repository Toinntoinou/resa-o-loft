import { NextRequest, NextResponse } from "next/server";
import { getAvailabilityRange } from "@/lib/availability";
import { isValidDateKey, utcDateFromKey } from "@/lib/dates";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!isValidDateKey(from) || !isValidDateKey(to)) {
    return NextResponse.json(
      { error: "Paramètres 'from' et 'to' invalides (AAAA-MM-JJ)." },
      { status: 400 },
    );
  }
  if (from > to) {
    return NextResponse.json(
      { error: "'from' doit précéder 'to'." },
      { status: 400 },
    );
  }
  const span =
    (utcDateFromKey(to).getTime() - utcDateFromKey(from).getTime()) /
    86_400_000;
  if (span > 100) {
    return NextResponse.json(
      { error: "Plage trop large (100 jours maximum)." },
      { status: 400 },
    );
  }

  const days = await getAvailabilityRange(from, to);
  return NextResponse.json({ days });
}

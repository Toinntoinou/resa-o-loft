import { NextRequest, NextResponse } from "next/server";
import { getDayAvailability } from "@/lib/availability";
import { isValidDateKey } from "@/lib/dates";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!isValidDateKey(date)) {
    return NextResponse.json(
      { error: "Paramètre 'date' invalide (AAAA-MM-JJ)." },
      { status: 400 },
    );
  }
  const day = await getDayAvailability(date);
  return NextResponse.json({ day });
}

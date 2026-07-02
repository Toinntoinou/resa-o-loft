import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { bookingSchema } from "@/lib/validation";
import { getDayAvailability } from "@/lib/availability";
import { utcDateFromKey } from "@/lib/dates";
import { generateReference } from "@/lib/reference";
import { sendConfirmationEmail, sendAdminNotification } from "@/lib/email";
import { RESERVATION_STATUS, type Slot } from "@/lib/config";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const OVERBOOK = "OVERBOOK";

export async function POST(req: NextRequest) {
  // Anti-abus : au plus 8 réservations / 10 min par adresse IP.
  if (!rateLimit(`resv:${clientIp(req)}`, 8, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Trop de réservations en peu de temps. Merci de réessayer plus tard." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides." },
      { status: 400 },
    );
  }
  const data = parsed.data;
  const dateUtc = utcDateFromKey(data.date);

  // Validations qui ne dépendent pas de la concurrence.
  const day = await getDayAvailability(data.date);
  if (day.isPast) {
    return NextResponse.json({ error: "Cette date est déjà passée." }, { status: 400 });
  }
  if (day.beyondHorizon) {
    return NextResponse.json(
      { error: "Cette date est trop éloignée pour réserver." },
      { status: 400 },
    );
  }
  if (day.closed) {
    return NextResponse.json(
      { error: "L'espace est fermé ce jour-là." },
      { status: 400 },
    );
  }
  if (
    (data.slot === "MORNING" || data.slot === "AFTERNOON") &&
    !day.allowHalfDay
  ) {
    return NextResponse.json(
      { error: "La réservation en demi-journée n'est pas proposée." },
      { status: 400 },
    );
  }
  if (data.slot === "FULL_DAY" && !day.allowFullDay) {
    return NextResponse.json(
      { error: "La réservation à la journée n'est pas proposée." },
      { status: 400 },
    );
  }

  try {
    // Transaction SERIALIZABLE : recompte la capacité et crée la résa de façon
    // réellement atomique. Sans ce niveau d'isolation, deux réservations
    // simultanées sur le dernier poste pourraient toutes deux passer le comptage.
    // En cas de conflit de sérialisation (P2034), on retente jusqu'à 3 fois.
    const runBooking = () =>
      prisma.$transaction(
        async (tx) => {
          const settings = await tx.settings.findUnique({ where: { id: 1 } });
          const capacity = settings?.capacity ?? 20;

          const existing = await tx.reservation.findMany({
            where: { date: dateUtc, status: RESERVATION_STATUS.CONFIRMED },
            select: { slot: true },
          });
          let m = 0;
          let a = 0;
          let f = 0;
          for (const r of existing) {
            if (r.slot === "MORNING") m++;
            else if (r.slot === "AFTERNOON") a++;
            else if (r.slot === "FULL_DAY") f++;
          }
          const morningRemaining = capacity - (m + f);
          const afternoonRemaining = capacity - (a + f);
          const slot = data.slot as Slot;
          const ok =
            slot === "MORNING"
              ? morningRemaining > 0
              : slot === "AFTERNOON"
                ? afternoonRemaining > 0
                : morningRemaining > 0 && afternoonRemaining > 0;
          if (!ok) throw new Error(OVERBOOK);

          for (let i = 0; i < 6; i++) {
            const reference = generateReference();
            const dup = await tx.reservation.findUnique({ where: { reference } });
            if (!dup) {
              return tx.reservation.create({
                data: {
                  reference,
                  date: dateUtc,
                  slot,
                  status: RESERVATION_STATUS.CONFIRMED,
                  firstName: data.firstName,
                  lastName: data.lastName,
                  email: data.email,
                  company: data.company ?? null,
                  phone: data.phone ?? null,
                  notes: data.notes ?? null,
                },
              });
            }
          }
          throw new Error("Impossible de générer une référence unique.");
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

    let reservation: Awaited<ReturnType<typeof runBooking>> | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        reservation = await runBooking();
        break;
      } catch (e) {
        const isConflict =
          e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2034";
        if (!isConflict || attempt === 3) throw e;
      }
    }
    if (!reservation) throw new Error("Réservation non créée.");

    // Places restantes ce jour-là, après cette réservation (pour la notif exploitant).
    const dayAfter = await getDayAvailability(data.date);
    const emailData = {
      to: reservation.email,
      firstName: reservation.firstName,
      lastName: reservation.lastName,
      dateKey: data.date,
      slot: reservation.slot as Slot,
      reference: reservation.reference,
      company: reservation.company,
      phone: reservation.phone,
      remaining: {
        capacity: dayAfter.capacity,
        morning: dayAfter.morningRemaining,
        afternoon: dayAfter.afternoonRemaining,
        fullDay: dayAfter.fullDayRemaining,
      },
    };

    // Emails (hors transaction ; un échec n'annule pas la résa).
    // La notif exploitant est indépendante de l'email client.
    const email = await sendConfirmationEmail(emailData);
    await sendAdminNotification(emailData);

    return NextResponse.json(
      {
        reservation: {
          reference: reservation.reference,
          date: data.date,
          slot: reservation.slot,
          firstName: reservation.firstName,
          lastName: reservation.lastName,
          email: reservation.email,
        },
        email,
      },
      { status: 201 },
    );
  } catch (e) {
    if (e instanceof Error && e.message === OVERBOOK) {
      return NextResponse.json(
        {
          error:
            "Désolé, ce créneau vient d'être complété. Merci d'en choisir un autre.",
        },
        { status: 409 },
      );
    }
    console.error("Échec création réservation :", e);
    return NextResponse.json(
      { error: "Une erreur est survenue. Merci de réessayer." },
      { status: 500 },
    );
  }
}

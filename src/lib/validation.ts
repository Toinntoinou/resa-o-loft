import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined));

export const bookingSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide (format attendu : AAAA-MM-JJ)."),
  slot: z.enum(["MORNING", "AFTERNOON", "FULL_DAY"], {
    message: "Créneau invalide.",
  }),
  firstName: z.string().trim().min(1, "Prénom requis.").max(80),
  lastName: z.string().trim().min(1, "Nom requis.").max(80),
  email: z.string().trim().toLowerCase().email("Email invalide.").max(160),
  company: optionalText(120),
  phone: optionalText(40),
  notes: optionalText(500),
});

export type BookingInput = z.infer<typeof bookingSchema>;

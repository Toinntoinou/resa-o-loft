import { Resend } from "resend";
import nodemailer from "nodemailer";
import {
  SLOT_LABELS,
  SLOT_HOURS,
  SLOT_PRICES,
  formatPrice,
  SITE_NAME,
  type Slot,
} from "./config";
import { formatLong } from "./dates";

export type DayRemaining = {
  capacity: number;
  morning: number;
  afternoon: number;
  fullDay: number;
};

export type ConfirmationData = {
  to: string;
  firstName: string;
  lastName: string;
  dateKey: string;
  slot: Slot;
  reference: string;
  company?: string | null;
  phone?: string | null;
  remaining?: DayRemaining;
};

export type SendResult = { sent: boolean; reason?: string };

// ─── Couche d'envoi : SMTP (votre boîte mail) en priorité, sinon Resend ────
function smtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
  );
}

export function emailEnabled(): boolean {
  return smtpConfigured() || Boolean(process.env.RESEND_API_KEY);
}

function fromAddress(): string {
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM;
  if (smtpConfigured()) return `${SITE_NAME} <${process.env.SMTP_USER}>`;
  return `${SITE_NAME} <onboarding@resend.dev>`;
}

type Message = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

/** Envoie un email via SMTP si configuré, sinon via Resend. Ne lève jamais. */
async function deliver(msg: Message): Promise<SendResult> {
  try {
    if (smtpConfigured()) {
      const port = Number(process.env.SMTP_PORT || 587);
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465, // 465 = TLS implicite ; 587 = STARTTLS
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      await transporter.sendMail({
        from: fromAddress(),
        to: msg.to,
        subject: msg.subject,
        html: msg.html,
        ...(msg.replyTo ? { replyTo: msg.replyTo } : {}),
      });
      return { sent: true };
    }
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: fromAddress(),
        to: msg.to,
        subject: msg.subject,
        html: msg.html,
        ...(msg.replyTo ? { replyTo: msg.replyTo } : {}),
      });
      if (error) return { sent: false, reason: error.message ?? "Erreur Resend" };
      return { sent: true };
    }
    return { sent: false, reason: "disabled" };
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : "Erreur email" };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(label: string, value: string, first = false): string {
  const border = first ? "" : "border-top:1px solid #f0efed;";
  return `<tr><td style="padding:8px 0;color:#78716c;${border}">${escapeHtml(
    label,
  )}</td><td style="padding:8px 0;text-align:right;font-weight:600;${border}">${escapeHtml(
    value,
  )}</td></tr>`;
}

// ─── Email client ──────────────────────────────────────────────────
function confirmationHtml(d: ConfirmationData): string {
  const dateStr = formatLong(d.dateKey);
  const slotStr = `${SLOT_LABELS[d.slot]} (${SLOT_HOURS[d.slot]})`;
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f5f5f4;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#292524;">
  <div style="max-width:520px;margin:0 auto;padding:24px;">
    <div style="background:#6e8778;color:#fff;border-radius:16px 16px 0 0;padding:24px 28px;">
      <div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;opacity:.85;">${escapeHtml(
        SITE_NAME,
      )}</div>
      <div style="font-size:22px;font-weight:600;margin-top:4px;">Réservation confirmée ✓</div>
    </div>
    <div style="background:#fff;border-radius:0 0 16px 16px;padding:28px;box-shadow:0 8px 24px rgba(0,0,0,.05);">
      <p style="margin:0 0 16px;">Bonjour ${escapeHtml(d.firstName)},</p>
      <p style="margin:0 0 20px;">Votre poste en open space est réservé. Voici le récapitulatif :</p>
      <table style="width:100%;border-collapse:collapse;font-size:15px;">
        ${row("Date", dateStr, true)}
        ${row("Créneau", slotStr)}
        ${row("Tarif", formatPrice(SLOT_PRICES[d.slot]))}
        ${row("Référence", d.reference)}
      </table>
      <p style="margin:24px 0 0;color:#78716c;font-size:13px;">Pour annuler ou modifier, répondez simplement à cet email.</p>
      <p style="margin:8px 0 0;color:#78716c;font-size:13px;">À très vite,<br>L'équipe ${escapeHtml(
        SITE_NAME,
      )} · un espace naama</p>
    </div>
  </div>
</body></html>`;
}

// ─── Email de notification à l'exploitant ──────────────────────────
function adminNotifyHtml(d: ConfirmationData): string {
  const dateStr = formatLong(d.dateKey);
  const slotStr = `${SLOT_LABELS[d.slot]} (${SLOT_HOURS[d.slot]})`;
  const rem = d.remaining;
  const remBlock = rem
    ? `<p style="margin:20px 0 6px;font-weight:600;color:#292524;">Places restantes le ${escapeHtml(
        dateStr,
      )}</p>
       <table style="width:100%;border-collapse:collapse;font-size:15px;">
         ${row("Matin", `${rem.morning} / ${rem.capacity}`, true)}
         ${row("Après-midi", `${rem.afternoon} / ${rem.capacity}`)}
         ${row("Journée entière possible", String(rem.fullDay))}
       </table>`
    : "";
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f5f5f4;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#292524;">
  <div style="max-width:520px;margin:0 auto;padding:24px;">
    <div style="background:#253728;color:#fff;border-radius:16px 16px 0 0;padding:20px 28px;">
      <div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;opacity:.85;">${escapeHtml(
        SITE_NAME,
      )}</div>
      <div style="font-size:20px;font-weight:600;margin-top:4px;">Nouvelle réservation</div>
    </div>
    <div style="background:#fff;border-radius:0 0 16px 16px;padding:28px;box-shadow:0 8px 24px rgba(0,0,0,.05);">
      <table style="width:100%;border-collapse:collapse;font-size:15px;">
        ${row("Client", `${d.firstName} ${d.lastName}`, true)}
        ${row("Société", d.company || "—")}
        ${row("Email", d.to)}
        ${row("Téléphone", d.phone || "—")}
        ${row("Date", dateStr)}
        ${row("Créneau", slotStr)}
        ${row("Tarif", formatPrice(SLOT_PRICES[d.slot]))}
        ${row("Référence", d.reference)}
      </table>
      ${remBlock}
    </div>
  </div>
</body></html>`;
}

/** Email de confirmation au client. Ne lève jamais. */
export async function sendConfirmationEmail(
  d: ConfirmationData,
): Promise<SendResult> {
  const replyTo =
    process.env.EMAIL_REPLY_TO || process.env.EMAIL_ADMIN_NOTIFY || undefined;
  return deliver({
    to: d.to,
    replyTo,
    subject: `Réservation confirmée — ${formatLong(d.dateKey)} (${SLOT_LABELS[d.slot]})`,
    html: confirmationHtml(d),
  });
}

/** Notification à l'exploitant (adresse EMAIL_ADMIN_NOTIFY). Indépendante de
 *  l'email client, et ne lève jamais. */
export async function sendAdminNotification(
  d: ConfirmationData,
): Promise<SendResult> {
  const adminTo = process.env.EMAIL_ADMIN_NOTIFY;
  if (!adminTo) return { sent: false, reason: "disabled" };
  return deliver({
    to: adminTo,
    replyTo: d.to,
    subject: `Nouvelle résa — ${d.firstName} ${d.lastName} · ${formatLong(d.dateKey)} (${SLOT_LABELS[d.slot]})`,
    html: adminNotifyHtml(d),
  });
}

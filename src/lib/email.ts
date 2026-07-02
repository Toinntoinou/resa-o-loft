import { Resend } from "resend";
import {
  SLOT_LABELS,
  SLOT_HOURS,
  SLOT_PRICES,
  formatPrice,
  SITE_NAME,
  type Slot,
} from "./config";
import { formatLong } from "./dates";

export type ConfirmationData = {
  to: string;
  firstName: string;
  lastName: string;
  dateKey: string;
  slot: Slot;
  reference: string;
  company?: string | null;
};

export function emailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function fromAddress(): string {
  return process.env.EMAIL_FROM || `${SITE_NAME} <onboarding@resend.dev>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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
        <tr><td style="padding:8px 0;color:#78716c;">Date</td><td style="padding:8px 0;text-align:right;font-weight:600;text-transform:capitalize;">${escapeHtml(
          dateStr,
        )}</td></tr>
        <tr><td style="padding:8px 0;color:#78716c;border-top:1px solid #f0efed;">Créneau</td><td style="padding:8px 0;text-align:right;font-weight:600;border-top:1px solid #f0efed;">${escapeHtml(
          slotStr,
        )}</td></tr>
        <tr><td style="padding:8px 0;color:#78716c;border-top:1px solid #f0efed;">Tarif</td><td style="padding:8px 0;text-align:right;font-weight:600;border-top:1px solid #f0efed;">${escapeHtml(
          formatPrice(SLOT_PRICES[d.slot]),
        )}</td></tr>
        <tr><td style="padding:8px 0;color:#78716c;border-top:1px solid #f0efed;">Référence</td><td style="padding:8px 0;text-align:right;font-weight:600;border-top:1px solid #f0efed;">${escapeHtml(
          d.reference,
        )}</td></tr>
      </table>
      <p style="margin:24px 0 0;color:#78716c;font-size:13px;">Pour annuler ou modifier, répondez simplement à cet email.</p>
      <p style="margin:8px 0 0;color:#78716c;font-size:13px;">À très vite,<br>L'équipe ${escapeHtml(
        SITE_NAME,
      )} · un espace naama</p>
    </div>
  </div>
</body></html>`;
}

function adminNotifyHtml(d: ConfirmationData): string {
  const who = `${escapeHtml(d.firstName)} ${escapeHtml(d.lastName)}`;
  const co = d.company ? ` (${escapeHtml(d.company)})` : "";
  return `<div style="font-family:Segoe UI,Arial,sans-serif;font-size:15px;color:#292524;">
    <p><strong>Nouvelle réservation</strong></p>
    <p>${who}${co}<br>${escapeHtml(d.to)}</p>
    <p>${escapeHtml(formatLong(d.dateKey))} — ${escapeHtml(SLOT_LABELS[d.slot])}<br>
    Référence : ${escapeHtml(d.reference)}</p>
  </div>`;
}

export type SendResult = { sent: boolean; reason?: string };

/** Envoie l'email de confirmation au client (et notifie l'admin si configuré).
 *  Ne lève jamais : en cas d'échec ou si l'email est désactivé, renvoie sent:false. */
export async function sendConfirmationEmail(
  d: ConfirmationData,
): Promise<SendResult> {
  if (!emailEnabled()) return { sent: false, reason: "disabled" };
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = fromAddress();

    const { error } = await resend.emails.send({
      from,
      to: d.to,
      subject: `Réservation confirmée — ${formatLong(d.dateKey)} (${SLOT_LABELS[d.slot]})`,
      html: confirmationHtml(d),
    });
    if (error) {
      return { sent: false, reason: error.message ?? "Erreur Resend" };
    }

    const adminTo = process.env.EMAIL_ADMIN_NOTIFY;
    if (adminTo) {
      await resend.emails.send({
        from,
        to: adminTo,
        subject: `Nouvelle résa — ${d.firstName} ${d.lastName} (${formatLong(d.dateKey)})`,
        html: adminNotifyHtml(d),
      });
    }
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : "Erreur email" };
  }
}

// Informations du responsable de traitement (RGPD).
// Modifiables sans toucher au code via les variables d'environnement (Vercel).
export const LEGAL = {
  entity: process.env.LEGAL_ENTITY || "SAS CROCOW",
  brand: process.env.NEXT_PUBLIC_SITE_NAME || "Le Loft",
  address: process.env.LEGAL_ADDRESS || "", // vide => affiché « à compléter »
  contactEmail: process.env.PRIVACY_EMAIL || "antoine.fontaine@naama.work",
  retentionMonths: Number(process.env.RETENTION_MONTHS || 24),
  updated: "juillet 2026",
};

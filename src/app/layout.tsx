import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "Le Loft";

export const metadata: Metadata = {
  title: {
    default: `Réservation — ${siteName}`,
    template: `%s — ${siteName}`,
  },
  description: `Réservez votre poste en open space chez ${siteName}.`,
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#33675f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}

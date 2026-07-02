import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow",
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["300", "600", "700"],
  variable: "--font-barlow-condensed",
  display: "swap",
});

const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "Le Loft";

export const metadata: Metadata = {
  title: {
    default: `Réservation — ${siteName}`,
    template: `%s — ${siteName}`,
  },
  description: `Réservez votre poste en open space chez ${siteName}, un espace naama.`,
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#6e8778",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${barlow.variable} ${barlowCondensed.variable}`}
    >
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}

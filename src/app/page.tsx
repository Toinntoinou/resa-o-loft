import { SiteHeader } from "@/components/SiteHeader";
import { BookingApp } from "@/components/BookingApp";

export default function Home() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-8">
        <div className="mb-6">
          <h1 className="title-accent text-3xl sm:text-4xl">
            Réservez votre poste
          </h1>
          <p className="mt-2 max-w-xl text-stone-600">
            Choisissez une date et un créneau dans l&apos;open space du Loft.
            Confirmation immédiate, sans création de compte.
          </p>
        </div>

        <BookingApp />

        <footer className="mt-12 flex flex-col items-center gap-3 border-t border-brand-100 pt-6 text-center">
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <span>Le Loft est un espace</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/naama-wordmark.svg"
              alt="naama"
              className="h-4 w-auto opacity-70"
            />
          </div>
          <a href="/admin" className="text-xs text-stone-400 hover:text-stone-600">
            Espace gestion
          </a>
        </footer>
      </main>
    </div>
  );
}

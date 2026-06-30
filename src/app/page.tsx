import { SiteHeader } from "@/components/SiteHeader";
import { BookingApp } from "@/components/BookingApp";

export default function Home() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-stone-900">
            Réservez votre poste
          </h1>
          <p className="mt-1 text-stone-600">
            Choisissez une date et un créneau dans l&apos;open space.
            Confirmation immédiate, sans création de compte.
          </p>
        </div>

        <BookingApp />

        <footer className="mt-12 border-t border-stone-200 pt-6 text-center text-xs text-stone-400">
          <a href="/admin" className="hover:text-stone-600">
            Espace gestion
          </a>
        </footer>
      </main>
    </div>
  );
}

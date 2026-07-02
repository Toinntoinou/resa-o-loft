import { SITE_NAME, SITE_TAGLINE } from "@/lib/config";

export function SiteHeader({ subtitle }: { subtitle?: string }) {
  return (
    <header className="border-b border-brand-100 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-5 py-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/naama-wordmark.png"
          alt="naama"
          className="h-10 w-auto max-w-full shrink-0 select-none"
        />
        <div className="flex items-baseline justify-center gap-2">
          <span className="font-display text-xl font-semibold tracking-tight text-brand-900">
            {SITE_NAME}
          </span>
          <span className="text-brand-200" aria-hidden>
            ·
          </span>
          <span className="text-sm text-stone-500">
            {subtitle ?? SITE_TAGLINE}
          </span>
        </div>
      </div>
    </header>
  );
}

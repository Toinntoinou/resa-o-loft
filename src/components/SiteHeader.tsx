import { SITE_NAME, SITE_TAGLINE } from "@/lib/config";

export function SiteHeader({ subtitle }: { subtitle?: string }) {
  return (
    <header className="border-b border-brand-100 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-5 py-7 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/naama-wordmark.svg"
          alt="naama"
          className="h-14 w-auto max-w-full select-none sm:h-16"
        />
        <div className="flex flex-wrap items-baseline justify-center gap-x-2.5">
          <span className="font-display text-3xl font-semibold tracking-tight text-brand-900">
            {SITE_NAME}
          </span>
          <span className="text-brand-200" aria-hidden>
            ·
          </span>
          <span className="text-lg text-stone-500">{subtitle ?? SITE_TAGLINE}</span>
        </div>
      </div>
    </header>
  );
}

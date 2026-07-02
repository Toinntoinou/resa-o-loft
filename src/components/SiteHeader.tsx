import { SITE_NAME, SITE_TAGLINE } from "@/lib/config";

export function SiteHeader({ subtitle }: { subtitle?: string }) {
  return (
    <header className="border-b border-brand-100 bg-white">
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/naama-wordmark.png"
          alt="naama"
          className="h-6 w-auto"
        />
        <span className="h-9 w-px bg-brand-200" aria-hidden />
        <div>
          <div className="font-display text-lg font-semibold leading-none tracking-tight text-brand-900">
            {SITE_NAME}
          </div>
          <div className="mt-1 text-xs text-stone-500">
            {subtitle ?? SITE_TAGLINE}
          </div>
        </div>
      </div>
    </header>
  );
}

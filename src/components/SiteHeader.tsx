import { SITE_NAME, SITE_TAGLINE } from "@/lib/config";

export function SiteHeader({ subtitle }: { subtitle?: string }) {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
          {SITE_NAME.slice(0, 1)}
        </div>
        <div>
          <div className="text-base font-semibold leading-tight text-stone-900">
            {SITE_NAME}
          </div>
          <div className="text-xs text-stone-500">
            {subtitle ?? SITE_TAGLINE}
          </div>
        </div>
      </div>
    </header>
  );
}

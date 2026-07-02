// Limiteur de débit « best-effort » en mémoire (anti-abus / anti-bruteforce).
// Note : en environnement serverless la mémoire est par-instance et réinitialisée
// au démarrage à froid — c'est une protection de base, pas un rempart absolu.

type Entry = { count: number; reset: number };
const buckets = new Map<string, Entry>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const e = buckets.get(key);
  if (!e || now > e.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    // Nettoyage opportuniste pour éviter la croissance mémoire.
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (now > v.reset) buckets.delete(k);
    }
    return true;
  }
  if (e.count >= limit) return false;
  e.count += 1;
  return true;
}

/** Adresse IP de l'appelant (derrière le proxy Vercel). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

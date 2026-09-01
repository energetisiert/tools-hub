import { headers } from 'next/headers';

/**
 * Origin-Check fuer Signup/Login-Server-Actions, gleiches Muster wie in den
 * fuenf Rechnern (src/lib/security/guards.ts dort). Die Hub-App bekommt kein
 * Rate-Limiting-RPC wie die Rechner -- Supabase Auth begrenzt Signup-/Login-
 * Versuche bereits serverseitig pro IP.
 */
export async function origenErlaubt(): Promise<boolean> {
  const h = await headers();
  const origin = h.get('origin') ?? h.get('referer') ?? '';

  const erlaubt = (process.env.ALLOWED_ORIGINS ?? 'https://tools.energetisiert.de,https://energetisiert.de')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // Feste Vercel-Aliase dieses Projekts zusaetzlich erlauben (z. B. fuer
  // Deployments, bevor eine eigene Domain verknuepft ist) -- ohne das wuerde
  // JEDE Anmeldung ueber *.vercel.app fehlschlagen.
  erlaubt.push('https://tools-hub-energetisiert.vercel.app', 'https://tools-hub.vercel.app', 'https://tools-hub-git-main-energetisiert.vercel.app');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) erlaubt.push(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  if (process.env.VERCEL_URL) erlaubt.push(`https://${process.env.VERCEL_URL}`);
  if (process.env.VERCEL_BRANCH_URL) erlaubt.push(`https://${process.env.VERCEL_BRANCH_URL}`);

  if (process.env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
    return true;
  }

  // Jede eigene *.energetisiert.de-Subdomain gilt als vertrauenswuerdig --
  // der Check dient der CSRF-Abwehr gegen FREMDE Origins, und ein Umbenennen
  // der Hub-Domain (tool. vs. tools.) darf Login/Registrierung nicht brechen.
  try {
    const originUrl = new URL(origin);
    if (
      originUrl.protocol === 'https:' &&
      (originUrl.hostname === 'energetisiert.de' || originUrl.hostname.endsWith('.energetisiert.de'))
    ) {
      return true;
    }
  } catch {
    // origin war keine URL -- unten regulaer ablehnen.
  }

  const ok = erlaubt.some((o) => origin === o || origin.startsWith(`${o}/`));
  if (!ok) {
    // Bewusst als Warnung geloggt (nicht Teil der stillen "Bots nicht
    // nachjustieren lassen"-Antwort) -- sonst ist ein falscher Origin-Check
    // ueber die Logs nicht von einem echten Bot-Block zu unterscheiden.
    console.warn(`origenErlaubt: Origin "${origin}" nicht in der Allowlist.`);
  }
  return ok;
}

/** Honeypot: das unsichtbare Feld website_url darf nie gefuellt sein. */
export function honeypotAusgeloest(websiteUrl: unknown): boolean {
  return typeof websiteUrl === 'string' && websiteUrl.trim() !== '';
}

/**
 * redirect_to darf ausschliesslich auf *.energetisiert.de zeigen -- sonst
 * waere das ein Open Redirect (Login-Flow leitet nach fremder Anmeldung auf
 * eine beliebige externe URL um).
 */
export function sichereRedirectUrl(redirectTo: string | null | undefined): string | null {
  if (!redirectTo) return null;
  try {
    const url = new URL(redirectTo);
    if (url.protocol !== 'https:') return null;
    if (url.hostname === 'energetisiert.de' || url.hostname.endsWith('.energetisiert.de')) {
      return url.toString();
    }
    return null;
  } catch {
    return null;
  }
}

import type { NextRequest, NextResponse } from 'next/server';

/**
 * Automatische Abmeldung nach 30 Minuten Inaktivitaet -- Hub-Seite der
 * Suite-weiten Regel. Der Cookie `ea_aktiv` (Zeitstempel ms, Domain
 * .energetisiert.de, httpOnly) wird von jeder Rechner-Middleware und von
 * src/proxy.ts hier gesetzt bzw. geprueft. Gleiche Konstanten wie in
 * lib/security/proxy-guard.ts der Rechner-Apps.
 */
export const AKTIV_COOKIE = 'ea_aktiv';
export const INAKTIVITAET_MAX_MS = 30 * 60 * 1000;
const AKTIV_REFRESH_AB_MS = 60 * 1000;

export function aktivCookieOptions(host: string | null | undefined) {
  const istProdDomain = !!host && (host === 'energetisiert.de' || host.endsWith('.energetisiert.de'));
  return {
    ...(istProdDomain ? { domain: '.energetisiert.de', secure: true } : {}),
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24,
  };
}

export function hatSsoSessionCookie(req: NextRequest): boolean {
  return req.cookies.getAll().some((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'));
}

/** Verbleibende Zeit bis zur automatischen Abmeldung in ms (null = kein Aktivitaets-Cookie). */
export function restlaufzeit(req: NextRequest, jetzt = Date.now()): number | null {
  const roh = req.cookies.get(AKTIV_COOKIE)?.value;
  if (!roh) return null;
  const letzte = Number(roh);
  if (!Number.isFinite(letzte)) return null;
  return INAKTIVITAET_MAX_MS - (jetzt - letzte);
}

export function inaktivitaetAbgelaufen(req: NextRequest, jetzt = Date.now()): boolean {
  const rest = restlaufzeit(req, jetzt);
  return rest !== null && rest < 0;
}

export function aktivitaetMarkieren(req: NextRequest, res: NextResponse, host: string | null | undefined, jetzt = Date.now()): void {
  const letzte = Number(req.cookies.get(AKTIV_COOKIE)?.value);
  if (Number.isFinite(letzte) && jetzt - letzte < AKTIV_REFRESH_AB_MS) return;
  res.cookies.set(AKTIV_COOKIE, String(jetzt), aktivCookieOptions(host));
}

export function sessionCookiesLoeschen(req: NextRequest, res: NextResponse, host: string | null | undefined): void {
  const optionen = { ...aktivCookieOptions(host), maxAge: 0 };
  for (const c of req.cookies.getAll()) {
    if (c.name.startsWith('sb-') && c.name.includes('-auth-token')) res.cookies.set(c.name, '', optionen);
  }
  res.cookies.set(AKTIV_COOKIE, '', optionen);
}

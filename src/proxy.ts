import { NextResponse, type NextRequest } from 'next/server';
import {
  aktivitaetMarkieren, hatSsoSessionCookie, inaktivitaetAbgelaufen, sessionCookiesLoeschen,
} from '@/lib/security/inaktivitaet';

/**
 * Einzige Aufgabe dieser Middleware: die 30-Minuten-Inaktivitaetsregel auf den
 * angemeldeten Hub-Seiten. Die eigentliche Zugriffskontrolle (Login,
 * Freischaltung, Admin-Rolle) bleibt in den Server Components (ladeZugang()
 * u.a.), damit hier keine RPC pro Request anfaellt.
 */
export function proxy(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0];
  if (!hatSsoSessionCookie(request)) return NextResponse.next();

  if (inaktivitaetAbgelaufen(request)) {
    const abgemeldet = NextResponse.redirect(new URL(`/login?hinweis=inaktiv&redirect_to=${encodeURIComponent(request.url)}`, request.url));
    sessionCookiesLoeschen(request, abgemeldet, host);
    return abgemeldet;
  }

  const response = NextResponse.next();
  aktivitaetMarkieren(request, response, host);
  return response;
}

export const config = {
  matcher: ['/hub/:path*', '/studio/:path*', '/admin/:path*'],
};

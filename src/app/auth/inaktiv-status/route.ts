import { NextResponse, type NextRequest } from 'next/server';
import { hatSsoSessionCookie, INAKTIVITAET_MAX_MS, restlaufzeit } from '@/lib/security/inaktivitaet';

export const dynamic = 'force-dynamic';

/**
 * GET /auth/inaktiv-status -- liefert dem Client-Timer (IdleLogout.tsx) die
 * suite-weite Restlaufzeit bis zur automatischen Abmeldung. Wird aus allen
 * *.energetisiert.de-Apps per fetch mit Cookies aufgerufen, daher CORS nur
 * fuer diese Origins. Keine personenbezogenen Daten in der Antwort.
 */
function corsHeaders(origin: string | null): Record<string, string> {
  let erlaubt = false;
  if (origin) {
    try {
      const h = new URL(origin).hostname;
      erlaubt = h === 'energetisiert.de' || h.endsWith('.energetisiert.de');
    } catch {
      erlaubt = false;
    }
  }
  return {
    'Cache-Control': 'no-store',
    Vary: 'Origin',
    ...(erlaubt && origin ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true' } : {}),
  };
}

export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: { ...corsHeaders(request.headers.get('origin')), 'Access-Control-Allow-Methods': 'GET, OPTIONS' },
  });
}

export function GET(request: NextRequest) {
  const headers = corsHeaders(request.headers.get('origin'));
  if (!hatSsoSessionCookie(request)) {
    return NextResponse.json({ keineSession: true }, { headers });
  }
  const rest = restlaufzeit(request);
  // Ohne Aktivitaets-Cookie (z.B. direkt nach dem Login) gilt die volle Frist.
  return NextResponse.json({ restMs: rest === null ? INAKTIVITAET_MAX_MS : Math.max(0, rest) }, { headers });
}

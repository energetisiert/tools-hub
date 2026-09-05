import { NextResponse, type NextRequest } from 'next/server';
import { sessionCookiesLoeschen } from '@/lib/security/inaktivitaet';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /auth/logout?hinweis=inaktiv -- Ziel der clientseitigen Inaktivitaets-
 * Abmeldung (components/IdleLogout.tsx in allen Apps). Beendet die Session
 * serverseitig (Refresh-Token widerrufen) und loescht die SSO-Cookies fuer
 * die gesamte Domain, danach Login mit Hinweis.
 */
export async function GET(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0];
  const hinweis = request.nextUrl.searchParams.get('hinweis') === 'inaktiv' ? '?hinweis=inaktiv' : '';

  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (e) {
    console.error('auth/logout: signOut fehlgeschlagen:', e);
  }

  const antwort = NextResponse.redirect(new URL(`/login${hinweis}`, request.url));
  sessionCookiesLoeschen(request, antwort, host);
  return antwort;
}

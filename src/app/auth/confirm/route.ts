import type { EmailOtpType } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';
import { ipHash } from '@/lib/security/guards';
import { createClient } from '@/lib/supabase/server';

/**
 * Ziel des Links aus der Supabase-Passwort-zuruecksetzen-Mail. Tauscht den
 * einmaligen, kurzlebigen token_hash gegen eine echte Session (verifyOtp),
 * dann Weiterleitung zur Seite, auf der das neue Passwort gesetzt wird.
 *
 * Bewusst ein oeffentlicher Route Handler ohne origenErlaubt()-Pruefung: die
 * Anfrage kommt vom Mail-Client des Nutzers per Klick, nicht als Formular-
 * Absendung von dieser Seite selbst -- ein Origin/Referer der eigenen Domain
 * ist hier nicht zu erwarten. Die Berechtigung liegt allein im token_hash
 * (von Supabase signiert, einmalig, zeitlich begrenzt, praktisch nicht zu
 * erraten). Ein grosszuegiges IP-Rate-Limit bleibt trotzdem als zweite
 * Schicht bestehen, konsistent mit jedem anderen oeffentlichen Endpunkt
 * dieser Suite.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  if (token_hash && type === 'recovery') {
    const supabase = await createClient();

    // Erst hier pruefen (nicht schon oben, unbedingt) -- sonst wuerde jeder
    // Aufruf ohne token_hash/type (Scanner, Crawler, ein leerer /auth/confirm-
    // Aufruf) unnoetig ein Kontingent verbrauchen, das auf einer geteilten IP
    // (Firmen-NAT, Mobilfunk) dann fuer den echten Klick fehlen koennte.
    const { data: erlaubt, error: rlFehler } = await supabase.rpc('rate_limit_hit', {
      p_scope: 'tools_hub:passwort_reset_confirm',
      p_ip_hash: await ipHash(),
      p_limit: 20,
      p_window_seconds: 3600,
    });
    if (rlFehler) console.error('auth/confirm: Rate-Limit-RPC fehlgeschlagen:', rlFehler.message);

    if (erlaubt !== false) {
      const { error } = await supabase.auth.verifyOtp({ type, token_hash });
      if (!error) {
        redirect(`${origin}/passwort-zuruecksetzen`);
      }
      console.error('auth/confirm: verifyOtp fehlgeschlagen:', error.code, error.message);
    }
  }

  redirect(`${origin}/passwort-vergessen?ungueltig=1`);
}

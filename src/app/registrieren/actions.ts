'use server';

import { headers } from 'next/headers';
import { honeypotAusgeloest, origenErlaubt } from '@/lib/security/guards';
import { createServiceRoleClient } from '@/lib/supabase/server';

export type RegistrierenState = { fehler: string } | { erfolg: true } | null;

/**
 * Registrierung ueber die Admin-API (auth.admin.createUser) statt ueber
 * supabase.auth.signUp:
 *
 * - signUp verschickt zwingend eine Bestaetigungsmail ueber Supabases
 *   EINGEBAUTEN Mailer, und der erlaubt nur 2 Mails pro Stunde -- echte
 *   Registrierungen schlugen mit "over_email_send_rate_limit" fehl.
 * - Die eigentliche Zugangskontrolle ist ohnehin die manuelle Freischaltung
 *   durch das Team (profiles.status bleibt 'pending' bis approve_profile()),
 *   nicht die E-Mail-Bestaetigung des Nutzers.
 * - Sobald Resend als SMTP-Absender im Supabase-Dashboard hinterlegt ist,
 *   kann hier wieder auf signUp mit echter E-Mail-Verifikation umgestellt
 *   werden.
 *
 * Der Admin-API-Weg unterliegt NICHT dem Signup-Rate-Limit von Supabase Auth,
 * deshalb eigenes Rate-Limit ueber die geteilte rate_limit_hit()-Funktion,
 * scope 'tools_hub:registrieren', 5/Stunde pro IP.
 *
 * Bewusst OHNE Vercel BotID, anders als die Rechner-Tools: dort schuetzt
 * BotID proprietaere Formeln vor automatisiertem Scraping in grossem Stil --
 * hier gibt es nichts dergleichen zu schuetzen, ein Bot gewinnt durch
 * Registrieren nichts (jeder Account bleibt `pending`), und BotID hat hier
 * nachweislich echte, menschliche Registrierungen blockiert.
 */
export async function registrierenAction(_prev: RegistrierenState, formData: FormData): Promise<RegistrierenState> {
  if (honeypotAusgeloest(formData.get('website_url'))) {
    console.warn('registrierenAction: Honeypot-Feld war ausgefuellt.');
    return { fehler: 'Registrierung fehlgeschlagen.' };
  }
  if (!(await origenErlaubt())) {
    // origenErlaubt() loggt den genauen Origin bereits selbst.
    return { fehler: 'Registrierung fehlgeschlagen.' };
  }

  const email = String(formData.get('email') ?? '').trim();
  const passwort = String(formData.get('passwort') ?? '');
  const vollerName = String(formData.get('voller_name') ?? '').trim();

  if (!/^\S+@\S+\.\S+$/.test(email) || passwort.length < 8) {
    return { fehler: 'Bitte eine gültige E-Mail-Adresse und ein Passwort mit mindestens 8 Zeichen angeben.' };
  }
  if (vollerName.length > 200 || email.length > 254) {
    return { fehler: 'Eingabe zu lang.' };
  }

  const supabase = createServiceRoleClient();

  const { data: erlaubt, error: rlFehler } = await supabase.rpc('rate_limit_hit', {
    p_scope: 'tools_hub:registrieren',
    p_ip_hash: await ipHash(),
    p_limit: 5,
    p_window_seconds: 3600,
  });
  if (rlFehler) {
    console.error('registrierenAction: Rate-Limit-RPC fehlgeschlagen:', rlFehler.message);
    return { fehler: 'Registrierung fehlgeschlagen. Bitte später erneut versuchen.' };
  }
  if (!erlaubt) {
    return { fehler: 'Zu viele Registrierungsversuche. Bitte versuche es in einer Stunde erneut.' };
  }

  const { error } = await supabase.auth.admin.createUser({
    email,
    password: passwort,
    email_confirm: true,
    user_metadata: { full_name: vollerName || null },
  });

  if (error) {
    console.error('registrierenAction: auth.admin.createUser fehlgeschlagen:', error.code, error.message);
    if (error.code === 'email_exists' || error.message.toLowerCase().includes('already been registered')) {
      return { fehler: 'Für diese E-Mail-Adresse existiert bereits ein Konto.' };
    }
    return { fehler: 'Registrierung fehlgeschlagen. Bitte später erneut versuchen.' };
  }

  return { erfolg: true };
}

/**
 * SHA-256 der Client-IP als Rate-Limit-Schluessel -- die IP selbst landet
 * nie in der Datenbank (Datenminimierung), der Hash reicht zum Zaehlen.
 */
async function ipHash(): Promise<string> {
  const h = await headers();
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || h.get('x-real-ip') || 'unbekannt';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

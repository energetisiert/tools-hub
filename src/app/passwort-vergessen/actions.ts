'use server';

import { headers } from 'next/headers';
import { honeypotAusgeloest, origenErlaubt } from '@/lib/security/guards';
import { createClient } from '@/lib/supabase/server';

export type PasswortVergessenState = { fehler: string } | { erfolg: true } | null;

/**
 * Schickt die Supabase-eigene "Passwort zuruecksetzen"-Mail (nutzt Supabases
 * eingebauten Mailer, unabhaengig vom noch ausstehenden Resend-Setup fuer die
 * Admin-Benachrichtigung -- zwei getrennte Versandwege).
 *
 * Antwortet nach den Vor-Pruefungen (Honeypot/Origin/Format/Rate-Limit)
 * IMMER mit derselben Erfolgsmeldung, unabhaengig davon, ob die E-Mail zu
 * einem Konto gehoert -- alles andere waere ein Enumeration-Leck fuer
 * registrierte Adressen. Supabase selbst verhaelt sich bei
 * resetPasswordForEmail() ebenso (kein Fehler bei unbekannter Adresse).
 */
export async function passwortVergessenAction(_prev: PasswortVergessenState, formData: FormData): Promise<PasswortVergessenState> {
  if (honeypotAusgeloest(formData.get('website_url'))) {
    console.warn('passwortVergessenAction: Honeypot-Feld war ausgefuellt.');
    return { fehler: 'Anfrage fehlgeschlagen.' };
  }
  if (!(await origenErlaubt())) {
    return { fehler: 'Anfrage fehlgeschlagen.' };
  }

  const email = String(formData.get('email') ?? '').trim();
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) {
    return { fehler: 'Bitte eine gültige E-Mail-Adresse eingeben.' };
  }

  const supabase = await createClient();

  const { data: erlaubt, error: rlFehler } = await supabase.rpc('rate_limit_hit', {
    p_scope: 'tools_hub:passwort_reset',
    p_ip_hash: await ipHash(),
    p_limit: 5,
    p_window_seconds: 3600,
  });
  if (rlFehler) {
    console.error('passwortVergessenAction: Rate-Limit-RPC fehlgeschlagen:', rlFehler.message);
    return { fehler: 'Anfrage fehlgeschlagen. Bitte später erneut versuchen.' };
  }
  if (!erlaubt) {
    return { fehler: 'Zu viele Anfragen. Bitte versuche es in einer Stunde erneut.' };
  }

  // Zusaetzlich pro Ziel-Adresse begrenzt (strenger, 3/Std.) -- anders als bei
  // registrieren() ist hier der Angreifer nicht zwangslaeufig der Empfaenger:
  // ohne dieses zweite Limit koennte jemand mit rotierenden IPs eine fremde
  // Mailbox unbegrenzt mit Zuruecksetzen-Mails fluten (Mail-Bombing).
  const { data: erlaubtEmail, error: rlEmailFehler } = await supabase.rpc('rate_limit_hit', {
    p_scope: 'tools_hub:passwort_reset_email',
    p_ip_hash: await emailHash(email),
    p_limit: 3,
    p_window_seconds: 3600,
  });
  if (rlEmailFehler) {
    console.error('passwortVergessenAction: E-Mail-Rate-Limit-RPC fehlgeschlagen:', rlEmailFehler.message);
    return { fehler: 'Anfrage fehlgeschlagen. Bitte später erneut versuchen.' };
  }
  if (!erlaubtEmail) {
    // Bewusst dieselbe generische Erfolgsmeldung wie unten, nicht "zu viele
    // Anfragen" -- sonst liesse sich ueber diesen Zweig erkennen, dass genau
    // DIESE Adresse kuerzlich schon angefragt wurde (Enumeration-Signal).
    return { erfolg: true };
  }

  // host aus dem Host-Header, aber validiert wie ssoCookieOptions() das
  // bereits fuer die Session-Cookie-Domain tut: ein ungeprueft uebernommener
  // Host-Header koennte den Zuruecksetzen-Link auf eine fremde Domain
  // umleiten (Host-Header-Injection, z.B. "energetisiert.de@evil.com").
  const h = await headers();
  const rawHost = h.get('host') ?? '';
  const hostGueltig = rawHost === 'energetisiert.de' || rawHost.endsWith('.energetisiert.de');
  const host = hostGueltig ? rawHost : 'tools.energetisiert.de';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${protocol}://${host}/auth/confirm`,
  });
  if (error) {
    // Bewusst NICHT an den Client durchgereicht -- Supabase antwortet je nach
    // Fehlerart unterschiedlich (siehe Docstring oben), das waere sonst das
    // Enumeration-Leck, das dieser einheitliche Erfolgs-Rueckgabewert gerade
    // verhindern soll.
    console.error('passwortVergessenAction: resetPasswordForEmail fehlgeschlagen:', error.code, error.message);
  }

  return { erfolg: true };
}

/** SHA-256 der Client-IP, identisch zum Muster in registrieren/actions.ts. */
async function ipHash(): Promise<string> {
  const h = await headers();
  const ip = (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || h.get('x-real-ip') || 'unbekannt';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** SHA-256 der normalisierten Ziel-Adresse, fuer das zweite (Ziel-)Rate-Limit. */
async function emailHash(email: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalisiereEmail(email)));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Entfernt "+tag"-Subadressierung (Gmail, Outlook, Yahoo, Proton u.a. liefern
 * "name+irgendwas@domain" an dieselbe Inbox wie "name@domain") -- sonst liesse
 * sich das Ziel-Rate-Limit durch Tag-Rotation umgehen und die Mailbox trotzdem
 * fluten. Bewusst KEIN Entfernen von Punkten im Local-Part (das ist
 * Gmail-spezifisches Verhalten -- bei anderen Anbietern sind Punkte ein
 * echtes Unterscheidungsmerkmal, das wuerde dort verschiedene Adressen
 * faelschlich zusammenfassen).
 */
function normalisiereEmail(email: string): string {
  const wert = email.trim().toLowerCase();
  const at = wert.indexOf('@');
  if (at === -1) return wert;
  const localPart = wert.slice(0, at).split('+')[0];
  return `${localPart}${wert.slice(at)}`;
}

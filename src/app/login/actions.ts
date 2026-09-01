'use server';

import { redirect } from 'next/navigation';
import { honeypotAusgeloest, origenErlaubt, sichereRedirectUrl } from '@/lib/security/guards';
import { createClient } from '@/lib/supabase/server';

/**
 * Bewusst OHNE Vercel BotID (siehe registrieren/actions.ts) -- hat hier
 * echte Anmeldungen faelschlich blockiert. Supabase Auth begrenzt
 * Login-Versuche bereits serverseitig pro IP, Honeypot + Origin-Check
 * bleiben zusaetzlich bestehen.
 */
export async function loginAction(_prev: { fehler: string } | null, formData: FormData): Promise<{ fehler: string } | null> {
  if (honeypotAusgeloest(formData.get('website_url'))) {
    console.warn('loginAction: Honeypot-Feld war ausgefuellt.');
    return { fehler: 'Anmeldung fehlgeschlagen.' };
  }
  if (!(await origenErlaubt())) {
    // origenErlaubt() loggt den genauen Origin bereits selbst.
    return { fehler: 'Anmeldung fehlgeschlagen.' };
  }

  const email = String(formData.get('email') ?? '');
  const passwort = String(formData.get('passwort') ?? '');
  if (!email || !passwort) {
    return { fehler: 'Bitte E-Mail und Passwort eingeben.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password: passwort });
  if (error) {
    console.error('loginAction: signInWithPassword fehlgeschlagen:', error.code, error.message);
    return { fehler: 'E-Mail oder Passwort ist falsch.' };
  }

  const redirectTo = sichereRedirectUrl(String(formData.get('redirect_to') ?? ''));
  redirect(redirectTo ?? '/warten-auf-freischaltung');
}

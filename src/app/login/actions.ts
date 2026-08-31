'use server';

import { checkBotId } from 'botid/server';
import { redirect } from 'next/navigation';
import { honeypotAusgeloest, origenErlaubt, sichereRedirectUrl } from '@/lib/security/guards';
import { createClient } from '@/lib/supabase/server';

export async function loginAction(_prev: { fehler: string } | null, formData: FormData): Promise<{ fehler: string } | null> {
  if (honeypotAusgeloest(formData.get('website_url'))) {
    return { fehler: 'Anmeldung fehlgeschlagen.' };
  }
  if (!(await origenErlaubt())) {
    return { fehler: 'Anmeldung fehlgeschlagen.' };
  }
  const botCheck = await checkBotId({ advancedOptions: { checkLevel: 'basic' } });
  if (botCheck.isBot) {
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
    return { fehler: 'E-Mail oder Passwort ist falsch.' };
  }

  const redirectTo = sichereRedirectUrl(String(formData.get('redirect_to') ?? ''));
  redirect(redirectTo ?? '/warten-auf-freischaltung');
}

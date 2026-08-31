'use server';

import { checkBotId } from 'botid/server';
import { honeypotAusgeloest, origenErlaubt } from '@/lib/security/guards';
import { createClient } from '@/lib/supabase/server';

export type RegistrierenState = { fehler: string } | { erfolg: true } | null;

export async function registrierenAction(_prev: RegistrierenState, formData: FormData): Promise<RegistrierenState> {
  if (honeypotAusgeloest(formData.get('website_url'))) {
    return { fehler: 'Registrierung fehlgeschlagen.' };
  }
  if (!(await origenErlaubt())) {
    return { fehler: 'Registrierung fehlgeschlagen.' };
  }
  const botCheck = await checkBotId({ advancedOptions: { checkLevel: 'basic' } });
  if (botCheck.isBot) {
    return { fehler: 'Registrierung fehlgeschlagen.' };
  }

  const email = String(formData.get('email') ?? '').trim();
  const passwort = String(formData.get('passwort') ?? '');
  const vollerName = String(formData.get('voller_name') ?? '').trim();

  if (!email || passwort.length < 8) {
    return { fehler: 'Bitte eine gültige E-Mail-Adresse und ein Passwort mit mindestens 8 Zeichen angeben.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password: passwort,
    options: { data: { full_name: vollerName || null } },
  });

  if (error) {
    if (error.message.toLowerCase().includes('already registered') || error.code === 'user_already_exists') {
      return { fehler: 'Für diese E-Mail-Adresse existiert bereits ein Konto.' };
    }
    return { fehler: 'Registrierung fehlgeschlagen. Bitte später erneut versuchen.' };
  }

  return { erfolg: true };
}

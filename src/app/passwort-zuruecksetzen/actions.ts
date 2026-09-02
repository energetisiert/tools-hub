'use server';

import { redirect } from 'next/navigation';
import { honeypotAusgeloest, origenErlaubt } from '@/lib/security/guards';
import { createClient } from '@/lib/supabase/server';

export async function passwortZuruecksetzenAction(
  _prev: { fehler: string } | null,
  formData: FormData,
): Promise<{ fehler: string } | null> {
  if (honeypotAusgeloest(formData.get('website_url'))) {
    console.warn('passwortZuruecksetzenAction: Honeypot-Feld war ausgefuellt.');
    return { fehler: 'Speichern fehlgeschlagen.' };
  }
  if (!(await origenErlaubt())) {
    return { fehler: 'Speichern fehlgeschlagen.' };
  }

  const passwort = String(formData.get('passwort') ?? '');
  const bestaetigen = String(formData.get('passwort_bestaetigen') ?? '');
  if (passwort.length < 8) {
    return { fehler: 'Das Passwort muss mindestens 8 Zeichen lang sein.' };
  }
  if (passwort !== bestaetigen) {
    return { fehler: 'Die beiden Passwörter stimmen nicht überein.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { fehler: 'Dieser Link ist ungültig oder abgelaufen. Bitte fordere einen neuen an.' };
  }

  const { error } = await supabase.auth.updateUser({ password: passwort });
  if (error) {
    console.error('passwortZuruecksetzenAction: updateUser fehlgeschlagen:', error.code, error.message);
    return { fehler: 'Speichern fehlgeschlagen. Bitte versuche es erneut.' };
  }

  redirect('/hub');
}

'use client';

import { useActionState } from 'react';
import { Fehlermeldung, Field, SubmitButton, TextInput } from '@/components/ui/Field';
import { passwortZuruecksetzenAction } from './actions';

export function PasswortZuruecksetzenForm() {
  const [state, formAction, pending] = useActionState(passwortZuruecksetzenAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="text" name="website_url" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp-field" defaultValue="" />

      {state?.fehler && <Fehlermeldung text={state.fehler} />}

      <Field label="Neues Passwort">
        <TextInput type="password" name="passwort" required minLength={8} autoComplete="new-password" placeholder="mindestens 8 Zeichen" />
      </Field>
      <Field label="Neues Passwort bestätigen">
        <TextInput type="password" name="passwort_bestaetigen" required minLength={8} autoComplete="new-password" placeholder="wiederholen" />
      </Field>
      <SubmitButton pending={pending}>Passwort speichern</SubmitButton>
    </form>
  );
}

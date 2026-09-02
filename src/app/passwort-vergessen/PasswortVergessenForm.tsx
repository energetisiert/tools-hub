'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Fehlermeldung, Field, SubmitButton, TextInput } from '@/components/ui/Field';
import { passwortVergessenAction } from './actions';

export function PasswortVergessenForm({ linkUngueltig }: { linkUngueltig?: boolean }) {
  const [state, formAction, pending] = useActionState(passwortVergessenAction, null);

  if (state && 'erfolg' in state) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-[15px] text-strong">
          Falls ein Konto mit dieser E-Mail-Adresse existiert, haben wir dir einen Link zum Zurücksetzen geschickt.
        </p>
        <p className="text-[13px] text-muted2">
          <Link href="/login" className="font-semibold text-ac hover:underline">
            Zurück zur Anmeldung
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="text" name="website_url" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp-field" defaultValue="" />

      {state && 'fehler' in state && <Fehlermeldung text={state.fehler} />}
      {linkUngueltig && !state && <Fehlermeldung text="Dieser Link ist ungültig oder abgelaufen. Fordere unten einen neuen an." />}

      <p className="text-[13px] text-muted2">Gib deine E-Mail-Adresse ein — wir schicken dir einen Link zum Zurücksetzen deines Passworts.</p>
      <Field label="E-Mail">
        <TextInput type="email" name="email" required autoComplete="email" placeholder="z. B. name@energetisiert.de" />
      </Field>
      <SubmitButton pending={pending}>Link anfordern</SubmitButton>
      <p className="text-center text-[13px] text-muted2">
        <Link href="/login" className="font-semibold text-ac hover:underline">
          Zurück zur Anmeldung
        </Link>
      </p>
    </form>
  );
}

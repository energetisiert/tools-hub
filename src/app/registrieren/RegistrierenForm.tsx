'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Fehlermeldung, Field, SubmitButton, TextInput } from '@/components/ui/Field';
import { registrierenAction } from './actions';

export function RegistrierenForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction, pending] = useActionState(registrierenAction, null);

  if (state && 'erfolg' in state) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-[15px] text-strong">
          Fast geschafft — bitte bestätige zuerst deine E-Mail-Adresse über den Link, den wir dir geschickt haben.
        </p>
        <p className="text-[13px] text-muted2">
          Danach prüft unser Team deine Registrierung und schaltet dein Konto frei. Das kann etwas dauern.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirect_to" value={redirectTo} />
      <input type="text" name="website_url" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp-field" defaultValue="" />

      {state && 'fehler' in state && <Fehlermeldung text={state.fehler} />}

      <Field label="Name">
        <TextInput type="text" name="voller_name" autoComplete="name" />
      </Field>
      <Field label="E-Mail">
        <TextInput type="email" name="email" required autoComplete="email" />
      </Field>
      <Field label="Passwort">
        <TextInput type="password" name="passwort" required minLength={8} autoComplete="new-password" />
      </Field>
      <SubmitButton pending={pending}>Registrieren</SubmitButton>
      <p className="text-center text-[13px] text-muted2">
        Schon ein Konto?{' '}
        <Link href={`/login?redirect_to=${encodeURIComponent(redirectTo)}`} className="font-semibold text-ac hover:underline">
          Anmelden
        </Link>
      </p>
    </form>
  );
}

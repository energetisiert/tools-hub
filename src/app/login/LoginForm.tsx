'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Fehlermeldung, Field, SubmitButton, TextInput } from '@/components/ui/Field';
import { loginAction } from './actions';

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirect_to" value={redirectTo} />
      <input type="text" name="website_url" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp-field" defaultValue="" />

      {state?.fehler && <Fehlermeldung text={state.fehler} />}

      <Field label="E-Mail">
        <TextInput type="email" name="email" required autoComplete="email" placeholder="z. B. name@energetisiert.de" />
      </Field>
      <Field label="Passwort">
        <TextInput type="password" name="passwort" required autoComplete="current-password" placeholder="dein Passwort" />
      </Field>
      <p className="text-right text-[13px] text-muted2">
        <Link href="/passwort-vergessen" className="font-semibold text-ac hover:underline">
          Passwort vergessen?
        </Link>
      </p>
      <SubmitButton pending={pending}>Anmelden</SubmitButton>
      <p className="text-center text-[13px] text-muted2">
        Noch kein Konto?{' '}
        <Link href={`/registrieren?redirect_to=${encodeURIComponent(redirectTo)}`} className="font-semibold text-ac hover:underline">
          Registrieren
        </Link>
      </p>
    </form>
  );
}

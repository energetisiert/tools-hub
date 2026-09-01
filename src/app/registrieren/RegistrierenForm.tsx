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
          Registrierung eingegangen — unser Team prüft deine Anmeldung und schaltet dein Konto frei.
        </p>
        <p className="text-[13px] text-muted2">
          Du kannst dich schon jetzt{' '}
          <Link href="/login" className="font-semibold text-ac hover:underline">
            anmelden
          </Link>{' '}
          und siehst dort den Stand deiner Freischaltung.
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
        <TextInput type="text" name="voller_name" autoComplete="name" placeholder="z. B. Max Mustermann" />
      </Field>
      <Field label="E-Mail">
        <TextInput type="email" name="email" required autoComplete="email" placeholder="z. B. name@energetisiert.de" />
      </Field>
      <Field label="Passwort">
        <TextInput
          type="password"
          name="passwort"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="mindestens 8 Zeichen"
        />
      </Field>
      <SubmitButton pending={pending}>Registrieren</SubmitButton>
      <p className="text-[12px] leading-relaxed text-muted2">
        Wir verwenden deine Angaben ausschließlich für dein Nutzerkonto und die Freischaltung. Details in unserer{' '}
        <a
          href="https://energetisiert.de/datenschutz/"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-ac hover:underline"
        >
          Datenschutzerklärung
        </a>
        .
      </p>
      <p className="text-center text-[13px] text-muted2">
        Schon ein Konto?{' '}
        <Link href={`/login?redirect_to=${encodeURIComponent(redirectTo)}`} className="font-semibold text-ac hover:underline">
          Anmelden
        </Link>
      </p>
    </form>
  );
}

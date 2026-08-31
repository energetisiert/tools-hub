'use client';

import { useActionState } from 'react';
import { Fehlermeldung, SubmitButton } from '@/components/ui/Field';
import { bestaetigenAction } from './actions';

/**
 * Bewusst ein Button-Klick, kein bloßer GET-Link -- verhindert, dass
 * E-Mail-Scanner/Prefetcher den Freischaltungslink versehentlich auslösen.
 */
export function BestaetigenButton({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(bestaetigenAction, null);

  if (state && 'erfolg' in state) {
    return <p className="text-[15px] font-semibold text-ac">Konto freigeschaltet.</p>;
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {state && 'fehler' in state && <Fehlermeldung text={state.fehler} />}
      <SubmitButton pending={pending}>Konto freischalten</SubmitButton>
    </form>
  );
}

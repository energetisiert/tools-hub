'use server';

import { verifyApprovalToken } from '@/lib/security/approval-token';
import { createServiceRoleClient } from '@/lib/supabase/server';

export type BestaetigenState = { fehler: string } | { erfolg: true } | null;

/**
 * Verifiziert das Token serverseitig erneut (nicht nur beim Seitenaufruf) und
 * schaltet den Account per Compare-and-Swap frei -- ein zweiter Klick auf
 * denselben Link ist ein No-Op, kein Fehler.
 */
export async function bestaetigenAction(_prev: BestaetigenState, formData: FormData): Promise<BestaetigenState> {
  const token = String(formData.get('token') ?? '');
  const profileId = await verifyApprovalToken(token);
  if (!profileId) {
    return { fehler: 'Der Bestätigungslink ist ungültig oder abgelaufen.' };
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc('approve_profile', { p_profile_id: profileId });

  if (error) {
    return { fehler: 'Freischaltung fehlgeschlagen. Bitte versuche es erneut.' };
  }

  // data === false bedeutet: schon freigeschaltet (oder abgelehnt) -- kein Fehler, nur kein neuer Effekt.
  void data;
  return { erfolg: true };
}

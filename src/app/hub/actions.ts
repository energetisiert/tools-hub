'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/**
 * Logout ueber denselben SSR-Client wie der Login: dadurch werden die
 * Session-Cookies mit identischen cookieOptions (inkl. Domain
 * .energetisiert.de) geloescht -- abweichende Optionen wuerden nur einen
 * neuen Host-only-Cookie anlegen statt den Domain-Cookie zu entfernen
 * (stilles Logout-Versagen, siehe cookie-options.ts).
 */
export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

/** Loescht ein Studio-Gebaeude samt aller Tool-Knoten (RPC prueft auth.uid()). */
export async function gebaeudeLoeschenAction(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('gebaeude_delete', { p_id: id });
  if (error) {
    console.error('gebaeudeLoeschenAction fehlgeschlagen:', error.message);
    throw new Error('Konnte nicht geloescht werden.');
  }
  revalidatePath('/hub');
}

'use server';

import { redirect } from 'next/navigation';
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

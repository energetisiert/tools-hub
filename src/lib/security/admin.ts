import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Server-seitiges Admin-Gate fuer Seiten unter /admin/nutzer. Liest die
 * Rolle live aus profiles (RLS: profiles_select_own erlaubt nur die eigene
 * Zeile) -- niemals aus dem JWT-Claim, der bis zu ~1h veraltet sein kann.
 *
 * Das ist nur die UI-Schranke (damit Nicht-Admins die Seite gar nicht erst
 * sehen). Die eigentliche Autorisierung sitzt zusaetzlich direkt in den
 * admin_*-SQL-Funktionen (auth.uid() muss dort ebenfalls role='admin' haben)
 * -- Defense in Depth, kein Verlass auf diesen Check allein.
 */
export async function erfordereAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const { data: profil } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profil?.role !== 'admin') {
    redirect('/hub');
  }

  return { supabase, userId: user.id };
}

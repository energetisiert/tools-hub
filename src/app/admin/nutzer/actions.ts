'use server';

import { revalidatePath } from 'next/cache';
import { erfordereAdmin } from '@/lib/security/admin';

/**
 * Beide Actions rufen SQL-Funktionen auf, die selbst pruefen, ob auth.uid()
 * role='admin' hat -- erfordereAdmin() blendet die Seite fuer Nicht-Admins
 * nur aus, ist aber nicht die einzige Schranke.
 */
export async function paketSetzenAction(profileId: string, paketSlug: string): Promise<void> {
  const { supabase } = await erfordereAdmin();
  const { error } = await supabase.rpc('admin_set_package', { p_profile_id: profileId, p_package_slug: paketSlug });
  if (error) {
    console.error('paketSetzenAction fehlgeschlagen:', error.message);
    throw new Error('Paket konnte nicht gesetzt werden.');
  }
  revalidatePath('/admin/nutzer');
}

export async function freischaltenAction(profileId: string): Promise<void> {
  const { supabase } = await erfordereAdmin();
  const { error } = await supabase.rpc('admin_approve_profile', { p_profile_id: profileId });
  if (error) {
    console.error('freischaltenAction fehlgeschlagen:', error.message);
    throw new Error('Konto konnte nicht freigeschaltet werden.');
  }
  revalidatePath('/admin/nutzer');
}

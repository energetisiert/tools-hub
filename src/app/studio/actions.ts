'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/** Neues Gebaeude aus dem Studio-Formular anlegen und direkt oeffnen. */
export async function gebaeudeAnlegenAction(formData: FormData): Promise<void> {
  const kundenname = String(formData.get('kundenname') ?? '').trim();
  const objektadresse = String(formData.get('objektadresse') ?? '').trim();
  if (!kundenname || !objektadresse) redirect('/studio?fehler=felder');
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('gebaeude_upsert', {
    p_id: null,
    p_kundenname: kundenname,
    p_objektadresse: objektadresse,
    p_stammdaten: { schema_version: 1, adresse: objektadresse },
  });
  if (error) {
    console.error('gebaeudeAnlegenAction fehlgeschlagen:', error.message);
    redirect('/studio?fehler=anlegen');
  }
  revalidatePath('/studio');
  revalidatePath('/hub');
  redirect(`/studio/${data}`);
}

/** Kundenname/Objektadresse eines Gebaeudes aendern (RPC prueft auth.uid()). */
export async function gebaeudeKopfAktualisierenAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  const kundenname = String(formData.get('kundenname') ?? '').trim();
  const objektadresse = String(formData.get('objektadresse') ?? '').trim();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc('gebaeude_upsert', {
    p_id: id,
    p_kundenname: kundenname || null,
    p_objektadresse: objektadresse || null,
    p_stammdaten: objektadresse ? { adresse: objektadresse } : {},
  });
  if (error) console.error('gebaeudeKopfAktualisierenAction fehlgeschlagen:', error.message);
  revalidatePath(`/studio/${id}`);
  revalidatePath('/studio');
  revalidatePath('/hub');
}

/** Einen Tool-Knoten vom Gebaeude entfernen (Gebaeude bleibt). */
export async function knotenEntfernenAction(formData: FormData): Promise<void> {
  const knotenId = String(formData.get('knotenId') ?? '');
  const gebaeudeId = String(formData.get('gebaeudeId') ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(knotenId)) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc('gebaeude_knoten_delete', { p_id: knotenId });
  if (error) console.error('knotenEntfernenAction fehlgeschlagen:', error.message);
  revalidatePath(`/studio/${gebaeudeId}`);
  revalidatePath('/hub');
}

/** Gebaeude samt Knoten loeschen, danach zurueck zur Studio-Liste. */
export async function gebaeudeLoeschenStudioAction(formData: FormData): Promise<void> {
  const id = String(formData.get('id') ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc('gebaeude_delete', { p_id: id });
  if (error) console.error('gebaeudeLoeschenStudioAction fehlgeschlagen:', error.message);
  revalidatePath('/studio');
  revalidatePath('/hub');
  redirect('/studio');
}

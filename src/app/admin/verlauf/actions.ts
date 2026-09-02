'use server';

import { revalidatePath } from 'next/cache';
import { erfordereAdmin } from '@/lib/security/admin';

const REPOS = ['heizlastrechner', 'foerderrechner', 'gebaeudeabgrenzung', 'co2-rechner', 'sanierungsrechner', 'tools-hub'] as const;
const KATEGORIEN = ['security', 'performance', 'fix', 'feature', 'infra'] as const;

export type EintragState = { fehler: string } | { erfolg: true } | null;

/**
 * Legt einen Changelog-Eintrag an -- ruft admin_add_changelog_entry() auf,
 * die selbst prueft, ob auth.uid() role='admin' hat (Defense in Depth, siehe
 * lib/security/admin.ts).
 */
export async function eintragAnlegenAction(_prev: EintragState, formData: FormData): Promise<EintragState> {
  const { supabase } = await erfordereAdmin();

  const version = String(formData.get('version') ?? '').trim();
  const category = String(formData.get('category') ?? '');
  const repoRoh = String(formData.get('repo') ?? '');
  const repo = REPOS.includes(repoRoh as (typeof REPOS)[number]) ? repoRoh : null;
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();

  if (!version || !title || !description || !KATEGORIEN.includes(category as (typeof KATEGORIEN)[number])) {
    return { fehler: 'Bitte Version, Kategorie, Titel und Beschreibung ausfüllen.' };
  }
  if (version.length > 40 || title.length > 200 || description.length > 2000) {
    return { fehler: 'Eingabe zu lang.' };
  }

  const { error } = await supabase.rpc('admin_add_changelog_entry', {
    p_version: version,
    p_category: category,
    p_repo: repo,
    p_title: title,
    p_description: description,
  });
  if (error) {
    console.error('eintragAnlegenAction fehlgeschlagen:', error.message);
    return { fehler: 'Eintrag konnte nicht angelegt werden.' };
  }

  revalidatePath('/admin/verlauf');
  return { erfolg: true };
}

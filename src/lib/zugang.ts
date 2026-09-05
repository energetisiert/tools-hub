import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/** Reihenfolge der Paketstufen -- fuer "Ab Paket X" an gesperrten Tools. */
export const PAKET_STUFEN = ['basic', 'pro', 'elite'];

/**
 * Gemeinsame Zugangspruefung fuer Hub und Studio: Session, Freischaltung,
 * Paket -> freigeschaltete Tool-Slugs (fail-closed ohne Paket). Liest die
 * LIVE-Datenbank, nicht den bis zu ~1h alten JWT-Claim.
 */
export async function ladeZugang() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profil } = await supabase
    .from('profiles')
    .select('status, package_id, full_name, role')
    .eq('id', user.id)
    .single();
  if ((profil?.status ?? 'pending') !== 'approved') redirect('/warten-auf-freischaltung');

  const [{ data: pakete }, { data: paketTools }] = await Promise.all([
    supabase.from('packages').select('id, slug, name'),
    supabase.from('package_tools').select('package_id, tool_slug'),
  ]);
  const eigenesPaket = profil?.package_id ? (pakete ?? []).find((p) => p.id === profil.package_id) ?? null : null;
  const freigeschalteteSlugs: Set<string> = eigenesPaket
    ? new Set((paketTools ?? []).filter((pt) => pt.package_id === eigenesPaket.id).map((pt) => pt.tool_slug))
    : new Set();

  const sperrLabel = (slug: string): string => {
    for (const stufe of PAKET_STUFEN) {
      const paket = (pakete ?? []).find((p) => p.slug === stufe);
      if (paket && (paketTools ?? []).some((pt) => pt.package_id === paket.id && pt.tool_slug === slug)) {
        return `Ab Paket ${paket.name}`;
      }
    }
    return 'Nur für Vertriebspartner';
  };

  return { supabase, user, profil, eigenesPaket, freigeschalteteSlugs, sperrLabel };
}

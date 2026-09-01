import { erfordereAdmin } from '@/lib/security/admin';
import { NutzerTabelle } from './NutzerTabelle';

export const dynamic = 'force-dynamic';

type ProfilZeile = {
  id: string;
  email: string;
  full_name: string | null;
  status: string;
  role: string;
  package_slug: string | null;
  created_at: string;
};

export default async function NutzerVerwaltungPage() {
  const { supabase, userId } = await erfordereAdmin();

  const { data, error } = await supabase.rpc('admin_list_profiles');
  const zeilen = (data ?? []) as ProfilZeile[];

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-7 sm:py-10">
      <div className="mb-7">
        <span className="font-disp block text-[12px] font-bold uppercase tracking-[0.12em] text-ac">Verwaltung</span>
        <h1 className="font-disp mt-1 text-[23px] font-extrabold tracking-tight">Nutzer &amp; Pakete</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          Freischaltung und Paketzuordnung (Basic / Pro / Elite) für alle registrierten Konten.
        </p>
      </div>

      {error && <p className="mb-4 rounded-xl bg-red/10 px-3.5 py-2.5 text-[13.5px] text-red">Konnte Nutzer nicht laden: {error.message}</p>}

      <NutzerTabelle zeilen={zeilen} eigeneId={userId} />
    </div>
  );
}

import { erfordereAdmin } from '@/lib/security/admin';
import { freischaltenAction } from './actions';
import { PaketSegment } from './PaketSegment';

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

const STATUS_LABEL: Record<string, string> = {
  pending: 'Wartet auf Freischaltung',
  approved: 'Freigeschaltet',
  rejected: 'Abgelehnt',
};

export default async function NutzerVerwaltungPage() {
  const { supabase } = await erfordereAdmin();

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

      {error && <p className="rounded-xl bg-red/10 px-3.5 py-2.5 text-[13.5px] text-red">Konnte Nutzer nicht laden: {error.message}</p>}

      <div className="overflow-x-auto rounded-[14px] border border-black/[0.08] bg-white">
        <table className="w-full min-w-[760px] text-[13px]">
          <thead>
            <tr className="border-b border-black/[0.07] text-left">
              <th className="px-4 py-3 font-semibold text-muted2">Name</th>
              <th className="px-4 py-3 font-semibold text-muted2">E-Mail</th>
              <th className="px-4 py-3 font-semibold text-muted2">Rolle</th>
              <th className="px-4 py-3 font-semibold text-muted2">Status</th>
              <th className="px-4 py-3 font-semibold text-muted2">Paket</th>
            </tr>
          </thead>
          <tbody>
            {zeilen.map((z) => (
              <tr key={z.id} className="border-b border-black/[0.05] last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{z.full_name || '—'}</td>
                <td className="px-4 py-3 text-muted">{z.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      z.role === 'admin' ? 'bg-dark text-mint' : 'bg-tint text-muted2'
                    }`}
                  >
                    {z.role === 'admin' ? 'Admin' : 'Benutzer'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      z.status === 'approved'
                        ? 'bg-[rgba(31,122,77,0.09)] text-ac'
                        : z.status === 'rejected'
                          ? 'bg-red/10 text-red'
                          : 'bg-[#fdf6e7] text-[#6b5518]'
                    }`}
                  >
                    {STATUS_LABEL[z.status] ?? z.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {z.status === 'pending' ? (
                    <form action={freischaltenAction.bind(null, z.id)}>
                      <button
                        type="submit"
                        className="rounded-full bg-doc px-3.5 py-1.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-dark"
                      >
                        Freischalten
                      </button>
                    </form>
                  ) : (
                    <PaketSegment profileId={z.id} aktuell={z.package_slug} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

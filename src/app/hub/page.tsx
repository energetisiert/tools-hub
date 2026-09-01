import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { logoutAction } from './actions';
import { GEPLANTE_TOOLS, LIVE_TOOLS, type HubTool } from './tools';

export const dynamic = 'force-dynamic';

/**
 * Die Tool-Uebersicht nach dem Login -- die Zwischenstelle zwischen Konto und
 * den Rechner-Tools. Zugriffslogik:
 *   1. Keine Session -> /login
 *   2. Status nicht 'approved' -> /warten-auf-freischaltung
 *   3. package_id null -> Vollzugriff (Uebergangszustand, bis Pakete definiert
 *      sind); sonst entscheidet package_tools, welche Kacheln oeffnen.
 * Wichtig: hier zaehlt die LIVE-Datenbank (RLS-geschuetzte profiles-Abfrage),
 * nicht der bis zu ~1h alte JWT-Claim -- der Claim ist nur fuer schnelle
 * Middleware-Redirects in den Tools gedacht.
 */
export default async function HubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profil } = await supabase.from('profiles').select('status, package_id, full_name').eq('id', user.id).single();

  if ((profil?.status ?? 'pending') !== 'approved') {
    redirect('/warten-auf-freischaltung');
  }

  // null = Vollzugriff auf alle Live-Tools (noch kein Paket zugewiesen).
  let freigeschalteteSlugs: Set<string> | null = null;
  if (profil?.package_id) {
    const { data: paketTools } = await supabase.from('package_tools').select('tool_slug').eq('package_id', profil.package_id);
    freigeschalteteSlugs = new Set((paketTools ?? []).map((t) => t.tool_slug));
  }

  const vorname = (profil?.full_name ?? '').trim().split(/\s+/)[0] || null;

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-7 sm:py-10">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[640px]">
          <span className="font-disp block text-[12px] font-bold uppercase tracking-[0.12em] text-ac">
            {vorname ? `Willkommen, ${vorname}` : 'Willkommen'}
          </span>
          <h1 className="font-disp mt-1 text-[23px] font-extrabold tracking-tight">Deine Tools</h1>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">
            Einmal angemeldet, überall erkannt — die Anmeldung gilt automatisch auf allen Tool-Subdomains.
          </p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-full border border-black/[0.12] px-4 py-2 text-[12.5px] font-semibold text-strong transition-colors hover:border-ac hover:text-ac"
          >
            Abmelden
          </button>
        </form>
      </div>

      <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-strong">Verfügbare Werkzeuge</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-3">
        {LIVE_TOOLS.map((tool) => (
          <ToolKachel key={tool.slug} tool={tool} gesperrt={freigeschalteteSlugs !== null && !freigeschalteteSlugs.has(tool.slug)} />
        ))}
      </div>

      <h2 className="mb-3 mt-9 text-[11px] font-bold uppercase tracking-[0.08em] text-strong">In Entwicklung</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-3">
        {GEPLANTE_TOOLS.map((tool) => (
          <ToolKachel key={tool.slug} tool={tool} geplant />
        ))}
      </div>
    </div>
  );
}

function ToolKachel({ tool, gesperrt = false, geplant = false }: { tool: HubTool; gesperrt?: boolean; geplant?: boolean }) {
  return (
    <div className="flex flex-col gap-2 rounded-[14px] border border-black/[0.08] bg-white p-3.5">
      <div className="flex items-center gap-2.5">
        <span className="font-disp flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[9px] bg-tint text-[11.5px] font-bold text-ink">
          {tool.mono}
        </span>
        <h3 className="text-[12.5px] font-semibold leading-snug">{tool.name}</h3>
      </div>
      {(tool.ueberschlag || geplant) && (
        <div className="flex flex-wrap gap-1">
          {geplant && (
            <span className="rounded-full bg-tint px-2 py-0.5 text-[9.5px] font-bold text-muted2">In Entwicklung</span>
          )}
          {tool.ueberschlag && (
            <span className="rounded-full border border-[#f0e2bf] bg-[#fdf6e7] px-2 py-0.5 text-[9.5px] font-bold text-[#6b5518]">
              Überschlag, kein Nachweis
            </span>
          )}
        </div>
      )}
      <p className="flex-1 text-[10.5px] leading-relaxed text-muted">{tool.desc}</p>
      {geplant ? (
        <span className="cursor-not-allowed rounded-full border border-black/[0.12] py-1.5 text-center text-[11px] font-semibold text-muted2">
          Bald verfügbar
        </span>
      ) : gesperrt ? (
        <span className="cursor-not-allowed rounded-full border border-black/[0.12] py-1.5 text-center text-[11px] font-semibold text-muted2">
          Nicht in deinem Paket
        </span>
      ) : (
        <a
          href={tool.url}
          className="rounded-full border border-black/[0.12] py-1.5 text-center text-[11px] font-semibold text-ink transition-colors hover:border-ac hover:text-ac"
        >
          Öffnen
        </a>
      )}
    </div>
  );
}

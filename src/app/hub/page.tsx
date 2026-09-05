import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { logoutAction } from './actions';
import { GEPLANTE_TOOLS, LIVE_TOOLS, type HubTool } from './tools';
import { GebaeudeListe } from './GebaeudeListe';

export const dynamic = 'force-dynamic';

/** Reihenfolge der Paketstufen -- fuer "Ab Pro"/"Ab Elite" an gesperrten Kacheln. */
const PAKET_STUFEN = ['basic', 'pro', 'elite'];

/**
 * Die Tool-Uebersicht nach dem Login -- die Zwischenstelle zwischen Konto und
 * den Rechner-Tools. Zugriffslogik:
 *   1. Keine Session -> /login
 *   2. Status nicht 'approved' -> /warten-auf-freischaltung
 *   3. Paket (profiles.package_id -> package_tools) entscheidet, welche
 *      Kacheln oeffnen; kein Paket = keine Kacheln offen (fail-closed, deckt
 *      sich mit hat_zugriff()/zugriffsstatus() in der DB -- Freischaltung
 *      weist normalen Konten automatisch Basic zu, Admins bekommen Elite).
 * Wichtig: hier zaehlt die LIVE-Datenbank (RLS-geschuetzte Abfragen), nicht
 * der bis zu ~1h alte JWT-Claim -- der Claim ist nur fuer schnelle
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

  const { data: profil } = await supabase
    .from('profiles')
    .select('status, package_id, full_name, role')
    .eq('id', user.id)
    .single();

  if ((profil?.status ?? 'pending') !== 'approved') {
    redirect('/warten-auf-freischaltung');
  }

  const [{ data: pakete }, { data: paketTools }] = await Promise.all([
    supabase.from('packages').select('id, slug, name'),
    supabase.from('package_tools').select('package_id, tool_slug'),
  ]);

  const eigenesPaket = profil?.package_id ? (pakete ?? []).find((p) => p.id === profil.package_id) ?? null : null;

  // Fail-closed: kein Paket zugewiesen -> leere Menge, keine Kachel offen.
  const freigeschalteteSlugs: Set<string> = eigenesPaket
    ? new Set((paketTools ?? []).filter((pt) => pt.package_id === eigenesPaket.id).map((pt) => pt.tool_slug))
    : new Set();

  // Fuer gesperrte Kacheln: die guenstigste Paketstufe, die das Tool enthaelt.
  const abStufe = (slug: string): string | null => {
    for (const stufe of PAKET_STUFEN) {
      const paket = (pakete ?? []).find((p) => p.slug === stufe);
      if (paket && (paketTools ?? []).some((pt) => pt.package_id === paket.id && pt.tool_slug === slug)) {
        return paket.name;
      }
    }
    return null;
  };

  // Tools, die ausschliesslich ueber ein Nicht-Stufen-Paket (z. B. "Partner")
  // erreichbar sind, haben keine PAKET_STUFEN-Stufe -- "Ab Paket X" ergibt fuer
  // sie keinen Sinn, da Partner keine Aufstiegsstufe von Basic/Pro/Elite ist.
  const sperrLabel = (slug: string): string => {
    const stufenName = abStufe(slug);
    return stufenName ? `Ab Paket ${stufenName}` : 'Nur für Vertriebspartner';
  };

  const vorname = (profil?.full_name ?? '').trim().split(/\s+/)[0] || null;

  let wartendeAnzahl = 0;
  if (profil?.role === 'admin') {
    const { data } = await supabase.rpc('admin_pending_count');
    wartendeAnzahl = typeof data === 'number' ? data : 0;
  }

  // Studio-Gebaeude: jeder Nutzer sieht hier seine eigenen Gebaeude mit den
  // Knoten aller Tools, unabhaengig vom Paket (RPC filtert per auth.uid()).
  const { data: gebaeude } = await supabase.rpc('gebaeude_list');
  const toolNamen = Object.fromEntries(LIVE_TOOLS.map((t) => [t.slug, t.name]));
  const toolUrls = Object.fromEntries(LIVE_TOOLS.filter((t) => t.url).map((t) => [t.slug, t.url!]));

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
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <span className="rounded-full bg-dark px-3.5 py-1.5 text-[11.5px] font-bold text-mint">
            Paket: {eigenesPaket?.name ?? 'Keins'}
          </span>
          {profil?.role === 'admin' && (
            <Link
              href="/admin/nutzer"
              className="relative rounded-full border border-black/[0.12] px-4 py-2 text-[12.5px] font-semibold text-strong transition-colors hover:border-ac hover:text-ac"
            >
              Verwaltung
              {wartendeAnzahl > 0 && (
                <span
                  className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-warm px-1 text-[10px] font-bold text-white"
                  title={`${wartendeAnzahl} Konto${wartendeAnzahl === 1 ? '' : 'en'} wartet auf Freischaltung`}
                >
                  {wartendeAnzahl}
                </span>
              )}
            </Link>
          )}
          {profil?.role === 'admin' && (
            <Link
              href="/admin/verlauf"
              className="rounded-full border border-black/[0.12] px-4 py-2 text-[12.5px] font-semibold text-strong transition-colors hover:border-ac hover:text-ac"
            >
              Verlauf
            </Link>
          )}
          <Link
            href="/studio"
            className="rounded-full border border-black/[0.12] px-4 py-2 text-[12.5px] font-semibold text-strong transition-colors hover:border-ac hover:text-ac"
          >
            Studio
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-full border border-black/[0.12] px-4 py-2 text-[12.5px] font-semibold text-strong transition-colors hover:border-ac hover:text-ac"
            >
              Abmelden
            </button>
          </form>
        </div>
      </div>

      <GebaeudeListe eintraege={gebaeude ?? []} toolNamen={toolNamen} toolUrls={toolUrls} />

      <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-strong">Verfügbare Werkzeuge</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(230px,100%),1fr))] gap-3">
        {LIVE_TOOLS.map((tool) => {
          const gesperrt = !freigeschalteteSlugs.has(tool.slug);
          return <ToolKachel key={tool.slug} tool={tool} gesperrt={gesperrt} sperrLabel={gesperrt ? sperrLabel(tool.slug) : null} />;
        })}
      </div>

      <h2 className="mb-3 mt-9 text-[11px] font-bold uppercase tracking-[0.08em] text-strong">In Entwicklung</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(230px,100%),1fr))] gap-3">
        {GEPLANTE_TOOLS.map((tool) => (
          <ToolKachel key={tool.slug} tool={tool} geplant />
        ))}
      </div>
    </div>
  );
}

function ToolKachel({
  tool,
  gesperrt = false,
  sperrLabel = null,
  geplant = false,
}: {
  tool: HubTool;
  gesperrt?: boolean;
  /** Anzeigetext der Sperr-Badge (z. B. "Ab Paket Elite" oder "Nur für Vertriebspartner") -- nur bei gesperrten Kacheln gesetzt. */
  sperrLabel?: string | null;
  geplant?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-2 rounded-[14px] border border-black/[0.08] bg-white p-3.5 ${gesperrt ? 'opacity-75' : ''}`}>
      <div className="flex items-center gap-2.5">
        <span className="font-disp flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[9px] bg-tint text-[11.5px] font-bold text-ink">
          {tool.mono}
        </span>
        <h3 className="text-[12.5px] font-semibold leading-snug">{tool.name}</h3>
      </div>
      {(tool.ueberschlag || geplant || gesperrt) && (
        <div className="flex flex-wrap gap-1">
          {geplant && (
            <span className="rounded-full bg-tint px-2 py-0.5 text-[9.5px] font-bold text-muted2">In Entwicklung</span>
          )}
          {gesperrt && (
            <span className="rounded-full bg-tint px-2 py-0.5 text-[9.5px] font-bold text-muted2">{sperrLabel}</span>
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

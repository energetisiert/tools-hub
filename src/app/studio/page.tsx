import Link from 'next/link';
import { ladeZugang } from '@/lib/zugang';
import { LIVE_TOOLS } from '@/app/hub/tools';
import { gebaeudeAnlegenAction } from './actions';
import { kpisSortiert } from './kpis';

export const dynamic = 'force-dynamic';

interface KnotenKurz { id: string; tool_slug: string; updated_at: string; ergebnis_zusammenfassung: Record<string, unknown> }
interface Gebaeude { id: string; kundenname: string; objektadresse: string; stammdaten: Record<string, unknown>; updated_at: string; knoten: KnotenKurz[] }

/**
 * Studio-Uebersicht: alle eigenen Gebaeude als Karten (Kopf, Kurz-Stammdaten,
 * angehaengte Tools), Formular fuer ein neues Gebaeude. Die Detailseite
 * /studio/[id] zeigt Ist-Zustand, Knoten-Karten und "Was kommt als Naechstes?".
 */
export default async function StudioPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase } = await ladeZugang();
  const sp = await searchParams;
  const { data } = await supabase.rpc('gebaeude_list');
  const gebaeude = (data ?? []) as Gebaeude[];
  const toolNamen = Object.fromEntries(LIVE_TOOLS.map((t) => [t.slug, t.name]));

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-7 sm:py-10">
      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[640px]">
          <span className="font-disp block text-[12px] font-bold uppercase tracking-[0.12em] text-ac">Studio</span>
          <h1 className="font-disp mt-1 text-[23px] font-extrabold tracking-tight">Deine Gebäude</h1>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">
            Ein Gebäude einmal anlegen, dann alle Tools daran anknüpfen — die Stammdaten wandern mit.
          </p>
        </div>
        <Link href="/hub" className="rounded-full border border-black/[0.12] px-4 py-2 text-[12.5px] font-semibold text-strong transition-colors hover:border-ac hover:text-ac">
          ← Zum Hub
        </Link>
      </div>

      <form action={gebaeudeAnlegenAction} className="mb-8 grid grid-cols-1 gap-3 rounded-[14px] border border-black/[0.08] bg-white p-4 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-strong">Kundenname</span>
          <input name="kundenname" required maxLength={200} className="w-full rounded-xl border border-black/[0.14] bg-bg px-3.5 py-2.5 text-[14px] outline-none focus:border-ac" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.08em] text-strong">Objektadresse</span>
          <input name="objektadresse" required maxLength={300} placeholder="Straße, Hausnummer, PLZ, Ort" className="w-full rounded-xl border border-black/[0.14] bg-bg px-3.5 py-2.5 text-[14px] outline-none focus:border-ac" />
        </label>
        <button type="submit" className="rounded-full bg-dark px-5 py-2.5 text-[12.5px] font-bold text-mint transition-opacity hover:opacity-90">
          Gebäude anlegen
        </button>
        {sp.fehler && <p className="text-[12px] text-red sm:col-span-3">Das Gebäude konnte nicht angelegt werden. Bitte Kundenname und Objektadresse angeben.</p>}
      </form>

      {gebaeude.length === 0 ? (
        <p className="rounded-[14px] border border-dashed border-black/[0.15] bg-white p-6 text-center text-[13px] text-muted">
          Noch keine Gebäude. Lege oben eines an oder speichere eine Berechnung in einem Tool &bdquo;im Geb&auml;ude&ldquo;.
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(300px,100%),1fr))] gap-3">
          {gebaeude.map((g) => {
            const kpis = kpisSortiert(Object.assign({}, ...g.knoten.map((k) => k.ergebnis_zusammenfassung)), 3);
            return (
              <Link key={g.id} href={`/studio/${g.id}`} className="flex flex-col gap-2 rounded-[14px] border border-black/[0.08] bg-white p-4 transition-colors hover:border-ac">
                <div>
                  <strong className="text-[14px] font-semibold">{g.kundenname}</strong>
                  <div className="text-[12px] text-muted">{g.objektadresse}</div>
                  <div className="text-[10.5px] text-muted2">
                    zuletzt {new Date(g.updated_at).toLocaleDateString('de-DE')}
                    {typeof g.stammdaten?.wohnflaeche_m2 === 'number' && ` · ${g.stammdaten.wohnflaeche_m2} m²`}
                    {typeof g.stammdaten?.baujahr === 'number' ? ` · Baujahr ${g.stammdaten.baujahr}` : typeof g.stammdaten?.baujahr_klasse === 'string' && ` · Baujahr ${g.stammdaten.baujahr_klasse}`}
                  </div>
                </div>
                {kpis.length > 0 && (
                  <dl className="grid grid-cols-3 gap-2">
                    {kpis.map((k) => (
                      <div key={k.label} className="rounded-lg bg-tint px-2 py-1.5">
                        <dt className="text-[9.5px] font-bold uppercase tracking-[0.06em] text-muted2">{k.label}</dt>
                        <dd className="text-[12.5px] font-semibold tabular-nums">{k.wert}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                <div className="mt-auto flex flex-wrap gap-1">
                  {g.knoten.length === 0 && <span className="text-[11px] text-muted2">Noch keine Berechnung</span>}
                  {g.knoten.map((k) => (
                    <span key={k.id} className="rounded-full bg-tint px-2 py-0.5 text-[10px] font-bold text-strong">{toolNamen[k.tool_slug] ?? k.tool_slug}</span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

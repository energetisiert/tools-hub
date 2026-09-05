import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ladeZugang } from '@/lib/zugang';
import { GEPLANTE_TOOLS, LIVE_TOOLS } from '@/app/hub/tools';
import { gebaeudeKopfAktualisierenAction, gebaeudeLoeschenStudioAction, knotenEntfernenAction } from '../actions';
import { kpisSortiert } from '../kpis';

export const dynamic = 'force-dynamic';

interface Knoten { id: string; tool_slug: string; updated_at: string; ergebnis_zusammenfassung: Record<string, unknown> }
interface Detail {
  gebaeude: { id: string; kundenname: string; objektadresse: string; stammdaten: Record<string, unknown>; created_at: string; updated_at: string };
  knoten: Knoten[];
}

/** Kuratierte Reihenfolge fuer "Was kommt als Naechstes?" */
const REIHENFOLGE = ['heizlastrechner', 'foerderrechner', 'foerderstrategie', 'sanierungsrechner', 'co2-rechner', 'gebaeudeabgrenzung', 'heizlastrechner-gep'];

const STAMMDATEN_LABELS: { pfad: string[]; label: string; einheit?: string }[] = [
  { pfad: ['plz'], label: 'PLZ' },
  { pfad: ['gebaeudeart'], label: 'Gebäudeart' },
  { pfad: ['gebaeudetyp'], label: 'Gebäudetyp' },
  { pfad: ['baujahr'], label: 'Baujahr' },
  { pfad: ['baujahr_klasse'], label: 'Baualtersklasse' },
  { pfad: ['wohnflaeche_m2'], label: 'Wohnfläche', einheit: 'm²' },
  { pfad: ['wohneinheiten'], label: 'Wohneinheiten' },
  { pfad: ['personen'], label: 'Personen' },
  { pfad: ['geschosse'], label: 'Geschosse' },
  { pfad: ['heizung', 'energietraeger'], label: 'Energieträger' },
  { pfad: ['heizung', 'erzeuger'], label: 'Wärmeerzeuger' },
  { pfad: ['heizung', 'baujahr'], label: 'Heizung Baujahr' },
  { pfad: ['verbrauch', 'menge'], label: 'Verbrauch' },
  { pfad: ['eigentuemer', 'antragstellertyp'], label: 'Antragsteller' },
  { pfad: ['eigentuemer', 'nutzung'], label: 'Nutzung' },
  { pfad: ['sanierung', 'ehStufe'], label: 'Ziel-Effizienzhaus' },
  { pfad: ['denkmal'], label: 'Denkmal' },
];

function lies(o: Record<string, unknown>, pfad: string[]): unknown {
  return pfad.reduce<unknown>((acc, k) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[k] : undefined), o);
}

const LABELS: Record<string, string> = {
  wg: 'Wohngebäude', nwg: 'Nichtwohngebäude', efh: 'Einfamilienhaus', dhh: 'Doppelhaushälfte', rmh: 'Reihenmittelhaus', reh: 'Reihenendhaus', mfh: 'Mehrfamilienhaus',
  erdgas: 'Erdgas', heizoel: 'Heizöl', fluessiggas: 'Flüssiggas', pellets: 'Pellets', scheitholz: 'Scheitholz', fernwaerme: 'Fernwärme', strom: 'Strom', waermepumpe: 'Wärmepumpe', biomasse: 'Biomasse', kohle: 'Kohle',
  privat: 'privat', unternehmen: 'Unternehmen', weg: 'WEG', kommune: 'Kommune', gemeinnuetzig: 'gemeinnützig', selbstnutzend: 'selbst genutzt', vermietet: 'vermietet', gemischt: 'gemischt',
};

export default async function StudioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase, freigeschalteteSlugs, sperrLabel } = await ladeZugang();
  const { data, error } = await supabase.rpc('gebaeude_get', { p_id: id });
  if (error || !data) notFound();
  const detail = data as Detail;
  const g = detail.gebaeude;
  const s = g.stammdaten ?? {};
  const toolVon = Object.fromEntries(LIVE_TOOLS.map((t) => [t.slug, t]));
  const angehaengt = new Set(detail.knoten.map((k) => k.tool_slug));
  const naechste = REIHENFOLGE.map((slug) => toolVon[slug]).filter((t) => t && !angehaengt.has(t.slug));
  const stammdatenZeilen = STAMMDATEN_LABELS.map(({ pfad, label, einheit }) => {
    const v = lies(s, pfad);
    if (v === undefined || v === null || v === '') return null;
    const text = typeof v === 'boolean' ? (v ? 'ja' : 'nein') : typeof v === 'number' ? `${v.toLocaleString('de-DE')}${einheit ? ` ${einheit}` : ''}` : (LABELS[String(v)] ?? String(v));
    if (pfad[0] === 'verbrauch' && typeof s.verbrauch === 'object' && s.verbrauch) {
      const vb = s.verbrauch as Record<string, unknown>;
      return { label, text: `${text} ${vb.einheit ?? ''}${vb.jahr ? ` (${vb.jahr})` : ''}` };
    }
    return { label, text };
  }).filter((z): z is { label: string; text: string } => z !== null);
  const kpis = kpisSortiert(Object.assign({}, ...detail.knoten.map((k) => k.ergebnis_zusammenfassung)), 4);

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-7 sm:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href="/studio" className="text-[12.5px] font-semibold text-ac hover:underline">← Alle Gebäude</Link>
        <form action={gebaeudeLoeschenStudioAction}>
          <input type="hidden" name="id" value={g.id} />
          <button type="submit" className="text-[12px] font-semibold text-red hover:underline">Gebäude löschen</button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {/* Ist-Zustand */}
          <section className="rounded-[18px] bg-dark p-6 text-white">
            <span className="font-disp block text-[11px] font-bold uppercase tracking-[0.14em] text-mint">Ist-Zustand</span>
            <form action={gebaeudeKopfAktualisierenAction} className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end">
              <input type="hidden" name="id" value={g.id} />
              <label className="block">
                <span className="mb-1 block text-[10.5px] font-bold uppercase tracking-[0.08em] text-white/60">Kundenname</span>
                <input name="kundenname" defaultValue={g.kundenname} maxLength={200} className="w-full rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-[14px] font-semibold text-white outline-none focus:border-mint" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10.5px] font-bold uppercase tracking-[0.08em] text-white/60">Objektadresse</span>
                <input name="objektadresse" defaultValue={g.objektadresse} maxLength={300} className="w-full rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-[14px] text-white outline-none focus:border-mint" />
              </label>
              <button type="submit" className="rounded-full bg-white/10 px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-white/20">Speichern</button>
            </form>

            {kpis.length > 0 && (
              <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {kpis.map((k) => (
                  <div key={k.label} className="rounded-2xl bg-white/[0.06] px-3.5 py-3">
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/60">{k.label}</dt>
                    <dd className="font-disp mt-0.5 text-[20px] font-extrabold tracking-tight text-mint tabular-nums">{k.wert}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="mt-5">
              <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-white/60">Stammdaten</span>
              {stammdatenZeilen.length === 0 ? (
                <p className="mt-1 text-[12.5px] text-white/70">Noch keine Fachdaten — sie füllen sich, sobald ein Tool speichert.</p>
              ) : (
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12.5px] sm:grid-cols-3">
                  {stammdatenZeilen.map((z) => (
                    <div key={z.label} className="flex justify-between gap-2 border-b border-white/10 py-1">
                      <dt className="text-white/60">{z.label}</dt>
                      <dd className="font-semibold text-white tabular-nums">{z.text}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <p className="mt-2 text-[11px] text-white/50">
                Stammdaten werden von den Tools beim Speichern ergänzt — Änderungen nimmst du im jeweiligen Tool vor, das Gebäude wird dabei aktualisiert.
              </p>
            </div>
          </section>

          {/* Knoten */}
          <section>
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-strong">Berechnungen an diesem Gebäude</h2>
            {detail.knoten.length === 0 ? (
              <p className="rounded-[14px] border border-dashed border-black/[0.15] bg-white p-5 text-[13px] text-muted">
                Noch nichts angehängt — wähle rechts den ersten Schritt.
              </p>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))] gap-3">
                {detail.knoten.map((k) => {
                  const tool = toolVon[k.tool_slug];
                  const kk = kpisSortiert(k.ergebnis_zusammenfassung, 6);
                  return (
                    <div key={k.id} className="flex flex-col gap-3 rounded-[14px] border border-black/[0.08] bg-white p-4">
                      <div className="flex items-center gap-2.5">
                        <span className="font-disp flex h-[30px] w-[30px] flex-none items-center justify-center rounded-[9px] bg-tint text-[11.5px] font-bold text-ink">{tool?.mono ?? '??'}</span>
                        <div className="min-w-0">
                          <h3 className="text-[13px] font-semibold leading-snug">{tool?.name ?? k.tool_slug}</h3>
                          <div className="text-[10.5px] text-muted2">gespeichert {new Date(k.updated_at).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                        </div>
                      </div>
                      {kk.length > 0 ? (
                        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px]">
                          {kk.map((x) => (
                            <div key={x.label} className="flex justify-between gap-2 border-b border-black/[0.06] py-0.5">
                              <dt className="text-muted">{x.label}</dt>
                              <dd className="font-semibold tabular-nums">{x.wert}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        <p className="text-[12px] text-muted2">Eingaben gespeichert, noch kein Ergebnis hinterlegt.</p>
                      )}
                      <div className="mt-auto flex items-center justify-between gap-3">
                        {tool?.url && (
                          <a href={`${tool.url}?gebaeude=${encodeURIComponent(g.id)}`} className="rounded-full bg-dark px-4 py-1.5 text-[11.5px] font-bold text-mint transition-opacity hover:opacity-90">
                            Im Tool öffnen
                          </a>
                        )}
                        <form action={knotenEntfernenAction}>
                          <input type="hidden" name="knotenId" value={k.id} />
                          <input type="hidden" name="gebaeudeId" value={g.id} />
                          <button type="submit" className="text-[11.5px] font-semibold text-red hover:underline">Entfernen</button>
                        </form>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Was kommt als Naechstes? */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-[18px] border border-black/[0.08] bg-white p-4">
            <h2 className="font-disp text-[15px] font-bold tracking-tight">Was kommt als Nächstes?</h2>
            <p className="mt-1 text-[12px] text-muted">Jedes Tool öffnet mit den Stammdaten dieses Gebäudes vorbelegt.</p>
            <ul className="mt-3 space-y-2">
              {naechste.length === 0 && <li className="text-[12.5px] text-muted2">Alle verfügbaren Tools sind angehängt.</li>}
              {naechste.map((t) => {
                const frei = freigeschalteteSlugs.has(t.slug);
                return (
                  <li key={t.slug} className={`flex items-center gap-2.5 rounded-xl border border-black/[0.08] p-2.5 ${frei ? '' : 'opacity-70'}`}>
                    <span className="font-disp flex h-[28px] w-[28px] flex-none items-center justify-center rounded-[8px] bg-tint text-[11px] font-bold text-ink">{t.mono}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12.5px] font-semibold leading-snug">{t.name}</div>
                      {!frei && <div className="text-[10px] font-bold text-muted2">{sperrLabel(t.slug)}</div>}
                    </div>
                    {frei && t.url ? (
                      <a href={`${t.url}?gebaeude=${encodeURIComponent(g.id)}`} className="flex-none rounded-full border border-black/[0.12] px-3 py-1 text-[11px] font-semibold text-strong transition-colors hover:border-ac hover:text-ac">
                        Starten
                      </a>
                    ) : (
                      <span className="flex-none rounded-full bg-tint px-3 py-1 text-[11px] font-semibold text-muted2">Gesperrt</span>
                    )}
                  </li>
                );
              })}
              {GEPLANTE_TOOLS.map((t) => (
                <li key={t.slug} className="flex items-center gap-2.5 rounded-xl border border-dashed border-black/[0.1] p-2.5 opacity-60">
                  <span className="font-disp flex h-[28px] w-[28px] flex-none items-center justify-center rounded-[8px] bg-tint text-[11px] font-bold text-ink">{t.mono}</span>
                  <div className="min-w-0 flex-1 text-[12.5px] font-semibold leading-snug">{t.name}</div>
                  <span className="flex-none text-[10px] font-bold text-muted2">bald</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

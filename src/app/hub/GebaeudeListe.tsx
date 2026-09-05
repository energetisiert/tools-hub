'use client';

import { useState, useTransition } from 'react';
import { gebaeudeLoeschenAction } from './actions';

export interface GebaeudeKnotenKurz {
  id: string;
  tool_slug: string;
  updated_at: string;
  ergebnis_zusammenfassung: Record<string, unknown>;
}

export interface GebaeudeEintrag {
  id: string;
  kundenname: string;
  objektadresse: string;
  stammdaten: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  knoten: GebaeudeKnotenKurz[];
}

/**
 * Studio-Gebaeude (Phase 1): ein Gebaeude, mehrere Tool-Knoten. Zeigt je
 * Gebaeude die angehaengten Berechnungen als Chips mit Sprung ins Tool
 * (?gebaeude=<id> wird ab Phase 2 dort ausgewertet, bis dahin oeffnet der
 * Link einfach das Tool) und erlaubt das Loeschen des ganzen Gebaeudes.
 * Kennzahlen (heizlast_kw usw.) kommen aus gebaeude_knoten.ergebnis_zusammenfassung.
 */
function kennzahl(k: GebaeudeKnotenKurz): string | null {
  const e = k.ergebnis_zusammenfassung ?? {};
  const kw = e.heizlast_kw;
  if (typeof kw === 'number') return `${kw.toLocaleString('de-DE', { maximumFractionDigits: 1 })} kW`;
  const deckung = e.gep_deckung_prozent;
  if (typeof deckung === 'number') return `${deckung >= 0 ? '+' : ''}${deckung.toLocaleString('de-DE', { maximumFractionDigits: 0 })} %`;
  return null;
}

export function GebaeudeListe({
  eintraege, toolNamen, toolUrls,
}: {
  eintraege: GebaeudeEintrag[];
  toolNamen: Record<string, string>;
  toolUrls: Record<string, string>;
}) {
  const [pending, startTransition] = useTransition();
  const [fehler, setFehler] = useState<string | null>(null);
  const [geloescht, setGeloescht] = useState<Set<string>>(new Set());

  function loeschen(g: GebaeudeEintrag) {
    if (!window.confirm(`Gebäude „${g.kundenname}“ mit allen gespeicherten Berechnungen löschen?`)) return;
    setFehler(null);
    startTransition(async () => {
      try {
        await gebaeudeLoeschenAction(g.id);
        setGeloescht((prev) => new Set(prev).add(g.id));
      } catch (e) {
        setFehler(e instanceof Error ? e.message : 'Konnte nicht gelöscht werden.');
      }
    });
  }

  const sichtbar = eintraege.filter((e) => !geloescht.has(e.id));
  if (sichtbar.length === 0) return null;

  return (
    <div className="mb-9">
      <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-strong">Meine Gebäude</h2>
      <div className="rounded-[14px] border border-black/[0.08] bg-white">
        {sichtbar.map((g, i) => (
          <div key={g.id} className={`px-4 py-3 ${i > 0 ? 'border-t border-black/[0.06]' : ''}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <strong className="text-[12.5px] font-semibold">{g.kundenname}</strong>
                <div className="text-[11.5px] text-muted">{g.objektadresse}</div>
                <div className="text-[10.5px] text-muted2">
                  zuletzt {new Date(g.updated_at).toLocaleDateString('de-DE')}
                  {typeof g.stammdaten?.wohnflaeche_m2 === 'number' && ` · ${g.stammdaten.wohnflaeche_m2} m²`}
                  {typeof g.stammdaten?.baujahr_klasse === 'string' && ` · Baujahr ${g.stammdaten.baujahr_klasse}`}
                </div>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => loeschen(g)}
                className="text-[11.5px] font-semibold text-red disabled:opacity-50"
              >
                Löschen
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {g.knoten.length === 0 && <span className="text-[11px] text-muted2">Noch keine Berechnung angehängt.</span>}
              {g.knoten.map((k) => {
                const url = toolUrls[k.tool_slug];
                const wert = kennzahl(k);
                const inhalt = (
                  <>
                    <span className="font-bold">{toolNamen[k.tool_slug] ?? k.tool_slug}</span>
                    {wert && <span className="text-muted2"> · {wert}</span>}
                  </>
                );
                return url ? (
                  <a
                    key={k.id}
                    href={`${url}?gebaeude=${encodeURIComponent(g.id)}`}
                    className="rounded-full border border-black/[0.1] bg-tint px-2.5 py-1 text-[11px] text-strong transition-colors hover:border-ac hover:text-ac"
                    title="Im Tool öffnen"
                  >
                    {inhalt}
                  </a>
                ) : (
                  <span key={k.id} className="rounded-full bg-tint px-2.5 py-1 text-[11px] text-strong">{inhalt}</span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {fehler && <p className="mt-1 text-[11px] text-red">{fehler}</p>}
    </div>
  );
}

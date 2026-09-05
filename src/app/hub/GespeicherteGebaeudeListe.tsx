'use client';

import { useState, useTransition } from 'react';
import { gespeichertesLoeschenAction } from './actions';

export interface GespeichertesGebaeude {
  id: string;
  kundenname: string;
  objektadresse: string;
  tool_slug: string;
  created_at: string;
}

/**
 * Reine Uebersicht ueber alle eigenen gespeicherten Gebaeude, toolübergreifend
 * (saved_results_list() ohne p_tool_slug). Laden/Reingehen macht nur im
 * jeweiligen Tool selbst Sinn (dort wird der komplette Formularzustand
 * rekonstruiert) -- hier nur "ist vorhanden" plus Link zum Tool und Loeschen.
 */
export function GespeicherteGebaeudeListe({
  eintraege, toolNamen, toolUrls,
}: {
  eintraege: GespeichertesGebaeude[];
  toolNamen: Record<string, string>;
  toolUrls: Record<string, string>;
}) {
  const [pending, startTransition] = useTransition();
  const [fehler, setFehler] = useState<string | null>(null);
  const [geloescht, setGeloescht] = useState<Set<string>>(new Set());

  function loeschen(id: string) {
    setFehler(null);
    startTransition(async () => {
      try {
        await gespeichertesLoeschenAction(id);
        setGeloescht((prev) => new Set(prev).add(id));
      } catch (e) {
        setFehler(e instanceof Error ? e.message : 'Konnte nicht gelöscht werden.');
      }
    });
  }

  const sichtbar = eintraege.filter((e) => !geloescht.has(e.id));
  if (sichtbar.length === 0) return null;

  return (
    <div className="mb-9">
      <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-strong">Gespeicherte Ergebnisse (bisheriges Format)</h2>
      <div className="rounded-[14px] border border-black/[0.08] bg-white">
        {sichtbar.map((e, i) => (
          <div
            key={e.id}
            className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${i > 0 ? 'border-t border-black/[0.06]' : ''}`}
          >
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <strong className="text-[12.5px] font-semibold">{e.kundenname}</strong>
                <span className="rounded-full bg-tint px-2 py-0.5 text-[9.5px] font-bold text-muted2">
                  {toolNamen[e.tool_slug] ?? e.tool_slug}
                </span>
              </div>
              <div className="text-[11.5px] text-muted">{e.objektadresse}</div>
              <div className="text-[10.5px] text-muted2">{new Date(e.created_at).toLocaleDateString('de-DE')}</div>
            </div>
            <div className="flex flex-none items-center gap-3">
              {toolUrls[e.tool_slug] && (
                <a href={toolUrls[e.tool_slug]} className="text-[11.5px] font-semibold text-ac hover:underline">
                  Zum Tool
                </a>
              )}
              <button
                type="button"
                disabled={pending}
                onClick={() => loeschen(e.id)}
                className="text-[11.5px] font-semibold text-red disabled:opacity-50"
              >
                Löschen
              </button>
            </div>
          </div>
        ))}
      </div>
      {fehler && <p className="mt-1 text-[11px] text-red">{fehler}</p>}
    </div>
  );
}

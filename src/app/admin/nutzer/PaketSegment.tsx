'use client';

import { useState, useTransition } from 'react';
import { paketSetzenAction } from './actions';

const STUFEN = [
  { slug: 'basic', label: 'Basic' },
  { slug: 'pro', label: 'Pro' },
  { slug: 'elite', label: 'Elite' },
];

export function PaketSegment({ profileId, aktuell }: { profileId: string; aktuell: string | null }) {
  const [pending, startTransition] = useTransition();
  const [fehler, setFehler] = useState<string | null>(null);

  function klick(slug: string) {
    setFehler(null);
    startTransition(async () => {
      try {
        await paketSetzenAction(profileId, slug);
      } catch (e) {
        setFehler(e instanceof Error ? e.message : 'Paket konnte nicht gesetzt werden.');
      }
    });
  }

  return (
    <div>
      <div className="inline-flex gap-0.5 rounded-full border border-black/[0.08] bg-tint p-1">
        {STUFEN.map((s) => (
          <button
            key={s.slug}
            type="button"
            disabled={pending}
            onClick={() => klick(s.slug)}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50 ${
              aktuell === s.slug ? 'bg-ink text-white' : 'text-muted hover:text-ink'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      {fehler && <p className="mt-1 text-[11px] text-red">{fehler}</p>}
    </div>
  );
}

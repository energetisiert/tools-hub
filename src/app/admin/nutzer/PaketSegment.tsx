'use client';

import { useTransition } from 'react';
import { paketSetzenAction } from './actions';

const STUFEN = [
  { slug: 'basic', label: 'Basic' },
  { slug: 'pro', label: 'Pro' },
  { slug: 'elite', label: 'Elite' },
];

export function PaketSegment({ profileId, aktuell }: { profileId: string; aktuell: string | null }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="inline-flex gap-0.5 rounded-full border border-black/[0.08] bg-tint p-1">
      {STUFEN.map((s) => (
        <button
          key={s.slug}
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => paketSetzenAction(profileId, s.slug))}
          className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50 ${
            aktuell === s.slug ? 'bg-ink text-white' : 'text-muted hover:text-ink'
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

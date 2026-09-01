'use client';

import { useMemo, useState, useTransition } from 'react';
import { freischaltenAction } from './actions';
import { PaketSegment } from './PaketSegment';

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

const STATUS_FILTER = ['alle', 'pending', 'approved', 'rejected'] as const;
type StatusFilter = (typeof STATUS_FILTER)[number];

type SpaltenKey = 'full_name' | 'email' | 'role' | 'status' | 'package_slug';

const SPALTEN: { key: SpaltenKey; label: string }[] = [
  { key: 'full_name', label: 'Name' },
  { key: 'email', label: 'E-Mail' },
  { key: 'role', label: 'Rolle' },
  { key: 'status', label: 'Status' },
  { key: 'package_slug', label: 'Paket' },
];

/**
 * Suche (Name/E-Mail), Status-Filter und sortierbare Spalten -- alles rein
 * clientseitig auf der bereits geladenen Liste. Bei der ueberschaubaren
 * Nutzerzahl dieses internen Tools lohnt sich kein Server-Roundtrip pro
 * Tastenanschlag/Klick.
 */
export function NutzerTabelle({ zeilen }: { zeilen: ProfilZeile[] }) {
  const [suche, setSuche] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('alle');
  const [sortSpalte, setSortSpalte] = useState<SpaltenKey>('full_name');
  const [sortRichtung, setSortRichtung] = useState<'auf' | 'ab'>('auf');

  const sichtbar = useMemo(() => {
    const suchbegriff = suche.trim().toLowerCase();
    const gefiltert = zeilen.filter((z) => {
      if (statusFilter !== 'alle' && z.status !== statusFilter) return false;
      if (!suchbegriff) return true;
      return (z.full_name ?? '').toLowerCase().includes(suchbegriff) || z.email.toLowerCase().includes(suchbegriff);
    });

    const vorzeichen = sortRichtung === 'auf' ? 1 : -1;
    return [...gefiltert].sort((a, b) => {
      const wa = (a[sortSpalte] ?? '') as string;
      const wb = (b[sortSpalte] ?? '') as string;
      return wa.localeCompare(wb, 'de', { sensitivity: 'base' }) * vorzeichen;
    });
  }, [zeilen, suche, statusFilter, sortSpalte, sortRichtung]);

  function spalteKlick(spalte: SpaltenKey) {
    if (spalte === sortSpalte) {
      setSortRichtung((r) => (r === 'auf' ? 'ab' : 'auf'));
    } else {
      setSortSpalte(spalte);
      setSortRichtung('auf');
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <input
          type="text"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          placeholder="Suche nach Name oder E-Mail…"
          className="w-full max-w-[280px] rounded-xl border border-strong/50 bg-white px-3.5 py-2 text-[13px] text-ink outline-none focus:border-ac"
        />
        <div className="inline-flex flex-wrap gap-0.5 rounded-full border border-black/[0.08] bg-tint p-1">
          {STATUS_FILTER.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition-colors ${
                statusFilter === s ? 'bg-ink text-white' : 'text-muted hover:text-ink'
              }`}
            >
              {s === 'alle' ? 'Alle' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[12px] text-muted2">
          {sichtbar.length} von {zeilen.length}
        </span>
      </div>

      <div className="overflow-x-auto rounded-[14px] border border-black/[0.08] bg-white">
        <table className="w-full min-w-[820px] text-[13px]">
          <thead>
            <tr className="border-b border-black/[0.07] text-left">
              {SPALTEN.map((s) => (
                <th key={s.key} className="px-4 py-3 font-semibold text-muted2">
                  <button type="button" onClick={() => spalteKlick(s.key)} className="inline-flex items-center gap-1 hover:text-ink">
                    {s.label}
                    {sortSpalte === s.key && <span aria-hidden="true">{sortRichtung === 'auf' ? '↑' : '↓'}</span>}
                  </button>
                </th>
              ))}
              <th className="px-4 py-3 font-semibold text-muted2">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {sichtbar.map((z) => (
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
                <td className="px-4 py-3">{z.status !== 'pending' && <PaketSegment profileId={z.id} aktuell={z.package_slug} />}</td>
                <td className="px-4 py-3">{z.status === 'pending' && <FreischaltenButton profileId={z.id} />}</td>
              </tr>
            ))}
            {sichtbar.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[13px] text-muted2">
                  Keine Treffer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FreischaltenButton({ profileId }: { profileId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => freischaltenAction(profileId))}
      className="rounded-full bg-doc px-3.5 py-1.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-dark disabled:opacity-50"
    >
      {pending ? '…' : 'Freischalten'}
    </button>
  );
}

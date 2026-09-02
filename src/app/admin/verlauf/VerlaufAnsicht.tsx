'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { eintragAnlegenAction, type EintragState } from './actions';

type ChangelogZeile = {
  id: string;
  version: string;
  category: string;
  repo: string | null;
  title: string;
  description: string;
  created_at: string;
};

type AuditZeile = {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  action: string;
  target_id: string | null;
  detail: Record<string, unknown> | null;
  created_at: string;
};

const KATEGORIE_LABEL: Record<string, string> = {
  security: 'Sicherheit',
  performance: 'Performance',
  fix: 'Fehlerbehebung',
  feature: 'Feature',
  infra: 'Infrastruktur',
};

const KATEGORIE_FARBE: Record<string, string> = {
  security: 'bg-red/10 text-red',
  performance: 'bg-[rgba(31,122,77,0.09)] text-ac',
  fix: 'bg-tint text-muted2',
  feature: 'bg-[#fdf6e7] text-[#6b5518]',
  infra: 'bg-tint text-muted2',
};

const AKTION_LABEL: Record<string, string> = {
  approve_profile: 'Konto freigeschaltet',
  delete_profile: 'Konto gelöscht',
  set_package: 'Paket geändert',
};

function datum(iso: string) {
  return new Date(iso).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });
}

export function VerlaufAnsicht({ changelog, auditLog }: { changelog: ChangelogZeile[]; auditLog: AuditZeile[] }) {
  const [tab, setTab] = useState<'changelog' | 'audit'>('changelog');
  const [suche, setSuche] = useState('');
  const [formOffen, setFormOffen] = useState(false);

  const sichtbarChangelog = useMemo(() => {
    const s = suche.trim().toLowerCase();
    if (!s) return changelog;
    return changelog.filter(
      (c) => c.title.toLowerCase().includes(s) || c.description.toLowerCase().includes(s) || (c.repo ?? '').includes(s),
    );
  }, [changelog, suche]);

  const sichtbarAudit = useMemo(() => {
    const s = suche.trim().toLowerCase();
    if (!s) return auditLog;
    return auditLog.filter((a) => (a.actor_name ?? '').toLowerCase().includes(s) || a.action.toLowerCase().includes(s));
  }, [auditLog, suche]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <div className="inline-flex flex-wrap gap-0.5 rounded-full border border-black/[0.08] bg-tint p-1">
          {(['changelog', 'audit'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold transition-colors ${
                tab === t ? 'bg-ink text-white' : 'text-muted hover:text-ink'
              }`}
            >
              {t === 'changelog' ? 'Changelog' : 'Audit-Log'}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          placeholder={tab === 'changelog' ? 'Suche nach Titel, Beschreibung, Tool…' : 'Suche nach Person, Aktion…'}
          className="w-full max-w-[280px] rounded-xl border border-strong/50 bg-white px-3.5 py-2 text-[13px] text-ink outline-none focus:border-ac"
        />
        {tab === 'changelog' && (
          <button
            type="button"
            onClick={() => setFormOffen((v) => !v)}
            className="ml-auto rounded-full bg-doc px-3.5 py-1.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-dark"
          >
            {formOffen ? 'Abbrechen' : '+ Eintrag'}
          </button>
        )}
      </div>

      {tab === 'changelog' && formOffen && <NeuerEintragForm onDone={() => setFormOffen(false)} />}

      {tab === 'changelog' ? (
        <div className="flex flex-col gap-2.5">
          {sichtbarChangelog.map((c) => (
            <div key={c.id} className="rounded-[14px] border border-black/[0.08] bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-dark px-2.5 py-1 text-[10.5px] font-bold text-mint">v{c.version}</span>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${KATEGORIE_FARBE[c.category] ?? 'bg-tint text-muted2'}`}>
                  {KATEGORIE_LABEL[c.category] ?? c.category}
                </span>
                {c.repo && <span className="rounded-full bg-tint px-2.5 py-1 text-[11px] font-semibold text-muted2">{c.repo}</span>}
                <span className="ml-auto text-[11.5px] text-muted2">{datum(c.created_at)}</span>
              </div>
              <h3 className="mt-2.5 text-[14px] font-semibold text-ink">{c.title}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">{c.description}</p>
            </div>
          ))}
          {sichtbarChangelog.length === 0 && <p className="px-1 py-8 text-center text-[13px] text-muted2">Keine Treffer.</p>}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[14px] border border-black/[0.08] bg-white">
          <table className="w-full min-w-[620px] text-[13px]">
            <thead>
              <tr className="border-b border-black/[0.07] text-left">
                <th className="px-4 py-3 font-semibold text-muted2">Zeitpunkt</th>
                <th className="px-4 py-3 font-semibold text-muted2">Wer</th>
                <th className="px-4 py-3 font-semibold text-muted2">Aktion</th>
                <th className="px-4 py-3 font-semibold text-muted2">Detail</th>
              </tr>
            </thead>
            <tbody>
              {sichtbarAudit.map((a) => (
                <tr key={a.id} className="border-b border-black/[0.05] last:border-0">
                  <td className="px-4 py-3 text-muted2">{datum(a.created_at)}</td>
                  <td className="px-4 py-3 font-medium text-ink">{a.actor_name ?? '—'}</td>
                  <td className="px-4 py-3">{AKTION_LABEL[a.action] ?? a.action}</td>
                  <td className="px-4 py-3 text-muted2">{a.detail ? JSON.stringify(a.detail) : '—'}</td>
                </tr>
              ))}
              {sichtbarAudit.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[13px] text-muted2">
                    Keine Treffer.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function NeuerEintragForm({ onDone }: { onDone: () => void }) {
  const [state, action, pending] = useActionState<EintragState, FormData>(eintragAnlegenAction, null);
  const erfolgreich = !!(state && 'erfolg' in state && state.erfolg);

  useEffect(() => {
    if (erfolgreich) onDone();
  }, [erfolgreich, onDone]);

  return (
    <form action={action} className="mb-4 grid grid-cols-2 gap-2.5 rounded-[14px] border border-black/[0.08] bg-white p-4 sm:grid-cols-4">
      <input name="version" placeholder="Version, z.B. 1.2.0" required className="rounded-xl border border-strong/50 px-3 py-2 text-[13px]" />
      <select name="category" required defaultValue="" className="rounded-xl border border-strong/50 px-3 py-2 text-[13px]">
        <option value="" disabled>
          Kategorie…
        </option>
        {Object.entries(KATEGORIE_LABEL).map(([k, l]) => (
          <option key={k} value={k}>
            {l}
          </option>
        ))}
      </select>
      <select name="repo" defaultValue="" className="rounded-xl border border-strong/50 px-3 py-2 text-[13px]">
        <option value="">Übergreifend</option>
        <option value="heizlastrechner">Heizlastrechner</option>
        <option value="foerderrechner">Förderrechner</option>
        <option value="gebaeudeabgrenzung">Gebäudeabgrenzung</option>
        <option value="co2-rechner">CO2-Rechner</option>
        <option value="sanierungsrechner">Sanierungsrechner-WG</option>
        <option value="tools-hub">Tools Hub</option>
      </select>
      <input name="title" placeholder="Titel" required className="rounded-xl border border-strong/50 px-3 py-2 text-[13px]" />
      <textarea
        name="description"
        placeholder="Beschreibung"
        required
        rows={2}
        className="col-span-2 rounded-xl border border-strong/50 px-3 py-2 text-[13px] sm:col-span-4"
      />
      {state && 'fehler' in state && <p className="col-span-2 text-[12.5px] text-red sm:col-span-4">{state.fehler}</p>}
      <button
        type="submit"
        disabled={pending}
        className="col-span-2 rounded-full bg-doc px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-dark disabled:opacity-50 sm:col-span-4"
      >
        {pending ? 'Speichert…' : 'Eintrag speichern'}
      </button>
    </form>
  );
}

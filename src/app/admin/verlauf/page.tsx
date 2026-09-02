import { erfordereAdmin } from '@/lib/security/admin';
import { VerlaufAnsicht } from './VerlaufAnsicht';

export const dynamic = 'force-dynamic';

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

export default async function VerlaufPage() {
  const { supabase } = await erfordereAdmin();

  const [{ data: changelog, error: changelogError }, { data: auditLog, error: auditError }] = await Promise.all([
    supabase.rpc('admin_list_changelog', { p_limit: 200 }),
    supabase.rpc('admin_list_audit_log', { p_limit: 200 }),
  ]);

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-7 sm:py-10">
      <div className="mb-7">
        <span className="font-disp block text-[12px] font-bold uppercase tracking-[0.12em] text-ac">Verwaltung</span>
        <h1 className="font-disp mt-1 text-[23px] font-extrabold tracking-tight">Verlauf</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          Änderungshistorie über alle Tools und Protokoll sensibler Admin-Aktionen (Freischalten, Löschen, Paket setzen).
        </p>
      </div>

      {changelogError && (
        <p className="mb-4 rounded-xl bg-red/10 px-3.5 py-2.5 text-[13.5px] text-red">
          Konnte Changelog nicht laden: {changelogError.message}
        </p>
      )}
      {auditError && (
        <p className="mb-4 rounded-xl bg-red/10 px-3.5 py-2.5 text-[13.5px] text-red">
          Konnte Audit-Log nicht laden: {auditError.message}
        </p>
      )}

      <VerlaufAnsicht changelog={(changelog ?? []) as ChangelogZeile[]} auditLog={(auditLog ?? []) as AuditZeile[]} />
    </div>
  );
}

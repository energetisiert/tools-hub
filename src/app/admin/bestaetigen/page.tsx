import { AuthShell } from '@/components/ui/AuthShell';
import { Card } from '@/components/ui/Card';
import { Fehlermeldung } from '@/components/ui/Field';
import { verifyApprovalToken } from '@/lib/security/approval-token';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { BestaetigenButton } from './BestaetigenButton';

export const dynamic = 'force-dynamic';

export default async function BestaetigenPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const profileId = await verifyApprovalToken(token);

  if (!profileId) {
    return (
      <AuthShell>
        <Card title="Link ungültig">
          <Fehlermeldung text="Dieser Bestätigungslink ist ungültig oder abgelaufen (gültig 24 Stunden nach Versand der Mail)." />
        </Card>
      </AuthShell>
    );
  }

  const supabase = createServiceRoleClient();
  const [{ data: profil }, { data: userData }] = await Promise.all([
    supabase.from('profiles').select('status, full_name').eq('id', profileId).single(),
    supabase.auth.admin.getUserById(profileId),
  ]);

  const email = userData?.user?.email ?? 'unbekannt';

  if (!profil || profil.status !== 'pending') {
    return (
      <AuthShell>
        <Card title="Bereits bearbeitet">
          <p className="text-[15px] text-strong">
            Dieses Konto ({email}) wurde bereits bearbeitet (Status: {profil?.status ?? 'unbekannt'}).
          </p>
        </Card>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <Card title="Neue Registrierung bestätigen">
        <div className="mb-5 space-y-1 text-[14.5px] text-strong">
          <p>
            <span className="text-muted2">Name:</span> {profil.full_name || '—'}
          </p>
          <p>
            <span className="text-muted2">E-Mail:</span> {email}
          </p>
        </div>
        <BestaetigenButton token={token!} />
      </Card>
    </AuthShell>
  );
}

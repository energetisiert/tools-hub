import { AuthShell } from '@/components/ui/AuthShell';
import { Card } from '@/components/ui/Card';
import { PasswortVergessenForm } from './PasswortVergessenForm';

export const dynamic = 'force-dynamic';

export default async function PasswortVergessenPage({ searchParams }: { searchParams: Promise<{ ungueltig?: string }> }) {
  const { ungueltig } = await searchParams;

  return (
    <AuthShell>
      <Card title="Passwort vergessen">
        <PasswortVergessenForm linkUngueltig={ungueltig === '1'} />
      </Card>
    </AuthShell>
  );
}

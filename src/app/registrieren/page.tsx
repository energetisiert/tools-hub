import { AuthShell } from '@/components/ui/AuthShell';
import { Card } from '@/components/ui/Card';
import { RegistrierenForm } from './RegistrierenForm';

export const dynamic = 'force-dynamic';

export default async function RegistrierenPage({ searchParams }: { searchParams: Promise<{ redirect_to?: string }> }) {
  const { redirect_to } = await searchParams;

  return (
    <AuthShell>
      <Card title="Konto erstellen">
        <RegistrierenForm redirectTo={redirect_to ?? ''} />
      </Card>
    </AuthShell>
  );
}

import { AuthShell } from '@/components/ui/AuthShell';
import { Card } from '@/components/ui/Card';
import { LoginForm } from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ redirect_to?: string; hinweis?: string }> }) {
  const { redirect_to, hinweis } = await searchParams;

  return (
    <AuthShell>
      <Card title="Anmelden">
        {hinweis === 'inaktiv' && (
          <p role="status" className="mb-5 rounded-[12px] border border-ac/30 bg-ac/[0.06] px-4 py-3 text-[13px] leading-[1.55] text-ink">
            Du wurdest nach 30 Minuten ohne Aktivität automatisch abgemeldet. Bitte melde dich erneut an.
          </p>
        )}
        <LoginForm redirectTo={redirect_to ?? ''} />
      </Card>
    </AuthShell>
  );
}

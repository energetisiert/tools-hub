import { Card } from '@/components/ui/Card';
import { LoginForm } from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ redirect_to?: string }> }) {
  const { redirect_to } = await searchParams;

  return (
    <Card title="Anmelden">
      <LoginForm redirectTo={redirect_to ?? ''} />
    </Card>
  );
}

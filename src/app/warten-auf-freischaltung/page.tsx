import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/ui/AuthShell';
import { Card } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function WartenAufFreischaltungPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profil } = await supabase.from('profiles').select('status').eq('id', user.id).single();
  const status = profil?.status ?? 'pending';

  if (status === 'approved') {
    return (
      <AuthShell>
        <Card title="Konto freigeschaltet">
          <p className="text-[15px] text-strong">
            Dein Konto ist freigeschaltet — die Anmeldung gilt automatisch für alle Tools.
          </p>
          <Link
            href="/hub"
            className="mt-5 block rounded-full bg-doc px-4 py-3 text-center text-[14.5px] font-semibold text-white transition-colors hover:bg-dark"
          >
            Zu deinen Tools
          </Link>
        </Card>
      </AuthShell>
    );
  }

  if (status === 'rejected') {
    return (
      <AuthShell>
        <Card title="Zugang nicht freigeschaltet">
          <p className="text-[15px] text-strong">
            Dein Konto wurde nicht freigeschaltet. Bei Fragen wende dich bitte an{' '}
            <a href="mailto:info@energetisiert.de" className="font-semibold text-ac hover:underline">
              info@energetisiert.de
            </a>
            .
          </p>
        </Card>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <Card title="Fast geschafft">
        <p className="text-[15px] text-strong">
          Dein Konto wartet auf Freischaltung durch unser Team. Sobald das erledigt ist, findest du hier deine Tool-Übersicht —
          die Anmeldung gilt dann automatisch für alle Rechner-Tools.
        </p>
      </Card>
    </AuthShell>
  );
}

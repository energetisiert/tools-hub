import { redirect } from 'next/navigation';
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
      <Card title="Konto freigeschaltet">
        <p className="text-[15px] text-strong">
          Dein Konto ist freigeschaltet. Du kannst jetzt zu einem der Rechner-Tools zurückgehen und dich dort anmelden — die
          Anmeldung gilt automatisch für alle Tools.
        </p>
      </Card>
    );
  }

  if (status === 'rejected') {
    return (
      <Card title="Zugang nicht freigeschaltet">
        <p className="text-[15px] text-strong">
          Dein Konto wurde nicht freigeschaltet. Bei Fragen wende dich bitte an{' '}
          <a href="mailto:info@energetisiert.de" className="font-semibold text-ac hover:underline">
            info@energetisiert.de
          </a>
          .
        </p>
      </Card>
    );
  }

  return (
    <Card title="Fast geschafft">
      <p className="text-[15px] text-strong">
        Dein Konto wartet auf Freischaltung durch unser Team. Sobald das erledigt ist, kannst du dich mit deinen Zugangsdaten bei
        jedem der Rechner-Tools anmelden.
      </p>
    </Card>
  );
}

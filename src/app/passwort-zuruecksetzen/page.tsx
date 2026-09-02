import Link from 'next/link';
import { AuthShell } from '@/components/ui/AuthShell';
import { Card } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/server';
import { PasswortZuruecksetzenForm } from './PasswortZuruecksetzenForm';

export const dynamic = 'force-dynamic';

/**
 * Erreichbar nur ueber /auth/confirm nach gueltigem token_hash -- dort wird
 * bereits eine echte Session gesetzt. Ohne Session (Link abgelaufen, schon
 * benutzt, oder Seite direkt ohne Link aufgerufen) gibt es keine Zurueck-
 * setzen-Form, sondern nur den Hinweis, einen neuen Link anzufordern.
 */
export default async function PasswortZuruecksetzenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <AuthShell>
      <Card title="Neues Passwort">
        {user ? (
          <PasswortZuruecksetzenForm />
        ) : (
          <div className="space-y-3 text-center">
            <p className="text-[15px] text-strong">Dieser Link ist ungültig oder abgelaufen.</p>
            <p className="text-[13px] text-muted2">
              <Link href="/passwort-vergessen" className="font-semibold text-ac hover:underline">
                Neuen Link anfordern
              </Link>
            </p>
          </div>
        )}
      </Card>
    </AuthShell>
  );
}

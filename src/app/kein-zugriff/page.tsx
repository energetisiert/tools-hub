import Link from 'next/link';
import { AuthShell } from '@/components/ui/AuthShell';
import { Card } from '@/components/ui/Card';
import { LIVE_TOOLS } from '../hub/tools';

export const dynamic = 'force-dynamic';

/**
 * Ziel der Middleware jedes der fuenf Tools, wenn eine Session zwar
 * eingeloggt und freigeschaltet ist, das gebuchte Paket dieses Tool aber
 * nicht enthaelt. Nimmt ?tool=<slug> entgegen, um eine konkrete Meldung zu
 * zeigen -- faellt bei unbekanntem/fehlendem Slug auf eine generische
 * Meldung zurueck statt einen Fehler zu werfen.
 */
export default async function KeinZugriffPage({ searchParams }: { searchParams: Promise<{ tool?: string }> }) {
  const { tool } = await searchParams;
  const gesuchtesTool = LIVE_TOOLS.find((t) => t.slug === tool);

  return (
    <AuthShell>
      <Card title="Nicht in deinem Paket enthalten">
        <p className="text-[15px] text-strong">
          {gesuchtesTool ? (
            <>
              <b>{gesuchtesTool.name}</b> ist in deinem aktuellen Paket nicht enthalten.
            </>
          ) : (
            'Dieses Werkzeug ist in deinem aktuellen Paket nicht enthalten.'
          )}
        </p>
        <p className="mt-3 text-[13px] leading-relaxed text-muted2">
          Für ein Upgrade melde dich bei{' '}
          <a href="mailto:info@energetisiert.de" className="font-semibold text-ac hover:underline">
            info@energetisiert.de
          </a>
          .
        </p>
        <Link
          href="/hub"
          className="mt-5 block rounded-full bg-doc px-4 py-3 text-center text-[14.5px] font-semibold text-white transition-colors hover:bg-dark"
        >
          Zurück zur Übersicht
        </Link>
      </Card>
    </AuthShell>
  );
}

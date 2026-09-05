import type { Metadata, Viewport } from 'next';
import { Instrument_Sans, Montserrat } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';
import { IdleLogout } from '@/components/IdleLogout';
import './globals.css';

const montserrat = Montserrat({ variable: '--font-montserrat', subsets: ['latin'], weight: ['700', '800'] });
const instrumentSans = Instrument_Sans({ variable: '--font-instrument-sans', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'energetisiert. tools',
  description: 'Die Rechner-Tools von energetisiert. — ein Konto, alle Werkzeuge.',
};

// Ohne dieses explizite viewport-Meta behandeln mobile Browser die Seite wie
// eine ~980px breite Desktop-Seite und skalieren sie insgesamt herunter --
// dadurch wirkt alles verkleinert und schlecht zentriert. userScalable:false
// unterbindet zusaetzlich Pinch-Zoom in beide Richtungen (Produktentscheidung).
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="de" className={`${montserrat.variable} ${instrumentSans.variable}`}>
      <body className="flex min-h-screen flex-col bg-bg text-ink antialiased">
        <header className="border-b border-black/[0.07] px-4 py-4 sm:px-7">
          <div className="mx-auto flex max-w-[1180px] items-center">
            <Link href="/">
              <Image src="/energetisiert-logo.png" alt="energetisiert." width={154} height={20} priority className="h-5 w-auto sm:h-6" />
            </Link>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-black/[0.07] px-4 py-5 sm:px-7">
          <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-muted2">
            <span>© energetisiert.</span>
            <a href="https://energetisiert.de/impressum/" target="_blank" rel="noreferrer" className="hover:text-ac">
              Impressum
            </a>
            <a href="https://energetisiert.de/datenschutz/" target="_blank" rel="noreferrer" className="hover:text-ac">
              Datenschutz
            </a>
          </div>
        </footer>
        <IdleLogout />
      </body>
    </html>
  );
}

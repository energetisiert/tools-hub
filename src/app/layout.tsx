import type { Metadata } from 'next';
import { Instrument_Sans, Montserrat } from 'next/font/google';
import Image from 'next/image';
import './globals.css';

const montserrat = Montserrat({ variable: '--font-montserrat', subsets: ['latin'], weight: ['700', '800'] });
const instrumentSans = Instrument_Sans({ variable: '--font-instrument-sans', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Konto — energetisiert. tools',
  description: 'Anmeldung und Registrierung fuer die energetisiert. Rechner-Tools.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="de" className={`${montserrat.variable} ${instrumentSans.variable}`}>
      <body className="min-h-screen bg-bg text-ink antialiased">
        <header className="border-b border-black/[0.07] px-4 py-4 sm:px-7">
          <div className="mx-auto flex max-w-[420px] items-center">
            <Image src="/energetisiert-logo.png" alt="energetisiert." width={154} height={20} priority className="h-5 w-auto sm:h-6" />
          </div>
        </header>
        <main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-[420px] flex-col justify-center px-4 py-10 sm:px-0">
          {children}
        </main>
      </body>
    </html>
  );
}

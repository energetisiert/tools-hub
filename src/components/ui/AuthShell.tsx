import type { ReactNode } from 'react';

/**
 * Schmaler, vertikal zentrierter Rahmen fuer die Auth-Seiten (Login,
 * Registrierung, Warteseite, Admin-Bestaetigung). Die Hub-Seite nutzt
 * dagegen die volle Breite des Root-Layouts.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-150px)] w-full max-w-[420px] flex-col justify-center px-4 py-10 sm:px-0">
      {children}
    </div>
  );
}

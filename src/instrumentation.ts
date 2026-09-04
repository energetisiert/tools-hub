/**
 * Start-Pruefung der Konfiguration.
 *
 * Next.js ruft register() genau einmal beim BOOT des Servers auf -- nicht
 * waehrend `next build`. Das ist der einzige Ort, an dem eine fehlende
 * Pflicht-Variable auffallen kann, ohne den Build zu brechen.
 *
 * Warum ueberhaupt: REQUEST_TOKEN_SECRET wird an zwei Stellen gebraucht
 * (Freischaltungs-Links aus der Admin-Mail und -- seit dem Salt-Fix -- die
 * Rate-Limit-Schluessel). Fehlt es, schlaegt beides erst zur Laufzeit fehl,
 * und zwar an unauffaelliger Stelle: eine Registrierung endet mit einer
 * generischen Fehlermeldung, ein Freischaltungs-Link "einfach nicht".
 * Genau dieses Suchen hat uns beim Foerderrechner schon einen halben Tag
 * gekostet -- deshalb hier einmal laut beim Start.
 */

export async function register(): Promise<void> {
  // Nur die Node-Laufzeit; im Edge-Runtime liefe das ein zweites Mal gegen
  // eine andere Modul-Instanz.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.NODE_ENV !== 'production') return;

  const fehlt: string[] = [];

  if (!process.env.REQUEST_TOKEN_SECRET && !process.env.IP_SALT) {
    fehlt.push(
      'REQUEST_TOKEN_SECRET (bzw. IP_SALT) ist nicht gesetzt. Es signiert die ' +
        'Freischaltungs-Links und salzt die Rate-Limit-Schluessel -- ohne den Wert ' +
        'schlagen Registrierung und Passwort-Reset zur Laufzeit fehl. Erzeugen mit: ' +
        'openssl rand -hex 32',
    );
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    fehlt.push('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY fehlt -- keine Anmeldung moeglich.');
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    fehlt.push('SUPABASE_SERVICE_ROLE_KEY fehlt -- Registrierung und Freischaltung schlagen fehl.');
  }

  for (const meldung of fehlt) {
    console.error(`[start] ${meldung}`);
  }
}

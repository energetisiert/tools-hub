/**
 * Signierte Freischaltungs-Tokens fuer die Admin-Bestaetigungsmail.
 *
 * Anders als die kurzlebigen Request-Tokens der fuenf Rechner (10 Minuten,
 * zufaelliges Secret als Fallback erlaubt): hier gibt es KEINEN Fallback,
 * wenn REQUEST_TOKEN_SECRET fehlt -- die Ausstellung passiert in einer
 * Supabase Edge Function, die Pruefung in dieser Next.js-App, also in zwei
 * getrennten Laufzeiten. Ein zufaellig generiertes Secret pro Instanz wuerde
 * dort still auseinanderlaufen (jede Bestaetigung schlaegt lautlos fehl,
 * statt dass jemand merkt, dass die Konfiguration fehlt).
 *
 * TTL 24h statt der sonst ueblichen 10 Minuten: ein Admin liest die Mail
 * nicht live. Verwendet die Web-Crypto-API (global `crypto`, kein Import
 * noetig) statt Node's `crypto`-Modul, damit exakt derselbe Code in der
 * Deno-Edge-Function (Ausstellung) und hier (Pruefung) laeuft.
 */

const TTL_MS = 24 * 60 * 60 * 1000;
const encoder = new TextEncoder();

function getSecret(): string {
  const secret = process.env.REQUEST_TOKEN_SECRET;
  if (!secret) {
    throw new Error('REQUEST_TOKEN_SECRET fehlt -- Freischaltungs-Links koennen nicht geprueft werden.');
  }
  return secret;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function signiere(payload: string, secret: string): Promise<string> {
  return toHex(await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(payload)));
}

/** Nur fuer lokale Tests/Referenz -- die eigentliche Ausstellung passiert in der Edge Function. */
export async function issueApprovalToken(profileId: string): Promise<string> {
  const payload = `${profileId}.${Date.now()}`;
  return `${payload}.${await signiere(payload, getSecret())}`;
}

/** Gibt die Profil-ID zurueck, wenn das Token gueltig und nicht abgelaufen ist, sonst null. */
export async function verifyApprovalToken(token: string | null | undefined): Promise<string | null> {
  if (!token) return null;
  const teile = token.split('.');
  if (teile.length !== 3) return null;
  const [profileId, ts, sig] = teile;

  const erwartet = await signiere(`${profileId}.${ts}`, getSecret());
  if (sig.length !== erwartet.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ erwartet.charCodeAt(i);
  if (diff !== 0) return null;

  const alter = Date.now() - Number(ts);
  if (!Number.isFinite(alter) || alter < 0 || alter > TTL_MS) return null;

  return profileId;
}

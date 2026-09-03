# Tools Hub

Zentrale Login-/Registrierungs-App für alle energetisiert.-Rechner-Tools. Einmal hier anmelden, per Cookie auf `.energetisiert.de` über alle Tool-Subdomains hinweg erkannt (Single Sign-On) — kein Login pro Tool nötig.

Next.js (App Router, Server Actions) · Supabase Auth (geteiltes Projekt "Tool Hub energetisiert.") · Tailwind CSS.

## Ablauf

1. `/registrieren` — offene Selbstregistrierung (E-Mail + Passwort). Läuft über `auth.admin.createUser` (Service-Role, serverseitig) statt `signUp`, weil Supabases eingebauter Mailer nur 2 Bestätigungsmails/Stunde erlaubt und echte Registrierungen blockiert hat (`over_email_send_rate_limit`). Eigenes Rate-Limit: `tools_hub_rate_limit_hit`, 5 Versuche/Stunde pro IP-Hash. Sobald Resend als SMTP im Supabase-Dashboard hinterlegt ist, kann wieder auf `signUp` mit echter E-Mail-Verifikation umgestellt werden.
2. Account existiert mit `profiles.status = 'pending'` — Login möglich, aber `/hub` leitet zu `/warten-auf-freischaltung`.
3. Ein Datenbank-Trigger benachrichtigt das Team per Mail (Resend) über die neue Registrierung, mit einem Link zu `/admin/bestaetigen?token=...`.
4. Klick auf "Konto freischalten" dort setzt `status = 'approved'` (Compare-and-Swap — ein zweiter Klick auf denselben Link ist ein No-Op, kein Fehler).
5. Ab dann zeigt `/hub` die Tool-Übersicht; die Session gilt per SSO-Cookie für alle Tool-Subdomains.

Bis echte Pakete definiert sind, bedeutet Freischaltung Vollzugriff auf alle Tools (`profiles.package_id = null`). Sobald Pakete (z. B. Basic/Pro/Elite) definiert sind: Zeilen in `packages` + `package_tools` anlegen und `profiles.package_id` zuweisen — der Hub blendet dann automatisch nur die enthaltenen Tools frei (Slugs siehe `src/app/hub/tools.ts`).

## Entwicklung

```bash
npm install
cp .env.example .env.local   # Werte eintragen
npm run dev
```

## Struktur

- `src/lib/supabase/cookie-options.ts` — SSO-Cookie-Domain (`.energetisiert.de`, nur auf echten Produktions-Hosts gesetzt, sonst verwirft der Browser das Cookie kommentarlos). **Muss identisch in server.ts, client.ts und beim Logout jedes der sechs Repos verwendet werden.**
- `src/lib/security/approval-token.ts` — signierte, 24h gültige Freischaltungs-Tokens (Web-Crypto-API, damit derselbe Code in der Supabase-Edge-Function läuft, die die Mail verschickt). Kein Fallback-Secret — `REQUEST_TOKEN_SECRET` ist Pflicht.
- `src/app/hub` — die Tool-Übersicht nach dem Login (Kacheln, Paket-Gating, Logout).
- `src/app/registrieren`, `src/app/login`, `src/app/warten-auf-freischaltung`, `src/app/admin/bestaetigen` — die Auth-Seiten dieser App.
- `supabase/functions/on-signup-notify/` — Edge Function, verschickt die Admin-Benachrichtigung über Resend (noch nicht deployed, wartet auf Resend-API-Key).

## Offene Schritte (siehe Projektplan)

1. Resend-Account + Absender-Domain verifizieren, `RESEND_API_KEY` setzen, Edge Function deployen.
2. Supabase Dashboard → Authentication → Hooks → `public.custom_access_token_hook` als "Custom Access Token Hook" eintragen (schreibt `status`/`package_id` als JWT-Claims für die schnelle Middleware-Redirect-Entscheidung — die eigentliche Datenzugriffskontrolle läuft immer über die live Tabelle, nie über den Claim).
3. Die fünf Rechner-Tools auf dasselbe Cookie-/Middleware-Muster umstellen (siehe Projektplan, Abschnitte 5+6).

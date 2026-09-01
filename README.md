# Tools Hub

Zentrale Login-/Registrierungs-App für alle energetisiert.-Rechner-Tools. Einmal hier anmelden, per Cookie auf `.energetisiert.de` über alle Tool-Subdomains hinweg erkannt (Single Sign-On) — kein Login pro Tool nötig.

Next.js (App Router, Server Actions) · Supabase Auth (geteiltes Projekt "foerderrechner") · Tailwind CSS.

## Ablauf

1. `/registrieren` — offene Selbstregistrierung (E-Mail + Passwort), Supabase schickt eine Bestätigungsmail an die angegebene Adresse.
2. Nach Klick auf den Bestätigungslink: Account existiert, aber `profiles.status = 'pending'` — noch kein Zugriff auf die Tools.
3. Ein Datenbank-Trigger benachrichtigt das Team per Mail (Resend) über die neue Registrierung, mit einem Link zu `/admin/bestaetigen?token=...`.
4. Klick auf "Konto freischalten" dort setzt `status = 'approved'` (Compare-and-Swap — ein zweiter Klick auf denselben Link ist ein No-Op, kein Fehler).
5. Ab dann: `/login` auf einem beliebigen Tool (oder hier) reicht, die Session gilt für alle fünf Rechner.

Bis echte Pakete definiert sind, bedeutet Freischaltung Vollzugriff auf alle Tools (`profiles.package_id = null`).

## Entwicklung

```bash
npm install
cp .env.example .env.local   # Werte eintragen
npm run dev
```

## Struktur

- `src/lib/supabase/cookie-options.ts` — SSO-Cookie-Domain (`.energetisiert.de`, nur auf echten Produktions-Hosts gesetzt, sonst verwirft der Browser das Cookie kommentarlos). **Muss identisch in server.ts, client.ts und beim Logout jedes der sechs Repos verwendet werden.**
- `src/lib/security/approval-token.ts` — signierte, 24h gültige Freischaltungs-Tokens (Web-Crypto-API, damit derselbe Code in der Supabase-Edge-Function läuft, die die Mail verschickt). Kein Fallback-Secret — `REQUEST_TOKEN_SECRET` ist Pflicht.
- `src/app/registrieren`, `src/app/login`, `src/app/warten-auf-freischaltung`, `src/app/admin/bestaetigen` — die vier Seiten dieser App.
- `supabase/functions/on-signup-notify/` — Edge Function, verschickt die Admin-Benachrichtigung über Resend (noch nicht deployed, wartet auf Resend-API-Key).

## Offene Schritte (siehe Projektplan)

1. Resend-Account + Absender-Domain verifizieren, `RESEND_API_KEY` setzen, Edge Function deployen.
2. Supabase Dashboard → Authentication → Hooks → `public.custom_access_token_hook` als "Custom Access Token Hook" eintragen (schreibt `status`/`package_id` als JWT-Claims für die schnelle Middleware-Redirect-Entscheidung — die eigentliche Datenzugriffskontrolle läuft immer über die live Tabelle, nie über den Claim).
3. Die fünf Rechner-Tools auf dasselbe Cookie-/Middleware-Muster umstellen (siehe Projektplan, Abschnitte 5+6).

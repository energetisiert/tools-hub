// Supabase Edge Function: benachrichtigt das Team per Mail (Resend) ueber
// eine neue Registrierung, mit einem signierten 24h-Freischaltungs-Link.
//
// Wird von einem Database Webhook (AFTER INSERT auf public.profiles) ueber
// supabase_functions.http_request aufgerufen -- siehe die Migration, die den
// Trigger anlegt. NICHT ueber die normale Nutzer-JWT-Pruefung abgesichert
// (verify_jwt: false beim Deploy), sondern ueber ein gemeinsames Secret im
// Header, das der Trigger mitschickt.
//
// Benoetigte Edge-Function-Secrets (Supabase Dashboard -> Edge Functions ->
// tools-hub -> Secrets, oder `supabase secrets set`):
//   RESEND_API_KEY        -- von resend.com
//   REQUEST_TOKEN_SECRET   -- identisch zum Wert der Next.js-App (Vercel-Env)
//   WEBHOOK_SECRET          -- identisch zum Header-Wert im DB-Trigger
//   NOTIFY_ADMIN_EMAIL      -- Empfaenger der Benachrichtigung
//   RESEND_FROM_EMAIL       -- verifizierter Absender, z. B. konto@energetisiert.de
// SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY sind in jeder Edge Function
// automatisch als Umgebungsvariable vorhanden, muessen nicht gesetzt werden.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const TTL_MS = 24 * 60 * 60 * 1000;
const encoder = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// full_name kommt direkt aus der Registrierung (Nutzereingabe) -- ungesichert
// waere hier HTML/Markup-Injection in die Admin-Benachrichtigungsmail moeglich.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function issueApprovalToken(profileId: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const payload = `${profileId}.${Date.now()}`;
  const sig = toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(payload)));
  return `${payload}.${sig}`;
}

Deno.serve(async (req: Request) => {
  const webhookSecret = Deno.env.get('WEBHOOK_SECRET');
  if (!webhookSecret || req.headers.get('x-webhook-secret') !== webhookSecret) {
    return new Response('unauthorized', { status: 401 });
  }

  const requestTokenSecret = Deno.env.get('REQUEST_TOKEN_SECRET');
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL');
  const adminEmail = Deno.env.get('NOTIFY_ADMIN_EMAIL');
  if (!requestTokenSecret || !resendApiKey || !fromEmail || !adminEmail) {
    console.error('on-signup-notify: fehlende Konfiguration (Secrets pruefen).');
    return new Response('server misconfigured', { status: 500 });
  }

  const payload = await req.json();
  const profileId: string | undefined = payload?.record?.id;
  if (!profileId) {
    return new Response('kein record.id im Webhook-Payload', { status: 400 });
  }

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: userData } = await supabase.auth.admin.getUserById(profileId);
  const email = userData?.user?.email ?? 'unbekannt';
  const fullName: string | null = payload.record.full_name ?? null;

  const token = await issueApprovalToken(profileId, requestTokenSecret);
  const bestaetigenUrl = `https://tools.energetisiert.de/admin/bestaetigen?token=${encodeURIComponent(token)}`;
  const emailSicher = escapeHtml(email);
  const nameSicher = fullName ? escapeHtml(fullName) : '—';

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: fromEmail,
      to: adminEmail,
      subject: `Neue Registrierung: ${emailSicher}`,
      html: `<p>Neue Registrierung fuer die energetisiert. Tools:</p>
             <p>Name: ${nameSicher}<br>E-Mail: ${emailSicher}</p>
             <p><a href="${bestaetigenUrl}">Registrierung pruefen und freischalten</a></p>
             <p style="color:#8a8a84;font-size:12px">Link gueltig 24 Stunden.</p>`,
    }),
  });

  if (!resendResponse.ok) {
    console.error('Resend-Versand fehlgeschlagen:', await resendResponse.text());
    return new Response('mail send failed', { status: 502 });
  }

  return new Response('ok', { status: 200 });
});

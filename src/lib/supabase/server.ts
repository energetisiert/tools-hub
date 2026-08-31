import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies, headers } from 'next/headers';
import { ssoCookieOptions } from './cookie-options';

/**
 * Supabase-Client fuer Server Components, Server Actions und Route Handler.
 * Muss pro Request neu erzeugt werden (Cookies sind request-gebunden).
 * Vorlage: Foerderrechners lib/supabase/server.ts, ergaenzt um die
 * SSO-Cookie-Domain (siehe cookie-options.ts).
 */
export async function createClient() {
  const cookieStore = await cookies();
  const host = (await headers()).get('host')?.split(':')[0];
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, publicKey, {
    cookieOptions: ssoCookieOptions(host),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // setAll wird auch aus Server Components aufgerufen, die keine
          // Cookies schreiben duerfen -- unkritisch, solange die Middleware
          // die Session pro Request auffrischt.
        }
      },
    },
  });
}

/**
 * Service-Role-Client fuer privilegierte, serverseitige Operationen
 * (approve_profile, Admin-Bestaetigung). Niemals im Client-Bundle, niemals
 * mit Nutzer-Session verwenden -- umgeht RLS vollstaendig.
 */
export function createServiceRoleClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY fehlt.');
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

import { createBrowserClient } from '@supabase/ssr';
import { ssoCookieOptions } from './cookie-options';

/**
 * Supabase-Client fuer Client Components. Setzt dieselbe SSO-Cookie-Domain
 * wie server.ts -- muss identisch bleiben, sonst entstehen zwei
 * unterschiedliche Cookies statt einer gemeinsamen Session.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions: ssoCookieOptions(typeof window !== 'undefined' ? window.location.hostname : undefined) },
  );
}

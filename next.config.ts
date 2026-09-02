import type { NextConfig } from 'next';

/**
 * Bewusst ohne withBotId() -- anders als die fuenf Rechner. BotID hat hier
 * echte Anmeldungen faelschlich als Bot blockiert (siehe registrieren/actions.ts
 * und login/actions.ts), und es gibt nichts scraping-wuerdiges zu schuetzen.
 */
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
};

export default nextConfig;

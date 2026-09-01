import type { NextConfig } from 'next';

/**
 * Bewusst ohne withBotId() -- anders als die fuenf Rechner. BotID hat hier
 * echte Anmeldungen faelschlich als Bot blockiert (siehe registrieren/actions.ts
 * und login/actions.ts), und es gibt nichts scraping-wuerdiges zu schuetzen.
 */
const nextConfig: NextConfig = {};

export default nextConfig;

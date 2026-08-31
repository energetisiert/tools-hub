import type { MetadataRoute } from 'next';

/** Login-/Registrierungsseiten gehoeren nicht in den Suchindex. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', disallow: '/' },
  };
}

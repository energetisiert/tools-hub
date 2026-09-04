/**
 * Werkzeug-Katalog des Hubs. Die Slugs der Live-Tools muessen mit
 * package_tools.tool_slug im Supabase-Projekt uebereinstimmen -- ueber sie
 * entscheidet das gebuchte Paket, welche Kacheln freigeschaltet sind.
 * Fail-closed: ohne zugewiesenes Paket (profiles.package_id null) ist KEINE
 * Kachel freigeschaltet, siehe hub/page.tsx.
 *
 * Beschreibungen und Monogramme folgen dem Zielgruppen-Konzept
 * (tool-hub-konzept.html im Projektordner).
 */
export type HubTool = {
  slug: string;
  name: string;
  mono: string;
  desc: string;
  url?: string;
  ueberschlag?: boolean;
};

export const LIVE_TOOLS: HubTool[] = [
  {
    slug: 'heizlastrechner',
    name: 'Heizlastrechner',
    mono: 'HL',
    desc: 'Überschlägige Heizlast als Basis für die Dimensionierung der Wärmepumpe.',
    url: 'https://heizlastrechner.energetisiert.de',
    ueberschlag: true,
  },
  {
    slug: 'foerderrechner',
    name: 'Förderrechner Heizungstausch',
    mono: 'FH',
    desc: 'Zuschuss für den Heizungstausch, Wohn- und Nichtwohngebäude.',
    url: 'https://foerderrechner.energetisiert.de',
  },
  {
    slug: 'gebaeudeabgrenzung',
    name: 'Gebäudeabgrenzung',
    mono: 'GA',
    desc: 'Zählt ein Gebäudeteil als eigenständiges Gebäude im Förderrecht.',
    url: 'https://gebaeudeabgrenzung.energetisiert.de',
  },
  {
    slug: 'co2-rechner',
    name: 'CO2-Rechner',
    mono: 'CO',
    desc: 'CO2-Kosten zwischen Vermieter und Mieter nach Stufenmodell aufteilen.',
    url: 'https://co2-rechner.energetisiert.de',
  },
  {
    slug: 'sanierungsrechner',
    name: 'Sanierungsrechner WG',
    mono: 'SW',
    desc: 'Kosten, Förderung und Wirtschaftlichkeit der energetischen Sanierung, gewerkeweise.',
    url: 'https://sanierungsrechner.energetisiert.de',
  },
  {
    slug: 'foerderstrategie',
    name: 'Förderstrategie',
    mono: 'FS',
    desc: 'Welcher Förderweg bringt am meisten: BEG, KfW und Steuerbonus im Vergleich, Wohn- und Nichtwohngebäude.',
    url: 'https://foerderstrategie.energetisiert.de',
  },
  {
    slug: 'heizlastrechner-gep',
    name: 'Heizlastrechner GEP',
    mono: 'HG',
    desc: 'Heizlast plus Wärmepumpen-Grobauslegung (GEP-Baureihe) für Vertriebspartner.',
    url: 'https://gep.energetisiert.de',
    ueberschlag: true,
  },
];

export const GEPLANTE_TOOLS: HubTool[] = [
  {
    slug: 'energieausweis',
    name: 'Energieausweis-Check',
    mono: 'EA',
    desc: 'Gültigkeit, Aussagekraft und Pflichten rund um den Energieausweis.',
  },
  {
    slug: 'baukosten',
    name: 'Baukostenüberwacher',
    mono: 'BK',
    desc: 'Nachträge und Kosten laufend gegen Markt und Finanzierung prüfen.',
  },
  {
    slug: 'fixflip',
    name: 'Fix & Flip Kalkulation',
    mono: 'FF',
    desc: 'Kauf, Sanierung, Verkauf, Rendite und Verhandlungsspielraum.',
  },
  {
    slug: 'uwert',
    name: 'U-Wert-Rechner',
    mono: 'UW',
    desc: 'Wärmedurchgang eines Bauteils, Abgleich mit den BEG-Anforderungen.',
  },
  {
    slug: 'schall',
    name: 'Schallrechner',
    mono: 'SR',
    desc: 'Abstand und Immissionsrichtwerte nach TA Lärm für die Außeneinheit.',
    ueberschlag: true,
  },
];

/**
 * Anzeige der Kennzahlen aus gebaeude_knoten.ergebnis_zusammenfassung. Jedes
 * Tool schreibt seine eigenen Schluessel; hier steht nur, wie sie heissen und
 * wie sie formatiert werden. Unbekannte Schluessel werden roh angezeigt.
 */
type Format = 'kw' | 'eur' | 'prozent' | 'anteil' | 'zahl' | 'text' | 'celsius' | 'wm2' | 'kgm2a' | 'liste';

const KPI: Record<string, { label: string; format: Format }> = {
  heizlast_kw: { label: 'Heizlast', format: 'kw' },
  gesamt_kw: { label: 'inkl. Warmwasser', format: 'kw' },
  verbrauch_kw: { label: 'Heizlast aus Verbrauch', format: 'kw' },
  spez_w_m2: { label: 'spezifisch', format: 'wm2' },
  nat_c: { label: 'Norm-Außentemperatur', format: 'celsius' },
  wp_eignung: { label: 'WP-Eignung', format: 'text' },
  wp_empfehlung_kw: { label: 'WP-Empfehlung', format: 'liste' },
  gep_modelle: { label: 'GEP-Modell', format: 'liste' },
  gep_vorlauf_c: { label: 'Vorlauf', format: 'celsius' },
  gep_max_leistung_nat_kw: { label: 'Leistung bei NAT', format: 'kw' },
  gep_deckung_kw: { label: 'Über-/Unterdeckung', format: 'kw' },
  gep_deckung_prozent: { label: 'Deckung', format: 'prozent' },
  foerderung_eur: { label: 'Förderung', format: 'eur' },
  quote: { label: 'Förderquote', format: 'anteil' },
  foerderquote: { label: 'Förderquote', format: 'anteil' },
  foerdersatz_grund: { label: 'Grundsatz', format: 'anteil' },
  hoechstgrenze_eur: { label: 'Höchstgrenze', format: 'eur' },
  beste_strategie: { label: 'Beste Strategie', format: 'text' },
  gesamtkosten_eur: { label: 'Gesamtkosten', format: 'eur' },
  variante: { label: 'Empfohlene Variante', format: 'text' },
  vermieter_anteil: { label: 'Vermieteranteil', format: 'anteil' },
  vermieter_eur: { label: 'Vermieter', format: 'eur' },
  co2_kosten_eur: { label: 'CO₂-Kosten', format: 'eur' },
  stufe: { label: 'Stufe', format: 'zahl' },
  kg_co2_m2a: { label: 'CO₂-Intensität', format: 'kgm2a' },
  teile: { label: 'Gebäudeteile', format: 'zahl' },
  eigenstaendig: { label: 'eigenständig', format: 'zahl' },
  unvollstaendig: { label: 'unvollständig', format: 'zahl' },
  grenzfall: { label: 'Grenzfall', format: 'text' },
};

/** Reihenfolge fuer die Gebaeudekarte: die wichtigsten Kennzahlen zuerst. */
const PRIORITAET = ['heizlast_kw', 'foerderung_eur', 'beste_strategie', 'vermieter_anteil', 'gep_deckung_prozent', 'quote', 'foerderquote', 'wp_eignung', 'stufe', 'eigenstaendig'];

const de = (n: number, digits = 1) => n.toLocaleString('de-DE', { maximumFractionDigits: digits });

export function formatKpi(schluessel: string, wert: unknown): { label: string; wert: string } | null {
  if (wert === null || wert === undefined || wert === '') return null;
  const def = KPI[schluessel] ?? { label: schluessel, format: 'text' as Format };
  let text: string;
  switch (def.format) {
    case 'kw': text = typeof wert === 'number' ? `${de(wert, 1)} kW` : String(wert); break;
    case 'eur': text = typeof wert === 'number' ? `${de(wert, 0)} €` : String(wert); break;
    case 'prozent': text = typeof wert === 'number' ? `${wert >= 0 ? '+' : ''}${de(wert, 0)} %` : String(wert); break;
    case 'anteil': text = typeof wert === 'number' ? `${de(wert * 100, 0)} %` : String(wert); break;
    case 'celsius': text = typeof wert === 'number' ? `${de(wert, 1)} °C` : String(wert); break;
    case 'wm2': text = typeof wert === 'number' ? `${de(wert, 0)} W/m²` : String(wert); break;
    case 'kgm2a': text = typeof wert === 'number' ? `${de(wert, 1)} kg/m²a` : String(wert); break;
    case 'zahl': text = typeof wert === 'number' ? de(wert, 0) : String(wert); break;
    case 'liste': text = Array.isArray(wert) ? wert.map((w) => (typeof w === 'number' ? de(w, 1) : String(w))).join('–') + (schluessel.endsWith('_kw') ? ' kW' : '') : String(wert); break;
    default: text = typeof wert === 'boolean' ? (wert ? 'ja' : 'nein') : String(wert);
  }
  return { label: def.label, wert: text };
}

export function kpisSortiert(zusammenfassung: Record<string, unknown>, max = 6): { label: string; wert: string }[] {
  const eintraege = Object.entries(zusammenfassung ?? {});
  eintraege.sort(([a], [b]) => {
    const ia = PRIORITAET.indexOf(a), ib = PRIORITAET.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  return eintraege.map(([k, v]) => formatKpi(k, v)).filter((x): x is { label: string; wert: string } => x !== null).slice(0, max);
}

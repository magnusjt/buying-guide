// Delte typer som matcher produkt/common.schema.json.
// Schema er kilden til sannhet for runtime-validering; disse typene
// hjelper editoren. Hold dem i synk når schemaet endres.

export type ProduktId = string;

export interface Status {
  paa_markedet: boolean;
  utgaatt_dato: string | null;
  erstatningsmodell: ProduktId | null;
  notater: string | null;
}

export interface Pris {
  nok: number | null;
  dato_sjekket: string;
  prisjakt_url: string | null;
}

/** Konfidens-score 0-10. 10 = verifisert mot live autoritativ kilde. 0 = gjetning. */
export type Konfidens = number;

export interface Nettbutikk {
  navn: string;
  pris_nok: number | null;
  lager: string | null;
  rating: number | null;
  url: string;
  konfidens?: Konfidens;
}

export interface Lenkeoppforing {
  tittel: string;
  kilde: string | null;
  url: string;
  dato: string | null;
  konfidens?: Konfidens;
}

/** Subjektive vurderinger basert på tester, anmeldelser, diskusjonsvolum. */
export interface Vurdering {
  /** Estimert kvalitet 0-10. 10 = best i klassen, 0 = svært dårlig. null = ikke vurdert. */
  kvalitet?: number | null;
  /** Kort forklaring av hvorfor kvalitets-scoren ble gitt. */
  kvalitet_begrunnelse?: string | null;
  /** Estimert popularitet 0-10. 10 = bredt anerkjent klassiker, 0 = ukjent. null = ikke vurdert. */
  popularitet?: number | null;
  /** Kort forklaring av popularitets-scoren (hvilke signaler den er basert på). */
  popularitet_begrunnelse?: string | null;
}

export interface ProduktFellesfelter {
  id: ProduktId;
  navn: string;
  merke: string;
  status?: Status;
  pris?: Pris;
  nettbutikker_topp5?: Nettbutikk[];
  tester_anmeldelser?: Lenkeoppforing[];
  forum_meninger?: Lenkeoppforing[];
  kilder?: string[];
  vurdering?: Vurdering;
}

export type StatusKort = 'paa' | 'utgaatt' | 'ukjent';

export function statusOf(produkt: Pick<ProduktFellesfelter, 'status'>): StatusKort {
  if (!produkt.status) return 'ukjent';
  return produkt.status.paa_markedet ? 'paa' : 'utgaatt';
}

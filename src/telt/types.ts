// Telt-typer matcher produkt/telt/telt.schema.json. Schemaet er kilde til
// sannhet for runtime-validering; disse typene hjelper editoren.

import type { ProduktFellesfelter } from '../shared/types';

export type Segment =
  | 'lett-turtelt'
  | 'ekspedisjon'
  | 'familietelt'
  | 'lavvo-tipi'
  | 'tarp-hammock'
  | 'bivuakk';

export type Konstruksjon =
  | 'tunnel'
  | 'kuppel'
  | 'geodesisk'
  | 'ryggaas'
  | 'hybrid'
  | 'tarp'
  | 'lavvo'
  | 'tipi'
  | 'bivy';

export interface Spesifikasjoner {
  soveplasser?: number | null;
  sesong?: number | '3+' | '4+' | null;
  konstruksjon?: Konstruksjon | null;
  antall_innganger?: number | null;
  antall_fortelt?: number | null;
  fritthengende?: boolean | null;
  vekt_minimum_kg?: number | null;
  vekt_pakket_kg?: number | null;
  pakkmaal_cm?: string | null;
}

export interface YtterTelt {
  materiale?: string | null;
  vannsoyle_mm?: number | null;
  lengde_cm?: number | null;
  bredde_cm?: number | null;
  hoyde_cm?: number | null;
}

export interface InnerTelt {
  materiale?: string | null;
  lengde_cm?: number | null;
  bredde_cm?: number | null;
  hoyde_cm?: number | null;
}

export interface Bunn {
  materiale?: string | null;
  vannsoyle_mm?: number | null;
}

export interface Stenger {
  materiale?: string | null;
  antall?: number | null;
  diameter_mm?: number | null;
}

/** 0-10 konfidens per leaf-property. Speiler data-strukturen. */
export interface VerifikasjonStatus {
  paa_markedet?: number;
  utgaatt_dato?: number;
  erstatningsmodell?: number;
  notater?: number;
}
export interface VerifikasjonPris {
  nok?: number;
  dato_sjekket?: number;
  prisjakt_url?: number;
}
export interface VerifikasjonSpesifikasjoner {
  soveplasser?: number;
  sesong?: number;
  konstruksjon?: number;
  antall_innganger?: number;
  antall_fortelt?: number;
  fritthengende?: number;
  vekt_minimum_kg?: number;
  vekt_pakket_kg?: number;
  pakkmaal_cm?: number;
}
export interface VerifikasjonYtterTelt {
  materiale?: number;
  vannsoyle_mm?: number;
  lengde_cm?: number;
  bredde_cm?: number;
  hoyde_cm?: number;
}
export interface VerifikasjonInnerTelt {
  materiale?: number;
  lengde_cm?: number;
  bredde_cm?: number;
  hoyde_cm?: number;
}
export interface VerifikasjonBunn {
  materiale?: number;
  vannsoyle_mm?: number;
}
export interface VerifikasjonStenger {
  materiale?: number;
  antall?: number;
  diameter_mm?: number;
}
export interface VerifikasjonVurdering {
  kvalitet?: number;
  popularitet?: number;
}

export interface VerifikasjonTelt {
  status?: VerifikasjonStatus;
  pris?: VerifikasjonPris;
  nettbutikker_topp5?: number;
  tester_anmeldelser?: number;
  forum_meninger?: number;
  kilder?: number;
  farger_tilgjengelig?: number;
  spesifikasjoner?: VerifikasjonSpesifikasjoner;
  yttertelt?: VerifikasjonYtterTelt;
  innertelt?: VerifikasjonInnerTelt;
  bunn?: VerifikasjonBunn;
  stenger?: VerifikasjonStenger;
  vurdering?: VerifikasjonVurdering;
}

export interface Telt extends ProduktFellesfelter {
  segment: Segment;
  spesifikasjoner?: Spesifikasjoner | null;
  yttertelt?: YtterTelt | null;
  innertelt?: InnerTelt | null;
  bunn?: Bunn | null;
  stenger?: Stenger | null;
  farger_tilgjengelig?: string[];
  verifikasjon?: VerifikasjonTelt;
}

export interface TeltDatabase {
  $schema?: string;
  telt: Telt[];
}

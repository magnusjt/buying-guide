import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type ColumnDefinition,
  type CellComponent,
  type RowComponent,
} from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_modern.min.css';
import './telt.css';

import type { Telt, VerifikasjonTelt } from './types';
import { statusOf, type StatusKort } from '../shared/types';
import {
  formatNok,
  formatVekt,
  formatNum,
  formatStatusBadge,
  withKonfidens,
  escapeHtml,
} from '../shared/formatters';
import { TabulatorTable, type TabulatorHandle } from '../shared/TabulatorTable';
import { useMediaQuery } from '../shared/useMediaQuery';
import { TeltDetail } from './TeltDetail';
import { TeltCardList } from './TeltCardList';
import { MobileFilterSheet } from './MobileFilterSheet';
import { ColumnPicker } from './ColumnPicker';

/** Snitt-konfidens under denne grensen regnes som "lav" i kvalitets-filteret.
 *  Settes til 5 fordi default-startpunktet for ikke-verifisert data er 3,
 *  så alt under 5 inkluderer "estimat fra trening" og dårligere. */
const LOW_CONF_THRESHOLD = 5;

/** Nøkkelfelt for å vurdere om en oppføring "mangler mye info". Hvis færre enn
 *  KEY_FIELDS_MIN av disse er fylt ut, regnes raden som sparsom og filtreres bort. */
const KEY_FIELDS_MIN = 3;
const keyFieldsFilled = (row: Row): number =>
  [
    row.pris_nok != null,
    row.vekt_minimum_kg != null,
    row.soveplasser != null,
    row.sesong != null,
    row.yttertelt_vannsoyle != null,
  ].filter(Boolean).length;

/** Felt-navn på kolonner som er skjult som default (vises via ColumnPicker). */
const HIDDEN_BY_DEFAULT = new Set<string>([
  'antall_innganger',
  'antall_fortelt',
  'fritthengende',
  'yttertelt_lengde_cm',
  'yttertelt_bredde_cm',
  'yttertelt_hoyde_cm',
  'innertelt_bredde_cm',
  'innertelt_hoyde_cm',
  'innertelt_materiale',
  'bunn_materiale',
  'bunn_vannsoyle',
  'stenger_materiale',
  'stenger_antall',
  'stenger_diameter_mm',
  'farger_liste',
]);

export interface Row {
  id: string;
  navn: string;
  merke: string;
  segment: string;
  status: StatusKort;
  utgaatt_dato: string | null;
  notater: string | null;
  soveplasser: number | null;
  sesong: number | string | null;
  konstruksjon: string | null;
  antall_innganger: number | null;
  antall_fortelt: number | null;
  fritthengende: boolean | null;
  vekt_minimum_kg: number | null;
  vekt_pakket_kg: number | null;
  pakkmaal_cm: string | null;
  pris_nok: number | null;
  pris_dato: string | null;
  prisjakt_url: string | null;
  butikker_antall: number;
  tester_antall: number;
  forum_antall: number;
  kilder_antall: number;
  yttertelt_materiale: string | null;
  yttertelt_vannsoyle: number | null;
  yttertelt_lengde_cm: number | null;
  yttertelt_bredde_cm: number | null;
  yttertelt_hoyde_cm: number | null;
  innertelt_materiale: string | null;
  innertelt_lengde_cm: number | null;
  innertelt_bredde_cm: number | null;
  innertelt_hoyde_cm: number | null;
  bunn_materiale: string | null;
  bunn_vannsoyle: number | null;
  stenger_materiale: string | null;
  stenger_antall: number | null;
  stenger_diameter_mm: number | null;
  farger_antall: number;
  farger_liste: string;
  kvalitet: number | null;
  kvalitet_begrunnelse: string | null;
  popularitet: number | null;
  popularitet_begrunnelse: string | null;
  score: number | null;
  verifikasjon: VerifikasjonTelt;
  konfidens_snitt: number | null;
}

/** Samle alle integer-konfidens-scores rekursivt fra verifikasjon-objektet. */
function collectScores(v: unknown): number[] {
  if (typeof v === 'number') return [v];
  if (v && typeof v === 'object') {
    return Object.values(v as Record<string, unknown>).flatMap(collectScores);
  }
  return [];
}

function teltToRow(t: Telt): Row {
  const verifikasjon: VerifikasjonTelt = t.verifikasjon ?? {};
  const scores = collectScores(verifikasjon);
  const konfidens_snitt = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  return {
    id: t.id,
    navn: t.navn,
    merke: t.merke,
    segment: t.segment,
    status: statusOf(t),
    utgaatt_dato: t.status?.utgaatt_dato ?? null,
    notater: t.status?.notater ?? null,
    soveplasser: t.spesifikasjoner?.soveplasser ?? null,
    sesong: t.spesifikasjoner?.sesong ?? null,
    konstruksjon: t.spesifikasjoner?.konstruksjon ?? null,
    antall_innganger: t.spesifikasjoner?.antall_innganger ?? null,
    antall_fortelt: t.spesifikasjoner?.antall_fortelt ?? null,
    fritthengende: t.spesifikasjoner?.fritthengende ?? null,
    vekt_minimum_kg: t.spesifikasjoner?.vekt_minimum_kg ?? null,
    vekt_pakket_kg: t.spesifikasjoner?.vekt_pakket_kg ?? null,
    pakkmaal_cm: t.spesifikasjoner?.pakkmaal_cm ?? null,
    pris_nok: t.pris?.nok ?? null,
    pris_dato: t.pris?.dato_sjekket ?? null,
    prisjakt_url: t.pris?.prisjakt_url ?? null,
    butikker_antall: (t.nettbutikker_topp5 ?? []).length,
    tester_antall: (t.tester_anmeldelser ?? []).length,
    forum_antall: (t.forum_meninger ?? []).length,
    kilder_antall: (t.kilder ?? []).length,
    yttertelt_materiale: t.yttertelt?.materiale ?? null,
    yttertelt_vannsoyle: t.yttertelt?.vannsoyle_mm ?? null,
    yttertelt_lengde_cm: t.yttertelt?.lengde_cm ?? null,
    yttertelt_bredde_cm: t.yttertelt?.bredde_cm ?? null,
    yttertelt_hoyde_cm: t.yttertelt?.hoyde_cm ?? null,
    innertelt_materiale: t.innertelt?.materiale ?? null,
    innertelt_lengde_cm: t.innertelt?.lengde_cm ?? null,
    innertelt_bredde_cm: t.innertelt?.bredde_cm ?? null,
    innertelt_hoyde_cm: t.innertelt?.hoyde_cm ?? null,
    bunn_materiale: t.bunn?.materiale ?? null,
    bunn_vannsoyle: t.bunn?.vannsoyle_mm ?? null,
    stenger_materiale: t.stenger?.materiale ?? null,
    stenger_antall: t.stenger?.antall ?? null,
    stenger_diameter_mm: t.stenger?.diameter_mm ?? null,
    farger_antall: (t.farger_tilgjengelig ?? []).length,
    farger_liste: (t.farger_tilgjengelig ?? []).join(', '),
    kvalitet: t.vurdering?.kvalitet ?? null,
    kvalitet_begrunnelse: t.vurdering?.kvalitet_begrunnelse ?? null,
    popularitet: t.vurdering?.popularitet ?? null,
    popularitet_begrunnelse: t.vurdering?.popularitet_begrunnelse ?? null,
    score: calcScore(t),
    verifikasjon,
    konfidens_snitt,
  };
}

/** Sammensatt 0-100 score: vektet snitt av kvalitet, popularitet (vekt 1 hver)
 *  og konfidens på begge (vekt 0.5 hver), multiplisert med 10. Returnerer
 *  null hvis noen av de fire mangler. Totalvekt = 3, så 100 = 10/10 på alle. */
function calcScore(t: Telt): number | null {
  const kv = t.vurdering?.kvalitet;
  const pop = t.vurdering?.popularitet;
  const konfKv = t.verifikasjon?.vurdering?.kvalitet;
  const konfPop = t.verifikasjon?.vurdering?.popularitet;
  if (kv == null || pop == null || konfKv == null || konfPop == null) return null;
  return ((kv + pop + 0.5 * konfKv + 0.5 * konfPop) / 3) * 10;
}

const cellStatus = (cell: CellComponent) => {
  const row = cell.getRow().getData() as Row;
  return withKonfidens(
    formatStatusBadge(cell.getValue() as StatusKort, row.utgaatt_dato),
    row.verifikasjon.status?.paa_markedet,
    row.utgaatt_dato ? `Utgått: ${row.utgaatt_dato}` : undefined,
  );
};

const cellNotater = (cell: CellComponent) => {
  const row = cell.getRow().getData() as Row;
  const v = cell.getValue() as string | null;
  if (!v) return '<span class="empty">–</span>';
  return withKonfidens(
    `<span class="notat-cell">${escapeHtml(v)}</span>`,
    row.verifikasjon.status?.notater,
    v,
  );
};

const cellSoveplasser = (cell: CellComponent) => {
  const row = cell.getRow().getData() as Row;
  const tipParts: string[] = [];
  if (row.antall_innganger != null) tipParts.push(`${row.antall_innganger} innganger`);
  if (row.fritthengende != null) tipParts.push(row.fritthengende ? 'fritthengende' : 'ikke fritthengende');
  return withKonfidens(
    formatNum(cell.getValue() as number | null),
    row.verifikasjon.spesifikasjoner?.soveplasser,
    tipParts.length ? tipParts.join(' · ') : undefined,
  );
};

const cellSesong = (cell: CellComponent) => {
  const row = cell.getRow().getData() as Row;
  return withKonfidens(
    formatNum(cell.getValue() as number | string | null),
    row.verifikasjon.spesifikasjoner?.sesong,
    row.konstruksjon ? `Konstruksjon: ${row.konstruksjon}` : undefined,
  );
};

const cellKonstruksjon = (cell: CellComponent) => {
  const row = cell.getRow().getData() as Row;
  return withKonfidens(
    formatNum(cell.getValue() as string | null),
    row.verifikasjon.spesifikasjoner?.konstruksjon,
    row.fritthengende != null ? (row.fritthengende ? 'fritthengende' : 'ikke fritthengende') : undefined,
  );
};

const cellVektMin = (cell: CellComponent) => {
  const row = cell.getRow().getData() as Row;
  const tipParts: string[] = [];
  if (row.vekt_pakket_kg != null) tipParts.push(`Pakket: ${row.vekt_pakket_kg.toFixed(2)} kg`);
  if (row.pakkmaal_cm) tipParts.push(`Pakkmål: ${row.pakkmaal_cm} cm`);
  return withKonfidens(
    formatVekt(cell.getValue() as number | null),
    row.verifikasjon.spesifikasjoner?.vekt_minimum_kg,
    tipParts.length ? tipParts.join(' · ') : undefined,
  );
};

const cellVektPakket = (cell: CellComponent) => {
  const row = cell.getRow().getData() as Row;
  const tipParts: string[] = [];
  if (row.vekt_minimum_kg != null) tipParts.push(`Minimum: ${row.vekt_minimum_kg.toFixed(2)} kg`);
  if (row.pakkmaal_cm) tipParts.push(`Pakkmål: ${row.pakkmaal_cm} cm`);
  return withKonfidens(
    formatVekt(cell.getValue() as number | null),
    row.verifikasjon.spesifikasjoner?.vekt_pakket_kg,
    tipParts.length ? tipParts.join(' · ') : undefined,
  );
};

const cellPakkmaal = (cell: CellComponent) => {
  const row = cell.getRow().getData() as Row;
  return withKonfidens(
    formatNum(cell.getValue() as string | null),
    row.verifikasjon.spesifikasjoner?.pakkmaal_cm,
  );
};

const cellPris = (cell: CellComponent) => {
  const row = cell.getRow().getData() as Row;
  return withKonfidens(
    formatNok(cell.getValue() as number | null, null),
    row.verifikasjon.pris?.nok,
    row.pris_dato ? `Sjekket: ${row.pris_dato}` : undefined,
  );
};

const cellKjop = (cell: CellComponent) => {
  const row = cell.getRow().getData() as Row;
  if (!row.prisjakt_url) return '<span class="empty">–</span>';
  const tipParts = ['Åpne prisjakt'];
  if (row.butikker_antall > 0) tipParts.push(`${row.butikker_antall} butikker i topp 5`);
  return `<a href="${escapeHtml(row.prisjakt_url)}" target="_blank" rel="noopener" class="kjop-link" title="${escapeHtml(tipParts.join(' · '))}">Prisjakt →</a>`;
};

const cellYtterVann = (cell: CellComponent) => {
  const row = cell.getRow().getData() as Row;
  const tipParts: string[] = [];
  if (row.yttertelt_materiale) tipParts.push(`Materiale: ${row.yttertelt_materiale}`);
  if (row.bunn_vannsoyle != null) tipParts.push(`Bunn: ${row.bunn_vannsoyle} mm`);
  return withKonfidens(
    formatNum(cell.getValue() as number | null),
    row.verifikasjon.yttertelt?.vannsoyle_mm,
    tipParts.length ? tipParts.join(' · ') : undefined,
  );
};

const cellYtterMaterial = (cell: CellComponent) => {
  const row = cell.getRow().getData() as Row;
  const v = cell.getValue() as string | null;
  if (!v) return '<span class="empty">–</span>';
  return withKonfidens(
    escapeHtml(v),
    row.verifikasjon.yttertelt?.materiale,
    row.yttertelt_vannsoyle != null ? `Vannsøyle: ${row.yttertelt_vannsoyle} mm` : undefined,
  );
};

const cellInnerLengde = (cell: CellComponent) => {
  const row = cell.getRow().getData() as Row;
  const tipParts: string[] = [];
  if (row.innertelt_bredde_cm != null) tipParts.push(`Bredde: ${row.innertelt_bredde_cm} cm`);
  if (row.innertelt_hoyde_cm != null) tipParts.push(`Høyde: ${row.innertelt_hoyde_cm} cm`);
  return withKonfidens(
    formatNum(cell.getValue() as number | null),
    row.verifikasjon.innertelt?.lengde_cm,
    tipParts.length ? tipParts.join(' · ') : undefined,
  );
};

/** Encoding for min/maks-filteret: "min|maks" som streng (tom = ubegrenset).
 *  Bruker streng fordi Tabulators `setHeaderFilterValue` typed `value: string` —
 *  objekter blir stringify-et til "[object Object]" og filteret faller bort. */
const SEP = '|';

/** Custom headerFilter for tall-kolonner — to inputs side ved side (min/maks).
 *  Sender resultat til Tabulator som "min|maks"-streng (eller '' for ingen filter). */
const minMaxHeaderFilter = (
  _cell: CellComponent,
  _onRendered: (cb: () => void) => void,
  success: (val: unknown) => boolean,
  _cancel: (val: unknown) => void,
  _editorParams: Record<string, unknown>,
): HTMLElement => {
  const container = document.createElement('div');
  container.className = 'minmax-filter';

  const minInput = document.createElement('input');
  minInput.type = 'number';
  minInput.placeholder = 'min';
  minInput.className = 'minmax-input';

  const maxInput = document.createElement('input');
  maxInput.type = 'number';
  maxInput.placeholder = 'maks';
  maxInput.className = 'minmax-input';

  container.appendChild(minInput);
  container.appendChild(maxInput);

  const emit = () => {
    const min = minInput.value;
    const max = maxInput.value;
    success(min === '' && max === '' ? '' : `${min}${SEP}${max}`);
  };
  minInput.addEventListener('input', emit);
  maxInput.addEventListener('input', emit);
  container.addEventListener('click', (e) => e.stopPropagation());
  container.addEventListener('keydown', (e) => e.stopPropagation());

  return container;
};

/** Filter-funksjon som matcher cell-verdi mot "min|maks"-streng. */
const minMaxFilterFunc = (
  headerValue: unknown,
  rowValue: unknown,
): boolean => {
  if (typeof headerValue !== 'string' || headerValue === '') return true;
  if (!headerValue.includes(SEP)) return true;
  const [minS, maxS] = headerValue.split(SEP);
  if (minS === '' && maxS === '') return true;
  if (rowValue == null) return false;
  const num = Number(rowValue);
  if (Number.isNaN(num)) return false;
  if (minS !== '' && num < Number(minS)) return false;
  if (maxS !== '' && num > Number(maxS)) return false;
  return true;
};

/** Forteller Tabulator når filterverdien skal regnes som "tom" (ikke anvendt).
 *  Uten dette risikerer Tabulators default-check å misforstå "5|"-strengen
 *  og clear-e filteret kort etter at det ble satt. */
const minMaxFilterEmptyCheck = (value: unknown): boolean => {
  if (typeof value !== 'string' || value === '') return true;
  if (!value.includes(SEP)) return true;
  const [minS, maxS] = value.split(SEP);
  return minS === '' && maxS === '';
};

/** Sorter for score-kolonner (kvalitet/popularitet) som tie-breaker på konfidens.
 *  Når to telt har samme score, ranges den med høyere konfidens høyere. Null-
 *  verdier behandles som -Infinity slik at de havner nederst i desc-sortering. */
const makeScoreSorter = (
  getKonf: (r: Row) => number | undefined,
): ((a: unknown, b: unknown, aRow: RowComponent, bRow: RowComponent) => number) =>
  (a, b, aRow, bRow) => {
    const aV = a == null ? -Infinity : Number(a);
    const bV = b == null ? -Infinity : Number(b);
    if (aV !== bV) return aV - bV;
    const aK = getKonf(aRow.getData() as Row) ?? 0;
    const bK = getKonf(bRow.getData() as Row) ?? 0;
    return aK - bK;
  };

/** Generisk tall-celle med konfidens fra et oppslag. */
const makeNumCell = (
  getKonf: (v: VerifikasjonTelt) => number | undefined,
): ((cell: CellComponent) => string) => (cell) => {
  const row = cell.getRow().getData() as Row;
  return withKonfidens(formatNum(cell.getValue() as number | null), getKonf(row.verifikasjon));
};

/** Generisk tekst-celle (escapet) med konfidens. */
const makeTextCell = (
  getKonf: (v: VerifikasjonTelt) => number | undefined,
): ((cell: CellComponent) => string) => (cell) => {
  const row = cell.getRow().getData() as Row;
  const v = cell.getValue() as string | null;
  if (!v) return '<span class="empty">–</span>';
  return withKonfidens(escapeHtml(v), getKonf(row.verifikasjon));
};

const cellFritthengende = (cell: CellComponent) => {
  const row = cell.getRow().getData() as Row;
  const v = cell.getValue() as boolean | null;
  if (v == null) return '<span class="empty">–</span>';
  return withKonfidens(v ? 'ja' : 'nei', row.verifikasjon.spesifikasjoner?.fritthengende);
};

const cellFarger = (cell: CellComponent) => {
  const row = cell.getRow().getData() as Row;
  const v = cell.getValue() as string;
  if (!v) return '<span class="empty">–</span>';
  return withKonfidens(escapeHtml(v), row.verifikasjon.farger_tilgjengelig);
};

const cellRichness = (cell: CellComponent) => {
  const row = cell.getRow().getData() as Row;
  const chips = [
    { letter: 'B', count: row.butikker_antall, label: 'Butikker' },
    { letter: 'T', count: row.tester_antall, label: 'Tester' },
    { letter: 'F', count: row.forum_antall, label: 'Forum' },
    { letter: 'K', count: row.kilder_antall, label: 'Kilder' },
  ];
  return chips
    .map(
      (c) =>
        `<span class="rich-chip${c.count ? '' : ' dim'}" title="${c.label}: ${c.count}">${c.letter}${c.count || 0}</span>`,
    )
    .join('');
};

const cellKonfidensSnitt = (cell: CellComponent) => {
  const v = cell.getValue() as number | null;
  if (v == null) return '<span class="empty">–</span>';
  const color = v >= 7 ? '#10b981' : v >= 4 ? '#f59e0b' : v >= 1 ? '#f97316' : '#ef4444';
  return `<span style="color:${color}; font-variant-numeric: tabular-nums;" title="Snitt-konfidens på tvers av alle properties (0-10)">${v.toFixed(1)}</span>`;
};

export function scoreFarge(v: number): string {
  if (v >= 8) return '#10b981';
  if (v >= 5) return '#f59e0b';
  if (v >= 2) return '#f97316';
  return '#ef4444';
}

/** Farge for 0-100 Score (samme grenser som scoreFarge, men skalert *10). */
export function score100Farge(v: number): string {
  if (v >= 80) return '#10b981';
  if (v >= 50) return '#f59e0b';
  if (v >= 20) return '#f97316';
  return '#ef4444';
}

const cellScore = (cell: CellComponent) => {
  const v = cell.getValue() as number | null;
  if (v == null) return '<span class="empty">–</span>';
  return `<span style="color:${score100Farge(v)}; font-weight: 700; font-variant-numeric: tabular-nums;" title="Sammensatt score 0-100 — vektet snitt: kvalitet og popularitet teller 1, konfidens på begge teller 0.5. (kv + pop + 0.5·konfKv + 0.5·konfPop) / 3 × 10. 100 = 10/10 på alle.">${Math.round(v)}</span>`;
};

const cellKvalitet = (cell: CellComponent) => {
  const row = cell.getRow().getData() as Row;
  const v = cell.getValue() as number | null;
  if (v == null) return '<span class="empty">–</span>';
  const tipParts: string[] = [`Kvalitet ${v}/10`];
  if (row.kvalitet_begrunnelse) tipParts.push(row.kvalitet_begrunnelse);
  return withKonfidens(
    `<span style="color:${scoreFarge(v)}; font-weight: 600; font-variant-numeric: tabular-nums;">${v}</span>`,
    row.verifikasjon.vurdering?.kvalitet,
    tipParts.join(' · '),
  );
};

const cellPopularitet = (cell: CellComponent) => {
  const row = cell.getRow().getData() as Row;
  const v = cell.getValue() as number | null;
  if (v == null) return '<span class="empty">–</span>';
  const tipParts: string[] = [`Popularitet ${v}/10`];
  if (row.popularitet_begrunnelse) tipParts.push(row.popularitet_begrunnelse);
  return withKonfidens(
    `<span style="color:${scoreFarge(v)}; font-weight: 600; font-variant-numeric: tabular-nums;">${v}</span>`,
    row.verifikasjon.vurdering?.popularitet,
    tipParts.join(' · '),
  );
};

/** Kolonner gruppert for visningsvelgeren. Flatten gir Tabulator-rekkefølgen. */
export const COLUMN_GROUPS: { label: string; columns: ColumnDefinition[] }[] = [
  {
    label: 'Identitet',
    columns: [
      { title: 'Navn', field: 'navn', frozen: true, minWidth: 200, headerFilter: 'input' },
      { title: 'Merke', field: 'merke', headerFilter: 'input' },
      {
        title: 'Segment',
        field: 'segment',
        headerFilter: 'list',
        headerFilterParams: { valuesLookup: 'active' },
      },
      {
        title: 'Notater',
        field: 'notater',
        formatter: cellNotater,
        headerFilter: 'input',
        width: 260,
        headerSort: false,
        headerTooltip: 'Kort beskrivelse / produktnotat. Hover for full tekst.',
      },
    ],
  },
  {
    label: 'Vurdering',
    columns: [
      {
        title: 'Score',
        field: 'score',
        hozAlign: 'right',
        formatter: cellScore,
        headerFilter: minMaxHeaderFilter,
        headerFilterFunc: minMaxFilterFunc,
        headerFilterEmptyCheck: minMaxFilterEmptyCheck,
        headerFilterLiveFilter: false,
        headerTooltip: 'Sammensatt 0-100 score: vektet snitt der kvalitet og popularitet teller 1 hver, konfidens på begge teller 0.5 hver. (kv + pop + 0.5·konfKv + 0.5·konfPop) / 3 × 10.',
        // Null-score behandles som -Infinity slik at telt uten score alltid havner
        // nederst — også når tabellen sorteres synkende (beste score øverst).
        sorter: (a, b) => (a == null ? -Infinity : Number(a)) - (b == null ? -Infinity : Number(b)),
      },
      {
        title: 'Kvalitet',
        field: 'kvalitet',
        hozAlign: 'right',
        formatter: cellKvalitet,
        headerFilter: minMaxHeaderFilter,
        headerFilterFunc: minMaxFilterFunc,
        headerFilterEmptyCheck: minMaxFilterEmptyCheck,
        headerFilterLiveFilter: false,
        headerTooltip: 'Estimert kvalitet 0-10 basert på tester/anmeldelser. Sortering tie-breakes på konfidens — like scores legger den mer verifiserte øverst.',
        sorter: makeScoreSorter((r) => r.verifikasjon.vurdering?.kvalitet),
      },
      {
        title: 'Populært',
        field: 'popularitet',
        hozAlign: 'right',
        formatter: cellPopularitet,
        headerFilter: minMaxHeaderFilter,
        headerFilterFunc: minMaxFilterFunc,
        headerFilterEmptyCheck: minMaxFilterEmptyCheck,
        headerFilterLiveFilter: false,
        headerTooltip: 'Estimert popularitet 0-10 basert på diskusjonsvolum, butikkratings, antall anmeldelser. Sortering tie-breakes på konfidens.',
        sorter: makeScoreSorter((r) => r.verifikasjon.vurdering?.popularitet),
      },
      {
        title: 'Konfidens',
        field: 'konfidens_snitt',
        hozAlign: 'right',
        formatter: cellKonfidensSnitt,
        headerFilter: minMaxHeaderFilter,
        headerFilterFunc: minMaxFilterFunc,
        headerFilterEmptyCheck: minMaxFilterEmptyCheck,
        headerFilterLiveFilter: false,
        headerTooltip: 'Snitt-konfidens (0-10) på tvers av alle seksjoner. 10 = autoritativ kilde, 0 = gjetning.',
      },
    ],
  },
  {
    label: 'Pris',
    columns: [
      {
        title: 'Pris',
        field: 'pris_nok',
        hozAlign: 'right',
        formatter: cellPris,
        headerFilter: minMaxHeaderFilter,
        headerFilterFunc: minMaxFilterFunc,
        headerFilterEmptyCheck: minMaxFilterEmptyCheck,
        headerFilterLiveFilter: false,
      },
      { title: 'Kjøp', field: 'prisjakt_url', formatter: cellKjop, headerSort: false, minWidth: 100 },
    ],
  },
  {
    label: 'Hovedspec',
    columns: [
      {
        title: 'Sove',
        field: 'soveplasser',
        hozAlign: 'right',
        formatter: cellSoveplasser,
        headerFilter: minMaxHeaderFilter,
        headerFilterFunc: minMaxFilterFunc,
        headerFilterEmptyCheck: minMaxFilterEmptyCheck,
        headerFilterLiveFilter: false,
      },
      { title: 'Sesong', field: 'sesong', hozAlign: 'center', formatter: cellSesong, headerFilter: 'input' },
      {
        title: 'Konstr.',
        field: 'konstruksjon',
        formatter: cellKonstruksjon,
        headerFilter: 'list',
        headerFilterParams: { valuesLookup: 'active' },
      },
      {
        title: 'Innganger',
        field: 'antall_innganger',
        hozAlign: 'right',
        formatter: makeNumCell((v) => v.spesifikasjoner?.antall_innganger),
        headerFilter: minMaxHeaderFilter,
        headerFilterFunc: minMaxFilterFunc,
        headerFilterEmptyCheck: minMaxFilterEmptyCheck,
        headerFilterLiveFilter: false,
        visible: false,
      },
      {
        title: 'Fortelt',
        field: 'antall_fortelt',
        hozAlign: 'right',
        formatter: makeNumCell((v) => v.spesifikasjoner?.antall_fortelt),
        headerFilter: minMaxHeaderFilter,
        headerFilterFunc: minMaxFilterFunc,
        headerFilterEmptyCheck: minMaxFilterEmptyCheck,
        headerFilterLiveFilter: false,
        visible: false,
      },
      {
        title: 'Fritthengende',
        field: 'fritthengende',
        formatter: cellFritthengende,
        headerFilter: 'list',
        headerFilterParams: { values: { '': '(alle)', true: 'ja', false: 'nei' } },
        visible: false,
      },
    ],
  },
  {
    label: 'Vekt & pakking',
    columns: [
      {
        title: 'Vekt min',
        field: 'vekt_minimum_kg',
        hozAlign: 'right',
        formatter: cellVektMin,
        headerFilter: minMaxHeaderFilter,
        headerFilterFunc: minMaxFilterFunc,
        headerFilterEmptyCheck: minMaxFilterEmptyCheck,
        headerFilterLiveFilter: false,
      },
      {
        title: 'Vekt pakk.',
        field: 'vekt_pakket_kg',
        hozAlign: 'right',
        formatter: cellVektPakket,
        headerFilter: minMaxHeaderFilter,
        headerFilterFunc: minMaxFilterFunc,
        headerFilterEmptyCheck: minMaxFilterEmptyCheck,
        headerFilterLiveFilter: false,
      },
      { title: 'Pakkmål', field: 'pakkmaal_cm', formatter: cellPakkmaal },
    ],
  },
  {
    label: 'Yttertelt',
    columns: [
      { title: 'Yttermateriale', field: 'yttertelt_materiale', formatter: cellYtterMaterial, headerFilter: 'input' },
      {
        title: 'Vannsøyle ytter',
        field: 'yttertelt_vannsoyle',
        hozAlign: 'right',
        formatter: cellYtterVann,
        headerFilter: minMaxHeaderFilter,
        headerFilterFunc: minMaxFilterFunc,
        headerFilterEmptyCheck: minMaxFilterEmptyCheck,
        headerFilterLiveFilter: false,
      },
      {
        title: 'Yttertelt L',
        field: 'yttertelt_lengde_cm',
        hozAlign: 'right',
        formatter: makeNumCell((v) => v.yttertelt?.lengde_cm),
        headerFilter: minMaxHeaderFilter,
        headerFilterFunc: minMaxFilterFunc,
        headerFilterEmptyCheck: minMaxFilterEmptyCheck,
        headerFilterLiveFilter: false,
        visible: false,
      },
      {
        title: 'Yttertelt B',
        field: 'yttertelt_bredde_cm',
        hozAlign: 'right',
        formatter: makeNumCell((v) => v.yttertelt?.bredde_cm),
        headerFilter: minMaxHeaderFilter,
        headerFilterFunc: minMaxFilterFunc,
        headerFilterEmptyCheck: minMaxFilterEmptyCheck,
        headerFilterLiveFilter: false,
        visible: false,
      },
      {
        title: 'Yttertelt H',
        field: 'yttertelt_hoyde_cm',
        hozAlign: 'right',
        formatter: makeNumCell((v) => v.yttertelt?.hoyde_cm),
        headerFilter: minMaxHeaderFilter,
        headerFilterFunc: minMaxFilterFunc,
        headerFilterEmptyCheck: minMaxFilterEmptyCheck,
        headerFilterLiveFilter: false,
        visible: false,
      },
    ],
  },
  {
    label: 'Innertelt',
    columns: [
      {
        title: 'Innertelt L',
        field: 'innertelt_lengde_cm',
        hozAlign: 'right',
        formatter: cellInnerLengde,
        headerFilter: minMaxHeaderFilter,
        headerFilterFunc: minMaxFilterFunc,
        headerFilterEmptyCheck: minMaxFilterEmptyCheck,
        headerFilterLiveFilter: false,
      },
      {
        title: 'Innertelt B',
        field: 'innertelt_bredde_cm',
        hozAlign: 'right',
        formatter: makeNumCell((v) => v.innertelt?.bredde_cm),
        headerFilter: minMaxHeaderFilter,
        headerFilterFunc: minMaxFilterFunc,
        headerFilterEmptyCheck: minMaxFilterEmptyCheck,
        headerFilterLiveFilter: false,
        visible: false,
      },
      {
        title: 'Innertelt H',
        field: 'innertelt_hoyde_cm',
        hozAlign: 'right',
        formatter: makeNumCell((v) => v.innertelt?.hoyde_cm),
        headerFilter: minMaxHeaderFilter,
        headerFilterFunc: minMaxFilterFunc,
        headerFilterEmptyCheck: minMaxFilterEmptyCheck,
        headerFilterLiveFilter: false,
        visible: false,
      },
      {
        title: 'Innertelt-mat.',
        field: 'innertelt_materiale',
        formatter: makeTextCell((v) => v.innertelt?.materiale),
        headerFilter: 'input',
        visible: false,
      },
    ],
  },
  {
    label: 'Bunn & stenger',
    columns: [
      {
        title: 'Bunn-mat.',
        field: 'bunn_materiale',
        formatter: makeTextCell((v) => v.bunn?.materiale),
        headerFilter: 'input',
        visible: false,
      },
      {
        title: 'Vannsøyle bunn',
        field: 'bunn_vannsoyle',
        hozAlign: 'right',
        formatter: makeNumCell((v) => v.bunn?.vannsoyle_mm),
        headerFilter: minMaxHeaderFilter,
        headerFilterFunc: minMaxFilterFunc,
        headerFilterEmptyCheck: minMaxFilterEmptyCheck,
        headerFilterLiveFilter: false,
        visible: false,
      },
      {
        title: 'Stenger-mat.',
        field: 'stenger_materiale',
        formatter: makeTextCell((v) => v.stenger?.materiale),
        headerFilter: 'input',
        visible: false,
      },
      {
        title: 'Stenger #',
        field: 'stenger_antall',
        hozAlign: 'right',
        formatter: makeNumCell((v) => v.stenger?.antall),
        headerFilter: minMaxHeaderFilter,
        headerFilterFunc: minMaxFilterFunc,
        headerFilterEmptyCheck: minMaxFilterEmptyCheck,
        headerFilterLiveFilter: false,
        visible: false,
      },
      {
        title: 'Stenger Ø',
        field: 'stenger_diameter_mm',
        hozAlign: 'right',
        formatter: makeNumCell((v) => v.stenger?.diameter_mm),
        headerFilter: minMaxHeaderFilter,
        headerFilterFunc: minMaxFilterFunc,
        headerFilterEmptyCheck: minMaxFilterEmptyCheck,
        headerFilterLiveFilter: false,
        visible: false,
      },
    ],
  },
  {
    label: 'Annet',
    columns: [
      {
        title: 'Farger',
        field: 'farger_liste',
        formatter: cellFarger,
        headerFilter: 'input',
        visible: false,
      },
      {
        title: 'Lister',
        field: 'butikker_antall',
        formatter: cellRichness,
        headerSort: false,
        headerTooltip: 'B = Butikker · T = Tester · F = Forum · K = Kilder. Dempet = ingen data.',
        minWidth: 130,
      },
      {
        title: 'Status',
        field: 'status',
        formatter: cellStatus,
        headerFilter: 'list',
        headerFilterParams: {
          values: { '': '(alle)', paa: 'På markedet', utgaatt: 'Utgått', ukjent: 'Ukjent' },
        },
      },
    ],
  },
];

const columns: ColumnDefinition[] = COLUMN_GROUPS.flatMap((g) => g.columns);

/** Delt filter-predikat brukt av både Tabulator (desktop) og kort-lista (mobil),
 *  så begge visninger skjuler/viser nøyaktig de samme radene. */
export function matchesFilters(row: Row, query: string, showLowQuality: boolean): boolean {
  const q = query.trim().toLowerCase();
  if (q) {
    const hay = [row.navn, row.merke, row.segment, row.konstruksjon, row.yttertelt_materiale]
      .filter((v): v is string => Boolean(v))
      .join(' ')
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (!showLowQuality) {
    if (row.status !== 'paa') return false;
    if (row.konfidens_snitt == null || row.konfidens_snitt < LOW_CONF_THRESHOLD) return false;
    if (keyFieldsFilled(row) < KEY_FIELDS_MIN) return false;
  }
  return true;
}

/** Sorterings-valg på mobil (ingen klikkbare kolonneheadere der). */
export type SortKey = 'score' | 'pris' | 'vekt' | 'navn';
export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'score', label: 'Score (beste først)' },
  { key: 'pris', label: 'Pris (lav → høy)' },
  { key: 'vekt', label: 'Vekt (lett → tung)' },
  { key: 'navn', label: 'Navn (A → Å)' },
];

/** Sorterer en kopi av radene. Null-verdier legges alltid sist: ved score
 *  (synkende) som -Infinity, ved pris/vekt (stigende) som +Infinity. */
export function sortRows(rows: Row[], key: SortKey): Row[] {
  const copy = [...rows];
  const desc = (v: number | null) => (v == null ? -Infinity : v);
  const asc = (v: number | null) => (v == null ? Infinity : v);
  switch (key) {
    case 'score':
      copy.sort((a, b) => desc(b.score) - desc(a.score));
      break;
    case 'pris':
      copy.sort((a, b) => asc(a.pris_nok) - asc(b.pris_nok));
      break;
    case 'vekt':
      copy.sort((a, b) => asc(a.vekt_minimum_kg) - asc(b.vekt_minimum_kg));
      break;
    case 'navn':
      copy.sort((a, b) => a.navn.localeCompare(b.navn, 'no'));
      break;
  }
  return copy;
}

/** Numeriske min/maks-filtre i mobil-filter-arket. `field` peker på et
 *  number-felt i Row. Speiler desktop-tabellens min/maks-kolonnefiltre. */
export const RANGE_FILTERS: { field: keyof Row; label: string; step?: number }[] = [
  { field: 'soveplasser', label: 'Soveplasser' },
  { field: 'vekt_minimum_kg', label: 'Vekt min (kg)', step: 0.1 },
  { field: 'pris_nok', label: 'Pris (kr)' },
];

/** Kategoriske select-filtre i mobil-filter-arket. Verdier hentes dynamisk fra
 *  dataen (distinkte verdier). `sesong` kan være tall eller streng (f.eks. "3-4"),
 *  derfor matches den som streng. */
export const LIST_FILTERS: { field: 'konstruksjon' | 'sesong'; label: string }[] = [
  { field: 'sesong', label: 'Sesong' },
  { field: 'konstruksjon', label: 'Konstruksjon' },
];

export interface MobileFilterState {
  sesong: string;
  konstruksjon: string;
  /** Per range-felt: min/maks som strenger ('' = ubegrenset). */
  ranges: Record<string, { min: string; max: string }>;
}

export function emptyMobileFilters(): MobileFilterState {
  return {
    sesong: '',
    konstruksjon: '',
    ranges: Object.fromEntries(RANGE_FILTERS.map((f) => [f.field, { min: '', max: '' }])),
  };
}

/** Antall aktive mobil-filtre (for badge på Filtrer-knappen). */
export function countActiveMobileFilters(f: MobileFilterState): number {
  let n = 0;
  if (f.sesong) n++;
  if (f.konstruksjon) n++;
  for (const { field } of RANGE_FILTERS) {
    const r = f.ranges[field];
    if (r && (r.min !== '' || r.max !== '')) n++;
  }
  return n;
}

/** Anvender de strukturerte mobil-filtrene (lister + min/maks) på en rad. */
export function applyMobileFilters(row: Row, f: MobileFilterState): boolean {
  if (f.sesong && String(row.sesong ?? '') !== f.sesong) return false;
  if (f.konstruksjon && row.konstruksjon !== f.konstruksjon) return false;
  for (const { field } of RANGE_FILTERS) {
    const r = f.ranges[field];
    if (!r) continue;
    const raw = row[field];
    const num = raw == null ? null : Number(raw);
    if (r.min !== '') {
      if (num == null || num < Number(r.min)) return false;
    }
    if (r.max !== '') {
      if (num == null || num > Number(r.max)) return false;
    }
  }
  return true;
}

interface Props {
  telt: Telt[];
}

export function TeltViewer({ telt }: Props) {
  const teltById = useMemo(() => new Map(telt.map((t) => [t.id, t])), [telt]);
  const rows = useMemo(() => telt.map(teltToRow), [telt]);
  /** Nyeste pris.dato_sjekket (YYYY-MM-DD) på tvers av alle telt — gjenspeiler
   *  når dataen sist ble verifisert. Streng-sammenligning fungerer for ISO-datoer. */
  const sistOppdatert = useMemo(() => {
    let latest: string | null = null;
    for (const r of rows) {
      if (r.pris_dato && (latest == null || r.pris_dato > latest)) latest = r.pris_dato;
    }
    return latest;
  }, [rows]);

  const tableHandle = useRef<TabulatorHandle>(null);
  const getTab = () => tableHandle.current?.table ?? null;
  /** Settes true rett før setSelectedId i tilfeller der vi ønsker å scrolle
   *  raden inn (initial URL-load, prev/next i drawer, popstate). Vanlig rad-
   *  klikk lar flagget være false så viewport ikke hopper unødig. */
  const wantsScrollRef = useRef(false);

  /** Opptil 900px bruker vi kort-lista; bredere skjermer får Tabulator-tabellen.
   *  Mellom 720-900px er kortene fortsatt fine, mens en full tabell ville krevd
   *  mye horisontal scroll. */
  const isMobile = useMediaQuery('(max-width: 900px)');

  const [query, setQuery] = useState('');
  /** Default false → kvalitetsfilteret er aktivt (skjuler utgått/tvilsomt).
   *  Når brukeren huker på "Vis utgått / tvilsomt", deaktiveres filteret. */
  const [showLowQuality, setShowLowQuality] = useState(false);
  /** Sortering for mobil-lista (tabellen sorteres ved kolonneklikk i stedet). */
  const [sortKey, setSortKey] = useState<SortKey>('score');
  /** Strukturerte mobil-filtre (sesong, konstruksjon, min/maks). */
  const [mobileFilters, setMobileFilters] = useState<MobileFilterState>(emptyMobileFilters);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [visible, setVisible] = useState(rows.length);
  const [tableReady, setTableReady] = useState(false);

  /** Filtrert + sortert rad-liste for mobil-visningen. Cheap nok (~234 rader)
   *  til å regnes alltid; brukes også til prev/next-rekkefølge på mobil. */
  const mobileRows = useMemo(
    () =>
      sortRows(
        rows.filter((r) => matchesFilters(r, query, showLowQuality) && applyMobileFilters(r, mobileFilters)),
        sortKey,
      ),
    [rows, query, showLowQuality, mobileFilters, sortKey],
  );
  const activeFilterCount = countActiveMobileFilters(mobileFilters);
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const id = new URLSearchParams(window.location.search).get('telt');
    const valid = !!(id && teltById.has(id));
    if (valid) wantsScrollRef.current = true;
    return valid ? id : null;
  });

  /** Hent synlige rader i sortert rekkefølge — brukes for prev/next i drawer. */
  const getVisibleIds = useCallback((): string[] => {
    const tab = getTab();
    if (!tab) return [];
    return (tab.getRows('active') as RowComponent[]).map((r) => (r.getData() as Row).id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = useCallback((id: string | null) => {
    const tab = getTab();
    if (!tab) return;
    (tab.getRows('all') as RowComponent[]).forEach((r) => {
      const isSel = (r.getData() as Row).id === id;
      r.getElement().classList.toggle('row-selected', isSel);
    });
    if (wantsScrollRef.current && id) {
      const r = tab.getRow(id);
      if (r) r.scrollTo();
    }
    wantsScrollRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Synk valgt rad-styling/scroll når tabellen er klar og selectedId endrer seg.
  useEffect(() => {
    if (!tableReady) return;
    handleSelect(selectedId);
  }, [selectedId, tableReady, handleSelect]);

  // URL-state: speil selectedId i ?telt=ID. Bruk replaceState så rad-bytting
  // ikke forsøpler nettleserens history.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const current = params.get('telt');
    if (selectedId) {
      if (current === selectedId) return;
      params.set('telt', selectedId);
    } else {
      if (current === null) return;
      params.delete('telt');
    }
    const search = params.toString();
    const newUrl = `${window.location.pathname}${search ? '?' + search : ''}${window.location.hash}`;
    window.history.replaceState(null, '', newUrl);
  }, [selectedId]);

  // Lytt på popstate slik at ekstern history-navigasjon (back/forward) syncs til state.
  useEffect(() => {
    const onPop = () => {
      const id = new URLSearchParams(window.location.search).get('telt');
      const valid = !!(id && teltById.has(id));
      if (valid) wantsScrollRef.current = true;
      setSelectedId(valid ? id : null);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [teltById]);

  useEffect(() => {
    if (!tableReady) return;
    const tab = getTab();
    if (!tab) return;
    const q = query.trim().toLowerCase();
    tab.setFilter((row: Row) => {
      if (q) {
        const hay = [row.navn, row.merke, row.segment, row.konstruksjon, row.yttertelt_materiale]
          .filter((v): v is string => Boolean(v))
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (!showLowQuality) {
        if (row.status !== 'paa') return false;
        if (row.konfidens_snitt == null || row.konfidens_snitt < LOW_CONF_THRESHOLD) return false;
        if (keyFieldsFilled(row) < KEY_FIELDS_MIN) return false;
      }
      return true;
    });
  }, [query, showLowQuality, tableReady]);

  // På mobil finnes ingen Tabulator-instans som fyrer dataFiltered, så vi setter
  // treff-telleren fra den JS-filtrerte lista i stedet.
  useEffect(() => {
    if (isMobile) setVisible(mobileRows.length);
  }, [isMobile, mobileRows.length]);

  // Lås body-scroll mens detalj-overlayet eller filter-arket dekker skjermen på
  // mobil, så bakgrunnen ikke scroller bak.
  useEffect(() => {
    if (!(isMobile && (selectedId || filterSheetOpen))) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobile, selectedId, filterSheetOpen]);

  const clearAll = () => {
    setQuery('');
    setShowLowQuality(false);
    setMobileFilters(emptyMobileFilters());
    const tab = getTab();
    tab?.clearFilter(true);
    tab?.clearHeaderFilter();
  };

  const selectedTelt = selectedId ? teltById.get(selectedId) ?? null : null;
  const visibleIds = selectedId
    ? isMobile
      ? mobileRows.map((r) => r.id)
      : getVisibleIds()
    : [];
  const selIdx = selectedId ? visibleIds.indexOf(selectedId) : -1;
  const hasPrev = selIdx > 0;
  const hasNext = selIdx >= 0 && selIdx < visibleIds.length - 1;

  return (
    <>
      <header>
        <div className="topnav"><a href="../">← Alle kjøpsguider</a></div>
        <div className="title-row">
          <h1>Telt — kjøpsguide for det norske markedet</h1>
          {sistOppdatert && (
            <span className="sist-oppdatert" title="Nyeste pris-sjekk-dato på tvers av alle telt i databasen">
              Sist oppdatert {sistOppdatert}
            </span>
          )}
        </div>
        {isMobile ? (
          <div className="meta">
            Utgåtte modeller og oppføringer med svakt datagrunnlag er skjult som default —
            huk på <em>Vis utgått / tvilsomt</em> for å se alt. Søk og sortér over · trykk et kort
            for full detalj-visning.
          </div>
        ) : (
          <div className="meta">
            Utgåtte modeller og oppføringer med svak datagrunnlag er skjult som default —
            huk på <em>Vis utgått / tvilsomt</em> for å se alt. Sortér ved å klikke på kolonner ·
            filtrér i toppraden eller bruk søkefeltet · klikk en rad for full detalj-visning ·
            velg synlige kolonner i <em>Kolonner</em>-menyen · cellebakgrunn markerer kun lav konfidens (
            <span className="konf-mid">gul</span>=4-6,{' '}
            <span className="konf-low">oransje</span>=1-3,{' '}
            <span className="konf-zero">rød</span>=0)
          </div>
        )}
        <div className="ai-disclaimer">
          ⚠️ <strong>Denne databasen er generert av AI.</strong> Konfidens-tallet sier hvor sikre vi er
          på at AI-en har funnet <em>riktig</em> verdi — høyere konfidens = mer sannsynlig korrekt, men
          aldri en garanti. Klikk en rad for å åpne detalj-visningen og verifiser alltid mot kildene
          (butikker, tester og kilde-lenker) før du tar en kjøpsbeslutning.
        </div>
      </header>

      {isMobile ? (
        <div className="controls mobile-controls">
          <input
            type="search"
            placeholder="Søk i navn, merke, materiale …"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="mobile-controls-row">
            <label className="mobile-sort">
              Sortér
              <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
                {SORT_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className={`mobile-filter-btn${activeFilterCount ? ' has-active' : ''}`}
              onClick={() => setFilterSheetOpen(true)}
            >
              Filtrer{activeFilterCount > 0 && <span className="filter-count">{activeFilterCount}</span>}
            </button>
          </div>
          <div className="mobile-controls-row">
            <label className="quality-toggle">
              <input
                type="checkbox"
                checked={showLowQuality}
                onChange={(e) => setShowLowQuality(e.target.checked)}
              />
              Vis utgått / tvilsomt
            </label>
            <span className="stats">{visible} av {rows.length} telt</span>
          </div>
        </div>
      ) : (
        <div className="controls">
          <input
            type="search"
            placeholder="Søk i navn, merke, segment, materiale …"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <label
            className="quality-toggle"
            title={`Som default skjules telt som er utgått, har snitt-konfidens under ${LOW_CONF_THRESHOLD}, eller mangler mer enn ${5 - KEY_FIELDS_MIN} av nøkkelfeltene (pris, vekt min, soveplasser, sesong, vannsøyle). Huk på for å vise dem også.`}
          >
            <input
              type="checkbox"
              checked={showLowQuality}
              onChange={(e) => setShowLowQuality(e.target.checked)}
            />
            Vis utgått / tvilsomt
          </label>
          <button type="button" onClick={clearAll}>Nullstill filtre</button>
          <ColumnPicker
            groups={COLUMN_GROUPS}
            tableHandle={tableHandle}
            hiddenByDefault={HIDDEN_BY_DEFAULT}
            tableReady={tableReady}
          />
          <span className="stats">{visible} av {rows.length} telt</span>
        </div>
      )}

      {isMobile && filterSheetOpen && (
        <MobileFilterSheet
          allRows={rows}
          filters={mobileFilters}
          onChange={setMobileFilters}
          onReset={() => setMobileFilters(emptyMobileFilters())}
          onClose={() => setFilterSheetOpen(false)}
          resultCount={mobileRows.length}
        />
      )}

      <div className={`telt-layout ${selectedTelt ? 'with-detail' : ''}`}>
        {isMobile ? (
          <TeltCardList rows={mobileRows} selectedId={selectedId} onSelect={setSelectedId} />
        ) : (
        <TabulatorTable
          ref={tableHandle}
          className="telt-table"
          data={rows}
          columns={columns}
          options={{
            index: 'id',
            layout: 'fitDataStretch',
            pagination: false,
            height: 'calc(100vh - 240px)',
            placeholder: 'Ingen telt matcher filtrene',
            columnDefaults: { headerSort: true, resizable: true },
            initialSort: [
              { column: 'score', dir: 'desc' },
            ],
            persistence: { columns: ['visible', 'width'] },
            persistenceID: 'telt-table-v1',
          }}
          events={{
            dataFiltered: (_filters, dataRows) => setVisible(dataRows.length),
            tableBuilt: () => {
              const tab = getTab();
              if (!tab) return;
              setVisible(tab.getDataCount('active'));
              setTableReady(true);
            },
            rowClick: (e, row) => {
              const target = (e as MouseEvent).target as HTMLElement;
              if (target.closest('a')) return; // ikke fang link-klikk
              setSelectedId((prev) => {
                const next = (row.getData() as Row).id;
                return prev === next ? null : next;
              });
            },
          }}
        />
        )}
        {selectedTelt && isMobile && (
          <div className="detail-backdrop" onClick={() => setSelectedId(null)} />
        )}
        {selectedTelt && (
          <TeltDetail
            telt={selectedTelt}
            onClose={() => setSelectedId(null)}
            onPrev={() => {
              if (hasPrev) {
                wantsScrollRef.current = true;
                setSelectedId(visibleIds[selIdx - 1]);
              }
            }}
            onNext={() => {
              if (hasNext) {
                wantsScrollRef.current = true;
                setSelectedId(visibleIds[selIdx + 1]);
              }
            }}
            hasPrev={hasPrev}
            hasNext={hasNext}
          />
        )}
      </div>
    </>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  TabulatorFull as Tabulator,
  type ColumnDefinition,
  type CellComponent,
} from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_modern.min.css';
import './telt.css';

import type { Telt, VerifikasjonTelt } from './types';
import { statusOf, type StatusKort, type Nettbutikk, type Lenkeoppforing } from '../shared/types';
import {
  formatNok,
  formatVekt,
  formatNum,
  formatStatusBadge,
  formatLinkList,
  withKonfidens,
} from '../shared/formatters';

interface Row {
  id: string;
  navn: string;
  merke: string;
  segment: string;
  status: StatusKort;
  utgaatt_dato: string | null;
  soveplasser: number | null;
  sesong: number | string | null;
  konstruksjon: string | null;
  vekt_minimum_kg: number | null;
  vekt_pakket_kg: number | null;
  pris_nok: number | null;
  prisjakt_url: string | null;
  yttertelt_materiale: string | null;
  yttertelt_vannsoyle: number | null;
  nettbutikker: Nettbutikk[];
  tester: Lenkeoppforing[];
  forum: Lenkeoppforing[];
  kilder: string[];
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
    soveplasser: t.spesifikasjoner?.soveplasser ?? null,
    sesong: t.spesifikasjoner?.sesong ?? null,
    konstruksjon: t.spesifikasjoner?.konstruksjon ?? null,
    vekt_minimum_kg: t.spesifikasjoner?.vekt_minimum_kg ?? null,
    vekt_pakket_kg: t.spesifikasjoner?.vekt_pakket_kg ?? null,
    pris_nok: t.pris?.nok ?? null,
    prisjakt_url: t.pris?.prisjakt_url ?? null,
    yttertelt_materiale: t.yttertelt?.materiale ?? null,
    yttertelt_vannsoyle: t.yttertelt?.vannsoyle_mm ?? null,
    nettbutikker: t.nettbutikker_topp5 ?? [],
    tester: t.tester_anmeldelser ?? [],
    forum: t.forum_meninger ?? [],
    kilder: t.kilder ?? [],
    verifikasjon,
    konfidens_snitt,
  };
}

const cellPris = (cell: CellComponent) => {
  const row = cell.getRow().getData() as Row;
  return withKonfidens(formatNok(cell.getValue() as number | null, row.prisjakt_url), row.verifikasjon.pris?.nok);
};
const cellVektMin = (cell: CellComponent) => {
  const row = cell.getRow().getData() as Row;
  return withKonfidens(formatVekt(cell.getValue() as number | null), row.verifikasjon.spesifikasjoner?.vekt_minimum_kg);
};
const cellVektPakket = (cell: CellComponent) => {
  const row = cell.getRow().getData() as Row;
  return withKonfidens(formatVekt(cell.getValue() as number | null), row.verifikasjon.spesifikasjoner?.vekt_pakket_kg);
};
const cellSoveplasser = (cell: CellComponent) => {
  const row = cell.getRow().getData() as Row;
  return withKonfidens(formatNum(cell.getValue() as number | null), row.verifikasjon.spesifikasjoner?.soveplasser);
};
const cellSesong = (cell: CellComponent) => {
  const row = cell.getRow().getData() as Row;
  return withKonfidens(formatNum(cell.getValue() as number | string | null), row.verifikasjon.spesifikasjoner?.sesong);
};
const cellKonstruksjon = (cell: CellComponent) => {
  const row = cell.getRow().getData() as Row;
  return withKonfidens(formatNum(cell.getValue() as string | null), row.verifikasjon.spesifikasjoner?.konstruksjon);
};
const cellYtterVann = (cell: CellComponent) => {
  const row = cell.getRow().getData() as Row;
  return withKonfidens(formatNum(cell.getValue() as number | null), row.verifikasjon.yttertelt?.vannsoyle_mm);
};
const cellYtterMaterial = (cell: CellComponent) => {
  const row = cell.getRow().getData() as Row;
  const v = cell.getValue() as string | null;
  if (!v) return '<span class="empty">–</span>';
  return withKonfidens(v, row.verifikasjon.yttertelt?.materiale);
};
const cellStatus = (cell: CellComponent) => {
  const row = cell.getRow().getData() as Row;
  return withKonfidens(
    formatStatusBadge(cell.getValue() as StatusKort, row.utgaatt_dato),
    row.verifikasjon.status?.paa_markedet,
  );
};
const cellButikker = (cell: CellComponent) => {
  const row = cell.getRow().getData() as Row;
  return formatLinkList(
    row.nettbutikker.map((b) => ({
      label: b.navn,
      url: b.url,
      title: b.pris_nok != null ? `${b.pris_nok.toLocaleString('no-NO')} kr` : undefined,
      konfidens: b.konfidens,
    })),
  );
};
const cellTester = (cell: CellComponent) => {
  const row = cell.getRow().getData() as Row;
  return formatLinkList(
    row.tester.map((t) => ({
      label: t.kilde || t.tittel,
      url: t.url,
      title: t.tittel,
      konfidens: t.konfidens,
    })),
  );
};
const cellKilder = (cell: CellComponent) => {
  const row = cell.getRow().getData() as Row;
  return withKonfidens(
    formatLinkList(
      row.kilder.map((url, i) => {
        try {
          const u = new URL(url);
          return { label: u.hostname.replace(/^www\./, ''), url, title: url };
        } catch {
          return { label: `kilde ${i + 1}`, url, title: url };
        }
      }),
    ),
    row.verifikasjon.kilder,
  );
};
const cellKonfidensSnitt = (cell: CellComponent) => {
  const v = cell.getValue() as number | null;
  if (v == null) return '<span class="empty">–</span>';
  const color = v >= 8 ? '#10b981' : v >= 4 ? '#f59e0b' : '#ef4444';
  return `<span style="color:${color}; font-variant-numeric: tabular-nums;" title="Snitt-konfidens på tvers av 12 properties">${v.toFixed(1)}</span>`;
};

const columns: ColumnDefinition[] = [
  { title: 'Navn', field: 'navn', frozen: true, minWidth: 220, headerFilter: 'input' },
  { title: 'Merke', field: 'merke', headerFilter: 'input' },
  {
    title: 'Segment',
    field: 'segment',
    headerFilter: 'list',
    headerFilterParams: { valuesLookup: 'active' },
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
  {
    title: 'Konfidens',
    field: 'konfidens_snitt',
    hozAlign: 'right',
    formatter: cellKonfidensSnitt,
    headerTooltip: 'Snitt-konfidens (0-10) på tvers av alle seksjoner. 10 = autoritativ kilde, 0 = gjetning.',
  },
  {
    title: 'Sove',
    field: 'soveplasser',
    hozAlign: 'right',
    formatter: cellSoveplasser,
    headerFilter: 'number',
    headerFilterFunc: '>=',
  },
  {
    title: 'Sesong',
    field: 'sesong',
    hozAlign: 'center',
    formatter: cellSesong,
    headerFilter: 'input',
  },
  {
    title: 'Konstr.',
    field: 'konstruksjon',
    formatter: cellKonstruksjon,
    headerFilter: 'list',
    headerFilterParams: { valuesLookup: 'active' },
  },
  {
    title: 'Vekt min',
    field: 'vekt_minimum_kg',
    hozAlign: 'right',
    formatter: cellVektMin,
    headerFilter: 'number',
    headerFilterFunc: '<=',
  },
  { title: 'Vekt pakk.', field: 'vekt_pakket_kg', hozAlign: 'right', formatter: cellVektPakket },
  {
    title: 'Pris',
    field: 'pris_nok',
    hozAlign: 'right',
    formatter: cellPris,
    headerFilter: 'number',
    headerFilterFunc: '<=',
  },
  {
    title: 'Vannsøyle ytter',
    field: 'yttertelt_vannsoyle',
    hozAlign: 'right',
    formatter: cellYtterVann,
    headerFilter: 'number',
    headerFilterFunc: '>=',
  },
  { title: 'Yttermateriale', field: 'yttertelt_materiale', formatter: cellYtterMaterial, headerFilter: 'input' },
  { title: 'Butikker', field: 'nettbutikker', formatter: cellButikker, minWidth: 200, headerSort: false },
  { title: 'Tester', field: 'tester', formatter: cellTester, minWidth: 180, headerSort: false },
  { title: 'Kilder', field: 'kilder', formatter: cellKilder, minWidth: 180, headerSort: false },
];

interface Props {
  telt: Telt[];
}

export function TeltViewer({ telt }: Props) {
  const rows = useMemo(() => telt.map(teltToRow), [telt]);
  const segments = useMemo(
    () => [...new Set(rows.map((r) => r.segment))].sort(),
    [rows],
  );

  const tableRef = useRef<HTMLDivElement>(null);
  const tabRef = useRef<Tabulator | null>(null);

  const [query, setQuery] = useState('');
  const [segment, setSegment] = useState('');
  const [status, setStatus] = useState('');
  const [visible, setVisible] = useState(rows.length);

  useEffect(() => {
    if (!tableRef.current) return;
    const tab = new Tabulator(tableRef.current, {
      data: rows,
      layout: 'fitDataStretch',
      pagination: false,
      height: 'calc(100vh - 240px)',
      placeholder: 'Ingen telt matcher filtrene',
      columnDefaults: { headerSort: true, resizable: true },
      columns,
      initialSort: [
        { column: 'merke', dir: 'asc' },
        { column: 'navn', dir: 'asc' },
      ],
    });
    tabRef.current = tab;
    tab.on('dataFiltered', (_filters, dataRows) => setVisible(dataRows.length));
    tab.on('tableBuilt', () => setVisible(tab.getDataCount('active')));
    return () => {
      tab.destroy();
      tabRef.current = null;
    };
  }, [rows]);

  useEffect(() => {
    const tab = tabRef.current;
    if (!tab) return;
    const q = query.trim().toLowerCase();
    if (q) {
      tab.setFilter((row: Row) => {
        const hay = [row.navn, row.merke, row.segment, row.konstruksjon, row.yttertelt_materiale]
          .filter((v): v is string => Boolean(v))
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
      return;
    }
    const filters: Array<{ field: keyof Row; type: '='; value: string }> = [];
    if (segment) filters.push({ field: 'segment', type: '=', value: segment });
    if (status) filters.push({ field: 'status', type: '=', value: status });
    tab.setFilter(filters);
  }, [query, segment, status]);

  const clearAll = () => {
    setQuery('');
    setSegment('');
    setStatus('');
    tabRef.current?.clearFilter(true);
    tabRef.current?.clearHeaderFilter();
  };

  return (
    <>
      <header>
        <div className="topnav"><a href="../">← Alle kjøpsguider</a></div>
        <h1>Telt — kjøpsguide for det norske markedet</h1>
        <div className="meta">
          Sortér ved å klikke på kolonner · filtrér i toppraden eller bruk søkefeltet · cellebakgrunn angir konfidens (
          <span className="konf-hi">grønn</span>={'>='}7,{' '}
          <span className="konf-mid">gul</span>=4-6,{' '}
          <span className="konf-low">oransje</span>=1-3,{' '}
          <span className="konf-zero">rød</span>=0)
        </div>
      </header>

      <div className="controls">
        <input
          type="search"
          placeholder="Søk i navn, merke, segment, materiale …"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label>
          Segment:
          <select value={segment} onChange={(e) => setSegment(e.target.value)}>
            <option value="">(alle)</option>
            {segments.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Status:
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">(alle)</option>
            <option value="paa">På markedet</option>
            <option value="utgaatt">Utgått</option>
            <option value="ukjent">Ukjent</option>
          </select>
        </label>
        <button type="button" onClick={clearAll}>Nullstill filtre</button>
        <span className="stats">{visible} av {rows.length} telt</span>
      </div>

      <div ref={tableRef} className="telt-table" />
    </>
  );
}

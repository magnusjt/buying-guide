import { useMemo } from 'react';
import {
  type Row,
  type MobileFilterState,
  RANGE_FILTERS,
  LIST_FILTERS,
} from './TeltViewer';

interface Props {
  /** Alle rader (ufiltrerte) — brukes til å hente distinkte select-verdier. */
  allRows: Row[];
  filters: MobileFilterState;
  onChange: (next: MobileFilterState) => void;
  onReset: () => void;
  onClose: () => void;
  /** Antall treff med gjeldende filtre — vises på "Vis N telt"-knappen. */
  resultCount: number;
}

/** Distinkte, sorterte verdier for et felt. Tall sorteres numerisk, ellers
 *  alfabetisk (norsk). Brukes til select-alternativene. */
function distinctValues(rows: Row[], field: keyof Row): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    const v = r[field];
    if (v != null && v !== '') set.add(String(v));
  }
  return [...set].sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return a.localeCompare(b, 'no');
  });
}

export function MobileFilterSheet({ allRows, filters, onChange, onReset, onClose, resultCount }: Props) {
  const listValues = useMemo(
    () => Object.fromEntries(LIST_FILTERS.map((lf) => [lf.field, distinctValues(allRows, lf.field)])),
    [allRows],
  );

  const setList = (field: 'sesong' | 'konstruksjon', value: string) =>
    onChange({ ...filters, [field]: value });

  const setRange = (field: string, bound: 'min' | 'max', value: string) =>
    onChange({
      ...filters,
      ranges: { ...filters.ranges, [field]: { ...filters.ranges[field], [bound]: value } },
    });

  return (
    <div className="filter-sheet-backdrop" onClick={onClose}>
      <div
        className="filter-sheet"
        role="dialog"
        aria-label="Filtre"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="filter-sheet-header">
          <strong>Filtre</strong>
          <div className="filter-sheet-header-actions">
            <button type="button" className="filter-reset" onClick={onReset}>Nullstill</button>
            <button type="button" className="filter-close" onClick={onClose} aria-label="Lukk">✕</button>
          </div>
        </div>

        <div className="filter-sheet-body">
          {LIST_FILTERS.map((lf) => (
            <label key={lf.field} className="filter-field">
              <span className="filter-field-label">{lf.label}</span>
              <select value={filters[lf.field]} onChange={(e) => setList(lf.field, e.target.value)}>
                <option value="">(alle)</option>
                {listValues[lf.field].map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </label>
          ))}

          {RANGE_FILTERS.map((rf) => {
            const r = filters.ranges[rf.field];
            return (
              <div key={String(rf.field)} className="filter-field filter-range">
                <span className="filter-field-label">{rf.label}</span>
                <div className="filter-range-inputs">
                  <input
                    type="number"
                    inputMode="decimal"
                    step={rf.step}
                    placeholder="min"
                    value={r.min}
                    onChange={(e) => setRange(String(rf.field), 'min', e.target.value)}
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    step={rf.step}
                    placeholder="maks"
                    value={r.max}
                    onChange={(e) => setRange(String(rf.field), 'max', e.target.value)}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="filter-sheet-footer">
          <button type="button" className="filter-apply" onClick={onClose}>
            Vis {resultCount} telt
          </button>
        </div>
      </div>
    </div>
  );
}

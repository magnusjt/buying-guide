import { formatStatusBadge } from '../shared/formatters';
import { type Row, score100Farge } from './TeltViewer';

interface Props {
  rows: Row[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** Én chip med label + verdi. Verdien er allerede formatert av kalleren. */
function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="card-chip">
      <span className="card-chip-label">{label}</span>
      <span className="card-chip-value">{value}</span>
    </span>
  );
}

function TeltCard({ row, selected, onSelect }: { row: Row; selected: boolean; onSelect: (id: string) => void }) {
  const pris = row.pris_nok != null ? `${row.pris_nok.toLocaleString('no-NO')} kr` : '–';
  const vekt = row.vekt_minimum_kg != null ? `${row.vekt_minimum_kg.toFixed(2)} kg` : '–';
  const sove = row.soveplasser != null ? String(row.soveplasser) : '–';
  const sesong = row.sesong != null ? String(row.sesong) : '–';
  const konf = row.konfidens_snitt != null ? row.konfidens_snitt.toFixed(1) : '–';

  return (
    <button
      type="button"
      className={`telt-card${selected ? ' card-selected' : ''}`}
      onClick={() => onSelect(row.id)}
    >
      <div className="card-top">
        <span className="card-navn">{row.navn}</span>
        {row.score != null && (
          <span
            className="card-score"
            style={{ background: score100Farge(row.score) }}
            title="Sammensatt score 0-100"
          >
            {Math.round(row.score)}
          </span>
        )}
      </div>
      <div className="card-sub">
        <span className="card-merke">{row.merke}</span>
        {row.segment && <span className="card-segment"> · {row.segment}</span>}
        {row.status !== 'paa' && (
          <span
            className="card-status"
            dangerouslySetInnerHTML={{ __html: formatStatusBadge(row.status, row.utgaatt_dato) }}
          />
        )}
      </div>
      <div className="card-chips">
        <Chip label="Pris" value={pris} />
        <Chip label="Vekt" value={vekt} />
        <Chip label="Sove" value={sove} />
        <Chip label="Sesong" value={sesong} />
        <Chip label="Konf." value={konf} />
      </div>
    </button>
  );
}

export function TeltCardList({ rows, selectedId, onSelect }: Props) {
  if (rows.length === 0) {
    return <div className="telt-cards-empty">Ingen telt matcher filtrene</div>;
  }
  return (
    <div className="telt-cards">
      {rows.map((row) => (
        <TeltCard key={row.id} row={row} selected={row.id === selectedId} onSelect={onSelect} />
      ))}
    </div>
  );
}

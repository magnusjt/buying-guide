import { useEffect } from 'react';
import type { Telt, VerifikasjonTelt } from './types';
import type { Nettbutikk, Lenkeoppforing } from '../shared/types';
import { konfidensClass } from '../shared/formatters';

interface Props {
  telt: Telt | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

/** Liten markør som viser konfidens-score inline når den er < 7. */
function KonfBadge({ score }: { score: number | undefined }) {
  if (score === undefined || score >= 7) return null;
  const cls = konfidensClass(score);
  return <span className={`konf-inline ${cls}`} title={`Konfidens ${score}/10`}>{score}</span>;
}

/** Verdi + konfidens som inline-pair, eller "–" hvis null. Tomme verdier får ingen konfidens-farge. */
function Felt({
  label,
  value,
  konfidens,
  suffix,
}: {
  label: string;
  value: string | number | boolean | null | undefined;
  konfidens?: number;
  suffix?: string;
}) {
  const isEmpty = value === null || value === undefined || value === '';
  let display: React.ReactNode;
  if (isEmpty) {
    display = <span className="empty">–</span>;
  } else if (typeof value === 'boolean') {
    display = value ? 'ja' : 'nei';
  } else {
    display = `${value}${suffix ? ' ' + suffix : ''}`;
  }
  const cls = isEmpty ? '' : konfidensClass(konfidens);
  return (
    <div className="detail-row">
      <div className="detail-label">{label}</div>
      <div className={`detail-value ${cls}`}>
        {display}
        {!isEmpty && <KonfBadge score={konfidens} />}
      </div>
    </div>
  );
}

function Section({
  title,
  konfidens,
  children,
}: {
  title: string;
  konfidens?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="detail-section">
      <h3>
        {title}
        <KonfBadge score={konfidens} />
      </h3>
      <div className="detail-grid">{children}</div>
    </section>
  );
}

function ButikkerSection({ butikker, konfidens }: { butikker: Nettbutikk[]; konfidens?: number }) {
  if (!butikker.length) return null;
  return (
    <section className="detail-section">
      <h3>
        Nettbutikker ({butikker.length})
        <KonfBadge score={konfidens} />
      </h3>
      <ul className="detail-list">
        {butikker.map((b, i) => (
          <li key={i} className={konfidensClass(b.konfidens)}>
            <a href={b.url} target="_blank" rel="noopener">{b.navn}</a>
            {b.pris_nok != null && <span className="muted"> · {b.pris_nok.toLocaleString('no-NO')} kr</span>}
            {b.lager && <span className="muted"> · {b.lager}</span>}
            {b.rating != null && <span className="muted"> · ★{b.rating}</span>}
            <KonfBadge score={b.konfidens} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function LenkerSection({
  title,
  items,
  konfidens,
}: {
  title: string;
  items: Lenkeoppforing[];
  konfidens?: number;
}) {
  if (!items.length) return null;
  return (
    <section className="detail-section">
      <h3>
        {title} ({items.length})
        <KonfBadge score={konfidens} />
      </h3>
      <ul className="detail-list">
        {items.map((it, i) => (
          <li key={i} className={konfidensClass(it.konfidens)}>
            <a href={it.url} target="_blank" rel="noopener">{it.tittel}</a>
            {it.kilde && <span className="muted"> · {it.kilde}</span>}
            {it.dato && <span className="muted"> · {it.dato}</span>}
            <KonfBadge score={it.konfidens} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function KilderSection({ kilder, konfidens }: { kilder: string[]; konfidens?: number }) {
  if (!kilder.length) return null;
  return (
    <section className="detail-section">
      <h3>
        Kilder ({kilder.length})
        <KonfBadge score={konfidens} />
      </h3>
      <ul className="detail-list">
        {kilder.map((url, i) => {
          let label = url;
          try {
            label = new URL(url).hostname.replace(/^www\./, '');
          } catch {
            /* keep raw */
          }
          return (
            <li key={i}>
              <a href={url} target="_blank" rel="noopener" title={url}>{label}</a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function TeltDetail({ telt, onClose, onPrev, onNext, hasPrev, hasNext }: Props) {
  useEffect(() => {
    if (!telt) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowDown' && hasNext) onNext();
      else if (e.key === 'ArrowUp' && hasPrev) onPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [telt, onClose, onPrev, onNext, hasPrev, hasNext]);

  if (!telt) return null;

  const v: VerifikasjonTelt = telt.verifikasjon ?? {};
  const spec = telt.spesifikasjoner ?? {};
  const ytter = telt.yttertelt ?? {};
  const inner = telt.innertelt ?? {};
  const bunn = telt.bunn ?? {};
  const stenger = telt.stenger ?? {};

  return (
    <aside className="telt-detail" aria-label={`Detaljer for ${telt.navn}`}>
      <div className="detail-header">
        <div>
          <div className="detail-brand">{telt.merke}</div>
          <h2>{telt.navn}</h2>
          <div className="detail-meta">
            <span className="badge">{telt.segment}</span>
          </div>
        </div>
        <div className="detail-nav">
          <button type="button" onClick={onPrev} disabled={!hasPrev} title="Forrige (↑)">↑</button>
          <button type="button" onClick={onNext} disabled={!hasNext} title="Neste (↓)">↓</button>
          <button type="button" onClick={onClose} title="Lukk (Esc)" className="detail-close">✕</button>
        </div>
      </div>

      <div className="detail-body">
        <Section title="Status">
          <Felt
            label="På markedet"
            value={telt.status?.paa_markedet ?? null}
            konfidens={v.status?.paa_markedet}
          />
          <Felt
            label="Utgått"
            value={telt.status?.utgaatt_dato ?? null}
            konfidens={v.status?.utgaatt_dato}
          />
          <Felt
            label="Erstatningsmodell"
            value={telt.status?.erstatningsmodell ?? null}
            konfidens={v.status?.erstatningsmodell}
          />
          {telt.status?.notater && (
            <div className="detail-row detail-row-wide">
              <div className="detail-label">Notater</div>
              <div className={`detail-value ${konfidensClass(v.status?.notater)}`}>
                {telt.status.notater}
                <KonfBadge score={v.status?.notater} />
              </div>
            </div>
          )}
        </Section>

        {(telt.vurdering?.kvalitet != null ||
          telt.vurdering?.popularitet != null ||
          telt.vurdering?.kvalitet_begrunnelse ||
          telt.vurdering?.popularitet_begrunnelse) && (
          <Section title="Vurdering">
            <Felt
              label="Kvalitet"
              value={telt.vurdering?.kvalitet ?? null}
              konfidens={v.vurdering?.kvalitet}
              suffix="/10"
            />
            <Felt
              label="Popularitet"
              value={telt.vurdering?.popularitet ?? null}
              konfidens={v.vurdering?.popularitet}
              suffix="/10"
            />
            {telt.vurdering?.kvalitet_begrunnelse && (
              <div className="detail-row detail-row-wide">
                <div className="detail-label">Kvalitet — begrunnelse</div>
                <div className="detail-value">{telt.vurdering.kvalitet_begrunnelse}</div>
              </div>
            )}
            {telt.vurdering?.popularitet_begrunnelse && (
              <div className="detail-row detail-row-wide">
                <div className="detail-label">Popularitet — begrunnelse</div>
                <div className="detail-value">{telt.vurdering.popularitet_begrunnelse}</div>
              </div>
            )}
          </Section>
        )}

        <Section title="Pris">
          <Felt label="Pris" value={telt.pris?.nok ?? null} konfidens={v.pris?.nok} suffix="kr" />
          <Felt
            label="Sjekket"
            value={telt.pris?.dato_sjekket ?? null}
            konfidens={v.pris?.dato_sjekket}
          />
          {telt.pris?.prisjakt_url && (
            <div className="detail-row detail-row-wide">
              <div className="detail-label">Prisjakt</div>
              <div className={`detail-value ${konfidensClass(v.pris?.prisjakt_url)}`}>
                <a href={telt.pris.prisjakt_url} target="_blank" rel="noopener">
                  Åpne prisjakt-side →
                </a>
                <KonfBadge score={v.pris?.prisjakt_url} />
              </div>
            </div>
          )}
        </Section>

        <Section title="Spesifikasjoner">
          <Felt label="Soveplasser" value={spec.soveplasser ?? null} konfidens={v.spesifikasjoner?.soveplasser} />
          <Felt label="Sesong" value={spec.sesong ?? null} konfidens={v.spesifikasjoner?.sesong} />
          <Felt label="Konstruksjon" value={spec.konstruksjon ?? null} konfidens={v.spesifikasjoner?.konstruksjon} />
          <Felt label="Innganger" value={spec.antall_innganger ?? null} konfidens={v.spesifikasjoner?.antall_innganger} />
          <Felt label="Fortelt" value={spec.antall_fortelt ?? null} konfidens={v.spesifikasjoner?.antall_fortelt} />
          <Felt label="Fritthengende" value={spec.fritthengende ?? null} konfidens={v.spesifikasjoner?.fritthengende} />
          <Felt label="Vekt min" value={spec.vekt_minimum_kg ?? null} konfidens={v.spesifikasjoner?.vekt_minimum_kg} suffix="kg" />
          <Felt label="Vekt pakket" value={spec.vekt_pakket_kg ?? null} konfidens={v.spesifikasjoner?.vekt_pakket_kg} suffix="kg" />
          <Felt label="Pakkmål" value={spec.pakkmaal_cm ?? null} konfidens={v.spesifikasjoner?.pakkmaal_cm} suffix="cm" />
        </Section>

        <Section title="Yttertelt">
          <Felt label="Materiale" value={ytter.materiale ?? null} konfidens={v.yttertelt?.materiale} />
          <Felt label="Vannsøyle" value={ytter.vannsoyle_mm ?? null} konfidens={v.yttertelt?.vannsoyle_mm} suffix="mm" />
          <Felt label="Lengde" value={ytter.lengde_cm ?? null} konfidens={v.yttertelt?.lengde_cm} suffix="cm" />
          <Felt label="Bredde" value={ytter.bredde_cm ?? null} konfidens={v.yttertelt?.bredde_cm} suffix="cm" />
          <Felt label="Høyde" value={ytter.hoyde_cm ?? null} konfidens={v.yttertelt?.hoyde_cm} suffix="cm" />
        </Section>

        <Section title="Innertelt">
          <Felt label="Materiale" value={inner.materiale ?? null} konfidens={v.innertelt?.materiale} />
          <Felt label="Lengde" value={inner.lengde_cm ?? null} konfidens={v.innertelt?.lengde_cm} suffix="cm" />
          <Felt label="Bredde" value={inner.bredde_cm ?? null} konfidens={v.innertelt?.bredde_cm} suffix="cm" />
          <Felt label="Høyde" value={inner.hoyde_cm ?? null} konfidens={v.innertelt?.hoyde_cm} suffix="cm" />
        </Section>

        <Section title="Bunn">
          <Felt label="Materiale" value={bunn.materiale ?? null} konfidens={v.bunn?.materiale} />
          <Felt label="Vannsøyle" value={bunn.vannsoyle_mm ?? null} konfidens={v.bunn?.vannsoyle_mm} suffix="mm" />
        </Section>

        <Section title="Stenger">
          <Felt label="Materiale" value={stenger.materiale ?? null} konfidens={v.stenger?.materiale} />
          <Felt label="Antall" value={stenger.antall ?? null} konfidens={v.stenger?.antall} />
          <Felt label="Diameter" value={stenger.diameter_mm ?? null} konfidens={v.stenger?.diameter_mm} suffix="mm" />
        </Section>

        {telt.farger_tilgjengelig && telt.farger_tilgjengelig.length > 0 && (
          <Section title="Farger" konfidens={v.farger_tilgjengelig}>
            <div className="detail-row detail-row-wide">
              <div className="detail-value">{telt.farger_tilgjengelig.join(', ')}</div>
            </div>
          </Section>
        )}

        <ButikkerSection butikker={telt.nettbutikker_topp5 ?? []} konfidens={v.nettbutikker_topp5} />
        <LenkerSection title="Tester / anmeldelser" items={telt.tester_anmeldelser ?? []} konfidens={v.tester_anmeldelser} />
        <LenkerSection title="Forum-meninger" items={telt.forum_meninger ?? []} konfidens={v.forum_meninger} />
        <KilderSection kilder={telt.kilder ?? []} konfidens={v.kilder} />

        <p className="detail-ai-note">
          AI-generert data. Konfidens-tallene angir hvor sikre vi er på at verdiene er riktige —
          verifiser mot kildene over før kjøp.
        </p>
      </div>
    </aside>
  );
}

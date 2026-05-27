// Rene formaterere. Tar verdi inn, returnerer HTML-streng eller tekst.
// Hver produktside kan bruke disse direkte, pakke dem i Tabulator-formatterere,
// eller ignorere dem.

export const EMPTY_HTML = '<span class="empty">–</span>';

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Returnerer CSS-klassenavn basert på konfidens 0-10.
 *   10:     konf-10  (ingen bakgrunn — autoritativt)
 *   7-9:    konf-hi  (lys grønn tint)
 *   4-6:    konf-mid (lys gul tint)
 *   1-3:    konf-low (lys oransje tint)
 *   0:      konf-zero (rød tint)
 *   undefined: konf-na (grå, "ikke vurdert")
 */
export function konfidensClass(score: number | undefined): string {
  if (score === undefined || score === null) return 'konf-na';
  if (score >= 10) return 'konf-10';
  if (score >= 7) return 'konf-hi';
  if (score >= 4) return 'konf-mid';
  if (score >= 1) return 'konf-low';
  return 'konf-zero';
}

export function konfidensTooltip(score: number | undefined): string {
  if (score === undefined || score === null) return 'Konfidens ikke vurdert';
  return `Konfidens ${score}/10`;
}

/**
 * Pakker innholdet med en konfidens-klasse hvis < 10.
 * Score 10 returneres uten wrap (gold standard, ingen indikator).
 */
export function withKonfidens(html: string, score: number | undefined): string {
  if (score === undefined || score >= 10) return html;
  return `<span class="${konfidensClass(score)}" title="${konfidensTooltip(score)}">${html}</span>`;
}

/**
 * Rendre en liste av lenker som kompakt komma-separert tekst.
 * Hver lenke åpnes i ny fane. Per-item konfidens tegner farge på lenken.
 * Returnerer EMPTY_HTML hvis lista er tom.
 */
export interface LinkItem {
  label: string;
  url: string;
  title?: string;
  konfidens?: number;
}
export function formatLinkList(items: LinkItem[]): string {
  if (!items.length) return EMPTY_HTML;
  return items
    .map((i) => {
      const cls = i.konfidens !== undefined ? ` class="${konfidensClass(i.konfidens)}"` : '';
      const tip = i.title
        ? `${escapeHtml(i.title)}${i.konfidens !== undefined ? ` · ${konfidensTooltip(i.konfidens)}` : ''}`
        : i.konfidens !== undefined
          ? konfidensTooltip(i.konfidens)
          : '';
      return `<a href="${escapeHtml(i.url)}" target="_blank" rel="noopener"${
        tip ? ` title="${tip}"` : ''
      }${cls}>${escapeHtml(i.label)}</a>`;
    })
    .join(', ');
}

export function formatNok(value: number | null | undefined, linkUrl?: string | null): string {
  if (value == null) return EMPTY_HTML;
  const txt = `${value.toLocaleString('no-NO')} kr`;
  if (!linkUrl) return txt;
  return `<a href="${escapeHtml(linkUrl)}" target="_blank" rel="noopener">${txt}</a>`;
}

export function formatVekt(value: number | null | undefined, decimals = 2): string {
  if (value == null) return EMPTY_HTML;
  return `${value.toFixed(decimals)} kg`;
}

export function formatNum(value: number | string | null | undefined): string {
  if (value == null) return EMPTY_HTML;
  return String(value);
}

export function formatStatusBadge(status: 'paa' | 'utgaatt' | 'ukjent', utgaattDato?: string | null): string {
  if (status === 'paa') return '<span class="badge">På markedet</span>';
  if (status === 'utgaatt') {
    const d = utgaattDato ? ` ${escapeHtml(utgaattDato)}` : '';
    return `<span class="badge utgaatt">Utgått${d}</span>`;
  }
  return '<span class="badge ukjent">Ukjent</span>';
}

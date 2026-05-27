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
 * Returnerer CSS-klassenavn basert på konfidens 0-10. Bare 0-6 får farge —
 * 7+ regnes som greit nok og skal ikke trekke oppmerksomhet.
 *   7-10:   '' (ingen bakgrunn)
 *   4-6:    konf-mid (lys gul tint)
 *   1-3:    konf-low (lys oransje tint)
 *   0:      konf-zero (rød tint)
 *   undefined: '' (ikke vurdert — silent)
 */
export function konfidensClass(score: number | undefined): string {
  if (score === undefined || score === null) return '';
  if (score >= 7) return '';
  if (score >= 4) return 'konf-mid';
  if (score >= 1) return 'konf-low';
  return 'konf-zero';
}

export function konfidensTooltip(score: number | undefined): string {
  if (score === undefined || score === null) return 'Konfidens ikke vurdert';
  return `Konfidens ${score}/10`;
}

/**
 * Pakker innholdet med en konfidens-klasse hvis < 7. 7+ returneres uten wrap.
 * Tomme verdier (EMPTY_HTML) får aldri konfidens-farge — "vi vet ikke" trenger
 * ikke flagges som "lav konfidens på det vi ikke vet".
 * `extraTooltip` legges foran konfidens-tooltipen (atskilt med · ) når satt.
 */
export function withKonfidens(html: string, score: number | undefined, extraTooltip?: string): string {
  const isEmpty = html === EMPTY_HTML;
  const cls = isEmpty ? '' : konfidensClass(score);
  const showKonf = !isEmpty && score !== undefined && score < 7;
  if (!cls && !extraTooltip && !showKonf) return html;
  const tipParts: string[] = [];
  if (extraTooltip) tipParts.push(extraTooltip);
  if (showKonf) tipParts.push(konfidensTooltip(score));
  const titleAttr = tipParts.length ? ` title="${escapeHtml(tipParts.join(' · '))}"` : '';
  const classAttr = cls ? ` class="${cls}"` : '';
  if (!classAttr && !titleAttr) return html;
  return `<span${classAttr}${titleAttr}>${html}</span>`;
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
      const klass = konfidensClass(i.konfidens);
      const cls = klass ? ` class="${klass}"` : '';
      const showKonf = i.konfidens !== undefined && i.konfidens < 7;
      const tipParts: string[] = [];
      if (i.title) tipParts.push(i.title);
      if (showKonf) tipParts.push(konfidensTooltip(i.konfidens));
      const tip = tipParts.length ? ` title="${escapeHtml(tipParts.join(' · '))}"` : '';
      return `<a href="${escapeHtml(i.url)}" target="_blank" rel="noopener"${tip}${cls}>${escapeHtml(i.label)}</a>`;
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

import './landing.css';

// Oppdag alle produkttyper ved bygg-tid: hver produkt/<type>/<type>.json
// blir importert som en modul. Vi henter også README.md for tittel/tagline.
const dataFiles = import.meta.glob<{ default: Record<string, unknown> }>(
  '../../produkt/*/*.json',
  { eager: true },
);
const readmeFiles = import.meta.glob<string>(
  '../../produkt/*/README.md',
  { eager: true, query: '?raw', import: 'default' },
);

interface ProduktTypeInfo {
  type: string;
  displayName: string;
  tagline: string | null;
  count: number;
  href: string;
}

function parseReadmeHeader(text: string | undefined, fallback: string): { displayName: string; tagline: string | null } {
  if (!text) return { displayName: fallback, tagline: null };
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^#\s+(.+?)\s*$/);
    if (m) {
      const [head, ...rest] = m[1].split(/\s+—\s+/);
      return { displayName: head.trim() || fallback, tagline: rest.join(' — ').trim() || null };
    }
  }
  return { displayName: fallback, tagline: null };
}

function buildProduktTyper(): ProduktTypeInfo[] {
  const typer: ProduktTypeInfo[] = [];

  for (const [path, mod] of Object.entries(dataFiles)) {
    const m = path.match(/\/produkt\/([^/]+)\/\1\.json$/);
    if (!m) continue;
    const type = m[1];
    const data = mod.default as Record<string, unknown>;
    const list = data[type];
    const count = Array.isArray(list) ? list.length : 0;

    const readmePath = path.replace(/\/[^/]+\.json$/, '/README.md');
    const { displayName, tagline } = parseReadmeHeader(readmeFiles[readmePath], type);

    typer.push({ type, displayName, tagline, count, href: `./${type}/` });
  }

  typer.sort((a, b) => a.displayName.localeCompare(b.displayName, 'no'));
  return typer;
}

const PRODUKTTYPER = buildProduktTyper();

export function Landing() {
  return (
    <>
      <header>
        <h1>Kjøpsguider for norske forbrukere</h1>
        <div className="meta">Strukturert sammenligning av produkter med pris, spesifikasjoner, tester og kildereferanser.</div>
      </header>

      {PRODUKTTYPER.length === 0 ? (
        <p>Ingen produkttyper funnet under <code>produkt/</code>.</p>
      ) : (
        <div className="grid">
          {PRODUKTTYPER.map((p) => (
            <article key={p.type} className="card">
              <h2>{p.displayName}</h2>
              <div className="count">{p.count} produkter</div>
              {p.tagline && <div className="desc">{p.tagline}</div>}
              <a className="open" href={p.href}>Åpne →</a>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

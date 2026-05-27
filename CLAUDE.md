Dette repository hjelper norske forbrukere å kjøpe riktig ting.

Vi kompilerer informasjon, testresultater, linker til anmeldelser, dimensjonering og sammenligning av produkter.

Hovedsaklig i form av lister av produkter med kolonner av nyttig informasjon.

Det som alltid er viktig å få med er:

- Hvorvidt produktet er på markedet (evt når, når ble det utgått), evt hvilken modell som overtok
- Pris (sjekk prisjakt.no)
- Liste over top 5 nettbutikker (basert på pris, lagerbeholdning, rating) som har varen eller typisk har denne typen varer
- Eventuelle dimensjoner om dette er relevant (vekt, lengde, bredde, høyde)
- Link til meninger på forum, link til testresultater, o.l.
- ALLTID kildereferanser slik at man fort kan verifisere at informasjonen er riktig

## Arbeidsflyt: research direkte, ett og ett produkt

**Research om produkter (priser, spesifikasjoner, anmeldelser, nettbutikker, kilder, status på markedet osv.) skal gjøres av hovedagenten med WebFetch og WebSearch — ett og ett produkt om gangen.** Subagenter skal IKKE brukes til datautfylling, fordi:

- Parallelle subagenter spammer kildesidene (samme produsent/butikk treffes mange ganger samtidig)
- Subagenter har vist seg å fabrikkere data når WebFetch feiler i stedet for å sette `null`
- Med ett-og-ett-tilnærming kan vi være kvalitetskontrollere underveis og sette riktig konfidens-score

Arbeidsflyt:
1. Identifiser hvilket telt som skal fylles ut (typisk laveste konfidens i viewer, eller bruker-valg)
2. WebSearch for å finne riktige URLs (produsent, prisjakt, hovedretailer)
3. WebFetch en eller to autoritative kilder
4. Skriv full JSON-blokk med data + konfidens-scores (0-10) basert på faktisk verifikasjon
5. Edit `produkt/telt/telt.json` for det aktuelle teltet
6. Kjør `npm run validate` etter hver endring

Subagenter kan fortsatt brukes til oppgaver som IKKE er produktdata-utfylling (f.eks. liste-revisjon, parallell forsknings-research som å sjekke utvalg hos retailers).

**Konfidens-rubrikken under er obligatorisk for alle data du fyller ut.**

## Konfidens-system

Hver data-property og hver list-item har en `konfidens`-score fra 0 til 10 som indikerer hvor trygge vi er på riktigheten. Dette vises som fargekoder i HTML-viewer-en.

**Rubrikk for konfidens-tildeling (subagenter MÅ følge dette):**

| Score | Tolkning | Eksempel |
|-------|----------|----------|
| **10** | Verifisert direkte mot autoritativ live kilde (produsentside, offisielt produktblad) hentet med WebFetch i denne økten | Vekt fra Hilleberg.com hentet nå |
| **8-9** | Verifisert mot sekundær live kilde (norsk butikk, prisjakt.no) hentet med WebFetch i denne økten | Pris fra Fjellsport.no produktside |
| **6-7** | Rimelig inferens fra annen verifisert data | Beregnet totalvekt = pakkvekt + plugger |
| **3-5** | Estimat basert på trening / generell kunnskap, ikke direkte verifisert | "Hilleberg bruker typisk Kerlon 1200 i Red Label" uten å sjekke modellen spesifikt |
| **1-2** | Plausibel gjetning med svakt grunnlag | URL gjettet ut fra typisk mønster |
| **0** | Rent fabrikkert eller spesifikt usikkert | Pris du ikke har data for |

**Verifikasjon-strukturen speiler data-objektet** — hver leaf-property har sin egen konfidens. Lister (`nettbutikker_topp5`, `tester_anmeldelser`, `forum_meninger`, `kilder`, `farger_tilgjengelig`) har én score for hele lista, mens hver oppføring inni listen har sin egen `konfidens` på item-nivå.

**Strenge regler for subagenter:**
- ALDRI sett konfidens 7+ uten å ha kjørt WebFetch på en autoritativ kilde for akkurat det feltet i denne økten
- Hvis WebFetch feiler eller returnerer ubrukelig data: sett verdi til null OG konfidens 0
- Ikke fabrikker URLs — hvis du ikke har en ekte URL, bruk null
- Forskjellige felter i samme objekt kan ha ulik konfidens. Du kan ha verifisert `yttertelt.materiale` (10) men kun estimert `yttertelt.bredde_cm` (3) — sett dem separat
- Ærlig selvkritisk vurdering — det er bedre å rapportere konfidens 3 enn å late som om data er verifisert

Eksempel-blokk i `verifikasjon`-feltet:
```json
"verifikasjon": {
  "status": { "paa_markedet": 10, "utgaatt_dato": 10, "erstatningsmodell": 10, "notater": 8 },
  "pris": { "nok": 9, "dato_sjekket": 10, "prisjakt_url": 9 },
  "spesifikasjoner": { "soveplasser": 10, "sesong": 10, "konstruksjon": 10, "vekt_minimum_kg": 10, "vekt_pakket_kg": 10, "pakkmaal_cm": 8, "antall_innganger": 10, "antall_fortelt": 10, "fritthengende": 9 },
  "yttertelt": { "materiale": 10, "vannsoyle_mm": 10, "lengde_cm": 6, "bredde_cm": 6, "hoyde_cm": 10 },
  "innertelt": { "materiale": 9, "lengde_cm": 10, "bredde_cm": 10, "hoyde_cm": 10 },
  "bunn": { "materiale": 9, "vannsoyle_mm": 10 },
  "stenger": { "materiale": 10, "antall": 10, "diameter_mm": 9 },
  "nettbutikker_topp5": 8,
  "tester_anmeldelser": 6,
  "forum_meninger": 2,
  "kilder": 10,
  "farger_tilgjengelig": 9
}
```
Hver butikk/test/forum-oppføring har i tillegg sitt eget `konfidens`-felt i listen.

## Vurderings-system (kvalitet og popularitet)

I tillegg til konfidens (hvor sikre vi er på dataen) har hvert produkt et `vurdering`-objekt med to subjektive scores 0-10:

- **`vurdering.kvalitet`** — Hvor godt produktet faktisk fungerer, basert på tester og anmeldelser. Begrunnelse i `kvalitet_begrunnelse`.
- **`vurdering.popularitet`** — Hvor mye produktet diskuteres, anbefales, og selges. Begrunnelse i `popularitet_begrunnelse`.

Vises som fargekodede tall i HTML-viewer (grønn ≥8, gul 5-7, oransje 2-4, rød 0-1).

**Rubrikk for kvalitet (0-10):**

| Score | Tolkning | Eksempel |
|-------|----------|----------|
| 10 | Industry-leading, brukt i ekstreme ekspedisjoner | Hilleberg Keron 4 GT, Hilleberg Atlas, MSR Remote |
| 8-9 | Utmerket, kjent for slitestyrke/ytelse | Hilleberg Akto/Nallo, Helsport Spitsbergen X-Trem |
| 6-7 | God for sitt formål | De fleste mid-range |
| 4-5 | OK, men begrensninger | Budsjett-spesialist |
| 2-3 | Adekvat | Billig budsjett |
| 0-1 | Dårlig kvalitet | |

**Rubrikk for popularitet (0-10):**

| Score | Tolkning | Eksempel |
|-------|----------|----------|
| 10 | Ikonisk, diskutert overalt | Hilleberg Akto |
| 8-9 | Velkjent og anbefalt | Helsport Reinsfjell Pro, MSR Hubba Hubba |
| 6-7 | Kjent blant entusiaster | |
| 4-5 | Litt anerkjennelse | |
| 2-3 | Nisje/obskur | |
| 0-1 | Ukjent | |

**Signaler å bruke for vurdering:**
- Tester (UTEMagasinet, FriFlyt, Villmarksliv) — direkte for kvalitet
- Antall anmeldelser i `tester_anmeldelser` og `forum_meninger` — popularitet
- Butikkratinger (snitt fra `nettbutikker_topp5[].rating`) — popularitet + kvalitet
- Antall butikker som fører produktet — popularitet
- Konkrete sitater fra tester/forum — begrunnelse-tekst

**Konfidens på vurdering:** `verifikasjon.vurdering.kvalitet` og `verifikasjon.vurdering.popularitet` bør være lave (0-3) hvis basert på generell kunnskap, høyere (6-8) hvis basert på faktiske tester/diskusjoner samlet inn.

## Teknologistack

- **React 19 + TypeScript** for UI
- **Vite** som build-tool og dev-server (multi-entry, én entry per produkttype)
- **Tabulator** for tabellvisning på telt-siden (hver produktside velger selv — se under)
- **Ajv** for JSON Schema-validering av databasefilene
- **tsx** for å kjøre TypeScript-scripts (validate.ts)

Bruk alltid siste versjon av dependencies. Når du installerer noe nytt: `npm install <pakke>@latest`.

## Filstruktur

```
buying-guides/
├── CLAUDE.md
├── package.json, tsconfig.json, vite.config.ts
├── src/                              # all UI-kode (Vite root)
│   ├── index.html                    # entry: landingsside
│   ├── landing/
│   │   ├── main.tsx                  # React-mount
│   │   ├── Landing.tsx               # komponent (oppdager produkttyper via import.meta.glob)
│   │   └── landing.css
│   ├── shared/                       # bibliotek av valgfrie byggesteiner
│   │   ├── styles.css                # CSS-variabler, header, kontroller, badges
│   │   ├── formatters.ts             # formatNok, formatVekt, formatStatusBadge, ...
│   │   └── types.ts                  # ProduktFellesfelter, Status, Pris, Nettbutikk, ...
│   └── <produkttype>/                # f.eks. telt/, sykler/
│       ├── index.html                # entry: produktside
│       ├── main.tsx                  # React-mount
│       ├── <Komponent>.tsx           # selve viewer-komponenten — fri arkitektur
│       ├── <produkttype>.css         # side-spesifikk styling
│       └── types.ts                  # produktspesifikke typer som extender Fellesfelter
├── scripts/
│   └── validate.ts                   # ajv-basert schema-validering
├── produkt/                          # DATA + SCHEMA — ren database, ingen UI-kode
│   ├── common.schema.json            # delte definisjoner brukt av alle schemas
│   └── <produkttype>/
│       ├── README.md                 # H1 (`# Tittel — tagline`) brukes på landingsside
│       ├── <produkttype>.json        # produktdata, starter med "$schema"
│       └── <produkttype>.schema.json # produktspesifikt schema, refererer ../common.schema.json
└── dist/                             # GENERERT av Vite (gitignored, åpne disse i nettleser)
    ├── index.html                    # landing
    ├── <produkttype>/index.html      # per produkttype
    └── assets/                       # delte chunks, CSS
```

### Viewer-arkitektur: bibliotek, ikke framework

Hver produktside er en uavhengig Vite-entry (`src/<type>/main.tsx`). Den kan bruke Tabulator, vanilla DOM, React-komponenter, D3, eller noe helt annet. `src/shared/` er et bibliotek av valgfrie byggesteiner — komponenter velger selv hva de vil importere.

For å legge til en ny produkttype:

1. Opprett `produkt/<type>/` med `<type>.json`, `<type>.schema.json` og `README.md`
2. Opprett `src/<type>/` med `index.html` (entry), `main.tsx`, og en komponent
3. Legg til entry-en i `vite.config.ts` under `build.rollupOptions.input`
4. Kjør `npm run build` for å verifisere

Landingsiden (`src/landing/Landing.tsx`) bruker `import.meta.glob` til å oppdage alle produkttyper automatisk — du trenger ikke registrere den der.

### Schema-validering

Hver JSON-datafil starter med en `$schema`-egenskap som peker til sitt schema:

```json
{
  "$schema": "./telt.schema.json",
  "telt": [ ... ]
}
```

Dette gir live validering og autocomplete i VS Code (innebygd JSON-støtte). Schema-filer må også tillate `$schema` i `properties` (`"$schema": { "type": "string" }`).

Schema-filenes `$id` matcher deres faktiske filsti under `produkt/` slik at relative `$ref`-er (f.eks. `"../common.schema.json#/$defs/..."`) resolverer korrekt.

TypeScript-typer (`src/shared/types.ts`, `src/<type>/types.ts`) speiler schemaene. Schema er kilden til sannhet for runtime-validering; typene hjelper editoren. Hold dem i synk ved schema-endringer.

### Bygg og validering — ALLTID etter endringer

**Etter ENHVER endring i en `*.json`, `*.schema.json`, eller TypeScript/CSS-fil i `src/`, MÅ du kjøre:**

```bash
npm run build           # tsc --noEmit + vite build + npm run validate
```

For raskere iterasjon under utvikling:

```bash
npm run dev             # Vite dev-server med hot reload
npm run validate        # bare schema-validering (rask)
npm run preview         # preview den bygde dist/ uten å bygge på nytt
```

`npm run build` kjører TypeScript-typesjekk, Vite-build, og schema-validering — alle tre må passere før du leverer endringer. Dette gjelder også når subagenter har levert nye JSON-blokker som er merget inn.

Første gang i et nytt miljø: `npm install`.

## JSON-format

Hvert produkt er en oppføring i en liste under nøkkelen som matcher produkttypen (f.eks. `telt`). Felles felter for alle produkttyper:

```json
{
  "id": "kebab-case-unik-id",
  "navn": "Visningsnavn",
  "merke": "Merke",
  "status": {
    "paa_markedet": true,
    "utgaatt_dato": null,
    "erstatningsmodell": null,
    "notater": null
  },
  "pris": {
    "nok": 7990,
    "dato_sjekket": "2026-05-27",
    "prisjakt_url": "https://..."
  },
  "nettbutikker_topp5": [
    { "navn": "Sportshop", "pris_nok": 7990, "lager": "På lager", "rating": 4.6, "url": "https://..." }
  ],
  "tester_anmeldelser": [
    { "tittel": "Test av X", "kilde": "UTEMagasinet", "url": "https://...", "dato": "2024-06" }
  ],
  "forum_meninger": [
    { "tittel": "Erfaringer med X", "kilde": "FriFlyt forum", "url": "https://..." }
  ],
  "kilder": [
    "https://produsentens-side",
    "https://test1"
  ]
}
```

### Teltspesifikke felter

I tillegg til feltene over har telt:

```json
{
  "segment": "lett-turtelt",
  "spesifikasjoner": {
    "soveplasser": 2,
    "sesong": 3,
    "konstruksjon": "tunnel",
    "antall_innganger": 2,
    "antall_fortelt": 2,
    "fritthengende": false,
    "vekt_minimum_kg": 2.4,
    "vekt_pakket_kg": 2.6,
    "pakkmaal_cm": "45x15"
  },
  "yttertelt": {
    "materiale": "Kerlon 1200",
    "vannsoyle_mm": 5000,
    "lengde_cm": 320,
    "bredde_cm": 220,
    "hoyde_cm": 100
  },
  "innertelt": {
    "materiale": "ripstop nylon",
    "lengde_cm": 220,
    "bredde_cm": 130,
    "hoyde_cm": 95
  },
  "bunn": {
    "materiale": "PU-belagt nylon",
    "vannsoyle_mm": 5000
  },
  "stenger": {
    "materiale": "DAC Featherlite NSL",
    "antall": 2,
    "diameter_mm": 9.0
  },
  "farger_tilgjengelig": ["grønn", "rød"]
}
```

Felter som ikke er kjent settes til `null`. Ikke gjett — hellere `null` og legg URL-en til kilden brukt til oppslag i `kilder`-listen.

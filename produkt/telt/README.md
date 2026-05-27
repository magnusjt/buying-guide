# Telt — kjøpsguide for det norske markedet

- Strukturert data: [`telt.json`](./telt.json)
- Schema: [`telt.schema.json`](./telt.schema.json)
- Interaktiv HTML-viewer: [`../../public/telt/index.html`](../../public/telt/index.html) (åpnes med dobbeltklikk — sortering, filtre, søk)

Sist oppdatert: 2026-05-27

## Segmenter

| Segment | Beskrivelse | Typisk bruk |
|---------|-------------|-------------|
| `lett-turtelt` | 1–3 personer, < 3 kg, 3-sesong | Backpacking, sommerfjelltur |
| `ekspedisjon` | 4-sesong, robust | Vinterfjell, snøstorm, høyfjell |
| `familietelt` | 4+ personer | Bil-camping, festival |
| `lavvo-tipi` | Pyramide/lavvo, ofte med ovnsåpning | Vintercamp, lange opphold |
| `tarp-hammock` | Tarp eller hammock-shelter | Minimalistisk, sommer |
| `bivuakk` | 1-mans biwy, nødbivuakk | Lett pakk, nødløsning |

## Sammenligningstabell

> Detaljer er ikke fylt ut ennå — denne tabellen oppdateres etter at subagenter har samlet inn data per telt. Se [`telt.json`](./telt.json) for den fullstendige lista over modeller som dekkes.

| Modell | Merke | Segment | Sove­plasser | Sesong | Vekt | Pris (NOK) | Status |
|--------|-------|---------|--------------|--------|------|------------|--------|
| _venter på utfylling_ | | | | | | | |

## Slik er datasettet bygget opp

Hver oppføring i `telt.json` følger felles format definert i [`../../CLAUDE.md`](../../CLAUDE.md) og valideres mot [`telt.schema.json`](./telt.schema.json). Felter:

- **Status** — på markedet, evt. utgått-dato og erstatningsmodell
- **Pris** — fra prisjakt.no med dato
- **Spesifikasjoner** — soveplasser, sesong, konstruksjon, vekt, pakkmål
- **Yttertelt / innertelt / bunn** — materialer, vannsøyle, mål
- **Stenger** — materiale, antall, diameter
- **Nettbutikker topp 5** — pris, lager, rating
- **Tester / anmeldelser** — link til UTEMagasinet, FriFlyt, OutdoorGearLab, etc.
- **Forum** — link til diskusjoner (FriFlyt forum, r/CampingGear, etc.)
- **Kilder** — alle URL-er brukt som referanse

## Roadmap

- [x] Definere format og filstruktur
- [x] Bygge stub-liste over modeller
- [ ] Fylle ut detaljer per telt (subagent-arbeid)
- [ ] Generere sammenligningstabell fra JSON
- [ ] Legge til kjøpsanbefalinger per bruksområde

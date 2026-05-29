# Kjøpsguider

🔗 **[Se kjøpsguidene → magnusjt.github.io/buying-guide](https://magnusjt.github.io/buying-guide/)**

Kjøpsguider for norske forbrukere — strukturert sammenligning av produkter med
pris, spesifikasjoner, tester og kildereferanser. For hver produkttype samler vi
markedstatus, priser (Prisjakt), de beste nettbutikkene, dimensjoner og lenker til
tester og forumdiskusjoner — alt med kildehenvisninger og en konfidens-score per
datafelt.

## Stack

React 19 + TypeScript, bygget med Vite (én side per produkttype). Produktdata
ligger som JSON i `produkt/` og valideres mot JSON Schema med Ajv.

## Utvikling

```bash
npm install
npm run dev       # dev-server med hot reload
npm run build     # tsc --noEmit + vite build + schema-validering
npm run validate  # bare schema-validering
```

Siden deployes automatisk til GitHub Pages ved push til `main`
(se `.github/workflows/deploy.yml`).

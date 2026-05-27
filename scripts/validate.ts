#!/usr/bin/env tsx
// Validerer alle produkt/<type>/<type>.json mot deres JSON Schema.
// Kjør via:  npm run validate
//
// Bygg-trinnet (npm run build) kjører dette etter Vite-build slik at
// schema-brudd fanges opp.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const PRODUKT_ROOT = path.join(REPO_ROOT, 'produkt');

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const commonSchemaPath = path.join(PRODUKT_ROOT, 'common.schema.json');
if (!fs.existsSync(commonSchemaPath)) {
  console.error(`[feil] mangler ${commonSchemaPath}`);
  process.exit(1);
}
ajv.addSchema(JSON.parse(fs.readFileSync(commonSchemaPath, 'utf8')));

const produkttyper = fs
  .readdirSync(PRODUKT_ROOT, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .filter(
    (type) =>
      fs.existsSync(path.join(PRODUKT_ROOT, type, `${type}.json`)) &&
      fs.existsSync(path.join(PRODUKT_ROOT, type, `${type}.schema.json`)),
  );

if (produkttyper.length === 0) {
  console.warn('[advarsel] fant ingen produkttyper under produkt/');
}

let hadError = false;

for (const type of produkttyper) {
  const dir = path.join(PRODUKT_ROOT, type);
  const jsonPath = path.join(dir, `${type}.json`);
  const schemaPath = path.join(dir, `${type}.schema.json`);

  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  let data: unknown;
  try {
    data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } catch (err) {
    console.error(`[feil] kunne ikke parse ${jsonPath}: ${(err as Error).message}`);
    hadError = true;
    continue;
  }

  const validate = ajv.compile(schema);
  if (!validate(data)) {
    console.error(`[feil] ${jsonPath} validerer ikke mot ${type}.schema.json:`);
    for (const e of validate.errors ?? []) {
      console.error(`   ${e.instancePath || '/'} ${e.message} ${JSON.stringify(e.params)}`);
    }
    hadError = true;
    continue;
  }

  const list = (data as Record<string, unknown>)[type];
  const count = Array.isArray(list) ? list.length : 0;
  console.log(`[ok] ${type}.json validerer (${count} oppføringer)`);
}

if (hadError) process.exit(1);

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Vite root settes til src/. Hver produktside har sin egen index.html under
// src/<type>/ som blir en separat entry. For å legge til en ny produkttype:
//   1. opprett src/<type>/index.html og src/<type>/main.tsx
//   2. legg <type> til i input-objektet under
// Output: dist/index.html (landing) + dist/<type>/index.html per produkttype.
export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, 'src'),
  publicDir: false,
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        telt: resolve(__dirname, 'src/telt/index.html'),
      },
    },
  },
  server: {
    fs: {
      // src/-koden importerer JSON-data fra ../produkt/. Tillat tilgang utenfor root.
      allow: [resolve(__dirname, '.')],
    },
  },
});

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TeltViewer } from './TeltViewer';
import teltData from '../../produkt/telt/telt.json';
import type { TeltDatabase } from './types';
import '../shared/styles.css';

const data = teltData as TeltDatabase;

const root = document.getElementById('root');
if (!root) throw new Error('Mangler #root');

createRoot(root).render(
  <StrictMode>
    <TeltViewer telt={data.telt} />
  </StrictMode>,
);

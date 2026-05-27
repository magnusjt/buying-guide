import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Landing } from './Landing';
import '../shared/styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Mangler #root');

createRoot(root).render(
  <StrictMode>
    <Landing />
  </StrictMode>,
);

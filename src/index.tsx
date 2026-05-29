import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initIcons } from '@/lib/iconify';
import App from './App';
import './App.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  initIcons().then(() => {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });
}

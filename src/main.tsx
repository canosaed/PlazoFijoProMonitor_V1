import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import App from './App.tsx';

// Register Service Worker with auto update
registerSW({
  onNeedRefresh() {
    console.log('Nueva versión de PlazoFijo Pro disponible.');
  },
  onOfflineReady() {
    console.log('PlazoFijo Pro lista para funcionamiento sin conexión (Offline-ready).');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

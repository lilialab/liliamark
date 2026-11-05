import './theme/bootstrap';
import './i18n';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { useAppSettingsStore } from './stores/appSettingsStore';
import { startupMark } from './utils/startupTiming';

startupMark('script-start');

async function boot() {
  await useAppSettingsStore.getState().hydrate();
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void boot();

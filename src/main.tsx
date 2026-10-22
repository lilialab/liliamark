import './theme/bootstrap';
import './stores/appSettingsStore';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { startupMark } from './utils/startupTiming';

startupMark('script-start');

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

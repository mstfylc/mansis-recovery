import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n.tsx';

import './styles/global.css';
import './utils/chunkErrorHandler'; // Global chunk error handling

import * as Sentry from '@sentry/react';
import { environments } from './utils/helpers';

if (import.meta.env.MODE !== 'development') {
  Sentry.init({
    dsn: environments.sentryDsn,
    sendDefaultPii: true,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration()
    ],
    tracesSampleRate: 1.0,
    tracePropagationTargets: ['localhost', /^https:\/\/backend\.posanto\.com/],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0
  });
}

const style = document.createElement('style');
style.textContent = `
  html, body, #root {
    height: 100%;
    width: 100%;
    margin: 0;
    padding: 0;
    overflow-x: hidden;
  }
  
  #root {
    display: flex;
    flex-direction: column;
  }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

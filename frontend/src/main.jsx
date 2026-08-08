import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppProviders } from './app/providers.jsx';
import { AppRouter } from './app/AppRouter.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </React.StrictMode>
);

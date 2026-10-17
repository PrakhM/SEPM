import '@fontsource-variable/inter';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import ToastViewport from './components/common/ToastViewport.jsx';
import './index.css';

/*
 * ToastViewport sits above the router rather than inside a page or the shell:
 * a toast can be raised by anything - a form, a future axios interceptor - and
 * has to land in the same place regardless of which route raised it.
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <ToastViewport />
    </BrowserRouter>
  </StrictMode>,
);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './auth/AuthContext';
import AuthGate from './auth/AuthGate';
import App from './App';
import { StoreFront } from './components/store/StoreFront';
import { ProductPage } from './components/store/ProductPage';
import './index.css';

// Public store routes — no auth required
// /store/:slug           → StoreFront
// /store/:slug/:kitId    → ProductPage
const parts = window.location.pathname.split('/').filter(Boolean);
const isStorePath = parts[0] === 'store' && parts[1];

function StoreRouter() {
  const slug = parts[1];
  const kitId = parts[2];
  if (kitId) return <ProductPage slug={slug} kitId={kitId} />;
  return <StoreFront slug={slug} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isStorePath ? (
      <StoreRouter />
    ) : (
      <AuthProvider>
        <AuthGate>
          <App />
        </AuthGate>
      </AuthProvider>
    )}
  </StrictMode>,
);

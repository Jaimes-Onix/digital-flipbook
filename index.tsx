import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './src/lib/supabase';
import App from './App';
import SharedLinkResolver from './components/SharedLinkResolver';
import SharedBookView from './components/SharedBookView';
import SharedCategoryView from './components/SharedCategoryView';
import SignIn from './components/SignIn';

const Root: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setAuthState(session ? 'authenticated' : 'unauthenticated');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setAuthState(session ? 'authenticated' : 'unauthenticated');
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Shared links are always publicly accessible (no auth required)
  if (location.pathname.startsWith('/s/')) {
    return (
      <Routes>
        <Route path="/s/:token" element={<SharedLinkResolver />} />
      </Routes>
    );
  }

  if (location.pathname.startsWith('/share/')) {
    return (
      <Routes>
        <Route path="/share/book/:bookId" element={<SharedBookView />} />
        <Route path="/share/category/:category" element={<SharedCategoryView />} />
      </Routes>
    );
  }

  // Sign-in page — let SignIn handle its own redirect after showing the success modal
  if (location.pathname === '/signin') {
    return (
      <Routes>
        <Route path="/signin" element={<SignIn />} />
      </Routes>
    );
  }

  // Loading state — show nothing until auth is resolved
  if (authState === 'loading') {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: '#0a0a0c',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 28, height: 28,
          border: '2.5px solid rgba(255,255,255,0.08)',
          borderTopColor: 'rgba(16,185,129,0.6)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  // Not authenticated — redirect to sign-in
  if (authState === 'unauthenticated') {
    navigate('/signin', { replace: true });
    return null;
  }

  return <App />;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </React.StrictMode>
);
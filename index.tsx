import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import App from './App';
import SharedCategoryView from './components/SharedCategoryView';
import SharedBookView from './components/SharedBookView';

const Root: React.FC = () => {
  const location = useLocation();

  // Shared links get their own standalone layout (no sidebar/header)
  if (location.pathname.startsWith('/share/')) {
    return (
      <Routes>
        <Route path="/share/book/:bookId" element={<SharedBookView />} />
        <Route path="/share/:category" element={<SharedCategoryView />} />
      </Routes>
    );
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
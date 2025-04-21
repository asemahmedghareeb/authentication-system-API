import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { App, AuthCallback } from './App'; // Assuming you've exported both components

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/auth-callback" element={<AuthCallback />} />
        {/* Define other routes like /login, /dashboard, etc. */}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
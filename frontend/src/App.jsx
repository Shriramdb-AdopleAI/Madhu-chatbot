import React, { useState, Suspense, lazy } from 'react';
import { Routes, Route, BrowserRouter, Navigate } from 'react-router-dom';
import './App.css';

const AuthPage = lazy(() => import('./pages/AuthPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('rag_user');
    return saved ? JSON.parse(saved) : null;
  });

  return (
    <BrowserRouter>
      <Suspense fallback={
        <div className="loading-screen">
          <div className="loading-spinner"></div>
        </div>
      }>
        <Routes>
          <Route path="/" element={
            user ? <ChatPage user={user} setUser={setUser} /> : <Navigate to="/login" replace />
          } />
          <Route path="/login" element={
            !user ? <AuthPage setUser={setUser} /> : <Navigate to="/" replace />
          } />
          <Route path="/admin" element={
            user ? <AdminPage user={user} /> : <Navigate to="/" replace />
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

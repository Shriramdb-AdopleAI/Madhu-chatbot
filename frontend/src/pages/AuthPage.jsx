import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup
} from 'firebase/auth';
import { Sparkles } from 'lucide-react';

export default function AuthPage({ setUser }) {
  const [authMode, setAuthMode] = useState('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (authMode === 'signup' && password !== confirmPassword) {
      setAuthError('Passwords do not match');
      return;
    }

    setIsLoadingAuth(true);
    setAuthError('');

    try {
      let userCredential;

      if (authMode === 'login') {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: username });
      }

      const firebaseUser = userCredential.user;
      const userData = {
        username: firebaseUser.displayName || username,
        email: firebaseUser.email,
        role: 'user',
        uid: firebaseUser.uid
      };
      setUser(userData);
      localStorage.setItem('rag_user', JSON.stringify(userData));
    } catch (err) {
      const errorMessages = {
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/email-already-in-use': 'Email is already registered',
        'auth/weak-password': 'Password should be at least 6 characters',
        'auth/invalid-email': 'Invalid email address',
        'auth/invalid-credential': 'Invalid email or password',
      };
      setAuthError(errorMessages[err.code] || err.message);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoadingAuth(true);
    setAuthError('');

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      const userData = {
        username: firebaseUser.displayName || 'User',
        email: firebaseUser.email,
        role: 'user',
        uid: firebaseUser.uid
      };
      setUser(userData);
      localStorage.setItem('rag_user', JSON.stringify(userData));
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setAuthError(err.message);
      }
    } finally {
      setIsLoadingAuth(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-gradient" />
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <Sparkles size={20} />
          </div>
          <div className="auth-brand-name">Nexus<span>RAG</span></div>
        </div>

        <h2 className="auth-title">{authMode === 'login' ? 'Welcome back' : 'Create account'}</h2>
        <p className="auth-subtitle">
          {authMode === 'login' ? 'Sign in to access your knowledge base' : 'Get started with your AI assistant'}
        </p>

        {authError && <div className="auth-error">{authError}</div>}

        <form onSubmit={handleAuth} className="auth-form">
          {authMode === 'signup' && (
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="form-input"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                required
              />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>
          {authMode === 'signup' && (
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                className="form-input"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                required
              />
            </div>
          )}
          <button type="submit" disabled={isLoadingAuth} className="auth-submit-btn">
            {isLoadingAuth ? 'Processing...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={isLoadingAuth}
          className="google-auth-btn"
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continue with Google
        </button>

        <div className="auth-switch">
          {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
          <span className="auth-switch-link" onClick={() => {setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError('');}}>
            {authMode === 'login' ? 'Sign Up' : 'Sign In'}
          </span>
        </div>
      </div>
    </div>
  );
}

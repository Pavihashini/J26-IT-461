import React, { useState } from 'react';
import { Loader2, Sprout } from 'lucide-react';
import { loginUser, registerUser } from '../services/api.js';

export default function AuthPage({ onAuthenticated, notice = '' }) {
  const [mode, setMode] = useState('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isRegister = mode === 'register';

  const switchMode = (next) => {
    setMode(next);
    setError('');
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    if (isRegister) {
      if (fullName.trim().length < 2) return setError('Enter your full name.');
      if (password.length < 8) return setError('Password must be at least 8 characters.');
      if (password !== confirm) return setError('Passwords do not match.');
    }

    setLoading(true);
    try {
      const session = isRegister
        ? await registerUser(fullName.trim(), email.trim(), password)
        : await loginUser(email.trim(), password);
      onAuthenticated(session);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  };

  return <div className="auth-shell">
    <form className="auth-card" onSubmit={submit} noValidate>
      <div className="auth-brand"><div className="brand-mark"><Sprout size={22} strokeWidth={2} /></div><div><strong>Root &amp; Reuse</strong><span>Restaurant intelligence</span></div></div>
      <h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1>
      <p className="auth-lead">{isRegister ? 'Register to browse and bid on surplus food.' : 'Sign in to continue to your dashboard.'}</p>

      {notice && !error && <div className="auth-message info" role="status">{notice}</div>}
      {error && <div className="auth-message error" role="alert">{error}</div>}

      {isRegister && <label><span>Full name</span><input type="text" autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} required /></label>}
      <label><span>Email</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
      <label><span>Password</span><input type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
      {isRegister && <label><span>Confirm password</span><input type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} required /></label>}

      <button type="submit" className="button-primary auth-submit" disabled={loading}>
        {loading ? <><Loader2 size={15} className="spin" /> Please wait…</> : isRegister ? 'Register' : 'Log in'}
      </button>

      <p className="auth-switch">
        {isRegister ? 'Already have an account?' : 'New here?'}{' '}
        <button type="button" onClick={() => switchMode(isRegister ? 'login' : 'register')}>{isRegister ? 'Log in' : 'Create an account'}</button>
      </p>
    </form>
  </div>;
}

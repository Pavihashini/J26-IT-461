import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, ShoppingBag, Sprout, User } from 'lucide-react';
import { loginUser, registerUser } from '../services/api.js';

const VARIANTS = {
  user: {
    badge: 'Customer portal',
    icon: ShoppingBag,
    headline: 'Good food, rescued before it goes to waste.',
    blurb: 'Browse surplus dishes from local restaurants and place a bid at a fraction of the price.',
    points: ['Live surplus auctions', 'Save up to 60% on fresh meals', 'Help cut restaurant food waste'],
    lead: 'Sign in to browse and bid on surplus food.',
    role: 'user',
  },
  admin: {
    badge: 'Restaurant admin',
    icon: ShieldCheck,
    headline: 'Prevent waste before it happens.',
    blurb: 'Forecast demand, track stock risk and turn unavoidable surplus into recovered value.',
    points: ['Demand forecasting by day', 'Inventory & waste-risk alerts', 'Surplus listing and bid insights'],
    lead: 'Sign in with your admin account to open the operations dashboard.',
    role: 'admin',
  },
};

export default function AuthPage({ variant = 'user', onAuthenticated, onNavigate, notice = '' }) {
  const copy = VARIANTS[variant];
  const isAdmin = variant === 'admin';
  const [mode, setMode] = useState('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isRegister = !isAdmin && mode === 'register';
  const BadgeIcon = copy.icon;

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
      if (session.user.role !== copy.role) {
        setError(isAdmin
          ? 'This account is not an admin account. Use the customer login instead.'
          : 'This is an admin account. Please use the admin login.');
        return;
      }
      onAuthenticated(session);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  };

  return <div className={`auth-page ${isAdmin ? 'admin' : 'customer'}`}>
    <aside className="auth-aside">
      <span className="orb orb-a" /><span className="orb orb-b" /><span className="orb orb-c" />
      <button type="button" className="auth-brand-link" onClick={() => onNavigate('home')}>
        <span className="brand-mark"><Sprout size={22} strokeWidth={2} /></span>
        <span><strong>Root &amp; Reuse</strong><small>Restaurant intelligence</small></span>
      </button>

      <div className="auth-aside-body">
        <span className="auth-badge"><BadgeIcon size={14} /> {copy.badge}</span>
        <h2>{copy.headline}</h2>
        <p>{copy.blurb}</p>
        <ul>{copy.points.map((point) => <li key={point}><i />{point}</li>)}</ul>
      </div>

      <div className="auth-aside-foot">Research prototype · J26 · IT · 461</div>
    </aside>

    <main className="auth-main">
      <button type="button" className="auth-back" onClick={() => onNavigate('home')}><ArrowLeft size={15} /> Back to home</button>

      <form className="auth-card" onSubmit={submit} noValidate>
        <div className="auth-icon"><BadgeIcon size={22} /></div>
        <h1>{isRegister ? 'Create your account' : isAdmin ? 'Admin sign in' : 'Welcome back'}</h1>
        <p className="auth-lead">{isRegister ? 'Register to browse and bid on surplus food.' : copy.lead}</p>

        {notice && !error && <div className="auth-message info" role="status">{notice}</div>}
        {error && <div className="auth-message error" role="alert">{error}</div>}

        {isRegister && <label><span>Full name</span><div className="field"><User size={16} /><input type="text" autoComplete="name" placeholder="Your full name" value={fullName} onChange={(event) => setFullName(event.target.value)} required /></div></label>}
        <label><span>Email</span><div className="field"><Mail size={16} /><input type="email" autoComplete="email" placeholder={isAdmin ? 'admin@restaurant.com' : 'you@example.com'} value={email} onChange={(event) => setEmail(event.target.value)} required /></div></label>
        <label><span>Password</span><div className="field"><Lock size={16} /><input type={showPassword ? 'text' : 'password'} autoComplete={isRegister ? 'new-password' : 'current-password'} placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <button type="button" className="field-toggle" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
        {isRegister && <label><span>Confirm password</span><div className="field"><Lock size={16} /><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Repeat password" value={confirm} onChange={(event) => setConfirm(event.target.value)} required /></div></label>}

        <button type="submit" className="button-primary auth-submit" disabled={loading}>
          {loading ? <><Loader2 size={15} className="spin" /> Please wait…</> : isRegister ? 'Create account' : isAdmin ? 'Sign in to dashboard' : 'Log in'}
        </button>

        {!isAdmin && <p className="auth-switch">
          {isRegister ? 'Already have an account?' : 'New here?'}{' '}
          <button type="button" onClick={() => switchMode(isRegister ? 'login' : 'register')}>{isRegister ? 'Log in' : 'Create an account'}</button>
        </p>}
        <p className="auth-switch other">
          {isAdmin ? 'Not a restaurant admin?' : 'Run a restaurant?'}{' '}
          <button type="button" onClick={() => onNavigate(isAdmin ? 'user-login' : 'admin-login')}>{isAdmin ? 'Customer login' : 'Admin login'}</button>
        </p>
      </form>
    </main>
  </div>;
}

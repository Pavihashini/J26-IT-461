import BrandMark from '../components/BrandMark.jsx';
import RegistrationForm from '../components/RegistrationForm.jsx';
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Coins, Eye, EyeOff, Gavel, Leaf, Loader2, Lock, Mail, ShieldCheck, ShoppingBag, UserRound } from 'lucide-react';
import { fetchAuthCapabilities, loginUser } from '../services/api.js';
import GoogleSignIn from '../components/GoogleSignIn.jsx';
import { ForgotPassword } from './ResetPasswordPage.jsx';
import './AuthPage.css';

const VARIANTS = {
  user: {
    badge: 'Customer portal',
    icon: ShoppingBag,
    headline: 'Good food, rescued before it goes to waste.',
    blurb: '',
    points: ['Live surplus auctions', 'Save up to 60% on fresh meals', 'Help cut restaurant food waste'],
    lead: '',
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

export default function AuthPage({ variant = 'user', initialMode = 'login', onAuthenticated, onNavigate, notice = '' }) {
  const copy = VARIANTS[variant];
  const isAdmin = variant === 'admin';
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [capabilities, setCapabilities] = useState({});

  useEffect(() => {
    let active = true;
    fetchAuthCapabilities().then(data => { if (active) setCapabilities(data); }).catch(() => {});
    return () => { active = false; };
  }, []);

  const isRegister = !isAdmin && mode === 'register';
  const BadgeIcon = copy.icon;

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setFieldErrors({});
    setForgot(false);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setError('');
    const errors = {};
    const identity = email.trim();
    const validEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(identity);
    const validMobile = /^(?:\+94|94|0)?7\d{8}$/.test(identity.replace(/[\s()-]/g, ''));
    if (!identity || !(validEmail || (!isAdmin && validMobile))) errors.username = isAdmin ? 'Enter a valid email address.' : 'Enter a valid email or Sri Lankan mobile number.';
    if (!password) errors.password = 'Password is required.';
    setFieldErrors(errors);
    if (Object.keys(errors).length) { document.getElementById(`signin-${Object.keys(errors)[0]}`)?.focus(); return; }
    setLoading(true);
    try {
      const session = await loginUser(email.trim(), password);
      if (session.user.role !== copy.role) {
        setError(isAdmin
          ? 'This account is not an admin account. Use the customer login instead.'
          : 'This is an admin account. Please use the admin login.');
        return;
      }
      onAuthenticated({ ...session, remember_me: remember });
    } catch (reason) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  };

  if (isRegister) return <div className="registration-page">
    <header className="registration-header"><button type="button" className="auth-brand-link" onClick={() => onNavigate('home')}><BrandMark /><span><strong>SmartPlate</strong><small>Restaurant intelligence</small></span></button><button type="button" className="registration-back" onClick={() => onNavigate('home')}><ArrowLeft size={16} /> Back to home</button></header>
    <RegistrationForm onAuthenticated={onAuthenticated} onSignIn={() => switchMode('login')} />
  </div>;

  return <div className={`auth-page ${isAdmin ? 'admin' : 'customer'}`}>
    <aside className="auth-aside">
      <span className="orb orb-a" /><span className="orb orb-b" /><span className="orb orb-c" />
      <button type="button" className="auth-brand-link" onClick={() => onNavigate('home')}>
        <BrandMark />
        <span><strong>SmartPlate</strong><small>Restaurant intelligence</small></span>
      </button>

      <div className="auth-aside-body">
        <span className="auth-badge"><BadgeIcon size={14} /> {copy.badge}</span>
        <h2>{isAdmin ? copy.headline : <>Good food, <em>rescued</em> before it goes to waste.</>}</h2>
        {copy.blurb && <p>{copy.blurb}</p>}
        <ul>{copy.points.map((point, index) => {
          const Icon = [Gavel, Coins, Leaf][index];
          return <li key={point}>{isAdmin ? <i /> : <span className={`auth-benefit-icon benefit-${index}`}><Icon size={19} strokeWidth={1.7} /></span>}<span>{point}</span></li>;
        })}</ul>
      </div>

    </aside>

    <main className="auth-main">
      <button type="button" className="auth-back" onClick={() => onNavigate('home')}><ArrowLeft size={15} /> Back to home</button>

      {forgot ? <ForgotPassword available={Boolean(capabilities.password_reset_enabled)} onBack={() => setForgot(false)} /> : <form className={`auth-card ${isAdmin ? '' : 'signin-reference'}`} onSubmit={submit} noValidate>
        {isAdmin && <div className="auth-icon"><BadgeIcon size={22} /></div>}
        <h1>{isAdmin ? 'Admin sign in' : 'Sign in or register'}</h1>
        {copy.lead && <p className="auth-lead">{copy.lead}</p>}
        {notice && !error && <div className="auth-message info" role="status">{notice}</div>}
        {error && <div className="auth-message error" role="alert">{error}</div>}

        <label htmlFor="signin-username"><span>{isAdmin ? 'Email' : 'Username'} <span aria-hidden="true">*</span></span><div className="field">{isAdmin && <Mail size={16} />}<input id="signin-username" type={isAdmin ? 'email' : 'text'} autoComplete="username" placeholder={isAdmin ? 'admin@restaurant.com' : 'Mobile (Ex: 771234567) / Email'} value={email} onChange={event => { setEmail(event.target.value); setFieldErrors(previous => ({ ...previous, username: '' })); }} required aria-invalid={Boolean(fieldErrors.username)} aria-describedby={fieldErrors.username ? 'signin-username-error' : undefined} /></div></label>
        {fieldErrors.username && <small id="signin-username-error" className="signin-field-error">{fieldErrors.username}</small>}
        <label htmlFor="signin-password"><span>Password <span aria-hidden="true">*</span></span><div className="field">{isAdmin && <Lock size={16} />}<input id="signin-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Password" value={password} onChange={event => { setPassword(event.target.value); setFieldErrors(previous => ({ ...previous, password: '' })); }} required aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? 'signin-password-error' : undefined} />
          <button type="button" className="field-toggle" onClick={() => setShowPassword(shown => !shown)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
        {fieldErrors.password && <small id="signin-password-error" className="signin-field-error">{fieldErrors.password}</small>}
        <label className="signin-remember"><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} /><span>Remember me</span></label>
        <button type="submit" className="button-primary auth-submit" disabled={loading}>{loading ? <><Loader2 size={16} className="spin" /> Signing in?</> : <><UserRound size={19} />{isAdmin ? 'Sign in to dashboard' : 'Sign in with SmartPlate'}</>}</button>
        <button className="signin-text-button signin-forgot" type="button" onClick={() => setForgot(true)}>Forgot your password?</button>
        {!isAdmin && <>
          <div className="signin-access-actions"><button className="signin-guest" type="button" onClick={() => onNavigate('guest')}>Continue as guest</button><button className="signin-register" type="button" onClick={() => switchMode('register')}>Create an account</button></div>
          <div className="signin-google-divider"><span>or</span></div>
          <GoogleSignIn clientId={capabilities.google_client_id} onAuthenticated={onAuthenticated} onError={setError} remember={remember} />
        </>}
        <p className="auth-switch other">{isAdmin ? 'Not a restaurant admin?' : 'Run a restaurant?'}{' '}<button type="button" onClick={() => onNavigate(isAdmin ? 'user-login' : 'admin-login')}>{isAdmin ? 'Customer login' : 'Admin login'}</button></p>
      </form>}

    </main>
  </div>;
}

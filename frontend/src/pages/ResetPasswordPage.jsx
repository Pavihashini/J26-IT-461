import React, { useEffect, useState } from 'react';
import { resetPassword, requestPasswordReset } from '../services/api.js';

export function ForgotPassword({ onBack, available }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async event => {
    event.preventDefault(); setError(''); setBusy(true);
    try { setMessage((await requestPasswordReset(email.trim())).message); }
    catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  };
  return <form className="auth-card signin-reference recovery-card" onSubmit={submit}>
    <h1>Reset your password</h1>
    <p className="recovery-copy">Enter your account email to request a reset link.</p>
    {!available && <div className="auth-message info" role="status">Password recovery is not available yet. Please contact the restaurant administrator.</div>}
    {error && <div className="auth-message error" role="alert">{error}</div>}
    {message ? <div className="auth-message info" role="status">{message}</div> : <><label htmlFor="recovery-email">Email <span aria-hidden="true">*</span></label><input id="recovery-email" className="signin-plain-input" type="email" autoComplete="email" maxLength={254} required value={email} onChange={event => setEmail(event.target.value)} /><button className="button-primary auth-submit" disabled={busy || !available}>{busy ? 'Sending…' : 'Send reset link'}</button></>}
    <button className="signin-text-button" type="button" onClick={onBack}>Back to sign in</button>
  </form>;
}

export default function ResetPasswordPage({ onComplete }) {
  const [token] = useState(() => new URLSearchParams(window.location.search).get('reset_token') || '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const url = new URL(window.location.href); url.searchParams.delete('reset_token');
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);
  }, []);
  const submit = async event => {
    event.preventDefault(); setError('');
    if (password.length < 8 || password.length > 128 || !/\p{L}/u.test(password) || !/\p{N}/u.test(password)) { setError('Use 8–128 characters, including a letter and a number.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setBusy(true);
    try { setMessage((await resetPassword(token, password)).message); }
    catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  };
  return <main className="reset-password-page"><form className="auth-card signin-reference recovery-card" onSubmit={submit}>
    <h1>Choose a new password</h1>
    {error && <div className="auth-message error" role="alert">{error}</div>}
    {message ? <><div className="auth-message info" role="status">{message}</div><button type="button" className="button-primary auth-submit" onClick={onComplete}>Continue to sign in</button></> : <>
      <label htmlFor="reset-password">New password *</label><input id="reset-password" className="signin-plain-input" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={event => setPassword(event.target.value)} />
      <small className="recovery-copy">8–128 characters, including a letter and a number.</small>
      <label htmlFor="reset-confirm">Confirm password *</label><input id="reset-confirm" className="signin-plain-input" type="password" autoComplete="new-password" required value={confirm} onChange={event => setConfirm(event.target.value)} />
      <button className="button-primary auth-submit" disabled={busy}>{busy ? 'Updating…' : 'Update password'}</button>
      <button type="button" className="signin-text-button" onClick={onComplete}>Back to sign in</button>
    </>}
  </form></main>;
}

import React, { useEffect, useRef, useState } from 'react';
import { signInWithGoogle } from '../services/api.js';

let googleScript;
function loadGoogle() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!googleScript) googleScript = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = resolve;
    script.onerror = () => { googleScript = null; reject(new Error('Google sign-in could not load. Please try again.')); };
    document.head.appendChild(script);
  });
  return googleScript;
}

export default function GoogleSignIn({ clientId, onAuthenticated, onError, remember }) {
  const container = useRef(null);
  const current = useRef({ onAuthenticated, onError, remember });
  current.current = { onAuthenticated, onError, remember };
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!clientId) return undefined;
    let active = true;
    loadGoogle().then(() => {
      if (!active) return;
      window.google.accounts.id.initialize({ client_id: clientId, callback: async response => {
        if (!active) return;
        setBusy(true);
        try {
          const session = await signInWithGoogle(response.credential);
          if (active) current.current.onAuthenticated({ ...session, remember_me: current.current.remember });
        } catch (error) { if (active) current.current.onError(error.message); }
        finally { if (active) setBusy(false); }
      } });
      window.google.accounts.id.renderButton(container.current, { theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with', width: Math.min(400, container.current.clientWidth) });
    }).catch(error => { if (active) current.current.onError(error.message); });
    return () => { active = false; };
  }, [clientId]);
  return <div className="signin-google-area">
    {clientId ? <div ref={container} className="signin-google-button" aria-busy={busy} /> : <><button type="button" className="signin-google-unavailable" disabled><span aria-hidden="true">G</span> Sign in with Google</button><small>Google sign-in is not available yet.</small></>}
    {busy && <small role="status">Signing in with Google…</small>}
  </div>;
}

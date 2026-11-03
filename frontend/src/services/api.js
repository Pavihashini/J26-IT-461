const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

export async function fetchHealth() {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/health`, { cache: 'no-store' });
  } catch {
    throw new Error('The backend could not be reached.');
  }

  if (!response.ok) {
    throw new Error(`The backend returned HTTP ${response.status}.`);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('The backend returned an invalid response.');
  }

  if (data?.status !== 'ok' || data?.service !== 'food-waste-prevention-backend') {
    throw new Error('The backend returned an unexpected health response.');
  }

  return data;
}

const TOKEN_KEY = 'rr_access_token';
let rememberSession = false;

export function getStoredToken() {
  try {
    const persistent = window.localStorage.getItem(TOKEN_KEY);
    rememberSession = Boolean(persistent);
    return persistent || window.sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function storeToken(token, remember = rememberSession) {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(TOKEN_KEY);
    rememberSession = Boolean(token && remember);
    if (token) (rememberSession ? window.localStorage : window.sessionStorage).setItem(TOKEN_KEY, token);
  } catch {
    // storage may be blocked; the session then lasts until reload
  }
}

let memoryToken = null;
const currentToken = () => memoryToken || getStoredToken();

async function requestJson(path, options = {}) {
  let response;
  const token = currentToken();
  const headers = { ...(options.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) };

  try {
    response = await fetch(`${API_BASE_URL}${path}`, { cache: 'no-store', ...options, headers });
  } catch {
    throw new Error('The backend could not be reached.');
  }

  if (response.status === 401 && token && !path.startsWith('/api/auth/login')) {
    window.dispatchEvent(new Event('auth:expired'));
  }

  if (!response.ok) {
    let detail = '';
    if (response.status === 422) detail = 'Please check the details you entered.';
    try {
      const body = await response.json();
      if (typeof body?.detail === 'string') detail = body.detail;
    } catch {
      // keep the generic message
    }
    throw new Error(typeof detail === 'string' && detail ? detail : `The backend returned HTTP ${response.status}.`);
  }

  try {
    return await response.json();
  } catch {
    throw new Error('The backend returned an invalid response.');
  }
}

export function fetchForecastOptions() {
  return requestJson('/api/forecast/options');
}

export function fetchStockPlan(payload) {
  return requestJson('/api/forecast/stock-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function setSessionToken(token, remember = rememberSession) {
  memoryToken = token;
  storeToken(token, remember);
}

export function loginUser(email, password) {
  return requestJson('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

export function registerUser(fullName, email, password, profile = {}) {
  return requestJson('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...profile, full_name: fullName, email, password }),
  });
}

export function fetchCurrentUser() {
  return requestJson('/api/auth/me');
}

export const fetchAuthCapabilities = () => requestJson('/api/auth/capabilities');
export const signInWithGoogle = (credential) => requestJson('/api/auth/google', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credential }) });
export const requestPasswordReset = (email) => requestJson('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
export const resetPassword = (token, password) => requestJson('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) });

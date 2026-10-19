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

async function requestJson(path, options) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, { cache: 'no-store', ...options });
  } catch {
    throw new Error('The backend could not be reached.');
  }

  if (!response.ok) {
    let detail = '';
    try {
      detail = (await response.json())?.detail || '';
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

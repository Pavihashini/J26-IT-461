export const formatLKR = (value, { compact = false } = {}) => {
  const n = Number.isFinite(Number(value)) ? Number(value) : 0;
  if (compact && Math.abs(n) >= 1000000) return `Rs. ${(n / 1000000).toFixed(1)}M`;
  if (compact && Math.abs(n) >= 1000) return `Rs. ${(n / 1000).toFixed(1)}k`;
  return `Rs. ${Math.round(n).toLocaleString('en-LK')}`;
};

export const formatDate = (iso) => {
  if (!iso) return '—';
  const date = new Date(`${iso}T00:00:00`);
  return new Intl.DateTimeFormat('en-LK', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
};

export const timeRemaining = (seconds) => {
  const safe = Math.max(0, seconds || 0);
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
};

export const dayDifference = (dateISO) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateISO}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
};

export const sumBy = (items, fn) => items.reduce((total, item) => total + fn(item), 0);

export const cx = (...items) => items.filter(Boolean).join(' ');

// Surplus bidding rules: bids are accepted 9:00 PM – 9:15 PM only, and a bid may range from
// 20% of the meal price (starting bid) up to 70% of it (a 30% discount, the maximum bid).
export const BID_WINDOW = { openMinutes: 21 * 60, closeMinutes: 21 * 60 + 15, label: '9:00 PM – 9:15 PM' };
export const START_BID_RATIO = 0.2;
export const MAX_BID_RATIO = 0.7;

export const startingBid = (mealPrice) => Math.round(mealPrice * START_BID_RATIO);
export const maximumBid = (mealPrice) => Math.round(mealPrice * MAX_BID_RATIO);

// phase: 'before' | 'open' | 'after'; seconds: until the window opens (before), until it closes (open), else 0.
export const bidWindowState = (now = new Date()) => {
  const secondsOfDay = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const open = BID_WINDOW.openMinutes * 60;
  const close = BID_WINDOW.closeMinutes * 60;
  if (secondsOfDay < open) return { phase: 'before', seconds: open - secondsOfDay };
  if (secondsOfDay < close) return { phase: 'open', seconds: close - secondsOfDay };
  return { phase: 'after', seconds: 0 };
};

export const formatHMS = (seconds) => {
  const safe = Math.max(0, seconds || 0);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${h ? `${String(h).padStart(2, '0')}:` : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

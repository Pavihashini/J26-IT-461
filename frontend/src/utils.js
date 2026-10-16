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

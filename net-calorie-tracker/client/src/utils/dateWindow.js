function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayString() {
  return toDateString(new Date());
}

export function minAllowedDateString() {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return toDateString(date);
}

export function shiftDateString(dateString, deltaDays) {
  const [y, m, d] = dateString.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + deltaDays);
  return toDateString(date);
}

export function formatDateDisplay(dateString) {
  const [y, m, d] = dateString.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
}

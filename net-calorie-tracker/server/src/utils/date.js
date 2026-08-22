const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_PAST_DAYS = 30;

// "Today" is the server's local calendar date, not UTC — a plain YYYY-MM-DD
// date string has no timezone of its own, and comparing it against UTC would
// reject a user's real "today" whenever the server sits east of UTC.
function todayLocalAsUtcMidnight() {
  const now = new Date();
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
}

function parseDateStringAsUtcMidnight(value) {
  const [year, month, day] = value.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

export function isValidDateString(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const timestamp = parseDateStringAsUtcMidnight(value);
  if (Number.isNaN(timestamp)) return false;
  return new Date(timestamp).toISOString().slice(0, 10) === value;
}

export function isWithinAllowedWindow(value) {
  if (!isValidDateString(value)) return false;
  const dateMs = parseDateStringAsUtcMidnight(value);
  const todayMs = todayLocalAsUtcMidnight();
  const diffDays = Math.round((todayMs - dateMs) / DAY_MS);
  return diffDays >= 0 && diffDays <= MAX_PAST_DAYS;
}

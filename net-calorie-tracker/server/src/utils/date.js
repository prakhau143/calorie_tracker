const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_PAST_DAYS = 30;

// The server has no idea what timezone the client is in — a plain YYYY-MM-DD
// string carries no offset of its own. A client east of UTC (e.g. IST,
// UTC+5:30) can have a local "today" that is still "tomorrow" relative to
// the server's UTC clock; a client west of UTC can likewise have a local
// date one day behind. Rather than guess, the window is anchored to the
// server's own UTC date and widened by a day on each edge so a user's real
// "today" (or their real "30 days ago") is never rejected purely because of
// clock skew between the two.
const SKEW_TOLERANCE_DAYS = 1;

function serverTodayAsUtcMidnight() {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
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
  const todayMs = serverTodayAsUtcMidnight();
  const diffDays = Math.round((todayMs - dateMs) / DAY_MS);
  return diffDays >= -SKEW_TOLERANCE_DAYS && diffDays <= MAX_PAST_DAYS + SKEW_TOLERANCE_DAYS;
}

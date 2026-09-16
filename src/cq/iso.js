// Shared ISO-8601 date/timestamp validators. Date.parse alone is too lenient — it silently rolls
// impossible dates over into a real one (e.g. "2026-02-30" -> Mar 2, hour "24" -> next day), which
// let a tampered/replayed record pass as a valid streak day or session timestamp. These check the
// shape AND that every component (year/month/day/hour/minute/second) is actually in range.

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;
const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate(); // month is 1-based here on purpose
}

function validDayParts(year, month, day) {
  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month);
}

// Full timestamp: 'YYYY-MM-DDTHH:MM[:SS[.sss]](Z|±HH:MM)'. Returns true only when the date is a
// real calendar date and every time component is in range (hour 0-23, minute/second 0-59).
export function isValidIso(value) {
  if (typeof value !== 'string') return false;
  const m = ISO_RE.exec(value);
  if (!m) return false;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const hour = Number(m[4]);
  const minute = Number(m[5]);
  const second = m[6] ? Number(m[6]) : 0;
  if (!validDayParts(year, month, day)) return false;
  if (hour > 23 || minute > 59 || second > 59) return false;
  return Number.isFinite(Date.parse(value));
}

// Plain 'YYYY-MM-DD' day string, used for streak/practice-day tracking.
export function isValidDay(value) {
  if (typeof value !== 'string') return false;
  const m = DAY_RE.exec(value);
  if (!m) return false;
  return validDayParts(Number(m[1]), Number(m[2]), Number(m[3]));
}

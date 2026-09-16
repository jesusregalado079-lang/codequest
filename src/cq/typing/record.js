import { GEMS } from '../items.js';
import { addGems, normalizeCq } from '../character.js';
import { normalizeTyping } from './state.js';

const MODES = ['homeRow', 'lessonWords', 'sentences'];
// Fix P5a-fix #5: require a real ISO timestamp shape before trusting Date.parse (too lenient alone).
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;
const validIso = (value) => typeof value === 'string' && ISO_RE.test(value) && Number.isFinite(Date.parse(value));
const validDay = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && (() => {
    const parts = value.split('-').map(Number);
    const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    return date.getUTCFullYear() === parts[0] && date.getUTCMonth() === parts[1] - 1 && date.getUTCDate() === parts[2];
  })();
// Fix P5a-fix #2/#3: clamp/round exactly like state.js's normalizeSession/normalizeBest, so the
// stored session, the new-best comparison, and the returned cq all agree on the same values.
const clampInt = (value, min, max) => Math.min(max, Math.max(min, Math.round(value)));
const clamp1 = (value, min, max) => Math.round(Math.min(max, Math.max(min, value)) * 10) / 10;
const sessionScoreOf = (m) => (m.accuracy >= 90 ? m.wpm : 0);

// recordTypingSession(cq, metricsWithMode, nowIso, todayYmd) -> { cq, newBest, gems } (docs/computer-quest/typing.md §5).
export function recordTypingSession(cq, m, nowIso, todayYmd) {
  const normalized = normalizeCq(cq);
  const mode = m && MODES.includes(m.mode) ? m.mode : null;
  if (!mode) return { cq: normalized, newBest: false, gems: 0 };

  const wpm = clamp1(Number.isFinite(m.wpm) ? m.wpm : 0, 0, 200);
  const accuracy = clampInt(Number.isFinite(m.accuracy) ? m.accuracy : 0, 0, 100);
  const ms = clampInt(Number.isFinite(m.ms) ? m.ms : 0, 0, 3600000);
  const chars = clampInt(Number.isFinite(m.chars) ? m.chars : 0, 0, 10000);
  const at = validIso(nowIso) ? nowIso : new Date().toISOString();

  const typing = normalizeTyping(normalized.typing);
  const session = { at, mode, wpm, accuracy, ms, chars };
  const sessions = [...typing.sessions, session].slice(-20);

  const score = sessionScoreOf(session);
  const current = typing.best[mode];
  const currentWpm = current ? current.wpm : 0;
  const currentAccuracy = current ? current.accuracy : -1;
  // New best: sessionScore beats the stored wpm, or ties it with higher accuracy, compared using
  // the same clamped/rounded values that get stored (fix #3: e.g. 12.34 rounds to 12.3, so it does
  // not "beat" an existing 12.3 best). <90% sessions score 0 and can never win.
  const newBest = accuracy >= 90 && (score > currentWpm || (score === currentWpm && accuracy > currentAccuracy));
  const best = newBest ? { ...typing.best, [mode]: { wpm: score, accuracy, at } } : typing.best;

  // Fix P5a-fix #4: bestGemDays is sorted ascending and capped at the most recent 30. If it's
  // already full and todayYmd is older than the oldest kept day, adding it would be sliced away
  // immediately (silently "forgotten"), letting the same old day pay again on a later replay.
  // Refuse to pay (or record) in that case.
  const today = validDay(todayYmd) ? todayYmd : null;
  const atCapacity = typing.bestGemDays.length >= 30;
  const staleDay = atCapacity && today !== null && today < typing.bestGemDays[0];
  const paysGem = newBest && today !== null && !staleDay && !typing.bestGemDays.includes(today);
  const bestGemDays = paysGem ? [...typing.bestGemDays, today].sort().slice(-30) : typing.bestGemDays;
  const gems = paysGem ? GEMS.typingBest : 0;

  // Fix P5a-fix #2: always return a fully normalized cq, even on the no-gems path (previously only
  // the addGems branch was re-normalized, so an unclamped session/best could leak out unnormalized).
  const nextCq = { ...normalized, typing: { best, sessions, bestGemDays } };
  return { cq: normalizeCq(gems > 0 ? addGems(nextCq, gems) : nextCq), newBest, gems };
}

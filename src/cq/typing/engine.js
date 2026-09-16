const finiteNumber = (value) => typeof value === 'number' && Number.isFinite(value);
const round1 = (value) => Math.round(value * 10) / 10;

export function createSession({ mode, items } = {}) {
  const list = Array.isArray(items) ? items.filter((item) => typeof item === 'string' && item.length) : [];
  return {
    mode: typeof mode === 'string' ? mode : '',
    text: list.join(' '),
    index: 0,
    keystrokes: 0,
    correct: 0,
    errors: 0,
    errorAt: {},
    startedAt: null,
    endedAt: null,
    streak: 0,
    bestStreak: 0,
  };
}

export function pressKey(state, key, now) {
  if (typeof key !== 'string' || key.length !== 1) return { state, result: 'ignored' };
  if (state.index >= state.text.length) return { state, result: 'ignored' };
  const time = finiteNumber(now) ? now : null;
  // Fix P5a-fix #7: a non-finite `now` on the FIRST counted key must still lock in a startedAt
  // (documented fallback: 0) right away. Leaving it null would let a later keypress's valid `now`
  // become the recorded start instead, silently shifting the whole session's timing forward.
  const startedAt = state.startedAt !== null ? state.startedAt : (time !== null ? time : 0);
  const expected = state.text[state.index];
  if (key === expected) {
    const index = state.index + 1;
    const streak = state.streak + 1;
    const done = index >= state.text.length;
    // Same documented fallback applies to the completing key's endedAt.
    const endedAt = done ? (time !== null ? time : 0) : state.endedAt;
    return {
      state: {
        ...state,
        index,
        keystrokes: state.keystrokes + 1,
        correct: state.correct + 1,
        streak,
        bestStreak: Math.max(state.bestStreak, streak),
        startedAt,
        endedAt,
      },
      result: 'correct',
    };
  }
  return {
    state: {
      ...state,
      keystrokes: state.keystrokes + 1,
      errors: state.errors + 1,
      errorAt: { ...state.errorAt, [state.index]: (state.errorAt[state.index] || 0) + 1 },
      streak: 0,
      startedAt,
    },
    result: 'wrong',
  };
}

function topMissedKeys(state) {
  const counts = new Map();
  const firstIndex = new Map();
  Object.keys(state.errorAt).forEach((rawIndex) => {
    const index = Number(rawIndex);
    const n = state.errorAt[rawIndex];
    if (!Number.isInteger(index) || index < 0 || index >= state.text.length || !finiteNumber(n) || n <= 0) return;
    const char = state.text[index];
    counts.set(char, (counts.get(char) || 0) + n);
    if (!firstIndex.has(char) || index < firstIndex.get(char)) firstIndex.set(char, index);
  });
  return Array.from(counts.keys())
    .sort((a, b) => counts.get(b) - counts.get(a) || firstIndex.get(a) - firstIndex.get(b))
    .slice(0, 3);
}

export function metrics(state) {
  const hasSpan = finiteNumber(state.startedAt) && finiteNumber(state.endedAt);
  const ms = hasSpan ? Math.max(0, state.endedAt - state.startedAt) : 0;
  const minutes = Math.max(0.25, ms / 60000);
  const wpm = round1((state.correct / 5) / minutes);
  const total = state.correct + state.errors;
  const accuracy = total > 0 ? Math.round((state.correct / total) * 100) : 0;
  return {
    wpm, accuracy, ms, chars: state.text.length, bestStreak: state.bestStreak, missedKeys: topMissedKeys(state),
  };
}

export const sessionScore = (m) => (m && m.accuracy >= 90 ? m.wpm : 0);

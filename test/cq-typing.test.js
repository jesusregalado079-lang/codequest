import assert from 'node:assert';
import {
  FINGER_FOR_KEY, GUIDED_SENTENCES, HOME_ROW_ITEMS, KEYBOARD_ROWS, STANDARD_SENTENCES,
  itemsFor, sentencesUnlocked, sessionText,
} from '../src/cq/typing/content.js';
import { createSession, metrics, pressKey, sessionScore } from '../src/cq/typing/engine.js';
import { emptyTyping, normalizeTyping } from '../src/cq/typing/state.js';
import { recordTypingSession } from '../src/cq/typing/record.js';
import { normalizeCq } from '../src/cq/character.js';
import { GEMS } from '../src/cq/items.js';
import { LESSONS } from '../src/cq/lessons/pack1.js';
import { profileReport } from '../src/cq/lesson-logic.js';

const iso = '2026-09-16T12:00:00.000Z';

function makeRng(seedStart) {
  let seed = seedStart;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.keys(value).forEach((key) => deepFreeze(value[key]));
  return Object.freeze(value);
}

function daysFrom(start, count) {
  const result = [];
  const date = new Date(`${start}T00:00:00.000Z`);
  for (let i = 0; i < count; i += 1) {
    result.push(date.toISOString().slice(0, 10));
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return result;
}

const g1 = LESSONS.find((lesson) => lesson.id === 'g1');
const g2 = LESSONS.find((lesson) => lesson.id === 'g2');
const g3 = LESSONS.find((lesson) => lesson.id === 'g3');
const s2 = LESSONS.find((lesson) => lesson.id === 's2');

// A lesson state that's passed (parent check done, phase 'key') but whose chest is NOT open yet.
const passedState = () => ({ startedAt: iso, quizPassedAt: iso, passedAt: iso, phase: 'key' });

// ---------- content: ASCII + finger-map coverage ----------
const allTypingWords = [];
LESSONS.forEach((lesson) => lesson.typingWords.forEach((word) => allTypingWords.push(word)));
const allText = [...HOME_ROW_ITEMS, ...GUIDED_SENTENCES, ...STANDARD_SENTENCES, ...allTypingWords].join(' ');
Array.from(allText).forEach((ch) => {
  assert(ch.charCodeAt(0) >= 0x20 && ch.charCodeAt(0) <= 0x7e, `not ascii: ${JSON.stringify(ch)}`);
  assert(FINGER_FOR_KEY[ch] !== undefined, `no finger for ${JSON.stringify(ch)}`);
});

// ---------- content: guided sentence rules ----------
assert.strictEqual(GUIDED_SENTENCES.length, 10);
GUIDED_SENTENCES.forEach((sentence) => {
  assert(sentence.length <= 30, `guided sentence too long: "${sentence}"`);
  assert.strictEqual(sentence.slice(-1), '.', `guided sentence must end with a period: "${sentence}"`);
  assert.strictEqual(sentence.indexOf('.'), sentence.length - 1, `only a final period allowed: "${sentence}"`);
  const body = sentence.slice(0, -1);
  assert(!/[,!?;:]/.test(body), `no extra punctuation allowed: "${sentence}"`);
  body.split(' ').forEach((word) => {
    if (word === 'I') return;
    assert.strictEqual(word, word.toLowerCase(), `only "I" may be capitalized: "${sentence}"`);
  });
});

// ---------- content: standard sentence rules ----------
assert.strictEqual(STANDARD_SENTENCES.length, 12);
STANDARD_SENTENCES.forEach((sentence) => {
  assert(sentence.length <= 40, `standard sentence too long: "${sentence}"`);
  assert(/^[A-Z]/.test(sentence), `standard sentence starts capitalized: "${sentence}"`);
  assert.strictEqual(sentence.slice(-1), '.', `standard sentence must end with a period: "${sentence}"`);
  assert(!/[!?;:]/.test(sentence), `no exotic punctuation: "${sentence}"`);
});

// ---------- content: KEYBOARD_ROWS coverage ----------
const flatKeys = KEYBOARD_ROWS.flat();
const physicalKeys = Object.keys(FINGER_FOR_KEY).filter((k) => k === k.toLowerCase());
physicalKeys.forEach((k) => assert(flatKeys.some((entry) => entry.key === k), `keyboard is missing key "${k}"`));
assert(flatKeys.filter((entry) => entry.key === 'Shift').length >= 2, 'both Shift keys are drawn');
assert.strictEqual(flatKeys.find((entry) => entry.key === 'f').bump, true, 'F has a home-row bump');
assert.strictEqual(flatKeys.find((entry) => entry.key === 'j').bump, true, 'J has a home-row bump');

// ---------- content: itemsFor — Home Row ----------
assert.deepStrictEqual(itemsFor('homeRow', normalizeCq({}), [], makeRng(1)), HOME_ROW_ITEMS.slice(0, 12));
assert.strictEqual(itemsFor('homeRow', normalizeCq({ track: 'guided' }), LESSONS, makeRng(2)).length, 12);

// ---------- content: itemsFor — Lesson Words, counts + sourcing ----------
const freshGuided = normalizeCq({ track: 'guided' });
const freshWords = itemsFor('lessonWords', freshGuided, LESSONS, makeRng(3));
assert.strictEqual(freshWords.length, 12, 'guided lesson words session length');
const g1Words = new Set(g1.typingWords);
freshWords.forEach((word) => assert(g1Words.has(word), `fresh profile should only see lesson 1 words, got "${word}"`));

const freshStandard = normalizeCq({ track: 'standard' });
assert.strictEqual(itemsFor('lessonWords', freshStandard, LESSONS, makeRng(4)).length, 15, 'standard lesson words session length');

const progressCq = normalizeCq({ track: 'guided', lessons: { g2: { startedAt: iso } } });
const progressWords = itemsFor('lessonWords', progressCq, LESSONS, makeRng(5));
const passedOrInProgressPool = new Set([...g1.typingWords, ...g2.typingWords]);
progressWords.forEach((word) => assert(passedOrInProgressPool.has(word), `word "${word}" should come from g1/g2 only`));
progressWords.forEach((word) => assert(!g3.typingWords.includes(word), `word "${word}" from g3 leaked in (not started)`));

// P5a-fix #1: a passed-but-chest-unopened lesson (phase 'key') must still count — startedAt is
// what matters, not cq.lessonsPassed (only written when the chest opens).
const keyPhaseCq = normalizeCq({ track: 'guided', lessons: { g2: passedState() } });
const keyPhaseWords = itemsFor('lessonWords', keyPhaseCq, LESSONS, makeRng(9));
const g1g2Pool = new Set([...g1.typingWords, ...g2.typingWords]);
keyPhaseWords.forEach((word) => assert(g1g2Pool.has(word), `word "${word}" should come from g1/g2 (g2 passed, phase key)`));
assert(g2.typingWords.some((word) => keyPhaseWords.includes(word)), 'g2 words are actually included once g2 has passedAt');
// g3 was never started -> excluded even though it comes right after g2 in the track
assert(g3.typingWords.every((word) => !keyPhaseWords.includes(word)), 'g3 (not started) must not leak in');
// standard-track lessons never count for a guided-track profile, even if "passed" there
const crossTrackCq = normalizeCq({ track: 'guided', lessons: { g2: passedState(), s2: passedState() } });
const crossTrackWords = itemsFor('lessonWords', crossTrackCq, LESSONS, makeRng(10));
assert(s2.typingWords.every((word) => !crossTrackWords.includes(word)), "other track's lessons never count");

// ---------- content: itemsFor — Sentences, lock/unlock ----------
// P5a-fix #1: unlock tracks lesson 2's passedAt directly, not cq.lessonsPassed (chest-open only).
assert.strictEqual(sentencesUnlocked(normalizeCq({ track: 'guided' })), false);
assert.strictEqual(sentencesUnlocked(normalizeCq({ track: 'guided', lessons: { g2: { startedAt: iso } } })), false, 'in-progress (no passedAt) does not unlock');
assert.strictEqual(sentencesUnlocked(normalizeCq({ track: 'guided', lessons: { g2: passedState() } })), true, 'passed at phase key (chest still unopened) unlocks');
assert.deepStrictEqual(itemsFor('sentences', normalizeCq({ track: 'guided' }), LESSONS, makeRng(6)), [], 'locked sentences mode yields no items');

const unlockedGuided = normalizeCq({ track: 'guided', lessons: { g2: passedState() } });
const guidedSentenceItems = itemsFor('sentences', unlockedGuided, LESSONS, makeRng(7));
assert.strictEqual(guidedSentenceItems.length, 4);
guidedSentenceItems.forEach((sentence) => assert(GUIDED_SENTENCES.includes(sentence)));
assert.strictEqual(new Set(guidedSentenceItems).size, guidedSentenceItems.length, 'no repeats within a sentence session');

const unlockedStandard = normalizeCq({ track: 'standard', lessons: { s2: passedState() } });
assert.strictEqual(itemsFor('sentences', unlockedStandard, LESSONS, makeRng(8)).length, 6);

// ---------- content: determinism with a seeded rng ----------
assert.deepStrictEqual(
  itemsFor('lessonWords', freshGuided, LESSONS, makeRng(42)),
  itemsFor('lessonWords', freshGuided, LESSONS, makeRng(42)),
);
assert.deepStrictEqual(
  itemsFor('sentences', unlockedGuided, LESSONS, makeRng(42)),
  itemsFor('sentences', unlockedGuided, LESSONS, makeRng(42)),
);

// ---------- content: sessionText ----------
assert.strictEqual(sessionText(['ask', 'dad']), 'ask dad');
assert.strictEqual(sessionText([]), '');
assert.strictEqual(sessionText(null), '');

// ---------- engine: createSession ----------
let session = createSession({ mode: 'homeRow', items: ['ask', 'dad'] });
assert.strictEqual(session.text, 'ask dad');
assert.strictEqual(session.index, 0);
assert.strictEqual(session.startedAt, null);
assert.strictEqual(session.endedAt, null);
assert.deepStrictEqual(session.errorAt, {});

// ---------- engine: correct / wrong / index does not advance / errorAt tally ----------
let step = pressKey(session, 'a', 1000);
assert.strictEqual(step.result, 'correct');
assert.strictEqual(step.state.index, 1);
assert.strictEqual(step.state.correct, 1);
assert.strictEqual(step.state.streak, 1);
assert.strictEqual(step.state.startedAt, 1000, 'first counted key sets startedAt');
session = step.state;

step = pressKey(session, 'x', 1100); // expected 's' — wrong
assert.strictEqual(step.result, 'wrong');
assert.strictEqual(step.state.index, 1, 'index does not advance on a wrong key');
assert.strictEqual(step.state.errors, 1);
assert.deepStrictEqual(step.state.errorAt, { 1: 1 });
assert.strictEqual(step.state.streak, 0);
assert.strictEqual(step.state.startedAt, 1000, 'startedAt unchanged once set');
session = step.state;

step = pressKey(session, 'z', 1150); // still wrong at the same index
assert.deepStrictEqual(step.state.errorAt, { 1: 2 }, 'errorAt tallies repeated wrong keys at the same index');
session = step.state;

// ---------- engine: ignored keys leave state untouched (reference-equal) ----------
['Shift', 'Enter', 'Backspace', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Escape', 'Control', 'ab', ''].forEach((key) => {
  const before = session;
  const result = pressKey(session, key, 1200);
  assert.strictEqual(result.result, 'ignored', `"${key}" must be ignored`);
  assert.strictEqual(result.state, before, `"${key}" must not change state`);
});

// ---------- engine: capitals are case-sensitive ----------
let capsSession = createSession({ items: ['I can.'] });
let wrongCase = pressKey(capsSession, 'i', 10);
assert.strictEqual(wrongCase.result, 'wrong', 'lowercase i does not match required capital I');
let rightCase = pressKey(capsSession, 'I', 10);
assert.strictEqual(rightCase.result, 'correct');

// ---------- engine: Space, multi-item text, and endedAt on completion ----------
let spaceSession = createSession({ items: ['ab', 'cd'] }); // text: "ab cd"
[['a', 'correct'], ['b', 'correct'], [' ', 'correct'], ['c', 'correct'], ['d', 'correct']].forEach(([key, expected], idx) => {
  const result = pressKey(spaceSession, key, 100 + idx);
  assert.strictEqual(result.result, expected, `key "${key}"`);
  spaceSession = result.state;
});
assert.strictEqual(spaceSession.index, 5);
assert.strictEqual(spaceSession.endedAt, 104, 'endedAt set on the final correct key');
assert.strictEqual(pressKey(spaceSession, 'a', 200).result, 'ignored', 'nothing left to type once finished');

// ---------- engine: a wrong key on the last character does not end the session ----------
let lastCharSession = createSession({ items: ['a'] });
let wrongLast = pressKey(lastCharSession, 'b', 1);
assert.strictEqual(wrongLast.result, 'wrong');
assert.strictEqual(wrongLast.state.endedAt, null);
let rightLast = pressKey(wrongLast.state, 'a', 2);
assert.strictEqual(rightLast.result, 'correct');
assert.strictEqual(rightLast.state.endedAt, 2);

// ---------- engine: P5a-fix #7 — non-finite `now` on the first counted key doesn't shift timing ----------
let flakySession = createSession({ items: ['ab'] });
let flakyFirst = pressKey(flakySession, 'a', NaN);
assert.strictEqual(flakyFirst.result, 'correct');
assert.strictEqual(flakyFirst.state.startedAt, 0, 'non-finite now on the first counted key falls back to 0, not left null');
let flakySecond = pressKey(flakyFirst.state, 'b', 999999);
assert.strictEqual(flakySecond.result, 'correct');
assert.strictEqual(flakySecond.state.startedAt, 0, 'a later valid now must not retroactively become the start');
assert.strictEqual(flakySecond.state.endedAt, 999999);
let flakyEnd = pressKey(createSession({ items: ['a'] }), 'a', undefined);
assert.strictEqual(flakyEnd.state.startedAt, 0);
assert.strictEqual(flakyEnd.state.endedAt, 0, 'completing key with non-finite now also falls back to 0');

// ---------- engine: metrics — wpm floored at 0.25 minutes ----------
const tinyMetrics = metrics({
  text: 'abcde', index: 5, correct: 5, errors: 0, errorAt: {}, startedAt: 0, endedAt: 1000, streak: 5, bestStreak: 5,
});
assert.strictEqual(tinyMetrics.wpm, 4, '(5/5) / 0.25-minute floor = 4 wpm even though real elapsed time was much shorter');
assert.strictEqual(tinyMetrics.ms, 1000);
assert.strictEqual(tinyMetrics.chars, 5);

// ---------- engine: metrics — accuracy rounding ----------
const accMetrics = metrics({
  text: 'abc', index: 3, correct: 2, errors: 1, errorAt: { 0: 1 }, startedAt: 0, endedAt: 60000, streak: 0, bestStreak: 1,
});
assert.strictEqual(accMetrics.accuracy, 67, 'round(2/3 * 100)');

// no keys pressed at all: no divide-by-zero
const emptyMetrics = metrics({
  text: 'abc', index: 0, correct: 0, errors: 0, errorAt: {}, startedAt: null, endedAt: null, streak: 0, bestStreak: 0,
});
assert.strictEqual(emptyMetrics.accuracy, 0);
assert.strictEqual(emptyMetrics.wpm, 0);

// ---------- engine: metrics — missedKeys top 3, aggregated by character across indices ----------
const missedState = {
  text: 'aabbccdd', index: 8, correct: 8, errors: 12, errorAt: { 0: 1, 1: 3, 2: 2, 4: 5, 5: 1 },
  startedAt: 0, endedAt: 60000, streak: 0, bestStreak: 0,
}; // a: idx0+idx1 = 1+3 = 4 · b: idx2 = 2 · c: idx4+idx5 = 5+1 = 6 · d: no errors
assert.deepStrictEqual(metrics(missedState).missedKeys, ['c', 'a', 'b']);

// ---------- engine: sessionScore — only 90%+ counts ----------
assert.strictEqual(sessionScore({ wpm: 20, accuracy: 89 }), 0);
assert.strictEqual(sessionScore({ wpm: 20, accuracy: 90 }), 20);
assert.strictEqual(sessionScore(null), 0);

// ---------- storage: emptyTyping ----------
assert.deepStrictEqual(emptyTyping(), { best: { homeRow: null, lessonWords: null, sentences: null }, sessions: [], bestGemDays: [] });

// ---------- storage: normalizeTyping — hostile input ----------
const hostile = normalizeTyping({
  __proto__: { sessions: [{ at: iso, mode: 'homeRow', wpm: 999, accuracy: 999, ms: 1, chars: 1 }] },
  best: {
    homeRow: { wpm: 500, accuracy: 150, at: iso }, // out-of-range finite: clamped, kept
    lessonWords: { wpm: NaN, accuracy: 90, at: iso }, // wrong type: whole record dropped
    nope: { wpm: 1, accuracy: 1, at: iso }, // unknown mode: ignored
  },
  sessions: Array.from({ length: 30 }, (_, i) => ({ at: iso, mode: 'homeRow', wpm: i, accuracy: 90, ms: 0, chars: 0 })),
  bestGemDays: [],
});
assert.strictEqual(hostile.sessions.length, 20, 'sessions capped at 20');
assert.deepStrictEqual(Object.keys(hostile.best), ['homeRow', 'lessonWords', 'sentences'], 'only known modes, no __proto__/nope leakage');
assert.strictEqual(hostile.best.homeRow.wpm, 200, 'wpm clamped to 200');
assert.strictEqual(hostile.best.homeRow.accuracy, 100, 'accuracy clamped to 100');
assert.strictEqual(hostile.best.lessonWords, null, 'NaN wpm drops the whole best record');
assert.strictEqual(hostile.best.sentences, null);
assert.strictEqual(normalizeTyping({ sessions: [{ at: iso, mode: 'bogus', wpm: 1, accuracy: 1, ms: 1, chars: 1 }] }).sessions.length, 0, 'unknown mode session dropped');

// P5a-fix #5: strict ISO validation — Date.parse alone is too lenient for non-ISO strings like "1".
assert.strictEqual(normalizeTyping({ best: { homeRow: { wpm: 1, accuracy: 1, at: '1' } } }).best.homeRow, null, 'at: "1" is rejected');
assert.strictEqual(normalizeTyping({ sessions: [{ at: '1', mode: 'homeRow', wpm: 1, accuracy: 1, ms: 1, chars: 1 }] }).sessions.length, 0, 'session at: "1" is rejected');
assert.strictEqual(normalizeTyping({ best: { homeRow: { wpm: 1, accuracy: 1, at: iso } } }).best.homeRow.at, iso, 'a real ISO timestamp still passes');
assert.strictEqual(normalizeTyping({ best: { homeRow: { wpm: 1, accuracy: 1, at: 'not-a-date' } } }).best.homeRow, null, 'bad at drops the record');
assert.deepStrictEqual(normalizeTyping('nope'), emptyTyping(), 'non-object input');
assert.deepStrictEqual(normalizeTyping(null), emptyTyping());

const manyDays = daysFrom('2026-01-01', 40);
const cappedDays = normalizeTyping({ bestGemDays: manyDays.concat(['nope', '2026-13-40', manyDays[0]]) }).bestGemDays;
assert.strictEqual(cappedDays.length, 30, 'bestGemDays capped at 30');
assert.deepStrictEqual(cappedDays, manyDays.slice(-30), 'keeps the most recent 30 days, invalid/duplicate days dropped');

// ---------- storage: old profile without typing -> emptyTyping ----------
const legacyCq = normalizeCq({ track: 'guided' });
assert.deepStrictEqual(legacyCq.typing, emptyTyping());

// ---------- storage: recordTypingSession — new best rules ----------
const cqBase = normalizeCq({ track: 'guided' });
let rec = recordTypingSession(cqBase, { mode: 'homeRow', wpm: 8, accuracy: 92, ms: 30000, chars: 40 }, iso, '2026-09-16');
assert.strictEqual(rec.newBest, true, 'first 90%+ session in a mode is always a new best');
assert.strictEqual(rec.gems, GEMS.typingBest);
assert.strictEqual(rec.cq.gems, GEMS.typingBest);
assert.deepStrictEqual(rec.cq.typing.best.homeRow, { wpm: 8, accuracy: 92, at: iso });
assert.strictEqual(rec.cq.typing.sessions.length, 1);

// same day, different mode -> new best there too, but gems paid only once per day
let rec2 = recordTypingSession(rec.cq, { mode: 'lessonWords', wpm: 6, accuracy: 95, ms: 30000, chars: 30 }, iso, '2026-09-16');
assert.strictEqual(rec2.newBest, true);
assert.strictEqual(rec2.gems, 0, 'gem already paid today, across modes');
assert.strictEqual(rec2.cq.gems, GEMS.typingBest, 'total gems unchanged');

// higher wpm beats the old best (new day: gem paid again)
let rec3 = recordTypingSession(rec2.cq, { mode: 'homeRow', wpm: 10, accuracy: 91, ms: 30000, chars: 40 }, iso, '2026-09-17');
assert.strictEqual(rec3.newBest, true);
assert.strictEqual(rec3.cq.typing.best.homeRow.wpm, 10);
assert.strictEqual(rec3.gems, GEMS.typingBest);

// equal wpm, higher accuracy -> new best
let rec4 = recordTypingSession(rec3.cq, { mode: 'homeRow', wpm: 10, accuracy: 96, ms: 30000, chars: 40 }, iso, '2026-09-18');
assert.strictEqual(rec4.newBest, true);
assert.strictEqual(rec4.cq.typing.best.homeRow.accuracy, 96);

// equal wpm, equal accuracy -> not a new best
let rec5 = recordTypingSession(rec4.cq, { mode: 'homeRow', wpm: 10, accuracy: 96, ms: 30000, chars: 40 }, iso, '2026-09-19');
assert.strictEqual(rec5.newBest, false);
assert.strictEqual(rec5.gems, 0);

// lower wpm -> not a new best
let rec6 = recordTypingSession(rec5.cq, { mode: 'homeRow', wpm: 5, accuracy: 99, ms: 30000, chars: 40 }, iso, '2026-09-20');
assert.strictEqual(rec6.newBest, false);
assert.strictEqual(rec6.cq.typing.best.homeRow.wpm, 10, 'best unchanged');

// <90% accuracy never sets a best, even as the very first session
let rec7 = recordTypingSession(cqBase, { mode: 'sentences', wpm: 20, accuracy: 89, ms: 30000, chars: 100 }, iso, '2026-09-16');
assert.strictEqual(rec7.newBest, false);
assert.strictEqual(rec7.cq.typing.best.sentences, null);
assert.strictEqual(rec7.gems, 0);

// unknown mode -> no-op
let rec8 = recordTypingSession(cqBase, { mode: 'bogus', wpm: 20, accuracy: 99, ms: 1, chars: 1 }, iso, '2026-09-16');
assert.strictEqual(rec8.newBest, false);
assert.strictEqual(rec8.gems, 0);
assert.deepStrictEqual(rec8.cq.typing, cqBase.typing);

// ---------- storage: P5a-fix #2 — record path always returns clamped/normalized values ----------
let gemPaidCq = recordTypingSession(cqBase, { mode: 'homeRow', wpm: 8, accuracy: 92, ms: 1000, chars: 10 }, iso, '2026-09-21').cq;
let clampRec = recordTypingSession(gemPaidCq, { mode: 'homeRow', wpm: 500.123, accuracy: 99.7, ms: -4, chars: 1e9 }, iso, '2026-09-21');
assert.strictEqual(clampRec.newBest, true, 'still a legitimate new best (99.7% >= 90, far higher wpm)');
assert.strictEqual(clampRec.gems, 0, "today's gem was already paid");
assert.deepStrictEqual(clampRec.cq.typing.best.homeRow, { wpm: 200, accuracy: 100, at: iso }, 'best stored clamped: wpm<=200, accuracy<=100');
const clampedSession = clampRec.cq.typing.sessions[clampRec.cq.typing.sessions.length - 1];
assert.deepStrictEqual(clampedSession, { at: iso, mode: 'homeRow', wpm: 200, accuracy: 100, ms: 0, chars: 10000 }, 'session stored clamped: ms>=0, chars<=10000');
assert.deepStrictEqual(clampRec.cq, normalizeCq(clampRec.cq), 'returned cq is already fully normalized (idempotent)');

// ---------- storage: P5a-fix #3 — new-best comparison uses the rounded/clamped values ----------
let roundedBase = recordTypingSession(cqBase, { mode: 'lessonWords', wpm: 12.3, accuracy: 95, ms: 30000, chars: 60 }, iso, '2026-09-22').cq;
let roundedWpmAttempt = recordTypingSession(roundedBase, { mode: 'lessonWords', wpm: 12.34, accuracy: 95, ms: 30000, chars: 60 }, iso, '2026-09-22');
assert.strictEqual(roundedWpmAttempt.newBest, false, '12.34 rounds to 12.3, ties the stored 12.3 best, no higher accuracy');
let roundedAccAttempt = recordTypingSession(roundedBase, { mode: 'lessonWords', wpm: 12.3, accuracy: 95.4, ms: 30000, chars: 60 }, iso, '2026-09-22');
assert.strictEqual(roundedAccAttempt.newBest, false, '95.4 rounds to 95, ties the stored accuracy, no new best');

// ---------- storage: P5a-fix #4 — gem-day skew: a day older than the oldest kept day never pays ----------
const fullGemDays = daysFrom('2026-02-01', 30);
const staleDayCq = normalizeCq({ track: 'guided', typing: { bestGemDays: fullGemDays } });
const staleDay = '2026-01-15'; // older than fullGemDays[0] ('2026-02-01')
const staleRec = recordTypingSession(staleDayCq, { mode: 'homeRow', wpm: 8, accuracy: 92, ms: 1000, chars: 10 }, iso, staleDay);
assert.strictEqual(staleRec.newBest, true, 'still a legitimate new best score-wise');
assert.strictEqual(staleRec.gems, 0, 'stale day (older than the oldest kept, list already full): gem not paid');
assert.deepStrictEqual(staleRec.cq.typing.bestGemDays, fullGemDays, 'stale day is not recorded either, so it cannot be replayed for a free gem later');
// a day within/after the kept window still pays normally
const freshDayRec = recordTypingSession(staleDayCq, { mode: 'homeRow', wpm: 8, accuracy: 92, ms: 1000, chars: 10 }, iso, '2026-03-05');
assert.strictEqual(freshDayRec.gems, GEMS.typingBest);

// ---------- storage: P5a-fix #5 — recordTypingSession also enforces strict ISO for nowIso ----------
const badNowIsoRec = recordTypingSession(cqBase, { mode: 'homeRow', wpm: 5, accuracy: 91, ms: 1000, chars: 10 }, '1', '2026-09-23');
const storedAt = badNowIsoRec.cq.typing.sessions[badNowIsoRec.cq.typing.sessions.length - 1].at;
assert.notStrictEqual(storedAt, '1', 'invalid ISO nowIso falls back to a real timestamp, not stored verbatim');
assert(Number.isFinite(Date.parse(storedAt)));

// ---------- storage: recordTypingSession — immutability ----------
const frozenCq = deepFreeze(normalizeCq({ track: 'guided' }));
const before = JSON.stringify(frozenCq);
recordTypingSession(frozenCq, { mode: 'homeRow', wpm: 8, accuracy: 92, ms: 1000, chars: 10 }, iso, '2026-09-16');
assert.strictEqual(JSON.stringify(frozenCq), before, 'input cq is never mutated');

// ---------- report: exact typing line (docs/computer-quest/typing.md §7) ----------
const reportedCq = normalizeCq({
  track: 'guided',
  typing: {
    best: { homeRow: { wpm: 9.5, accuracy: 94, at: iso }, lessonWords: { wpm: 7, accuracy: 91, at: iso }, sentences: null },
    sessions: Array.from({ length: 12 }, () => ({ at: iso, mode: 'homeRow', wpm: 5, accuracy: 90, ms: 1000, chars: 10 })),
    bestGemDays: [],
  },
});
const typingLine = profileReport({ name: 'Max', cq: reportedCq }, LESSONS, '2026-09-16').split('\n')[1];
assert.strictEqual(typingLine, 'Typing best: Home Row 9.5 WPM @ 94% · Lesson Words 7 WPM @ 91% · Sentences — · 12 sessions');

const noTypingCq = normalizeCq({ track: 'guided' });
const emptyLine = profileReport({ name: 'Max', cq: noTypingCq }, LESSONS, '2026-09-16').split('\n')[1];
assert.strictEqual(emptyLine, 'Typing best: Home Row — · Lesson Words — · Sentences — · 0 sessions');

const roundWpmCq = normalizeCq({
  track: 'guided',
  typing: { best: { homeRow: { wpm: 10, accuracy: 100, at: iso }, lessonWords: null, sentences: null }, sessions: [], bestGemDays: [] },
});
const roundLine = profileReport({ name: 'Max', cq: roundWpmCq }, LESSONS, '2026-09-16').split('\n')[1];
assert.strictEqual(roundLine, 'Typing best: Home Row 10 WPM @ 100% · Lesson Words — · Sentences — · 0 sessions', 'trailing .0 dropped');

// ---------- report: P5a-fix #6 — singular "1 session", and raw/partial cq.typing tolerated ----------
const oneSessionCq = normalizeCq({
  track: 'guided',
  typing: { best: { homeRow: null, lessonWords: null, sentences: null }, sessions: [{ at: iso, mode: 'homeRow', wpm: 5, accuracy: 90, ms: 1000, chars: 10 }], bestGemDays: [] },
});
const oneSessionLine = profileReport({ name: 'Max', cq: oneSessionCq }, LESSONS, '2026-09-16').split('\n')[1];
assert.strictEqual(oneSessionLine, 'Typing best: Home Row — · Lesson Words — · Sentences — · 1 session', 'singular "session"');

// profile.cq.typing here is raw/partial (missing sessions/bestGemDays, never ran through normalizeCq at all)
const rawPartialProfile = { name: 'Max', cq: { track: 'guided', typing: { best: { homeRow: { wpm: 5, accuracy: 91, at: iso } } } } };
const rawPartialLine = profileReport(rawPartialProfile, LESSONS, '2026-09-16').split('\n')[1];
assert.strictEqual(rawPartialLine, 'Typing best: Home Row 5 WPM @ 91% · Lesson Words — · Sentences — · 0 sessions', 'raw/partial cq.typing still formats correctly');

console.log('ok — Computer Quest typing dojo pass');

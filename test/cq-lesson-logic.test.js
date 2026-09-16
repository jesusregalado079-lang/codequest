import assert from 'node:assert';
import {
  addActiveMs, completePractice, emptyLessonState, familyReport, isUnlocked, lessonReport, lessonStatus,
  missionStepDone, normalizeLessons, openChest, profileReport, quizQuestionsToAsk, recordBattle, recordChestAnswer,
  recordParentCheck, recordQuizAttempt, recordSpotIt, recordWarmup, setPosition, setWindows, startLesson, tickMission,
} from '../src/cq/lesson-logic.js';
import { battleGems, normalizeCq } from '../src/cq/character.js';
import { LESSONS } from '../src/cq/lessons/pack1.js';

const iso = '2026-09-16T12:00:00.000Z';
const g1 = LESSONS.find((lesson) => lesson.id === 'g1');
const g2 = LESSONS.find((lesson) => lesson.id === 'g2');
const g3 = LESSONS.find((lesson) => lesson.id === 'g3');
const g4 = LESSONS.find((lesson) => lesson.id === 'g4');
const g5 = LESSONS.find((lesson) => lesson.id === 'g5');
const s1 = LESSONS.find((lesson) => lesson.id === 's1');
const lessons = [g1, g2, g3, g5, s1];
const base = (track = 'guided') => normalizeCq({ track });

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.keys(value).forEach((key) => deepFreeze(value[key]));
  return Object.freeze(value);
}

function assertImmutable(cq, change) {
  const before = JSON.stringify(cq);
  const result = change(deepFreeze(cq));
  assert.strictEqual(JSON.stringify(cq), before);
  return result;
}

function passedState() {
  return { ...emptyLessonState(), startedAt: iso, quizPassedAt: iso, passedAt: iso, phase: 'key' };
}

const hostile = normalizeLessons({
  __proto__: { g1: { phase: 'done' } },
  g1: { phase: 'bad', activeMs: NaN, warmup: [{ q: 0, choice: 0, correct: true }, {}], parent: { note: 'x'.repeat(501) }, practiceDays: ['2026-09-17', 'no', '2026-09-16', '2026-09-16'], battle: {} },
  nope: emptyLessonState(),
});
assert.deepStrictEqual(Object.keys(hostile), ['g1']);
assert.strictEqual(hostile.g1.phase, 'warmup');
assert.strictEqual(hostile.g1.activeMs, 0);
assert.strictEqual(hostile.g1.warmup.length, 1);
assert.strictEqual(hostile.g1.parent.note.length, 500);
assert.deepStrictEqual(hostile.g1.practiceDays, ['2026-09-16', '2026-09-17']);
assert.strictEqual(hostile.g1.battle, null);
assert.strictEqual(normalizeLessons({ g1: { passedAt: iso } }).g1.passedAt, null);
assert.deepStrictEqual(normalizeLessons({ g1: { chest: { openedAt: iso } } }).g1.chest, emptyLessonState().chest);
assert.strictEqual(normalizeLessons({ g1: { phase: 'done' } }).g1.phase, 'warmup');
assert.strictEqual(normalizeLessons({ g1: { quizPassedAt: iso, phase: 'warmup' } }).g1.phase, 'parent');
assert.strictEqual(normalizeLessons({ g1: { quizPassedAt: iso, passedAt: iso, phase: 'done' } }).g1.phase, 'chest');

// P6b: strict dates — Date.parse silently rolls impossible calendar dates/times over into a real
// one (Feb 30 -> Mar 2, hour 24 -> next day), which must not be accepted as a startedAt/passedAt/
// quizPassedAt timestamp or a practiceDays entry.
['2026-02-30T00:00:00.000Z', '2026-04-31T00:00:00.000Z', '2025-02-29T00:00:00.000Z', '2026-09-16T24:00:00.000Z'].forEach((bad) => {
  assert.strictEqual(normalizeLessons({ g1: { startedAt: bad } }).g1.startedAt, null, `startedAt rejects ${bad}`);
});
['2026-02-28T00:00:00.000Z', '2024-02-29T00:00:00.000Z', '2026-04-30T00:00:00.000Z'].forEach((good) => {
  assert.strictEqual(normalizeLessons({ g1: { startedAt: good } }).g1.startedAt, good, `startedAt accepts ${good}`);
});
assert.deepStrictEqual(normalizeLessons({ g1: { practiceDays: ['2026-02-30', '2026-04-31', '2025-02-29', '2024-02-29', '2026-02-28'] } }).g1.practiceDays,
  ['2024-02-29', '2026-02-28'], 'practiceDays keeps only real calendar dates, leap day only in a leap year');

// chestProgress: booleans, capped at 10 (the lesson's real chest length isn't known at normalize time).
const chestNorm = normalizeLessons({ g1: { chestProgress: [true, 'x', false, 1, null, true, true, true, true, true, true, true] } }).g1.chestProgress;
assert.deepStrictEqual(chestNorm, [true, false, false, false, false, true, true, true, true, true]);
assert.strictEqual(chestNorm.length, 10);
assert.deepStrictEqual(normalizeLessons({ g1: { chestProgress: 'nope' } }).g1.chestProgress, []);

// battle: kept only when passedAt is set. Decision 2026-09-16 (docs/computer-quest/battle.md §7): wrong
// TYPES (non-ISO playedAt, unknown outcome, non-finite/non-number counts) drop the whole record;
// out-of-range or non-integer FINITE counts are clamped/floored and the record is kept.
const validBattle = { playedAt: iso, ms: 90000, poofs: 12, outcome: 'victory', gems: 3 };
assert.deepStrictEqual(normalizeLessons({ g1: { ...passedState(), battle: validBattle } }).g1.battle, validBattle);
assert.strictEqual(normalizeLessons({ g1: { battle: validBattle } }).g1.battle, null, 'battle without passedAt is dropped');
[
  { ...validBattle, playedAt: 'nope' }, { ...validBattle, playedAt: 5 }, { ...validBattle, playedAt: '2026-02-30T00:00:00.000Z' }, { ...validBattle, outcome: 'lose' },
  { ...validBattle, outcome: undefined }, { ...validBattle, ms: NaN }, { ...validBattle, ms: '5' }, { ...validBattle, ms: Infinity },
  { ...validBattle, poofs: NaN }, { ...validBattle, poofs: null }, { ...validBattle, poofs: '3' },
  { ...validBattle, gems: NaN }, { ...validBattle, gems: undefined }, { ...validBattle, gems: [3] },
].forEach((bad) => assert.strictEqual(normalizeLessons({ g1: { ...passedState(), battle: bad } }).g1.battle, null, `wrong-type battle field dropped: ${JSON.stringify(bad)}`));
[
  [{ ...validBattle, ms: -1 }, { ms: 0 }], [{ ...validBattle, ms: 600001 }, { ms: 600000 }], [{ ...validBattle, ms: 1.5 }, { ms: 1 }],
  [{ ...validBattle, poofs: 501 }, { poofs: 500 }], [{ ...validBattle, poofs: -1 }, { poofs: 0 }], [{ ...validBattle, poofs: 1.9 }, { poofs: 1 }],
  [{ ...validBattle, gems: 11 }, { gems: 10 }], [{ ...validBattle, gems: -1 }, { gems: 0 }], [{ ...validBattle, gems: 1.5 }, { gems: 1 }],
].forEach(([bad, expect]) => assert.deepStrictEqual(normalizeLessons({ g1: { ...passedState(), battle: bad } }).g1.battle,
  { ...validBattle, ...expect }, `out-of-range/non-integer finite battle field clamped and kept: ${JSON.stringify(bad)}`));
assert.deepStrictEqual(normalizeLessons({ g1: { ...passedState(), battle: { ...validBattle, ms: 0, poofs: 0, gems: 0, outcome: 'skipped' } } }).g1.battle,
  { playedAt: iso, ms: 0, poofs: 0, outcome: 'skipped', gems: 0 });

let cq = startLesson(base(), g1, iso);
assert.strictEqual(lessonStatus(cq, g1), 'in-progress');
assert.strictEqual(lessonStatus(cq, g2), 'locked');
assert.strictEqual(lessonStatus(base(), g1), 'ready');
assert(isUnlocked(cq, g1, [g1, g2]));
assert.throws(() => startLesson(cq, g2, iso), /locked/);
assert.throws(() => startLesson(cq, s1, iso), /wrong track/);
assert.throws(() => setPosition(cq, 'g1', 'quiz', 0), /skip/);
assert.throws(() => setPosition(cq, 'g1', 'learn', 0), /warm-up/);
assert.throws(() => setPosition(base(), 'g3', 'quiz', 0), /locked/);
assert.throws(() => recordQuizAttempt(base(), g3, [], iso), /locked/);
assert.throws(() => recordParentCheck(base(), g3, g3.parentChecks.map(() => true), '', iso), /locked/);
assert.throws(() => openChest(base(), g3, [], iso, () => 0), /locked/);
assert.throws(() => recordQuizAttempt(base(), g1, g1.quiz.map((question, q) => ({ q, choice: question.answer })), iso), /^Error: not at quiz yet$/);
const parentPhaseCq = normalizeCq({ track: 'guided', lessons: { g1: { ...emptyLessonState(), quizPassedAt: iso, phase: 'parent' } } });
assert.throws(() => openChest(parentPhaseCq, g1, [], iso, () => 0), /^Error: not at chest yet$/);
const quizPhaseCq = normalizeCq({ track: 'guided', lessons: { g1: { ...emptyLessonState(), phase: 'quiz' } } });
assert.throws(() => recordParentCheck(quizPhaseCq, g1, g1.parentChecks.map(() => true), '', iso), /^Error: not at parent check yet$/);
assert.throws(() => setPosition(normalizeCq({ track: 'guided', lessons: { g1: { phase: 'quiz' } } }), 'g1', 'parent', 0), /quiz/);
assert.throws(() => setPosition(normalizeCq({ track: 'guided', lessons: { g1: { quizPassedAt: iso, phase: 'parent' } } }), 'g1', 'key', 0), /parent check/);
const chestGuard = normalizeCq({ track: 'guided', lessons: { g1: passedState() } });
assert.strictEqual(setPosition(chestGuard, 'g1', 'chest', 0).lessons.g1.phase, 'chest');
assert.throws(() => setPosition({ ...chestGuard, lessons: { ...chestGuard.lessons, g1: { ...chestGuard.lessons.g1, phase: 'chest' } } }, 'g1', 'done', 0), /unopened/);

cq = assertImmutable(cq, (frozen) => recordWarmup(frozen, g1, g1.warmup.map((_, q) => ({ q, choice: 0 }))));
const once = recordWarmup(cq, g1, [{ q: 0, choice: 1 }]);
assert.deepStrictEqual(once.lessons.g1.warmup, cq.lessons.g1.warmup);
cq = setPosition(cq, 'g1', 'learn', 0);
cq = setPosition(cq, 'g1', 'mission', 0);
assert.throws(() => setPosition(cq, 'g1', 'quiz', 0), /mission/);
for (let step = 0; step < g1.mission.length - 1; step += 1) cq = tickMission(cq, g1, step, true);
assert.throws(() => tickMission(cq, g1, g1.mission.length - 1, true), /another way/);
assert.throws(() => setPosition({ ...cq, lessons: { ...cq.lessons, g1: { ...cq.lessons.g1, mission: [true] } } }, 'g1', 'quiz', 0), /mission/);
cq = setWindows(cq, '11');
assert(missionStepDone(cq, g1, g1.mission.length - 1));
cq = setPosition(cq, 'g1', 'quiz', 0);
assert.deepStrictEqual(quizQuestionsToAsk(cq, g1), [0, 1, 2, 3, 4]);

const wrongStoredAnswers = g1.quiz.map((question, q) => ({ q, choice: question.answer === 0 ? 1 : 0, correct: true }));
const tamperedAttempts = normalizeCq({ track: 'guided', lessons: { g1: {
  ...emptyLessonState(), phase: 'quiz', quizAttempts: [{ at: iso, answers: wrongStoredAnswers }],
} } });
assert.deepStrictEqual(quizQuestionsToAsk(tamperedAttempts, g1), [0, 1, 2, 3, 4]);
assert.strictEqual(recordQuizAttempt(tamperedAttempts, g1, [], iso).lessons.g1.quizPassedAt, null);
const invalidThenValid = recordQuizAttempt(quizPhaseCq, g1, [{ q: 0, choice: 99 }, { q: 0, choice: g1.quiz[0].answer }], iso);
assert.deepStrictEqual(invalidThenValid.lessons.g1.quizAttempts[0].answers, [{ q: 0, choice: g1.quiz[0].answer, correct: true }]);

const everyChoice = g1.quiz.flatMap((question, q) => question.choices.map((_, choice) => ({ q, choice })));
cq = recordQuizAttempt(cq, g1, everyChoice, iso);
assert.strictEqual(cq.lessons.g1.quizAttempts[0].answers.length, g1.quiz.length);
assert(cq.lessons.g1.quizAttempts[0].answers.every((answer, index, answers) => answers.findIndex((item) => item.q === answer.q) === index));
assert.strictEqual(cq.lessons.g1.quizPassedAt, null);
assert.deepStrictEqual(quizQuestionsToAsk(cq, g1), [0, 4]);
cq = recordQuizAttempt(cq, g1, [{ q: 0, choice: 1 }, { q: 4, choice: 1 }, { q: 1, choice: 0 }], iso);
assert(cq.lessons.g1.quizPassedAt);
assert.strictEqual(cq.lessons.g1.quizAttempts[1].answers.length, 2);
assert.strictEqual(cq.lessons.g1.phase, 'parent');
assert.throws(() => setPosition(cq, 'g1', 'key', 0), /parent check/);
assert.throws(() => recordParentCheck(cq, g1, [true], '', iso), /length/);
cq = recordParentCheck(cq, g1, [true, false, true, true], 'not yet', iso);
assert.strictEqual(lessonStatus(cq, g1), 'not-yet');
cq = recordParentCheck(cq, g1, g1.parentChecks.map(() => true), 'done', iso);
assert.strictEqual(lessonStatus(cq, g1), 'passed');
assert.throws(() => recordParentCheck(cq, g1, [true, false, true, true], 'late', iso), /not at parent check yet/);
assert.throws(() => setPosition(cq, 'g1', 'mission', 0), /earlier/);
const opened = openChest(cq, g1, [true, false], iso, () => 0);
cq = opened.cq;
assert.deepStrictEqual(opened.loot.item, 'start-blade');
assert.strictEqual(opened.loot.gems, 25);
assert.strictEqual(cq.lessons.g1.chest.openedAt, iso);
assert.strictEqual(cq.lessons.g1.phase, 'done');
assert.strictEqual(lessonStatus(cq, g1), 'done');
assert.throws(() => openChest(cq, g1, [true, true], iso, () => 0), /not at chest yet/);
let practiced = completePractice(cq, g1, '2026-09-16');
assert.strictEqual(practiced.gems, 10);
practiced = completePractice(practiced.cq, g1, '2026-09-16');
assert.strictEqual(practiced.gems, 0);
assert.strictEqual(addActiveMs(cq, 'g1', 999999).lessons.g1.activeMs, 300000);

// ---------- chest answer persistence (b8: a wrong-then-reload must not restore a clean first try) ----------
const chestReady = normalizeCq({ track: 'guided', lessons: { g1: { ...passedState(), phase: 'chest' } } });
assert.throws(() => recordChestAnswer(base(), g3, 0, true), /locked/);
assert.throws(() => recordChestAnswer(cq, s1, 0, true), /wrong track/);
const battleReady = normalizeCq({ track: 'guided', lessons: { g1: passedState() } }); // phase 'key', not 'chest'
assert.throws(() => recordChestAnswer(battleReady, g1, 0, true), /not at chest yet/);
assert.throws(() => recordChestAnswer(chestReady, g1, 1, true), /order/, 'index must equal the current progress length');
let chestCq = recordChestAnswer(chestReady, g1, 0, false);
assert.deepStrictEqual(chestCq.lessons.g1.chestProgress, [false]);
assert.throws(() => recordChestAnswer(chestCq, g1, 0, true), /order/, 'append only: cannot redo an already-recorded index');
chestCq = recordChestAnswer(chestCq, g1, 1, true);
assert.deepStrictEqual(chestCq.lessons.g1.chestProgress, [false, true]);
assert.strictEqual(chestCq.lessons.g1.chestProgress.length, g1.chest.length);
assert.throws(() => recordChestAnswer(chestCq, g1, 2, true), /out of range/,
  'cannot record past the lesson chest length, even though index equals the current (full) progress length');
assertImmutable(chestReady, (value) => recordChestAnswer(value, g1, 0, true));

// ---------- battle records (Phase 4 §7) ----------
assert.throws(() => recordBattle(base(), g3, { outcome: 'victory', poofs: 0, ms: 0 }, iso), /locked/);
assert.throws(() => recordBattle(cq, s1, { outcome: 'victory', poofs: 0, ms: 0 }, iso), /wrong track/);
const battleNotPassed = normalizeCq({ track: 'guided', lessons: { g1: { ...emptyLessonState(), startedAt: iso } } });
assert.throws(() => recordBattle(battleNotPassed, g1, { outcome: 'victory', poofs: 0, ms: 0 }, iso), /not passed/);
const battleWrongPhase = normalizeCq({ track: 'guided', lessons: { g1: chestReady.lessons.g1 } });
assert.throws(() => recordBattle(battleWrongPhase, g1, { outcome: 'victory', poofs: 0, ms: 0 }, iso), /key screen/);
assert.throws(() => recordBattle(battleReady, g1, { outcome: 'nope', poofs: 0, ms: 0 }, iso), /invalid battle outcome/);
assert.throws(() => recordBattle(battleReady, g1, {}, iso), /invalid battle outcome/);
const firstBattle = recordBattle(battleReady, g1, { outcome: 'victory', poofs: 27, ms: 125000 }, iso);
assert.strictEqual(firstBattle.gems, battleGems(27));
assert.deepStrictEqual(firstBattle.cq.lessons.g1.battle, { playedAt: iso, ms: 125000, poofs: 27, outcome: 'victory', gems: battleGems(27) });
assert.strictEqual(firstBattle.cq.gems, battleGems(27));
assert.strictEqual(firstBattle.cq.lessons.g1.phase, 'key', 'recordBattle does not change phase');
assert.throws(() => recordBattle(firstBattle.cq, g1, { outcome: 'victory', poofs: 5, ms: 1000 }, iso), /battle already recorded/);
const skippedBattle = recordBattle(battleReady, g1, { outcome: 'skipped', poofs: 999, ms: -50 }, iso);
assert.strictEqual(skippedBattle.gems, 0, 'skipped always earns 0 gems, regardless of poofs');
assert.strictEqual(skippedBattle.cq.lessons.g1.battle.gems, 0);
assert.strictEqual(skippedBattle.cq.lessons.g1.battle.ms, 0, 'ms clamped to the 0..600000 range');
assert.strictEqual(skippedBattle.cq.lessons.g1.battle.poofs, 500, 'poofs clamped to the 0..500 range');
const clampedBattle = recordBattle(battleReady, g1, { outcome: 'time', poofs: NaN, ms: 99999999 }, iso);
assert.strictEqual(clampedBattle.cq.lessons.g1.battle.poofs, 0);
assert.strictEqual(clampedBattle.cq.lessons.g1.battle.ms, 600000);
assert.strictEqual(clampedBattle.gems, battleGems(0));
assertImmutable(battleReady, (value) => recordBattle(value, g1, { outcome: 'fell', poofs: 8, ms: 30000 }, iso));

const spotLesson = { ...g1, mission: [{ kind: 'spotIt', cards: [{ answer: 'ok' }], pass: 1 }] };
assert.throws(() => tickMission(base(), spotLesson, 0, true), /another way/);
const unfrozen = base();
assertImmutable(unfrozen, (value) => startLesson(value, g1, iso));
assertImmutable(unfrozen, (value) => setPosition(value, 'g1', 'warmup', 0));
assertImmutable(unfrozen, (value) => recordWarmup(value, g1, []));
assertImmutable(unfrozen, (value) => tickMission(value, g1, 0, true));
assertImmutable(unfrozen, (value) => recordSpotIt(value, spotLesson, 0, [{ card: 0, pick: 'ok' }]));
assertImmutable(unfrozen, (value) => setWindows(value, '11'));
assertImmutable(quizPhaseCq, (value) => recordQuizAttempt(value, g1, [], iso));
const passedCq = normalizeCq({ track: 'guided', lessons: { g1: passedState() } });
const parentCq = normalizeCq({ track: 'guided', lessons: { g1: { ...emptyLessonState(), quizPassedAt: iso, phase: 'parent' } } });
assertImmutable(parentCq, (value) => recordParentCheck(value, g1, g1.parentChecks.map(() => false), '', iso));
assertImmutable(passedCq, (value) => openChest(value, g1, [], iso, () => 0));
assertImmutable(passedCq, (value) => completePractice(value, g1, '2026-09-16'));
assertImmutable(unfrozen, (value) => addActiveMs(value, 'g1', 1));

const reportCq = normalizeCq({ track: 'guided', windows: '11', lessons: {
  g1: {
    ...passedState(), warmup: [{ q: 0, choice: 0, correct: true }, { q: 1, choice: 0, correct: true }, { q: 2, choice: 0, correct: true }],
    quizAttempts: [{ at: iso, answers: [{ q: 4, choice: 0, correct: false }, { q: 3, choice: 0, correct: false }] }],
    chest: { openedAt: iso, firstTry: [true, false], cosmetic: null, gems: 25 }, activeMs: 90000,
    parent: { at: iso, checks: g1.parentChecks.map(() => true), note: '  Great\n job  ' },
  },
  g2: { ...emptyLessonState(), startedAt: iso, phase: 'mission', activeMs: 60000 },
  g3: { ...emptyLessonState(), startedAt: iso, quizPassedAt: iso, phase: 'parent', parent: { at: iso, checks: [true, false, false, false], note: '' } },
} });
assert.strictEqual(lessonReport({ name: 'Max', cq: reportCq }, g1, g2, '2026-09-16'), `Computer Quest — Max — 2026-09-16\nLesson G1 "Meet Your Computer" — PASSED\nWarm-up review: 3/3\nQuiz: try 1 = 0/2 (missed Q4, Q5) · passed\nReal task (parent-checked): 4/4\nChest questions first try: 1/2 (missed: "Where does the taskbar live?")\nTime: lesson 2 min · battle —\nPractice Missions done: 0 day(s)\nWindows: 11\nParent note: Great job\nNext up: G2 "Open, Switch, Close"`);
// Report battle time line: — (null), skipped, <1 min (0 < ms < 60000), else round(ms/60000).
const reportBattle = (battle) => normalizeCq({ ...reportCq, lessons: { ...reportCq.lessons, g1: { ...reportCq.lessons.g1, battle } } });
const battleLine = (cqWithBattle) => lessonReport({ name: 'Max', cq: cqWithBattle }, g1, g2, '2026-09-16').split('\n')[6];
assert.strictEqual(battleLine(reportBattle({ playedAt: iso, ms: 0, poofs: 0, outcome: 'skipped', gems: 0 })), 'Time: lesson 2 min · battle skipped');
assert.strictEqual(battleLine(reportBattle({ playedAt: iso, ms: 45000, poofs: 12, outcome: 'victory', gems: 4 })), 'Time: lesson 2 min · battle <1 min');
assert.strictEqual(battleLine(reportBattle({ playedAt: iso, ms: 59999, poofs: 12, outcome: 'time', gems: 4 })), 'Time: lesson 2 min · battle <1 min');
assert.strictEqual(battleLine(reportBattle({ playedAt: iso, ms: 60000, poofs: 12, outcome: 'fell', gems: 4 })), 'Time: lesson 2 min · battle 1 min');
assert.strictEqual(battleLine(reportBattle({ playedAt: iso, ms: 150000, poofs: 22, outcome: 'victory', gems: 8 })), 'Time: lesson 2 min · battle 3 min');
assert.strictEqual(lessonReport({ name: 'Max', cq: reportCq }, g2, g3, '2026-09-16'), `Computer Quest — Max — 2026-09-16\nLesson G2 "Open, Switch, Close" — IN PROGRESS: mission\nWarm-up review: —\nQuiz: —\nReal task (parent-checked): —\nChest questions first try: —\nTime: lesson 1 min · battle —\nPractice Missions done: 0 day(s)\nWindows: 11\nParent note: —\nNext up: G3 "Folders Are Containers"`);
const notYetCq = normalizeCq({ ...reportCq, lessons: { ...reportCq.lessons, g2: passedState() } });
assert.strictEqual(lessonReport({ name: 'Max', cq: notYetCq }, g3, null, '2026-09-16'), `Computer Quest — Max — 2026-09-16\nLesson G3 "Folders Are Containers" — NOT YET (parent check)\nWarm-up review: —\nQuiz: passed\nReal task (parent-checked): 1/3 — not yet: "Makes a folder named Rocks, spelled right, inside his own folder"\nChest questions first try: —\nTime: lesson 0 min · battle —\nPractice Missions done: 0 day(s)\nWindows: 11\nParent note: —\nNext up: —`);
const previousPassed = { ...passedState(), startedAt: null };
const completeProfile = { name: 'Max', cq: normalizeCq({ track: 'guided', lessonsPassed: ['g1', 'g2', 'g3', 'g4', 'g5'], lessons: { g1: previousPassed, g2: previousPassed, g3: previousPassed, g4: previousPassed, g5: { ...emptyLessonState(), startedAt: iso } } }) };
assert.strictEqual(profileReport(completeProfile, LESSONS, '2026-09-16'), `Computer Quest — Max — 2026-09-16\nTyping best: Home Row — · Lesson Words — · Sentences — · 0 sessions\nLesson G5 "Keyboard Keys and the STOP Rule" — IN PROGRESS: warmup\nWarm-up review: —\nQuiz: —\nReal task (parent-checked): —\nChest questions first try: —\nTime: lesson 0 min · battle —\nPractice Missions done: 0 day(s)\nWindows: —\nParent note: —\nNext up: Pack 1 complete!`);
const family = familyReport([{ name: 'No track', cq: normalizeCq({}) }, { name: 'Max', cq: reportCq }, { name: 'Ada', cq: reportCq }], lessons, '2026-09-16');
assert.strictEqual(family, `${profileReport({ name: 'Max', cq: reportCq }, lessons, '2026-09-16')}\n\n${profileReport({ name: 'Ada', cq: reportCq }, lessons, '2026-09-16')}`);

console.log('ok — Computer Quest lesson engine pass');

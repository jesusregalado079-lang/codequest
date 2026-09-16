import assert from 'node:assert';
import {
  addActiveMs, completePractice, emptyLessonState, familyReport, isUnlocked, lessonReport, lessonStatus,
  missionStepDone, normalizeLessons, openChest, profileReport, quizQuestionsToAsk, recordParentCheck,
  recordQuizAttempt, recordSpotIt, recordWarmup, setPosition, setWindows, startLesson, tickMission,
} from '../src/cq/lesson-logic.js';
import { normalizeCq } from '../src/cq/character.js';
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
assert.strictEqual(lessonReport({ name: 'Max', cq: reportCq }, g2, g3, '2026-09-16'), `Computer Quest — Max — 2026-09-16\nLesson G2 "Open, Switch, Close" — IN PROGRESS: mission\nWarm-up review: —\nQuiz: —\nReal task (parent-checked): —\nChest questions first try: —\nTime: lesson 1 min · battle —\nPractice Missions done: 0 day(s)\nWindows: 11\nParent note: —\nNext up: G3 "Folders Are Containers"`);
const notYetCq = normalizeCq({ ...reportCq, lessons: { ...reportCq.lessons, g2: passedState() } });
assert.strictEqual(lessonReport({ name: 'Max', cq: notYetCq }, g3, null, '2026-09-16'), `Computer Quest — Max — 2026-09-16\nLesson G3 "Folders Are Containers" — NOT YET (parent check)\nWarm-up review: —\nQuiz: passed\nReal task (parent-checked): 1/3 — not yet: "Makes a folder named Rocks, spelled right, inside his own folder"\nChest questions first try: —\nTime: lesson 0 min · battle —\nPractice Missions done: 0 day(s)\nWindows: 11\nParent note: —\nNext up: —`);
const previousPassed = { ...passedState(), startedAt: null };
const completeProfile = { name: 'Max', cq: normalizeCq({ track: 'guided', lessonsPassed: ['g1', 'g2', 'g3', 'g4', 'g5'], lessons: { g1: previousPassed, g2: previousPassed, g3: previousPassed, g4: previousPassed, g5: { ...emptyLessonState(), startedAt: iso } } }) };
assert.strictEqual(profileReport(completeProfile, LESSONS, '2026-09-16'), `Computer Quest — Max — 2026-09-16\nLesson G5 "Keyboard Keys and the STOP Rule" — IN PROGRESS: warmup\nWarm-up review: —\nQuiz: —\nReal task (parent-checked): —\nChest questions first try: —\nTime: lesson 0 min · battle —\nPractice Missions done: 0 day(s)\nWindows: —\nParent note: —\nNext up: Pack 1 complete!`);
const family = familyReport([{ name: 'No track', cq: normalizeCq({}) }, { name: 'Max', cq: reportCq }, { name: 'Ada', cq: reportCq }], lessons, '2026-09-16');
assert.strictEqual(family, `${profileReport({ name: 'Max', cq: reportCq }, lessons, '2026-09-16')}\n\n${profileReport({ name: 'Ada', cq: reportCq }, lessons, '2026-09-16')}`);

console.log('ok — Computer Quest lesson engine pass');

import { GEMS, TRACK_LESSONS } from './items.js';
import { addGems, awardLesson, battleGems, chestGems, packComplete, rollChest } from './character.js';
import { emptyLessonState, normalizeLessons, normalizeWindows } from './lesson-state.js';
import { trackLessons } from './lessons/pack1.js';
import { normalizeTyping } from './typing/state.js';
import { isValidIso, isValidDay } from './iso.js';

export { emptyLessonState, normalizeLessons, normalizeWindows } from './lesson-state.js';

const PHASES = ['warmup', 'learn', 'mission', 'quiz', 'parent', 'key', 'chest', 'done'];
const LESSON_IDS = ['g1', 'g2', 'g3', 'g4', 'g5', 's1', 's2', 's3', 's4', 's5'];
const BATTLE_OUTCOMES = ['victory', 'time', 'fell', 'skipped'];
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
// Same strict validators the saved-state reader uses, so a value accepted here is never dropped on reload.
const validIso = isValidIso;
const clampInt = (value, min, max) => Math.min(max, Math.max(min, Number.isFinite(value) ? Math.floor(value) : min));
const validDay = isValidDay;
const stateFor = (cq, id) => normalizeLessons(cq?.lessons)[id] || emptyLessonState();
const replace = (cq, id, state) => ({ ...cq, lessons: { ...normalizeLessons(cq?.lessons), [id]: state } });
const phaseIndex = (phase) => PHASES.indexOf(phase);
const sameTrack = (cq, lesson) => Boolean(lesson && cq?.track === lesson.track && TRACK_LESSONS[lesson.track]);
const lessonForId = (cq, id) => trackLessons(cq?.track).find((lesson) => lesson.id === id) || null;

function solvedQuizQuestions(attempts, lesson) {
  const solved = new Set();
  (Array.isArray(attempts) ? attempts : []).forEach((attempt) => {
    (Array.isArray(attempt?.answers) ? attempt.answers : []).forEach((answer) => {
      const question = lesson.quiz[answer?.q];
      if (question && Number.isInteger(answer.choice) && answer.choice >= 0
        && answer.choice < question.choices.length && answer.choice === question.answer) solved.add(answer.q);
    });
  });
  return solved;
}

function requireUnlockedLesson(cq, lesson) {
  if (!sameTrack(cq, lesson)) throw new Error('lesson is in the wrong track');
  if (!isUnlocked(cq, lesson, trackLessons(lesson.track))) throw new Error('lesson is locked');
}

export function isUnlocked(cq, lesson, lessonsInTrack) {
  if (!sameTrack(cq, lesson) || !Array.isArray(lessonsInTrack)) return false;
  const lessonId = (item) => typeof item === 'string' ? item : item?.id;
  const index = lessonsInTrack.findIndex((item) => lessonId(item) === lesson.id);
  if (index < 0) return false;
  if (index === 0) return true;
  return Boolean(stateFor(cq, lessonId(lessonsInTrack[index - 1])).passedAt);
}

export function lessonStatus(cq, lesson) {
  const track = TRACK_LESSONS[lesson?.track] || [];
  if (!isUnlocked(cq, lesson, track.map((id) => ({ id })))) return 'locked';
  const state = stateFor(cq, lesson.id);
  if (state.chest.openedAt) return 'done';
  if (state.passedAt) return 'passed';
  if (state.parent.at) return 'not-yet';
  if (state.startedAt) return 'in-progress';
  return 'ready';
}

export function startLesson(cq, lesson, nowIso) {
  requireUnlockedLesson(cq, lesson);
  const state = stateFor(cq, lesson.id);
  const startedAt = state.startedAt || (validIso(nowIso) ? nowIso : new Date().toISOString());
  return replace(cq, lesson.id, { ...state, startedAt });
}

export function setPosition(cq, lessonId, phase, index) {
  if (!LESSON_IDS.includes(lessonId)) throw new Error('unknown lesson');
  if (!PHASES.includes(phase)) throw new Error('invalid lesson phase');
  const lesson = lessonForId(cq, lessonId);
  if (!lesson) throw new Error('lesson is in the wrong track');
  requireUnlockedLesson(cq, lesson);
  const state = stateFor(cq, lessonId);
  const requested = phaseIndex(phase);
  if (requested < phaseIndex(state.phase)) throw new Error('cannot go back to an earlier lesson phase');
  if (requested > phaseIndex(state.phase) + 1) throw new Error('cannot skip lesson phases');
  if (phase === 'learn' && !state.warmup.length) throw new Error('warm-up is incomplete');
  if (phase === 'quiz' && !lesson.mission.every((_, stepIndex) => missionStepDone(cq, lesson, stepIndex))) throw new Error('mission is incomplete');
  if (phase === 'parent' && !state.quizPassedAt) throw new Error('quiz is incomplete');
  if ((phase === 'key' || phase === 'chest') && !state.passedAt) throw new Error('parent check is incomplete');
  if (phase === 'done' && !state.chest.openedAt) throw new Error('chest is unopened');
  const position = Number.isFinite(index) && index >= 0 ? Math.floor(index) : 0;
  return replace(cq, lessonId, { ...state, phase, index: position });
}

export function recordWarmup(cq, lesson, answers) {
  requireUnlockedLesson(cq, lesson);
  const state = stateFor(cq, lesson.id);
  if (state.warmup.length) return replace(cq, lesson.id, state);
  const list = Array.isArray(answers) ? answers : [];
  const warmup = list.filter((answer) => Number.isInteger(answer?.q) && answer.q >= 0 && answer.q < lesson.warmup.length
    && Number.isInteger(answer.choice) && answer.choice >= 0 && answer.choice < lesson.warmup[answer.q].choices.length)
    .map((answer) => ({ q: answer.q, choice: answer.choice, correct: answer.choice === lesson.warmup[answer.q].answer }));
  return replace(cq, lesson.id, { ...state, warmup });
}

export function tickMission(cq, lesson, stepIndex, ticked) {
  requireUnlockedLesson(cq, lesson);
  const state = stateFor(cq, lesson.id);
  if (!Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex >= lesson.mission.length) return replace(cq, lesson.id, state);
  if (lesson.mission[stepIndex].kind === 'spotIt' || lesson.mission[stepIndex].kind === 'windowsCheck') {
    throw new Error('this mission step must be completed another way');
  }
  const mission = lesson.mission.map((_, index) => index === stepIndex ? ticked === true : state.mission[index] === true);
  return replace(cq, lesson.id, { ...state, mission });
}

export function recordSpotIt(cq, lesson, stepIndex, picks) {
  requireUnlockedLesson(cq, lesson);
  const step = lesson.mission[stepIndex];
  if (!step || step.kind !== 'spotIt' || !Array.isArray(step.cards)) {
    const state = stateFor(cq, lesson.id);
    return replace(cq, lesson.id, state);
  }
  const seen = new Set();
  const answers = [];
  (Array.isArray(picks) ? picks : []).forEach((pick) => {
    if (!Number.isInteger(pick?.card) || pick.card < 0 || pick.card >= step.cards.length
      || (pick.pick !== 'ok' && pick.pick !== 'stop') || seen.has(pick.card)) return;
    seen.add(pick.card);
    answers.push({ card: pick.card, pick: pick.pick, correct: pick.pick === step.cards[pick.card].answer });
  });
  const correct = answers.filter((answer) => answer.correct).length;
  const state = stateFor(cq, lesson.id);
  const mission = lesson.mission.map((_, index) => index === stepIndex ? correct >= step.pass : state.mission[index] === true);
  return replace(cq, lesson.id, { ...state, mission, spotIt: { ...state.spotIt, [stepIndex]: answers } });
}

export function setWindows(cq, version) {
  return { ...cq, windows: normalizeWindows(version) };
}

export function missionStepDone(cq, lesson, stepIndex) {
  const step = lesson?.mission?.[stepIndex];
  if (!step) return false;
  if (step.kind === 'windowsCheck') return normalizeWindows(cq?.windows) !== null;
  return stateFor(cq, lesson.id).mission[stepIndex] === true;
}

export function quizQuestionsToAsk(cq, lesson) {
  const solved = solvedQuizQuestions(stateFor(cq, lesson.id).quizAttempts, lesson);
  return lesson.quiz.map((_, index) => index).filter((index) => !solved.has(index));
}

export function recordQuizAttempt(cq, lesson, answers, nowIso) {
  requireUnlockedLesson(cq, lesson);
  const state = stateFor(cq, lesson.id);
  if (state.phase !== 'quiz') throw new Error('not at quiz yet');
  if (state.quizPassedAt) return replace(cq, lesson.id, state);
  const allowed = new Set(quizQuestionsToAsk(cq, lesson));
  const seen = new Set();
  const normalized = [];
  (Array.isArray(answers) ? answers : []).forEach((answer) => {
    if (!Number.isInteger(answer?.q) || !allowed.has(answer.q) || seen.has(answer.q)) return;
    if (!Number.isInteger(answer.choice) || answer.choice < 0 || answer.choice >= lesson.quiz[answer.q].choices.length) return;
    seen.add(answer.q);
    normalized.push({ q: answer.q, choice: answer.choice, correct: answer.choice === lesson.quiz[answer.q].answer });
  });
  const attempts = [...state.quizAttempts, { at: validIso(nowIso) ? nowIso : new Date().toISOString(), answers: normalized }];
  const solved = solvedQuizQuestions(attempts, lesson);
  const passed = solved.size >= lesson.passScore;
  return replace(cq, lesson.id, { ...state, quizAttempts: attempts, quizPassedAt: passed ? (validIso(nowIso) ? nowIso : new Date().toISOString()) : null,
    phase: passed ? 'parent' : state.phase });
}

export function recordParentCheck(cq, lesson, checks, note, nowIso) {
  requireUnlockedLesson(cq, lesson);
  const state = stateFor(cq, lesson.id);
  if (state.phase !== 'parent') throw new Error('not at parent check yet');
  if (!Array.isArray(checks) || checks.length !== lesson.parentChecks.length) throw new Error('parent checks length does not match');
  if (state.passedAt) throw new Error('lesson already passed');
  if (!state.quizPassedAt) throw new Error('quiz is incomplete');
  const all = checks.every((check) => check === true);
  const at = validIso(nowIso) ? nowIso : new Date().toISOString();
  return replace(cq, lesson.id, { ...state, parent: { at, checks: checks.map((check) => check === true), note: typeof note === 'string' ? note.slice(0, 500) : '' },
    passedAt: all ? at : null, phase: all ? 'key' : 'parent' });
}

export function openChest(cq, lesson, firstTry, nowIso, rng) {
  requireUnlockedLesson(cq, lesson);
  const state = stateFor(cq, lesson.id);
  if (state.phase !== 'key' && state.phase !== 'chest') throw new Error('not at chest yet');
  if (!state.passedAt) throw new Error('lesson is not passed');
  if (state.chest.openedAt) throw new Error('chest is already opened');
  const first = lesson.chest.map((_, index) => Array.isArray(firstTry) && firstTry[index] === true);
  const gems = chestGems({ firstTryCorrect: first.filter(Boolean).length, total: lesson.chest.length });
  const award = awardLesson(cq, lesson.id);
  const rolled = rollChest(addGems(award.cq, gems), rng);
  const openedAt = validIso(nowIso) ? nowIso : new Date().toISOString();
  const chest = { openedAt, firstTry: first, cosmetic: rolled.cosmetic, gems: gems + rolled.gems };
  return { cq: replace(rolled.cq, lesson.id, { ...stateFor(rolled.cq, lesson.id), chest, phase: 'done' }),
    loot: { item: award.item, titles: award.titles, cosmetic: rolled.cosmetic, gems: gems + rolled.gems } };
}

// Append-only: persists each chest question's first-try result the moment it's known, so a reload
// mid-chest can't wipe a wrong pick and hand back a clean first try (b8).
export function recordChestAnswer(cq, lesson, index, firstTryCorrect) {
  requireUnlockedLesson(cq, lesson);
  const state = stateFor(cq, lesson.id);
  if (state.phase !== 'chest') throw new Error('not at chest yet');
  if (index >= lesson.chest.length) throw new Error('chest question index out of range');
  if (index !== state.chestProgress.length) throw new Error('chest answers must be recorded in order');
  return replace(cq, lesson.id, { ...state, chestProgress: state.chestProgress.concat(firstTryCorrect === true) });
}

export function recordBattle(cq, lesson, result, nowIso) {
  requireUnlockedLesson(cq, lesson);
  const state = stateFor(cq, lesson.id);
  if (!state.passedAt) throw new Error('lesson is not passed');
  if (state.phase !== 'key') throw new Error('not at the key screen yet');
  if (state.battle) throw new Error('battle already recorded');
  const outcome = result && result.outcome;
  if (!BATTLE_OUTCOMES.includes(outcome)) throw new Error('invalid battle outcome');
  const poofs = clampInt(result?.poofs, 0, 500);
  const ms = clampInt(result?.ms, 0, 600000);
  const gems = clampInt(outcome === 'skipped' ? 0 : battleGems(poofs), 0, 10);
  const playedAt = validIso(nowIso) ? nowIso : new Date().toISOString();
  const battle = { playedAt, ms, poofs, outcome, gems };
  return { cq: addGems(replace(cq, lesson.id, { ...state, battle }), gems), gems };
}

export function completePractice(cq, lesson, today) {
  requireUnlockedLesson(cq, lesson);
  const state = stateFor(cq, lesson.id);
  if (!state.passedAt) throw new Error('lesson is not passed');
  if (!validDay(today) || state.practiceDays.includes(today)) return { cq: replace(cq, lesson.id, state), gems: 0 };
  return { cq: replace(addGems(cq, GEMS.practice), lesson.id, { ...state, practiceDays: [...state.practiceDays, today].sort() }), gems: GEMS.practice };
}

export function addActiveMs(cq, lessonId, ms) {
  if (!LESSON_IDS.includes(lessonId)) throw new Error('unknown lesson');
  const lesson = lessonForId(cq, lessonId);
  if (!lesson) throw new Error('lesson is in the wrong track');
  requireUnlockedLesson(cq, lesson);
  const state = stateFor(cq, lessonId);
  const amount = Number.isFinite(ms) ? Math.min(300000, Math.max(0, Math.floor(ms))) : 0;
  return replace(cq, lessonId, { ...state, activeMs: state.activeMs + amount });
}

const clean = (text) => String(text || '').replace(/\*\*/g, '');
const cleanNote = (text) => String(text || '').replace(/\s+/g, ' ').trim();
const label = (lesson) => `${lesson.id.toUpperCase()} "${lesson.title}"`;
const statusText = (status, state) => status === 'in-progress' ? `IN PROGRESS: ${state.phase}`
  : status === 'not-yet' ? 'NOT YET (parent check)' : (status === 'passed' || status === 'done') ? 'PASSED' : status.toUpperCase();

// Typing best WPM: at most 1 decimal, trailing .0 dropped (docs/computer-quest/typing.md §7).
const fmtWpm = (wpm) => { const fixed = Number(wpm).toFixed(1); return fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed; };
const TYPING_MODES = [['homeRow', 'Home Row'], ['lessonWords', 'Lesson Words'], ['sentences', 'Sentences']];
// Fix P5a-fix #6: normalize cq.typing here rather than trusting it, so a raw/partial typing
// object still formats correctly; and use singular "1 session" vs plural "N sessions".
function typingReportLine(cq) {
  const typing = normalizeTyping(cq?.typing);
  const parts = TYPING_MODES.map(([mode, name]) => {
    const best = typing.best[mode];
    return best ? `${name} ${fmtWpm(best.wpm)} WPM @ ${best.accuracy}%` : `${name} —`;
  });
  const sessionWord = typing.sessions.length === 1 ? 'session' : 'sessions';
  return `Typing best: ${parts.join(' · ')} · ${typing.sessions.length} ${sessionWord}`;
}

export function lessonReport(profile, lesson, nextLesson, todayYmd) {
  const cq = profile?.cq || {};
  const state = stateFor(cq, lesson.id);
  if (!state.startedAt) return '';
  const warmupCorrect = state.warmup.filter((answer) => answer.correct).length;
  const missedWarmup = state.warmup.filter((answer) => !answer.correct).map((answer) => clean(lesson.warmup[answer.q]?.q)).filter(Boolean);
  const quiz = state.quizAttempts.map((attempt, index) => {
    const missed = attempt.answers.filter((answer) => !answer.correct).map((answer) => answer.q).sort((a, b) => a - b).map((q) => `Q${q + 1}`);
    return `try ${index + 1} = ${attempt.answers.filter((answer) => answer.correct).length}/${attempt.answers.length}${missed.length ? ` (missed ${missed.join(', ')})` : ''}`;
  });
  if (state.quizPassedAt) quiz.push('passed');
  const checks = state.parent.checks.filter(Boolean).length;
  const allChecks = lesson.parentChecks.length > 0 && checks === lesson.parentChecks.length;
  const unmarked = lesson.parentChecks.filter((_, index) => !state.parent.checks[index]);
  const chestCorrect = state.chest.firstTry.filter(Boolean).length;
  const missedChest = state.chest.firstTry.map((correct, index) => correct ? null : clean(lesson.chest[index]?.q)).filter(Boolean);
  const next = nextLesson ? label(nextLesson) : packComplete(cq) ? 'Pack 1 complete!' : '—';
  const battle = state.battle;
  const battleTime = !battle ? '—' : battle.outcome === 'skipped' ? 'skipped'
    : battle.ms > 0 && battle.ms < 60000 ? '<1 min' : `${Math.round(battle.ms / 60000)} min`;
  return [
    `Computer Quest — ${profile.name} — ${todayYmd}`,
    `Lesson ${label(lesson)} — ${statusText(lessonStatus(cq, lesson), state)}`,
    state.warmup.length ? `Warm-up review: ${warmupCorrect}/${lesson.warmup.length}${missedWarmup.length ? ` (missed: ${missedWarmup.map((text) => `"${text}"`).join(', ')})` : ''}` : 'Warm-up review: —',
    `Quiz: ${quiz.length ? quiz.join(' · ') : '—'}`,
    state.parent.at ? `Real task (parent-checked): ${checks}/${lesson.parentChecks.length}${allChecks ? '' : ` — not yet: "${clean(unmarked[0])}"`}` : 'Real task (parent-checked): —',
    state.chest.openedAt ? `Chest questions first try: ${chestCorrect}/${lesson.chest.length}${missedChest.length ? ` (missed: ${missedChest.map((text) => `"${text}"`).join(', ')})` : ''}` : 'Chest questions first try: —',
    `Time: lesson ${Math.round(state.activeMs / 60000)} min · battle ${battleTime}`,
    `Practice Missions done: ${state.practiceDays.length} day(s)`,
    `Windows: ${normalizeWindows(cq.windows) || '—'}`,
    `Parent note: ${cleanNote(state.parent.note) || '—'}`,
    `Next up: ${next}`,
  ].join('\n');
}

export function profileReport(profile, lessons, todayYmd) {
  const track = profile?.cq?.track;
  const ordered = (Array.isArray(lessons) ? lessons : []).filter((lesson) => lesson.track === track);
  const reports = ordered.filter((lesson) => stateFor(profile.cq, lesson.id).startedAt)
    .map((lesson) => lessonReport(profile, lesson, ordered[ordered.findIndex((item) => item.id === lesson.id) + 1] || null, todayYmd));
  const header = `Computer Quest — ${profile.name} — ${todayYmd}`;
  const typingLine = typingReportLine(profile?.cq);
  const blocks = reports.map((report) => report.split('\n').slice(1).join('\n'));
  return blocks.length ? `${header}\n${typingLine}\n${blocks.join('\n\n')}` : `${header}\n${typingLine}`;
}

export function familyReport(profiles, lessons, todayYmd) {
  return (Array.isArray(profiles) ? profiles : []).filter((profile) => profile?.cq?.track)
    .map((profile) => profileReport(profile, lessons, todayYmd)).join('\n\n');
}

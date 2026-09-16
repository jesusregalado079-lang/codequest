const LESSON_IDS = ['g1', 'g2', 'g3', 'g4', 'g5', 's1', 's2', 's3', 's4', 's5'];
const PHASES = ['warmup', 'learn', 'mission', 'quiz', 'parent', 'key', 'chest', 'done'];

const object = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const number = (value) => Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
const iso = (value) => typeof value === 'string' && Number.isFinite(Date.parse(value)) ? value : null;
const day = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parts = value.split('-').map(Number);
  const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  return date.getUTCFullYear() === parts[0] && date.getUTCMonth() === parts[1] - 1 && date.getUTCDate() === parts[2] ? value : null;
};

function answers(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((answer) => answer && Number.isInteger(answer.q) && answer.q >= 0
    && Number.isInteger(answer.choice) && answer.choice >= 0 && typeof answer.correct === 'boolean')
    .map((answer) => ({ q: answer.q, choice: answer.choice, correct: answer.correct }));
}

function spotAnswers(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((answer) => answer && Number.isInteger(answer.card) && answer.card >= 0
    && (answer.pick === 'ok' || answer.pick === 'stop') && typeof answer.correct === 'boolean')
    .map((answer) => ({ card: answer.card, pick: answer.pick, correct: answer.correct }));
}

export function emptyLessonState() {
  return {
    phase: 'warmup', index: 0, startedAt: null, activeMs: 0, warmup: [], mission: [], spotIt: {},
    quizAttempts: [], quizPassedAt: null, parent: { at: null, checks: [], note: '' }, passedAt: null,
    chest: { openedAt: null, firstTry: [], cosmetic: null, gems: 0 }, practiceDays: [], battle: null,
  };
}

function normalizeLesson(value) {
  const source = object(value);
  const spotIt = {};
  Object.keys(object(source.spotIt)).forEach((key) => {
    if (/^\d+$/.test(key)) spotIt[key] = spotAnswers(source.spotIt[key]);
  });
  const attempts = Array.isArray(source.quizAttempts) ? source.quizAttempts.filter((attempt) => iso(attempt?.at))
    .map((attempt) => ({ at: iso(attempt.at), answers: answers(attempt.answers) })) : [];
  const days = [];
  if (Array.isArray(source.practiceDays)) source.practiceDays.forEach((value) => {
    const valid = day(value);
    if (valid && !days.includes(valid)) days.push(valid);
  });
  days.sort();
  const parent = object(source.parent);
  const chest = object(source.chest);
  const result = {
    phase: PHASES.includes(source.phase) ? source.phase : 'warmup', index: number(source.index),
    startedAt: iso(source.startedAt), activeMs: number(source.activeMs), warmup: answers(source.warmup),
    mission: Array.isArray(source.mission) ? source.mission.map((value) => value === true) : [], spotIt,
    quizAttempts: attempts, quizPassedAt: iso(source.quizPassedAt),
    parent: { at: iso(parent.at), checks: Array.isArray(parent.checks) ? parent.checks.map((value) => value === true) : [],
      note: typeof parent.note === 'string' ? parent.note.slice(0, 500) : '' },
    passedAt: iso(source.passedAt),
    chest: { openedAt: iso(chest.openedAt), firstTry: Array.isArray(chest.firstTry) ? chest.firstTry.map((value) => value === true) : [],
      cosmetic: typeof chest.cosmetic === 'string' ? chest.cosmetic : null, gems: number(chest.gems) },
    practiceDays: days, battle: null,
  };
  if (result.passedAt && !result.quizPassedAt) result.passedAt = null;
  if (result.chest.openedAt && !result.passedAt) {
    result.chest = { openedAt: null, firstTry: [], cosmetic: null, gems: 0 };
  }
  if (result.chest.openedAt) result.phase = 'done';
  else if (result.passedAt) {
    const phase = PHASES.indexOf(result.phase);
    result.phase = phase < PHASES.indexOf('key') ? 'key' : phase > PHASES.indexOf('chest') ? 'chest' : result.phase;
  } else if (result.quizPassedAt) result.phase = 'parent';
  else if (!['warmup', 'learn', 'mission', 'quiz'].includes(result.phase)) result.phase = 'warmup';
  return result;
}

export function normalizeLessons(value) {
  const source = object(value);
  const result = {};
  LESSON_IDS.forEach((id) => {
    if (Object.prototype.hasOwnProperty.call(source, id)) result[id] = normalizeLesson(source[id]);
  });
  return result;
}

export const normalizeWindows = (value) => value === '10' || value === '11' ? value : null;

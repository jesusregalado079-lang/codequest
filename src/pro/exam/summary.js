// Where he stands on every exam, computed synchronously from the generated index (no bank is loaded): for the Journey
// card, the exams hub and the achievements, which run after every tick.
import { DEFAULT_EXAM, EXAMS, examById } from './registry.js';
import { emptyExamState, fullMocks, readiness, reviewDue } from './exam-logic.js';
import { getAllExamStates } from '../progress.js';

// Full mocks in a row at the target, counting back from the latest (at most 3).
export function runAtTarget(state, target, mockQuestions) {
  const mocks = fullMocks(state, mockQuestions);
  let run = 0;
  for (let i = mocks.length - 1; i >= 0 && mocks[i].percent >= target && run < 3; i -= 1) run += 1;
  return run;
}

// exam: a registry entry ({ id, blueprint, index }); state: that exam's saved state.
export function summarize(exam, state = emptyExamState(), now = Date.now()) {
  const bp = exam.blueprint;
  const r = readiness(state, exam.index, bp.target, bp.questions);
  return {
    ...r,
    id: exam.id,
    short: bp.short,
    code: bp.code,
    due: reviewDue(exam.index, state, now).length,
    total: exam.index.length,
    target: bp.target,
    name: `${bp.name} ${bp.code}`,
    runAtTarget: runAtTarget(state, bp.target, bp.questions),
    open: !!state.session,
  };
}

// { [examId]: summary } for every exam, in display order, from one storage read.
export function examSummaries(now = Date.now()) {
  const all = getAllExamStates();
  return Object.fromEntries(EXAMS.map((e) => [e.id, summarize(e, all[e.id] || emptyExamState(), now)]));
}

// One exam's summary (Security+ when no id is given, as before).
export function examSummary(examId = DEFAULT_EXAM) {
  const exam = examById(examId);
  return exam ? summarize(exam, getAllExamStates()[exam.id] || emptyExamState()) : null;
}

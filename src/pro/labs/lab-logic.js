export const PASS = 80;
// Keep recent runs plus the earliest best unassisted run and best unassisted Exam run.
export const RUNS_CAP = 10;
const MODES = ['guided', 'practice', 'exam'];

const plain = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const defaultTime = (t = Date.now()) => t;
const validId = (id) => typeof id === 'string' && id.length <= 80
  && /^[a-z0-9-]+\/[a-z0-9-]+$/.test(id)
  && !id.split('/').some((part) => ['constructor', 'prototype', '__proto__'].includes(part));
const validRun = (run) => run && typeof run === 'object' && !Array.isArray(run)
  && Number.isSafeInteger(run.t) && run.t > 0
  && Number.isInteger(run.score) && run.score >= 0 && run.score <= 100
  && Number.isInteger(run.secs) && run.secs >= 0 && run.secs <= 86400
  && (run.mode === undefined || MODES.includes(run.mode))
  && (run.assisted === undefined || typeof run.assisted === 'boolean');
// Optional A+ fields: mode is kept when present; assisted is stored only when true.
const cleanRun = ({ t, score, secs, mode, assisted }) => ({ t, score, secs,
  ...(mode === undefined ? {} : { mode }), ...(assisted === true ? { assisted } : {}) });
const capRuns = (runs) => {
  const sorted = [...runs].sort((a, b) => a.t - b.t);
  if (sorted.length <= RUNS_CAP) return sorted;
  const unassisted = sorted.filter((run) => !run.assisted);
  const best = (unassisted.length ? unassisted : sorted).reduce((top, run) => run.score > top.score ? run : top);
  const exam = unassisted.filter((run) => run.mode === 'exam');
  // The highest Exam score qualifies for every pass mark that any older Exam run met.
  const bestExam = exam.length ? exam.reduce((top, run) => run.score > top.score ? run : top) : null;
  const kept = new Set([best, bestExam].filter(Boolean));
  for (let i = sorted.length - 1; i >= 0 && kept.size < RUNS_CAP; i -= 1) kept.add(sorted[i]);
  return sorted.filter((run) => kept.has(run));
};

export const emptyLabs = () => ({});

export function normalizeLabs(raw) {
  const out = emptyLabs();
  for (const [id, runs] of Object.entries(plain(raw))) {
    if (!validId(id) || !Array.isArray(runs)) continue;
    const clean = Object.keys(runs).filter((key) => /^(0|[1-9]\d*)$/.test(key) && Number(key) < runs.length)
      .map((key) => runs[key]).filter(validRun).map(cleanRun);
    const capped = capRuns(clean);
    if (capped.length) out[id] = capped;
  }
  return out;
}

export function mergeLabs(a, b) {
  const left = normalizeLabs(a);
  const right = normalizeLabs(b);
  const out = emptyLabs();
  for (const id of new Set([...Object.keys(left), ...Object.keys(right)])) {
    const seen = new Set();
    out[id] = capRuns([...(left[id] || []), ...(right[id] || [])]
      .filter((run) => {
        const key = JSON.stringify([run.t, run.score, run.mode ?? null, run.assisted ?? null]);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }));
  }
  return out;
}

export function recordRun(labs, itemId, run = {}) {
  const out = normalizeLabs(labs);
  if (!validId(itemId)) return out;
  const next = { score: run?.score, secs: run?.secs, t: defaultTime(run?.t), mode: run?.mode, assisted: run?.assisted };
  if (!validRun(next)) return out;
  out[itemId] = capRuns([...(out[itemId] || []), cleanRun(next)]);
  return out;
}

export function bestScore(labs, itemId) {
  if (!validId(itemId)) return null;
  const runs = normalizeLabs(labs)[itemId];
  return runs?.length ? Math.max(...runs.map((run) => run.score)) : null;
}

export function isPassed(labs, itemId, pass = PASS) {
  if (!validId(itemId)) return false;
  return !!normalizeLabs(labs)[itemId]?.some((run) => !run.assisted && run.score >= pass);
}

// Mastered: a run in Exam mode, not assisted, at or above the pass mark (A+ labs, SPEC 2.4).
const masteredRun = (run, pass) => run.mode === 'exam' && !run.assisted && run.score >= pass;
export function isMastered(labs, itemId, pass = PASS) {
  if (!validId(itemId)) return false;
  return !!normalizeLabs(labs)[itemId]?.some((run) => masteredRun(run, pass));
}

export function labSummary(labs, catalog) {
  const saved = normalizeLabs(labs);
  const perLab = (Array.isArray(catalog) ? catalog : []).filter((lab) => lab && typeof lab === 'object').map((lab) => {
    const cases = Array.isArray(lab.cases) ? lab.cases : [];
    const pass = Number.isFinite(lab.pass) ? lab.pass : PASS;
    let passed = 0;
    let perfect = 0;
    let attempted = 0;
    let mastered = 0;
    let nextCaseId = null;
    for (const item of cases) {
      const id = item?.id;
      const runs = saved[`${lab.id}/${id}`] || [];
      const passedRun = runs.some((run) => !run.assisted && run.score >= pass);
      if (runs.length) attempted += 1;
      // Perfect (Ten Perfect badge) counts unassisted runs only; old runs without the field are unassisted.
      if (runs.some((run) => !run.assisted && run.score === 100)) perfect += 1;
      if (runs.some((run) => masteredRun(run, pass))) mastered += 1;
      if (passedRun) passed += 1;
      else if (nextCaseId === null) nextCaseId = id;
    }
    return { id: lab.id, name: lab.name, icon: lab.icon, ...(typeof lab.group === 'string' ? { group: lab.group } : {}),
      total: cases.length, passed, perfect, attempted, mastered, nextCaseId };
  });
  const recent = Object.entries(saved).flatMap(([itemId, runs]) => runs.map((run) => {
    const [labId, caseId] = itemId.split('/');
    return { itemId, labId, caseId, score: run.score, t: run.t };
  })).sort((a, b) => b.t - a.t).slice(0, 5);
  return {
    total: perLab.reduce((sum, lab) => sum + lab.total, 0),
    passed: perLab.reduce((sum, lab) => sum + lab.passed, 0),
    perfect: perLab.reduce((sum, lab) => sum + lab.perfect, 0),
    attempted: perLab.reduce((sum, lab) => sum + lab.attempted, 0),
    runs: Object.values(saved).reduce((sum, list) => sum + list.length, 0),
    perLab,
    recent,
  };
}

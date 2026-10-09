export const PASS = 80;
// Keep recent runs plus the earliest best-score run when it would be trimmed.
export const RUNS_CAP = 10;

const plain = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const defaultTime = (t = Date.now()) => t;
const validId = (id) => typeof id === 'string' && id.length <= 80
  && /^[a-z0-9-]+\/[a-z0-9-]+$/.test(id)
  && !id.split('/').some((part) => ['constructor', 'prototype', '__proto__'].includes(part));
const validRun = (run) => run && typeof run === 'object' && !Array.isArray(run)
  && Number.isSafeInteger(run.t) && run.t > 0
  && Number.isInteger(run.score) && run.score >= 0 && run.score <= 100
  && Number.isInteger(run.secs) && run.secs >= 0 && run.secs <= 86400;
const capRuns = (runs) => {
  const sorted = [...runs].sort((a, b) => a.t - b.t);
  if (sorted.length <= RUNS_CAP) return sorted;
  const recent = sorted.slice(-RUNS_CAP);
  const best = sorted.reduce((top, run) => run.score > top.score ? run : top);
  if (recent.includes(best)) return recent;
  return [best, ...recent.slice(1)].sort((a, b) => a.t - b.t);
};

export const emptyLabs = () => ({});

export function normalizeLabs(raw) {
  const out = emptyLabs();
  for (const [id, runs] of Object.entries(plain(raw))) {
    if (!validId(id) || !Array.isArray(runs)) continue;
    const clean = Object.keys(runs).filter((key) => /^(0|[1-9]\d*)$/.test(key) && Number(key) < runs.length)
      .map((key) => runs[key]).filter(validRun).map(({ t, score, secs }) => ({ t, score, secs }));
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
        const key = `${run.t}/${run.score}`;
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
  const next = { score: run?.score, secs: run?.secs, t: defaultTime(run?.t) };
  if (!validRun(next)) return out;
  out[itemId] = capRuns([...(out[itemId] || []), next]);
  return out;
}

export function bestScore(labs, itemId) {
  if (!validId(itemId)) return null;
  const runs = normalizeLabs(labs)[itemId];
  return runs?.length ? Math.max(...runs.map((run) => run.score)) : null;
}

export function isPassed(labs, itemId, pass = PASS) {
  const best = bestScore(labs, itemId);
  return best !== null && best >= pass;
}

export function labSummary(labs, catalog) {
  const saved = normalizeLabs(labs);
  const perLab = (Array.isArray(catalog) ? catalog : []).filter((lab) => lab && typeof lab === 'object').map((lab) => {
    const cases = Array.isArray(lab.cases) ? lab.cases : [];
    const pass = Number.isFinite(lab.pass) ? lab.pass : PASS;
    let passed = 0;
    let perfect = 0;
    let attempted = 0;
    let nextCaseId = null;
    for (const item of cases) {
      const id = item?.id;
      const runs = saved[`${lab.id}/${id}`] || [];
      const best = runs.length ? Math.max(...runs.map((run) => run.score)) : null;
      if (runs.length) attempted += 1;
      if (best === 100) perfect += 1;
      if (best !== null && best >= pass) passed += 1;
      else if (nextCaseId === null) nextCaseId = id;
    }
    return { id: lab.id, name: lab.name, icon: lab.icon, total: cases.length, passed, perfect, attempted, nextCaseId };
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

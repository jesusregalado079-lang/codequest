// Certification exam practice: the pure rules behind practice, the review queue, full mock exams and readiness.
// Modelled on what got him through his pest-control exam on the first try (Fieldwork Academy): held-out questions
// that only appear in mocks and checks, mocks drawn fresh by the official domain weights, missed questions back now
// and right ones after growing gaps, "why not this one" on every wrong choice, and a stricter bar than needed.
//
// Nothing here touches storage or the page: it takes the bank, the blueprint, his saved exam state, today and a random
// source, and returns plain data. Answers are always stored as the BANK's choice index (choices are shuffled on screen).

export const REVIEW_GAPS = Object.freeze([1, 3, 7, 14, 30]); // days after the 1st, 2nd, 3rd... right answer in a row
export const HISTORY_CAP = 12; // answers kept per question
export const ATTEMPTS_CAP = 20; // finished mocks and checks kept
export const KINDS = Object.freeze(['mock', 'check', 'practice', 'review']);
const MODES = { mock: 'm', check: 'c', practice: 'p', review: 'r' };
const DAY = 86400000;

// ---------- helpers ----------
const plain = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const okId = (k) => typeof k === 'string' && k.length > 0 && k.length <= 60 && k !== '__proto__' && k !== 'constructor' && k !== 'prototype';
const okTime = (t) => typeof t === 'number' && Number.isFinite(t) && t > 0 && t < 8.64e15;
const isPerm = (p) => Array.isArray(p) && p.length === 4 && [0, 1, 2, 3].every((i) => p.includes(i));
const localDay = (t) => new Date(t).toLocaleDateString('en-CA');

export function defaultRng() {
  if (globalThis.crypto && globalThis.crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    return () => { globalThis.crypto.getRandomValues(buf); return buf[0] / 4294967296; };
  }
  return Math.random;
}
export function shuffle(list, rng = defaultRng()) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- saved state ----------
export const emptyExamState = () => ({ hist: {}, attempts: [], session: null });

function normalizeEntry(e) {
  const o = plain(e);
  if (!okTime(o.t) || !Number.isInteger(o.c) || o.c < -1 || o.c > 3 || typeof o.ok !== 'boolean' || !Object.values(MODES).includes(o.m)) return null;
  return { t: o.t, c: o.c, ok: o.ok, m: o.m };
}
function normalizeAnswers(raw) {
  const out = {};
  Object.keys(plain(raw)).forEach((k) => { const c = raw[k]; if (okId(k) && Number.isInteger(c) && c >= 0 && c <= 3) out[k] = c; });
  return out;
}
const idList = (raw, max) => (Array.isArray(raw) && raw.length > 0 && raw.length <= max && raw.every(okId) && new Set(raw).size === raw.length ? raw.slice() : null);

function normalizeAttempt(a) {
  const o = plain(a);
  const ids = idList(o.ids, 200);
  if (!okId(o.id) || !['mock', 'check'].includes(o.kind) || !ids || !okTime(o.startedAt) || !okTime(o.finishedAt)) return null;
  const nums = ['correct', 'total', 'percent', 'seconds'].every((f) => typeof o[f] === 'number' && Number.isFinite(o[f]) && o[f] >= 0);
  if (!nums || o.correct > o.total || o.total > ids.length || o.percent > 100) return null;
  const byDomain = {};
  Object.keys(plain(o.byDomain)).forEach((d) => {
    const v = o.byDomain[d];
    if (/^[1-9]$/.test(d) && Array.isArray(v) && v.length === 2 && v.every((n) => Number.isInteger(n) && n >= 0) && v[0] <= v[1]) byDomain[d] = [v[0], v[1]];
  });
  const out = { id: o.id, kind: o.kind, ids, answers: normalizeAnswers(o.answers), startedAt: o.startedAt, finishedAt: o.finishedAt, seconds: o.seconds, overTime: o.overTime === true, correct: o.correct, total: o.total, percent: o.percent, byDomain, removed: Number.isInteger(o.removed) && o.removed > 0 ? o.removed : 0 };
  if (o.kind === 'check' && Number.isInteger(o.domain)) out.domain = o.domain;
  return out;
}

function normalizeSession(s) {
  if (s === null || s === undefined) return null;
  const o = plain(s);
  const ids = idList(o.ids, 120);
  if (!okId(o.id) || !KINDS.includes(o.kind) || !ids || !okTime(o.startedAt)) return null;
  const orders = {};
  for (const id of ids) { if (!isPerm(plain(o.orders)[id])) return null; orders[id] = o.orders[id].slice(); }
  const answers = {};
  Object.entries(normalizeAnswers(o.answers)).forEach(([k, c]) => { if (ids.includes(k)) answers[k] = c; });
  const flags = {};
  Object.keys(plain(o.flags)).forEach((k) => { if (ids.includes(k) && o.flags[k] === true) flags[k] = true; });
  return {
    id: o.id, kind: o.kind, ids, orders, answers, flags,
    pos: Number.isInteger(o.pos) && o.pos >= 0 && o.pos < ids.length ? o.pos : 0,
    startedAt: o.startedAt,
    elapsedMs: typeof o.elapsedMs === 'number' && Number.isFinite(o.elapsedMs) && o.elapsedMs >= 0 ? o.elapsedMs : 0,
    title: typeof o.title === 'string' ? o.title.slice(0, 120) : '',
    feedback: o.kind === 'practice' || o.kind === 'review',
    limitMs: typeof o.limitMs === 'number' && o.limitMs > 0 ? o.limitMs : 0,
    domain: Number.isInteger(o.domain) ? o.domain : null,
  };
}

export function normalizeExamState(raw) {
  const o = plain(raw);
  const out = emptyExamState();
  Object.keys(plain(o.hist)).forEach((q) => {
    if (!okId(q) || !Array.isArray(o.hist[q])) return;
    const list = o.hist[q].map(normalizeEntry).filter(Boolean).sort((a, b) => a.t - b.t).slice(-HISTORY_CAP);
    if (list.length) out.hist[q] = list;
  });
  const seen = new Set();
  out.attempts = (Array.isArray(o.attempts) ? o.attempts : []).map(normalizeAttempt).filter((a) => a && !seen.has(a.id) && seen.add(a.id))
    .sort((a, b) => a.finishedAt - b.finishedAt).slice(-ATTEMPTS_CAP);
  out.session = normalizeSession(o.session);
  return out;
}

// All exams: { [examId]: state }.
export function normalizeExams(raw) {
  const out = {};
  Object.keys(plain(raw)).forEach((k) => { if (okId(k)) out[k] = normalizeExamState(raw[k]); });
  return out;
}

// Backup merge: every answer from both sides (no duplicates), every attempt by id, the session already here wins.
export function mergeExamState(here, incoming) {
  const a = normalizeExamState(here);
  const b = normalizeExamState(incoming);
  const hist = { ...a.hist };
  Object.entries(b.hist).forEach(([q, list]) => {
    const key = (e) => `${e.t}|${e.c}|${e.m}`;
    const have = new Set((hist[q] || []).map(key));
    hist[q] = [...(hist[q] || []), ...list.filter((e) => !have.has(key(e)))];
  });
  return normalizeExamState({ hist, attempts: [...a.attempts, ...b.attempts], session: a.session || b.session });
}

// ---------- what he has done ----------
export const latestAnswer = (state, id) => { const h = state.hist[id]; return h && h.length ? h[h.length - 1] : null; };
export const answered = (state, id) => !!latestAnswer(state, id);
export function accuracyOf(state, id) {
  const h = state.hist[id] || [];
  return h.length ? h.filter((e) => e.ok).length / h.length : null;
}
// Held-out questions stay out of practice until he has met them in a mock or check.
export const visibleInPractice = (q, state) => !q.checkOnly || answered(state, q.id);

// Practice order (also "Quiz me"): missed on the latest answer, then never answered, then right last time;
// lower lifetime accuracy first, then bank order.
export function practiceOrder(questions, state) {
  const tier = (q) => { const l = latestAnswer(state, q.id); return !l ? 1 : l.ok ? 2 : 0; };
  return questions
    .map((q, i) => ({ q, i, t: tier(q), acc: accuracyOf(state, q.id) ?? 1 }))
    .sort((x, y) => x.t - y.t || x.acc - y.acc || x.i - y.i)
    .map((x) => x.q);
}

// Review queue: a question missed on its latest answer is due now; one answered right k times in a row is due
// REVIEW_GAPS[k-1] days after that answer.
export function reviewDue(questions, state, now = Date.now()) {
  const today = localDay(now);
  const due = [];
  questions.forEach((q, i) => {
    const h = state.hist[q.id];
    if (!h || !h.length || !visibleInPractice(q, state)) return;
    const last = h[h.length - 1];
    if (!last.ok) { due.push({ q, i, wrong: true, over: Infinity }); return; }
    let k = 0;
    for (let j = h.length - 1; j >= 0 && h[j].ok; j -= 1) k += 1;
    const gap = REVIEW_GAPS[Math.min(k, REVIEW_GAPS.length) - 1];
    const daysSince = Math.round((Date.parse(`${today}T12:00:00`) - Date.parse(`${localDay(last.t)}T12:00:00`)) / DAY);
    if (daysSince >= gap) due.push({ q, i, wrong: false, over: daysSince - gap });
  });
  return due.sort((a, b) => (b.wrong - a.wrong) || (b.over - a.over) || (a.i - b.i)).map((x) => x.q);
}

// ---------- mock exams ----------
// Questions per domain for an exam of `total`, largest remainder on the official weights.
export function domainQuotas(domains, total) {
  const sum = domains.reduce((s, d) => s + d.weight, 0);
  const raw = domains.map((d) => ({ n: d.n, exact: (d.weight / sum) * total }));
  raw.forEach((r) => { r.q = Math.floor(r.exact); r.rem = r.exact - r.q; });
  let left = total - raw.reduce((s, r) => s + r.q, 0);
  raw.slice().sort((a, b) => b.rem - a.rem || a.n - b.n).forEach((r) => { if (left > 0) { r.q += 1; left -= 1; } });
  return Object.fromEntries(raw.map((r) => [r.n, r.q]));
}

// When each question was last put in front of him in a mock or check (finished ones), or 0.
function lastShownInExam(state) {
  const at = {};
  state.attempts.forEach((a) => a.ids.forEach((id) => { at[id] = Math.max(at[id] || 0, a.finishedAt); }));
  return at;
}

// A fresh draw: per domain its quota, take never-shown questions across objectives first (with a spread cap),
// then fill from each objective's remaining questions: missed latest, then least recently shown; ties random.
// Every question order and every choice order is shuffled. Returns { ids, orders }.
export function drawExam({ questions, domains, state, total, onlyDomain = null, rng = defaultRng() }) {
  const shown = lastShownInExam(state);
  const pool = questions.filter((q) => !q.offOutline);
  const quotas = onlyDomain ? { [onlyDomain]: total } : domainQuotas(domains, total);
  const picked = [];
  Object.entries(quotas).forEach(([dn, quota]) => {
    const inDomain = pool.filter((q) => String(q.d) === String(dn));
    const byObj = {};
    shuffle(inDomain, rng).forEach((q) => { (byObj[q.obj] = byObj[q.obj] || []).push(q); });
    const rank = (q) => { const l = latestAnswer(state, q.id); return !shown[q.id] ? 0 : l && !l.ok ? 1 : 2; };
    Object.values(byObj).forEach((list) => list.sort((a, b) => rank(a) - rank(b) || (shown[a.id] || 0) - (shown[b.id] || 0)));
    const lanes = shuffle(Object.values(byObj), rng);
    let need = Math.min(quota, inDomain.length);
    const cap = lanes.length ? Math.ceil(quota / lanes.length) + 1 : 0;
    const freshTaken = new Map(lanes.map((lane) => [lane, 0]));
    while (need > 0) {
      let took = false;
      for (const lane of lanes) {
        if (need > 0 && freshTaken.get(lane) < cap && lane.length && rank(lane[0]) === 0) {
          picked.push(lane.shift());
          freshTaken.set(lane, freshTaken.get(lane) + 1);
          need -= 1;
          took = true;
        }
      }
      if (!took) break;
    }
    while (need > 0) {
      let took = false;
      for (const lane of lanes) {
        if (need > 0 && lane.length) { picked.push(lane.shift()); need -= 1; took = true; }
      }
      if (!took) break;
    }
  });
  const ids = shuffle(picked, rng).map((q) => q.id);
  const orders = Object.fromEntries(ids.map((id) => [id, shuffle([0, 1, 2, 3], rng)]));
  return { ids, orders };
}

// A practice or review set in a given order (choices shuffled).
export function practiceSet(list, n, rng = defaultRng()) {
  const ids = list.slice(0, n).map((q) => q.id);
  return { ids, orders: Object.fromEntries(ids.map((id) => [id, shuffle([0, 1, 2, 3], rng)])) };
}

export function newSession({ kind, ids, orders, title, now = Date.now(), limitMs = 0, domain = null, rng = defaultRng() }) {
  const id = `${kind[0]}${now.toString(36)}${Math.floor(rng() * 1e6).toString(36)}`;
  return normalizeSession({ id, kind, ids, orders, answers: {}, flags: {}, pos: 0, startedAt: now, elapsedMs: 0, title, limitMs, domain });
}

// Score a session against the bank. Questions no longer in the bank are not scored (counted in `removed`).
export function scoreSession(session, byId) {
  const live = session.ids.filter((id) => byId[id]);
  const byDomain = {};
  let correct = 0;
  const missed = [];
  live.forEach((id) => {
    const q = byId[id];
    const c = session.answers[id];
    const ok = c === q.answer;
    const d = String(q.d);
    byDomain[d] = byDomain[d] || [0, 0];
    byDomain[d][1] += 1;
    if (ok) { correct += 1; byDomain[d][0] += 1; } else missed.push({ id, chose: c === undefined ? -1 : c });
  });
  const total = live.length;
  return { correct, total, percent: total ? Math.round((correct / total) * 100) : 0, byDomain, missed, removed: session.ids.length - total };
}

// The answers a finished session adds to history (unanswered questions in a mock or check count as missed).
export function sessionEntries(session, byId, now = Date.now()) {
  const m = MODES[session.kind];
  const out = [];
  session.ids.forEach((id) => {
    const q = byId[id];
    if (!q) return;
    const c = session.answers[id];
    if (c === undefined && session.feedback) return; // practice: only what he answered
    out.push([id, { t: now, c: c === undefined ? -1 : c, ok: c === q.answer, m }]);
  });
  return out;
}

export function addEntries(state, entries) {
  const s = normalizeExamState(state);
  entries.forEach(([id, e]) => { s.hist[id] = [...(s.hist[id] || []), e].slice(-HISTORY_CAP); });
  return s;
}

// Finish a mock or check: score it, add every answer to history once, keep the attempt, clear the session.
export function finishExamSession(state, byId, now = Date.now()) {
  const s = normalizeExamState(state);
  const session = s.session;
  if (!session || !['mock', 'check'].includes(session.kind)) return { state: s, attempt: null };
  const score = scoreSession(session, byId);
  const attempt = {
    id: session.id, kind: session.kind, ids: session.ids, answers: session.answers, startedAt: session.startedAt, finishedAt: now,
    seconds: Math.round(session.elapsedMs / 1000), overTime: session.limitMs > 0 && session.elapsedMs > session.limitMs,
    correct: score.correct, total: score.total, percent: score.percent, byDomain: score.byDomain, removed: score.removed,
  };
  if (session.kind === 'check' && session.domain) attempt.domain = session.domain;
  const next = addEntries(s, sessionEntries(session, byId, now));
  next.attempts = [...next.attempts, attempt].slice(-ATTEMPTS_CAP);
  next.session = null;
  return { state: normalizeExamState(next), attempt };
}

// ---------- where he stands ----------
export function domainStats(questions, state, n) {
  const qs = questions.filter((q) => String(q.d) === String(n));
  const seen = qs.filter((q) => answered(state, q.id));
  const right = seen.filter((q) => latestAnswer(state, q.id).ok).length;
  return { total: qs.length, practice: qs.filter((q) => !q.checkOnly).length, seen: seen.length, right, accuracy: seen.length ? Math.round((right / seen.length) * 100) : null };
}

export function objectiveStats(questions, state, obj) {
  const qs = questions.filter((q) => q.obj === obj);
  const seen = qs.filter((q) => answered(state, q.id));
  const wrong = seen.filter((q) => !latestAnswer(state, q.id).ok).length;
  return { total: qs.length, seen: seen.length, wrong, accuracy: seen.length ? Math.round(((seen.length - wrong) / seen.length) * 100) : null };
}

// What to study first: objectives ranked by questions missed on the latest answer x the domain's weight per objective.
export function studyFirst(questions, state, blueprint, n = 3) {
  return blueprint.domains.flatMap((d) => d.objectives.map((o) => {
    const st = objectiveStats(questions, state, o.id);
    return { ...o, domain: d.n, ...st, score: st.wrong * (d.weight / d.objectives.length) };
  })).filter((x) => x.wrong > 0).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, n);
}

// Readiness from full mocks only. `ready` = his last three mocks all at or above the target.
export function readiness(state, questions, target) {
  const mocks = state.attempts.filter((a) => a.kind === 'mock' && a.removed === 0);
  const last3 = mocks.slice(-3);
  const avg = (list) => (list.length ? Math.round(list.reduce((s, a) => s + a.percent, 0) / list.length) : null);
  const seenIds = new Set(Object.keys(state.hist));
  return {
    mocks: mocks.length,
    last: mocks.length ? mocks[mocks.length - 1].percent : null,
    previous: mocks.length > 1 ? mocks[mocks.length - 2].percent : null,
    best: mocks.length ? Math.max(...mocks.map((a) => a.percent)) : null,
    avg3: avg(last3),
    ready: last3.length === 3 && last3.every((a) => a.percent >= target),
    coverage: questions.length ? Math.round((questions.filter((q) => seenIds.has(q.id)).length / questions.length) * 100) : 0,
    seen: questions.filter((q) => seenIds.has(q.id)).length,
  };
}

// Pass rate per domain over his last three mocks, for "subject average of last 3".
export function domainAverages(state, n = 3) {
  const mocks = state.attempts.filter((a) => a.kind === 'mock').slice(-n);
  const sums = {};
  mocks.forEach((a) => Object.entries(a.byDomain).forEach(([d, [c, t]]) => { sums[d] = sums[d] || [0, 0]; sums[d][0] += c; sums[d][1] += t; }));
  return Object.fromEntries(Object.entries(sums).map(([d, [c, t]]) => [d, t ? Math.round((c / t) * 100) : null]));
}

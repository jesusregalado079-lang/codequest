// CodeQuest Pro multi-exam practice: the four exams' blueprints and banks follow their rules, the generated indexes
// match the banks and the labs catalog, old Security+ links map to their new routes, each exam's saved state is
// independent and travels in backups (unknown exams too), his existing Security+ state loads unchanged, the three new
// "Ready" badges follow the exam-ready rule for their own exam only, and labs carry per-exam objectives.
// Run: node test/pro-exams.test.js
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const memory = new Map();
globalThis.localStorage = {
  getItem: (k) => (memory.has(k) ? memory.get(k) : null),
  setItem: (k, v) => { memory.set(k, String(v)); },
  removeItem: (k) => { memory.delete(k); },
};
const KEY = 'codequest-pro-v1';
const reset = (state) => { memory.clear(); if (state !== undefined) memory.set(KEY, JSON.stringify(state)); };

const { BLUEPRINTS, SECPLUS_801, domainOfObj } = await import('../src/pro/exam/blueprints.js');
const { EXAMS, DEFAULT_EXAM, examById } = await import('../src/pro/exam/registry.js');
const { BANK_LOADERS } = await import('../src/pro/exam/loaders.js');
const { examRoute } = await import('../src/pro/exam/routes.js');
const { examSummaries, examSummary, summarize } = await import('../src/pro/exam/summary.js');
const L = await import('../src/pro/exam/exam-logic.js');
const progress = await import('../src/pro/progress.js');
const tools = await import('../src/pro/exam/tools/build-index.mjs');
const { LABS, labsForObjectives: catalogLabsFor, objsFor, normalizeExamObjs } = await import('../src/pro/labs/catalog.js');
const labIndex = await import('../src/pro/ui/labs/summary.js');
const { labSummary } = await import('../src/pro/labs/lab-logic.js');
const { getLabs } = progress;
const { default: full, extras, milestones, gate } = await import('../src/pro/career-path.js');
const { default: stages } = await import('../src/pro/expedited-path.js');
const { achievements, journey, BADGES } = await import('../src/pro/career-logic.js');
const secplus = await import('../src/pro/exam/secplus-801.js');

// ---------- registry and blueprints ----------
const ORDER = ['secplus-801', 'netplus-009', 'aplus-1201', 'aplus-1202'];
assert.deepEqual(EXAMS.map((e) => e.id), ORDER, 'four exams in display order, Security+ first');
assert.deepEqual(BLUEPRINTS.map((b) => b.id), ORDER);
assert.equal(DEFAULT_EXAM, 'secplus-801');
assert.equal(new Set(BLUEPRINTS.map((b) => b.prefix)).size, 4, 'question id prefixes unique');
assert.equal(new Set(BLUEPRINTS.map((b) => b.short)).size, 4, 'short names unique');
assert.deepEqual(Object.keys(BANK_LOADERS), ORDER, 'one lazy bank loader per exam');
assert.equal(examById('nope'), null);
assert.strictEqual(secplus.blueprint, SECPLUS_801, 'secplus-801.js serves the shared Security+ blueprint');

const FACTS = {
  'secplus-801': { code: 'SY0-801', passScore: 750, weights: [16, 24, 19, 27, 14], objectives: 27 },
  'netplus-009': { code: 'N10-009', passScore: 720, weights: [23, 20, 19, 14, 24], objectives: 25, launched: '2024-06-20', retiresEst: '2027' },
  'aplus-1201': { code: '220-1201', passScore: 675, weights: [13, 23, 25, 11, 28], objectives: 27, launched: '2025-03-25', retiresEst: '2028' },
  'aplus-1202': { code: '220-1202', passScore: 700, weights: [28, 28, 23, 21], objectives: 36, launched: '2025-03-25', retiresEst: '2028' },
};
for (const bp of BLUEPRINTS) {
  const f = FACTS[bp.id];
  assert.ok(Object.isFrozen(bp), `${bp.id}: blueprint frozen`);
  assert.equal(bp.code, f.code, `${bp.id}: exam code`);
  assert.equal(bp.questions, 90, `${bp.id}: 90 questions max`);
  assert.equal(bp.minutes, 90, `${bp.id}: 90 minutes`);
  assert.equal(bp.passScore, f.passScore, `${bp.id}: passing score`);
  assert.ok(bp.passing.startsWith(String(f.passScore)), `${bp.id}: passing text matches the score`);
  assert.equal(bp.target, 85, `${bp.id}: app target 85`);
  assert.ok(/multiple choice/i.test(bp.types) && /performance-based/i.test(bp.types), `${bp.id}: question types`);
  assert.ok(/^https:\/\/www\.comptia\.org\//.test(bp.links.page), `${bp.id}: CompTIA page link`);
  assert.ok(/^https:\/\//.test(bp.links.demo), `${bp.id}: demo link`);
  if (f.launched) {
    assert.equal(bp.launched, f.launched, `${bp.id}: launch date`);
    assert.equal(bp.retiresEst, f.retiresEst, `${bp.id}: estimated retirement`);
  }
  assert.deepEqual(bp.domains.map((d) => d.weight), f.weights, `${bp.id}: published domain weights`);
  assert.equal(bp.domains.reduce((s, d) => s + d.weight, 0), 100, `${bp.id}: weights sum to 100`);
  assert.deepEqual(bp.domains.map((d) => d.n), bp.domains.map((_, i) => i + 1), `${bp.id}: domains numbered 1..n`);
  const objIds = bp.domains.flatMap((d) => d.objectives.map((o) => o.id));
  assert.equal(objIds.length, f.objectives, `${bp.id}: ${f.objectives} objectives`);
  assert.equal(new Set(objIds).size, objIds.length, `${bp.id}: objective ids unique`);
  bp.domains.forEach((d) => d.objectives.forEach((o, i) => {
    assert.equal(o.id, `${d.n}.${i + 1}`, `${bp.id}: objective ${o.id} numbered in order under domain ${d.n}`);
    assert.equal(domainOfObj(o.id), d.n);
    assert.ok(typeof o.label === 'string' && o.label.length > 3 && o.label.length <= 80 && !/[–—]/.test(o.label), `${bp.id} ${o.id}: short label`);
  }));
  assert.equal(Object.values(L.domainQuotas(bp.domains, 90)).reduce((a, b) => a + b, 0), 90, `${bp.id}: mock quotas fill 90`);
}
assert.equal(domainOfObj('1.10'), 1, 'objective 1.10 is domain 1');

// ---------- banks: format rules, every question on a real objective ----------
const DASH = /[–—]/;
const banks = {};
let seedCount = 0;
for (const e of EXAMS) {
  const exam = await e.load();
  banks[e.id] = exam;
  assert.strictEqual(exam.blueprint, e.blueprint, `${e.id}: the bank module carries its blueprint`);
  const bp = e.blueprint;
  const objIds = new Set(bp.domains.flatMap((d) => d.objectives.map((o) => o.id)));
  const idRe = new RegExp(`^(?:seed-)?${bp.prefix}-(\\d+\\.\\d+)-\\d{3}$`);
  const ids = new Set();
  assert.ok(exam.questions.length >= 1, `${e.id}: has questions`);
  exam.questions.forEach((q) => {
    const m = idRe.exec(q.id);
    assert.ok(m, `${q.id}: id format ${bp.prefix}-<obj>-<nnn>`);
    assert.equal(m[1], q.obj, `${q.id}: id names its objective`);
    if (q.id.startsWith('seed-')) seedCount += 1;
    assert.ok(!ids.has(q.id), `${q.id}: unique`); ids.add(q.id);
    assert.ok(objIds.has(q.obj), `${q.id}: objective ${q.obj} exists in ${bp.code}`);
    assert.equal(q.d, domainOfObj(q.obj), `${q.id}: domain from objective`);
    assert.ok(Array.isArray(q.choices) && q.choices.length === 4 && new Set(q.choices).size === 4, `${q.id}: four different choices`);
    assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3, `${q.id}: answer index`);
    assert.ok(typeof q.q === 'string' && q.q.length > 10 && q.q.length <= 400, `${q.id}: question text`);
    assert.ok(typeof q.why === 'string' && q.why.length > 10 && q.why.length <= 400, `${q.id}: explanation`);
    assert.ok(q.choices.every((c) => typeof c === 'string' && c.length > 0 && c.length <= 140), `${q.id}: choice lengths`);
    [0, 1, 2, 3].filter((i) => i !== q.answer).forEach((i) => assert.ok(typeof q.whyNot[String(i)] === 'string' && q.whyNot[String(i)].length <= 200, `${q.id}: why-not for choice ${i}`));
    assert.ok(!(String(q.answer) in q.whyNot), `${q.id}: no why-not on the answer`);
    assert.ok(Array.isArray(q.src) && q.src.length >= 1 && q.src.every((k) => exam.sources[k]), `${q.id}: sources exist`);
    assert.ok(![q.q, q.why, ...q.choices, ...Object.values(q.whyNot)].some((t) => DASH.test(t) || /<[a-z]/i.test(t)), `${q.id}: plain text, no dashes or HTML`);
    assert.ok([1, 2, 3].includes(q.diff), `${q.id}: difficulty 1 to 3`);
    if (q.checkOnly !== undefined) assert.equal(q.checkOnly, true, `${q.id}: checkOnly is true or absent`);
  });
  Object.entries(exam.sources).forEach(([k, v]) => assert.ok(/^[a-z0-9-]+$/.test(k) && Array.isArray(v) && v[0] && /^https:\/\/[^\s"'<>]+$/.test(v[1]), `${e.id} source ${k}`));
  bp.domains.forEach((d) => assert.ok(exam.questions.some((q) => q.d === d.n), `${e.id}: domain ${d.n} has at least one question`));
}
assert.ok(banks['secplus-801'].questions.every((q) => !q.id.startsWith('seed-')), 'Security+ has no seed questions');
assert.equal(banks['secplus-801'].questions.length, secplus.questions.length, 'the registry loads the same Security+ bank');

// seed questions live only in the three seed bank files (and the index generated from them)
const SRC = fileURLToPath(new URL('../src/pro/', import.meta.url));
const allowSeed = new Set(['exam/netplus-009-bank.js', 'exam/aplus-1201-bank.js', 'exam/aplus-1202-bank.js', 'exam/index-data.js']);
const walk = (dir) => readdirSync(dir).flatMap((n) => { const p = join(dir, n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const seedFiles = walk(SRC).filter((p) => /\.(m?js|css|md)$/.test(p) && /seed-(np9|ap1|ap2|sp8)-/.test(readFileSync(p, 'utf8'))).map((p) => p.slice(SRC.length));
assert.deepEqual(seedFiles.filter((p) => !allowSeed.has(p)), [], 'no seed question referenced outside the seed banks');

// ---------- the generated indexes match the banks and the labs catalog ----------
assert.equal(readFileSync(tools.EXAM_INDEX_PATH, 'utf8'), await tools.examIndexSource(), 'src/pro/exam/index-data.js is current (run node src/pro/exam/tools/build-index.mjs)');
assert.equal(readFileSync(tools.LAB_INDEX_PATH, 'utf8'), await tools.labIndexSource(), 'src/pro/ui/labs/catalog-index.js is current (run node src/pro/exam/tools/build-index.mjs)');
for (const e of EXAMS) {
  const qs = banks[e.id].questions;
  assert.deepEqual(e.index.map((q) => q.id), qs.map((q) => q.id), `${e.id}: index ids = bank ids, same order`);
  assert.deepEqual(e.index.map((q) => !!q.checkOnly), qs.map((q) => !!q.checkOnly), `${e.id}: index held-out flags = bank`);
}
assert.deepEqual(labIndex.LAB_LIST.map((l) => [l.id, l.icon, l.name, l.pass, l.cases.map((c) => c.id), l.objs, l.examObjs]),
  LABS.map((l) => [l.id, l.icon, l.name, l.pass, l.cases.map((c) => c.id), l.objs, l.examObjs]), 'labs index = catalog');

// ---------- summaries from the index equal summaries from the full bank ----------
const T0 = Date.parse('2026-10-01T10:00:00');
const now = Date.parse('2026-10-09T10:00:00');
function playedState(exam, seed) {
  const qs = exam.questions;
  let st = L.emptyExamState();
  qs.forEach((q, i) => { if ((i + seed) % 3 !== 0) st = L.addEntries(st, [[q.id, { t: T0 + i * 1000, c: (i + seed) % 2 ? q.answer : (q.answer + 1) % 4, ok: !!((i + seed) % 2), m: 'm' }]]); });
  st.attempts = [70, 88, 90].map((p, i) => ({ id: `m${seed}${i}`, kind: 'mock', ids: [qs[0].id], answers: {}, startedAt: T0 + i, finishedAt: T0 + i + 5, seconds: 5, correct: 0, total: 1, percent: p, byDomain: {} }));
  return L.normalizeExamState(st);
}
for (const e of EXAMS) {
  const exam = banks[e.id];
  const st = playedState(exam, ORDER.indexOf(e.id));
  const s = summarize(e, st, now);
  const r = L.readiness(st, exam.questions, e.blueprint.target, e.blueprint.questions);
  assert.equal(s.seen, r.seen, `${e.id}: seen from index = from bank`);
  assert.equal(s.coverage, r.coverage, `${e.id}: coverage from index = from bank`);
  assert.equal(s.avg3, r.avg3);
  assert.equal(s.due, L.reviewDue(exam.questions, st, now).length, `${e.id}: due from index = from bank`);
  assert.equal(s.total, exam.questions.length);
  assert.equal(s.runAtTarget, 0, `${e.id}: short mocks do not build a target run`);
}

// ---------- routes: old Security+ links keep working ----------
assert.deepEqual(examRoute([]), { hub: true });
assert.deepEqual(examRoute(['']), { hub: true }, '#/exam/ is the hub');
assert.deepEqual(examRoute(['domain', '3']), { redirect: '/exam/secplus-801/domain/3' });
assert.deepEqual(examRoute(['session']), { redirect: '/exam/secplus-801/session' });
assert.deepEqual(examRoute(['result', 'mabc123']), { redirect: '/exam/secplus-801/result/mabc123' });
assert.deepEqual(examRoute(['domain']), { redirect: '/exam/secplus-801/domain' }, 'a bare old domain link lands on the Security+ pages');
assert.deepEqual(examRoute(['netplus-009']), { examId: 'netplus-009', view: '', arg: undefined });
assert.deepEqual(examRoute(['aplus-1202', 'domain', '4']), { examId: 'aplus-1202', view: 'domain', arg: '4' });
assert.deepEqual(examRoute(['aplus-1201', 'session']), { examId: 'aplus-1201', view: 'session', arg: undefined });
assert.deepEqual(examRoute(['secplus-801', 'result', 'x1']), { examId: 'secplus-801', view: 'result', arg: 'x1' });
assert.deepEqual(examRoute(['nope', 'session']), { redirect: '/exam' }, 'unknown exam goes to the hub');
// every redirect lands on a route that parses to a real exam page
['domain/2', 'session', 'result/abc'].forEach((old) => {
  const r = examRoute(old.split('/'));
  const again = examRoute(r.redirect.split('/').slice(2));
  assert.equal(again.examId, 'secplus-801', `#/exam/${old} -> ${r.redirect}`);
});

// ---------- his existing Security+ state loads unchanged ----------
// A save from before multi-exam: only exams['secplus-801'], with history, attempts and an open mock.
const sp = banks['secplus-801'];
const spIds = sp.questions.slice(0, 6).map((q) => q.id);
const spMockIds = sp.questions.slice(0, SECPLUS_801.questions).map((q) => q.id);
const savedSecplus = {
  hist: {
    [spIds[0]]: [{ t: T0, c: 1, ok: false, m: 'p' }, { t: T0 + 86400000, c: sp.questions[0].answer, ok: true, m: 'r' }],
    [spIds[1]]: [{ t: T0 + 5000, c: -1, ok: false, m: 'm' }],
  },
  attempts: [86, 88, 90].map((percent, i) => ({ id: `mk${i + 1}`, kind: 'mock', ids: spMockIds, answers: { [spIds[0]]: 2 }, startedAt: T0 + i * 7200000, finishedAt: T0 + i * 7200000 + 3600000, seconds: 3600, overTime: false, correct: [77, 79, 81][i], total: SECPLUS_801.questions, percent, byDomain: {}, removed: 0 })),
  session: { id: 'mk4', kind: 'mock', ids: spIds.slice(2, 6), orders: Object.fromEntries(spIds.slice(2, 6).map((id) => [id, [3, 1, 0, 2]])), answers: { [spIds[2]]: 1 }, flags: { [spIds[3]]: true }, pos: 1, startedAt: T0 + 21600000, elapsedMs: 120000, title: 'Full mock exam · 4 questions', feedback: false, limitMs: 5400000, domain: null },
};
const savedRoot = { completed: { 'ch1-l1': 10 }, studyDone: { 'p1-x': true }, exams: { 'secplus-801': savedSecplus } };
reset(savedRoot);
assert.deepEqual(progress.getExamState('secplus-801'), savedSecplus, 'his Security+ state loads exactly as saved');
assert.deepEqual(progress.getExamState('netplus-009'), L.emptyExamState(), 'a new exam starts empty');
const sum0 = examSummary();
assert.equal(sum0.id, 'secplus-801', 'examSummary() with no id is still Security+');
assert.equal(sum0.mocks, 3);
assert.equal(sum0.avg3, 88);
assert.equal(sum0.ready, true, 'full-length saved Security+ mocks keep prior readiness');
assert.equal(sum0.runAtTarget, 3, 'full-length saved Security+ mocks keep prior Ready progress');
assert.equal(sum0.seen, 2);
assert.equal(sum0.total, sp.questions.length);
assert.equal(sum0.open, true);
const all0 = examSummaries();
assert.deepEqual(Object.keys(all0), ORDER, 'summaries for every exam, in order');
assert.deepEqual(all0['secplus-801'], sum0);
assert.ok(['netplus-009', 'aplus-1201', 'aplus-1202'].every((id) => all0[id].mocks === 0 && all0[id].seen === 0 && all0[id].avg3 === null));
// saving another exam leaves the Security+ record untouched, byte for byte
assert.equal(progress.saveExamState('netplus-009', playedState(banks['netplus-009'], 1)).ok, true);
assert.deepEqual(JSON.parse(memory.get(KEY)).exams['secplus-801'], savedSecplus, 'Security+ record unchanged after another exam saves');
assert.equal(progress.getExamState('netplus-009').attempts.length, 3);
assert.equal(progress.getExamState('aplus-1201').attempts.length, 0, 'exams are independent');

// ---------- per-exam state independence ----------
reset();
const states = Object.fromEntries(EXAMS.map((e, i) => [e.id, playedState(banks[e.id], i)]));
EXAMS.forEach((e) => assert.equal(progress.saveExamState(e.id, states[e.id]).ok, true));
EXAMS.forEach((e) => assert.deepEqual(progress.getExamState(e.id), states[e.id], `${e.id}: its own state back`));
const ap2 = progress.getExamState('aplus-1202');
ap2.session = L.newSession({ kind: 'practice', ids: [banks['aplus-1202'].questions[0].id], orders: { [banks['aplus-1202'].questions[0].id]: [0, 1, 2, 3] }, title: 'p', now: T0 });
progress.saveExamState('aplus-1202', ap2);
assert.equal(progress.getExamState('aplus-1202').session.kind, 'practice');
['secplus-801', 'netplus-009', 'aplus-1201'].forEach((id) => assert.equal(progress.getExamState(id).session, null, `${id}: another exam's session does not leak`));
assert.deepEqual(Object.keys(progress.getAllExamStates()).sort(), [...ORDER].sort());

// ---------- export / import keeps every exam, including ids this version does not know ----------
const unknown = { hist: { 'zz9-1.1-001': [{ t: T0, c: 2, ok: true, m: 'p' }] }, attempts: [], session: null };
reset({ exams: { ...Object.fromEntries(ORDER.map((id) => [id, states[id]])), 'futurecert-101': unknown } });
assert.deepEqual(progress.getExamState('futurecert-101'), unknown, 'an unknown exam id survives load');
progress.saveExamState('aplus-1201', states['aplus-1201']);
assert.deepEqual(progress.getExamState('futurecert-101'), unknown, '... and a save of another exam');
const file = progress.exportProgress(new Date('2026-10-09T12:00:00Z'));
assert.deepEqual(Object.keys(JSON.parse(file).progress.exams).sort(), [...ORDER, 'futurecert-101'].sort(), 'the backup carries every exam');
reset();
assert.equal(progress.importProgress(file, 'replace').ok, true);
ORDER.forEach((id) => assert.deepEqual(progress.getExamState(id), states[id], `${id}: replace import round-trips`));
assert.deepEqual(progress.getExamState('futurecert-101'), unknown, 'unknown exam round-trips through replace');
// merge: local answers for one exam + the file's for all, unknown exam added
const local = L.addEntries(L.emptyExamState(), [[banks['netplus-009'].questions[0].id, { t: T0 + 999, c: 0, ok: false, m: 'p' }]]);
reset({ exams: { 'netplus-009': local } });
assert.equal(progress.importProgress(file).ok, true);
const mergedNp = progress.getExamState('netplus-009');
assert.ok(mergedNp.hist[banks['netplus-009'].questions[0].id].some((x) => x.t === T0 + 999), 'merge keeps the local answer');
assert.equal(mergedNp.attempts.length, 3, 'merge adds the file attempts');
['secplus-801', 'aplus-1201', 'aplus-1202'].forEach((id) => assert.deepEqual(progress.getExamState(id), states[id], `${id}: merge brings it in`));
assert.deepEqual(progress.getExamState('futurecert-101'), unknown, 'unknown exam survives a merge');

// ---------- badges: three new "Ready" badges, the old ones untouched ----------
const ids = BADGES.map((b) => b.id);
const OLD_EXAM = ['exam-first-mock', 'exam-above-bar', 'exam-ready', 'exam-seen-100', 'exam-seen-all'];
const NEW_EXAM = ['exam-np9-ready', 'exam-ap1-ready', 'exam-ap2-ready'];
assert.deepEqual(ids.slice(ids.indexOf('exam-first-mock'), ids.indexOf('exam-first-mock') + 8), [...OLD_EXAM, ...NEW_EXAM], 'new badges right after the existing exam badges');
assert.equal(ids[ids.indexOf('exam-ap2-ready') + 1], 'lab-first', 'then the lab badges');
assert.equal(new Set(ids).size, ids.length, 'badge ids unique');
const byId = (list, id) => list.find((b) => b.id === id);
assert.deepEqual(NEW_EXAM.map((id) => byId(BADGES, id).name), ['Network+ Ready', 'A+ Core 1 Ready', 'A+ Core 2 Ready']);
assert.ok(NEW_EXAM.every((id) => byId(BADGES, id).group === 'Exam'));
assert.equal(byId(BADGES, 'exam-ready').name, 'Exam Ready', 'Security+ badge keeps its name');
assert.equal(byId(BADGES, 'exam-ready').how, 'Three full mocks in a row at 85% or more', 'and its rule text');

const TODAY = '2026-10-09';
const j = journey({ full, milestones, gate, stages, done: {}, doneAt: {}, hoursPerWeek: 21, todayIso: TODAY });
const mockState = (scores, removed = 0) => L.normalizeExamState({ attempts: scores.map((score, i) => {
  const { percent, total = 90 } = typeof score === 'number' ? { percent: score } : score;
  const retired = i === scores.length - 1 ? removed : 0;
  return { id: `a${i}`, kind: 'mock', ids: Array.from({ length: total + retired }, (_, n) => `q${n}`), answers: {}, startedAt: 1e12 + i, finishedAt: 1e12 + i + 1, seconds: 1, correct: Math.round(percent * total / 100), total, percent, byDomain: {}, removed: retired };
}) });
const ctxFor = (perExam) => {
  const exams = Object.fromEntries(EXAMS.map((e) => [e.id, summarize(e, perExam[e.id] || L.emptyExamState(), now)]));
  return achievements({ done: {}, doneAt: {}, full, extras, stages, gate, j, exam: exams['secplus-801'], exams });
};
const earned = (list) => new Set(list.filter((b) => b.earned).map((b) => b.id));

// three Security+ mocks at the bar: Exam Ready, none of the new ones
let got = earned(ctxFor({ 'secplus-801': mockState([90, 88, 86]) }));
assert.ok(got.has('exam-ready'), 'Security+ 3 in a row earns Exam Ready');
assert.ok(!earned(ctxFor({ 'secplus-801': mockState(Array.from({ length: 3 }, () => ({ percent: 100, total: 8 }))) })).has('exam-ready'), 'Security+ short mocks do not earn Exam Ready');
assert.ok(earned(ctxFor({ 'secplus-801': mockState([90, { percent: 100, total: 8 }, 88, 86]) })).has('exam-ready'), 'Security+ skips a short mock between three full mocks');
NEW_EXAM.forEach((id) => assert.ok(!got.has(id), `${id} never earned by Security+ mocks`));
// each new badge: three in a row at 85 on its own exam
const NEW_FOR = { 'exam-np9-ready': 'netplus-009', 'exam-ap1-ready': 'aplus-1201', 'exam-ap2-ready': 'aplus-1202' };
for (const [badge, examId] of Object.entries(NEW_FOR)) {
  got = earned(ctxFor({ [examId]: mockState([85, 90, 99]) }));
  assert.ok(got.has(badge), `${badge}: 3 in a row at 85+ on ${examId}`);
  const short = summarize(examById(examId), mockState(Array.from({ length: 3 }, () => ({ percent: 100, total: 8 }))), now);
  assert.deepEqual([short.mocks, short.avg3, short.ready, short.runAtTarget], [0, null, false, 0], `${examId}: perfect short mocks do not count`);
  assert.ok(!earned(ctxFor({ [examId]: mockState(Array.from({ length: 3 }, () => ({ percent: 100, total: 8 }))) })).has(badge), `${badge}: short mocks do not earn Ready`);
  const mixed = summarize(examById(examId), mockState([90, { percent: 100, total: 8 }, 88, 86]), now);
  assert.deepEqual([mixed.mocks, mixed.avg3, mixed.ready, mixed.runAtTarget], [3, 88, true, 3], `${examId}: only full mocks count in order`);
  assert.ok(earned(ctxFor({ [examId]: mockState([90, { percent: 100, total: 8 }, 88, 86]) })).has(badge), `${badge}: mixed history earns Ready from full mocks`);
  assert.ok(!got.has('exam-ready') && !got.has('exam-first-mock'), `${badge}: ${examId} mocks do not earn Security+ badges`);
  NEW_EXAM.filter((x) => x !== badge).forEach((x) => assert.ok(!got.has(x), `${examId} mocks do not earn ${x}`));
  assert.ok(!earned(ctxFor({ [examId]: mockState([90, 84, 99]) })).has(badge), `${badge}: a mock below 85 breaks the run`);
  assert.ok(!earned(ctxFor({ [examId]: mockState([90, 99]) })).has(badge), `${badge}: two mocks are not enough`);
  assert.ok(earned(ctxFor({ [examId]: mockState([60, 86, 87, 88]) })).has(badge), `${badge}: only the latest three count`);
  assert.ok(!earned(ctxFor({ [examId]: mockState([86, 87, 88], 1) })).has(badge), `${badge}: a mock with retired questions does not count`);
  const prog = byId(ctxFor({ [examId]: mockState([86, 87]) }), badge);
  assert.deepEqual([prog.have, prog.need, prog.date], [2, 3, null], `${badge}: shows 2 of 3, no date`);
}
// no ctx.exams (or junk): no progress, never a crash
for (const junk of [undefined, null, 'x', {}, { 'netplus-009': 'bad' }]) {
  const list = achievements({ done: {}, doneAt: {}, full, extras, stages, gate, j, ...(junk === undefined ? {} : { exams: junk }) });
  NEW_EXAM.forEach((id) => { const b = byId(list, id); assert.equal(b.earned, false); assert.equal(b.have, 0); assert.equal(b.need, 3); });
}

// ---------- labs: per-exam objectives ----------
assert.deepEqual(normalizeExamObjs({ 'netplus-009': ['5.3', '5.3', '1.10', 'x', 4], aplus: [], __proto__: ['1.1'], 'BAD ID': ['1.1'] }), { 'netplus-009': ['1.10', '5.3'] }, 'examObjs normalized: deduped, sorted, junk dropped');
assert.deepEqual(normalizeExamObjs('nope'), {});
assert.deepEqual(normalizeExamObjs(null), {});
const examObjIds = Object.fromEntries(BLUEPRINTS.map((bp) => [bp.id, new Set(bp.domains.flatMap((d) => d.objectives.map((o) => o.id)))]));
for (const lab of LABS) {
  // the lab's per-exam set is exactly the union of its cases' sets
  const union = {};
  lab.cases.forEach((c) => Object.entries(c.examObjs).forEach(([k, v]) => { union[k] = new Set([...(union[k] || []), ...v]); }));
  assert.deepEqual(Object.keys(lab.examObjs).sort(), Object.keys(union).sort(), `${lab.id}: examObjs covers the exams its cases name`);
  Object.entries(lab.examObjs).forEach(([k, objs]) => {
    assert.deepEqual([...objs].sort(), [...union[k]].sort(), `${lab.id}: ${k} objectives = union of its cases`);
    if (examObjIds[k]) objs.forEach((o) => assert.ok(examObjIds[k].has(o), `${lab.id}: ${k} ${o} is a real objective`));
  });
  assert.deepEqual(objsFor(lab, 'secplus-801'), lab.objs, `${lab.id}: Security+ keeps using objs`);
  assert.deepEqual(objsFor(lab), lab.objs, `${lab.id}: no exam id means Security+`);
}
assert.deepEqual(objsFor(LABS.find((l) => l.id === 'subnet'), 'netplus-009'), ['1.7'], 'Subnet Sprint practices Network+ 1.7');
// the exam pages' lookup (index) and the catalog agree for every objective of every exam
for (const bp of BLUEPRINTS) {
  for (const o of examObjIds[bp.id]) {
    assert.deepEqual(labIndex.labsForObjectives([o], bp.id).map((l) => l.id), catalogLabsFor([o], bp.id).map((l) => l.id), `${bp.id} ${o}: index and catalog agree`);
  }
}
assert.deepEqual(catalogLabsFor(['3.1']).map((l) => l.id), catalogLabsFor(['3.1'], 'secplus-801').map((l) => l.id), 'old call without an exam id = Security+');
assert.ok(EXAMS.some((e) => e.id !== 'secplus-801' && LABS.some((l) => objsFor(l, e.id).length)), 'at least one lab is tagged for another exam');
// the labs summary from the index = the summary from the catalog
reset({ labs: { 'fw/fw-01': [{ t: T0, score: 90, secs: 5 }], 'subnet/subnet-2': [{ t: T0, score: 100, secs: 5 }] } });
assert.deepEqual(labIndex.labsSummary(), labSummary(getLabs(), LABS), 'labs summary from the index = from the catalog');

console.log(`ok — pro exams: ${EXAMS.length} exams (${EXAMS.map((e) => `${e.blueprint.short} ${banks[e.id].questions.length}`).join(', ')}; ${seedCount} seed questions), indexes current, legacy routes, per-exam state, backups with unknown exams, Security+ state unchanged, ${NEW_EXAM.length} new badges, labs per-exam objectives`);

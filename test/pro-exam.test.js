// CodeQuest Pro exam practice (Security+ SY0-801): the bank follows its rules, mocks are drawn by the official weights,
// held-out questions stay out of practice, the review queue spaces right answers, scoring and saving survive damage.
// Run: npm test
import assert from 'node:assert/strict';

const memory = new Map();
globalThis.localStorage = {
  getItem: (k) => (memory.has(k) ? memory.get(k) : null),
  setItem: (k, v) => { memory.set(k, String(v)); },
  removeItem: (k) => { memory.delete(k); },
};

const L = await import('../src/pro/exam/exam-logic.js');
const { blueprint: bp, questions: bank, sources: bankSources } = await import('../src/pro/exam/secplus-801.js');
const progress = await import('../src/pro/progress.js');

// a seeded random source so draws are repeatable in tests
const seeded = (seed) => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };

// ---------- the blueprint ----------
assert.equal(bp.domains.reduce((s, d) => s + d.weight, 0), 100, 'domain weights add to 100');
assert.deepEqual(bp.domains.map((d) => d.weight), [16, 24, 19, 27, 14], 'SY0-801 weights as published');
assert.equal(bp.domains.flatMap((d) => d.objectives).length, 27, '27 objectives');
assert.equal(bp.questions, 90);
assert.equal(bp.minutes, 90);

// ---------- quotas ----------
const q90 = L.domainQuotas(bp.domains, 90);
assert.deepEqual(q90, { 1: 14, 2: 22, 3: 17, 4: 24, 5: 13 }, 'largest remainder on 16/24/19/27/14');
assert.equal(Object.values(q90).reduce((a, b) => a + b, 0), 90);
assert.equal(Object.values(L.domainQuotas(bp.domains, 40)).reduce((a, b) => a + b, 0), 40);

// ---------- a made-up bank: 8 questions per objective, every 4th held out ----------
const fixture = bp.domains.flatMap((d) => d.objectives.flatMap((o) => Array.from({ length: 8 }, (_, i) => ({
  id: `t-${o.id}-${i}`, obj: o.id, d: d.n, q: `Q ${o.id} ${i}`, choices: ['a', 'b', 'c', 'd'], answer: i % 4, why: 'w', whyNot: {}, src: [], ...(i % 4 === 3 ? { checkOnly: true } : {}),
}))));
const byId = Object.fromEntries(fixture.map((q) => [q.id, q]));
const empty = L.emptyExamState();

// ---------- drawing a mock ----------
const draw = L.drawExam({ questions: fixture, domains: bp.domains, state: empty, total: 90, rng: seeded(7) });
assert.equal(draw.ids.length, 90);
assert.equal(new Set(draw.ids).size, 90, 'no question twice');
const perDomain = {};
draw.ids.forEach((id) => { perDomain[byId[id].d] = (perDomain[byId[id].d] || 0) + 1; });
assert.deepEqual(perDomain, q90, 'each domain gets its quota');
for (const d of bp.domains) {
  const counts = d.objectives.map((o) => draw.ids.filter((id) => byId[id].obj === o.id).length);
  assert.ok(Math.max(...counts) - Math.min(...counts) <= 1, `domain ${d.n}: spread evenly over its objectives (${counts})`);
}
assert.ok(draw.ids.some((id) => byId[id].checkOnly), 'mocks include held-out questions');
assert.ok(draw.ids.every((id) => [0, 1, 2, 3].every((i) => draw.orders[id].includes(i))), 'every question has a full choice order');
assert.deepEqual(L.drawExam({ questions: fixture, domains: bp.domains, state: empty, total: 90, rng: seeded(7) }), draw, 'same seed, same draw');
assert.notDeepEqual(L.drawExam({ questions: fixture, domains: bp.domains, state: empty, total: 90, rng: seeded(8) }).ids, draw.ids, 'a new draw differs');

// after a finished mock, the next one prefers questions never shown
let state = L.emptyExamState();
state.session = L.newSession({ kind: 'mock', ids: draw.ids, orders: draw.orders, title: 'mock', now: 1_800_000_000_000, limitMs: 90 * 60000, rng: seeded(1) });
draw.ids.slice(0, 60).forEach((id) => { state.session.answers[id] = byId[id].answer; }); // 60 right, 30 unanswered
const fin = L.finishExamSession(state, byId, 1_800_000_100_000);
state = fin.state;
assert.equal(fin.attempt.correct, 60);
assert.equal(fin.attempt.total, 90);
assert.equal(fin.attempt.percent, 67);
assert.equal(state.session, null, 'the session closes');
assert.equal(Object.keys(state.hist).length, 90, 'every mock question enters history once, unanswered as missed');
assert.equal(state.hist[draw.ids[89]][0].c, -1);
assert.equal(state.hist[draw.ids[89]][0].ok, false);
assert.equal(state.hist[draw.ids[0]][0].m, 'm');
assert.deepEqual(Object.values(fin.attempt.byDomain).reduce((s, [c, t]) => [s[0] + c, s[1] + t], [0, 0]), [60, 90]);
const draw2 = L.drawExam({ questions: fixture, domains: bp.domains, state, total: 90, rng: seeded(9) });
for (const d of bp.domains) {
  const fresh = fixture.filter((q) => q.d === d.n && !draw.ids.includes(q.id)).length;
  const inDraw2 = draw2.ids.filter((id) => byId[id].d === d.n);
  const freshInDraw2 = inDraw2.filter((id) => !draw.ids.includes(id)).length;
  assert.equal(freshInDraw2, Math.min(fresh, inDraw2.length), `domain ${d.n}: unseen questions come first`);
}
// within the seen ones, the missed (unanswered) come before the right ones
const seenInDraw2 = draw2.ids.filter((id) => draw.ids.includes(id));
if (seenInDraw2.length) {
  const missedFirst = seenInDraw2.filter((id) => !state.hist[id][0].ok).length;
  assert.ok(missedFirst >= Math.min(seenInDraw2.length, 1), 'missed questions are preferred among repeats');
}

// a domain check: only that domain
const chk = L.drawExam({ questions: fixture, domains: bp.domains, state: empty, total: 15, onlyDomain: 4, rng: seeded(3) });
assert.equal(chk.ids.length, 15);
assert.ok(chk.ids.every((id) => byId[id].d === 4));

// ---------- practice: held-out stays out until met ----------
const held = fixture.find((q) => q.checkOnly);
assert.equal(L.visibleInPractice(held, empty), false, 'a held-out question is not practiced before it is met');
assert.equal(L.visibleInPractice(held, L.addEntries(empty, [[held.id, { t: 1_800_000_000_000, c: 0, ok: false, m: 'm' }]])), true, '... and is once he has met it');

// practice order: missed latest, then never answered, then right
const three = fixture.slice(0, 3);
const ordered = L.practiceOrder(three, L.addEntries(empty, [[three[0].id, { t: 1, c: three[0].answer, ok: true, m: 'p' }], [three[2].id, { t: 2, c: 9 % 4, ok: false, m: 'p' }]]));
assert.deepEqual(ordered.map((q) => q.id), [three[2].id, three[1].id, three[0].id]);

// ---------- review queue ----------
const DAY = 86400000;
const now = Date.parse('2026-10-08T15:00:00');
const qa = fixture[0];
const at = (daysAgo) => now - daysAgo * DAY;
const st = (entries) => L.addEntries(empty, entries.map(([ok, daysAgo]) => [qa.id, { t: at(daysAgo), c: ok ? qa.answer : (qa.answer + 1) % 4, ok, m: 'p' }]));
assert.equal(L.reviewDue([qa], st([[false, 0]]), now).length, 1, 'missed: due now');
assert.equal(L.reviewDue([qa], st([[true, 0]]), now).length, 0, 'right once today: not yet');
assert.equal(L.reviewDue([qa], st([[true, 1]]), now).length, 1, 'right once: due after 1 day');
assert.equal(L.reviewDue([qa], st([[true, 3], [true, 2]]), now).length, 0, 'right twice: not due after 2 days');
assert.equal(L.reviewDue([qa], st([[true, 5], [true, 3]]), now).length, 1, 'right twice: due after 3 days');
assert.equal(L.reviewDue([qa], st([[true, 40], [true, 30], [true, 20], [true, 13]]), now).length, 0, 'four in a row: 14 days');
assert.equal(L.reviewDue([qa], st([[true, 40], [true, 30], [true, 20], [true, 14]]), now).length, 1);
assert.equal(L.reviewDue([qa], st([[true, 9], [false, 8], [true, 2]]), now).length, 1, 'a miss resets the run');
assert.equal(L.reviewDue([held], L.emptyExamState(), now).length, 0, 'never answered is not in review');

// ---------- readiness and study first ----------
const withMocks = (pcts) => L.normalizeExamState({ attempts: pcts.map((p, i) => ({ id: `m${i}`, kind: 'mock', ids: ['x'], answers: {}, startedAt: 1e12 + i, finishedAt: 1e12 + i + 1, seconds: 10, correct: 0, total: 1, percent: p, byDomain: {} })) });
assert.equal(L.readiness(withMocks([90, 88, 86]), fixture, 85).ready, true);
assert.equal(L.readiness(withMocks([90, 84, 86]), fixture, 85).ready, false);
assert.equal(L.readiness(withMocks([70, 90, 88, 86]), fixture, 85).ready, true, 'only the last three count');
assert.equal(L.readiness(withMocks([88, 86]), fixture, 85).ready, false, 'three mocks needed');
assert.equal(L.readiness(withMocks([80, 90, 85]), fixture, 85).avg3, 85);
assert.equal(L.readiness(L.emptyExamState(), fixture, 85).avg3, null);
const missedState = L.addEntries(empty, fixture.filter((q) => q.obj === '4.8').slice(0, 3).map((q) => [q.id, { t: 1, c: (q.answer + 1) % 4, ok: false, m: 'p' }])
  .concat(fixture.filter((q) => q.obj === '5.6').slice(0, 3).map((q) => [q.id, { t: 1, c: (q.answer + 1) % 4, ok: false, m: 'p' }])));
const first = L.studyFirst(fixture, missedState, bp);
assert.equal(first[0].id, '4.8', 'same misses: the heavier-weighted objective comes first');
assert.equal(first.length, 2);

// ---------- saved state survives damage ----------
assert.deepEqual(L.normalizeExamState(null), L.emptyExamState());
assert.deepEqual(L.normalizeExamState({ hist: 'x', attempts: 5, session: 'y' }), L.emptyExamState());
const damaged = L.normalizeExamState({
  hist: { good: [{ t: 5, c: 1, ok: true, m: 'p' }, { t: 'x', c: 1, ok: true, m: 'p' }, { t: 6, c: 7, ok: true, m: 'p' }], __proto__: [] },
  session: { id: 's1', kind: 'mock', ids: ['a', 'b'], orders: { a: [0, 1, 2, 3], b: [0, 0, 1, 2] }, startedAt: 5 },
});
assert.deepEqual(damaged.hist, { good: [{ t: 5, c: 1, ok: true, m: 'p' }] }, 'bad answers dropped, good kept');
assert.equal(damaged.session, null, 'a session with a broken choice order is dropped');
const long = L.addEntries(empty, Array.from({ length: 30 }, (_, i) => [qa.id, { t: i + 1, c: 0, ok: true, m: 'p' }]));
assert.equal(long.hist[qa.id].length, L.HISTORY_CAP, 'history is capped per question');
assert.equal(withMocks(Array.from({ length: 30 }, () => 50)).attempts.length, L.ATTEMPTS_CAP, 'attempts are capped');
const merged = L.mergeExamState(st([[true, 3]]), L.addEntries(st([[true, 3]]), [[qa.id, { t: at(1), c: qa.answer, ok: true, m: 'r' }]]));
assert.equal(merged.hist[qa.id].length, 2, 'merging backups keeps every answer once');

// a retired question in an attempt is not scored
const sess = L.newSession({ kind: 'check', ids: [fixture[0].id, 'retired-id'], orders: { [fixture[0].id]: [0, 1, 2, 3], 'retired-id': [0, 1, 2, 3] }, title: 'c', domain: 1, now: 1e12 });
sess.answers[fixture[0].id] = fixture[0].answer;
const f2 = L.finishExamSession({ ...L.emptyExamState(), session: sess }, byId, 1e12 + 5);
assert.equal(f2.attempt.total, 1);
assert.equal(f2.attempt.removed, 1);
assert.equal(f2.attempt.percent, 100);
assert.equal(f2.attempt.domain, 1);

// ---------- stored with his progress, in his backups ----------
memory.clear();
assert.deepEqual(progress.getExamState('secplus-801'), L.emptyExamState());
assert.equal(progress.saveExamState('secplus-801', state).ok, true);
assert.equal(progress.getExamState('secplus-801').attempts.length, 1);
const file = progress.exportProgress();
memory.clear();
progress.importProgress(file, 'replace');
assert.equal(progress.getExamState('secplus-801').attempts[0].percent, 67, 'a backup carries exam practice');
memory.set('codequest-pro-v1', JSON.stringify({ studyDone: { a: true }, exams: { 'secplus-801': { hist: 7, attempts: [{ junk: 1 }], session: { kind: 'nope' } } } }));
assert.deepEqual(progress.getExamState('secplus-801'), L.emptyExamState(), 'damaged exam data never breaks loading');
assert.equal(progress.isStudyDone('a'), true, '... and the rest of the save is kept');

// ---------- the real bank follows its rules ----------
const DASH = /[–—]/;
const objIds = new Set(bp.domains.flatMap((d) => d.objectives.map((o) => o.id)));
const ids = new Set();
bank.forEach((q) => {
  assert.ok(/^sp8-[1-5]\.[1-8]-\d{3}$/.test(q.id), `${q.id}: id format`);
  assert.ok(!ids.has(q.id), `${q.id}: unique`); ids.add(q.id);
  assert.ok(objIds.has(q.obj), `${q.id}: objective ${q.obj} exists`);
  assert.equal(q.d, Number(q.obj[0]), `${q.id}: domain matches objective`);
  assert.ok(Array.isArray(q.choices) && q.choices.length === 4 && new Set(q.choices).size === 4, `${q.id}: four different choices`);
  assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3, `${q.id}: answer index`);
  assert.ok(typeof q.q === 'string' && q.q.length > 10 && q.q.length <= 400, `${q.id}: question text`);
  assert.ok(typeof q.why === 'string' && q.why.length > 10 && q.why.length <= 400, `${q.id}: explanation`);
  assert.ok(q.choices.every((c) => typeof c === 'string' && c.length > 0 && c.length <= 140), `${q.id}: choice lengths`);
  [0, 1, 2, 3].filter((i) => i !== q.answer).forEach((i) => assert.ok(typeof q.whyNot[String(i)] === 'string' && q.whyNot[String(i)].length <= 200, `${q.id}: why-not for choice ${i}`));
  assert.ok(!(String(q.answer) in q.whyNot), `${q.id}: no why-not on the answer`);
  assert.ok(Array.isArray(q.src) && q.src.length >= 1 && q.src.every((k) => bankSources[k]), `${q.id}: sources exist`);
  assert.ok(![q.q, q.why, ...q.choices, ...Object.values(q.whyNot)].some((t) => DASH.test(t) || /<[a-z]/i.test(t)), `${q.id}: plain text, no dashes or HTML`);
  assert.ok([1, 2, 3].includes(q.diff), `${q.id}: difficulty 1 to 3`);
});
Object.entries(bankSources).forEach(([k, v]) => assert.ok(/^[a-z0-9-]+$/.test(k) && Array.isArray(v) && v[0] && /^https:\/\/[^\s"'<>]+$/.test(v[1]), `source ${k}`));
if (bank.length) {
  // enough for real mocks: every objective covered, every domain can fill its quota with spare
  objIds.forEach((o) => assert.ok(bank.filter((q) => q.obj === o).length >= 5, `objective ${o} has at least 5 questions`));
  bp.domains.forEach((d) => assert.ok(bank.filter((q) => q.d === d.n).length >= q90[d.n] + 10, `domain ${d.n} can fill a mock with room to vary`));
  // no answer-position or length tell
  const pos = [0, 1, 2, 3].map((i) => bank.filter((q) => q.answer === i).length / bank.length);
  assert.ok(pos.every((p) => p >= 0.18 && p <= 0.32), `answer positions balanced (${pos.map((p) => p.toFixed(2))})`);
  const longest = bank.filter((q) => q.choices[q.answer].length >= Math.max(...q.choices.map((c) => c.length))).length / bank.length;
  assert.ok(longest <= 0.4, `the answer is the longest choice in ${Math.round(longest * 100)}% of questions (max 40%)`);
  const heldShare = bank.filter((q) => q.checkOnly).length / bank.length;
  assert.ok(heldShare >= 0.15 && heldShare <= 0.35, `held-out share ${Math.round(heldShare * 100)}%`);
}

console.log(`ok — pro exam: SY0-801 blueprint and quotas, weighted fresh mock draws, held-out kept out of practice, spaced review, readiness, scoring, damaged saves, backups, bank rules (${bank.length} questions)`);

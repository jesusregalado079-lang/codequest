// A+ labs: catalog registration, the generated labs index, the labs summary (group, mastered), runs with mode and
// assisted, the A+ badges (sticky, after the existing lab badges) and the unchanged Security+ lab badges.
// Run: node test/pro-aplus-labs.test.js
import assert from 'node:assert/strict';

const memory = new Map();
globalThis.localStorage = {
  getItem: (k) => (memory.has(k) ? memory.get(k) : null),
  setItem: (k, v) => { memory.set(k, String(v)); },
  removeItem: (k) => { memory.delete(k); },
};

const { LABS, LAB_SOURCES, caseOf, isAplus, labOf, labsForObjectives } = await import('../src/pro/labs/catalog.js');
const { recordRun, mergeLabs, labSummary, isPassed, isMastered, bestScore, normalizeLabs, RUNS_CAP } = await import('../src/pro/labs/lab-logic.js');
const { default: LAB_INDEX } = await import('../src/pro/ui/labs/catalog-index.js');
const tools = await import('../src/pro/exam/tools/build-index.mjs');
const { readFileSync } = await import('node:fs');
const { BLUEPRINTS } = await import('../src/pro/exam/blueprints.js');
const progress = await import('../src/pro/progress.js');
const { default: full, extras, milestones, gate } = await import('../src/pro/career-path.js');
const { default: stages } = await import('../src/pro/expedited-path.js');
const { achievements, journey, BADGES } = await import('../src/pro/career-logic.js');

const content = {
  win: await import('../src/pro/labs/aplus/content/win-cases.js'),
  shell: await import('../src/pro/labs/aplus/content/shell-cases.js'),
  build: await import('../src/pro/labs/aplus/content/build-cases.js'),
  router: await import('../src/pro/labs/aplus/content/router-cases.js'),
  order: await import('../src/pro/labs/aplus/content/order-cases.js'),
  mobprint: await import('../src/pro/labs/aplus/content/mobprint-cases.js'),
};
const KINDS = { win: 'sim', shell: 'shell', build: 'pcbuild', router: 'sim', order: 'order', mobprint: 'sim' };
const NAMES = { win: 'Windows Tool Finder', shell: 'Command Line Fixer', build: 'PC Build Bench', router: 'SOHO Router Setup', order: 'Fix It In Order', mobprint: 'Mobile & Printer Fixes' };

// ---------- catalog ----------
const APLUS = LABS.filter(isAplus);
assert.deepEqual(APLUS.map((l) => l.id), ['win', 'shell', 'build', 'router', 'order', 'mobprint'], 'six A+ labs in order');
assert.deepEqual(LABS.slice(0, 6).map((l) => l.id), ['fw', 'logs', 'subnet', 'cli', 'phish', 'code'], 'the Security+ labs keep their order and position');
for (const lab of APLUS) {
  const src = content[lab.id];
  assert.equal(lab.group, 'aplus');
  assert.equal(lab.kind, KINDS[lab.id], `${lab.id}: kind`);
  assert.equal(lab.name, NAMES[lab.id], `${lab.id}: name`);
  assert.equal(lab.pass, 80, `${lab.id}: pass 80`);
  assert.ok(lab.icon && lab.blurb, `${lab.id}: icon and blurb`);
  assert.deepEqual(lab.cases.map((c) => c.id), src.default.map((c) => c.id), `${lab.id}: cases read from the content file, in order`);
  for (const c of lab.cases) {
    const raw = src.default.find((x) => x.id === c.id);
    assert.equal(c.level, raw.level, `${c.id}: level`);
    assert.deepEqual(c.objs, (raw.objs || []).map(String), `${c.id}: objs`);
    assert.ok(Object.keys(c.examObjs).length > 0, `${c.id}: practices at least one exam objective`);
    Object.entries(c.examObjs).forEach(([k, objs]) => {
      const bp = BLUEPRINTS.find((b) => b.id === k);
      assert.ok(bp, `${c.id}: ${k} is a known exam`);
      objs.forEach((o) => assert.ok(bp.domains.some((d) => d.objectives.some((x) => x.id === o)), `${c.id}: ${k} ${o} is a real objective`));
    });
    assert.equal(caseOf(lab.id, c.id), raw, `${c.id}: caseOf returns the full content case`);
    if (raw.minutes) assert.equal(c.minutes, raw.minutes, `${c.id}: minutes`);
  }
  assert.equal(LAB_SOURCES[lab.id], src.sources, `${lab.id}: sources`);
  assert.equal(lab.primer, src.primer, `${lab.id}: primer`);
  assert.equal(lab.terms, src.terms, `${lab.id}: terms`);
  assert.ok(lab.primer && Array.isArray(lab.primer.sections) && lab.primer.sections.length, `${lab.id}: primer sections`);
  lab.primer.sections.forEach((sec) => {
    const body = Array.isArray(sec.body) ? sec.body : [sec.body];
    body.forEach((it) => assert.ok(typeof it === 'string' || (Array.isArray(it) && it.every((row) => Array.isArray(row) && row.every((cell) => typeof cell === 'string'))), `${lab.id}: primer "${sec.h}" body is text or tables`));
  });
  assert.equal(labOf(lab.id), lab);
}
// A+ exam domain pages list the A+ labs through examObjs
assert.ok(labsForObjectives(['1.4'], 'aplus-1202').some((l) => l.id === 'win'), 'Windows Tool Finder practices A+ Core 2 1.4');
assert.ok(labsForObjectives(['3.3'], 'aplus-1201').some((l) => l.id === 'build'), 'PC Build Bench practices A+ Core 1 3.3');
assert.ok(!labsForObjectives(['1.1', '2.1', '3.1', '4.1', '5.1']).some(isAplus), 'no A+ lab shows on Security+ pages (no SY0-801 objs)');

// ---------- generated index ----------
assert.equal(readFileSync(tools.LAB_INDEX_PATH, 'utf8'), await tools.labIndexSource(), 'catalog-index.js is current');
assert.equal(readFileSync(tools.LAB_META_PATH, 'utf8'), await tools.labMetaSource(), 'catalog-meta.js is current (run node src/pro/exam/tools/build-index.mjs)');
const { default: META } = await import('../src/pro/ui/labs/catalog-meta.js');
for (const lab of LABS) {
  assert.equal(META[lab.id].kind, lab.kind, `${lab.id}: meta kind`);
  assert.deepEqual(META[lab.id].cases.map((c) => [c.id, c.title, c.level]), lab.cases.map((c) => [c.id, c.title, c.level]), `${lab.id}: meta cases = catalog cases`);
}
const metaText = readFileSync(tools.LAB_META_PATH, 'utf8');
assert.ok(!/"scenario"|"solution"|"goals"|"primer"/.test(metaText), 'the meta carries no case content');
assert.deepEqual(LAB_INDEX.filter((l) => l.group === 'aplus').map((l) => l.id), APLUS.map((l) => l.id), 'the index carries the A+ group');
assert.ok(LAB_INDEX.filter((l) => !isAplus(l)).every((l) => !('group' in l)), 'Security+ labs have no group');
const indexText = readFileSync(tools.LAB_INDEX_PATH, 'utf8');
assert.ok(!/primer|terms|scenario|solution/.test(indexText), 'the index carries no content (Journey and badges stay content-free)');

// ---------- runs with mode and assisted ----------
const T = 1_800_000_000_000;
let labs = {};
labs = recordRun(labs, 'win/win-01', { t: T, score: 100, secs: 40, mode: 'guided', assisted: true });
assert.deepEqual(labs['win/win-01'], [{ t: T, score: 100, secs: 40, mode: 'guided', assisted: true }], 'mode and assisted kept');
assert.equal(isPassed(labs, 'win/win-01'), false, 'an assisted run is not a pass');
assert.equal(bestScore(labs, 'win/win-01'), 100, 'but it counts as a score');
labs = recordRun(labs, 'win/win-01', { t: T + 1, score: 85, secs: 50, mode: 'practice', assisted: false });
assert.deepEqual(labs['win/win-01'][1], { t: T + 1, score: 85, secs: 50, mode: 'practice' }, 'assisted:false is not stored');
assert.equal(isPassed(labs, 'win/win-01'), true);
assert.equal(isMastered(labs, 'win/win-01'), false, 'a Practice pass does not master');
labs = recordRun(labs, 'win/win-01', { t: T + 2, score: 90, secs: 50, mode: 'exam', assisted: true });
assert.equal(isMastered(labs, 'win/win-01'), false, 'an assisted Exam run does not master');
labs = recordRun(labs, 'win/win-01', { t: T + 3, score: 79, secs: 50, mode: 'exam' });
assert.equal(isMastered(labs, 'win/win-01'), false, 'an Exam run below 80 does not master');
labs = recordRun(labs, 'win/win-01', { t: T + 4, score: 80, secs: 50, mode: 'exam' });
assert.equal(isMastered(labs, 'win/win-01'), true, 'an unassisted Exam pass masters');
assert.deepEqual(recordRun(labs, 'win/win-02', { score: 90, secs: 5, mode: 'turbo' })['win/win-02'], undefined, 'an unknown mode is rejected');
assert.deepEqual(normalizeLabs({ 'fw/fw-01': [{ t: T, score: 90, secs: 3 }] }), { 'fw/fw-01': [{ t: T, score: 90, secs: 3 }] }, 'old runs load unchanged (unassisted practice)');
assert.equal(isPassed({ 'fw/fw-01': [{ t: T, score: 90, secs: 3 }] }, 'fw/fw-01'), true);

// The highest unassisted Exam score keeps mastery at any pass mark it reached,
// even when a newer Practice score owns the overall best slot.
const history = [
  { t: 1, score: 80, secs: 1, mode: 'exam' },
  { t: 2, score: 90, secs: 1, mode: 'exam' },
  { t: 3, score: 100, secs: 1, mode: 'practice' },
  ...Array.from({ length: 12 }, (_, i) => ({ t: i + 4, score: 20, secs: 1, mode: 'practice' })),
];
let trimmed = {};
for (const run of history) {
  trimmed = recordRun(trimmed, 'win/win-01', run);
  assert.equal(isMastered(trimmed, 'win/win-01', 90), history.slice(0, history.indexOf(run) + 1).some((r) => r.mode === 'exam' && r.score >= 90), 'mastery survives each trim');
}
assert.equal(trimmed['win/win-01'].length, RUNS_CAP);
assert.deepEqual(trimmed['win/win-01'].filter((r) => r.t <= 3).map((r) => r.t), [2, 3], 'both reserved runs survive');
assert.deepEqual(trimmed['win/win-01'].filter((r) => r.t > 3).map((r) => r.t), [8, 9, 10, 11, 12, 13, 14, 15], 'remaining slots hold the newest runs');
assert.equal(isMastered(normalizeLabs(trimmed), 'win/win-01', 90), true, 'mastery survives reload');

const sameScore = { t: 30, score: 90, secs: 2 };
const mergedModes = mergeLabs(
  { 'win/win-01': [{ ...sameScore, mode: 'practice' }, { ...sameScore, mode: 'exam', assisted: true }] },
  { 'win/win-01': [{ ...sameScore, mode: 'exam' }, { ...sameScore, mode: 'practice' }] },
);
assert.deepEqual(mergedModes['win/win-01'].map((r) => [r.mode, r.assisted]),
  [['practice', undefined], ['exam', true], ['exam', undefined]], 'merge keeps runs differing by mode or assistance and deduplicates identical records');
assert.equal(isMastered(mergedModes, 'win/win-01', 90), true, 'unassisted Exam pass survives merge');

// ---------- summary ----------
const sum = labSummary(labs, LABS);
const win = sum.perLab.find((p) => p.id === 'win');
assert.equal(win.group, 'aplus');
assert.equal(win.mastered, 1);
assert.equal(win.passed, 1);
assert.ok(!('group' in sum.perLab.find((p) => p.id === 'fw')), 'Security+ labs carry no group');
assert.equal(sum.perLab.find((p) => p.id === 'fw').mastered, 0);
assert.deepEqual(Object.keys(sum).sort(), ['attempted', 'passed', 'perLab', 'perfect', 'recent', 'runs', 'total'], 'summary top-level shape unchanged');
assert.deepEqual(labSummary(labs, LAB_INDEX), sum, 'summary from the index = from the catalog');

// ---------- badges ----------
const TODAY = '2026-10-09';
const j = journey({ full, milestones, gate, stages, done: {}, doneAt: {}, hoursPerWeek: 21, todayIso: TODAY });
const ach = (labsCtx, kept = {}) => achievements({ done: {}, doneAt: {}, full, extras, stages, gate, j, kept, ...(labsCtx === undefined ? {} : { labs: labsCtx }) });
const got = (list, id) => list.find((b) => b.id === id);
const NEW = ['lab-win', 'lab-shell', 'lab-build', 'lab-router', 'lab-order', 'lab-mobprint', 'lab-aplus-all', 'lab-mastery-10'];
const order = BADGES.map((b) => b.id);
assert.deepEqual(order.slice(order.indexOf('lab-all') + 1, order.indexOf('lab-all') + 1 + NEW.length), NEW, 'A+ badges follow the existing lab badges');
assert.equal(order.indexOf('gate-open'), order.indexOf('lab-mastery-10') + 1, 'then Gate Open');
NEW.forEach((id) => assert.equal(BADGES.find((b) => b.id === id).group, 'Labs'));
const names = Object.fromEntries(BADGES.map((b) => [b.id, b.name]));
assert.deepEqual(NEW.map((id) => names[id]), ['Tool Finder', 'Command Line Fixer', 'Bench Builder', 'Router Hardener', 'Methodical', 'Field Tech', 'A+ Hands-On', 'Ten Mastered']);
for (const bad of [undefined, null, 'x', {}, { perLab: 'no' }, { perLab: [null, 3] }]) {
  NEW.forEach((id) => { const b = got(ach(bad), id); assert.equal(b.earned, false); assert.ok(b.need >= 1 && b.have === 0, `${id} with ${JSON.stringify(bad)}`); });
}
const run = (score, extra = {}) => [{ t: T, score, secs: 30, ...extra }];
const allOf = (labIds, mk) => Object.fromEntries(LABS.filter((l) => labIds.includes(l.id)).flatMap((l) => l.cases.map((c) => [`${l.id}/${c.id}`, mk()])));
const aplusIds = APLUS.map((l) => l.id);
const secIds = LABS.filter((l) => !isAplus(l)).map((l) => l.id);
// every A+ case passed in Practice: each A+ lab badge and A+ Hands-On, not Hands-On Hero, not Ten Mastered
const aplusDone = ach(labSummary(allOf(aplusIds, () => run(90, { mode: 'practice' })), LABS));
['lab-win', 'lab-shell', 'lab-build', 'lab-router', 'lab-order', 'lab-mobprint', 'lab-aplus-all', 'lab-first'].forEach((id) => assert.ok(got(aplusDone, id).earned, `${id} earned`));
assert.equal(got(aplusDone, 'lab-all').earned, false, 'A+ passes never count toward Hands-On Hero');
assert.equal(got(aplusDone, 'lab-all').have, 0);
assert.equal(got(aplusDone, 'lab-all').need, LABS.filter((l) => !isAplus(l)).reduce((s, l) => s + l.cases.length, 0), 'Hands-On Hero needs the Security+ & Network+ cases only');
assert.equal(got(aplusDone, 'lab-mastery-10').have, 0, 'Practice passes master nothing');
assert.equal(got(aplusDone, 'lab-aplus-all').need, APLUS.reduce((s, l) => s + l.cases.length, 0));
// every Security+ case passed: Hands-On Hero, not A+ Hands-On
const secDone = ach(labSummary(allOf(secIds, () => run(100)), LABS));
assert.ok(got(secDone, 'lab-all').earned, 'Hands-On Hero from the Security+ & Network+ labs alone');
assert.equal(got(secDone, 'lab-aplus-all').earned, false);
// assisted passes earn nothing
const assisted = ach(labSummary(allOf(aplusIds, () => run(100, { mode: 'exam', assisted: true })), LABS));
NEW.forEach((id) => assert.equal(got(assisted, id).earned, false, `${id} not earned by assisted runs`));
assert.equal(got(assisted, 'lab-first').earned, false);
// Ten Mastered: 10 unassisted Exam passes across labs; 9 is not enough
const aplusCaseIds = APLUS.flatMap((l) => l.cases.map((c) => `${l.id}/${c.id}`));
const mastered = (n) => Object.fromEntries(aplusCaseIds.slice(0, n).map((id) => [id, run(85, { mode: 'exam' })]));
if (aplusCaseIds.length >= 10) {
  assert.ok(got(ach(labSummary(mastered(10), LABS)), 'lab-mastery-10').earned, '10 mastered earn Ten Mastered');
  const nine = got(ach(labSummary(mastered(9), LABS)), 'lab-mastery-10');
  assert.equal(nine.earned, false);
  assert.equal(nine.have, 9);
}
// sticky: a stored badge stays earned without data
assert.ok(got(ach(labSummary({}, LABS), { 'lab-mastery-10': TODAY }), 'lab-mastery-10').earned, 'A+ badges are sticky like every badge');

// ---------- the lab-badges-v1 migration ignores A+ runs ----------
memory.clear();
memory.set('codequest-pro-v1', JSON.stringify({ labs: allOf(aplusIds, () => run(100, { mode: 'exam' })) }));
assert.deepEqual(progress.applyLabBadgeMigration(TODAY), { ok: true, ran: false }, 'A+ runs alone migrate no old badge');
assert.deepEqual(progress.getBadges(), {});
assert.deepEqual(Object.keys(progress.getLabs()).sort(), Object.keys(allOf(aplusIds, () => 0)).sort(), 'A+ runs saved under <lab>/<case>');
assert.equal(progress.getLabs()['win/win-01'][0].mode, 'exam', 'mode survives a save and load');

console.log(`ok — pro A+ labs: ${APLUS.length} labs, ${aplusCaseIds.length} cases, index current, runs with mode/assisted, summary group/mastered, ${NEW.length} new badges, Hands-On Hero unchanged`);

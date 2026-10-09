// CodeQuest Pro hands-on labs: the catalog is well formed and tagged with real SY0-801 objectives, lab runs are saved,
// normalized, exported, imported and merged with the rest of the progress, damage never breaks a load, and the lab
// achievements read the labs summary (and never crash without it).
// Run: npm test
import assert from 'node:assert/strict';

const memory = new Map();
globalThis.localStorage = {
  getItem: (k) => (memory.has(k) ? memory.get(k) : null),
  setItem: (k, v) => { memory.set(k, String(v)); },
  removeItem: (k) => { memory.delete(k); },
};

const { LABS, caseOf, labOf, LAB_SOURCES } = await import('../src/pro/labs/catalog.js');
const { recordRun, labSummary, PASS } = await import('../src/pro/labs/lab-logic.js');
const { blueprint } = await import('../src/pro/exam/secplus-801.js');
const progress = await import('../src/pro/progress.js');
const { default: full, extras, milestones, gate } = await import('../src/pro/career-path.js');
const { default: stages } = await import('../src/pro/expedited-path.js');
const { achievements, journey, BADGES } = await import('../src/pro/career-logic.js');

const KEY = 'codequest-pro-v1';
const reset = (state) => { memory.clear(); if (state !== undefined) memory.set(KEY, typeof state === 'string' ? state : JSON.stringify(state)); };
const raw = () => JSON.parse(memory.get(KEY));

// ---------- catalog ----------
const OBJ_IDS = new Set(blueprint.domains.flatMap((d) => d.objectives.map((o) => o.id)));
assert.deepEqual(LABS.map((l) => l.id), ['fw', 'logs', 'subnet', 'cli', 'phish', 'code'], 'six labs in order');
assert.deepEqual(LABS.map((l) => l.icon), ['🧱', '🔎', '🧮', '💻', '🎣', '🛠️']);
assert.deepEqual(LABS.map((l) => l.name), ['Firewall & Network Diagram', 'Log Detective', 'Subnet Sprint', 'Terminal Troubleshooter', 'Phish Inspector', 'Detection Coder']);
assert.equal(labOf('code').pass, 100, 'code labs pass at 100');
LABS.filter((l) => l.id !== 'code').forEach((l) => assert.equal(l.pass, PASS, `${l.id} passes at ${PASS}`));
const allIds = new Set();
for (const lab of LABS) {
  assert.ok(lab.name && lab.blurb && lab.kind, `${lab.id}: name, blurb, kind`);
  assert.ok(lab.cases.length >= 1, `${lab.id}: has cases`);
  const ids = new Set();
  for (const c of lab.cases) {
    assert.ok(typeof c.id === 'string' && /^[a-z0-9-]+$/.test(c.id), `${lab.id}: case id ${c.id}`);
    assert.ok(!ids.has(c.id), `${lab.id}: unique case id ${c.id}`);
    ids.add(c.id);
    allIds.add(`${lab.id}/${c.id}`);
    assert.ok(typeof c.title === 'string' && c.title.length > 0, `${c.id}: title`);
    assert.ok([1, 2, 3, 4].includes(c.level), `${c.id}: level ${c.level}`);
    assert.ok(Array.isArray(c.objs) && c.objs.length > 0, `${c.id}: objs`);
    c.objs.forEach((o) => assert.ok(OBJ_IDS.has(o), `${c.id}: ${o} is a real SY0-801 objective`));
    assert.ok(caseOf(lab.id, c.id), `${c.id}: caseOf finds the full case`);
    c.objs.forEach((o) => assert.ok(lab.objs.includes(o), `${lab.id}: objs is the union of case objs`));
  }
  assert.ok(lab.objs.every((o) => lab.cases.some((c) => c.objs.includes(o))), `${lab.id}: no extra objs`);
  assert.equal(typeof LAB_SOURCES[lab.id], 'object');
}
assert.equal(labOf('subnet').cases.length, 4, 'Subnet Sprint has four levels');
assert.ok(Array.isArray(caseOf('subnet', 'subnet-1').kinds), 'subnet caseOf returns the LEVEL');
assert.equal(caseOf('fw', 'nope'), null);
assert.equal(caseOf('nope', 'fw-01'), null);
assert.equal(labOf('nope'), null);
assert.ok([...allIds].every((id) => /^[a-z0-9-]+\/[a-z0-9-]+$/.test(id) && id.length <= 80), 'every item id is storable');

// ---------- progress integration ----------
reset();
assert.deepEqual(progress.getLabs(), {}, 'no labs on day one');
const t0 = 1_800_000_000_000;
let labs = recordRun(progress.getLabs(), 'fw/fw-01', { score: 33, secs: 40, t: t0 });
labs = recordRun(labs, 'fw/fw-01', { score: 100, secs: 90, t: t0 + 1000 });
assert.deepEqual(progress.saveLabs(labs), { ok: true });
assert.equal(progress.getLabs()['fw/fw-01'].length, 2, 'runs saved');
assert.deepEqual(raw().labs['fw/fw-01'][1], { t: t0 + 1000, score: 100, secs: 90 });
assert.ok(raw().completed && raw().exams, 'saving labs keeps the rest of the state');

// damage-safe: junk labs are dropped one field at a time, the rest of the state still loads
reset({ completed: { a: 10 }, labs: { 'fw/fw-01': [{ t: t0, score: 80, secs: 5 }, { t: -1, score: 50, secs: 1 }, 'x'], __proto__bad: 1, 'bad id': [{ t: t0, score: 1, secs: 1 }], 'logs/logs-01': 'nope', 'code/code-01': [{ t: t0, score: 101, secs: 1 }] } });
assert.deepEqual(progress.getLabs(), { 'fw/fw-01': [{ t: t0, score: 80, secs: 5 }] }, 'only valid items and runs survive');
assert.equal(progress.totalXp(), 10);
reset({ labs: 'garbage' });
assert.deepEqual(progress.getLabs(), {});
reset('{not json');
assert.deepEqual(progress.getLabs(), {}, 'unreadable storage gives empty labs');
reset({ labs: [1, 2, 3] });
assert.deepEqual(progress.getLabs(), {});
assert.equal(progress.saveLabs({ 'fw/fw-01': [{ t: t0, score: 'x', secs: 1 }], 'a/b': [{ t: t0, score: 90, secs: 2 }] }).ok, true);
assert.deepEqual(progress.getLabs(), { 'a/b': [{ t: t0, score: 90, secs: 2 }] }, 'saveLabs normalizes what it stores');

// a failed save reports { ok: false } instead of throwing
const realSet = globalThis.localStorage.setItem;
globalThis.localStorage.setItem = () => { throw new Error('QuotaExceededError'); };
assert.deepEqual(progress.saveLabs({}), { ok: false });
globalThis.localStorage.setItem = realSet;

// export / import: replace brings the runs back, merge unions them without duplicates
reset();
progress.saveLabs({ 'fw/fw-01': [{ t: t0, score: 50, secs: 10 }], 'subnet/subnet-1': [{ t: t0 + 5, score: 90, secs: 60 }] });
const file = progress.exportProgress();
assert.ok(JSON.parse(file).progress.labs['subnet/subnet-1'], 'backups carry the labs');
reset();
assert.equal(progress.importProgress(file, 'replace').ok, true);
assert.equal(progress.getLabs()['subnet/subnet-1'][0].score, 90, 'replace restores the runs');
reset({ labs: { 'fw/fw-01': [{ t: t0, score: 50, secs: 10 }, { t: t0 + 99, score: 100, secs: 12 }], 'cli/cli-01': [{ t: t0 + 7, score: 50, secs: 3 }] } });
assert.equal(progress.importProgress(file).ok, true);
const merged = progress.getLabs();
assert.equal(merged['fw/fw-01'].length, 2, 'the identical run is not doubled');
assert.deepEqual(merged['fw/fw-01'].map((r) => r.score), [50, 100], 'sorted by time');
assert.ok(merged['cli/cli-01'] && merged['subnet/subnet-1'], 'merge keeps local runs and adds the file runs');
// a damaged labs field inside a backup does not stop the import
const damaged = JSON.parse(file);
damaged.progress.labs = { 'fw/fw-01': 'bad', 'x/y': [{ t: 'no' }] };
reset({ labs: { 'cli/cli-01': [{ t: t0, score: 70, secs: 3 }] } });
assert.equal(progress.importProgress(JSON.stringify(damaged)).ok, true);
assert.deepEqual(progress.getLabs(), { 'cli/cli-01': [{ t: t0, score: 70, secs: 3 }] });

// ---------- achievements ----------
const TODAY = '2026-10-08';
const j = journey({ full, milestones, gate, stages, done: {}, doneAt: {}, hoursPerWeek: 21, todayIso: TODAY });
const ach = (labsCtx, kept = {}) => achievements({ done: {}, doneAt: {}, full, extras, stages, gate, j, kept, ...(labsCtx === undefined ? {} : { labs: labsCtx }) });
const got = (list, id) => list.find((b) => b.id === id);
const LAB_BADGES = ['lab-first', 'lab-fw', 'lab-logs', 'lab-subnet', 'lab-cli', 'lab-phish', 'lab-code', 'lab-perfect-10', 'lab-all'];
const order = BADGES.map((b) => b.id);
assert.ok(LAB_BADGES.every((id) => order.includes(id)), 'every lab badge exists');
assert.ok(order.indexOf('lab-first') > order.indexOf('exam-seen-all') && order.indexOf('lab-all') < order.indexOf('gate-open'), 'lab badges sit after the exam badges, before Gate Open');
assert.deepEqual(LAB_BADGES.map((id) => BADGES.find((b) => b.id === id).group), LAB_BADGES.map(() => 'Labs'));
assert.equal(new Set(order).size, order.length, 'badge ids stay unique');

// missing ctx.labs (or junk) means no progress, never a crash
for (const ctxLabs of [undefined, null, 'x', {}, { perLab: 'no' }]) {
  const list = ach(ctxLabs);
  LAB_BADGES.forEach((id) => { const b = got(list, id); assert.equal(b.earned, false, `${id} not earned with labs=${JSON.stringify(ctxLabs)}`); assert.ok(b.need >= 1 && b.have === 0); });
}

const sumOf = (saved) => labSummary(saved, LABS);
const run = (score) => [{ t: t0, score, secs: 30 }];
// one passed case
const firstPass = ach(sumOf({ 'fw/fw-01': run(80) }));
assert.ok(got(firstPass, 'lab-first').earned, 'passing one case earns First Lab');
assert.equal(got(firstPass, 'lab-fw').earned, labOf('fw').cases.length === 1);
assert.equal(got(firstPass, 'lab-fw').need, labOf('fw').cases.length, 'Firewall Fixer needs every firewall case');
assert.equal(got(firstPass, 'lab-all').need, LABS.reduce((s, l) => s + l.cases.length, 0));
assert.equal(got(firstPass, 'lab-first').date, null, 'lab badges carry no date');
// a fail is not a pass; code needs 100
assert.equal(got(ach(sumOf({ 'fw/fw-01': run(79) })), 'lab-first').earned, false, '79 is not a pass');
const codeId = `code/${labOf('code').cases[0].id}`;
assert.equal(got(ach(sumOf({ [codeId]: run(99) })), 'lab-first').earned, false, 'code needs 100');
assert.equal(got(ach(sumOf({ [codeId]: run(100) })), 'lab-first').earned, true);
// every subnet level
const allSubnet = Object.fromEntries(labOf('subnet').cases.map((c) => [`subnet/${c.id}`, run(90)]));
assert.ok(got(ach(sumOf(allSubnet)), 'lab-subnet').earned, 'all four levels earn Subnet Sprinter');
const threeSubnet = Object.fromEntries(labOf('subnet').cases.slice(0, 3).map((c) => [`subnet/${c.id}`, run(90)]));
assert.equal(got(ach(sumOf(threeSubnet)), 'lab-subnet').earned, false);
assert.equal(got(ach(sumOf(threeSubnet)), 'lab-subnet').have, 3);
// every case of every lab at 100: everything earned
const everything = Object.fromEntries(LABS.flatMap((l) => l.cases.map((c) => [`${l.id}/${c.id}`, run(100)])));
const all = ach(sumOf(everything));
LAB_BADGES.filter((id) => id !== 'lab-perfect-10' || Object.keys(everything).length >= 10).forEach((id) => assert.ok(got(all, id).earned, `${id} earned when everything is perfect`));
// ten perfect
const tenPerfect = Object.fromEntries([...allIds].slice(0, 10).map((id) => [id, run(100)]));
const nine = Object.fromEntries([...allIds].slice(0, 9).map((id) => [id, run(100)]));
if (allIds.size >= 10) {
  assert.ok(got(ach(sumOf(tenPerfect)), 'lab-perfect-10').earned, '10 perfect cases earn Ten Perfect');
  assert.equal(got(ach(sumOf(nine)), 'lab-perfect-10').earned, false);
  assert.equal(got(ach(sumOf(nine)), 'lab-perfect-10').have, 9);
}
assert.ok(ach(sumOf(everything)).every((b) => b.have <= b.need), 'progress never shows more than needed');

// b528832 had 39 cases. Passing all of those before the later additions must retain the old completion badges.
const oldCounts = { fw: 8, logs: 6, subnet: 4, cli: 8, phish: 8, code: 5 };
const oldIds = Object.entries(oldCounts).flatMap(([labId, count]) => Array.from({ length: count }, (_, i) =>
  `${labId}/${labId === 'subnet' ? `subnet-${i + 1}` : `${labId}-${String(i + 1).padStart(2, '0')}`}`));
assert.equal(oldIds.length, 39);
assert.ok(oldIds.every((id) => allIds.has(id)), 'all 39 frozen ids still exist in the current catalog');
const oldRuns = Object.fromEntries(oldIds.map((id) => [id, run(id.startsWith('code/') ? 100 : 80)]));
assert.equal(Object.keys(oldRuns).length < allIds.size, true, 'new cases are absent from the old save');
reset();
assert.deepEqual(progress.getBadges(), {}, 'a fresh save has no badges');
assert.deepEqual(progress.applyLabBadgeMigration(TODAY), { ok: true, ran: false });
assert.deepEqual(progress.getBadges(), {}, 'a fresh save earns no migrated badges');
assert.equal(memory.has(KEY), false, 'checking an empty save does not write');

reset({ labs: oldRuns });
assert.deepEqual(progress.applyLabBadgeMigration(TODAY), { ok: true, ran: true });
const oldBadges = progress.getBadges();
const migratedIds = ['lab-first', 'lab-fw', 'lab-logs', 'lab-subnet', 'lab-cli', 'lab-phish', 'lab-code', 'lab-all'];
assert.deepEqual(Object.keys(oldBadges).sort(), migratedIds.sort(), 'all six old completion badges plus First Lab and Subnet Sprinter are stored');
assert.ok(Object.values(oldBadges).every((date) => date === TODAY));
const keptOld = ach(sumOf(oldRuns), oldBadges);
for (const id of migratedIds) assert.equal(got(keptOld, id).earned, true, `${id} stays earned`);
assert.equal(got(keptOld, 'lab-fw').have, 8);
assert.equal(got(keptOld, 'lab-fw').need, 12, 'the progress bar uses the current firewall case count');
assert.equal(got(keptOld, 'lab-all').have, 39);
assert.equal(got(keptOld, 'lab-all').need, allIds.size);
assert.equal(got(keptOld, 'lab-all').date, TODAY, 'stored first-earned date appears on a sticky badge');

// An old tab can overwrite the new save without badges while preserving its migration flag.
const newReleaseSave = raw();
const oldReleaseSave = structuredClone(newReleaseSave);
delete oldReleaseSave.badges;
reset(oldReleaseSave);
assert.equal(raw().migrations['lab-badges-v1'], true, 'the old tab kept the migration flag');
assert.deepEqual(progress.getBadges(), {}, 'the old tab dropped the badge map');
let writes = 0;
globalThis.localStorage.setItem = (...args) => { writes += 1; return realSet(...args); };
assert.deepEqual(progress.applyLabBadgeMigration('2026-10-09'), { ok: true, ran: true });
assert.deepEqual(progress.getBadges(), Object.fromEntries(migratedIds.map((id) => [id, '2026-10-09'])), 'the next check restores every original-case badge');
assert.equal(writes, 1, 'restoring missing badges writes once');
assert.deepEqual(progress.applyLabBadgeMigration('2026-10-10'), { ok: true, ran: false });
assert.equal(writes, 1, 'a complete badge map causes no further write');
globalThis.localStorage.setItem = realSet;
reset(newReleaseSave);

// Migration and re-recording an existing badge must not write or remove anything.
writes = 0;
globalThis.localStorage.setItem = (...args) => { writes += 1; return realSet(...args); };
assert.deepEqual(progress.applyLabBadgeMigration('2026-10-09'), { ok: true, ran: false });
assert.deepEqual(progress.recordBadges(['lab-fw'], '2026-10-09'), { ok: true });
assert.deepEqual(progress.recordBadges({ 'lab-fw': '2026-09-20' }), { ok: true });
assert.equal(writes, 0, 'no storage write for re-read badges');
assert.deepEqual(progress.recordBadges(['future-badge'], '2026-10-09'), { ok: true });
assert.equal(writes, 1, 'one new badge causes one write');
globalThis.localStorage.setItem = realSet;
assert.equal(progress.getBadges()['lab-fw'], TODAY, 'a later record does not replace the first date');
assert.equal(progress.getBadges()['future-badge'], '2026-10-09', 'unknown ids are kept');
assert.equal(progress.saveLabs({}).ok, true);
assert.deepEqual(progress.applyLabBadgeMigration('2026-10-10'), { ok: true, ran: false });
assert.equal(progress.getBadges()['lab-all'], TODAY, 'the second migration never removes an old badge');
const afterRunsRemoved = ach(sumOf({}), progress.getBadges());
assert.equal(got(afterRunsRemoved, 'lab-all').earned, true, 'a stored badge survives even when all run data is gone');
assert.equal(got(afterRunsRemoved, 'lab-all').have, 0, 'current progress remains honest');

const badgeFile = progress.exportProgress(new Date('2026-10-09T12:00:00Z'));
assert.equal(JSON.parse(badgeFile).progress.badges['lab-all'], TODAY, 'exports carry badges');
reset({ badges: { 'lab-fw': '2026-09-01', 'local-only': '2026-09-02' }, migrations: { 'lab-badges-v1': true } });
assert.equal(progress.importProgress(badgeFile).ok, true);
assert.equal(progress.getBadges()['lab-fw'], '2026-09-01', 'merge keeps the earliest badge date');
assert.equal(progress.getBadges()['lab-all'], TODAY, 'merge adds imported badges');
assert.equal(progress.getBadges()['local-only'], '2026-09-02', 'merge keeps local unknown ids');
reset();
assert.equal(progress.importProgress(badgeFile, 'replace').ok, true);
assert.deepEqual(progress.getBadges(), JSON.parse(badgeFile).progress.badges, 'replace restores the badge map');
const legacyFile = JSON.stringify({ format: progress.EXPORT_FORMAT, version: progress.EXPORT_VERSION, progress: { labs: oldRuns, migrations: { 'lab-badges-v1': true } } });
reset({ migrations: { 'lab-badges-v1': true } });
assert.equal(progress.importProgress(legacyFile).ok, true);
assert.deepEqual(Object.keys(progress.getBadges()).sort(), migratedIds.sort(), 'an old-release backup with the flag gets its badges before merge');
reset({ badges: { good: TODAY, bad: 42, impossible: '2026-02-30', '': TODAY, constructor: TODAY } });
assert.deepEqual(progress.getBadges(), { good: TODAY }, 'damaged badge entries are dropped individually');
assert.deepEqual(progress.recordBadges(['x'], 'not-a-day'), { ok: false });
assert.deepEqual(progress.recordBadges({ x: 'not-a-day' }), { ok: false });
assert.equal(progress.getBadges().x, undefined);

console.log(`ok — pro labs: catalog (${LABS.length} labs, ${allIds.size} cases), progress save/normalize/export/import/merge, ${LAB_BADGES.length} lab badges`);

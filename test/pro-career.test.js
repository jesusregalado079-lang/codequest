// CodeQuest Pro Career Path: the roadmap data is well formed, every checkable item has a permanent id, the saved
// progress survives damage, failed saves and the one-time move from URL keys to ids, and backups round-trip.
// Run: npm test
import assert from 'node:assert/strict';

const memory = new Map();
let failWrites = false;
globalThis.localStorage = {
  getItem: (k) => (memory.has(k) ? memory.get(k) : null),
  setItem: (k, v) => { if (failWrites) { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; } memory.set(k, String(v)); },
  removeItem: (k) => { memory.delete(k); },
};

const { default: full, extras, milestones, gate } = await import('../src/pro/career-path.js');
const { default: studies } = await import('../src/pro/resources.js');
const { default: stages } = await import('../src/pro/expedited-path.js');
const { LEGACY_KEYS_V1 } = await import('../src/pro/legacy-keys.js');
const progress = await import('../src/pro/progress.js');
const { groupStats, passMark, quizKey, outKey } = await import('../src/pro/career-logic.js');

const KEY = 'codequest-pro-v1';
const reset = (state) => { memory.clear(); if (state !== undefined) memory.set(KEY, JSON.stringify(state)); };

// ---------- the data ----------
const SHARED_IDS = new Set(['ai-fluency', 'linkedin-genai-career-essentials']); // the same course listed in two places
const fullLinks = full.flatMap((p) => p.links);
const extraLinks = extras.flatMap((g) => g.links);
const studyLinks = studies.flatMap((g) => g.links);
for (const [page, links] of [['roadmap', fullLinks], ['extra', extraLinks], ['studies', studyLinks]]) {
  const ids = links.map((l) => l.id);
  assert.ok(ids.every((id) => typeof id === 'string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)), `${page}: every item has a lowercase-hyphen id`);
  assert.equal(new Set(ids).size, ids.length, `${page}: ids are unique on the page`);
  links.forEach((l) => {
    assert.ok(typeof l.name === 'string' && l.name.length > 2, `${l.id}: a name`);
    assert.ok(/^https:\/\/[^\s"'<>]+$/.test(l.url), `${l.id}: an https URL (${l.url})`);
    if (l.hours !== undefined) assert.ok(typeof l.hours === 'number' && Number.isFinite(l.hours) && l.hours >= 0, `${l.id}: hours is a number`);
    (l.quiz || []).forEach((q, qi) => {
      assert.ok(Array.isArray(q.choices) && q.choices.length >= 2, `${l.id} q${qi}: choices`);
      assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.choices.length, `${l.id} q${qi}: the answer is one of the choices`);
      assert.ok(q.q && q.why, `${l.id} q${qi}: question and explanation`);
    });
  });
}
// an id is shared between pages only for the same course listed twice
const pagesOf = new Map();
[['roadmap', fullLinks], ['extra', extraLinks], ['studies', studyLinks]].forEach(([page, links]) => links.forEach((l) => {
  if (!pagesOf.has(l.id)) pagesOf.set(l.id, []);
  pagesOf.get(l.id).push({ page, url: l.url });
}));
for (const [id, where] of pagesOf) {
  if (where.length > 1) {
    assert.ok(SHARED_IDS.has(id), `${id} appears on ${where.map((w) => w.page).join(' and ')}: only an intentional shared course may`);
    assert.equal(new Set(where.map((w) => w.url)).size, 1, `${id}: a shared id is the same course (same link)`);
  }
}
// deliverables, gate conditions, milestones
const outs = full.flatMap((p) => p.outputs || []).map(outKey);
assert.equal(new Set(outs).size, outs.length, 'deliverable keys are unique');
const gateKeys = gate.conditions.map((c) => c.key);
assert.equal(new Set(gateKeys).size, gateKeys.length, 'gate condition keys are unique');
const phaseNumbers = new Set(full.map((p) => p.n));
milestones.forEach((m) => m.requires.forEach((n) => assert.ok(phaseNumbers.has(n), `milestone "${m.label}" needs phase ${n}, which exists`)));
full.forEach((p) => assert.ok(Array.isArray(p.hours) && p.hours[0] <= p.hours[1], `phase ${p.n}: an hours range`));
// Expedited
const expItems = stages.flatMap((s) => s.items || []);
const expKeys = expItems.map((i) => i.key || i.url);
assert.equal(new Set(expKeys).size, expKeys.length, 'Expedited keys are unique');
const allIds = new Set([...fullLinks, ...extraLinks, ...studyLinks].map((l) => l.id));
const linkedToFull = expKeys.filter((k) => allIds.has(k));
assert.deepEqual(linkedToFull.sort(), ['p2-comptia-network-n10-009-free-course', 'p2-comptia-security-sy0-701-foundations-checkpoint'], 'only the two Professor Messer courses share a checkmark between the roadmaps');

// ---------- the frozen move from URL keys to ids ----------
const roadmapAndExpIds = new Set([...allIds, ...expKeys]);
LEGACY_KEYS_V1.forEach(([from, to]) => {
  const target = to.startsWith('quiz:') ? to.slice(5) : to;
  assert.ok(roadmapAndExpIds.has(target), `migration target ${to} is a real item`);
  assert.ok(from.startsWith('https://') || from.startsWith('quiz:https://'), `migration source ${from} is an old URL key`);
});

// ---------- damaged saves never stop a page ----------
for (const junk of [null, 'nope', 42, [], { studyDone: null }, { completed: null, studyDone: 'x' }, { completed: { a: '50', b: -3, c: 20 }, streak: 'x', hintsUsed: { a: 9, b: 2 } }, { studyDone: { a: 1, b: true, __proto__: { c: true } } }]) {
  reset(junk);
  assert.doesNotThrow(() => { progress.isStudyDone('a'); progress.totalXp(); progress.streakCount(); progress.studyDoneMap(); progress.rank(); }, JSON.stringify(junk));
}
reset({ completed: { a: '50', b: -3, c: 20 }, hintsUsed: { a: 9, b: 2 }, studyDone: { x: true, y: 1 }, streak: { count: 3, last: '2026-10-07' } });
assert.equal(progress.totalXp(), 20, 'string and negative XP are dropped, not concatenated');
assert.equal(progress.hintsUsed('a'), 0);
assert.equal(progress.hintsUsed('b'), 2);
assert.equal(progress.isStudyDone('x'), true);
assert.equal(progress.isStudyDone('y'), false, 'only true counts as done');
reset('{not json');
memory.set(KEY, '{not json');
assert.equal(progress.isStudyDone('x'), false);

// ---------- a failed save is reported, not thrown ----------
reset({});
failWrites = true;
let result;
assert.doesNotThrow(() => { result = progress.toggleStudyDone('p3-htb-academy-free-tier'); });
assert.equal(result.ok, false, 'the caller is told the change was not kept');
assert.equal(progress.lastSaveOk(), false);
failWrites = false;
assert.equal(progress.toggleStudyDone('p3-htb-academy-free-tier').ok, true);
assert.equal(progress.lastSaveOk(), true);

// ---------- the one-time move keeps every checkmark he had ----------
const HTB = 'https://academy.hackthebox.com';
const NVIDIA = 'https://www.nvidia.com/en-us/training/self-paced-courses/';
const MESSER_SEC = 'https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/sy0-701-comptia-security-plus-course/';
const BTL1_OLD = 'https://securityblue.team/btl1';
reset({ completed: { l1: 10 }, studyDone: { [HTB]: true, [`quiz:${NVIDIA}`]: true, [MESSER_SEC]: true, [BTL1_OLD]: true, 'out:p1-workflow': true, 'gate:portfolio': true, 'exp0-windows': true } });
const first = progress.ensureMigrated();
assert.equal(first.ran, true);
const done = progress.studyDoneMap();
['p3-htb-academy-free-tier', 'p5-htb-academy-cloud-modules', 'p7-htb-academy-web-modules'].forEach((id) => assert.equal(done[id], true, `${id}: what the shared HTB checkmark showed before is kept`));
assert.equal(done['quiz:p1-agentic-ai-explained'], true, 'a passed quiz is kept');
assert.equal(done['p2-comptia-security-sy0-701-foundations-checkpoint'], true, 'Professor Messer Security+ carries over, and Expedited reads the same id');
assert.equal(done['s2-blue-team-level-1-btl1'], true, 'an item whose link later changes keeps its checkmark (the table keeps the old URL)');
assert.equal(done['out:p1-workflow'], true, 'deliverables were never keyed by URL and are untouched');
assert.equal(done['exp0-windows'], true, 'Expedited keys are untouched');
assert.equal(progress.totalXp(), 10, 'lesson XP is untouched');
// runs once: an item he unticks afterwards stays unticked
progress.toggleStudyDone('p5-htb-academy-cloud-modules');
assert.equal(progress.ensureMigrated().ran, false, 'the move runs once');
assert.equal(progress.isStudyDone('p5-htb-academy-cloud-modules'), false, 'and never re-ticks something he unticked');
// from now on items sharing a link are independent
progress.toggleStudyDone('p7-htb-academy-web-modules');
assert.equal(progress.isStudyDone('p3-htb-academy-free-tier'), true);
assert.equal(progress.isStudyDone('p7-htb-academy-web-modules'), false);
// a fresh browser: nothing to move, nothing invented
reset();
assert.equal(progress.ensureMigrated().moved, 0);
assert.deepEqual(progress.studyDoneMap(), {});

// ---------- counts and quizzes ----------
const p3 = full.find((p) => p.n === 3);
const p5 = full.find((p) => p.n === 5);
const htb3 = p3.links.find((l) => l.id === 'p3-htb-academy-free-tier');
assert.ok(htb3);
const s3 = groupStats(p3, { [htb3.id]: true });
const s5 = groupStats(p5, { [htb3.id]: true });
assert.equal(s3.done, 1, 'ticking HTB in Phase 3 counts in Phase 3');
assert.equal(s5.done, 0, 'and not in Phase 5');
assert.equal(s3.hoursDone, htb3.hours || 0);
assert.equal(passMark(3), 2, '2 of 3 to pass');
assert.equal(passMark(1), 1);
assert.equal(passMark(2), 2);
assert.equal(quizKey('p1-agentic-ai-explained'), 'quiz:p1-agentic-ai-explained');
// the Phase 1 and Phase 8 NVIDIA quizzes are different quizzes on different ids
const nv1 = full.find((p) => p.n === 1).links.find((l) => l.id === 'p1-agentic-ai-explained');
const nv8 = full.find((p) => p.n === 8).links.find((l) => l.url === nv1.url && l.id !== nv1.id);
if (nv8 && nv8.quiz) assert.notDeepEqual(nv8.quiz, nv1.quiz, 'the Phase 8 quiz is its own');

// ---------- backup ----------
reset({ completed: { l1: 10 }, studyDone: { a: true, b: true }, streak: { count: 2, last: '2026-10-07' } });
const file = progress.exportProgress(new Date('2026-10-08T12:00:00Z'));
const parsed = JSON.parse(file);
assert.equal(parsed.format, 'codequest-pro-progress');
assert.equal(parsed.version, 1);
assert.deepEqual(Object.keys(parsed.progress.studyDone).sort(), ['a', 'b']);
reset({ studyDone: { c: true }, completed: { l1: 5, l2: 7 } });
let imp = progress.importProgress(file);
assert.equal(imp.ok, true);
assert.deepEqual(Object.keys(progress.studyDoneMap()).sort(), ['a', 'b', 'c'], 'merge adds the file to what is here');
assert.equal(progress.totalXp(), 17, 'merge keeps the higher XP per lesson');
reset({ studyDone: { c: true } });
imp = progress.importProgress(file, 'replace');
assert.deepEqual(Object.keys(progress.studyDoneMap()).sort(), ['a', 'b'], 'replace makes the file the progress');
assert.equal(progress.importProgress('{oops').ok, false);
assert.equal(progress.importProgress(JSON.stringify({ format: 'something-else', version: 1, progress: {} })).ok, false);
assert.equal(progress.importProgress(JSON.stringify({ format: 'codequest-pro-progress', version: 99, progress: {} })).error, 'That backup was made by a newer version of the app.');
const hostile = progress.importProgress(JSON.stringify({ format: 'codequest-pro-progress', version: 1, progress: { studyDone: { ok: true, bad: 'yes' }, completed: { x: 'lots' } } }), 'replace');
assert.equal(hostile.ok, true);
assert.deepEqual(progress.studyDoneMap(), { ok: true }, 'an edited backup is cleaned on the way in');
failWrites = true;
assert.equal(progress.importProgress(file).ok, false, 'a full browser reports the import was not saved');
failWrites = false;

console.log('ok — pro career: roadmap data well formed with permanent ids, damaged saves and failed saves handled, old URL checkmarks moved once and kept, shared links independent, quizzes 2 of 3, backup export/import');

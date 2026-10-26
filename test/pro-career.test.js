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
const { EXPEDITED_SHARED_V1, EXPEDITED_SHARED_DIRECT, EXPEDITED_KEPT_SEPARATE, STUDIES_SHARED_V1 } = await import('../src/pro/shared-keys.js');
const progress = await import('../src/pro/progress.js');
const { groupStats, passMark, quizKey, outKey } = await import('../src/pro/career-logic.js');

const KEY = 'codequest-pro-v1';
const reset = (state) => { memory.clear(); if (state !== undefined) memory.set(KEY, JSON.stringify(state)); };

// ---------- the data ----------
// the same course listed in two places (KC7 and Wazuh: roadmap Phase 3 and the Studies approved labs, since 2026-10-26)
const SHARED_IDS = new Set(['ai-fluency', 'linkedin-genai-career-essentials', 'p3-kc7', 'p3-wazuh']);
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
const sharedIds = [...EXPEDITED_SHARED_DIRECT, ...EXPEDITED_SHARED_V1.map(([, to]) => to)].sort();
assert.equal(new Set(sharedIds).size, sharedIds.length, 'each shared id is listed once');
assert.deepEqual(linkedToFull.sort(), sharedIds, 'exactly the items listed in shared-keys.js share a checkmark between the roadmaps');
// a shared checkmark points at the same place on both pages
const linkById = new Map([...fullLinks, ...extraLinks, ...studyLinks].map((l) => [l.id, l]));
const sameUrl = (u) => String(u || '').replace(/^https?:\/\/(www\.)?/i, '').replace(/[#?].*$/, '').replace(/\/$/, '').toLowerCase();
sharedIds.forEach((id) => {
  const item = expItems.find((i) => i.key === id);
  assert.equal(sameUrl(item.url), sameUrl(linkById.get(id).url), `${id}: the shared Expedited item links to the same place as the roadmap item`);
});
EXPEDITED_SHARED_V1.forEach(([from, to]) => {
  assert.ok(allIds.has(to), `shared key ${to} is a real roadmap id`);
  assert.ok(expKeys.includes(to), `Expedited uses ${to} as its key`);
  assert.ok(!expKeys.includes(from), `the old Expedited key ${from} is gone`);
});
// Items that cite the same link but ask for different work keep their OWN checkmark, with a written reason (shared-keys.js rules)
const keptKeys = EXPEDITED_KEPT_SEPARATE.map((e) => e.key);
assert.equal(new Set(keptKeys).size, keptKeys.length, 'each kept-separate item is listed once');
EXPEDITED_KEPT_SEPARATE.forEach((e) => {
  assert.ok(expKeys.includes(e.key), `${e.key} is a real Expedited item`);
  assert.ok(!allIds.has(e.key), `${e.key} keeps its own key, never a roadmap id`);
  assert.ok(Array.isArray(e.roadmap) && e.roadmap.length > 0, `${e.key}: names the roadmap item(s) it was compared with`);
  assert.ok(typeof e.expeditedAsks === 'string' && e.expeditedAsks.length >= 20, `${e.key}: says what the Expedited item asks for`);
  e.roadmap.forEach((r) => {
    assert.ok(allIds.has(r.id), `${e.key}: ${r.id} is a real roadmap id`);
    assert.ok(!expKeys.includes(r.id), `${e.key}: ${r.id} is not used as any Expedited key, so the two checkmarks stay independent`);
    assert.ok(typeof r.where === 'string' && r.where.length > 0, `${e.key}: says where ${r.id} lives`);
    assert.ok(typeof r.asks === 'string' && r.asks.length >= 20, `${e.key}: says what ${r.id} asks for`);
  });
  assert.ok(typeof e.reason === 'string' && e.reason.length >= 80, `${e.key}: a written reason for staying separate`);
  assert.ok(/rule[s]? \d/.test(e.reason), `${e.key}: the reason cites which sharing rule applies`);
});
// rule 6: any Expedited item whose link matches a roadmap/Extra/Studies link is either shared or listed with a reason
const urlKey = (u) => String(u || '').replace(/^https?:\/\/(www\.)?/i, '').replace(/[#?].*$/, '').replace(/\/$/, '').toLowerCase();
const roadmapUrls = new Set([...fullLinks, ...extraLinks, ...studyLinks].map((l) => urlKey(l.url)).filter(Boolean));
expItems.forEach((i) => {
  if (!i.url || !roadmapUrls.has(urlKey(i.url))) return;
  const k = i.key || i.url;
  assert.ok(allIds.has(k) || keptKeys.includes(k), `${k} links to the same place as a roadmap item: share its id or add it to EXPEDITED_KEPT_SEPARATE with a reason`);
});
// the schema notes name every kept-separate item, so the written rules cannot drift from the table
const schemaText = (await import('node:fs')).readFileSync(new URL('../src/pro/SCHEMA.md', import.meta.url), 'utf8');
keptKeys.forEach((k) => assert.ok(schemaText.includes(k), `SCHEMA.md explains why ${k} stays separate`));

// ---------- "differs on the other plan" notes: what the other plan asks, and whether he finished that one ----------
const { notesForExpedited, notesForRoadmap, planNoteHtml } = await import('../src/pro/plan-diff.js');
const nothingDone = () => false;
EXPEDITED_KEPT_SEPARATE.forEach((e) => {
  const onExp = notesForExpedited(e.key, nothingDone);
  assert.equal(onExp.length, e.roadmap.length, `${e.key}: one note per roadmap item it differs from`);
  onExp.forEach((n) => assert.ok(n.asks && n.where && n.done === false, `${e.key}: names where and what, not done`));
  e.roadmap.forEach((r) => {
    const onRoad = notesForRoadmap(r.id, nothingDone);
    const stageLabel = stages.find((s) => (s.items || []).some((i) => i.key === e.key)).title.split(' — ')[0];
    assert.ok(onRoad.length >= 1 && onRoad[0].where === `Expedited plan, ${stageLabel}`, `${r.id}: its note names the Expedited stage as the page titles it`);
    assert.equal(onRoad[0].asks, e.expeditedAsks, `${r.id}: its note says what Expedited asks`);
  });
});
// Bandit: Expedited stops at level 15, the roadmap wants all 34, and each side reports whether the OTHER one is done
assert.equal(notesForExpedited('exp4-linux', (id) => id === 'p2-bandit-wargame')[0].done, true, 'Expedited note: the roadmap Bandit is finished');
assert.equal(notesForExpedited('exp4-linux', nothingDone)[0].done, false, 'Expedited note: the roadmap Bandit is not finished');
assert.equal(notesForRoadmap('p2-bandit-wargame', (k) => k === 'exp4-linux')[0].done, true, 'roadmap note: the Expedited Bandit is finished');
assert.equal(notesForRoadmap('p2-bandit-wargame', nothingDone)[0].where, 'Expedited plan, Stage 3', 'named by the stage title on the page, not the badge number');
assert.equal(notesForRoadmap('s3-servicedesk-simulator', nothingDone)[0].where, 'Expedited plan, Employment Gate #1');
// an item the roadmap lists twice reports each one on its own
const owasp = notesForExpedited('exp8-owasp', (id) => id === 'p3-owasp-top-10-for-llm-applications');
assert.equal(owasp.length, 2);
assert.deepEqual(owasp.map((n) => n.done).sort(), [false, true], 'only the Phase 3 copy is done');
// shared items and items with no counterpart get no note
['p2-the-unix-shell-absolute-beginner-navigation', 'p2-comptia-network-n10-009-free-course', 'p8-owasp-top-10-for-agentic-applications'].forEach((id) => {
  assert.deepEqual(notesForExpedited(id, nothingDone), [], `${id}: shared, so nothing differs`);
  assert.deepEqual(notesForRoadmap(id, nothingDone), [], `${id}: shared, so nothing differs`);
});
assert.deepEqual(notesForRoadmap('s3-switchlab', nothingDone), []);
assert.equal(planNoteHtml([]), '');
const doneHtml = planNoteHtml(notesForExpedited('exp4-linux', () => true));
const notDoneHtml = planNoteHtml(notesForExpedited('exp4-linux', nothingDone));
assert.ok(doneHtml.includes('You finished that one') && !doneHtml.includes('not finished'), 'the note says it is finished in words');
assert.ok(notDoneHtml.includes('You have not finished that one'), 'the note says it is not finished in words');
assert.ok(notDoneHtml.includes('All 34 Bandit levels'), 'the Expedited Bandit note spells out the roadmap goal');
assert.ok(!planNoteHtml([{ where: '<b>x</b>', asks: '<script>', done: false }]).includes('<script>'), 'note text is escaped');

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

// ---------- Expedited items that now share a roadmap id (2026-10-26) ----------
// a checkmark he already had on Expedited carries over to the shared id; one already on the roadmap just shows on Expedited
reset({ studyDone: { 'exp0-shell': true, 'exp7-powershell': true, 'exp4-linux': true, 'p8-owasp-top-10-for-agentic-applications': true } });
progress.ensureMigrated();
const sharedDone = progress.studyDoneMap();
assert.equal(sharedDone['p2-the-unix-shell-absolute-beginner-navigation'], true, 'shell navigation carries over from Expedited');
assert.equal(sharedDone['p2-introduction-to-powershell'], true, 'PowerShell carries over from Expedited');
assert.equal(sharedDone['p8-owasp-top-10-for-agentic-applications'], true, 'a roadmap checkmark is kept');
assert.equal(sharedDone['p2-bandit-wargame'], undefined, 'Bandit to level 15 does not finish all 34 levels: items with different scope stay separate');
// runs once: unticking afterwards sticks
progress.toggleStudyDone('p2-the-unix-shell-absolute-beginner-navigation');
progress.ensureMigrated();
assert.equal(progress.isStudyDone('p2-the-unix-shell-absolute-beginner-navigation'), false, 'the carry-over never re-ticks something he unticked');
// a fresh browser: nothing invented
reset();
progress.ensureMigrated();
assert.deepEqual(progress.studyDoneMap(), {});

// ---------- Studies copies of KC7 and Wazuh now use the roadmap ids (2026-10-26) ----------
STUDIES_SHARED_V1.forEach(([from, to]) => {
  assert.ok(!studyLinks.some((l) => l.id === from), `the old Studies id ${from} is gone`);
  assert.ok(studyLinks.some((l) => l.id === to) && fullLinks.some((l) => l.id === to), `${to} is on both Studies and the roadmap`);
});
reset({ studyDone: { 's-approved-p3-kc7': true } });
progress.ensureMigrated();
assert.equal(progress.isStudyDone('p3-kc7'), true, 'a KC7 checkmark saved on Studies carries over to the shared id');
assert.equal(progress.isStudyDone('p3-wazuh'), false, 'nothing is invented for Wazuh');
progress.toggleStudyDone('p3-kc7');
progress.ensureMigrated();
assert.equal(progress.isStudyDone('p3-kc7'), false, 'the carry-over runs once and never re-ticks it');

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

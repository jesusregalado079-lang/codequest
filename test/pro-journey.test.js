// CodeQuest Pro Career Journey: ranks, streaks, the 12-week grid, where he is on the road and when he gets there at
// his pace, achievements, and the dates and pace saved with his progress.
// Run: npm test
import assert from 'node:assert/strict';

const memory = new Map();
globalThis.localStorage = {
  getItem: (k) => (memory.has(k) ? memory.get(k) : null),
  setItem: (k, v) => { memory.set(k, String(v)); },
  removeItem: (k) => { memory.delete(k); },
};

const { default: full, extras, milestones, gate } = await import('../src/pro/career-path.js');
const { default: stages } = await import('../src/pro/expedited-path.js');
const progress = await import('../src/pro/progress.js');
const { careerRank, currentStreak, longestStreak, heatmap, addDays, journey, achievements, groupItems, gateKey, BADGES } = await import('../src/pro/career-logic.js');

const KEY = 'codequest-pro-v1';
const reset = (state) => { memory.clear(); if (state !== undefined) memory.set(KEY, JSON.stringify(state)); };
const TODAY = '2026-10-08'; // a Thursday

// ---------- ranks ----------
assert.equal(careerRank(0).title, 'Recruit');
assert.equal(careerRank(9.5).title, 'Recruit');
assert.equal(careerRank(10).title, 'Apprentice');
assert.equal(careerRank(40).title, 'Operator');
assert.deepEqual(careerRank(70).next, { at: 100, title: 'Technician' });
assert.equal(careerRank(70).pct, 50, 'halfway from Operator (40) to Technician (100)');
assert.equal(careerRank(70).toNext, 30);
const top = careerRank(5000);
assert.equal(top.title, 'Architect');
assert.equal(top.next, null);
assert.equal(top.pct, 100);
assert.equal(top.level, 9);

// ---------- dates and streaks ----------
assert.equal(addDays('2026-10-08', 1), '2026-10-09');
assert.equal(addDays('2026-11-01', -1), '2026-10-31');
assert.equal(addDays('2026-12-31', 1), '2027-01-01');
assert.equal(addDays('2027-03-14', 1), '2027-03-15', 'daylight-saving days do not skip or repeat');
const d = (...days) => Object.fromEntries(days.map((day, i) => [`k${i}`, day]));
assert.equal(currentStreak({}, TODAY), 0);
assert.equal(currentStreak(d(TODAY, '2026-10-07', '2026-10-07', '2026-10-06'), TODAY), 3, 'three days in a row ending today');
assert.equal(currentStreak(d('2026-10-07', '2026-10-06'), TODAY), 2, 'not studied yet today: the streak is still alive');
assert.equal(currentStreak(d('2026-10-06'), TODAY), 0, 'a missed day ends it');
assert.equal(longestStreak(d('2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-10-07', TODAY)), 4);
assert.equal(longestStreak({}), 0);

const grid = heatmap(d(TODAY, TODAY, '2026-10-05', '2026-07-01'), TODAY, 12);
assert.equal(grid.length, 12, '12 weeks');
assert.ok(grid.every((col) => col.length === 7), '7 days a week');
assert.equal(grid[11][0].iso, '2026-10-05', 'the last column starts on this Monday');
assert.equal(grid[11][3].iso, TODAY);
assert.equal(grid[11][3].count, 2);
assert.equal(grid[11][0].count, 1);
assert.equal(grid[11][4].future, true, 'Friday is still ahead');
assert.equal(grid[11][3].future, false);
assert.equal(grid[0][0].iso, '2026-07-20', 'twelve Mondays back');
assert.equal(grid.flat().reduce((s, x) => s + x.count, 0), 3, 'days older than the grid are left out');

// ---------- the journey ----------
const keysOf = (n) => groupItems(full.find((p) => p.n === n)).map((i) => i.key);
const markAll = (keys, day = TODAY) => ({ done: Object.fromEntries(keys.map((k) => [k, true])), doneAt: Object.fromEntries(keys.map((k) => [k, day])) });
const jr = (done, doneAt = {}, hoursPerWeek = 21) => journey({ full, milestones, gate, stages, done, doneAt, hoursPerWeek, todayIso: TODAY });

const start = jr({});
assert.equal(start.pct, 0);
assert.equal(start.allHoursDone, 0);
assert.equal(start.rank.title, 'Recruit');
assert.equal(start.current.n, 1, 'he starts at Phase 1');
assert.equal(start.phases[0].state, 'current');
assert.ok(start.phases.filter((p) => p.lane).every((p) => p.state === 'lane'), 'side quests are never "you are here"');
assert.equal(start.next.phase, 1);
assert.equal(start.next.id, full[0].links[0].id, 'next up is the first Phase 1 resource');
assert.equal(start.weeksLeft, Math.ceil(start.coreHoursTotal / 21));
assert.ok(start.finishIso > TODAY);
assert.ok(start.milestones.every((m) => !m.reached));
assert.ok(start.milestones.filter((m) => m.onTheJob).every((m) => m.etaIso === null), 'years on the job get no study-hours date');
assert.ok(start.milestones.filter((m) => !m.onTheJob).every((m) => m.etaIso > TODAY));
assert.equal(start.expedited.length, stages.length);
assert.equal(start.gate.total, gate.conditions.length);

const p1 = markAll(keysOf(1));
const after1 = jr(p1.done, p1.doneAt);
assert.equal(after1.phases[0].state, 'done');
assert.equal(after1.current.n, 2, 'Phase 1 done: Phase 2 is where he is');
assert.equal(after1.next.phase, 2);
assert.ok(after1.milestones.find((m) => m.requires.length === 1 && m.requires[0] === 1).reached, 'the Phase 1 milestone is reached');
assert.ok(after1.pct > 0 && after1.pct < 100);
assert.ok(after1.weeksLeft < start.weeksLeft);
assert.equal(after1.streak, 1);

const fast = jr(p1.done, p1.doneAt, 42);
assert.ok(fast.weeksLeft <= Math.ceil(after1.weeksLeft / 2) + 1, 'twice the hours, about half the weeks');
assert.ok(fast.finishIso < after1.finishIso);
assert.ok(jr(p1.done, p1.doneAt, 0).weeksLeft > 0, 'a zero pace never divides by zero');

// when the links of the current phase are done, the next thing is a deliverable
const p2links = full.find((p) => p.n === 2).links.map((l) => l.id);
const withLinks = { ...p1.done, ...Object.fromEntries(p2links.map((k) => [k, true])) };
const outNext = jr(withLinks).next;
if (full.find((p) => p.n === 2).outputs?.length) assert.equal(outNext.kind, 'output');

// everything core done: no next, 100%, every study milestone reached
const allCore = markAll(full.filter((p) => !p.lane).flatMap((p) => keysOf(p.n)));
const finished = jr(allCore.done, allCore.doneAt);
assert.equal(finished.pct, 100);
assert.equal(finished.next, null);
assert.equal(finished.current, null);
assert.equal(finished.weeksLeft, 0);
assert.ok(finished.milestones.filter((m) => m.requires.every((n) => !full.find((p) => p.n === n).lane)).every((m) => m.reached));

// ---------- achievements ----------
const ach = (done, doneAt = {}) => achievements({ done, doneAt, full, extras, stages, gate, j: jr(done, doneAt) });
assert.equal(new Set(BADGES.map((b) => b.id)).size, BADGES.length, 'badge ids are unique');
assert.equal(ach({}).filter((b) => b.earned).length, 0, 'nothing earned on day one');
const sticky = achievements({ done: {}, doneAt: {}, full, extras, stages, gate, j: jr({}), exam: { runAtTarget: 0 }, kept: { 'phase-1': TODAY, 'exam-ready': TODAY } });
assert.equal(sticky.find((b) => b.id === 'phase-1').earned, true, 'a career badge stays earned after its checkmarks are removed');
assert.equal(sticky.find((b) => b.id === 'phase-1').have, 0, 'the career progress count stays live');
assert.equal(sticky.find((b) => b.id === 'exam-ready').earned, true, 'a stored exam badge stays earned after its current run lapses');
assert.equal(sticky.find((b) => b.id === 'exam-ready').have, 0, 'the exam progress count stays live');
const one = ach(p1.done, p1.doneAt);
const got = (list, id) => list.find((b) => b.id === id);
assert.ok(got(one, 'first-step').earned);
assert.ok(got(one, 'phase-1').earned);
assert.equal(got(one, 'phase-1').date, TODAY, 'a badge is dated by the tick that earned it');
assert.equal(got(one, 'phase-2').earned, false);
assert.equal(got(one, 'phase-2').need, keysOf(2).length);
assert.ok(one.every((b) => b.have <= b.need), 'progress never shows more than needed');
const undated = ach(p1.done, {});
assert.ok(got(undated, 'phase-1').earned && got(undated, 'phase-1').date === null, 'old undated ticks still count, without a date');
// First careerState-style recording keeps computed tick dates and dates undated badges today.
const oldDone = { ...p1.done, 'quiz:p1-agentic-ai-explained': true };
const oldDoneAt = Object.fromEntries(keysOf(1).map((key) => [key, '2026-09-20']));
reset({ studyDone: oldDone, doneAt: oldDoneAt });
const savedDone = progress.studyDoneMap();
const savedDoneAt = progress.doneDates();
const badgeContext = { done: savedDone, doneAt: savedDoneAt, full, extras, stages, gate, j: jr(savedDone, savedDoneAt), kept: progress.getBadges() };
const firstLoadBadges = achievements(badgeContext);
assert.equal(got(firstLoadBadges, 'phase-1').date, '2026-09-20');
assert.equal(got(firstLoadBadges, 'quiz-first').date, null);
const newlyEarned = firstLoadBadges.filter((b) => b.earned && !Object.hasOwn(badgeContext.kept, b.id));
assert.deepEqual(progress.recordBadges(Object.fromEntries(newlyEarned.map((b) => [b.id, b.date || TODAY]))), { ok: true });
assert.equal(progress.getBadges()['phase-1'], '2026-09-20', 'the first save keeps the computed career badge date');
assert.equal(progress.getBadges()['quiz-first'], TODAY, 'a badge without a computed date uses today');
assert.equal(got(achievements({ ...badgeContext, kept: progress.getBadges() }), 'phase-1').date, '2026-09-20', 'the Journey date stays on the tick day');
const streaky = ach(p1.done, Object.fromEntries(keysOf(1).map((k, i) => [k, addDays(TODAY, -(i % 3))])));
assert.ok(got(streaky, 'streak-3').earned);
assert.equal(got(streaky, 'streak-7').earned, false);
const gate1 = stages.find((s) => s.n === 2).items.map((i) => i.key || i.url);
assert.ok(got(ach(Object.fromEntries(gate1.map((k) => [k, true]))), 'exp-gate-1').earned, 'Expedited Gate #1 earns its badge');
assert.ok(got(ach(Object.fromEntries(gate.conditions.map((c) => [gateKey(c), true]))), 'gate-open').earned);
const quizDone = ach({ 'quiz:p1-agentic-ai-explained': true });
assert.ok(got(quizDone, 'quiz-first').earned);

// ---------- saved dates and pace ----------
const today = new Date().toLocaleDateString('en-CA');
reset();
assert.equal(progress.getSettings().hoursPerWeek, 21, 'the pace starts at 3 hours a day');
progress.toggleStudyDone('a');
assert.equal(progress.doneDates().a, today, 'a tick is dated today');
progress.toggleStudyDone('a');
assert.equal(progress.doneDates().a, undefined, 'unticking removes the date');
reset({ studyDone: { b: true }, doneAt: { b: '2026-09-01' } });
progress.setStudyDone('b', true);
assert.equal(progress.doneDates().b, '2026-09-01', 'ticking something already ticked keeps its first date');
reset({ studyDone: { a: true, b: true }, doneAt: { a: '2026-09-01', b: 'yesterday', c: '2026-09-02', __proto__: '2026-09-03' }, settings: { hoursPerWeek: 'lots' } });
assert.deepEqual(progress.doneDates(), { a: '2026-09-01' }, 'bad dates and dates for unticked items are dropped');
assert.equal(progress.getSettings().hoursPerWeek, 21, 'a damaged pace falls back to 21');
assert.equal(progress.setHoursPerWeek(0).ok, false);
assert.equal(progress.setHoursPerWeek(101).ok, false);
assert.equal(progress.setHoursPerWeek('abc').ok, false);
assert.equal(progress.getSettings().hoursPerWeek, 21);
assert.equal(progress.setHoursPerWeek('35').ok, true);
assert.equal(progress.getSettings().hoursPerWeek, 35);
// backups carry the dates and the pace; merging keeps the earliest date
const file = progress.exportProgress();
reset({ studyDone: { a: true }, doneAt: { a: '2026-10-01' } });
assert.equal(progress.importProgress(file).ok, true);
assert.equal(progress.doneDates().a, '2026-09-01', 'merge keeps the earlier date');
reset();
progress.importProgress(file, 'replace');
assert.equal(progress.getSettings().hoursPerWeek, 35, 'replace brings the pace back');
assert.equal(progress.doneDates().a, '2026-09-01');

console.log('ok — pro journey: ranks, streaks, 12-week grid, road position and pace dates, achievements, saved dates and pace');

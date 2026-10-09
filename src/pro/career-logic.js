// Pure helpers for the Career Path pages (no DOM, no storage): progress keys, per-group counts, the quiz pass mark.
// pro.js renders with these; test/pro-career.test.js checks them directly.

// Every resource has a permanent `id`. Deliverables use `out:<key>`, gate conditions `gate:<key>`, a passed quiz
// `quiz:<id>`.
export const outKey = (o) => `out:${o.key}`;
export const gateKey = (c) => `gate:${c.key}`;
export const quizKey = (id) => `quiz:${id}`;

// Every checkable thing in a group, in display order.
export function groupItems(g) {
  const links = g.links.map((l) => ({ key: l.id, hours: l.hours || 0 }));
  const outs = (g.outputs || []).map((o) => ({ key: outKey(o), hours: 0 }));
  return [...links, ...outs];
}

// `done` is the saved checkmark map ({ key: true }).
export function groupStats(g, done) {
  const items = groupItems(g);
  const finished = items.filter((i) => done[i.key] === true);
  const hoursTotal = items.reduce((s, i) => s + i.hours, 0);
  const hoursDone = finished.reduce((s, i) => s + i.hours, 0);
  return { done: finished.length, total: items.length, hoursDone, hoursTotal, pct: items.length ? Math.round((finished.length / items.length) * 100) : 0 };
}

// A quiz passes at two thirds right, rounded up: 2 of 3, 1 of 1, 2 of 2.
export const passMark = (n) => Math.ceil((n * 2) / 3);

// ---------------------------------------------------------------------------------------------------------------
// The Journey page: where he is, where he is going, how long at his pace, and what he has unlocked. All pure: it takes
// the data, the checkmark map (`done`), the dates (`doneAt`), the weekly hours and today's date, and returns numbers.
// ---------------------------------------------------------------------------------------------------------------

// Career ranks by study hours on the core route (the optional income lanes still count toward hours).
export const CAREER_RANKS = Object.freeze([
  [0, 'Recruit'],
  [10, 'Apprentice'],
  [40, 'Operator'],
  [100, 'Technician'],
  [200, 'Analyst'],
  [350, 'Defender'],
  [500, 'Hunter'],
  [700, 'Engineer'],
  [900, 'Architect'],
]);

export function careerRank(hours) {
  let i = 0;
  while (i + 1 < CAREER_RANKS.length && hours >= CAREER_RANKS[i + 1][0]) i += 1;
  const [floor, title] = CAREER_RANKS[i];
  const next = CAREER_RANKS[i + 1] || null;
  return { level: i + 1, title, floor, next: next ? { at: next[0], title: next[1] } : null, toNext: next ? next[0] - hours : 0, pct: next ? Math.round(((hours - floor) / (next[0] - floor)) * 100) : 100 };
}

const DAY = 86400000;
const isoDay = (d) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
const parseDay = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
export const addDays = (iso, days) => isoDay(new Date(parseDay(iso).getTime() + days * DAY));

// Days on which at least one item was ticked, and the streak of consecutive such days ending today (or yesterday,
// so a streak is not "lost" before he has studied today).
export function studyDays(doneAt) {
  const counts = {};
  Object.values(doneAt || {}).forEach((d) => { counts[d] = (counts[d] || 0) + 1; });
  return counts;
}
export function currentStreak(doneAt, todayIso) {
  const days = studyDays(doneAt);
  let cursor = days[todayIso] ? todayIso : addDays(todayIso, -1);
  let n = 0;
  while (days[cursor]) { n += 1; cursor = addDays(cursor, -1); }
  return n;
}
export function longestStreak(doneAt) {
  const sorted = Object.keys(studyDays(doneAt)).sort();
  let best = 0;
  let run = 0;
  sorted.forEach((d, i) => { run = i > 0 && addDays(sorted[i - 1], 1) === d ? run + 1 : 1; best = Math.max(best, run); });
  return best;
}
// The last `weeks` weeks as columns of 7 days (Monday first), oldest first: [{ iso, count, future }].
export function heatmap(doneAt, todayIso, weeks = 12) {
  const days = studyDays(doneAt);
  const today = parseDay(todayIso);
  const mondayOffset = (today.getUTCDay() + 6) % 7;
  const start = addDays(todayIso, -mondayOffset - (weeks - 1) * 7);
  const cols = [];
  for (let w = 0; w < weeks; w += 1) {
    const col = [];
    for (let d = 0; d < 7; d += 1) {
      const iso = addDays(start, w * 7 + d);
      col.push({ iso, count: days[iso] || 0, future: iso > todayIso });
    }
    cols.push(col);
  }
  return cols;
}

// Everything the Journey page shows. `full`: the phases; `stages`: the Expedited stages (their keys); `settings.hoursPerWeek`.
export function journey({ full, milestones, gate, stages = [], done, doneAt = {}, hoursPerWeek = 21, todayIso }) {
  const phases = full.map((p) => {
    const st = groupStats(p, done);
    return { n: p.n, title: p.title, short: p.title.replace(/^Phase \d+ — /, ''), lane: !!p.lane, months: p.months, ...st };
  });
  const core = phases.filter((p) => !p.lane);
  const current = core.find((p) => p.pct < 100) || null;
  phases.forEach((p) => {
    if (p.pct === 100) p.state = 'done';
    else if (current && p.n === current.n) p.state = 'current';
    else if (p.lane) p.state = p.done > 0 ? 'active-lane' : 'lane';
    else p.state = 'ahead';
  });
  const sum = (list, f) => list.reduce((s, x) => s + x[f], 0);
  const coreHoursTotal = sum(core, 'hoursTotal');
  const coreHoursDone = sum(core, 'hoursDone');
  const allHoursDone = sum(phases, 'hoursDone');
  const coreItems = sum(core, 'total');
  const coreDone = sum(core, 'done');
  const pace = Math.max(1, hoursPerWeek);
  const weeksLeft = Math.ceil(Math.max(0, coreHoursTotal - coreHoursDone) / pace);
  const finishIso = addDays(todayIso, Math.ceil((Math.max(0, coreHoursTotal - coreHoursDone) / pace) * 7));

  // milestones: reached, or the date he gets there at his pace (hours left in the phases it needs)
  const byN = new Map(phases.map((p) => [p.n, p]));
  const ms = milestones.map((m) => {
    const needs = m.requires.map((n) => byN.get(n)).filter(Boolean);
    const reached = needs.every((p) => p.pct === 100);
    const hoursLeft = needs.reduce((s, p) => s + Math.max(0, p.hoursTotal - p.hoursDone), 0);
    // "Years 3-6+ of applied experience" is time on the job, not study hours: no date for that one
    const onTheJob = /^years/i.test(m.when);
    return { ...m, reached, hoursLeft, onTheJob, etaIso: reached || onTheJob ? null : addDays(todayIso, Math.ceil((hoursLeft / pace) * 7)), after: Math.max(...m.requires) };
  });

  // the next thing to do: the first unticked resource, then deliverable, in the current phase
  let next = null;
  const phaseForNext = current ? full.find((p) => p.n === current.n) : null;
  if (phaseForNext) {
    const link = phaseForNext.links.find((l) => done[l.id] !== true);
    if (link) next = { kind: 'link', phase: phaseForNext.n, id: link.id, name: link.name, by: link.by, url: link.url, hours: link.hours || 0, note: link.note };
    else {
      const out = (phaseForNext.outputs || []).find((o) => done[outKey(o)] !== true);
      if (out) next = { kind: 'output', phase: phaseForNext.n, id: outKey(out), name: out.name, hours: 0 };
    }
  }

  const exp = stages.map((s) => {
    const items = s.items || [];
    const finished = items.filter((i) => done[i.key || i.url] === true).length;
    return { n: s.n, title: s.title, done: finished, total: items.length, pct: items.length ? Math.round((finished / items.length) * 100) : 0 };
  });

  const gateDone = (gate && gate.conditions ? gate.conditions : []).filter((c) => done[gateKey(c)] === true).length;
  const rankNow = careerRank(allHoursDone);
  return {
    phases, current, next, milestones: ms, expedited: exp,
    coreHoursTotal, coreHoursDone, allHoursDone, coreItems, coreDone,
    pct: coreItems ? Math.round((coreDone / coreItems) * 100) : 0,
    hoursPerWeek: pace, weeksLeft, finishIso,
    rank: rankNow,
    streak: currentStreak(doneAt, todayIso), bestStreak: longestStreak(doneAt),
    gate: { done: gateDone, total: (gate && gate.conditions ? gate.conditions.length : 0) },
  };
}

// ---------- achievements ----------
// Each badge: id, icon, name, how (what earns it), and test(ctx) -> { earned, progress: [have, need] }.
// ctx: { done, doneAt, full, extras, stages, gate, j (journey), exam? (Security+ summary), exams? ({ [examId]: summary }), labs? }.
const countDone = (ctx, keys) => keys.filter((k) => ctx.done[k] === true).length;
const latestDate = (ctx, keys) => keys.map((k) => ctx.doneAt[k]).filter(Boolean).sort().pop() || null;
const linkIds = (ctx) => ctx.full.flatMap((p) => p.links.map((l) => l.id));
const outIds = (ctx) => ctx.full.flatMap((p) => (p.outputs || []).map(outKey));
const quizIds = (ctx) => [...ctx.full, ...ctx.extras].flatMap((g) => g.links.filter((l) => l.quiz).map((l) => quizKey(l.id)));
const phaseKeys = (ctx, n) => groupItems(ctx.full.find((p) => p.n === n)).map((i) => i.key);
const allKeys = (ctx) => [...linkIds(ctx), ...outIds(ctx)];
const stageKeys = (ctx, n) => ((ctx.stages.find((s) => s.n === n) || {}).items || []).map((i) => i.key || i.url);

const countBadge = (id, icon, name, need, how) => ({ id, icon, name, how, group: 'Momentum', test: (ctx) => ({ have: countDone(ctx, allKeys(ctx)), need }) });
const hoursBadge = (id, icon, name, need) => ({ id, icon, name, how: `Log ${need} study hours on the roadmap`, group: 'Hours', test: (ctx) => ({ have: ctx.j.allHoursDone, need, keys: linkIds(ctx) }) });
const phaseBadge = (n, icon, name) => ({ id: `phase-${n}`, icon, name, how: `Finish every item in Phase ${n}`, group: 'Phases', phase: n, test: (ctx) => { const keys = phaseKeys(ctx, n); return { have: countDone(ctx, keys), need: keys.length, keys }; } });
// Exam practice badges read ctx.exam (the exam page's summary); no exam data means no progress, never a crash.
const examBadge = (id, icon, name, how, have, need) => ({ id, icon, name, how, group: 'Exam', test: (ctx) => {
  const e = ctx.exam;
  const n = typeof need === 'function' ? (e ? need(e) : 1) : need;
  return { have: e ? have(e) : 0, need: Math.max(1, n), noDate: true };
} });
// Hands-on lab badges read ctx.labs (labSummary from labs/lab-logic.js: { total, passed, perfect, perLab }); no lab data
// means no progress, never a crash. need() may depend on the catalog (a lab's case count grows with its content).
// "Ready" for the other exams: the same rule as exam-ready (three full mocks in a row at the target), read from
// ctx.exams[examId] (every exam's summary). Security+ mocks never count toward these.
const examReadyBadge = (id, icon, name, examId, short) => ({ id, icon, name, how: `Three full ${short} mocks in a row at 85% or more`, group: 'Exam', test: (ctx) => {
  const e = ctx.exams && typeof ctx.exams === 'object' ? ctx.exams[examId] : null;
  const run = e && Number.isFinite(e.runAtTarget) ? e.runAtTarget : 0;
  return { have: run, need: 3, noDate: true };
} });
const labOne = (l, id) => (l && Array.isArray(l.perLab) ? l.perLab.find((x) => x && x.id === id) : null) || null;
const labBadge = (id, icon, name, how, have, need) => ({ id, icon, name, how, group: 'Labs', test: (ctx) => {
  const l = ctx.labs && typeof ctx.labs === 'object' ? ctx.labs : null;
  const n = typeof need === 'function' ? (l ? need(l) : 1) : need;
  const h = l ? have(l) : 0;
  return { have: Number.isFinite(h) ? h : 0, need: Math.max(1, Number.isFinite(n) ? n : 1), noDate: true };
} });
const labCases = (labId) => [(l) => (labOne(l, labId) || {}).passed || 0, (l) => (labOne(l, labId) || {}).total || 1];
const streakBadge = (id, icon, name, need) => ({ id, icon, name, how: `Tick something ${need} days in a row`, group: 'Consistency', test: (ctx) => ({ have: ctx.j.bestStreak, need, noDate: true }) });

export const BADGES = Object.freeze([
  countBadge('first-step', '👣', 'First Step', 1, 'Tick your first item'),
  countBadge('ten-down', '🔟', 'Ten Down', 10, 'Tick 10 items'),
  countBadge('quarter-century', '🎯', 'Quarter Century', 25, 'Tick 25 items'),
  countBadge('half-century', '🏅', 'Half Century', 50, 'Tick 50 items'),
  countBadge('centurion', '🏛️', 'Centurion', 100, 'Tick 100 items'),
  hoursBadge('hours-10', '⏱️', 'Warmed Up', 10),
  hoursBadge('hours-50', '🔥', 'Fifty Hours Deep', 50),
  hoursBadge('hours-100', '💯', 'Hundred Hour Club', 100),
  hoursBadge('hours-250', '⚙️', 'Quarter Thousand', 250),
  hoursBadge('hours-500', '🛡️', 'Five Hundred Strong', 500),
  phaseBadge(1, '🤖', 'AI Security Operator'),
  phaseBadge(2, '🧱', 'Foundation Built'),
  phaseBadge(3, '🧪', 'Lab Builder'),
  phaseBadge(4, '💼', 'Auditor (side quest)'),
  phaseBadge(5, '☁️', 'Cloud Automator'),
  phaseBadge(6, '🎟️', 'Job-Market Ready'),
  phaseBadge(7, '🐞', 'Bug Hunter (side quest)'),
  phaseBadge(8, '🧠', 'AI Security Specialist'),
  { id: 'quiz-first', icon: '✅', name: 'Tested Yourself', how: 'Pass your first quiz (2 of 3)', group: 'Knowledge', test: (ctx) => ({ have: countDone(ctx, quizIds(ctx)), need: 1, keys: quizIds(ctx) }) },
  { id: 'quiz-five', icon: '🧩', name: 'Quiz Streaker', how: 'Pass 5 quizzes', group: 'Knowledge', test: (ctx) => ({ have: countDone(ctx, quizIds(ctx)), need: 5, keys: quizIds(ctx) }) },
  { id: 'quiz-all', icon: '🎓', name: 'Know-It-All', how: 'Pass every quiz on the roadmap and Extra', group: 'Knowledge', test: (ctx) => ({ have: countDone(ctx, quizIds(ctx)), need: quizIds(ctx).length, keys: quizIds(ctx) }) },
  { id: 'proof-first', icon: '📦', name: 'Proof of Work', how: 'Finish your first deliverable', group: 'Portfolio', test: (ctx) => ({ have: countDone(ctx, outIds(ctx)), need: 1, keys: outIds(ctx) }) },
  { id: 'proof-ten', icon: '🗂️', name: 'Portfolio Builder', how: 'Finish 10 deliverables', group: 'Portfolio', test: (ctx) => ({ have: countDone(ctx, outIds(ctx)), need: 10, keys: outIds(ctx) }) },
  streakBadge('streak-3', '✨', 'On a Roll', 3),
  streakBadge('streak-7', '📅', 'Full Week', 7),
  streakBadge('streak-30', '🌋', 'Unstoppable', 30),
  { id: 'exp-gate-1', icon: '🚪', name: 'Ready to Apply', how: 'Finish Expedited Employment Gate #1', group: 'Expedited', test: (ctx) => { const keys = stageKeys(ctx, 2); return { have: countDone(ctx, keys), need: Math.max(1, keys.length), keys }; } },
  { id: 'exp-gate-2', icon: '🛰️', name: 'SOC Contender', how: 'Finish Expedited Employment Gate #2', group: 'Expedited', test: (ctx) => { const keys = stageKeys(ctx, 6); return { have: countDone(ctx, keys), need: Math.max(1, keys.length), keys }; } },
  examBadge('exam-first-mock', '📝', 'First Mock', 'Finish a full Security+ mock exam', (e) => e.mocks, 1),
  examBadge('exam-above-bar', '🎯', 'Above the Bar', 'Score 85% or more on a full mock', (e) => (e.best !== null && e.best >= e.target ? 1 : 0), 1),
  examBadge('exam-ready', '🛡️', 'Exam Ready', 'Three full mocks in a row at 85% or more', (e) => e.runAtTarget, 3),
  examBadge('exam-seen-100', '📚', 'Hundred Questions', 'Answer 100 different exam questions', (e) => e.seen, 100),
  examBadge('exam-seen-all', '🗺️', 'Seen It All', 'Answer every question in the Security+ bank', (e) => e.seen, (e) => e.total),
  examReadyBadge('exam-np9-ready', '🌐', 'Network+ Ready', 'netplus-009', 'Network+'),
  examReadyBadge('exam-ap1-ready', '🔧', 'A+ Core 1 Ready', 'aplus-1201', 'A+ Core 1'),
  examReadyBadge('exam-ap2-ready', '🖥️', 'A+ Core 2 Ready', 'aplus-1202', 'A+ Core 2'),
  labBadge('lab-first', '🧪', 'First Lab', 'Pass any hands-on lab case', (l) => l.passed || 0, 1),
  labBadge('lab-fw', '🧱', 'Firewall Fixer', 'Pass every Firewall & Network Diagram case', ...labCases('fw')),
  labBadge('lab-logs', '🔎', 'Log Detective', 'Pass every Log Detective set', ...labCases('logs')),
  labBadge('lab-subnet', '🧮', 'Subnet Sprinter', 'Pass all four Subnet Sprint levels', ...labCases('subnet')),
  labBadge('lab-cli', '💻', 'Terminal Medic', 'Pass every Terminal Troubleshooter case', ...labCases('cli')),
  labBadge('lab-phish', '🎣', 'Phish Spotter', 'Pass every Phish Inspector case', ...labCases('phish')),
  labBadge('lab-code', '🛠️', 'Detection Coder', 'Pass every Detection Coder lab', ...labCases('code')),
  labBadge('lab-perfect-10', '💯', 'Ten Perfect', 'Score 100% on 10 lab cases', (l) => l.perfect || 0, 10),
  labBadge('lab-all', '🏅', 'Hands-On Hero', 'Pass every case of every lab', (l) => l.passed || 0, (l) => l.total || 1),
  { id: 'gate-open', icon: '🔓', name: 'Gate Open', how: 'Meet all four paid-cert gate conditions', group: 'Milestones', test: (ctx) => { const keys = (ctx.gate.conditions || []).map(gateKey); return { have: countDone(ctx, keys), need: Math.max(1, keys.length), keys }; } },
]);

// [{ ...badge, earned, have, need, date }] in catalog order.
export function achievements(ctx) {
  return BADGES.map((b) => {
    const r = b.test(ctx);
    const storedDate = ctx.kept && Object.hasOwn(ctx.kept, b.id) ? ctx.kept[b.id] : null;
    const earned = (r.need > 0 && r.have >= r.need) || storedDate !== null;
    const keys = r.keys || (b.group === 'Momentum' ? allKeys(ctx) : []);
    return { id: b.id, icon: b.icon, name: b.name, how: b.how, group: b.group, phase: b.phase || null, earned, have: Math.min(r.have, r.need), need: r.need, date: storedDate || (earned && !r.noDate ? latestDate(ctx, keys) : null) };
  });
}

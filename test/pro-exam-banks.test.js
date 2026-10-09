// CodeQuest Pro practice banks, the ship gate for every exam: no placeholder questions, every question well formed and
// tagged to a real objective of its exam, every objective covered, held-out share sane, and no easy tells (answer
// position, answer usually the longest choice). Collects every problem before failing so one run lists them all.
// Run: npm test
import assert from 'node:assert/strict';

const { BLUEPRINTS } = await import('../src/pro/exam/blueprints.js');
const { BANK_LOADERS } = await import('../src/pro/exam/loaders.js');

const failures = [];
const ok = (cond, msg) => { if (!cond) failures.push(msg); };
let checks = 0;
const counts = [];

for (const bp of BLUEPRINTS) {
  const name = `${bp.short} ${bp.code}`;
  const load = BANK_LOADERS[bp.id];
  ok(typeof load === 'function', `${name}: has a bank loader`);
  if (typeof load !== 'function') continue;
  const mod = await load();
  const bank = mod.default || mod;
  const questions = Array.isArray(bank.questions) ? bank.questions : [];
  const sources = bank.sources || {};
  const objIds = new Set(bp.domains.flatMap((d) => d.objectives.map((o) => o.id)));
  const ids = new Set();
  counts.push(`${bp.short} ${questions.length}`);

  ok(questions.length >= 150, `${name}: at least 150 questions (has ${questions.length})`);
  for (const [k, v] of Object.entries(sources)) {
    checks += 1;
    ok(/^[a-z0-9][a-z0-9-]*$/.test(k), `${name}: source key ${k} is lowercase-hyphen`);
    ok(Array.isArray(v) && v.length === 2 && typeof v[0] === 'string' && v[0].length > 0 && /^https:\/\//.test(v[1]), `${name}: source ${k} is [title, https url]`);
    ok(!/wikipedia\.org|professormesser|examcompass|quizlet|diontraining|udemy/i.test(String(v[1])), `${name}: source ${k} is not a prep site or Wikipedia (${v[1]})`);
  }
  for (const q of questions) {
    checks += 1;
    const id = String(q.id);
    ok(!id.startsWith('seed-'), `${name}: placeholder question ${id} must be replaced before shipping`);
    ok(!ids.has(id), `${name}: duplicate id ${id}`);
    ids.add(id);
    ok(new RegExp(`^${bp.prefix}-\\d\\.\\d{1,2}-\\d{3}$`).test(id) || id.startsWith('seed-'), `${name}: id ${id} has the form ${bp.prefix}-<obj>-<nnn>`);
    ok(objIds.has(q.obj), `${name}: ${id} objective ${q.obj} exists in the blueprint`);
    ok(id.startsWith('seed-') || id.startsWith(`${bp.prefix}-${q.obj}-`), `${name}: ${id} id matches its objective ${q.obj}`);
    ok([1, 2, 3].includes(q.diff), `${name}: ${id} difficulty 1 to 3`);
    ok(typeof q.q === 'string' && q.q.length > 10 && q.q.length <= 400, `${name}: ${id} question text 11 to 400 chars`);
    ok(Array.isArray(q.choices) && q.choices.length === 4 && new Set(q.choices).size === 4, `${name}: ${id} has 4 distinct choices`);
    ok((q.choices || []).every((c) => typeof c === 'string' && c.length > 0 && c.length <= 140), `${name}: ${id} choices are 1 to 140 chars`);
    ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3, `${name}: ${id} answer index 0 to 3`);
    ok(typeof q.why === 'string' && q.why.length > 0 && q.why.length <= 400, `${name}: ${id} why 1 to 400 chars`);
    const wn = Object.keys(q.whyNot || {}).map(Number).sort((a, b) => a - b);
    ok(JSON.stringify(wn) === JSON.stringify([0, 1, 2, 3].filter((i) => i !== q.answer)), `${name}: ${id} whyNot covers every wrong choice and not the answer`);
    ok(Object.values(q.whyNot || {}).every((s) => typeof s === 'string' && s.length > 0 && s.length <= 200), `${name}: ${id} whyNot entries 1 to 200 chars`);
    ok(Array.isArray(q.src) && q.src.length >= 1 && q.src.length <= 3 && q.src.every((k) => sources[k]), `${name}: ${id} cites 1 to 3 existing sources`);
    ok(q.checkOnly === undefined || q.checkOnly === true, `${name}: ${id} checkOnly is true or absent`);
    ok(!/[–—]|<[a-z/][^>]*>|\*\*/i.test(JSON.stringify([q.q, q.choices, q.why, q.whyNot])), `${name}: ${id} plain text (no em/en dashes, HTML or markdown)`);
  }
  const real = questions.filter((q) => !String(q.id).startsWith('seed-'));
  if (real.length) {
    const n = real.length;
    for (const o of objIds) ok(real.some((q) => q.obj === o), `${name}: objective ${o} has at least one question`);
    const pos = [0, 1, 2, 3].map((i) => real.filter((q) => q.answer === i).length);
    ok(Math.min(...pos) >= n * 0.18, `${name}: answer positions balanced (${pos.join('/')})`);
    const longest = real.filter((q) => q.choices[q.answer].length > Math.max(...q.choices.filter((_, i) => i !== q.answer).map((c) => c.length))).length;
    ok(longest / n <= 0.35, `${name}: answer is the strictly longest choice in ${Math.round((100 * longest) / n)}% of questions (at most 35%)`);
    const held = real.filter((q) => q.checkOnly).length;
    ok(held / n >= 0.15 && held / n <= 0.35, `${name}: held-out share ${Math.round((100 * held) / n)}% (15 to 35%)`);
    for (const d of bp.domains) {
      const inDomain = real.filter((q) => Number(q.obj.split('.')[0]) === d.n);
      ok(inDomain.filter((q) => !q.checkOnly).length >= 10, `${name}: domain ${d.n} has at least 10 practice questions`);
      ok(inDomain.filter((q) => q.checkOnly).length >= 3, `${name}: domain ${d.n} has at least 3 held-out questions`);
    }
  }
}

assert.ok(failures.length === 0, `${failures.length} bank problems:\n${failures.slice(0, 80).join('\n')}${failures.length > 80 ? `\n... and ${failures.length - 80} more` : ''}`);
console.log(`ok — pro exam banks: ${counts.join(', ')} (${checks} checks: no placeholders, objectives covered, no answer tells)`);

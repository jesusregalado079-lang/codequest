// A+ content gate: validate every authored case and replay it through its real engine.
// Run directly with: node test/pro-aplus-labs-content.test.js
import { BLUEPRINTS } from '../src/pro/exam/blueprints.js';
import { createSim } from '../src/pro/labs/aplus/sim.js';
import { createShell, applyStep as shellStep } from '../src/pro/labs/aplus/shell.js';
import { startPicks, applyStep as buildStep, evaluateBuild } from '../src/pro/labs/aplus/pcbuild.js';
import { startState, applyStep as orderStep, gradeOrder } from '../src/pro/labs/aplus/order.js';

const files = {
  win: await import('../src/pro/labs/aplus/content/win-cases.js'),
  shell: await import('../src/pro/labs/aplus/content/shell-cases.js'),
  build: await import('../src/pro/labs/aplus/content/build-cases.js'),
  router: await import('../src/pro/labs/aplus/content/router-cases.js'),
  order: await import('../src/pro/labs/aplus/content/order-cases.js'),
  mobprint: await import('../src/pro/labs/aplus/content/mobprint-cases.js'),
};
const expectedCases = { win: 8, shell: 8, build: 6, router: 6, order: 6, mobprint: 8 };
const objectiveIds = Object.fromEntries(BLUEPRINTS.map((bp) => [
  bp.id, new Set(bp.domains.flatMap((domain) => domain.objectives.map((objective) => objective.id))),
]));
const publicResolvers = new Set(['1.1.1.1', '1.0.0.1', '1.1.1.2', '1.0.0.2', '1.1.1.3', '1.0.0.3', '9.9.9.9']);
const problems = [];
let checks = 0;
let casesChecked = 0;
let trapsChecked = 0;
const check = (condition, message) => { checks += 1; if (!condition) problems.push(message); };
const nonempty = (value) => typeof value === 'string' && value.trim().length > 0;
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

function attempt(where, fn) {
  try { return fn(); } catch (error) { problems.push(`${where}: ${error.message}`); return null; }
}

function eachString(value, path, visit) {
  if (typeof value === 'string') visit(path, value);
  else if (Array.isArray(value)) value.forEach((item, index) => eachString(item, `${path}[${index}]`, visit));
  else if (object(value)) Object.entries(value).forEach(([key, item]) => eachString(item, `${path}.${key}`, visit));
}

function sourceKeys(where, keys, sources) {
  check(Array.isArray(keys) && keys.length > 0, `${where}: src must have source keys`);
  if (Array.isArray(keys)) keys.forEach((key) => check(Object.hasOwn(sources, key), `${where}: unknown source key ${key}`));
}

function primerBody(body) {
  if (nonempty(body)) return true;
  return Array.isArray(body) && body.length > 0 && body.every((part) =>
    nonempty(part) || (Array.isArray(part) && part.length >= 2 && Array.isArray(part[0])
      && part[0].length > 0 && part.every((row) => Array.isArray(row)
        && row.length === part[0].length && row.every(nonempty))));
}

function isMask(ip) {
  const octets = ip.split('.').map(Number);
  if (octets.some((n) => n > 255)) return false;
  const bits = octets.map((n) => n.toString(2).padStart(8, '0')).join('');
  return /^1*0*$/.test(bits) && bits.includes('1');
}

function safeIp(ip) {
  const [a, b, c, d] = ip.split('.').map(Number);
  if ([a, b, c, d].some((n) => n > 255)) return false;
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)
    || (a === 192 && b === 0 && c === 2) || (a === 198 && b === 51 && c === 100)
    || (a === 203 && b === 0 && c === 113)
    || (a === 169 && b === 254) || a === 127 // APIPA link-local and loopback are lesson content, not real hosts
    || publicResolvers.has(ip) || isMask(ip);
}

function textChecks(where, value, checkAddresses = true) {
  // Driver and app version numbers can look like dotted IPv4 addresses.
  const versions = new Set();
  eachString(value, where, (_, text) => {
    for (const match of text.matchAll(/\bversion\s*:?\s*(\d{1,3}(?:\.\d{1,3}){3})\b/gi)) versions.add(match[1]);
  });
  eachString(value, where, (path, text) => {
    check(!/[\u2013\u2014]/.test(text), `${path}: em/en dash`);
    check(!/<\/?[a-z][^>]*>/i.test(text) && !/&#?\w+;/.test(text), `${path}: HTML`);
    if (!checkAddresses) return;
    for (const match of text.matchAll(/\b[\w.+-]+@([a-z0-9.-]+)\b/gi)) {
      check(match[1].toLowerCase().endsWith('.example'), `${path}: non-fictional email ${match[0]}`);
    }
    for (const match of text.matchAll(/\b(?:[a-z0-9-]+\.)+(?:com|net|org|io|co|us|gov|edu|info|biz|dev|app)\b/gi)) {
      check(false, `${path}: non-fictional domain ${match[0]}`);
    }
    for (const match of text.matchAll(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g)) {
      check(versions.has(match[0]) || safeIp(match[0]), `${path}: non-private/documentation IP ${match[0]}`);
    }
  });
}

function simAction(sim, step) {
  const action = step?.do;
  if (action?.type === 'launch') return sim.launch(action.query);
  if (action?.type === 'open') return sim.open(action.screenId);
  if (action?.type === 'set') return sim.set(action.controlId, action.value);
  if (action?.type === 'act') return sim.act(action.controlId, action.rowId, action.actionId);
  throw new Error(`unknown sim step ${JSON.stringify(step)}`);
}

function resultChecks(where, result) {
  if (!result) return;
  check(result.score === 100, `${where}: score ${result.score}, expected 100`);
  (result.goals ?? []).forEach((goal) => check(goal.pass, `${where}: goal ${goal.id} fails`));
  (result.traps ?? []).forEach((trap) => check(!trap.hit, `${where}: trap ${trap.id} hit`));
}

function replaySim(c) {
  const sim = createSim(c);
  check(sim.check().score < 80, `${c.id}: start score ${sim.check().score} is not below 80`);
  const solutionHits = new Set();
  c.solution.forEach((step, index) => {
    const result = attempt(`${c.id}: solution step ${index + 1}`, () => simAction(sim, step));
    if (result) {
      check(result.ok, `${c.id}: solution step ${index + 1} rejected: ${result.msg}`);
      result.trapsHit?.forEach((id) => solutionHits.add(id));
    }
  });
  resultChecks(`${c.id}: solution`, sim.check());
  check(solutionHits.size === 0, `${c.id}: solution triggered traps ${[...solutionHits].join(', ')}`);
  const demo = createSim(c);
  const hits = new Set(demo.check().traps.filter((trap) => trap.hit).map((trap) => trap.id));
  c.trapDemo.forEach((step, index) => {
    const result = attempt(`${c.id}: trapDemo step ${index + 1}`, () => simAction(demo, step));
    if (result) {
      check(result.ok, `${c.id}: trapDemo step ${index + 1} rejected: ${result.msg}`);
      result.trapsHit?.forEach((id) => hits.add(id));
    }
  });
  demo.check().traps.filter((trap) => trap.hit).forEach((trap) => hits.add(trap.id));
  c.traps.forEach((trap) => check(hits.has(trap.id), `${c.id}: trapDemo misses ${trap.id}`));
}

function acceptedShell(where, result) {
  check(result && !/command not found|is not recognized|not recognized as (?:an internal|the name)/i.test(`${result?.out ?? ''}\n${result?.err ?? ''}`),
    `${where}: command not accepted: ${String(result?.out ?? result?.err ?? '').slice(0, 120)}`);
}

function replayShell(c) {
  const sh = createShell(c);
  check(sh.check().score < 80, `${c.id}: start score ${sh.check().score} is not below 80`);
  const hits = new Set();
  c.solution.forEach((step, index) => {
    const result = attempt(`${c.id}: solution step ${index + 1}`, () => shellStep(sh, step));
    if (result) {
      acceptedShell(`${c.id}: solution step ${index + 1}`, result);
      result.trapsHit?.forEach((id) => hits.add(id));
    }
  });
  resultChecks(`${c.id}: solution`, sh.check());
  check(hits.size === 0, `${c.id}: solution triggered traps ${[...hits].join(', ')}`);
  const demo = createShell(c);
  const demoHits = new Set(demo.check().traps.filter((trap) => trap.hit).map((trap) => trap.id));
  c.trapDemo.forEach((step, index) => {
    const result = attempt(`${c.id}: trapDemo step ${index + 1}`, () => shellStep(demo, step));
    if (result) {
      acceptedShell(`${c.id}: trapDemo step ${index + 1}`, result);
      result.trapsHit?.forEach((id) => demoHits.add(id));
    }
  });
  demo.check().traps.filter((trap) => trap.hit).forEach((trap) => demoHits.add(trap.id));
  c.traps.forEach((trap) => check(demoHits.has(trap.id), `${c.id}: trapDemo misses ${trap.id}`));
  // Scripted response keys are commands too. Run each on a fresh host.
  Object.keys(c.responses ?? {}).forEach((command) => {
    const result = attempt(`${c.id}: response ${command}`, () => shellStep(createShell(c), { do: command }));
    if (result) acceptedShell(`${c.id}: response ${command}`, result);
  });
}

function containsOkTrue(value) {
  return object(value) && (value.ok === true || Object.values(value).some((item) =>
    Array.isArray(item) ? item.some(containsOkTrue) : containsOkTrue(item)));
}

function replayBuild(c) {
  check(evaluateBuild(c, startPicks(c)).score < 80, `${c.id}: start score is not below 80`);
  check(c.goals.some((goal) => containsOkTrue(goal.check)), `${c.id}: no { ok: true } goal`);
  let picks = startPicks(c);
  c.solution.forEach((step, index) => {
    const result = attempt(`${c.id}: solution step ${index + 1}`, () => buildStep(c, picks, step.do));
    if (result) { check(result.ok, `${c.id}: solution step ${index + 1} rejected: ${result.msg}`); picks = result.picks; }
  });
  const end = evaluateBuild(c, picks);
  resultChecks(`${c.id}: solution`, end);
  check(end.errors.length === 0, `${c.id}: solution fails build rules ${end.errors.map((error) => error.rule).join(', ')}`);
  c.trapDemo.forEach((demo, demoIndex) => {
    let current = startPicks(c);
    (demo.steps ?? []).forEach((step, index) => {
      const result = attempt(`${c.id}: trapDemo ${demoIndex + 1} step ${index + 1}`, () => buildStep(c, current, step.do));
      if (result) { check(result.ok, `${c.id}: trapDemo ${demoIndex + 1} step ${index + 1} rejected: ${result.msg}`); current = result.picks; }
    });
    const result = evaluateBuild(c, current);
    check(result.traps.some((trap) => trap.id === demo.trap && trap.hit), `${c.id}: trapDemo ${demoIndex + 1} misses ${demo.trap}`);
    check(result.errors.some((error) => nonempty(error.rule)), `${c.id}: trapDemo ${demoIndex + 1} does not fail a named rule`);
  });
  c.traps.forEach((trap) => check(c.trapDemo.some((demo) => demo.trap === trap.id), `${c.id}: no trapDemo for ${trap.id}`));
}

function replayOrder(c) {
  let state = startState(c);
  check(gradeOrder(c, state.ids, state.answers).score < 80, `${c.id}: start score is not below 80`);
  (c.items ?? []).forEach((item) => {
    if (!item.ask) return;
    check(Array.isArray(item.ask.choices) && item.ask.choices.includes(item.ask.answer), `${c.id}/${item.id}: follow-up answer missing from choices`);
    (item.ask.choices ?? []).filter((choice) => choice !== item.ask.answer).forEach((choice) =>
      check(nonempty(item.ask.whyNot?.[choice]), `${c.id}/${item.id}: whyNot missing for ${choice}`));
  });
  c.solution.forEach((step, index) => {
    const result = attempt(`${c.id}: solution step ${index + 1}`, () => orderStep(c, state, step.do));
    if (result) { check(result.ok, `${c.id}: solution step ${index + 1} rejected: ${result.msg}`); state = result.state; }
  });
  const end = gradeOrder(c, state.ids, state.answers);
  resultChecks(`${c.id}: solution`, end);
  check(end.misplaced.length === 0, `${c.id}: solution leaves misplaced items ${end.misplaced.map((item) => item.id).join(', ')}`);
  c.trapDemo.forEach((demo, demoIndex) => {
    let current = startState(c);
    (demo.steps ?? []).forEach((step, index) => {
      const result = attempt(`${c.id}: trapDemo ${demoIndex + 1} step ${index + 1}`, () => orderStep(c, current, step.do));
      if (result) { check(result.ok, `${c.id}: trapDemo ${demoIndex + 1} step ${index + 1} rejected: ${result.msg}`); current = result.state; }
    });
    const result = gradeOrder(c, current.ids, current.answers);
    check(result.traps.some((trap) => trap.id === demo.trap && trap.hit), `${c.id}: trapDemo ${demoIndex + 1} misses ${demo.trap}`);
  });
  c.traps.forEach((trap) => check(c.trapDemo.some((demo) => demo.trap === trap.id), `${c.id}: no trapDemo for ${trap.id}`));
}

for (const [lab, mod] of Object.entries(files)) {
  const cases = mod.default;
  check(Array.isArray(cases), `${lab}: default export must be an array`);
  if (!Array.isArray(cases)) continue;
  check(cases.length === expectedCases[lab], `${lab}: expected ${expectedCases[lab]} cases, got ${cases.length}`);
  const sources = object(mod.sources) ? mod.sources : {};
  check(object(mod.sources) && Object.keys(sources).length > 0, `${lab}: missing sources`);
  Object.entries(sources).forEach(([key, source]) => {
    check(Array.isArray(source) && source.length === 2 && nonempty(source[0])
      && typeof source[1] === 'string' && /^https:\/\//.test(source[1]), `${lab}: source ${key} must be [title, https URL]`);
    check(!/wikipedia|wikibooks|quizlet|examcompass|professormesser|diontraining|practice.?test|exam.?prep|howtogeek/i.test(String(source?.[1] ?? '')),
      `${lab}: source ${key} is Wikipedia or a prep site`);
  });
  textChecks(`${lab}.sources`, sources, false);
  check(object(mod.primer), `${lab}: missing primer`);
  if (object(mod.primer)) {
    check(nonempty(mod.primer.title), `${lab}: primer title missing`);
    check(Array.isArray(mod.primer.sections) && mod.primer.sections.length > 0, `${lab}: primer sections missing`);
    (mod.primer.sections ?? []).forEach((section, index) => {
      check(nonempty(section?.h), `${lab}: primer section ${index + 1} heading missing`);
      check(primerBody(section?.body), `${lab}: primer section ${index + 1} body must be text or paragraphs/tables`);
    });
    sourceKeys(`${lab}: primer`, mod.primer.src, sources);
    textChecks(`${lab}.primer`, mod.primer);
  }
  check(object(mod.terms) && Object.keys(mod.terms).length > 0, `${lab}: missing terms`);
  if (object(mod.terms)) {
    Object.entries(mod.terms).forEach(([term, definition]) => check(nonempty(term) && nonempty(definition), `${lab}: term ${term} needs a definition`));
    textChecks(`${lab}.terms`, mod.terms);
  }
  const ids = new Set();
  let previousLevel = 0;
  cases.forEach((c, index) => {
    const where = c?.id ?? `${lab}[${index}]`;
    if (!object(c)) { check(false, `${where}: case must be an object`); return; }
    casesChecked += 1;
    check(new RegExp(`^${lab}-\\d{2}$`).test(c.id), `${where}: id must be ${lab}-NN`);
    check(!ids.has(c.id), `${where}: duplicate id`);
    ids.add(c.id);
    check([1, 2, 3].includes(c.level), `${where}: level must be 1, 2, or 3`);
    check(c.level >= previousLevel, `${where}: level decreases after ${previousLevel}`);
    previousLevel = c.level;
    check(nonempty(c.scenario), `${where}: scenario missing`);
    check(Number.isFinite(c.minutes) && c.minutes > 0, `${where}: minutes must be positive`);
    check(Array.isArray(c.goals) && c.goals.length >= 2 && c.goals.length <= 6, `${where}: needs 2-6 goals`);
    check(Array.isArray(c.traps), `${where}: traps must be an array`);
    check(Array.isArray(c.solution) && c.solution.length > 0, `${where}: solution missing`);
    check(Array.isArray(c.trapDemo), `${where}: trapDemo missing`);
    sourceKeys(where, c.src, sources);
    check(object(c.examObjs) && Object.keys(c.examObjs).length > 0, `${where}: examObjs missing`);
    if (object(c.examObjs)) Object.entries(c.examObjs).forEach(([exam, idsForExam]) => {
      check(objectiveIds[exam] !== undefined, `${where}: unknown exam ${exam}`);
      check(Array.isArray(idsForExam) && idsForExam.length > 0, `${where}: ${exam} needs objective ids`);
      if (Array.isArray(idsForExam)) idsForExam.forEach((id) => check(objectiveIds[exam]?.has(id), `${where}: unknown ${exam} objective ${id}`));
    });
    (c.goals ?? []).forEach((goal, goalIndex) => {
      const label = `${where}/goal ${goal?.id ?? goalIndex + 1}`;
      check(nonempty(goal?.why), `${label}: why missing`);
      check(nonempty(goal?.expect), `${label}: expect missing`);
      check(Array.isArray(goal?.hints) && goal.hints.length === 3 && goal.hints.every(nonempty), `${label}: needs exactly 3 text hints`);
      sourceKeys(label, goal?.src, sources);
    });
    (c.traps ?? []).forEach((trap, trapIndex) => {
      trapsChecked += 1;
      const label = `${where}/trap ${trap?.id ?? trapIndex + 1}`;
      check(nonempty(trap?.message), `${label}: message missing`);
      check(nonempty(trap?.why), `${label}: why missing`);
      sourceKeys(label, trap?.src, sources);
    });
    (c.solution ?? []).forEach((step, stepIndex) => check(nonempty(step?.explain), `${where}: solution step ${stepIndex + 1} needs explain`));
    textChecks(where, c);
    if (!Array.isArray(c.goals) || !Array.isArray(c.traps) || !Array.isArray(c.solution) || !Array.isArray(c.trapDemo)) return;
    const replay = lab === 'shell' ? replayShell : lab === 'build' ? replayBuild : lab === 'order' ? replayOrder : replaySim;
    attempt(`${where}: engine replay`, () => replay(c));
  });
}

if (problems.length) {
  console.error(`FAIL: A+ labs content: ${problems.length} problem(s) across ${casesChecked} cases\n${problems.map((problem) => `- ${problem}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`ok — A+ labs content: ${casesChecked} cases, ${trapsChecked} traps, ${checks} checks across 6 files`);
}

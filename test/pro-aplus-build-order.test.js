import assert from 'node:assert/strict';
import { parts, findPart } from '../src/pro/labs/aplus/parts.js';
import { SLOTS, RULE_SOURCES, COMMON_PSU_W, estimatePsuWatts, startPicks, applyStep, evaluateBuild } from '../src/pro/labs/aplus/pcbuild.js';
import { constraintPairs, startState, moveTo, applyStep as applyOrderStep, gradeOrder } from '../src/pro/labs/aplus/order.js';
import buildCases, { sources as buildSources, primer as buildPrimer, terms as buildTerms } from '../src/pro/labs/aplus/content/build-cases.js';
import orderCases, { sources as orderSources, primer as orderPrimer, terms as orderTerms } from '../src/pro/labs/aplus/content/order-cases.js';

// ---------- parts catalog ----------
const minimums = { cpus: 8, boards: 8, memory: 8, gpus: 6, psus: 8, storage: 8, cases: 6, coolers: 5 };
for (const [category, min] of Object.entries(minimums)) {
  assert.ok(parts[category].length >= min, `${category}: at least ${min}`);
}
const allIds = Object.values(parts).flat().map((part) => part.id);
assert.equal(new Set(allIds).size, allIds.length, 'part ids unique');
for (const part of Object.values(parts).flat()) {
  assert.ok(!/[–—]/.test(part.name), `${part.id}: no en/em dashes`);
}
assert.equal(findPart('cpus', 'cpu-am5-6c-g').socket, 'AM5');
assert.equal(findPart('cpus', 'nope'), null);
assert.equal(findPart('nope', 'cpu-am5-6c-g'), null);
assert.ok(parts.cpus.some((cpu) => !cpu.integratedGraphics), 'catalog has CPUs without graphics');
assert.ok(parts.gpus.some((gpu) => gpu.power.includes('12V-2x6')), 'catalog has 12V-2x6 cards');
assert.ok(parts.psus.some((psu) => psu.formFactor === 'SFX') && parts.psus.some((psu) => psu.atx31 && psu.native12v2x6 > 0));
assert.ok(parts.storage.some((drive) => drive.kind === 'm2-sata') && parts.storage.some((drive) => drive.kind === 'sata-3.5'));

// ---------- PSU estimate ----------
assert.deepEqual(estimatePsuWatts(findPart('cpus', 'cpu-am5-8c-g'), findPart('gpus', 'gpu-300')), { totalW: 495, recommendedW: 650 }, '495 x 1.3 = 643.5 -> 650');
assert.deepEqual(estimatePsuWatts(findPart('cpus', 'cpu-am5-6c-g')), { totalW: 140, recommendedW: 300 }, 'no GPU: 182 -> 300');
assert.deepEqual(estimatePsuWatts(findPart('cpus', 'cpu-am5-16c-g'), findPart('gpus', 'gpu-575')), { totalW: 820, recommendedW: 1200 }, '1066 -> 1200');
assert.equal(estimatePsuWatts({ tdp: 1000 }, { boardPowerW: 600 }).recommendedW, 2200, 'beyond the table rounds up to 100 W');
assert.ok(COMMON_PSU_W.every((watts, i) => i === 0 || watts > COMMON_PSU_W[i - 1]));

// ---------- a known-good reference build ----------
const good = {
  cpu: 'cpu-am5-8c-g', board: 'board-am5-atx', memory: ['ram-d5-32'], storage: ['ssd-nvme5-2t'],
  gpu: 'gpu-300', psu: 'psu-650-atx31', case: 'case-atx-mid', cooler: 'cooler-tower-180',
};
const bare = { goals: [{ id: 'ok', check: { ok: true } }], traps: [] };
const evalWith = (changes, caseDef = bare) => evaluateBuild(caseDef, { ...good, ...changes });
const rulesOf = (result) => result.errors.map((error) => error.rule);
{
  const result = evalWith({});
  assert.deepEqual(result.errors, [], 'reference build is clean');
  assert.deepEqual(result.warnings, []);
  assert.equal(result.score, 100);
  assert.deepEqual(result.load, { cpuW: 120, gpuW: 300, otherW: 75, totalW: 495, recommendedW: 650, psuW: 650 });
  assert.equal(result.facts['memory.totalGB'], 32);
  assert.equal(result.facts['storage.nvme'], 1);
  assert.equal(result.facts.video, true);
  assert.equal(result.facts.complete, true);
}

// Each rule: one failing build, with a teaching message, why and real src keys.
const failing = {
  socket: { cpu: 'cpu-1851-14c-g' },
  memoryType: { memory: ['ram-d4-32'] },
  memoryForm: { memory: ['ram-d5-so-32'] },
  memorySlots: { board: 'board-am5-itx', case: 'case-atx-mid', memory: ['ram-d5-128'] },
  memoryCapacity: { board: 'board-am5-matx-basic', memory: ['ram-d5-64', 'ram-d5-64'] },
  boardFit: { case: 'case-matx' },
  gpuSlot: { board: 'board-laptop', cpu: 'cpu-laptop-bga', memory: ['ram-d5-so-32'], storage: ['ssd-nvme4-1t'] },
  gpuFit: { case: 'case-itx-slim', board: 'board-am5-itx', psu: 'psu-750-sfx31', cooler: 'cooler-slim-65', cpu: 'cpu-am5-6c-g' },
  psuFit: { psu: 'psu-750-sfx31' },
  psuWattage: { psu: 'psu-550-atx' },
  gpuPower: { gpu: 'gpu-360', psu: 'psu-550-atx' },
  m2Slot: { storage: ['ssd-m2sata-1t'], board: 'board-am5-matx', case: 'case-matx' },
  sataPorts: { board: 'board-am5-itx', case: 'case-atx-storage', storage: ['hdd-8t-5400', 'hdd-8t-5400', 'hdd-8t-5400'] },
  driveBays: { storage: ['hdd-8t-5400', 'hdd-8t-5400', 'hdd-8t-5400'] },
  coolerSocket: { cooler: 'cooler-1851-low' },
  coolerTdp: { cooler: 'cooler-low-95' },
  coolerHeight: { case: 'case-matx', board: 'board-am5-matx', cooler: 'cooler-tower-250' },
  noVideo: { cpu: 'cpu-am5-6c-n', gpu: null, psu: 'psu-450-atx' },
};
for (const [rule, changes] of Object.entries(failing)) {
  const result = evalWith(changes);
  const error = result.errors.find((item) => item.rule === rule);
  assert.ok(error, `${rule} fails: got ${rulesOf(result)}`);
  assert.ok(error.message.length > 20 && error.why.length > 20, `${rule}: teaching text`);
  assert.ok(Array.isArray(error.parts), `${rule}: parts list`);
  assert.ok(error.src.length && error.src.every((key) => buildSources[key]), `${rule}: src keys exist in build sources`);
  assert.equal(result.score, 0, `${rule}: an { ok: true } goal fails`);
}
for (const [rule, keys] of Object.entries(RULE_SOURCES)) {
  assert.ok(keys.every((key) => buildSources[key]), `${rule} src keys exist`);
}
// Coverage: every error rule has a failing case above.
for (const rule of Object.keys(RULE_SOURCES).filter((key) => !['pcieSpeed', 'incomplete'].includes(key))) {
  assert.ok(failing[rule], `${rule} covered`);
}

// Specific pass/fail edges.
assert.ok(!rulesOf(evalWith({ memory: ['ram-d5-64', 'ram-d5-64'] })).includes('memoryCapacity'), '128 GB on a 192 GB board passes');
assert.ok(rulesOf(evalWith({ memory: ['ram-d5-128', 'ram-d5-16'] })).includes('memorySlots'), '6 modules in 4 slots');
assert.ok(!rulesOf(evalWith({ psu: 'psu-650-atx31' })).includes('psuWattage'), '650 W meets the 650 W estimate exactly');
assert.ok(rulesOf(evalWith({ gpu: 'gpu-360' })).includes('psuWattage'), '120 + 360 + 75 = 555 x 1.3 -> 750 W needed');
assert.ok(!rulesOf(evalWith({ gpu: 'gpu-360', psu: 'psu-850-atx31' })).length, '850 W ATX 3.1 runs the 360 W card');
// 12V-2x6: native lead, included adapter on enough 8-pin leads, or not enough leads.
assert.ok(!rulesOf(evalWith({ gpu: 'gpu-300', psu: 'psu-550-atx', cpu: 'cpu-am5-6c-g' })).includes('gpuPower'), 'adapter on 2 x 8-pin');
assert.ok(rulesOf(evalWith({ gpu: 'gpu-300', psu: 'psu-450-atx', cpu: 'cpu-am5-6c-g' })).includes('gpuPower'), 'one 8-pin is not enough for the adapter');
assert.ok(!rulesOf(evalWith({ gpu: 'gpu-575', psu: 'psu-1200-atx31', cpu: 'cpu-am5-16c-g', cooler: 'cooler-tower-250' })).length, 'flagship on native 12V-2x6');
assert.ok(rulesOf(evalWith({ gpu: 'gpu-220', psu: 'psu-450-atx', cpu: 'cpu-am5-6c-g' })).includes('gpuPower'), 'two 8-pin plugs, one lead');
assert.ok(!rulesOf(evalWith({ gpu: 'gpu-75', psu: 'psu-450-atx', cpu: 'cpu-am5-6c-g' })).length, 'slot-powered 75 W card needs no lead');
// M.2: SATA M.2 needs a SATA-capable slot; NVMe count vs slots; Gen5 in Gen4 slot warns.
assert.ok(!rulesOf(evalWith({ storage: ['ssd-m2sata-1t'] })).includes('m2Slot'), 'X870-class board has a SATA-capable M.2 slot');
assert.ok(!rulesOf(evalWith({ storage: ['ssd-nvme5-2t', 'ssd-nvme4-1t', 'ssd-m2sata-1t'] })).includes('m2Slot'), 'assigns the SATA drive to the combo slot');
assert.ok(rulesOf(evalWith({ storage: ['ssd-nvme5-2t', 'ssd-nvme4-1t', 'ssd-nvme4-2t', 'ssd-m2sata-1t'] })).includes('m2Slot'), 'four M.2 drives, three slots');
{
  const result = evalWith({ board: 'board-am5-matx-basic', case: 'case-matx', memory: ['ram-d5-16'] });
  assert.deepEqual(rulesOf(result), []);
  assert.deepEqual(result.warnings.map((item) => item.rule), ['pcieSpeed'], 'Gen5 drive in a Gen4 board warns, not fails');
}
assert.ok(!rulesOf(evalWith({ case: 'case-atx-storage', storage: ['ssd-nvme4-1t', 'hdd-8t-7200', 'hdd-8t-7200', 'hdd-8t-7200', 'hdd-8t-7200'] })).length, 'four 3.5in drives fit 8 bays and 4 ports');
// No video: integrated graphics or a card fixes it.
assert.ok(!rulesOf(evalWith({ cpu: 'cpu-am5-6c-n', gpu: 'gpu-150', psu: 'psu-450-atx' })).includes('noVideo'), 'card provides video');
assert.ok(!rulesOf(evalWith({ cpu: 'cpu-am5-6c-g', gpu: null })).includes('noVideo'), 'iGPU provides video');
assert.equal(evalWith({ cpu: 'cpu-1851-20c-f', board: 'board-1851-atx', gpu: null }).facts.video, false);
// Incomplete builds warn and the complete fact is false; GPU is optional.
{
  const result = evaluateBuild(bare, { cpu: 'cpu-am5-6c-g' });
  assert.deepEqual(result.errors, []);
  assert.equal(result.facts.complete, false);
  assert.match(result.warnings[0].message, /board, memory, storage, psu, case, cooler/);
  assert.equal(evaluateBuild({ slots: ['memory'] }, { memory: ['ram-d5-16'] }).facts.complete, true, 'only editable slots are required');
}
{
  const caseDef = buildCases.find((entry) => entry.id === 'build-05');
  let picks = startPicks(caseDef);
  for (const step of caseDef.solution) {
    const outcome = applyStep(caseDef, picks, step.do);
    assert.equal(outcome.ok, true, outcome.msg);
    picks = outcome.picks;
  }
  const reference = evaluateBuild(caseDef, picks);
  assert.equal(reference.score, 100, 'build-05 reference still scores 100');
  assert.equal(reference.facts.complete, true);
  for (const [slot, value] of [['cpu', null], ['board', null], ['cpu', 'cpu-1851-14c-g'], ['board', 'board-1851-itx']]) {
    const result = evaluateBuild(caseDef, { ...picks, [slot]: value });
    assert.equal(result.facts.complete, false, `changed locked ${slot} is incomplete`);
    assert.ok(result.score < 80, `changed locked ${slot} scores below 80: ${result.score}`);
    assert.ok(result.warnings.some((warning) => warning.rule === 'incomplete' && warning.parts.includes(slot)));
  }
  assert.equal(evaluateBuild({ ...bare, picks: { cpu: 'cpu-am5-6c-g' } }, good).score, 100, 'a case without slots has no locked parts');
  const emptyLockedStorage = { picks: { cpu: 'cpu-am5-6c-g' }, slots: ['memory'] };
  assert.equal(evaluateBuild(emptyLockedStorage, { ...startPicks(emptyLockedStorage), memory: ['ram-d5-16'] }).facts.complete, true, 'normalized empty locked storage stays unchanged');
}

// Goal predicates and trap scoring.
{
  const caseDef = {
    goals: [
      { id: 'ram', check: { key: 'memory.totalGB', op: 'gte', value: 32 } },
      { id: 'nvme', check: { all: [{ key: 'storage.nvme', op: 'gte', value: 1 }, { key: 'gpu', op: 'truthy' }] } },
      { id: 'sff', check: { any: [{ key: 'board.formFactor', op: 'eq', value: 'Mini-ITX' }, { key: 'psu.watts', op: 'lte', value: 450 }] } },
      { id: 'bays', check: { key: 'case.bays35', op: 'in', value: [2, 4] } },
    ],
    traps: [
      { id: 'too-small', check: { rule: 'psuWattage' }, critical: true, message: 'm', why: 'w', src: ['psuSizing'] },
      { id: 'no-dgpu', check: { not: { key: 'gpu', op: 'truthy' } }, message: 'm', why: 'w', src: [] },
    ],
  };
  const pass = evaluateBuild(caseDef, good);
  assert.deepEqual(pass.goals.map((goal) => goal.pass), [true, true, false, true]);
  assert.equal(pass.score, 75);
  assert.deepEqual(Object.keys(pass.goals[0]), ['id', 'pass', 'text', 'why', 'expect']);
  const capped = evaluateBuild(caseDef, { ...good, psu: 'psu-450-atx', gpu: 'gpu-75', cpu: 'cpu-am5-6c-g' });
  assert.deepEqual(capped.traps.map((trap) => trap.hit), [false, false]);
  const hit = evaluateBuild(caseDef, { ...good, psu: 'psu-550-atx', gpu: 'gpu-360' });
  assert.equal(hit.traps[0].hit, true);
  assert.equal(hit.traps[0].critical, true);
  assert.ok(hit.score <= 60, 'critical trap caps at 60');
  const twoTraps = evaluateBuild(caseDef, { ...good, gpu: null, psu: 'psu-300-sfx', cpu: 'cpu-am5-16c-g' });
  assert.deepEqual(twoTraps.traps.map((trap) => trap.hit), [true, true]);
  assert.equal(twoTraps.score, 25, '3 of 4 goals minus two trap hits');
}

// applyStep and startPicks.
{
  const caseDef = { picks: { cpu: 'cpu-am5-6c-g', memory: 'ram-d5-16' }, slots: ['memory', 'storage'] };
  const picks = startPicks(caseDef);
  assert.deepEqual(Object.keys(picks), SLOTS);
  assert.deepEqual(picks.memory, ['ram-d5-16'], 'single id becomes a list');
  assert.deepEqual(picks.storage, []);
  assert.equal(picks.gpu, null);
  assert.equal(applyStep(caseDef, picks, { slot: 'cpu', part: 'cpu-am5-8c-g' }).ok, false, 'fixed slot');
  assert.equal(applyStep(caseDef, picks, { slot: 'memory', part: 'nope' }).ok, false, 'unknown part');
  assert.equal(applyStep(caseDef, picks, { slot: 'tray', part: 'x' }).ok, false, 'unknown slot');
  let next = applyStep(caseDef, picks, { slot: 'storage', add: 'ssd-nvme4-1t' }).picks;
  next = applyStep(caseDef, next, { slot: 'storage', add: 'hdd-8t-5400' }).picks;
  assert.deepEqual(next.storage, ['ssd-nvme4-1t', 'hdd-8t-5400']);
  assert.deepEqual(picks.storage, [], 'pure: input not mutated');
  next = applyStep(caseDef, next, { slot: 'storage', remove: 'ssd-nvme4-1t' }).picks;
  assert.deepEqual(next.storage, ['hdd-8t-5400']);
  assert.equal(applyStep(caseDef, next, { slot: 'storage', remove: 'ssd-nvme4-1t' }).ok, false);
  assert.deepEqual(applyStep(caseDef, next, { slot: 'memory', part: 'ram-d5-32' }).picks.memory, ['ram-d5-32'], 'part replaces a list');
  assert.deepEqual(applyStep(caseDef, next, { slot: 'memory', parts: ['ram-d5-16', 'ram-d5-16'] }).picks.memory, ['ram-d5-16', 'ram-d5-16']);
  assert.deepEqual(applyStep(caseDef, next, { slot: 'memory', part: null }).picks.memory, []);
  const open = startPicks({ picks: { gpu: 'gpu-75' } });
  assert.equal(applyStep({}, open, { slot: 'gpu', part: null }).picks.gpu, null, 'null clears a single slot');
  assert.doesNotThrow(() => JSON.stringify(evaluateBuild(bare, good)), 'JSON-serializable result');
}

// ---------- order engine ----------
const simple = {
  items: ['a', 'b', 'c', 'd'].map((id) => ({ id, text: id.toUpperCase(), why: `why ${id}` })),
  constraints: { order: ['a', 'b', 'c', 'd'] },
};
assert.deepEqual(constraintPairs(simple), [['a', 'b'], ['b', 'c'], ['c', 'd']], 'total order = consecutive pairs');
assert.equal(gradeOrder(simple, ['a', 'b', 'c', 'd']).score, 100);
assert.deepEqual(gradeOrder(simple, ['a', 'b', 'c', 'd']).misplaced, []);
{
  const result = gradeOrder(simple, ['d', 'a', 'b', 'c']);
  assert.equal(result.score, 67, '2 of 3 constraints');
  assert.deepEqual(result.misplaced, [{ id: 'd', mustComeAfter: ['c'], mustComeBefore: [], why: 'why d' }], 'only the moved item is flagged, with its nearest neighbour');
}
{
  const result = gradeOrder(simple, ['b', 'a', 'c', 'd']);
  assert.equal(result.misplaced.length, 1, 'an adjacent swap flags one item');
  assert.deepEqual(result.constraints.map((unit) => unit.pass), [false, true, true]);
}
{
  const result = gradeOrder(simple, ['d', 'c', 'b', 'a']);
  assert.equal(result.score, 0);
  assert.equal(result.misplaced.length, 3);
}
{
  const result = gradeOrder(simple, ['a', 'b', 'x', 'b', 'c']);
  assert.deepEqual(result.constraints.map((unit) => unit.pass), [true, true, false], 'unknown ids ignored, duplicates use first place, missing items fail their pairs');
  assert.deepEqual(result.misplaced.find((entry) => entry.id === 'd'), { id: 'd', mustComeAfter: ['c'], mustComeBefore: [], why: 'why d' });
}
// Precedence pairs with interchangeable steps.
const partial = {
  items: ['backup', 'checkHw', 'checkApps', 'upgrade', 'verify'].map((id) => ({ id, text: id, why: `why ${id}` })),
  constraints: { before: [['backup', 'upgrade'], ['checkHw', 'upgrade'], ['checkApps', 'upgrade'], ['upgrade', 'verify']] },
};
assert.equal(gradeOrder(partial, ['backup', 'checkHw', 'checkApps', 'upgrade', 'verify']).score, 100);
assert.equal(gradeOrder(partial, ['checkApps', 'checkHw', 'backup', 'upgrade', 'verify']).score, 100, 'interchangeable steps in any order');
{
  const result = gradeOrder(partial, ['backup', 'upgrade', 'checkHw', 'checkApps', 'verify']);
  assert.equal(result.score, 50);
  assert.deepEqual(result.misplaced.map((entry) => entry.id), ['upgrade']);
  assert.deepEqual(result.misplaced[0].mustComeAfter.sort(), ['checkApps', 'checkHw']);
}
{
  const result = gradeOrder(partial, ['verify', 'backup', 'checkHw', 'checkApps', 'upgrade']);
  assert.deepEqual(result.misplaced, [{ id: 'verify', mustComeAfter: ['upgrade'], mustComeBefore: [], why: 'why verify' }], 'transitive successors reduced to the nearest');
}
// Follow-ups, goals and traps.
{
  const caseDef = {
    ...simple,
    items: simple.items.map((item) => (item.id === 'b' ? { ...item, ask: { q: 'Q?', choices: ['yes', 'no'], answer: 'yes', why: 'because', whyNot: { no: 'not that' } } } : item)),
    goals: [{ id: 'seq', check: { order: true } }, { id: 'ans', check: { answer: 'b' } }, { id: 'pl', check: { placed: 'a' } }],
    traps: [{ id: 'd-first', check: { before: ['d', 'a'] }, critical: true }, { id: 'combo', check: { all: [{ not: { order: true } }, { any: [{ before: ['b', 'a'] }] }] } }],
  };
  const right = gradeOrder(caseDef, ['a', 'b', 'c', 'd'], { b: 'yes' });
  assert.equal(right.score, 100);
  assert.deepEqual(right.goals.map((goal) => goal.pass), [true, true, true]);
  assert.deepEqual(right.followUps, [{ id: 'b', q: 'Q?', chosen: 'yes', pass: true, answer: 'yes', why: 'because', whyNot: null }]);
  const wrong = gradeOrder(caseDef, ['a', 'b', 'c', 'd'], { b: 'no' });
  assert.equal(wrong.score, 75, 'follow-up counts as one unit');
  assert.equal(wrong.followUps[0].whyNot, 'not that');
  assert.equal(gradeOrder(caseDef, ['a', 'b', 'c', 'd']).followUps[0].chosen, null, 'unanswered');
  const trapped = gradeOrder(caseDef, ['d', 'a', 'b', 'c'], { b: 'yes' });
  assert.deepEqual(trapped.traps.map((trap) => trap.hit), [true, false]);
  assert.ok(trapped.score <= 60, 'critical trap caps');
  const swapped = gradeOrder(caseDef, ['b', 'a', 'c', 'd'], { b: 'yes' });
  assert.deepEqual(swapped.traps.map((trap) => trap.hit), [false, true]);
  assert.equal(swapped.score, 50, '3 of 4 units minus one unit for the trap');
  assert.equal(swapped.goals[2].pass, true, 'a is kept; b is the flagged item');
}
// moveTo, startState and order applyStep.
assert.deepEqual(moveTo(['a', 'b', 'c'], 'c', 0), ['c', 'a', 'b']);
assert.deepEqual(moveTo(['a', 'b', 'c'], 'a', 9), ['b', 'c', 'a'], 'clamped');
assert.deepEqual(moveTo(['a', 'b', 'c'], 'z', 0), ['a', 'b', 'c']);
assert.deepEqual(startState(simple), { ids: ['a', 'b', 'c', 'd'], answers: {} });
assert.deepEqual(startState({ ...simple, start: ['c', 'a', 'd', 'b'] }).ids, ['c', 'a', 'd', 'b']);
{
  const caseDef = { ...simple, items: simple.items.map((item) => (item.id === 'a' ? { ...item, ask: { q: 'Q', choices: ['x', 'y'], answer: 'x' } } : item)) };
  const state = startState(caseDef);
  assert.deepEqual(applyOrderStep(caseDef, state, { move: 'd', to: 0 }).state.ids, ['d', 'a', 'b', 'c']);
  assert.equal(applyOrderStep(caseDef, state, { move: 'd' }).ok, false);
  assert.equal(applyOrderStep(caseDef, state, { move: 'zz', to: 0 }).ok, false);
  assert.deepEqual(applyOrderStep(caseDef, state, { answer: 'a', choice: 'x' }).state.answers, { a: 'x' });
  assert.equal(applyOrderStep(caseDef, state, { answer: 'a', choice: 'q' }).ok, false);
  assert.equal(applyOrderStep(caseDef, state, { answer: 'b', choice: 'x' }).ok, false, 'no question on b');
  assert.deepEqual(state, { ids: ['a', 'b', 'c', 'd'], answers: {} }, 'pure');
}
assert.throws(() => gradeOrder({ items: Array.from({ length: 17 }, (_, i) => ({ id: `s${i}` })), constraints: { order: [] } }, Array.from({ length: 17 }, (_, i) => `s${i}`)), RangeError);

// ---------- seed cases ----------
const plainText = (value, where) => {
  const text = JSON.stringify(value);
  assert.ok(!/[–—]/.test(text), `${where}: no en/em dashes`);
  assert.ok(!/<[a-z/][^>]*>/i.test(text), `${where}: no HTML`);
};
// every objective id of the exams the labs can tag (from the app's own blueprints)
const { BLUEPRINTS } = await import('../src/pro/exam/blueprints.js');
const objectives = Object.fromEntries(BLUEPRINTS.map((bp) => [bp.id, bp.domains.flatMap((d) => d.objectives.map((o) => o.id))]));
function checkCommon(caseDef, sources) {
  assert.match(caseDef.id, /^(build|order)-\d\d$/);
  assert.ok(caseDef.level >= 1 && caseDef.level <= 3 && caseDef.minutes > 0);
  assert.ok(caseDef.goals.length >= 2 && caseDef.goals.length <= 6);
  for (const goal of caseDef.goals) {
    assert.ok(goal.why && goal.expect && goal.hints.length === 3 && goal.src.length, `${caseDef.id}/${goal.id} fields`);
  }
  for (const trap of caseDef.traps) assert.ok(trap.message && trap.why && trap.src.length, `${caseDef.id}/${trap.id} fields`);
  for (const key of [...caseDef.src, ...caseDef.goals.flatMap((goal) => goal.src), ...caseDef.traps.flatMap((trap) => trap.src)]) {
    assert.ok(sources[key], `${caseDef.id}: source ${key}`);
  }
  for (const [exam, ids] of Object.entries(caseDef.examObjs)) for (const id of ids) assert.ok(objectives[exam]?.includes(id), `${caseDef.id}: objective ${exam} ${id}`);
  assert.ok(caseDef.solution.every((step) => step.explain), 'solution steps explain');
  assert.ok(caseDef.traps.every((trap) => caseDef.trapDemo.some((demo) => demo.trap === trap.id)), 'every trap has a demo');
  plainText(caseDef, caseDef.id);
}
for (const [key, [title, url]] of Object.entries({ ...buildSources, ...orderSources })) {
  assert.ok(title && /^https:\/\//.test(url) && !/wikipedia|examcompass|professormesser/i.test(url), `source ${key}`);
}
plainText([buildPrimer, buildTerms, orderPrimer, orderTerms], 'primers');
assert.ok(buildPrimer.src.every((key) => buildSources[key]) && orderPrimer.src.every((key) => orderSources[key]));

for (const caseDef of buildCases) {
  checkCommon(caseDef, buildSources);
  const start = evaluateBuild(caseDef, startPicks(caseDef));
  assert.ok(start.score < 80, `${caseDef.id} start scores ${start.score}`);
  let picks = startPicks(caseDef);
  for (const step of caseDef.solution) {
    const outcome = applyStep(caseDef, picks, step.do);
    assert.ok(outcome.ok, outcome.msg);
    picks = outcome.picks;
  }
  const end = evaluateBuild(caseDef, picks);
  assert.equal(end.score, 100, `${caseDef.id} solution scores 100`);
  assert.ok(end.goals.every((goal) => goal.pass) && end.traps.every((trap) => !trap.hit) && end.errors.length === 0);
  for (const demo of caseDef.trapDemo) {
    let demoPicks = startPicks(caseDef);
    for (const step of demo.steps) demoPicks = applyStep(caseDef, demoPicks, step.do).picks;
    const result = evaluateBuild(caseDef, demoPicks);
    assert.ok(result.traps.find((trap) => trap.id === demo.trap).hit, `${caseDef.id} trapDemo ${demo.trap}`);
    assert.ok(result.errors.length > 0, `${caseDef.id} trapDemo ${demo.trap} fails a named rule`);
  }
}
{
  const [seed] = buildCases;
  const start = evaluateBuild(seed, startPicks(seed));
  assert.deepEqual(start.errors.map((error) => error.rule).sort(), ['memoryForm', 'noVideo'], 'build-01: no video + laptop memory');
  assert.equal(start.score, 0);
  const viaCard = evaluateBuild(seed, { ...startPicks(seed), gpu: 'gpu-75', memory: ['ram-d5-16'] });
  assert.equal(viaCard.score, 100, 'build-01: a dedicated card also restores video');
}

for (const caseDef of orderCases) {
  checkCommon(caseDef, orderSources);
  assert.deepEqual([...caseDef.start].sort(), caseDef.items.map((item) => item.id).sort(), 'start lists every item once');
  for (const item of caseDef.items.filter((entry) => entry.ask)) {
    assert.ok(item.ask.choices.includes(item.ask.answer), 'answer is a choice');
    assert.ok(item.ask.choices.filter((choice) => choice !== item.ask.answer).every((choice) => item.ask.whyNot[choice]), 'every wrong choice has whyNot');
  }
  let state = startState(caseDef);
  assert.ok(gradeOrder(caseDef, state.ids, state.answers).score < 80, `${caseDef.id} start below 80`);
  for (const step of caseDef.solution) {
    const outcome = applyOrderStep(caseDef, state, step.do);
    assert.ok(outcome.ok, outcome.msg);
    state = outcome.state;
  }
  const end = gradeOrder(caseDef, state.ids, state.answers);
  assert.equal(end.score, 100, `${caseDef.id} solution scores 100`);
  assert.ok(end.goals.every((goal) => goal.pass) && end.traps.every((trap) => !trap.hit) && end.misplaced.length === 0);
  for (const demo of caseDef.trapDemo) {
    let demoState = startState(caseDef);
    for (const step of demo.steps) demoState = applyOrderStep(caseDef, demoState, step.do).state;
    assert.ok(gradeOrder(caseDef, demoState.ids, demoState.answers).traps.find((trap) => trap.id === demo.trap).hit, `${caseDef.id} trapDemo ${demo.trap}`);
  }
}
{
  const [seed] = orderCases;
  assert.deepEqual(seed.constraints.order, ['identify', 'theory', 'test', 'plan', 'verify', 'document'], 'CompTIA methodology order');
  assert.ok(seed.items.find((item) => item.id === 'theory').ask, 'follow-up at establish a theory');
  const start = gradeOrder(seed, seed.start, {});
  assert.equal(start.score, 0);
  assert.ok(start.misplaced.length > 0 && start.misplaced.every((entry) => entry.why));
}

console.log('ok - A+ build bench and order engines, parts catalog, build-01 and order-01');

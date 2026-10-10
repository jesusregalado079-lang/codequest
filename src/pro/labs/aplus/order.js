import { scoreFrom } from './coach.js';

const MAX_ITEMS = 16;

// A total `order` [a, b, c] means a before b, b before c. Precedence pairs
// `before: [[a, b], ...]` leave unrelated steps interchangeable.
export function constraintPairs(caseDef) {
  const { order, before } = caseDef?.constraints ?? {};
  if (Array.isArray(order)) return order.slice(1).map((id, index) => [order[index], id]);
  return before ?? [];
}

// The list starts in `start` order (authored shuffled), else file order.
export function startState(caseDef) {
  return { ids: [...(caseDef?.start ?? (caseDef?.items ?? []).map((item) => item.id))], answers: {} };
}

export function moveTo(ids, id, index) {
  const from = ids.indexOf(id);
  if (from < 0) return [...ids];
  const next = ids.filter((value) => value !== id);
  next.splice(Math.max(0, Math.min(index, next.length)), 0, id);
  return next;
}

// Step forms: { move: itemId, to: index } and { answer: itemId, choice }.
export function applyStep(caseDef, state, step) {
  const item = (caseDef?.items ?? []).find((entry) => entry.id === (step?.move ?? step?.answer));
  if (!item) return { ok: false, msg: 'Unknown step.', state };
  if ('move' in step) {
    if (!Number.isInteger(step.to)) return { ok: false, msg: 'A move needs a target position.', state };
    return { ok: true, msg: `Moved "${item.text}" to position ${step.to + 1}.`, state: { ...state, ids: moveTo(state.ids, item.id, step.to) } };
  }
  if (!item.ask?.choices.includes(step.choice)) return { ok: false, msg: 'That is not one of the choices.', state };
  return { ok: true, msg: `Answered: ${step.choice}`, state: { ...state, answers: { ...state.answers, [item.id]: step.choice } } };
}

function closureOf(pairs) {
  const after = new Map();
  const reach = (from, seen = new Set()) => {
    for (const [a, b] of pairs) if (a === from && !seen.has(b)) { seen.add(b); reach(b, seen); }
    return seen;
  };
  for (const id of new Set(pairs.flat())) after.set(id, reach(id));
  return (a, b) => after.get(a)?.has(b) ?? false;
}

// The largest set of placed items with no order violation stays put; every
// other item is reported as misplaced. Cases keep to MAX_ITEMS so a full
// subset search is cheap and exact.
function keptItems(placed, mustPrecede) {
  if (placed.length > MAX_ITEMS) throw new RangeError(`Order cases support at most ${MAX_ITEMS} items.`);
  const consistent = (mask) => placed.every((a, i) => !(mask >> i & 1) || placed.every((b, j) => !(mask >> j & 1) || j <= i || !mustPrecede(b, a)));
  let best = 0;
  let bestSize = -1;
  for (let mask = (1 << placed.length) - 1; mask >= 0; mask -= 1) {
    const size = placed.filter((_, i) => mask >> i & 1).length;
    if (size > bestSize && consistent(mask)) { best = mask; bestSize = size; }
  }
  return new Set(placed.filter((_, i) => best >> i & 1));
}

function misplacedItems(caseDef, placed, pairs) {
  const mustPrecede = closureOf(pairs);
  const kept = keptItems(placed, mustPrecede);
  const pos = new Map(placed.map((id, index) => [id, index]));
  const nearest = (list, outranks) => list.filter((id) => !list.some((other) => other !== id && outranks(id, other)));
  return (caseDef.items ?? []).filter((item) => !kept.has(item.id)).map((item) => {
    const here = pos.get(item.id) ?? -1;
    const others = placed.filter((id) => id !== item.id);
    const after = here < 0 ? pairs.filter(([, b]) => b === item.id).map(([a]) => a) : others.filter((id) => pos.get(id) > here && mustPrecede(id, item.id));
    const before = here < 0 ? pairs.filter(([a]) => a === item.id).map(([, b]) => b) : others.filter((id) => pos.get(id) < here && mustPrecede(item.id, id));
    return { id: item.id, mustComeAfter: nearest(after, (a, b) => mustPrecede(a, b)), mustComeBefore: nearest(before, (a, b) => mustPrecede(b, a)), why: item.why };
  });
}

function followUpsOf(items, answers) {
  return items.filter((item) => item.ask).map((item) => {
    const chosen = answers?.[item.id] ?? null;
    const pass = chosen === item.ask.answer;
    return { id: item.id, q: item.ask.q, chosen, pass, answer: item.ask.answer, why: item.ask.why, whyNot: !pass && chosen ? item.ask.whyNot?.[chosen] ?? null : null };
  });
}

// Goal/trap checks: { order: true } (every constraint met), { before: [a, b] }
// (a is placed before b), { placed: id } (id is not misplaced),
// { answer: itemId } (follow-up answered correctly), and { all }, { any }, { not }.
function test(check, ctx) {
  if (check == null) return true;
  if (check.all) return check.all.every((item) => test(item, ctx));
  if (check.any) return check.any.some((item) => test(item, ctx));
  if (check.not) return !test(check.not, ctx);
  if ('order' in check) return ctx.constraints.every((unit) => unit.pass) === check.order;
  if (check.before) return ctx.isBefore(...check.before);
  if (check.placed) return !ctx.misplaced.some((entry) => entry.id === check.placed);
  if (check.answer) return ctx.followUps.some((entry) => entry.id === check.answer && entry.pass);
  return false;
}

export function gradeOrder(caseDef, ids, answers = {}) {
  const items = caseDef?.items ?? [];
  const known = new Set(items.map((item) => item.id));
  const placed = [...new Set((ids ?? []).filter((id) => known.has(id)))];
  const pos = new Map(placed.map((id, index) => [id, index]));
  const isBefore = (a, b) => pos.has(a) && pos.has(b) && pos.get(a) < pos.get(b);
  const pairs = constraintPairs(caseDef);
  const constraints = pairs.map(([a, b]) => ({ before: a, after: b, pass: isBefore(a, b) }));
  const followUps = followUpsOf(items, answers);
  const misplaced = misplacedItems(caseDef, placed, pairs);
  const ctx = { constraints, followUps, misplaced, isBefore };
  const goals = (caseDef?.goals ?? []).map((goal) => ({
    id: goal.id, pass: test(goal.check, ctx), text: goal.text, why: goal.why, expect: goal.expect,
    ...(goal.weight === undefined ? {} : { weight: goal.weight }),
  }));
  const traps = (caseDef?.traps ?? []).map((trap) => ({
    id: trap.id, hit: test(trap.check, ctx), message: trap.message, why: trap.why, src: trap.src,
    ...(trap.critical ? { critical: true } : {}),
  }));
  // SPEC 3.5: the score counts satisfied constraints plus correct follow-ups;
  // traps then deduct and cap per SPEC 2.4 through scoreFrom.
  const units = [...constraints, ...followUps];
  return { goals, traps, score: scoreFrom(units, traps), constraints, followUps, misplaced };
}

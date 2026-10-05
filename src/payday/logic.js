// Pure rules for the Payday Helper (the younger son's tool): the money pieces, the jar math, "can these
// pieces make this amount?", breaking one piece into smaller ones, building a jar, and the stored worked
// examples. No DOM, no storage, no clock. Everything is whole cents, so no floating-point money anywhere.
//
// The three promises this file keeps (see test/payday-logic.test.js):
//   1. The three jars always add up to exactly what he earned, and Spend is never negative.
//   2. A piece can only be broken into pieces whose total value is exactly the same and each smaller.
//   3. The value of his hand plus the jars he has built never changes (no money created or lost).

export const PIECES = Object.freeze([
  { id: 'b20', cents: 2000, kind: 'bill', one: '$20 bill', many: '$20 bills' },
  { id: 'b10', cents: 1000, kind: 'bill', one: '$10 bill', many: '$10 bills' },
  { id: 'b5', cents: 500, kind: 'bill', one: '$5 bill', many: '$5 bills' },
  { id: 'b1', cents: 100, kind: 'bill', one: '$1 bill', many: '$1 bills' },
  { id: 'quarter', cents: 25, kind: 'coin', one: 'quarter', many: 'quarters' },
  { id: 'dime', cents: 10, kind: 'coin', one: 'dime', many: 'dimes' },
  { id: 'nickel', cents: 5, kind: 'coin', one: 'nickel', many: 'nickels' },
  { id: 'penny', cents: 1, kind: 'coin', one: 'penny', many: 'pennies' },
]);
export const PIECE_IDS = Object.freeze(PIECES.map((piece) => piece.id));
const BY_ID = Object.freeze(Object.fromEntries(PIECES.map((piece) => [piece.id, piece])));

export const MIN_EARNED = 1; // $0.01
export const MAX_EARNED = 5000; // $50.00
export const MAX_HANDED = 20; // Step 2 counters go from 0 to 20 of each piece
export const MAX_REPLACEMENT = 100; // one piece can become at most 100 of any smaller piece ($1 = 100 pennies)
export const MAX_HAND = 4000; // a hand can never hold more of one piece than this (a $20 bill is 2000 pennies)

export const isPieceId = (id) => Object.prototype.hasOwnProperty.call(BY_ID, id);
export const pieceCents = (id) => (isPieceId(id) ? BY_ID[id].cents : 0);
export const pieceName = (id, count = 1) => (isPieceId(id) ? (count === 1 ? BY_ID[id].one : BY_ID[id].many) : '');

export const emptyPieces = () => Object.fromEntries(PIECE_IDS.map((id) => [id, 0]));

// A clean { id: count } with every known piece present as a whole number 0..max; anything else is dropped.
export function cleanPieces(value, max = MAX_HAND) {
  const out = emptyPieces();
  if (!value || typeof value !== 'object') return out;
  PIECE_IDS.forEach((id) => {
    const n = value[id];
    if (Number.isInteger(n) && n > 0) out[id] = Math.min(n, max);
  });
  return out;
}

export const piecesTotal = (pieces) => PIECE_IDS.reduce((sum, id) => sum + pieceCents(id) * ((pieces && Number.isInteger(pieces[id]) && pieces[id] > 0) ? pieces[id] : 0), 0);
export const pieceCount = (pieces) => PIECE_IDS.reduce((sum, id) => sum + ((pieces && Number.isInteger(pieces[id]) && pieces[id] > 0) ? pieces[id] : 0), 0);
export const isEmptyPieces = (pieces) => pieceCount(pieces) === 0;

export const formatMoney = (cents) => `$${(Math.round(cents) / 100).toFixed(2)}`;

// "6.50", "6.5", "6", "$6.50" -> cents. At most two decimals, digits only. null when it is not an amount.
export function parseDollars(text) {
  const t = String(text === null || text === undefined ? '' : text).trim().replace(/^\$\s*/, '');
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  const [whole, frac = ''] = t.split('.');
  return Number(whole) * 100 + Number((frac + '00').slice(0, 2));
}

// Step 1: 0.01 to 50.00. { ok:true, cents } or { ok:false }.
export function parseEarned(text) {
  const cents = parseDollars(text);
  if (cents === null || cents < MIN_EARNED || cents > MAX_EARNED) return { ok: false };
  return { ok: true, cents };
}

// The three jars, in whole-number cents. Give = 10% and Save = 20%, each rounded to the nearest cent with a
// half cent rounding UP; Spend is whatever is left, so the three always add up to E exactly.
export function jarAmounts(earned) {
  const give = Math.floor((earned + 5) / 10);
  const save = Math.floor((2 * earned + 5) / 10);
  return { give, save, spend: earned - give - save };
}
export const JARS = Object.freeze([
  { id: 'give', name: 'Give', percent: 10 },
  { id: 'save', name: 'Save', percent: 20 },
  { id: 'spend', name: 'Spend', percent: 70 },
]);

// Step 2: does what he was handed add up to what he earned? Only ever reports the DIFFERENCE, never a piece.
export function matchCheck(earned, pieces) {
  const total = piecesTotal(pieces);
  const diff = total - earned;
  return { kind: diff === 0 ? 'equal' : diff > 0 ? 'over' : 'under', total, diff: Math.abs(diff) };
}

// Can some group of these pieces make exactly `target` cents? A bounded subset-sum over the pieces held.
export function canMake(pieces, target) {
  if (!Number.isInteger(target) || target < 0) return false;
  const reach = new Uint8Array(target + 1);
  reach[0] = 1;
  PIECES.forEach(({ id, cents }) => {
    const n = Math.min((pieces && Number.isInteger(pieces[id]) && pieces[id] > 0) ? pieces[id] : 0, Math.floor(target / cents));
    for (let k = 0; k < n; k += 1) {
      for (let s = target; s >= cents; s -= 1) if (reach[s - cents]) reach[s] = 1;
    }
  });
  return reach[target] === 1;
}

// One group of pieces that makes exactly `target`, or null. For tests and the worked examples only: the kid
// is never shown it.
export function findSelection(pieces, target) {
  if (!canMake(pieces, target)) return null;
  const out = emptyPieces();
  let left = target;
  // Greedy from the biggest piece, then check; fall back to a small search when greedy does not land exactly.
  const ids = PIECE_IDS.filter((id) => (pieces[id] || 0) > 0);
  const walk = (index, remaining, chosen) => {
    if (remaining === 0) return chosen;
    if (index >= ids.length) return null;
    const id = ids[index];
    const cents = pieceCents(id);
    const most = Math.min(pieces[id] || 0, Math.floor(remaining / cents));
    for (let take = most; take >= 0; take -= 1) {
      const next = walk(index + 1, remaining - take * cents, { ...chosen, [id]: take });
      if (next) return next;
    }
    return null;
  };
  const found = walk(0, left, out);
  return found ? cleanPieces(found) : null;
}

// Breaking: any piece bigger than a penny. The replacement may only use strictly smaller pieces.
export const canBreak = (id) => isPieceId(id) && id !== 'penny';
export const smallerIds = (id) => (isPieceId(id) ? PIECES.filter((piece) => piece.cents < pieceCents(id)).map((piece) => piece.id) : []);

// { ok, total, target, reason }. ok only when the replacement is made of strictly smaller pieces that add up to
// exactly the value of the broken piece.
export function checkReplacement(id, replacement) {
  if (!canBreak(id)) return { ok: false, reason: 'unbreakable', total: 0, target: 0 };
  const clean = cleanPieces(replacement, MAX_REPLACEMENT);
  const allowed = smallerIds(id);
  const target = pieceCents(id);
  const total = piecesTotal(clean);
  if (PIECE_IDS.some((key) => clean[key] > 0 && !allowed.includes(key))) return { ok: false, reason: 'not-smaller', total, target };
  if (total !== target) return { ok: false, reason: total > target ? 'too-much' : 'too-little', total, target };
  return { ok: true, total, target };
}

export function applyBreak(hand, id, replacement) {
  const check = checkReplacement(id, replacement);
  if (!check.ok || !((hand && hand[id]) > 0)) throw new Error('payday: that break is not allowed');
  const next = cleanPieces(hand);
  next[id] -= 1;
  const clean = cleanPieces(replacement, MAX_REPLACEMENT);
  PIECE_IDS.forEach((key) => { next[key] += clean[key]; });
  return next;
}

// A jar selection must come from the pieces in his hand.
export function selectionFits(hand, selection) {
  const sel = cleanPieces(selection);
  return PIECE_IDS.every((id) => sel[id] <= ((hand && hand[id]) || 0));
}
export function checkJar(hand, selection, target) {
  if (!selectionFits(hand, selection)) return { ok: false, reason: 'not-in-hand', total: piecesTotal(selection), target };
  const total = piecesTotal(selection);
  return { ok: total === target, reason: total === target ? null : (total > target ? 'too-much' : 'too-little'), total, target };
}
export function takeFromHand(hand, selection) {
  if (!selectionFits(hand, selection)) throw new Error('payday: those pieces are not in the hand');
  const next = cleanPieces(hand);
  const sel = cleanPieces(selection);
  PIECE_IDS.forEach((id) => { next[id] -= sel[id]; });
  return next;
}

// The money in his hand plus the jars he has built must always be exactly what he earned.
export const conserved = (earned, hand, builtJars) => piecesTotal(hand) + (builtJars || []).reduce((sum, pieces) => sum + piecesTotal(pieces), 0) === earned;

// "3 $1 bills and 2 quarters", "1 dime", "5 pennies".
export function describePieces(pieces) {
  const parts = PIECE_IDS.filter((id) => pieces && pieces[id] > 0).map((id) => `${pieces[id]} ${pieceName(id, pieces[id])}`);
  if (!parts.length) return 'nothing';
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

// ---------- stored worked examples (shown after the second miss; never the amount he earned) ----------
// Each is a real, replayable payday: `handed` is the hand, and each jar lists the steps in order, a break
// ({ break, into }) or the jar ({ jar }). test/payday-logic.test.js replays them through the rules above.
export const WORKED_EXAMPLES = Object.freeze([
  {
    earned: 350,
    handed: { b1: 3, quarter: 2 },
    give: [{ break: 'b1', into: { quarter: 3, dime: 2, nickel: 1 } }, { jar: { quarter: 1, dime: 1 } }],
    save: [{ break: 'quarter', into: { dime: 2, nickel: 1 } }, { jar: { quarter: 2, dime: 2 } }],
  },
  {
    earned: 625,
    handed: { b5: 1, b1: 1, quarter: 1 },
    give: [{ break: 'b1', into: { quarter: 3, dime: 2, nickel: 1 } }, { break: 'nickel', into: { penny: 5 } }, { jar: { quarter: 2, dime: 1, penny: 3 } }],
    save: [{ break: 'b5', into: { b1: 5 } }, { jar: { b1: 1, quarter: 1 } }],
  },
]);

// The first stored example whose amount is not the one he earned.
export const pickExample = (earned) => WORKED_EXAMPLES.find((example) => example.earned !== earned) || WORKED_EXAMPLES[0];

// Runs an example through the rules and returns the lines to show, in plain words, with every number computed
// (not typed): the can-I-make-it test, each break, each jar, the hand after each, and the Spend sum.
export function workedExampleLines(example) {
  const jars = jarAmounts(example.earned);
  const lines = [`Earned ${formatMoney(example.earned)}. Handed: ${describePieces(example.handed)} (${formatMoney(piecesTotal(example.handed))}). The jars are Give ${formatMoney(jars.give)}, Save ${formatMoney(jars.save)} and Spend ${formatMoney(jars.spend)}.`];
  let hand = cleanPieces(example.handed);
  let step = 1;
  ['give', 'save'].forEach((jar) => {
    const target = jars[jar];
    const name = jar === 'give' ? 'Give' : 'Save';
    let asked = false;
    example[jar].forEach((move) => {
      if (move.break) {
        if (!asked) { lines.push(`${step}. ${name} needs ${formatMoney(target)}. With ${describePieces(hand)}, ${canMake(hand, target) ? 'a group of pieces could make it' : `no group of pieces makes exactly ${formatMoney(target)}`}. So break a piece.`); step += 1; asked = true; }
        else { lines.push(`${step}. Still no group of pieces makes exactly ${formatMoney(target)}. Break another piece.`); step += 1; }
        const before = hand;
        hand = applyBreak(hand, move.break, move.into);
        lines.push(`${step}. Break 1 ${pieceName(move.break)} into ${describePieces(move.into)} (${formatMoney(pieceCents(move.break))} either way). Now your hand is ${describePieces(hand)}, still ${formatMoney(piecesTotal(before))}.`);
        step += 1;
      } else {
        if (!asked) { lines.push(`${step}. ${name} needs ${formatMoney(target)}. ${canMake(hand, target) ? 'A group of these pieces makes it.' : 'No group of these pieces makes it.'}`); step += 1; asked = true; }
        const check = checkJar(hand, move.jar, target);
        hand = takeFromHand(hand, move.jar);
        lines.push(`${step}. Build the ${name} jar: ${describePieces(move.jar)} = ${formatMoney(check.total)}. Now your hand is ${describePieces(hand)} = ${formatMoney(piecesTotal(hand))}.`);
        step += 1;
      }
    });
  });
  const parts = PIECE_IDS.filter((id) => hand[id] > 0).map((id) => `${hand[id]} ${pieceName(id, hand[id])} = ${formatMoney(pieceCents(id) * hand[id])}`);
  lines.push(`${step}. Spend: add what is left. ${parts.join(', ')}. Together that is ${formatMoney(piecesTotal(hand))}, which is the Spend jar.`);
  return lines;
}

// The Step 4 version of an example: add the three jars.
export function addJarsExampleLine(example) {
  const j = jarAmounts(example.earned);
  return `Earned ${formatMoney(example.earned)}. The jars are Give ${formatMoney(j.give)}, Save ${formatMoney(j.save)} and Spend ${formatMoney(j.spend)}. Add them one at a time: ${formatMoney(j.give)} + ${formatMoney(j.save)} = ${formatMoney(j.give + j.save)}, then ${formatMoney(j.give + j.save)} + ${formatMoney(j.spend)} = ${formatMoney(example.earned)}.`;
}

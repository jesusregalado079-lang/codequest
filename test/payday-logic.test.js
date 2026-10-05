// Payday Helper rules (src/payday/logic.js): the jar math for every amount from $0.01 to $50.00, the subset-sum
// "can these pieces make it?" against brute force, breaking and building under the exact-value rules, money is
// never created or lost, and the two stored worked examples replay as real paydays. Written against the v2 spec's
// own numbers ($6.50, $6.25, $3.50) and re-derived here without reading the module's answers back.
import assert from 'node:assert/strict';
import {
  PIECES, PIECE_IDS, MAX_EARNED, MAX_HANDED, WORKED_EXAMPLES,
  addJarsExampleLine, applyBreak, canBreak, canMake, checkJar, checkReplacement, cleanPieces, conserved, describePieces, emptyPieces,
  findSelection, formatMoney, jarAmounts, matchCheck, parseDollars, parseEarned, pickExample, pieceCents, pieceCount, piecesTotal,
  selectionFits, smallerIds, takeFromHand, workedExampleLines,
} from '../src/payday/logic.js';

const hand = (o) => ({ ...emptyPieces(), ...o });
const VALUE = { b20: 2000, b10: 1000, b5: 500, b1: 100, quarter: 25, dime: 10, nickel: 5, penny: 1 };

// ---------- the pieces ----------
assert.deepEqual(PIECE_IDS, ['b20', 'b10', 'b5', 'b1', 'quarter', 'dime', 'nickel', 'penny'], 'the eight pieces, biggest first');
PIECES.forEach((p) => assert.equal(p.cents, VALUE[p.id]));
assert.equal(piecesTotal(hand({ b5: 1, b1: 1, quarter: 2 })), 650);
assert.equal(piecesTotal({ quarter: -3, dime: 1.5, nope: 9 }), 0, 'junk counts are ignored');
assert.deepEqual(cleanPieces({ quarter: 3, dime: -1, nickel: 2.5, nope: 4, penny: 'x' }), hand({ quarter: 3 }));
assert.equal(cleanPieces({ penny: 99999 }).penny, 4000, 'a hand is capped');
assert.equal(pieceCount(hand({ quarter: 3, penny: 4 })), 7);
assert.equal(formatMoney(65), '$0.65');
assert.equal(formatMoney(650), '$6.50');
assert.equal(formatMoney(5), '$0.05');

// ---------- typing an amount ----------
const DOLLARS = [['6.50', 650], ['6.5', 650], ['6', 600], ['$6.50', 650], [' 6.50 ', 650], ['0.01', 1], ['0', 0], ['0.00', 0], ['50', 5000], ['50.00', 5000], ['12.05', 1205], ['0.5', 50], [6.5, 650]];
DOLLARS.forEach(([text, cents]) => assert.equal(parseDollars(text), cents, `"${text}"`));
['', '   ', 'abc', '6.505', '6.', '.5', '-1', '1e2', '6,50', '6.5.0', '$', '$$6', '6 dollars', null, undefined, '٣'].forEach((text) => assert.equal(parseDollars(text), null, `"${text}" is not an amount`));
assert.deepEqual(parseEarned('0.01'), { ok: true, cents: 1 });
assert.deepEqual(parseEarned('50.00'), { ok: true, cents: 5000 });
assert.deepEqual(parseEarned('6.50'), { ok: true, cents: 650 });
['0', '0.00', '50.01', '51', '500', '6.505', '-3', 'x', ''].forEach((text) => assert.equal(parseEarned(text).ok, false, `earned "${text}" is rejected`));
assert.equal(MAX_EARNED, 5000);
assert.equal(MAX_HANDED, 20);

// ---------- the jar math: every amount from $0.01 to $50.00 ----------
assert.deepEqual(jarAmounts(650), { give: 65, save: 130, spend: 455 }, 'the spec main example');
assert.deepEqual(jarAmounts(625), { give: 63, save: 125, spend: 437 }, '10% of $6.25 is $0.625 and rounds up');
assert.deepEqual(jarAmounts(350), { give: 35, save: 70, spend: 245 });
assert.deepEqual(jarAmounts(1), { give: 0, save: 0, spend: 1 });
assert.deepEqual(jarAmounts(5), { give: 1, save: 1, spend: 3 }, 'half a cent rounds up');
assert.deepEqual(jarAmounts(5000), { give: 500, save: 1000, spend: 3500 });
for (let earned = 1; earned <= MAX_EARNED; earned += 1) {
  const { give, save, spend } = jarAmounts(earned);
  assert.equal(give + save + spend, earned, `${earned}: the jars add up to what he earned`);
  assert.ok(give >= 0 && save >= 0 && spend >= 0 && Number.isInteger(give) && Number.isInteger(save) && Number.isInteger(spend), `${earned}: whole, never negative`);
  assert.equal(give, Math.round(earned / 10), `${earned}: Give is 10% rounded half up`);
  assert.equal(save, Math.round(earned / 5), `${earned}: Save is 20% rounded`);
  assert.ok(Math.abs(spend - 0.7 * earned) <= 1.0001, `${earned}: Spend is about 70%`);
}

// ---------- matching what he was handed to what he earned ----------
assert.deepEqual(matchCheck(650, hand({ b5: 1, b1: 1, quarter: 2 })), { kind: 'equal', total: 650, diff: 0 });
assert.deepEqual(matchCheck(650, hand({ b5: 1, b1: 2 })), { kind: 'over', total: 700, diff: 50 });
assert.deepEqual(matchCheck(650, hand({ b5: 1, b1: 1, quarter: 1 })), { kind: 'under', total: 625, diff: 25 });
assert.deepEqual(matchCheck(650, emptyPieces()), { kind: 'under', total: 0, diff: 650 });

// ---------- can these pieces make this amount? (subset-sum) against brute force ----------
let seed = 12345;
const rnd = (n) => { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; return seed % n; };
const brute = (pieces, target) => {
  const sums = new Set([0]);
  PIECE_IDS.forEach((id) => { for (let k = 0; k < pieces[id]; k += 1) [...sums].forEach((s) => { if (s + VALUE[id] <= target) sums.add(s + VALUE[id]); }); });
  return sums.has(target);
};
for (let trial = 0; trial < 400; trial += 1) {
  const pieces = hand({ b5: rnd(2), b1: rnd(4), quarter: rnd(5), dime: rnd(5), nickel: rnd(4), penny: rnd(6) });
  const target = rnd(700);
  assert.equal(canMake(pieces, target), brute(pieces, target), `${JSON.stringify(pieces)} -> ${target}`);
  const found = findSelection(pieces, target);
  if (brute(pieces, target)) { assert.ok(found, 'a witness'); assert.equal(piecesTotal(found), target); assert.ok(selectionFits(pieces, found)); } else assert.equal(found, null);
}
assert.equal(canMake(hand({ b5: 1, b1: 1, quarter: 2 }), 65), false, 'the spec main example: no group makes $0.65 yet');
assert.equal(canMake(hand({ b5: 1, b1: 1, quarter: 2 }), 650), true, 'everything makes the whole amount');
assert.equal(canMake(hand({ quarter: 4 }), 10), false);
assert.equal(canMake(hand({ quarter: 4 }), 0), true);
assert.equal(canMake(hand({ quarter: 4 }), -1), false);
assert.equal(canMake(hand({ quarter: 4 }), 2.5), false);
assert.equal(canMake(hand({ penny: 20, b20: 20 }), 4000), true, 'twenty $20 bills are only used up to what the target allows (two)');
assert.equal(canMake(hand({ penny: 20, b20: 20 }), 400), false, 'a $20 bill is never worth less than $20');
assert.equal(canMake(null, 5), false);

// ---------- breaking a piece ----------
assert.equal(canBreak('b20') && canBreak('quarter') && canBreak('nickel'), true);
assert.equal(canBreak('penny'), false, 'a penny cannot be broken');
assert.equal(canBreak('thousand'), false);
assert.deepEqual(smallerIds('b1'), ['quarter', 'dime', 'nickel', 'penny']);
assert.deepEqual(smallerIds('quarter'), ['dime', 'nickel', 'penny']);
assert.deepEqual(smallerIds('penny'), []);
assert.equal(checkReplacement('b1', hand({ quarter: 3, dime: 2, nickel: 1 })).ok, true, '75 + 20 + 5');
assert.equal(checkReplacement('b1', hand({ quarter: 4 })).ok, true);
assert.equal(checkReplacement('b1', hand({ penny: 100 })).ok, true, '100 pennies');
assert.equal(checkReplacement('b5', hand({ b1: 5 })).ok, true);
assert.equal(checkReplacement('b20', hand({ b10: 2 })).ok, true);
assert.deepEqual(checkReplacement('b1', hand({ quarter: 3, dime: 2 })), { ok: false, reason: 'too-little', total: 95, target: 100 });
assert.deepEqual(checkReplacement('b1', hand({ quarter: 3, dime: 3 })), { ok: false, reason: 'too-much', total: 105, target: 100 });
assert.equal(checkReplacement('b1', hand({ b1: 1 })).reason, 'not-smaller', 'a $1 bill is not a smaller piece than a $1 bill');
assert.equal(checkReplacement('b1', hand({ b5: 1 })).ok, false);
assert.equal(checkReplacement('quarter', hand({ quarter: 1 })).ok, false);
assert.equal(checkReplacement('quarter', hand({ dime: 2, nickel: 1 })).ok, true);
assert.equal(checkReplacement('quarter', emptyPieces()).ok, false, 'nothing is not the same money');
assert.equal(checkReplacement('penny', hand({})).reason, 'unbreakable');
const before = hand({ b5: 1, b1: 1, quarter: 2 });
const after = applyBreak(before, 'b1', hand({ quarter: 3, dime: 2, nickel: 1 }));
assert.deepEqual(after, hand({ b5: 1, quarter: 5, dime: 2, nickel: 1 }), 'the spec main example, step 1');
assert.equal(piecesTotal(after), piecesTotal(before), 'breaking never changes the money');
assert.deepEqual(before, hand({ b5: 1, b1: 1, quarter: 2 }), 'the original hand is untouched');
assert.throws(() => applyBreak(before, 'b1', hand({ quarter: 3 })), /not allowed/);
assert.throws(() => applyBreak(before, 'b10', hand({ b5: 2 })), /not allowed/, 'he has no $10 bill to break');
assert.throws(() => applyBreak(before, 'penny', hand({})), /not allowed/);

// ---------- building a jar ----------
const h2 = hand({ b5: 1, quarter: 5, dime: 2, nickel: 1 });
assert.deepEqual(checkJar(h2, hand({ quarter: 2, dime: 1, nickel: 1 }), 65), { ok: true, reason: null, total: 65, target: 65 });
assert.deepEqual(checkJar(h2, hand({ quarter: 3 }), 65), { ok: false, reason: 'too-much', total: 75, target: 65 });
assert.equal(checkJar(h2, hand({ quarter: 2 }), 65).reason, 'too-little');
assert.equal(checkJar(h2, hand({ dime: 3 }), 30).reason, 'not-in-hand', 'he only has 2 dimes');
assert.equal(selectionFits(h2, hand({ quarter: 5 })), true);
assert.equal(selectionFits(h2, hand({ quarter: 6 })), false);
assert.deepEqual(takeFromHand(h2, hand({ quarter: 2, dime: 1, nickel: 1 })), hand({ b5: 1, quarter: 3, dime: 1 }), 'the spec main example, after the Give jar');
assert.throws(() => takeFromHand(h2, hand({ b10: 1 })), /not in the hand/);
assert.equal(conserved(650, hand({ b5: 1, quarter: 3, dime: 1 }), [hand({ quarter: 2, dime: 1, nickel: 1 })]), true);
assert.equal(conserved(650, hand({ b5: 1, quarter: 3, dime: 1 }), []), false, 'a missing jar is missing money');
assert.equal(describePieces(hand({ b1: 3, quarter: 2 })), '3 $1 bills and 2 quarters');
assert.equal(describePieces(hand({ dime: 1 })), '1 dime');
assert.equal(describePieces(hand({ b5: 1, b1: 1, quarter: 2 })), '1 $5 bill, 1 $1 bill and 2 quarters');
assert.equal(describePieces(hand({ penny: 5 })), '5 pennies');
assert.equal(describePieces(emptyPieces()), 'nothing');

// ---------- the spec's main example, played through the rules start to finish ----------
{
  const earned = 650;
  const jars = jarAmounts(earned);
  let h = hand({ b5: 1, b1: 1, quarter: 2 });
  assert.equal(matchCheck(earned, h).kind, 'equal');
  assert.equal(jars.give + jars.save, 195, 'Step 4 tray: $0.65, then $1.95');
  assert.equal(jars.give + jars.save + jars.spend, 650, 'then $6.50');
  const built = [];
  assert.equal(canMake(h, jars.give), false, 'Give $0.65: he must break something');
  h = applyBreak(h, 'b1', hand({ quarter: 3, dime: 2, nickel: 1 }));
  assert.equal(canMake(h, jars.give), true);
  const give = hand({ quarter: 2, dime: 1, nickel: 1 });
  assert.equal(checkJar(h, give, jars.give).ok, true);
  h = takeFromHand(h, give); built.push(give);
  assert.deepEqual(h, hand({ b5: 1, quarter: 3, dime: 1 }));
  assert.equal(piecesTotal(h), 585);
  assert.equal(canMake(h, jars.save), false, 'Save $1.30: no group makes it');
  h = applyBreak(h, 'b5', hand({ b1: 5 }));
  assert.equal(canMake(h, jars.save), false, 'still no group makes $1.30');
  h = applyBreak(h, 'quarter', hand({ dime: 2, nickel: 1 }));
  assert.deepEqual(h, hand({ b1: 5, quarter: 2, dime: 3, nickel: 1 }));
  assert.equal(canMake(h, jars.save), true);
  const save = hand({ b1: 1, quarter: 1, nickel: 1 });
  assert.equal(checkJar(h, save, jars.save).ok, true);
  assert.equal(checkJar(h, hand({ b1: 1, dime: 3 }), jars.save).ok, true, 'another correct Save jar: $1 + 3 dimes');
  h = takeFromHand(h, save); built.push(save);
  assert.deepEqual(h, hand({ b1: 4, quarter: 1, dime: 3 }));
  assert.equal(piecesTotal(h), jars.spend, 'what is left is exactly the Spend jar');
  assert.equal(conserved(earned, h, built), true);
}

// ---------- the stored worked examples are real paydays ----------
assert.equal(WORKED_EXAMPLES.length, 2);
WORKED_EXAMPLES.forEach((example) => {
  assert.equal(piecesTotal(example.handed), example.earned, `${example.earned}: handed = earned`);
  let h = cleanPieces(example.handed);
  const jars = jarAmounts(example.earned);
  const built = [];
  ['give', 'save'].forEach((jar) => {
    example[jar].forEach((move, index) => {
      if (move.break) {
        assert.equal(canMake(h, jars[jar]), false, `${example.earned} ${jar}: he only breaks when no group makes it`);
        assert.equal(checkReplacement(move.break, move.into).ok, true, `${example.earned} ${jar}: a valid break`);
        h = applyBreak(h, move.break, move.into);
      } else {
        assert.equal(index, example[jar].length - 1, 'the jar is the last step');
        assert.equal(canMake(h, jars[jar]), true, `${example.earned} ${jar}: a group makes it by now`);
        assert.equal(checkJar(h, move.jar, jars[jar]).ok, true, `${example.earned} ${jar}: the jar is exactly right`);
        h = takeFromHand(h, move.jar); built.push(move.jar);
      }
      assert.equal(conserved(example.earned, h, built), true, `${example.earned} ${jar}: nothing created or lost`);
    });
  });
  assert.equal(piecesTotal(h), jars.spend, `${example.earned}: what is left is the Spend jar`);
  const lines = workedExampleLines(example);
  assert.ok(lines.length >= 6, 'a full walk-through');
  assert.ok(lines[0].includes(formatMoney(example.earned)) && lines[0].includes(formatMoney(jars.give)) && lines[0].includes(formatMoney(jars.spend)));
  assert.ok(lines[lines.length - 1].includes(`Together that is ${formatMoney(jars.spend)}`), 'the Spend sum');
  assert.ok(lines.some((line) => line.includes('no group of pieces makes exactly')), 'it shows when to break');
  const add = addJarsExampleLine(example);
  assert.ok(add.includes(formatMoney(jars.give + jars.save)) && add.endsWith(`${formatMoney(example.earned)}.`), 'the add-the-jars example');
});
const first = workedExampleLines(WORKED_EXAMPLES[0]).join('\n');
assert.ok(first.includes('Earned $3.50. Handed: 3 $1 bills and 2 quarters ($3.50). The jars are Give $0.35, Save $0.70 and Spend $2.45.'));
assert.ok(first.includes('Break 1 $1 bill into 3 quarters, 2 dimes and 1 nickel ($1.00 either way). Now your hand is 2 $1 bills, 5 quarters, 2 dimes and 1 nickel, still $3.50.'), 'the spec example, step 2');
assert.ok(first.includes('Build the Give jar: 1 quarter and 1 dime = $0.35. Now your hand is 2 $1 bills, 4 quarters, 1 dime and 1 nickel = $3.15.'));
assert.ok(first.includes('Break 1 quarter into 2 dimes and 1 nickel ($0.25 either way). Now your hand is 2 $1 bills, 3 quarters, 3 dimes and 2 nickels, still $3.15.'));
assert.ok(first.includes('Build the Save jar: 2 quarters and 2 dimes = $0.70. Now your hand is 2 $1 bills, 1 quarter, 1 dime and 2 nickels = $2.45.'));
assert.ok(first.includes('Spend: add what is left. 2 $1 bills = $2.00, 1 quarter = $0.25, 1 dime = $0.10, 2 nickels = $0.10. Together that is $2.45'));
// never the amount he earned
assert.equal(pickExample(350).earned, 625);
assert.equal(pickExample(625).earned, 350);
assert.equal(pickExample(650).earned, 350);
assert.equal(pickExample(1).earned, 350);
for (let earned = 1; earned <= MAX_EARNED; earned += 7) assert.notEqual(pickExample(earned).earned, earned);

// ---------- fuzz: any legal sequence of breaks and jars keeps the money exact ----------
for (let trial = 0; trial < 300; trial += 1) {
  const earned = 1 + rnd(MAX_EARNED);
  // a random hand worth exactly `earned`
  let h = emptyPieces();
  let left = earned;
  while (left > 0) { const fits = PIECES.filter((p) => p.cents <= left); const p = fits[rnd(fits.length)]; h[p.id] += 1; left -= p.cents; }
  if (PIECE_IDS.some((id) => h[id] > MAX_HANDED)) continue;
  const jars = jarAmounts(earned);
  const built = [];
  for (const jar of ['give', 'save']) {
    let guard = 0;
    while (!canMake(h, jars[jar]) && guard < 40) {
      const breakable = PIECE_IDS.filter((id) => canBreak(id) && h[id] > 0);
      const id = breakable[rnd(breakable.length)];
      const into = emptyPieces();
      let remaining = pieceCents(id);
      while (remaining > 0) { const opts = smallerIds(id).map((s) => PIECES.find((p) => p.id === s)).filter((p) => p.cents <= remaining); const p = opts[rnd(opts.length)]; into[p.id] += 1; remaining -= p.cents; }
      h = applyBreak(h, id, into);
      guard += 1;
      assert.equal(conserved(earned, h, built), true, `${earned}: after a break`);
    }
    if (!canMake(h, jars[jar])) { h = null; break; }
    const sel = findSelection(h, jars[jar]);
    assert.equal(checkJar(h, sel, jars[jar]).ok, true);
    h = takeFromHand(h, sel); built.push(sel);
    assert.equal(conserved(earned, h, built), true, `${earned}: after the ${jar} jar`);
  }
  if (h) assert.equal(piecesTotal(h), jars.spend, `${earned}: what is left is exactly Spend`);
}

console.log('ok — payday logic: jar math for every amount $0.01-$50.00, subset-sum vs brute force, break/jar rules, money conserved, spec examples replay');

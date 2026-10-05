// Payday Helper session (src/payday/session.js + state.js): the whole flow played as the spec's $6.50 and $3.50
// examples, the hint -> worked example -> hint -> grown-up ladder on every kind of question, the Step 1/2 messages
// word for word, "nothing is ever shown to him as an answer", and that any pile of random taps keeps the money
// exact and survives a save and load.
import assert from 'node:assert/strict';
import { act, newSession, outcomes, questionKeys, view, COPY, STUCK_AT } from '../src/payday/session.js';
import { abandonOpen, actOnOpen, addSession, emptyPayday, normalizePayday, normalizeSession, openSession } from '../src/payday/state.js';
import {
  PIECE_IDS, canBreak, canMake, conserved, emptyPieces, findSelection, formatMoney, jarAmounts, pickExample, piecesTotal, smallerIds,
} from '../src/payday/logic.js';

const T0 = '2026-10-05T17:00:00.000Z';
const hand = (o) => ({ ...emptyPieces(), ...o });
const play = (state, ...actions) => actions.reduce((s, a) => act(s, a, T0), state);
const adjust = (id, n, type = 'piece-adjust') => Array.from({ length: n }, () => ({ type, id, delta: 1 }));
const roundTrip = (state) => normalizeSession(JSON.parse(JSON.stringify(state)));

// ---------- Step 1: what he earned ----------
let s = newSession(T0);
assert.equal(s.screen, 'earn');
assert.equal(questionKeys(s), 'earn');
for (const bad of ['', 'abc', '0', '0.00', '50.01', '6.505', '-1', '6,50']) {
  const after = play(newSession(T0), { type: 'earn-submit', text: bad });
  assert.equal(after.screen, 'earn', `"${bad}" does not move on`);
  assert.deepEqual(after.feedback, { kind: 'diff', key: 'earn', text: 'That does not look right. Check the amount and try again.' });
  assert.equal(after.earned, null);
}
s = play(s, { type: 'earn-submit', text: '$6.50' });
assert.equal(s.screen, 'handed');
assert.equal(s.earned, 650);
assert.equal(s.qs.earn.ok, true);
assert.equal(s.feedback, null);
assert.equal(play(newSession(T0), { type: 'earn-submit', text: '0.01' }).earned, 1);
assert.equal(play(newSession(T0), { type: 'earn-submit', text: '50' }).earned, 5000);

// four misses in a row on the amount: the grown-up screen, and nothing else works until the button
let stuck = newSession(T0);
for (let i = 1; i < STUCK_AT; i += 1) { stuck = play(stuck, { type: 'earn-submit', text: 'x' }); assert.equal(stuck.feedback.kind, 'diff'); }
stuck = play(stuck, { type: 'earn-submit', text: 'x' });
assert.deepEqual(stuck.feedback, { kind: 'stuck', key: 'earn', text: 'Show this screen to a grown-up.' });
assert.equal(stuck.qs.earn.stuck, true);
assert.equal(play(stuck, { type: 'earn-submit', text: '6.50' }), stuck, 'nothing works behind the grown-up screen (the same state comes back)');
const helped = play(stuck, { type: 'grownup-ok' });
assert.equal(helped.feedback, null);
assert.equal(helped.qs.earn.streak, 0, 'the count starts over');
assert.equal(helped.screen, 'earn', 'it never skips the question');
assert.equal(play(helped, { type: 'earn-submit', text: 'x' }).feedback.kind, 'diff', 'a new miss gets the plain message again, not the grown-up screen');

// ---------- Step 2: what he was handed ----------
s = play(s, ...adjust('b5', 1), ...adjust('b1', 2));
assert.equal(view(s).handedTotal, 700);
let m = play(s, { type: 'handed-done' });
assert.equal(m.screen, 'handed');
assert.equal(m.feedback.text, 'Your bills and coins add up to $7.00, but you earned $6.50. That is $0.50 too much. Look at what you were handed again.');
assert.equal(m.feedback.over, true);
assert.equal(m.qs.handed.misses, 1);
s = play(s, { type: 'piece-adjust', id: 'b1', delta: -1 }, ...adjust('quarter', 1));
m = play(s, { type: 'handed-done' });
assert.equal(m.feedback.text, 'Your bills and coins add up to $6.25, but you earned $6.50. That is $0.25 too little. Look at what you were handed again.');
assert.equal(m.feedback.over, false, 'under: never says which piece');
// counters stop at 0 and 20
assert.equal(play(s, ...Array.from({ length: 25 }, () => ({ type: 'piece-adjust', id: 'penny', delta: 1 }))).handed.penny, 20);
assert.equal(play(s, ...Array.from({ length: 5 }, () => ({ type: 'piece-adjust', id: 'b20', delta: -1 }))).handed.b20, 0);
assert.equal(play(s, { type: 'piece-adjust', id: 'gold', delta: 1 }), s, 'an unknown piece does nothing');
// four tries in a row
let tries = s;
for (let i = 1; i <= STUCK_AT; i += 1) tries = play(tries, { type: 'handed-done' });
assert.equal(tries.feedback.kind, 'stuck');
assert.equal(tries.feedback.key, 'handed');
assert.equal(tries.screen, 'handed', 'the grown-up screen sits over Step 2');
const retried = play(tries, { type: 'grownup-ok' });
assert.equal(retried.qs.handed.streak, 0);
assert.equal(retried.screen, 'handed');
assert.equal(outcomes(tries).find((o) => o.key === 'handed').outcome, 'stuck');
// the two links
assert.equal(play(s, { type: 'change-amount' }).screen, 'earn');
assert.deepEqual(play(s, { type: 'pieces-clear' }).handed, emptyPieces());
// matching, then the recap he must confirm
s = play(s, ...adjust('quarter', 1));
m = play(s, { type: 'handed-done' });
assert.equal(m.screen, 'recap');
assert.equal(m.feedback.text, 'That matches! You earned $6.50 and you were handed $6.50.');
assert.equal(m.qs.handed.ok, true);
assert.equal(play(m, { type: 'recap-no' }), m, 'there is no such action; No uses change-pieces');
const back = play(m, { type: 'change-pieces' });
assert.equal(back.screen, 'handed');
assert.deepEqual(back.handed, hand({ b5: 1, b1: 1, quarter: 2 }), 'No keeps what he entered so he can fix it');
assert.equal(play(m, { type: 'change-amount' }).screen, 'earn');
s = play(m, { type: 'recap-yes' });

// ---------- Step 3 and 4 ----------
assert.equal(s.screen, 'jars');
assert.deepEqual(s.jars, { give: 65, save: 130, spend: 455 });
assert.deepEqual(s.hand, hand({ b5: 1, b1: 1, quarter: 2 }));
s = play(s, { type: 'jars-next' });
assert.equal(s.screen, 'add');
s = play(s, { type: 'tray-add', jar: 'give' });
assert.equal(view(s).trayTotal, 65);
s = play(s, { type: 'tray-add', jar: 'save' });
assert.equal(view(s).trayTotal, 195, 'Give plus Save');
assert.equal(play(s, { type: 'tray-add', jar: 'save' }), s, 'a jar goes in the tray once');
s = play(s, { type: 'tray-add', jar: 'spend' });
assert.equal(view(s).trayTotal, 650, 'the tray reads $0.65, then $1.95, then $6.50');
assert.deepEqual(play(s, { type: 'tray-remove', jar: 'spend' }).tray, ['give', 'save'], 'tapping a jar takes it back out');

// the ladder: hint, example, hint, grown-up screen; a right answer resets it
let a = s;
a = play(a, { type: 'add-answer', text: '5.00' });
assert.deepEqual(a.feedback, { kind: 'hint', key: 'add', text: COPY.addHint });
assert.equal(COPY.addHint, 'Add the jars one at a time. Start with Give plus Save, then add Spend.');
a = play(a, { type: 'add-answer', text: '' });
assert.equal(a.feedback.kind, 'example', 'the second miss shows the stored example');
assert.equal(a.feedback.lines.length, 1);
assert.ok(a.feedback.lines[0].includes('Earned $3.50.'), 'a different amount than his own');
assert.ok(!a.feedback.lines[0].includes('$6.50 '), 'never the same as what he earned');
assert.equal(a.qs.add.example, true);
a = play(a, { type: 'dismiss' });
assert.equal(a.feedback, null);
a = play(a, { type: 'add-answer', text: '6.51' });
assert.equal(a.feedback.kind, 'hint', 'the third miss is the hint again');
a = play(a, { type: 'add-answer', text: '6.49' });
assert.deepEqual(a.feedback, { kind: 'stuck', key: 'add', text: 'Show this screen to a grown-up.' }, 'the fourth miss in a row');
assert.equal(a.qs.add.misses, 4);
assert.equal(play(a, { type: 'add-answer', text: '6.50' }), a, 'it never skips: the right answer does nothing behind the grown-up screen');
a = play(a, { type: 'grownup-ok' });
assert.equal(a.screen, 'add');
a = play(a, { type: 'add-answer', text: '5.00' });
assert.equal(a.feedback.kind, 'hint', 'after "My grown-up helped me" the miss count starts over');
assert.deepEqual(outcomes(a).find((o) => o.key === 'add'), { key: 'add', outcome: 'stuck', misses: 5 }, 'but the grown-up still sees he got stuck');
// the example is never his own amount: a $3.50 payday gets the other stored example
{
  let e = play(newSession(T0), { type: 'earn-submit', text: '3.50' }, ...adjust('b1', 3), ...adjust('quarter', 2), { type: 'handed-done' }, { type: 'recap-yes' }, { type: 'jars-next' }, { type: 'add-answer', text: '1' }, { type: 'add-answer', text: '1' });
  assert.equal(e.feedback.kind, 'example');
  assert.ok(e.feedback.lines[0].startsWith('Earned $6.25.'), 'his $3.50 payday is shown the $6.25 example instead');
  assert.equal(pickExample(350).earned, 625);
}
s = play(s, { type: 'add-answer', text: '6.5' });
assert.equal(s.screen, 'make');
assert.equal(s.jar, 'give');
assert.equal(s.phase, 'can');
assert.equal(s.feedback.text, 'Yes! That is the $6.50 you earned.');
assert.equal(s.qs.add.ok && s.qs.add.misses, 0, 'right the first time');

// ---------- Step 5: Give $0.65 (the spec main example) ----------
const check = (st) => { assert.equal(conserved(st.earned, st.hand, ['give', 'save'].map((j) => st.built[j]).filter(Boolean)), true, 'the money never changes'); return st; };
assert.equal(questionKeys(s), 'give.can');
// the wrong answer to "can you make it?" gets the hint with the amount, not the answer
let wrong = play(s, { type: 'can-answer', value: 'yes' });
assert.deepEqual(wrong.feedback, { kind: 'hint', key: 'give.can', text: 'Pick some pieces from your hand and add them up. Is there any group that makes exactly $0.65?' });
assert.equal(play(s, { type: 'can-answer', value: 'maybe' }), s);
s = check(play(s, { type: 'can-answer', value: 'no' }));
assert.equal(s.phase, 'pick');
assert.equal(s.qs['give.can'].ok, true);
// tapping a penny (or anything not in his hand) is a miss; a bill or coin that he has is fine
assert.equal(play(s, { type: 'pick-piece', id: 'penny' }).feedback.kind, 'hint');
assert.equal(play(s, { type: 'pick-piece', id: 'penny' }).feedback.text, COPY.pickHint);
assert.equal(play(s, { type: 'pick-piece', id: 'b20' }).qs['give.pick'].misses, 1, 'he has no $20');
assert.equal(play(s, { type: 'pick-piece', id: 'nope' }), s);
s = play(s, { type: 'pick-piece', id: 'b1' });
assert.equal(s.phase, 'replace');
assert.equal(s.breaking, 'b1');
assert.deepEqual(view(s).smaller, ['quarter', 'dime', 'nickel', 'penny']);
assert.equal(view(s).breakingCents, 100);
assert.equal(play(s, { type: 'replace-adjust', id: 'b1', delta: 1 }), s, 'only smaller pieces are on offer');
assert.equal(play(s, { type: 'replace-adjust', id: 'b5', delta: 1 }), s);
// a replacement that does not add up: the spec hint with both totals
let r = play(s, ...adjust('quarter', 3, 'replace-adjust'), ...adjust('dime', 3, 'replace-adjust'), { type: 'replace-done' });
assert.equal(r.feedback.text, 'The pieces you asked for add up to $1.05. The piece you are breaking is worth $1.00. Change the pieces so they add up to the same amount.');
r = play(s, ...adjust('quarter', 3, 'replace-adjust'), ...adjust('dime', 2, 'replace-adjust'), { type: 'replace-done' });
assert.equal(r.feedback.text, 'The pieces you asked for add up to $0.95. The piece you are breaking is worth $1.00. Change the pieces so they add up to the same amount.');
assert.equal(r.phase, 'replace', 'a wrong break changes nothing');
assert.deepEqual(r.hand, s.hand);
assert.equal(play(s, { type: 'replace-cancel' }).phase, 'pick');
s = check(play(s, ...adjust('quarter', 3, 'replace-adjust'), ...adjust('dime', 2, 'replace-adjust'), ...adjust('nickel', 1, 'replace-adjust'), { type: 'replace-done' }));
assert.deepEqual(s.hand, hand({ b5: 1, quarter: 5, dime: 2, nickel: 1 }), 'the $1 bill is replaced by the new pieces');
assert.equal(s.phase, 'can', 'then the same question again');
assert.deepEqual(s.replacement, emptyPieces());
assert.equal(s.breaking, null);
s = check(play(s, { type: 'can-answer', value: 'yes' }));
assert.equal(s.phase, 'build');
// the jar: tap pieces from his hand, "in your jar so far" vs "this jar needs"
s = play(s, ...adjust('quarter', 3, 'jar-add'));
assert.equal(view(s).selectionTotal, 75);
assert.equal(view(s).jarGoal, 65);
assert.equal(view(s).inHand.quarter, 2, 'the pieces he tapped leave his hand view');
const tooMuch = play(s, { type: 'jar-done' });
assert.equal(tooMuch.feedback.text, 'Your jar has $0.75 in it, but this jar needs $0.65. Take out a piece or swap one.');
assert.equal(tooMuch.phase, 'build');
assert.equal(piecesTotal(tooMuch.hand), 650, 'a wrong jar changes nothing');
assert.equal(play(s, ...adjust('quarter', 9, 'jar-add')).selection.quarter, 5, 'he can only put in pieces he has');
assert.equal(play(s, { type: 'jar-add', id: 'b20' }), s);
s = play(s, { type: 'jar-remove', id: 'quarter' }, { type: 'jar-add', id: 'dime' }, { type: 'jar-add', id: 'nickel' });
assert.deepEqual(s.selection, hand({ quarter: 2, dime: 1, nickel: 1 }));
s = check(play(s, { type: 'jar-done' }));
assert.equal(s.phase, 'built');
assert.equal(s.feedback.text, 'Your Give jar has $0.65. That is exactly right.');
assert.deepEqual(s.built.give, hand({ quarter: 2, dime: 1, nickel: 1 }));
assert.deepEqual(s.hand, hand({ b5: 1, quarter: 3, dime: 1 }), 'his hand updates');
assert.equal(s.qs['give.build'].ok && s.qs['give.build'].misses, 0);
s = play(s, { type: 'jar-next' });
assert.equal(s.jar, 'save');
assert.equal(s.phase, 'can');
// ---------- Save $1.30: break twice ----------
s = check(play(s, { type: 'can-answer', value: 'no' }, { type: 'pick-piece', id: 'b5' }, ...adjust('b1', 5, 'replace-adjust'), { type: 'replace-done' }));
assert.equal(s.phase, 'can');
s = check(play(s, { type: 'can-answer', value: 'no' }, { type: 'pick-piece', id: 'quarter' }, ...adjust('dime', 2, 'replace-adjust'), ...adjust('nickel', 1, 'replace-adjust'), { type: 'replace-done' }));
assert.deepEqual(s.hand, hand({ b1: 5, quarter: 2, dime: 3, nickel: 1 }));
s = check(play(s, { type: 'can-answer', value: 'yes' }, { type: 'jar-add', id: 'b1' }, { type: 'jar-add', id: 'quarter' }, { type: 'jar-add', id: 'nickel' }, { type: 'jar-done' }));
assert.equal(s.feedback.text, 'Your Save jar has $1.30. That is exactly right.');
assert.deepEqual(s.hand, hand({ b1: 4, quarter: 1, dime: 3 }));
assert.equal(s.qs['save.pick'].ok, true);
s = play(s, { type: 'jar-next' });
// ---------- Spend ----------
assert.equal(s.screen, 'spend');
assert.equal(questionKeys(s), 'spend');
s = play(s, ...adjust('b1', 4, 'spend-add'), { type: 'spend-add', id: 'quarter' }, ...adjust('dime', 3, 'spend-add'));
assert.equal(view(s).selectionTotal, 455);
assert.equal(play(s, ...adjust('dime', 9, 'spend-add')).selection.dime, 3, 'only pieces still in his hand');
assert.equal(play(s, { type: 'spend-answer', text: '4.45' }).feedback.text, 'Look at every piece still in your hand. Tap them one at a time and watch your total.');
s = play(s, { type: 'spend-answer', text: '$4.55' });
assert.equal(s.screen, 'done');
assert.equal(s.finishedAt, T0);
assert.equal(s.feedback.text, 'That is exactly your Spend jar: $4.55.');
assert.equal(play(s, { type: 'earn-submit', text: '3' }), s, 'a finished payday is closed');
assert.equal(outcomes(s).every((o) => o.outcome === 'first-time' || o.outcome === 'stuck' || o.outcome === 'hint' || o.outcome === 'example'), true);
assert.ok(outcomes(s).some((o) => o.key === 'add' && o.outcome === 'first-time'));
check(s);

// ---------- the same payday through a save and a load at every step ----------
{
  const script = [
    { type: 'earn-submit', text: '6.50' }, ...adjust('b5', 1), ...adjust('b1', 1), ...adjust('quarter', 2), { type: 'handed-done' }, { type: 'recap-yes' }, { type: 'jars-next' },
    { type: 'tray-add', jar: 'give' }, { type: 'add-answer', text: '6.50' }, { type: 'can-answer', value: 'no' }, { type: 'pick-piece', id: 'b1' },
    ...adjust('quarter', 3, 'replace-adjust'), ...adjust('dime', 2, 'replace-adjust'), ...adjust('nickel', 1, 'replace-adjust'), { type: 'replace-done' },
    { type: 'can-answer', value: 'yes' }, ...adjust('quarter', 2, 'jar-add'), { type: 'jar-add', id: 'dime' }, { type: 'jar-add', id: 'nickel' }, { type: 'jar-done' }, { type: 'jar-next' },
  ];
  let live = newSession(T0);
  script.forEach((action, i) => {
    live = act(live, action, T0);
    const loaded = roundTrip(live);
    assert.ok(loaded, `step ${i} (${action.type}) survives a save and load`);
    assert.deepEqual(loaded, live, `step ${i} (${action.type}) comes back exactly`);
  });
  assert.equal(live.screen, 'make');
  assert.equal(live.jar, 'save');
}

// ---------- a payday that is too small for a jar ----------
{
  let tiny = play(newSession(T0), { type: 'earn-submit', text: '0.02' }, ...adjust('penny', 2), { type: 'handed-done' }, { type: 'recap-yes' }, { type: 'jars-next' });
  assert.deepEqual(tiny.jars, { give: 0, save: 0, spend: 2 });
  tiny = play(tiny, { type: 'add-answer', text: '0.02' });
  assert.equal(tiny.screen, 'make');
  assert.equal(tiny.phase, 'built', 'a $0.00 Give jar has nothing to build');
  assert.deepEqual(tiny.built.give, emptyPieces());
  tiny = play(tiny, { type: 'jar-next' });
  assert.equal(tiny.jar, 'save');
  assert.equal(tiny.phase, 'built');
  tiny = play(tiny, { type: 'jar-next' }, { type: 'spend-add', id: 'penny' }, { type: 'spend-add', id: 'penny' }, { type: 'spend-answer', text: '0.02' });
  assert.equal(tiny.screen, 'done');
  assert.equal(roundTrip(tiny).screen, 'done');
}

// ---------- the $3.50 example from the spec, played ----------
{
  let e = play(newSession(T0), { type: 'earn-submit', text: '3.50' }, ...adjust('b1', 3), ...adjust('quarter', 2), { type: 'handed-done' }, { type: 'recap-yes' }, { type: 'jars-next' }, { type: 'add-answer', text: '3.50' });
  assert.deepEqual(e.jars, { give: 35, save: 70, spend: 245 });
  e = play(e, { type: 'can-answer', value: 'no' }, { type: 'pick-piece', id: 'b1' }, ...adjust('quarter', 3, 'replace-adjust'), ...adjust('dime', 2, 'replace-adjust'), ...adjust('nickel', 1, 'replace-adjust'), { type: 'replace-done' });
  assert.deepEqual(e.hand, hand({ b1: 2, quarter: 5, dime: 2, nickel: 1 }));
  e = play(e, { type: 'can-answer', value: 'yes' }, { type: 'jar-add', id: 'quarter' }, { type: 'jar-add', id: 'dime' }, { type: 'jar-done' }, { type: 'jar-next' });
  assert.deepEqual(e.hand, hand({ b1: 2, quarter: 4, dime: 1, nickel: 1 }));
  e = play(e, { type: 'can-answer', value: 'no' }, { type: 'pick-piece', id: 'quarter' }, ...adjust('dime', 2, 'replace-adjust'), ...adjust('nickel', 1, 'replace-adjust'), { type: 'replace-done' });
  assert.deepEqual(e.hand, hand({ b1: 2, quarter: 3, dime: 3, nickel: 2 }));
  e = play(e, { type: 'can-answer', value: 'yes' }, ...adjust('quarter', 2, 'jar-add'), ...adjust('dime', 2, 'jar-add'), { type: 'jar-done' }, { type: 'jar-next' });
  assert.deepEqual(e.hand, hand({ b1: 2, quarter: 1, dime: 1, nickel: 2 }));
  e = play(e, ...adjust('b1', 2, 'spend-add'), { type: 'spend-add', id: 'quarter' }, { type: 'spend-add', id: 'dime' }, ...adjust('nickel', 2, 'spend-add'), { type: 'spend-answer', text: '2.45' });
  assert.equal(e.screen, 'done');
}

// ---------- the can-I-make-it answer is worked out by the app, from his real pieces ----------
{
  // four quarters cannot make $0.10: "yes" is wrong (a hint), "no" is right (then he breaks something)
  let q = play(newSession(T0), { type: 'earn-submit', text: '1.00' }, ...adjust('quarter', 4), { type: 'handed-done' }, { type: 'recap-yes' }, { type: 'jars-next' }, { type: 'add-answer', text: '1.00' });
  assert.deepEqual(q.jars, { give: 10, save: 20, spend: 70 });
  const wrongYes = play(q, { type: 'can-answer', value: 'yes' });
  assert.equal(wrongYes.phase, 'can');
  assert.equal(wrongYes.feedback.kind, 'hint');
  assert.equal(wrongYes.qs['give.can'].misses, 1);
  assert.equal(play(q, { type: 'can-answer', value: 'no' }).phase, 'pick');
  // ten dimes CAN make $0.10 as they are: "yes" goes straight to building the jar, "no" is the wrong answer
  q = play(newSession(T0), { type: 'earn-submit', text: '1.00' }, ...adjust('dime', 10), { type: 'handed-done' }, { type: 'recap-yes' }, { type: 'jars-next' }, { type: 'add-answer', text: '1.00' });
  assert.equal(play(q, { type: 'can-answer', value: 'yes' }).phase, 'build');
  const wrongNo = play(q, { type: 'can-answer', value: 'no' });
  assert.equal(wrongNo.phase, 'can');
  assert.equal(wrongNo.feedback.kind, 'hint');
}

// ---------- tray is for the add step only ----------
assert.equal(play(newSession(T0), { type: 'tray-add', jar: 'give' }).tray.length, 0);

// ---------- persistence: a payday that is half done comes back; junk is dropped; money must add up ----------
const book = addSession(emptyPayday(), s);
assert.equal(book.sessions.length, 1);
assert.equal(openSession(book), null, 'a finished payday is not "open"');
const half = play(newSession('2026-10-06T10:00:00.000Z'), { type: 'earn-submit', text: '2.00' }, ...adjust('b1', 2));
const book2 = addSession(book, half);
assert.equal(openSession(book2).id, half.id);
assert.equal(actOnOpen(book2, { type: 'handed-done' }, T0).sessions[0].screen, 'recap');
assert.equal(actOnOpen(book, { type: 'handed-done' }, T0), book, 'no open payday: nothing happens');
assert.equal(abandonOpen(book2).sessions[0].abandoned, true);
assert.equal(openSession(abandonOpen(book2)), null);
assert.equal(normalizePayday(JSON.parse(JSON.stringify(book2))).sessions.length, 2);
assert.equal(normalizePayday(JSON.parse(JSON.stringify(book2))).sessions[0].id, half.id, 'newest first');
assert.deepEqual(normalizePayday(null), { sessions: [] });
assert.deepEqual(normalizePayday({ sessions: 'x' }), { sessions: [] });
assert.deepEqual(normalizePayday({ sessions: [null, 5, 'a', {}, { v: 2 }] }), { sessions: [] });
const midway = JSON.parse(JSON.stringify(s));
// tampering: the hand no longer adds up -> the payday is dropped, never trusted
const forged = { ...JSON.parse(JSON.stringify(book2.sessions[1])), screen: 'make', earned: 650, jars: { give: 1, save: 1, spend: 648 }, hand: { b20: 5 } };
assert.equal(normalizeSession(forged), null, 'money that does not add up is dropped');
const alsoForged = { ...JSON.parse(JSON.stringify(half)), screen: 'spend', earned: 200, hand: { b1: 2 }, built: { give: null, save: null } };
assert.equal(normalizeSession(alsoForged), null, 'Spend needs both jars built');
assert.equal(normalizeSession({ ...midway, screen: 'nowhere' }), null);
assert.equal(normalizeSession({ ...midway, earned: 999999 }), null);
assert.equal(normalizeSession({ ...midway, id: 'x'.repeat(200) }), null);
const sane = normalizeSession({ ...JSON.parse(JSON.stringify(half)), handed: { b1: 9999, evil: 3, quarter: -4 }, feedback: { kind: 'hint', text: 'y'.repeat(5000), key: '__proto__' }, qs: JSON.parse('{"__proto__":{"misses":1},"bogus":{"misses":9},"earn":{"misses":2.5,"ok":1}}') });
assert.equal(sane.handed.b1, 20, 'counters are capped');
assert.equal(sane.handed.quarter, 0);
assert.equal('evil' in sane.handed, false);
assert.equal(sane.feedback.text.length, 400);
assert.equal(sane.feedback.key, undefined);
assert.deepEqual(Object.keys(sane.qs), ['earn']);
assert.deepEqual(sane.qs.earn, { misses: 0, streak: 0, hint: false, example: false, stuck: false, ok: false });
assert.equal(normalizeSession({ ...JSON.parse(JSON.stringify(half)), feedback: { kind: 'stuck', text: 'x' } }).feedback, null, 'a grown-up screen with no question is dropped');

// ---------- fuzz: any pile of random taps keeps the money exact, never throws, always saves and loads ----------
let seed = 99;
const rnd = (n) => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % n; };
const pick = (list) => list[rnd(list.length)];
const makeAction = (st) => {
  const t = pick(['earn-submit', 'piece-adjust', 'handed-done', 'change-amount', 'change-pieces', 'pieces-clear', 'recap-yes', 'jars-next', 'tray-add', 'tray-remove', 'add-answer', 'can-answer', 'pick-piece', 'replace-adjust', 'replace-done', 'replace-cancel', 'jar-add', 'jar-remove', 'jar-done', 'jar-next', 'spend-add', 'spend-remove', 'spend-answer', 'dismiss', 'grownup-ok']);
  const id = pick([...PIECE_IDS, 'nope']);
  const target = st.jars ? [st.jars.give, st.jars.save, st.jars.spend] : [0];
  const amount = pick([...target.map((c) => (c / 100).toFixed(2)), st.earned ? (st.earned / 100).toFixed(2) : '6.50', '1', 'x', '']);
  return { type: t, id, delta: pick([1, -1]), text: amount, jar: pick(['give', 'save', 'spend']), value: pick(['yes', 'no']) };
};
let finished = 0;
let reachedMake = 0;
for (let run = 0; run < 400; run += 1) {
  let st = newSession(T0);
  for (let i = 0; i < 160; i += 1) {
    // a hopeful kid: usually tries the helpful next thing, sometimes junk
    let action;
    if (rnd(100) < 70) {
      if (st.screen === 'earn') action = { type: 'earn-submit', text: pick(['3.50', '6.50', '1.25', '12.00', '0.75', '9.95', '20']) };
      else if (st.screen === 'handed') {
        const VAL = { b20: 2000, b10: 1000, b5: 500, b1: 100, quarter: 25, dime: 10, nickel: 5, penny: 1 };
        const left = st.earned - piecesTotal(st.handed);
        const fits = PIECE_IDS.filter((p) => VAL[p] <= left && st.handed[p] < 20);
        if (left === 0) action = { type: 'handed-done' };
        else if (left < 0 || !fits.length) action = { type: 'pieces-clear' };
        else action = { type: 'piece-adjust', id: pick(fits), delta: 1 };
      }
      else if (st.screen === 'recap') action = { type: 'recap-yes' };
      else if (st.screen === 'jars') action = { type: 'jars-next' };
      else if (st.screen === 'add') action = { type: 'add-answer', text: (st.earned / 100).toFixed(2) };
      else if (st.screen === 'make' && st.phase === 'can') action = { type: 'can-answer', value: canMake(st.hand, st.jars[st.jar]) ? 'yes' : 'no' };
      else if (st.screen === 'make' && st.phase === 'pick') action = { type: 'pick-piece', id: pick(PIECE_IDS.filter((p) => canBreak(p) && st.hand[p] > 0)) };
      else if (st.screen === 'make' && st.phase === 'replace') {
        const need = st.breaking ? { b20: 2000, b10: 1000, b5: 500, b1: 100, quarter: 25, dime: 10, nickel: 5, penny: 1 }[st.breaking] : 0;
        if (piecesTotal(st.replacement) < need) { const ids = smallerIds(st.breaking).filter((p) => ({ b20: 2000, b10: 1000, b5: 500, b1: 100, quarter: 25, dime: 10, nickel: 5, penny: 1 }[p]) <= need - piecesTotal(st.replacement)); action = { type: 'replace-adjust', id: pick(ids), delta: 1 }; } else action = { type: 'replace-done' };
      } else if (st.screen === 'make' && st.phase === 'build') {
        const need = findSelection(st.hand, st.jars[st.jar]);
        const extra = PIECE_IDS.find((p) => st.selection[p] > need[p]);
        const lacking = PIECE_IDS.find((p) => st.selection[p] < need[p]);
        action = extra ? { type: 'jar-remove', id: extra } : lacking ? { type: 'jar-add', id: lacking } : { type: 'jar-done' };
      } else if (st.screen === 'make' && st.phase === 'built') action = { type: 'jar-next' };
      else if (st.screen === 'spend') action = piecesTotal(st.selection) < piecesTotal(st.hand) ? { type: 'spend-add', id: pick(PIECE_IDS.filter((p) => view(st).inHand[p] > 0)) } : { type: 'spend-answer', text: (st.jars.spend / 100).toFixed(2) };
      else action = { type: 'dismiss' };
      if (st.feedback && st.feedback.kind === 'stuck') action = { type: 'grownup-ok' };
    } else action = makeAction(st);
    st = act(st, action, T0);
    if (st.jars && st.screen !== 'earn' && st.screen !== 'handed' && st.screen !== 'recap' && st.screen !== 'jars' && st.screen !== 'add') {
      assert.equal(conserved(st.earned, st.hand, ['give', 'save'].map((j) => st.built[j]).filter(Boolean)), true, `run ${run} step ${i}: ${action.type}`);
    }
    if (st.screen === 'make') reachedMake += 1;
    const loaded = roundTrip(st);
    assert.ok(loaded, `run ${run} step ${i}: ${action.type} must save and load`);
    assert.deepEqual(loaded, st, `run ${run} step ${i}: ${action.type} comes back exactly`);
    if (st.screen === 'done') { finished += 1; break; }
  }
}
assert.ok(finished > 40, `plenty of random paydays finish (${finished})`);
assert.ok(reachedMake > 500);

// ---------- nothing on any feedback ever contains the answer to the question being asked ----------
{
  // add-the-jars: the hint and example never print his own total
  let q = newSession(T0);
  q = play(q, { type: 'earn-submit', text: '8.75' }, ...adjust('b5', 1), ...adjust('b1', 3), ...adjust('quarter', 3), { type: 'handed-done' }, { type: 'recap-yes' }, { type: 'jars-next' });
  assert.equal(q.earned, 875);
  for (let i = 0; i < 3; i += 1) {
    q = play(q, { type: 'add-answer', text: '1' });
    const blob = JSON.stringify(q.feedback);
    assert.equal(blob.includes('8.75'), false, `miss ${i + 1}: never his own total`);
  }
}

console.log('ok — payday session: $6.50 and $3.50 played start to finish, Step 1/2 messages word for word, hint → example → hint → grown-up on every question, saves and loads at every step, random taps keep the money exact');

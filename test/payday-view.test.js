// Payday Helper screens (src/payday/view.js), the grown-up summary (summary.js) and how they plug into the iPad page:
// every screen renders from real session states, every button the screens draw is handled by app.js, nothing a kid sees
// names a person or says easy/hard/guided/standard, the answer to a question he is on is never printed, the younger
// son's calendar has the button and the older son's does not, Parent Mode has a Payday tab, and a payday saves and loads
// through the real store.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { act, newSession } from '../src/payday/session.js';
import { actOnOpen, addSession, emptyPayday, openSession } from '../src/payday/state.js';
import { formatMoney } from '../src/payday/logic.js';

const memory = new Map();
globalThis.localStorage = {
  getItem: (key) => (memory.has(key) ? memory.get(key) : null),
  setItem: (key, value) => { memory.set(key, String(value)); },
  removeItem: (key) => { memory.delete(key); },
};
const { renderPayday } = await import('../src/payday/view.js');
const { paydaySummaryHtml, summarize, QUESTION_LABELS } = await import('../src/payday/summary.js');
const store = await import('../src/daily/store.js');
const { renderCalendar } = await import('../src/daily/calendar.js');
const { renderParent, createParentState } = await import('../src/daily/parent-view.js');

const T0 = '2026-10-05T17:00:00.000Z';
const adjust = (id, n, type = 'piece-adjust') => Array.from({ length: n }, () => ({ type, id, delta: 1 }));
const play = (state, ...actions) => actions.reduce((s, a) => act(s, a, T0), state);
const actionsIn = (html) => [...html.matchAll(/data-action="([^"]+)"/g)].map((m) => m[1]);
const plain = (html) => html.replace(/<[^>]*>/g, ' ').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').replace(/ ([.,;:?!])/g, '$1').trim();

// one payday, captured at every screen the kid can reach
const frames = {};
let s = newSession(T0);
frames.earn = s;
s = play(s, { type: 'earn-submit', text: '6.50' }, ...adjust('b5', 1), ...adjust('b1', 2));
frames.handedOver = play(s, { type: 'handed-done' });
s = play(s, { type: 'piece-adjust', id: 'b1', delta: -1 }, ...adjust('quarter', 2));
frames.handed = s;
s = play(s, { type: 'handed-done' });
frames.recap = s;
s = play(s, { type: 'recap-yes' });
frames.jars = s;
s = play(s, { type: 'jars-next' }, { type: 'tray-add', jar: 'give' }, { type: 'tray-add', jar: 'save' });
frames.add = s;
frames.addHint = play(s, { type: 'add-answer', text: '1' });
frames.addExample = play(s, { type: 'add-answer', text: '1' }, { type: 'add-answer', text: '1' });
s = play(s, { type: 'add-answer', text: '6.50' });
frames.can = s;
frames.canHint = play(s, { type: 'can-answer', value: 'yes' });
s = play(s, { type: 'can-answer', value: 'no' });
frames.pick = s;
frames.pickHint = play(s, { type: 'pick-piece', id: 'penny' });
s = play(s, { type: 'pick-piece', id: 'b1' }, ...adjust('quarter', 3, 'replace-adjust'), ...adjust('dime', 3, 'replace-adjust'));
frames.replace = s;
frames.replaceHint = play(s, { type: 'replace-done' });
s = play(s, { type: 'replace-adjust', id: 'dime', delta: -1 }, { type: 'replace-adjust', id: 'nickel', delta: 1 }, { type: 'replace-done' });
s = play(s, { type: 'can-answer', value: 'yes' }, ...adjust('quarter', 3, 'jar-add'));
frames.build = s;
frames.buildHint = play(s, { type: 'jar-done' });
s = play(s, { type: 'jar-remove', id: 'quarter' }, { type: 'jar-add', id: 'dime' }, { type: 'jar-add', id: 'nickel' }, { type: 'jar-done' });
frames.built = s;
s = play(s, { type: 'jar-next' }, { type: 'can-answer', value: 'no' }, { type: 'pick-piece', id: 'b5' }, ...adjust('b1', 5, 'replace-adjust'), { type: 'replace-done' },
  { type: 'can-answer', value: 'no' }, { type: 'pick-piece', id: 'quarter' }, ...adjust('dime', 2, 'replace-adjust'), { type: 'replace-adjust', id: 'nickel', delta: 1 }, { type: 'replace-done' },
  { type: 'can-answer', value: 'yes' }, { type: 'jar-add', id: 'b1' }, { type: 'jar-add', id: 'quarter' }, { type: 'jar-add', id: 'nickel' }, { type: 'jar-done' }, { type: 'jar-next' });
frames.spend = s;
s = play(s, ...adjust('b1', 4, 'spend-add'), { type: 'spend-add', id: 'quarter' }, ...adjust('dime', 3, 'spend-add'));
frames.spendTray = s;
frames.done = play(s, { type: 'spend-answer', text: '4.55' });
let stuck = newSession(T0);
for (let i = 0; i < 4; i += 1) stuck = play(stuck, { type: 'earn-submit', text: 'x' });
frames.stuck = stuck;

const BANNED = /\b(jesse|dad|mom|easy|hard|guided|standard)\b/i;
const app = fs.readFileSync(new URL('../src/daily/app.js', import.meta.url), 'utf8');
const seen = new Set();
Object.entries(frames).forEach(([name, state]) => {
  const html = renderPayday(state, {});
  assert.ok(html.includes('class="pd"'), `${name}: renders`);
  assert.ok(html.includes('Payday Helper'), `${name}: titled`);
  assert.equal(BANNED.test(plain(html)), false, `${name}: no names and no easy/hard/guided/standard (${BANNED.exec(plain(html))})`);
  actionsIn(html).forEach((action) => { seen.add(action); if (action.startsWith('payday-')) assert.ok(app.includes(`'${action}'`), `${name}: app.js handles ${action}`); });
  assert.equal(/\$NaN|undefined|null|NaN/.test(plain(html)), false, `${name}: no stray NaN/undefined`);
  assert.ok(!html.includes('<script'), `${name}: no script`);
});
// every payday action app.js handles is drawn by some screen, so no handler is dead
['payday-earn-submit', 'payday-piece-plus', 'payday-piece-minus', 'payday-handed-done', 'payday-change-amount', 'payday-pieces-clear', 'payday-change-pieces', 'payday-recap-yes',
  'payday-jars-next', 'payday-tray-add', 'payday-tray-remove', 'payday-add-answer', 'payday-can', 'payday-pick', 'payday-replace-plus', 'payday-replace-minus', 'payday-replace-done',
  'payday-replace-cancel', 'payday-jar-add', 'payday-jar-remove', 'payday-jar-done', 'payday-jar-next', 'payday-spend-add', 'payday-spend-remove', 'payday-spend-answer', 'payday-dismiss',
  'payday-grownup-ok', 'payday-new', 'payday-restart'].forEach((action) => assert.ok(seen.has(action), `a screen draws ${action}`));
assert.ok(renderPayday(frames.earn, { confirmRestart: true }).includes('payday-restart-yes'));
assert.ok(renderPayday(frames.earn, { confirmRestart: true }).includes('payday-restart-no'));
assert.ok(!renderPayday(frames.done, { confirmRestart: true }).includes('payday-restart'), 'a finished payday has no "start over" question');

const text = (name, ui) => plain(renderPayday(frames[name], ui || {}));
// the spec's words on each screen
assert.ok(text('earn').includes('How much money did you earn this week? Type it in dollars, like 6.50.'));
assert.ok(text('handed').includes('Now tell me the bills and coins you were handed. Tap + for each one.'));
assert.ok(/My bills and coins add up to \$6\.50 ?\./.test(text('handed')), 'the running total (here $6.50)');
assert.ok(text('handedOver').includes('Your bills and coins add up to $7.00, but you earned $6.50. That is $0.50 too much. Look at what you were handed again.'));
assert.ok(text('handed').includes('Change the amount I earned') && text('handed').includes('Change my bills and coins'), 'the two links are always on the counters screen');
['$20 bill', '$10 bill', '$5 bill', '$1 bill', 'quarter', 'dime', 'nickel', 'penny'].forEach((name) => assert.ok(text('handed').includes(name), `a counter for ${name}`));
assert.equal((renderPayday(frames.handed, {}).match(/class="pd-counter"/g) || []).length, 8, 'eight counters, pennies included');
assert.ok(text('recap').includes("That matches! You earned $6.50 and you were handed $6.50."));
assert.ok(text('recap').includes('You earned $6.50. You were handed: 1 $5 bill, 1 $1 bill and 2 quarters. Is this right?'));
assert.ok(text('jars').includes('Give (10%) $0.65') && text('jars').includes('Save (20%) $1.30') && text('jars').includes('Spend (70%) $4.55'));
assert.ok(text('jars').indexOf('Give') < text('jars').indexOf('Save') && text('jars').indexOf('Save') < text('jars').indexOf('Spend'), 'always Give, Save, Spend');
assert.ok(text('add').includes('Add your three jars together. Tap each jar to add it to your tray. What total do you get?'));
assert.ok(text('add').includes('So far: $1.95'), 'the tray after Give and Save');
assert.ok(text('addHint').includes('Add the jars one at a time. Start with Give plus Save, then add Spend.'));
assert.ok(text('addExample').includes('Here is an example with different money') && text('addExample').includes('Earned $3.50.'));
assert.ok(!text('addExample').includes('Earned $6.50.'), 'never his own amount');
assert.ok(text('can').includes('You need $0.65 for your Give jar. Here is what you have right now:'));
assert.ok(text('can').includes('Can you make exactly $0.65 with only these pieces, without breaking any?'));
assert.ok(renderPayday(frames.can, {}).includes('data-value="yes"') && renderPayday(frames.can, {}).includes('data-value="no"'), 'the word bank: yes, no');
assert.ok(text('canHint').includes('Pick some pieces from your hand and add them up. Is there any group that makes exactly $0.65?'));
assert.ok(text('pick').includes('Which bill or coin will you break into smaller pieces?'));
assert.ok(text('pickHint').includes('Look at how much you are missing. Which piece could you break to get the small coins you need?'));
assert.ok(text('replace').includes('What smaller pieces will you ask for instead? They must add up to the same amount.'));
assert.ok(text('replace').includes('The new pieces add up to $1.05.'));
assert.ok(text('replaceHint').includes('The pieces you asked for add up to $1.05. The piece you are breaking is worth $1.00. Change the pieces so they add up to the same amount.'));
assert.ok(text('build').includes('Now build your Give jar. Tap the pieces you will put in the jar.'));
assert.ok(text('build').includes('In your jar so far: $0.75') && text('build').includes('This jar needs: $0.65'));
assert.ok(text('buildHint').includes('Your jar has $0.75 in it, but this jar needs $0.65. Take out a piece or swap one.'));
assert.ok(text('built').includes('Your Give jar has $0.65. That is exactly right.'));
assert.ok(text('spend').includes('Your Give and Save jars are done. Look at what is left in your hand. Tap each piece to add it to your tray. What total do you get?'));
assert.ok(text('spendTray').includes('So far: $4.55'));
assert.ok(text('done').includes('All three jars are done: Give $0.65, Save $1.30, Spend $4.55.'));
assert.ok(text('stuck').includes('Show this screen to a grown-up.') && text('stuck').includes('My grown-up helped me. Try again.'));
assert.equal((renderPayday(frames.stuck, {}).match(/<button/g) || []).length, 2, 'the grown-up screen: the back link and ONE button');
assert.ok(!renderPayday(frames.stuck, {}).includes('payday-restart'), 'and no way around it');

// the answer to the question he is on is never on the screen before he answers it
assert.equal(text('earn').includes('6.50'), true, 'sanity: the example amount in the prompt text is only the placeholder "like 6.50"');
['can', 'pick'].forEach((name) => assert.equal(/\b(yes it can|no it cannot|the answer is)\b/i.test(text(name)), false));
assert.ok(text('can').includes('without breaking any?'), 'the question says "without breaking any", not that he must break');
assert.equal(/need to break/i.test(text('can')) || /must break/i.test(text('can')), false, 'the can-you-make-it screen does not give away that he must break');
assert.ok(text('pick').includes('so you need to break one'), 'but once he has answered no it says so');

// ---------- the grown-up summary ----------
const summary = summarize(frames.done);
assert.equal(summary.status, 'finished');
assert.equal(summary.earned, 650);
assert.equal(summary.handed, '1 $5 bill, 1 $1 bill and 2 quarters');
assert.deepEqual(summary.jars, { give: 65, save: 130, spend: 455 });
assert.ok(summary.questions.length >= 8);
assert.equal(summary.questions.find((q) => q.key === 'add').outcome, 'first-time');
assert.equal(summary.questions.find((q) => q.key === 'give.can').outcome, 'first-time');
Object.keys(QUESTION_LABELS).forEach((key) => assert.ok(QUESTION_LABELS[key].length > 5));
const withMiss = play(frames.add, { type: 'add-answer', text: '1' }, { type: 'add-answer', text: '1' });
assert.equal(summarize(withMiss).questions.find((q) => q.key === 'add').outcome, 'example');
const withHint = play(frames.add, { type: 'add-answer', text: '1' });
assert.equal(summarize(withHint).questions.find((q) => q.key === 'add').outcome, 'hint');
const stuckAdd = play(frames.add, ...Array.from({ length: 4 }, () => ({ type: 'add-answer', text: '1' })));
assert.equal(summarize(stuckAdd).stuck.length, 1);
assert.equal(summarize(stuckAdd).status, 'in-progress');
let handedStuck = play(newSession(T0), { type: 'earn-submit', text: '6.50' }, ...adjust('b5', 1));
for (let i = 0; i < 4; i += 1) handedStuck = play(handedStuck, { type: 'handed-done' });
let book = addSession(addSession(addSession(emptyPayday(), frames.done), { ...handedStuck, id: 'pd-b', startedAt: '2026-10-06T10:00:00.000Z' }), { ...stuckAdd, id: 'pd-c', startedAt: '2026-10-07T10:00:00.000Z' });
const html = paydaySummaryHtml(book);
const summaryText = plain(html);
assert.ok(summaryText.includes('Earned: $6.50') && summaryText.includes('Give $0.65 · Save $1.30 · Spend $4.55') && summaryText.includes('Finished'));
assert.ok(summaryText.includes('Stuck on:') && summaryText.includes('Matching the bills and coins to what he earned'), 'a stuck question is listed');
assert.ok(summaryText.includes('He had 1 $5 bill entered for $6.50.'), 'for Step 2 the grown-up sees the amount and what he entered');
assert.ok(summaryText.includes('Right the first time'));
assert.equal(/Not finished yet/.test(summaryText), true);
assert.ok(paydaySummaryHtml(emptyPayday()).includes('No paydays yet.'));
assert.ok(paydaySummaryHtml({ sessions: [frames.earn] }).includes('No paydays yet.'), 'a payday with no amount typed is not listed');
const many = { sessions: Array.from({ length: 15 }, (_, i) => ({ ...frames.done, id: `pd-${i}`, startedAt: `2026-10-${String(10 + i).padStart(2, '0')}T10:00:00.000Z` })) };
assert.equal((paydaySummaryHtml(many).match(/<article/g) || []).length, 10);
assert.equal(/\bhe typed|his answer\b/i.test(html), false, 'the grown-up page never prints what he typed for a missed question');

// ---------- the calendar button and Parent Mode ----------
const guided = { ...store.emptyStore(), track: 'guided' };
const standard = { ...store.emptyStore(), track: 'standard' };
assert.ok(renderCalendar(guided, '2026-10-05', 2026, 9).includes('data-action="open-payday"'), "the younger son's calendar has the Payday Helper button");
assert.ok(!renderCalendar(standard, '2026-10-05', 2026, 9).includes('open-payday'), "the older son's does not");
assert.ok(renderCalendar(guided, '2026-10-05', 2026, 9).includes('Payday Helper'));
const unlocked = JSON.parse(JSON.stringify({ ...guided, payday: book }));
unlocked.parent.unlockedUntil = Date.now() + 3600000;
const ps = createParentState();
let parentHtml = renderParent(unlocked, ps, '2026-10-05', Date.now());
assert.ok(parentHtml.includes('data-day="payday"'), 'Parent Mode has a Payday tab for the younger son');
ps.selectedDay = 'payday';
parentHtml = renderParent(unlocked, ps, '2026-10-05', Date.now());
assert.ok(parentHtml.includes('cqd-payday-summary') && plain(parentHtml).includes('Earned: $6.50'));
assert.ok(!parentHtml.includes('daily-parent-save'), 'the Payday tab has nothing to save: the app already checked it');
const older = JSON.parse(JSON.stringify({ ...standard, payday: book }));
older.parent.unlockedUntil = Date.now() + 3600000;
assert.ok(!renderParent(older, createParentState(), '2026-10-05', Date.now()).includes('data-day="payday"'), "no Payday tab on the older son's iPad");
const noWeek = renderParent(unlocked, { ...createParentState(), selectedDay: 'payday' }, '2026-11-30', Date.now());
assert.ok(noWeek.includes('cqd-payday-summary'), 'the summary is still reachable when no week is scheduled');

// ---------- saving and loading through the real store ----------
memory.clear();
let st = store.load();
assert.deepEqual(st.payday, { sessions: [] });
let live = emptyPayday();
live = addSession(live, play(newSession(T0), { type: 'earn-submit', text: '6.50' }, ...adjust('b5', 1), ...adjust('b1', 1), ...adjust('quarter', 2)));
let result = store.commit(st, (cur) => ({ ...cur, payday: live }));
assert.equal(result.core.ok, true);
st = result.store;
// a tap is applied to the LATEST saved payday (so a second tab never overwrites it)
result = store.commit(st, (cur) => ({ ...cur, payday: actOnOpen(cur.payday, { type: 'handed-done' }, T0) }));
st = result.store;
assert.equal(openSession(st.payday).screen, 'recap');
const reloaded = store.load();
assert.equal(openSession(reloaded.payday).screen, 'recap', 'it comes back after a reload');
assert.equal(openSession(reloaded.payday).earned, 650);
assert.deepEqual(reloaded.payday.sessions.length, 1);
// storage that is junk or forged is ignored, never trusted
memory.set('codequest-daily-v1', JSON.stringify({ track: 'guided', payday: { sessions: [{ v: 1, id: 'x', startedAt: T0, screen: 'spend', earned: 650, hand: { b20: 9 }, built: { give: {}, save: {} } }, 'junk', null] } }));
assert.deepEqual(store.load().payday, { sessions: [] }, 'money that does not add up is dropped on load');
memory.set('codequest-daily-v1', '{not json');
assert.deepEqual(store.load().payday, { sessions: [] });
assert.deepEqual(store.emptyStore().payday, { sessions: [] });

console.log('ok — payday view: every screen renders from real states, every button is handled, the spec wording on each screen, no names/easy/hard, the grown-up summary and Payday tab, saves and loads through the store');

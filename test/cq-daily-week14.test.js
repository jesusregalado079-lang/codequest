// Week 14 (Monday 2026-10-12), planned by Jesse in a separate session ("Week 14 plan" and "Week 14 Bible reading
// (updated)" in the Drive folder CodeQuest Plans) and typed into content.js. Every answer is re-derived here
// WITHOUT trusting content.js: decimal products use integer (BigInt) arithmetic on scaled values and the factors are
// parsed back out of the prompt text, "bigger or smaller" is decided by comparing the exact product, percent blocks
// are 100 * part / whole, coin totals are parsed from the coins in the prompt, the add / subtract / multiply /
// divide choice is decided from the clue words and the result from the numbers in the story. Also: the stepped-line
// chains (1a, 1b, 1c), the multiple-choice Bible Reading, the verses, the help level per weekday, the schedule, and
// that nothing a kid sees carries an answer, a note, or a banned word.
import assert from 'node:assert/strict';
import { DAILY_WORK } from '../src/cq/daily-work/content.js';
import { currentWeek } from '../src/cq/daily-work/schedule.js';
import { blockPlan, blockView } from '../src/daily/blocks.js';

globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
const { gradeSuggestion } = await import('../src/daily/parent-view.js');
const { renderSheetArticle, weekVerse } = await import('../src/daily/sheet-view.js');

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const g = DAILY_WORK.guided.weeks['week-14'];
const s = DAILY_WORK.standard.weeks['week-14'];
const sheetOf = (week, day, index) => week.days[day].sheets[index];
const itemOf = (week, day, index, id) => {
  const found = sheetOf(week, day, index).items.find((entry) => entry.id === id);
  assert.ok(found, `${day} sheet ${index} has item ${id}`);
  return found;
};
const allItems = (week) => DAYS.flatMap((day) => week.days[day].sheets.flatMap((sheet, index) => sheet.items.map((entry) => ({ day, index, sheet, entry }))));
const plain = (html) => html.replace(/<[^>]*>/g, ' ').replace(/&#39;|&#x27;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const tight = (text) => text.replace(/\s+([,.])/g, '$1'); // the blank's markup leaves a space before a comma
const EMPTY = { sheets: {}, submittedAt: null };
const render = (week, day, sheet) => renderSheetArticle(week, day, sheet, EMPTY, false, () => 0, () => false);

// ---------- exact decimal arithmetic (BigInt on scaled integers, never floating point) ----------
const dec = (text) => {
  const m = /^(\d*)(?:\.(\d+))?$/.exec(String(text));
  assert.ok(m && (m[1] || m[2]), `not a plain decimal: ${text}`);
  return { n: BigInt(`${m[1] || '0'}${m[2] || ''}`), p: (m[2] || '').length };
};
const pow10 = (k) => 10n ** BigInt(k);
const align = (a, b) => { const p = Math.max(a.p, b.p); return [a.n * pow10(p - a.p), b.n * pow10(p - b.p), p]; };
const mul = (a, b) => ({ n: a.n * b.n, p: a.p + b.p });
const add = (a, b) => { const [x, y, p] = align(a, b); return { n: x + y, p }; };
const sub = (a, b) => { const [x, y, p] = align(a, b); return { n: x - y, p }; };
const cmp = (a, b) => { const [x, y] = align(a, b); return x === y ? 0 : (x > y ? 1 : -1); };
const eq = (a, b) => cmp(a, b) === 0;
const places = (text) => (String(text).split('.')[1] || '').length;
const nums = (text) => (text.match(/\d+(?:\.\d+)?/g) || []);
const ans = (entry) => { assert.equal(typeof entry.answer, 'number', `${entry.id}: a typed answer is a JS number`); return dec(String(entry.answer)); };
const same = (entry, expected, label) => assert.ok(eq(ans(entry), expected), `${label || entry.id}: answer ${entry.answer} vs derived ${expected.n}e-${expected.p}`);
// Every "a OP b OP c = d" chain in a text must hold (left to right, exact). Catches a typo in any worked example or note.
let chains = 0;
const checkChains = (text, label) => {
  for (const m of text.matchAll(/(\d+(?:\.\d+)?(?: [+−×÷] \d+(?:\.\d+)?)+) = (\d+(?:\.\d+)?)/g)) {
    const parts = m[1].split(' ');
    let acc = dec(parts[0]);
    for (let i = 1; i < parts.length; i += 2) {
      const operand = dec(parts[i + 1]);
      if (parts[i] === '+') acc = add(acc, operand);
      else if (parts[i] === '−') acc = sub(acc, operand);
      else if (parts[i] === '×') acc = mul(acc, operand);
      else { assert.ok(eq(mul(dec(m[2]), operand), acc), `${label}: ${m[0]}`); acc = dec(m[2]); }
    }
    assert.ok(eq(acc, dec(m[2])), `${label}: ${m[0]}`);
    chains += 1;
  }
};

// ---------- schedule: Week 14 starts Monday Oct 12; weekends keep the week that just ended ----------
for (const track of ['guided', 'standard']) {
  assert.equal(DAILY_WORK[track].weeks['week-14'].assignedWeekOf, '2026-10-12');
  assert.equal(DAILY_WORK[track].weeks['week-13'].assignedWeekOf, '2026-10-05', 'Week 13 is untouched');
  assert.equal(currentWeek(DAILY_WORK, track, '2026-10-11').id, 'week-13', `${track}: Sunday Oct 11 still shows Week 13`);
  ['2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16', '2026-10-17', '2026-10-18'].forEach((day) => assert.equal(currentWeek(DAILY_WORK, track, day).id, 'week-14', `${track} ${day}`));
  assert.equal(currentWeek(DAILY_WORK, track, '2026-10-19'), null, 'nothing is authored after Week 14 yet');
}

// ---------- shape: the week the plan describes ----------
assert.equal(g.label, 'Week 14');
assert.equal(s.label, 'Week 14');
const SUBJECTS = [['math', 'word-problems', 'bible-reading'], ['math', 'codequest', 'bible-reading'], ['math', 'codequest', 'bible-reading'], ['math', 'word-problems', 'bible-reading'], ['math', 'word-problems', 'bible-reading']];
assert.deepEqual(DAYS.map((day) => g.days[day].sheets.map((sheet) => sheet.subject)), SUBJECTS, 'younger son: three sheets every weekday, Bible Reading third');
assert.deepEqual(DAYS.map((day) => s.days[day].sheets.map((sheet) => sheet.subject)), SUBJECTS, 'older son: same');
assert.deepEqual(DAYS.map((day) => g.days[day].sheets.map((sheet) => sheet.items.length)), [[7, 4, 3], [7, 3, 3], [8, 3, 1], [8, 6, 3], [8, 6, 1]], 'younger son: items per sheet');
assert.deepEqual(DAYS.map((day) => s.days[day].sheets.map((sheet) => sheet.items.length)), [[10, 5, 3], [10, 3, 3], [11, 3, 1], [10, 3, 3], [6, 4, 1]], 'older son: items per sheet');
DAYS.forEach((day) => {
  const mathItems = g.days[day].sheets[0].items.length;
  assert.ok(mathItems === 7 || mathItems === 8, `younger son ${day}: the Math sheet stays at 7 or 8 items (${mathItems})`);
});
[g, s].forEach((week) => DAYS.forEach((day) => week.days[day].sheets.forEach((sheet) => {
  if (sheet.subject === 'math' || sheet.subject === 'word-problems') {
    assert.ok(sheet.example && sheet.example.length > 20 && sheet.intro, `${week.id} ${day} ${sheet.id} opens with a how-to and a worked example`);
  }
  assert.equal(new Set(sheet.items.map((entry) => entry.id)).size, sheet.items.length, `${day} ${sheet.id}: item ids are unique`);
  sheet.items.forEach((entry) => assert.ok(entry.parentNote && entry.parentNote.length > 4, `${week.id} ${day} ${sheet.id}/${entry.id}: the grown-up gets a note`));
})));

// ---------- the memory verses ----------
assert.equal(g.weekItems[0].citation, 'Colossians 3:13 (NLT)');
assert.deepEqual(g.weekItems[0].items[0].answer, ['faults', 'forgave']);
assert.deepEqual(g.weekItems[0].items[0].wordBank, ['faults', 'forgave']);
assert.equal(g.weekItems[0].items[0].prompt.split('___').length - 1, 2, 'two blanks');
assert.equal(tight(plain(weekVerse(g).html)), "Make allowance for each other's faults, and forgive anyone who offends you. Remember, the Lord forgave you, so you must forgive others.");
assert.equal(s.weekItems[0].citation, 'Ephesians 4:31-32 (NLT)');
assert.deepEqual(s.weekItems[0].items[0].answer, ['bitterness', 'behavior', 'forgiving']);
assert.deepEqual(s.weekItems[0].items[0].wordBank, ['bitterness', 'behavior', 'forgiving']);
assert.equal(s.weekItems[0].items[0].prompt.split('___').length - 1, 3, 'three blanks');
assert.equal(tight(plain(weekVerse(s).html)), 'Get rid of all bitterness, rage, anger, harsh words, and slander, as well as all types of evil behavior. Instead, be kind to each other, tenderhearted, forgiving one another, just as God through Christ has forgiven you.');
[g, s].forEach((week) => assert.equal(week.weekItems.length, 1));

// ---------- Bible Reading: the updated doc, third sheet every weekday, same passage for both boys ----------
const REFS = ['Exodus 1:1-22', 'Exodus 2:1-25', 'Exodus 3:1-22', 'Exodus 4:1-23, then 4:27-31', 'Exodus 5:1-23'];
const CHOICE_DAYS = [0, 1, 3];
const KEY = { // [question prompt, [choice texts], answer letter]; the doc's answer key
  0: [
    ['Why did the new king of Egypt make the Israelites work as slaves?', ['He was afraid there were so many of them that they might join his enemies in a war', "They had broken the king's laws", 'They had refused to pay their taxes'], 'A'],
    ['What did the midwives do when the king told them to kill the Hebrew baby boys?', ['They did what the king said', 'They quit their jobs and left Egypt', 'They let the baby boys live because they feared God'], 'C'],
    ['At the end of the chapter, what did the king order his people to do to the Hebrew baby boys?', ['Send them away to another country', 'Throw them into the Nile River', 'Put them to work in the palace'], 'B'],
  ],
  1: [
    ["How did Moses' mother keep her baby safe?", ['She sent him away with a family of traders', 'She put him in a basket among the reeds on the Nile, and his sister watched over him', "She hid him in the king's palace"], 'B'],
    ['Why did Moses run away from Egypt when he grew up?', ['He was tired of living in the palace', 'The Israelites asked him to leave', 'He killed an Egyptian who was beating a Hebrew, and Pharaoh found out'], 'C'],
    ['At the end of the chapter, the Israelites cried out because of their slavery. What did God do?', ['He heard them, and He cared about them', 'He sent a flood to wash away the Egyptians', 'He waited for them to stop crying'], 'A'],
  ],
  3: [
    ['Moses was afraid the people would not believe that God sent him. What did God give Moses to show them?', ['A sword and a shield', 'A letter from Pharaoh', 'Signs: his staff turned into a snake, and his hand turned white'], 'C'],
    ['Moses said, "I am not a good speaker." How did God answer?', ['"Then you can stay home."', "He said He made the mouth and would help Moses speak, and He sent Moses' brother Aaron too", 'He changed His mind and picked someone else'], 'B'],
    ['At the end of the reading, Aaron showed the people the signs. What did the people do?', ['They believed, and they bowed down and worshiped God', 'They laughed at Moses', 'They ran away'], 'A'],
  ],
};
const CHOICE_NOTES = {
  0: ['Exodus 1:9-10. The king said the Israelites were too many, and that they might join his enemies if a war broke out.', 'Exodus 1:15-21. The midwives feared God and did not do what the king said, so the boys lived.', 'Exodus 1:22. Every Hebrew baby boy was to be thrown into the Nile.'],
  1: ["Exodus 2:2-4. She hid him for three months, then put him in a basket in the reeds on the Nile while his sister watched. Pharaoh's daughter found him and took him in.", 'Exodus 2:11-15. Moses killed the Egyptian, and when Pharaoh found out he ran away to Midian.', 'Exodus 2:23-25. God heard their groaning and was concerned about them.'],
  3: ['Exodus 4:1-9. God gave Moses signs, including the staff that became a snake and the hand that turned white.', 'Exodus 4:10-16. God said He would help Moses speak, and Aaron would speak for him.', 'Exodus 4:29-31. The people believed, and when they heard that God cared about them, they bowed down and worshiped.'],
};
const TYPED = { // Wednesday and Friday: [prompt without the sentence count, parent note]
  2: ['What strange thing did Moses see on the mountain, and what did God promise him when Moses asked, "Who am I to do this?"', 'A good answer says Moses saw a bush on fire that did not burn up. When Moses asked who he was to do this, God promised, "I will be with you" (Exodus 3:12). It may also say God was sending Moses to Pharaoh to bring the Israelites out of Egypt.'],
  4: ['What happened when Moses asked Pharaoh to let the people go, and how did the Israelites feel about Moses afterward?', 'A good answer says Pharaoh said no and made the work harder (no straw, but the same number of bricks), and the Israelite foremen blamed Moses and Aaron. There is no happy ending yet. That is on purpose, and it is the cliffhanger for next week.'],
};
[['guided', g, 'Write 1 or 2 sentences.'], ['standard', s, 'Write 2 sentences.']].forEach(([track, week, sentences]) => DAYS.forEach((day, d) => {
  const sheet = week.days[day].sheets[2];
  assert.equal(sheet.id, 'bible-reading');
  assert.equal(sheet.subject, 'bible-reading');
  assert.equal(sheet.title, `Bible Reading: ${REFS[d]}`);
  assert.equal(sheet.example, null, 'not a math sheet: no worked example');
  const html = render(week, day, sheet);
  assert.ok(html.includes('data-subject="bible-reading"'), `${track} ${day}`);
  if (CHOICE_DAYS.includes(d)) {
    assert.equal(sheet.intro, `Open your own Bible to ${REFS[d]} and read it out loud to a grown-up. Reading out loud makes you slow down and notice what is really happening. Then answer the three questions below by picking the best answer for each one. If you are not sure, go back to your Bible and look again.`);
    assert.deepEqual(sheet.items.map((entry) => entry.id), ['q1', 'q2', 'q3']);
    sheet.items.forEach((entry, i) => {
      const [prompt, choices, letter] = KEY[d][i];
      assert.equal(entry.kind, 'multiple-choice', `${track} ${day}/${entry.id}`);
      assert.equal(entry.prompt, prompt);
      assert.deepEqual(entry.choices, choices, `${day}/${entry.id}: the choice texts in the doc's order`);
      assert.equal(entry.choices.length, 3);
      entry.choices.forEach((text) => assert.equal(/^[A-C]\)/.test(text), false, 'the letter is implied by position, not typed in the text'));
      assert.equal(entry.answer, letter, `${day}/${entry.id}: the doc's answer`);
      assert.ok(/^[A-E]$/.test(entry.answer) && entry.answer.charCodeAt(0) - 65 < entry.choices.length, 'the answer is a letter that points at a choice');
      assert.equal(entry.parentNote, CHOICE_NOTES[d][i]);
      assert.equal(gradeSuggestion(entry, letter), true, `${day}/${entry.id}: the right pick is suggested correct`);
      entry.choices.forEach((_, k) => { const pick = String.fromCharCode(65 + k); if (pick !== letter) assert.equal(gradeSuggestion(entry, pick), false, `${day}/${entry.id}: ${pick} is suggested wrong`); });
      assert.equal(gradeSuggestion(entry, null), false);
    });
    // the kid's markup never depends on the answer or the note: swap both, the page is byte-identical
    const swapped = { ...sheet, items: sheet.items.map((entry) => ({ ...entry, answer: entry.answer === 'A' ? 'B' : 'A', parentNote: 'a different note' })) };
    assert.equal(render(week, day, swapped), html, `${track} ${day}: the kid's page does not depend on the answer or the note`);
  } else {
    assert.equal(sheet.intro, `Open your own Bible to ${REFS[d]} and read it out loud to a grown-up. Reading out loud makes you slow down and notice what is really happening. Then answer the question below in your own words. Using your own words shows that you understood it, so you do not need to copy the verses.`);
    assert.equal(sheet.items.length, 1);
    const entry = sheet.items[0];
    assert.equal(entry.kind, 'long-text', `${track} ${day}: a real writing box`);
    assert.equal(entry.prompt, `${TYPED[d][0]} ${sentences}`);
    assert.equal(entry.answer, null, 'parent-judged, never auto-marked');
    assert.equal(entry.parentNote, TYPED[d][1]);
    assert.equal(gradeSuggestion(entry, 'anything'), null, 'no suggestion for a written answer');
    assert.ok(html.includes('<textarea'), `${track} ${day}: a writing box on screen`);
  }
}));
// the passages are the same for both boys, and the multiple-choice questions are identical
CHOICE_DAYS.forEach((d) => assert.deepEqual(g.days[DAYS[d]].sheets[2], s.days[DAYS[d]].sheets[2], `${DAYS[d]}: both boys get the same three questions`));
assert.equal(allItems(g).filter(({ entry }) => entry.kind === 'multiple-choice').length, 9);
assert.equal(allItems(s).filter(({ entry }) => entry.kind === 'multiple-choice').length, 9);

// ---------- CodeQuest sheet: the plan's wording, same for both boys ----------
[g, s].forEach((week) => ['tuesday', 'wednesday'].forEach((day) => {
  const sheet = sheetOf(week, day, 1);
  assert.equal(sheet.title, 'CodeQuest Day');
  assert.equal(sheet.intro, 'Play CodeQuest for 15 to 20 minutes and try to reach a new level. Then answer the three questions below. This is your chance to tell what you noticed, so there is no right or wrong answer.');
  assert.deepEqual(sheet.items.map((entry) => [entry.id, entry.kind]), [['level', 'short-text'], ['learned', 'long-text'], ['tricky', 'scale']]);
  assert.equal(sheet.items[0].prompt, 'Which level did you reach today? Type it, like Level 3.');
  assert.equal(sheet.items[1].prompt, 'Write 1 or 2 sentences about something you built, solved or learned.');
  assert.equal(sheet.items[2].prompt, "How tricky was today's level? (1 = not tricky, 5 = very tricky)");
  assert.equal(sheet.items[2].scaleMax, 5);
  assert.deepEqual(sheet.items.map((entry) => entry.parentNote), ['The app does not record the level, so any text is fine.', 'Any honest answer is fine.', 'Any number from 1 to 5 is fine.']);
  assert.equal(sheet.example, null, 'not a math sheet');
}));

// ======================================== OLDER SON: multiply decimals ========================================
const MATH_WP = [];
DAYS.forEach((day) => s.days[day].sheets.forEach((sheet) => { if (sheet.subject === 'math' || sheet.subject === 'word-problems') MATH_WP.push({ day, sheet }); }));
const isBlocks = (entry) => entry.part !== undefined;
let derived = 0;
let tenthsLines = 0;
let productLines = 0;
let storyLines = 0;
MATH_WP.forEach(({ day, sheet }) => sheet.items.forEach((entry, index) => {
  const prev = sheet.items[index - 1];
  if (entry.kind === 'fill-blank') return; // bigger / smaller lines are checked below
  assert.equal(entry.kind, 'numeric', `${day}/${entry.id}`);
  if (isBlocks(entry)) return; // percent blocks are checked below
  let m;
  let expected;
  if ((m = /^How many tenths is ([\d.]+)\?$/.exec(entry.prompt))) {
    assert.equal(places(m[1]), 1, `${entry.id}: a tenth has one decimal place`);
    expected = mul(dec(m[1]), dec('10'));
    tenthsLines += 1;
  } else if ((m = /^(?:Multiply the tenths: |Ignore the decimal points?: )?(\d+) × (\d+) = \?$/.exec(entry.prompt)) || (m = /^([\d.]+) × ([\d.]+) = \?$/.exec(entry.prompt))) {
    expected = mul(dec(m[1]), dec(m[2]));
    productLines += 1;
  } else if ((m = /^How many decimal places does ([\d.]+) have\?$/.exec(entry.prompt))) {
    expected = dec(String(places(m[1])));
  } else if ((m = /^How many decimal places in all\? \(([\d.]+) has (\d+), ([\d.]+) has (\d+)\)$/.exec(entry.prompt))) {
    assert.equal(places(m[1]), Number(m[2]), `${entry.id}: the stated places are right`);
    assert.equal(places(m[3]), Number(m[4]), `${entry.id}: the stated places are right`);
    expected = dec(String(places(m[1]) + places(m[3])));
  } else if ((m = /^Estimate: round ([\d.]+) to (\d+)\. (\d+) × (\d+) = \?$/.exec(entry.prompt))) {
    assert.equal(Math.round(Number(m[1])), Number(m[2]), `${entry.id}: the rounding is the real rounding`);
    assert.equal(m[2], m[4], `${entry.id}: multiplies the rounded number`);
    expected = mul(dec(m[3]), dec(m[4]));
    // the note promises "close to the real answer, which is X": X is the exact product, and is within a unit or two
    const real = /which is ([\d.]+)\.$/.exec(entry.parentNote);
    assert.ok(real && eq(dec(real[1]), mul(dec(m[3]), dec(m[1]))), `${entry.id}: the note names the exact product`);
    assert.ok(Math.abs(Number(real[1]) - Number(entry.answer)) <= 2, `${entry.id}: the estimate really is close`);
  } else if (sheet.subject === 'word-problems') {
    storyLines += 1;
    const found = nums(entry.prompt);
    if (found.length === 0) { // "How much do you earn, in dollars?": the tenths of a dollar on the line before, as dollars
      assert.ok(prev, `${entry.id}`);
      expected = { n: ans(prev).n, p: ans(prev).p + 1 };
    } else if (/^Find 15% of \$42/.test(entry.prompt)) {
      assert.deepEqual(found, ['15', '42', '15', '0.15'], 'the story says 15% is 0.15');
      expected = mul(dec('0.15'), dec('42'));
    } else if (/^You clean the litter box/.test(entry.prompt)) {
      assert.deepEqual(found, ['0.50', '5', '0.50'], `${entry.id}`);
      assert.equal(places(found[0]), 2);
      expected = mul(dec(found[0]), dec('10')); // $0.50 is this many tenths of a dollar
    } else {
      assert.equal(found.length, 2, `${day}/${entry.id}: a story with a price or size and a number of groups: ${found}`);
      expected = mul(dec(found[0]), dec(found[1]));
    }
  } else {
    assert.fail(`${day}/${entry.id}: no independent derivation for "${entry.prompt}"`);
  }
  same(entry, expected, `${day}/${entry.id}`);
  derived += 1;
}));
assert.ok(derived >= 50, `derived ${derived} older-son numeric answers`);
assert.equal(tenthsLines, 2);

// the stepped chains: the tenths / the whole-number product / the decimal answer all agree
const S = (day, id, i = 0) => itemOf(s, day, i, id);
const factors = (entry) => /(\d[\d.]*) × (\d[\d.]*)/.exec(entry.prompt).slice(1);
// Monday: 1a "how many tenths is X", 1b "A × tenths", 1c "A × X"; 3a "A × tenths", 3b "A × X"
[['1a', '1b', '1c'], ['2a', '2b', '2c']].forEach(([a, b, c]) => {
  const tenths = ans(S('monday', a)); // the count of tenths
  const [bf1, bf2] = factors(S('monday', b));
  const [cf1, cf2] = factors(S('monday', c));
  assert.equal(bf1, cf1, `${c}: same whole number as ${b}`);
  assert.ok(eq(dec(bf2), tenths), `${b} multiplies by the tenths from ${a}`);
  assert.ok(eq(mul(dec(cf2), dec('10')), tenths), `${c}: ${cf2} is ${bf2} tenths`);
  assert.ok(eq(ans(S('monday', c)), { n: ans(S('monday', b)).n, p: 1 }), `${c} is ${b} tenths turned back into a decimal`);
  assert.ok(S('monday', c).prompt.includes(`${cf1} × ${cf2}`));
});
{
  const [af1, af2] = factors(S('monday', '3a'));
  const [bf1, bf2] = factors(S('monday', '3b'));
  assert.equal(af1, bf1);
  assert.ok(eq(mul(dec(bf2), dec('10')), dec(af2)), '3a multiplies the tenths of 1.6');
  assert.ok(eq(ans(S('monday', '3b')), { n: ans(S('monday', '3a')).n, p: 1 }));
}
// the Monday story: 1a tenths of a dollar, 1b, 1c in dollars
assert.ok(eq(ans(itemOf(s, 'monday', 1, '1b')), mul(dec('5'), ans(itemOf(s, 'monday', 1, '1a')))), 'story: 5 times 5 tenths');
// Tuesday: ignore the point, count the places, put the point back
[['1a', '1b', '1c'], ['2a', '2b', '2c']].forEach(([a, b, c]) => {
  const [af1, af2] = factors(S('tuesday', a));
  const [cf1, cf2] = factors(S('tuesday', c));
  const asked = /decimal places does ([\d.]+) have/.exec(S('tuesday', b).prompt)[1];
  assert.equal(asked, cf2, `${b} asks about the number in ${c}`);
  assert.equal(af1, cf1);
  assert.equal(af2, cf2.replace('.', ''), `${a} ignores the decimal point of ${cf2}`);
  assert.ok(eq(ans(S('tuesday', c)), { n: ans(S('tuesday', a)).n, p: places(cf2) }), `${c}: ${a} with ${places(cf2)} decimal places`);
  assert.equal(ans(S('tuesday', b)).n, BigInt(places(cf2)));
});
{
  const [af1, af2] = factors(S('tuesday', '3a'));
  const [bf1, bf2] = factors(S('tuesday', '3b'));
  assert.equal(af1, bf1);
  assert.equal(af2, bf2.replace('.', ''));
  assert.ok(eq(ans(S('tuesday', '3b')), { n: ans(S('tuesday', '3a')).n, p: places(bf2) }));
}
// Wednesday: bigger/smaller line, ignore the points, places in all, then the answer
const wed = (id) => S('wednesday', id);
{
  const [ia1, ia2] = factors(wed('1b'));
  const [d1, d2] = factors(wed('1d'));
  assert.equal(BigInt(ia1), dec(d1).n);
  assert.equal(BigInt(ia2), dec(d2).n);
  const total = places(d1) + places(d2);
  assert.equal(wed('1c').prompt, `How many decimal places in all? (${d1} has ${places(d1)}, ${d2} has ${places(d2)})`);
  assert.equal(Number(wed('1c').answer), total);
  assert.ok(eq(ans(wed('1d')), { n: ans(wed('1b')).n, p: total }), '1d: the whole-number product with the total places');
  const [e1, e2] = factors(wed('2b'));
  const [f1, f2] = factors(wed('2c'));
  assert.equal(BigInt(e1), dec(f1).n);
  assert.equal(BigInt(e2), dec(f2).n);
  assert.ok(eq(ans(wed('2c')), { n: ans(wed('2b')).n, p: places(f1) + places(f2) }));
}
// Thursday: estimate then exact; the percent-blocks pairs
const thu = (id) => S('thursday', id);
[['1a', '1b'], ['2a', '2b']].forEach(([a, b]) => {
  const [x, y] = factors(thu(b)); // whole number and decimal
  const rounded = /round ([\d.]+) to (\d+)/.exec(thu(a).prompt);
  assert.equal(rounded[1], y, `${a} rounds the number in ${b}`);
  assert.ok(Math.abs(Number(thu(a).answer) - Number(thu(b).answer)) < 3, `${a} is close to ${b}`);
  assert.equal(factors(thu(a))[0], x);
});

// bigger / smaller: decided by comparing the exact product with the number named in the question
let comparisons = 0;
MATH_WP.forEach(({ day, sheet }) => sheet.items.forEach((entry, index) => {
  if (entry.kind !== 'fill-blank') return;
  comparisons += 1;
  const m = /^Is ([\d.]+) × ([\d.]+) bigger or smaller than ([\d.]+)\?$/.exec(entry.prompt);
  assert.ok(m, `${day}/${entry.id}: "${entry.prompt}"`);
  assert.deepEqual(entry.wordBank, ['bigger', 'smaller'], `${entry.id}: the word bank is exactly bigger, smaller`);
  const product = mul(dec(m[1]), dec(m[2]));
  assert.notEqual(cmp(product, dec(m[3])), 0);
  assert.deepEqual(entry.answer, [cmp(product, dec(m[3])) > 0 ? 'bigger' : 'smaller'], `${day}/${entry.id}: ${m[1]} × ${m[2]} vs ${m[3]}`);
  assert.ok(m[3] === m[1] || m[3] === m[2], `${entry.id}: compares with one of the factors`);
  // and the multiplier that is not the compared number really is more / less than 1
  const other = m[3] === m[1] ? m[2] : m[1];
  assert.equal(cmp(dec(other), dec('1')) > 0, entry.answer[0] === 'bigger', `${entry.id}: multiplying by ${other}`);
  // the answer line on the same problem agrees with it
  const next = sheet.items.slice(index + 1).find((later) => later.kind === 'numeric' && later.prompt.startsWith(`${m[1]} × ${m[2]} = ?`));
  assert.ok(next, `${entry.id}: the problem itself follows`);
  assert.equal(cmp(ans(next), dec(m[3])) > 0, entry.answer[0] === 'bigger', `${entry.id}: the exact answer ${next.answer} agrees`);
  assert.equal(gradeSuggestion(entry, entry.answer), true);
  assert.equal(gradeSuggestion(entry, [entry.answer[0] === 'bigger' ? 'smaller' : 'bigger']), false);
}));
assert.deepEqual(MATH_WP.flatMap(({ day, sheet }) => sheet.items.filter((entry) => entry.kind === 'fill-blank').map((entry) => `${day}/${entry.id}`)), ['wednesday/1a', 'wednesday/2a', 'wednesday/3a', 'wednesday/4a', 'thursday/3a'], 'the bigger-or-smaller lines are the plan\'s');
assert.equal(comparisons, 5);

// percent blocks: Thursday '1 block = X%' (unit), Friday a few clue labels; 16 and 40 blocks
const BLOCKS = { thursday: { '4b': [3, 16, 'unit'], '5b': [11, 40, 'unit'] }, friday: { 5: [10, 16, 'clues'], 6: [33, 40, 'clues'] } };
let blockItems = 0;
MATH_WP.forEach(({ day, sheet }) => sheet.items.filter(isBlocks).forEach((entry) => {
  blockItems += 1;
  const [part, whole, help] = BLOCKS[day][entry.id];
  const m = /^(\d+) out of (\d+) is what percent\?$/.exec(entry.prompt);
  assert.ok(m && Number(m[1]) === entry.part && Number(m[2]) === entry.whole, `${entry.id}: the prompt says the same numbers`);
  assert.equal(entry.part, part);
  assert.equal(entry.whole, whole);
  assert.ok(eq(mul(ans(entry), dec(String(entry.whole))), mul(dec(String(entry.part)), dec('100'))), `${day}/${entry.id}: answer x whole = part x 100, exactly`);
  assert.equal(entry.answer, (entry.part * 100) / entry.whole);
  assert.equal(entry.unit, 'percent');
  assert.equal(entry.perItem, true, `${entry.id}: one block per item`);
  assert.equal(entry.help, help, `${day}/${entry.id}: help level`);
  assert.deepEqual(blockPlan(entry.part, entry.whole, true), { count: entry.whole, size: 1 }, `${entry.id}: ${entry.whole} blocks`);
  const view = blockView(entry, 0, false);
  assert.ok(view, `${day}/${entry.id}: yields a block plan`);
  assert.equal(view.count, entry.whole);
  const unitText = { 16: '6.25', 40: '2.5' }[entry.whole];
  assert.equal(view.unit, 100 / entry.whole);
  assert.equal(view.help, help);
  if (help === 'unit') {
    assert.equal(view.caption, `1 block = ${unitText}%`, `${entry.id}: "1 block = X%" shown`);
    assert.ok(view.labels.every((label) => label === null), `${entry.id}: no running percents`);
  } else {
    const labelled = view.labels.map((label, i) => (label === null ? null : i + 1)).filter((x) => x !== null);
    assert.ok(labelled.length >= 1 && labelled.length <= 2, `${entry.id}: a few clue labels`);
    assert.ok(!labelled.includes(entry.part) && !labelled.includes(entry.whole), `${entry.id}: never the answer's block or the last one`);
    labelled.forEach((block) => assert.notEqual(view.labels[block - 1], `${entry.answer}%`, `${entry.id}: no label is the answer`));
  }
  // the stepped line right before a Thursday block item multiplies part by the one-block value without its point
  if (day === 'thursday') {
    const before = sheet.items[sheet.items.indexOf(entry) - 1];
    const [f1, f2] = factors(before);
    assert.equal(f1, String(entry.part));
    assert.equal(f2, unitText.replace('.', ''), `${before.id}: the one-block value without its decimal point`);
    assert.ok(eq(ans(entry), { n: ans(before).n, p: places(unitText) }), `${entry.id}: ${before.id} with ${places(unitText)} decimal places`);
    assert.ok(before.parentNote.includes(`One block is ${unitText}%`));
  }
}));
assert.equal(blockItems, 4);
{
  const thursdayHtml = render(s, 'thursday', sheetOf(s, 'thursday', 0));
  assert.ok(thursdayHtml.includes('1 block = 6.25%') && thursdayHtml.includes('1 block = 2.5%'), 'Thursday shows the one-block value on both bars');
  const fridayHtml = render(s, 'friday', sheetOf(s, 'friday', 0));
  assert.ok(/cqd-block/.test(fridayHtml), 'Friday still draws the bars');
}

// Friday: no steps written out, only the problem
DAYS.slice(4).forEach((day) => sheetOf(s, day, 0).items.filter((entry) => !isBlocks(entry)).forEach((entry) => assert.ok(/^[\d.]+ × [\d.]+ = \?$/.test(entry.prompt), `${entry.id}: just the problem`)));
// help fades: Wed has a bigger/smaller line on every problem, Mon/Tue have stepped lines first
assert.deepEqual(['1a', '2a', '3a', '4a'].map((id) => wed(id).kind), ['fill-blank', 'fill-blank', 'fill-blank', 'fill-blank'], 'every Wednesday problem opens with a bigger-or-smaller line');
assert.equal(sheetOf(s, 'monday', 0).items.filter((entry) => /^\d[ab]$/.test(entry.id) || entry.id === '1c' || entry.id === '2c').length, 8, 'Monday: two fully stepped, one with fewer steps');

// word problems in the plan, with the answer a parent accepts either way
assert.equal(itemOf(s, 'friday', 1, '3').answer, 6.3);
['2.5', '2.50', '2.500'].forEach((typed) => assert.equal(gradeSuggestion(itemOf(s, 'monday', 1, '1c'), typed), true, `${typed} matches 2.5`));
['30', '30.0', '30.00'].forEach((typed) => assert.equal(gradeSuggestion(itemOf(s, 'tuesday', 0, '4'), typed), true, `${typed} matches 30`));
assert.equal(gradeSuggestion(itemOf(s, 'monday', 0, '1c'), '2.80'), true);
assert.equal(gradeSuggestion(itemOf(s, 'monday', 0, '1c'), '2.7'), false);
assert.equal(gradeSuggestion(itemOf(s, 'friday', 0, '5'), '62.5'), true);
assert.equal(gradeSuggestion(itemOf(s, 'friday', 0, '5'), '65'), false);

// ======================================== YOUNGER SON ========================================
const VALUE = { penny: 1, nickel: 5, dime: 10, quarter: 25 };
const SINGULAR = { pennies: 'penny', penny: 'penny', nickels: 'nickel', nickel: 'nickel', dimes: 'dime', dime: 'dime', quarters: 'quarter', quarter: 'quarter' };
const coinCents = (text) => {
  let total = 0;
  let found = 0;
  for (const m of text.matchAll(/(\d+) (quarters|quarter|dimes|dime|nickels|nickel|pennies|penny)\b/g)) { total += Number(m[1]) * VALUE[SINGULAR[m[2]]]; found += 1; }
  return found ? total : null;
};
const OPERATIONS = ['add', 'subtract', 'multiply', 'divide'];
const operationFor = (prompt) => {
  if (/shared equally|share [^.]*equally/.test(prompt)) return 'divide';
  if (/in each|on each|with \d+ [a-z]+ in/.test(prompt)) return 'multiply';
  if (/\b(spends?|gave away|gives? away|left)\b/.test(prompt)) return 'subtract';
  if (/\b(more|in all)\b/.test(prompt)) return 'add';
  return null;
};
const apply = (op, a, b) => ({ add: a + b, subtract: Math.max(a, b) - Math.min(a, b), multiply: a * b, divide: Math.max(a, b) / Math.min(a, b) })[op];
const BANKS = { // the plan's word banks, by sheet
  'wednesday/0': ['add', 'subtract'], 'thursday/0': ['add', 'multiply'], 'thursday/1': ['add', 'subtract', 'multiply'],
  'friday/0': ['divide', 'subtract', 'multiply', 'add'], 'friday/1': ['subtract', 'divide', 'multiply'],
};
let percentLines = 0;
let factsCount = 0;
let operationLines = 0;
let solveLines = 0;
DAYS.forEach((day) => g.days[day].sheets.forEach((sheet, sheetIndex) => {
  if (sheet.subject !== 'math' && sheet.subject !== 'word-problems') return;
  sheet.items.forEach((entry, index) => {
    const label = `${day}/${sheetIndex}/${entry.id}`;
    let m;
    if (entry.kind === 'numeric') {
      assert.equal(typeof entry.answer, 'number');
      assert.ok(!entry.part && !entry.unit, `${label}: plain typing`);
      if ((m = /^(\d+) × (\d+) = \?$/.exec(entry.prompt))) {
        factsCount += 1;
        assert.equal(entry.answer, Number(m[1]) * Number(m[2]), label);
        // the note counts the groups: a repeated addition of one factor, as many times as the other
        const terms = /^((?:\d+ \+ )+\d+) = (\d+)/.exec(entry.parentNote);
        if (terms) {
          const parts = terms[1].split(' + ').map(Number);
          const [a, b] = [Number(m[1]), Number(m[2])];
          assert.ok((parts.every((x) => x === b) && parts.length === a) || (parts.every((x) => x === a) && parts.length === b), `${label}: the note adds the groups`);
        } else assert.ok(entry.parentNote.startsWith(`${m[1]} × ${m[2]} = ${entry.answer}`), label);
      } else if (/^What percent of a dollar is /.test(entry.prompt) || /out of \$1\.00\. What percent is that\?/.test(entry.prompt) || /What percent of a dollar does /.test(entry.prompt)) {
        percentLines += 1;
        assert.ok(entry.prompt.endsWith(' Type the number, like 10.'), `${label}: asks for the number only`);
        let cents = coinCents(entry.prompt);
        if (cents === null && (m = /has (\d+) cents/.exec(entry.prompt))) cents = Number(m[1]);
        if (cents === null && (m = /\$0\.(\d\d) out of \$1\.00/.exec(entry.prompt))) cents = Number(m[1]);
        assert.notEqual(cents, null, `${label}: cents found in "${entry.prompt}"`);
        assert.ok(cents > 0 && cents < 100);
        assert.equal(entry.answer, cents, `${label}: the cents are the percent of a dollar`);
        assert.ok(entry.parentNote.includes(`${cents}%`) || entry.parentNote.includes(`${cents} cents`) || entry.parentNote.includes(`= ${cents}`), `${label}: the note shows the cents`);
      } else if (/What percent is left for Spend\?/.test(entry.prompt)) {
        percentLines += 1;
        const [give, save] = /Give is (\d+) percent and Save is (\d+) percent/.exec(entry.prompt).slice(1).map(Number);
        assert.equal(entry.answer, 100 - give - save, label);
      } else if (/^Solve it\./.test(entry.prompt)) {
        solveLines += 1;
        const before = sheet.items[index - 1];
        assert.equal(before.kind, 'fill-blank', `${label}: follows the operation line`);
        const op = before.answer[0];
        const [a, b] = nums(before.prompt).map(Number);
        assert.equal(entry.answer, apply(op, a, b), `${label}: ${op} ${a}, ${b}`);
        // the note shows the working
        if (op === 'add') assert.equal(entry.parentNote, `${a} + ${b} = ${entry.answer}.`);
        if (op === 'subtract') assert.equal(entry.parentNote, `${Math.max(a, b)} − ${Math.min(a, b)} = ${entry.answer}.`);
        if (op === 'multiply') assert.equal(entry.parentNote, `${a} × ${b} = ${entry.answer}.`);
        if (op === 'divide') { const [total, groups] = [Math.max(a, b), Math.min(a, b)]; assert.equal(entry.parentNote, `${groups} × ${entry.answer} = ${total}, so ${total} ÷ ${groups} = ${entry.answer}.`); }
        checkChains(entry.parentNote, label);
      } else assert.fail(`${label}: no independent derivation for "${entry.prompt}"`);
      return;
    }
    assert.equal(entry.kind, 'fill-blank', label);
    if (/^Ben says/.test(entry.prompt)) {
      const [cents, percent] = nums(entry.prompt).map(Number);
      assert.deepEqual(entry.wordBank, ['yes', 'no']);
      assert.deepEqual(entry.answer, [cents === percent ? 'yes' : 'no'], 'cents are the percent of a dollar');
      return;
    }
    operationLines += 1;
    const bank = BANKS[`${day}/${sheetIndex}`];
    assert.deepEqual(entry.wordBank, bank, `${label}: the word bank holds exactly the plan's words`);
    const op = operationFor(entry.prompt);
    assert.ok(OPERATIONS.includes(op), `${label}: a clue word decides it: "${entry.prompt}"`);
    assert.deepEqual(entry.answer, [op], `${label}: clue words say ${op}`);
    assert.ok(entry.wordBank.includes(op), `${label}: the answer is in the word bank`);
    assert.ok(/^Which operation|Which operation do you use\?$/.test(entry.prompt) || /Which operation/.test(entry.prompt));
    assert.equal(gradeSuggestion(entry, [op]), true);
    assert.equal(gradeSuggestion(entry, [bank.find((w) => w !== op)]), false);
  });
}));
assert.equal(percentLines, 16, 'every percent-of-a-dollar line');
assert.equal(factsCount, 2 + 2 + 3 + 2 + 2, 'two Monday, two Tuesday, three Wednesday, two Thursday, two Friday facts');
assert.equal(operationLines, 2 + 3 + 3 + 4 + 3, 'Wed 2, Thu math 3, Thu stories 3, Fri math 4, Fri stories 3');
assert.equal(solveLines, 11, 'Wed 2, Thu math 2, Thu stories 3, Fri math 1, Fri stories 3');
// the facts are the ones the plan names, every one marked as a repeat in the note where the plan marked it
const FACT_IDS = { wednesday: ['4 × 7', '5 × 7', '6 × 6'], thursday: ['4 × 9', '5 × 9'], friday: ['6 × 8', '5 × 7'] };
Object.entries(FACT_IDS).forEach(([day, list]) => {
  const prompts = sheetOf(g, day, 0).items.filter((entry) => /^\d+ × \d+ = \?$/.test(entry.prompt));
  assert.deepEqual(prompts.map((entry) => entry.prompt), list.map((x) => `${x} = ?`));
  prompts.forEach((entry) => assert.ok(entry.parentNote.includes('INTENTIONAL REPEAT (Week 13')));
});
// stepped operation + solve pairs sit together and in order
DAYS.forEach((day) => g.days[day].sheets.slice(0, 2).forEach((sheet) => sheet.items.forEach((entry, i) => {
  if (/^Solve it\./.test(entry.prompt)) assert.ok(/Which operation/.test(sheet.items[i - 1].prompt), `${day}/${entry.id}: the solve line follows its operation line`);
})));

// ---------- worked examples and notes: every arithmetic chain in the text holds ----------
const seenExamples = new Set();
[g, s].forEach((week) => allItems(week).forEach(({ sheet, entry }) => {
  if (!seenExamples.has(sheet.example) && sheet.example) { seenExamples.add(sheet.example); checkChains(sheet.example, `${week.id} ${sheet.id} example`); }
  checkChains(entry.parentNote || '', `${week.id} ${sheet.id}/${entry.id} note`);
  checkChains(sheet.intro || '', `${week.id} ${sheet.id} intro`);
}));
assert.ok(chains > 100, `${chains} arithmetic statements checked`);
// each worked decimal product ends on its true answer
[g, s].forEach((week) => allItems(week).forEach(({ sheet }) => { if (sheet.example) seenExamples.add(sheet.example); }));
let exampleProducts = 0;
MATH_WP.forEach(({ sheet }) => sheet.example.split('\n\n').forEach((paragraph) => {
  const m = /^([\d.]+) × ([\d.]+)\./.exec(paragraph);
  if (!m) return;
  exampleProducts += 1;
  const product = mul(dec(m[1]), dec(m[2]));
  const candidates = (paragraph.match(/\d+(?:\.\d+)?/g) || []).map(dec);
  assert.ok(candidates.some((c) => eq(c, product)), `example "${m[0]}" shows its product`);
  assert.ok(/fits|close to the estimate|It fits/.test(paragraph) || paragraph.includes('Smaller than'), `example "${m[0]}" checks itself`);
}));
assert.ok(exampleProducts >= 11, `${exampleProducts} worked decimal products`);
// percent-block examples
MATH_WP.forEach(({ sheet }) => sheet.example.split('\n\n').forEach((paragraph) => {
  const m = /^Percent blocks: (\d+) out of (\d+)\. One block is 100 ÷ \2 = ([\d.]+)%\..*Answer: ([\d.]+)%\.$/.exec(paragraph);
  if (!m) return;
  assert.ok(eq(mul(dec(m[3]), dec(m[2])), dec('100')), `one block is 100 ÷ ${m[2]}`);
  assert.ok(eq(mul(dec(m[1]), dec(m[3])), dec(m[4])), `${m[1]} out of ${m[2]} = ${m[4]}%`);
}));
// no practice problem repeats a worked-example problem from the same or an earlier day (the plan's overlap check)
const exampleHeads = [];
const practice = [];
[['older', s, true], ['younger', g, false]].forEach(([who, week, decimals]) => DAYS.forEach((day, d) => week.days[day].sheets.forEach((sheet) => {
  if (sheet.subject !== 'math' && sheet.subject !== 'word-problems') return;
  sheet.example.split('\n\n').forEach((paragraph) => {
    const m = /^(\d[\d.]* × \d[\d.]*)[ .]/.exec(paragraph) || /^Percent blocks: (\d+ out of \d+)/.exec(paragraph);
    if (m) exampleHeads.push({ who, d, head: m[1] });
  });
  sheet.items.forEach((entry) => practice.push({ who, d, prompt: entry.prompt }));
})));
exampleHeads.forEach(({ who, d, head }) => practice.filter((p) => p.who === who && p.d >= d).forEach((p) => {
  assert.equal(p.prompt.startsWith(`${head} = ?`) || p.prompt.startsWith(`${head} is what percent`) || p.prompt.includes(`: ${head} = ?`), false, `${who} day ${d}: "${p.prompt}" repeats the worked example "${head}"`);
}));
assert.ok(exampleHeads.length >= 20);

// ---------- plan wording and the app's rules ----------
// the new week's grown-up notes keep the plan's INTENTIONAL REPEAT marker; the kid never sees it
const BANNED = /\b(easy|guided|hard|standard|jesse|dad)\b/i;
[g, s].forEach((week) => {
  const strings = [];
  week.weekItems.forEach((sheet) => { strings.push(sheet.title, sheet.citation || ''); sheet.items.forEach((entry) => strings.push(entry.prompt, ...(entry.wordBank || []))); });
  DAYS.forEach((day) => week.days[day].sheets.forEach((sheet) => {
    strings.push(sheet.title, sheet.intro || '', sheet.example || '');
    sheet.items.forEach((entry) => strings.push(entry.prompt, ...(entry.wordBank || []), ...(entry.choices || [])));
  }));
  strings.forEach((text) => {
    assert.equal(BANNED.test(text), false, `kid-facing text must not say ${BANNED.exec(text)}: ${text.slice(0, 60)}`);
    assert.equal(/INTENTIONAL REPEAT/.test(text), false, 'the plan\'s authoring marker never reaches the kid');
  });
});
// nothing a kid sees carries an answer or a note
const kidPages = [];
DAYS.forEach((day) => {
  g.days[day].sheets.forEach((sheet) => kidPages.push(render(g, day, sheet)));
  s.days[day].sheets.forEach((sheet) => kidPages.push(render(s, day, sheet)));
});
kidPages.forEach((html) => ['For you:', 'parentNote', 'A good answer', 'INTENTIONAL REPEAT', 'Accept 2.5', 'Correct choice'].forEach((leak) => assert.equal(html.includes(leak), false, `a kid sheet must not contain "${leak}"`)));
// a typed-number page never prints its own answer's parent working
[g, s].forEach((week) => DAYS.forEach((day) => week.days[day].sheets.forEach((sheet) => {
  const html = render(week, day, sheet);
  sheet.items.filter((entry) => entry.parentNote && entry.parentNote.length > 25).forEach((entry) => assert.equal(html.includes(entry.parentNote), false, `${day}/${entry.id}: the note is not on the kid's page`));
})));

console.log('ok - week 14: schedule, Bible Reading (3 multiple-choice days + 2 typed) for both boys, verses, CodeQuest, every decimal product / stepped chain / bigger-or-smaller / percent block / coin percent / operation choice and result re-derived, kid pages leak nothing');

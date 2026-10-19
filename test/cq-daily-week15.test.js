// Week 15 (Monday 2026-10-19): Bible Reading only, from "Week 15 plan" and
// "Week 15 Bible reading". Exodus repeats Week 14's app sheets verbatim.
import assert from 'node:assert/strict';
import { DAILY_WORK } from '../src/cq/daily-work/content.js';
import { currentWeek } from '../src/cq/daily-work/schedule.js';
import { renderSheetArticle, weekVerse } from '../src/daily/sheet-view.js';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const PASSAGES = [
  'Exodus 4:1-23, then 4:27-31', 'Exodus 5:1-23', 'Daniel 1:1-21',
  'Daniel 3:1-30', 'Daniel 6:1-23, then 6:25-28',
];
const CHOICE = {
  wednesday: [
    ["Daniel and his friends were taken from home to train in the king's palace in Babylon. What did Daniel decide not to do?", ['Learn the language of Babylon', "Eat the king's rich food and wine", 'Meet with the king'], 'B', "Daniel 1:8. Daniel decided not to eat the king's rich food and wine."],
    ['Daniel asked for a ten-day test. What happened?', ['They ate vegetables and water, and looked healthier than the others', "They ate the king's food, and looked healthier than the others", 'They ate vegetables and water, and got very sick'], 'A', "Daniel 1:12-15. After ten days on vegetables and water, they looked healthier than the young men who ate the king's food."],
    ['Near the end of the chapter, who gave Daniel and his three friends knowledge and understanding?', ['The chief official', "The king's teachers", 'God'], 'C', 'Daniel 1:17. God gave the four young men knowledge and understanding.'],
  ],
  thursday: [
    ['King Nebuchadnezzar set up a huge gold statue and gave an order. What was the order?', ['Bring a gift of gold to the king every day', 'Build a new palace for the king and his family', 'Bow down to the statue when the music plays'], 'C', 'Daniel 3:4-6. When the music played, everyone had to bow down to the gold statue, or be thrown into a blazing furnace.'],
    ['Shadrach, Meshach and Abednego would not bow down. What did they tell the king?', ['God can save us, but even if He does not, we will not bow', 'We are sorry, and we will bow down to the statue now', 'We did not hear the music, so we did not bow'], 'A', 'Daniel 3:16-18. They said God was able to save them, but even if He did not, they would not bow down.'],
    ['The king threw the three men into the furnace, then looked inside. What did he see?', ['The fire had gone out, and the men were asleep', 'Four men walking in the fire, not tied up and not hurt', 'The three men had escaped before the fire was lit'], 'B', 'Daniel 3:24-25. The king saw four men walking in the fire, not tied up and not hurt.'],
  ],
};
const CELEBRATION = {
  id: 'week-15-break',
  trigger: 'bible-reading',
  blocks: [
    { type: 'p', text: 'Congratulations, I am proud of you boys and your constant learning!' },
    { type: 'p', text: 'God loves to give good gifts to His children, and so do I. The Bible says:' },
    { type: 'quote', text: '"So if you sinful people know how to give good gifts to your children, how much more will your heavenly Father give good gifts to those who ask him." (Matthew 7:11)' },
    { type: 'p', text: 'So this week is a gift from me to you:' },
    { type: 'bullets', items: ['A whole week off from your work', '1½ hours of Fortnite this week'] },
    { type: 'p', text: 'Your Bible reading stays, because that is how we grow closer to our Father in heaven.' },
    { type: 'signoff', text: 'Love, Dad' },
  ],
  button: "I'm ready!",
};
const RENDER_STATE = { sheets: {}, submittedAt: null };
const render = (week, day, sheet) => renderSheetArticle(week, day, sheet, RENDER_STATE, false, () => 0, () => false);
const BANNED = /\b(?:easy|hard|guided|standard|Jesse|UNSURE)\b|INTENTIONAL REPEAT/i;

for (const track of ['guided', 'standard']) {
  const week = DAILY_WORK[track].weeks['week-15'];
  const last = DAILY_WORK[track].weeks['week-14'];
  const sentences = track === 'guided' ? 'Write 1 or 2 sentences.' : 'Write 2 sentences.';
  assert.equal(week.id, 'week-15');
  assert.equal(week.label, 'Week 15');
  assert.equal(week.assignedWeekOf, '2026-10-19');
  assert.deepEqual(week.weekItems, []);
  assert.equal(weekVerse(week), null);
  assert.equal(week.breakWeek, true);
  assert.deepEqual(week.celebration, CELEBRATION);
  assert.equal(currentWeek(DAILY_WORK, track, '2026-10-18').id, 'week-14');
  for (const date of ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25']) {
    assert.equal(currentWeek(DAILY_WORK, track, date).id, 'week-15', `${track}: ${date}`);
  }
  assert.equal(currentWeek(DAILY_WORK, track, '2026-10-26'), null);
  assert.deepEqual(week.days.monday.sheets[0], last.days.thursday.sheets[2], `${track}: Monday repeats Week 14 Thursday exactly`);
  assert.deepEqual(week.days.tuesday.sheets[0], last.days.friday.sheets[2], `${track}: Tuesday repeats Week 14 Friday exactly`);

  DAYS.forEach((day, dayIndex) => {
    const sheets = week.days[day].sheets;
    assert.equal(sheets.length, 1, `${track} ${day}: one sheet`);
    const sheet = sheets[0];
    assert.equal(sheet.id, 'bible-reading');
    assert.equal(sheet.subject, 'bible-reading');
    assert.equal(sheet.title, `Bible Reading: ${PASSAGES[dayIndex]}`);
    assert.equal(sheet.example, null);
    const choiceDay = ['monday', 'wednesday', 'thursday'].includes(day);
    assert.equal(sheet.intro, choiceDay
      ? `Open your own Bible to ${PASSAGES[dayIndex]} and read it out loud to a grown-up. Reading out loud makes you slow down and notice what is really happening. Then answer the three questions below by picking the best answer for each one. If you are not sure, go back to your Bible and look again.`
      : `Open your own Bible to ${PASSAGES[dayIndex]} and read it out loud to a grown-up. Reading out loud makes you slow down and notice what is really happening. Then answer the question below in your own words. Using your own words shows that you understood it, so you do not need to copy the verses.`);
    assert.equal(BANNED.test([sheet.title, sheet.intro, ...sheet.items.flatMap((item) => [item.prompt, ...(item.choices || [])])].join(' ')), false, `${track} ${day}: authoring terms stay off kid page`);
    const html = render(week, day, sheet);
    assert.ok(html.includes('data-subject="bible-reading"'));
    assert.equal(html.includes('parentNote'), false);
    assert.equal(/Correct choice|is-correct|is-incorrect|right answer|wrong answer/i.test(html), false, `${track} ${day}: no answer marking`);
    sheet.items.forEach((item) => {
      assert.ok(item.parentNote && item.parentNote.length > 4, `${track} ${day}/${item.id}: parent note`);
      assert.equal(html.includes(item.parentNote), false, `${track} ${day}/${item.id}: parent note hidden`);
    });
    const swapped = { ...sheet, items: sheet.items.map((item) => ({ ...item, answer: item.kind === 'multiple-choice' ? (item.answer === 'A' ? 'B' : 'A') : 'other answer', parentNote: 'changed private note' })) };
    assert.equal(render(week, day, swapped), html, `${track} ${day}: kid render ignores answers and notes`);
    if (choiceDay) {
      assert.deepEqual(sheet.items.map((item) => item.id), ['q1', 'q2', 'q3']);
      sheet.items.forEach((item) => {
        assert.equal(item.kind, 'multiple-choice');
        assert.equal(item.choices.length, 3);
        assert.ok(/^[A-C]$/.test(item.answer));
        assert.ok(item.answer.charCodeAt(0) - 65 < item.choices.length);
        item.choices.forEach((text) => assert.equal(/^[A-C]\)/.test(text), false, `${track} ${day}/${item.id}: choice text omits letter`));
        const rightIndex = item.answer.charCodeAt(0) - 65;
        const right = item.choices[rightIndex].length;
        const longestWrong = Math.max(...item.choices.filter((_, i) => i !== rightIndex).map((text) => text.length));
        assert.ok(right <= longestWrong * 1.2, `${track} ${day}/${item.id}: right choice (${right}) exceeds 120% of longest wrong choice (${longestWrong})`);
      });
    } else {
      assert.deepEqual(sheet.items.map((item) => item.id), ['reflect']);
      assert.equal(sheet.items[0].kind, 'long-text');
      assert.equal(sheet.items[0].answer, null);
      assert.ok(sheet.items[0].prompt.endsWith(sentences));
      assert.ok(html.includes('<textarea'));
    }
  });

  const friday = week.days.friday.sheets[0].items[0];
  assert.equal(friday.prompt, `Why was Daniel thrown into the lions' den, and how did God take care of him there? ${sentences}`);
  assert.equal(friday.parentNote, "A good answer says jealous officials tricked the king into making a law that no one could pray to anyone but the king. Daniel kept praying to God, so he was thrown to the lions, and God sent an angel to shut the lions' mouths, so Daniel was not hurt (Daniel 6:22).");
  ['wednesday', 'thursday'].forEach((day) => week.days[day].sheets[0].items.forEach((item, index) => {
    const [prompt, choices, answer, note] = CHOICE[day][index];
    assert.equal(item.prompt, prompt);
    assert.deepEqual(item.choices, choices);
    assert.equal(item.answer, answer);
    assert.equal(item.parentNote, note);
  }));
}
for (const day of ['monday', 'wednesday', 'thursday']) {
  assert.deepEqual(DAILY_WORK.guided.weeks['week-15'].days[day].sheets[0], DAILY_WORK.standard.weeks['week-15'].days[day].sheets[0], `${day}: both boys have identical choices`);
}
console.log('ok - week 15: schedule, break-week shape, exact Bible readings and celebration, reused Exodus sheets, choice lengths, kid render isolation');

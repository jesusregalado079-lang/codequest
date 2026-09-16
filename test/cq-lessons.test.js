import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LESSON_AWARDS } from '../src/cq/items.js';
import { LESSONS, getLesson, trackLessons } from '../src/cq/lessons/pack1.js';

const ids = ['g1', 'g2', 'g3', 'g4', 'g5', 's1', 's2', 's3', 's4', 's5'];
const windows = ['10', '11', 'both'];

assert.equal(LESSONS.length, 10);
assert.deepEqual(LESSONS.map((lesson) => lesson.id), ids);
LESSONS.forEach((lesson, index) => {
  assert.equal(lesson.track, index < 5 ? 'guided' : 'standard');
  assert.equal(lesson.number, (index % 5) + 1);
  assert.equal(getLesson(lesson.id), lesson);
  assert.equal(lesson.item, LESSON_AWARDS[lesson.id].item);
});
assert.equal(getLesson('missing'), null);
assert.deepEqual(trackLessons('guided').map((lesson) => lesson.id), ids.slice(0, 5));
assert.deepEqual(trackLessons('standard').map((lesson) => lesson.id), ids.slice(5));
assert.deepEqual(trackLessons('other'), []);

assert.ok(Object.isFrozen(LESSONS));
assert.ok(Object.isFrozen(LESSONS[0]));
assert.ok(Object.isFrozen(LESSONS[0].quiz));
assert.throws(() => { LESSONS[0].quiz[0].q = 'changed'; }, TypeError);
assert.throws(() => { LESSONS[0].learn[0].text = 'changed'; }, TypeError);

LESSONS.forEach((lesson) => {
  assert.equal(lesson.warmup.length, 3);
  assert.equal(lesson.chest.length, lesson.track === 'guided' ? 2 : 3);
  assert.equal(lesson.quiz.length, lesson.track === 'guided' ? 5 : lesson.id === 's5' ? 7 : 6);
  assert.equal(lesson.passScore, lesson.track === 'guided' ? 4 : lesson.id === 's5' ? 6 : 5);
  assert.ok(lesson.passScore < lesson.quiz.length + 1);

  lesson.warmup.concat(lesson.quiz, lesson.chest).forEach((item) => {
    assert.ok(item.q.length > 0);
    assert.ok(item.choices.length >= 2 && item.choices.length <= 3);
    item.choices.forEach((choice) => assert.ok(choice.length > 0));
    assert.ok(Number.isInteger(item.answer));
    assert.ok(item.answer >= 0 && item.answer < item.choices.length);
    assert.ok(!item.q.includes('✓'));
    assert.ok(!item.q.includes('*Why:*'));
    assert.ok(!item.q.startsWith('**') && !item.q.endsWith('**'), `Question text keeps no stray ** marker: ${item.q}`);
    item.choices.forEach((choice) => {
      assert.ok(!choice.includes('✓'));
      assert.ok(!choice.includes('*Why:*'));
      assert.ok(!choice.startsWith('**') && !choice.endsWith('**'));
    });
  });
  lesson.warmup.concat(lesson.chest).forEach((item) => assert.equal(item.why, null));
  lesson.quiz.forEach((item) => assert.ok(typeof item.why === 'string' && item.why.length > 0));

  lesson.mission.forEach((missionStep) => {
    assert.ok(missionStep.text.length > 0);
    (missionStep.options || []).forEach((item) => assert.ok(windows.includes(item.win)));
  });
});

['g1', 's1'].forEach((id) => {
  const steps = getLesson(id).mission.filter((missionStep) => missionStep.kind === 'windowsCheck');
  assert.equal(steps.length, 1);
});
LESSONS.filter((lesson) => lesson.id !== 'g1' && lesson.id !== 's1').forEach((lesson) => {
  assert.equal(lesson.mission.filter((missionStep) => missionStep.kind === 'windowsCheck').length, 0);
});

LESSONS.filter((lesson) => lesson.id !== 'g5' && lesson.id !== 's5').forEach((lesson) => {
  assert.equal(lesson.mission.filter((missionStep) => missionStep.kind === 'spotIt').length, 0, `${lesson.id} has no Spot It step`);
});
const g5Spot = getLesson('g5').mission.filter((missionStep) => missionStep.kind === 'spotIt');
const s5Spot = getLesson('s5').mission.filter((missionStep) => missionStep.kind === 'spotIt');
assert.equal(g5Spot.length, 1);
assert.equal(g5Spot[0].cards.length, 5);
assert.equal(g5Spot[0].pass, 4);
assert.equal(s5Spot.length, 1);
assert.equal(s5Spot[0].cards.length, 6);
assert.equal(s5Spot[0].pass, 5);
g5Spot.concat(s5Spot).forEach((missionStep) => missionStep.cards.forEach((item) => {
  assert.ok(item.text.length > 0);
  assert.ok(['ok', 'stop'].includes(item.answer));
}));
assert.equal(s5Spot[0].cards[0].text, 'A results page where the top 2 results say "Sponsored". Is it OK to pick the first result that isn\'t an ad?');

['g3', 'g4', 's2', 's3', 's4', 's5'].forEach((id) => {
  assert.ok(getLesson(id).mission.some((missionStep) => missionStep.text.includes('[your folder]')));
});

assert.equal(getLesson('g1').quiz[0].q, 'What is the long bar along the bottom of the screen called?');
assert.equal(getLesson('g5').quiz[2].why, 'Your address is private. A grown-up decides if a site is OK.');
assert.equal(getLesson('s3').learn[2].text, '**Copy + Paste = copy.** **Cut + Paste = move.**');
assert.equal(getLesson('s5').quiz[5].q, 'What\'s wrong with "micros0ft-help.com"?');
assert.equal(getLesson('g2').parentChecks[4], 'Closes Notepad and File Explorer with X, and leaves CodeQuest open');
assert.deepEqual(getLesson('s4').typingWords, ['ask', 'dad', 'sad', 'fall', 'flask', 'glad', 'half', 'hall', 'shall', 'lads']);
assert.equal(getLesson('g3').practice, 'In [your folder], make two folders: **Dinosaurs** and **Space**.');
assert.equal(getLesson('s5').after[1], 'use Alt+Tab, snap, Ctrl+C/X/V/Z/S/A');

const pack = readFileSync(new URL('../src/cq/lessons/pack1.js', import.meta.url), 'utf8');
assert.equal(/\.at\(|Object\.hasOwn|structuredClone|findLast|replaceAll|\?\?=|\|\|=|&&=/.test(pack), false);

console.log('cq lesson data tests passed');

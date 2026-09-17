import assert from 'node:assert/strict';
import { LESSONS, getLesson, trackLessons } from '../src/cq/lessons/pack1.js';

const expected = {
  'g1.4': { kind: 'practice', tap: 'Esc' },
  'g1.5': { kind: 'diagram', hold: [], tap: '⊞', result: 'The Start menu opens.', scene: 'start-open' },
  'g2.0': { kind: 'diagram', hold: ['⊞'], tap: 'E', result: 'File Explorer opens.', scene: 'file-explorer-open' },
  'g2.5': { kind: 'practice', tap: 'Enter' },
  'g3.0': { kind: 'diagram', hold: ['⊞'], tap: 'E', result: 'File Explorer opens.', scene: 'file-explorer-open' },
  'g3.5': { kind: 'practice', sequence: [{ tap: 'Backspace' }, { tap: 'Enter' }] },
  'g4.2': { kind: 'practice', tap: 'Enter' },
  'g4.3': { kind: 'diagram', hold: [], tap: 'F2', result: 'The folder name becomes a box you can edit.', scene: 'rename-box' },
  'g4.4': { kind: 'practice', tap: 'Enter' },
  'g5.1': { kind: 'practice', tap: 'I', shift: true, reps: 3 },
  'g5.2': { kind: 'practice', tap: 'Enter' },
  'g5.3': { kind: 'practice', tap: 'Backspace', reps: 2 }, // matches the approved lesson text "Backspace 2 times"
  'g5.4': { kind: 'practice', sequence: [{ tap: '←', reps: 2 }, { tap: '→', reps: 2 }] },
  's1.2': { kind: 'diagram', hold: ['⊞'], tap: 'E', result: 'File Explorer opens.', scene: 'file-explorer-open' },
  's1.3': { kind: 'diagram', hold: ['Alt'], tap: 'Tab', taps: 2, result: 'A row of open windows appears so you can choose one.', scene: 'alt-tab-preview' },
  's1.4': { kind: 'diagram', sequence: [{ hold: ['⊞'], tap: '←', scene: 'snap-left' }, { hold: ['⊞'], tap: '→', scene: 'snap-right' }], result: 'The two windows snap side by side.' },
  's1.5': { kind: 'diagram', hold: ['⊞'], tap: 'D', result: 'Your windows hide so the desktop shows.', scene: 'desktop-toggle' },
  's3.3': { kind: 'diagram', hold: [], tap: 'F2', result: 'The file name becomes a box you can edit.', scene: 'rename-box' },
  's3.4': { kind: 'diagram', hold: ['Ctrl'], tap: 'Z', result: 'The last change is undone.', scene: 'undo-arrow' },
  's3.5': { kind: 'diagram', hold: ['Ctrl'], tap: 'Z', result: 'The file moves back where it was.', scene: 'undo-arrow' },
  's4.2': { kind: 'practice', tap: '→', shift: true, reps: 3 },
  's4.3': { kind: 'diagram', sequence: [{ hold: ['Ctrl'], tap: 'C', scene: 'copy-twin' }, { hold: ['Ctrl'], tap: 'V', scene: 'paste-drop' }], result: 'A copy of your sentence appears below it.' },
  's4.4': { kind: 'diagram', hold: ['Ctrl'], tap: 'Z', result: 'The pasted copy disappears.', scene: 'undo-arrow' },
  's4.5': { kind: 'diagram', hold: ['Ctrl'], tap: 'S', result: 'Your new sentence is saved.', scene: 'save-dot-gone' },
  's5.5': { kind: 'diagram', sequence: [{ hold: ['Ctrl'], tap: 'C', scene: 'copy-twin' }, { hold: ['Ctrl'], tap: 'V', scene: 'paste-drop' }], result: 'The fact is copied into Notepad.' },
};

LESSONS.forEach((lesson) => {
  lesson.mission.forEach((missionStep, index) => {
    const id = `${lesson.id}.${index}`;
    if (expected[id]) assert.deepEqual(missionStep.keyMoment, expected[id], id);
    else assert.ok(missionStep.keyMoment == null, `${id} has no key moment`);
  });
});

assert.ok(Object.isFrozen(LESSONS));
assert.ok(Object.isFrozen(getLesson('g3').mission[5].keyMoment));
assert.ok(Object.isFrozen(getLesson('g3').mission[5].keyMoment.sequence));
assert.throws(() => { getLesson('g3').mission[5].keyMoment.sequence[0].tap = 'Enter'; }, TypeError);
assert.equal(getLesson('g1'), LESSONS[0]);
assert.equal(getLesson('missing'), null);
assert.deepEqual(trackLessons('guided').map((lesson) => lesson.id), ['g1', 'g2', 'g3', 'g4', 'g5']);
assert.deepEqual(trackLessons('standard').map((lesson) => lesson.id), ['s1', 's2', 's3', 's4', 's5']);

console.log('cq key moments tests passed');

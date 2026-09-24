import assert from 'node:assert/strict';
import { createBattle } from '../src/cq/battle/engine.js';
import { advanceTraining, startTraining, TRAINING_MARKER, trainingStep, trainingSteps } from '../src/cq/battle/tutorial.js';

const bare = trainingSteps({});
assert.deepEqual(bare, ['move', 'attack', 'power', 'ready']);
assert.deepEqual(trainingSteps({ sword: true, shield: true, staff: true, amulet: true, backpack: true, stone: true }),
  ['move', 'attack', 'gear', 'power', 'ready']);
const gear = { sword: true, shield: true, staff: true, amulet: true, backpack: true, stone: true };
const battle = createBattle({ cq: { track: 'standard' }, lesson: { number: 1, track: 'standard' }, rng: () => 0.5 });
let tutorial = startTraining(gear);
assert.equal(trainingStep(tutorial), 'move');
assert.equal(advanceTraining(tutorial, battle, [{ type: 'poof', enemy: 'slime' }]), tutorial);
battle.hero.x = TRAINING_MARKER.x - 0.7; battle.hero.y = TRAINING_MARKER.y;
assert.equal(advanceTraining(tutorial, battle), tutorial);
battle.hero.x = TRAINING_MARKER.x - 0.5;
tutorial = advanceTraining(tutorial, battle);
assert.equal(trainingStep(tutorial), 'attack');
assert.equal(advanceTraining(tutorial, battle, [{ type: 'swing' }]), tutorial);
tutorial = advanceTraining(tutorial, battle, [{ type: 'poof', enemy: 'slime' }]);
assert.equal(trainingStep(tutorial), 'gear');
assert.equal(advanceTraining(tutorial, battle, [{ type: 'poof', enemy: 'slime' }]), tutorial);
tutorial = advanceTraining(tutorial, battle, [], 'gear-key');
assert.equal(trainingStep(tutorial), 'power');
assert.equal(advanceTraining(tutorial, battle, [{ type: 'special-wait' }]), tutorial);
tutorial = advanceTraining(tutorial, battle, [{ type: 'special' }]);
assert.equal(trainingStep(tutorial), 'ready');
assert.equal(advanceTraining(tutorial, battle, [], 'start').status, 'practice-done');
assert.equal(advanceTraining(tutorial, battle, [], 'again').index, 0);
assert.equal(advanceTraining(tutorial, battle, [], 'skip').status, 'practice-skipped');
const gotIt = { ...startTraining(gear), index: 2 };
assert.equal(advanceTraining(gotIt, battle, [], 'got-it').index, 3);
const noGear = { ...startTraining({}), index: 1 };
assert.equal(trainingStep(advanceTraining(noGear, battle, [{ type: 'poof', enemy: 'slime' }])), 'power');
assert.equal(advanceTraining(startTraining({}), battle, [], 'skip').status, 'practice-skipped');

console.log('ok — battle training steps and real-action transitions');

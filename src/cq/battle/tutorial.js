// Pure training progression. The UI supplies the real engine state and events after each tick.
export const TRAINING_MARKER = Object.freeze({ x: 13, y: 6 });

export function trainingSteps(gear = {}) {
  const keys = [];
  if (gear.sword) keys.push('stance');
  if (gear.shield) keys.push('block');
  if (gear.staff || gear.rune) keys.push('ability');
  if (gear.amulet) keys.push('undo');
  if (gear.backpack) keys.push('apple');
  if (gear.stone) keys.push('stone');
  return ['move', 'attack', ...(keys.length ? ['gear'] : []), 'power', 'ready'];
}

export function startTraining(gear = {}) {
  return { steps: trainingSteps(gear), index: 0, status: 'active' };
}

export function trainingStep(tutorial) { return tutorial.steps[tutorial.index]; }

export function advanceTraining(tutorial, battle, events = [], action = null) {
  if (tutorial.status !== 'active') return tutorial;
  if (action === 'skip') return { ...tutorial, status: 'practice-skipped' };
  const current = trainingStep(tutorial);
  if (current === 'ready') return action === 'start' ? { ...tutorial, status: 'practice-done' }
    : action === 'again' ? { ...tutorial, index: 0 } : tutorial;
  const complete = current === 'move' ? Math.hypot(battle.hero.x - TRAINING_MARKER.x, battle.hero.y - TRAINING_MARKER.y) <= 0.6
    : current === 'attack' ? events.some((event) => event.type === 'poof' && event.enemy === 'slime')
      : current === 'gear' ? action === 'got-it' || action === 'gear-key'
        : current === 'power' ? events.some((event) => event.type === 'special') : false;
  return complete ? { ...tutorial, index: tutorial.index + 1 } : tutorial;
}

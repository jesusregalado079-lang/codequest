// Runs a kid's Gem Rain program: their blocks become named handler functions
// (onStart, onLeft, onCatch…) and the game calls them as things happen — which
// is exactly what an event handler IS. Sandboxed; never eval.
import Interpreter from 'js-interpreter';
import {
  createGame, movePlayer, addScore, loseLife, setMessage, gameOver,
  stepPhysics, checkGoals,
} from './arcade.js';

const MAX_STEPS_PER_HANDLER = 20000;

// Calls a kid handler if they wrote one — an unwired event is simply ignored,
// the same way a real event listener that was never added is.
function callHandler(interp, name) {
  interp.appendCode(`if (typeof ${name} === 'function') { ${name}(); }`);
  let steps = 0;
  while (interp.step()) {
    if (++steps > MAX_STEPS_PER_HANDLER) return false; // runaway handler
  }
  return true;
}

export function runGame(code, mission) {
  const g = createGame(mission);
  const frames = [];
  const snapshot = (event) => {
    frames.push({
      lane: g.lane,
      gems: g.gems.map((gem) => ({ ...gem })),
      score: g.score,
      lives: g.lives,
      message: g.message,
      over: g.over,
      event,
    });
  };

  const interp = new Interpreter(code, (i, globals) => {
    const native = (fn) => i.createNativeFunction(fn);
    i.setProperty(globals, 'movePlayer', native((dx) => movePlayer(g, Number(dx))));
    i.setProperty(globals, 'addScore', native(() => addScore(g, 1)));
    i.setProperty(globals, 'loseLife', native(() => loseLife(g)));
    i.setProperty(globals, 'setMessage', native((t) => setMessage(g, t)));
    i.setProperty(globals, 'gameOver', native(() => gameOver(g)));
    i.setProperty(globals, 'noLives', native(() => g.lives <= 0));
    i.setProperty(globals, 'scoreHigh', native(() => g.score >= (mission.winScore ?? 5)));
    i.setProperty(globals, 'highlightBlock', native(() => {}));
  });

  // First run defines the handlers (and runs nothing else — kid code is all
  // function definitions).
  let steps = 0;
  while (interp.step()) {
    if (++steps > MAX_STEPS_PER_HANDLER) break;
  }

  let timedOut = !callHandler(interp, 'onStart');
  snapshot('start');

  const inputs = mission.inputs ?? [];
  const totalTicks = mission.ticks ?? 12;
  for (let t = 0; t < totalTicks && !g.over && !timedOut; t++) {
    for (const input of inputs.filter((i) => i.tick === t)) {
      timedOut ||= !callHandler(interp, input.key === 'left' ? 'onLeft' : 'onRight');
      snapshot('move');
    }
    timedOut ||= !callHandler(interp, 'onTick');
    for (const event of stepPhysics(g, mission)) {
      timedOut ||= !callHandler(interp, event === 'catch' ? 'onCatch' : 'onMiss');
      snapshot(event);
    }
    snapshot('tick');
  }

  const fails = timedOut
    ? ['a handler ran forever — check your loops!']
    : checkGoals(g, mission.check);
  return { frames, state: g, passed: fails.length === 0, fails };
}

// Free-play mode: same handlers, driven live by the player's keys instead of a
// script. Returns a controller the page drives.
export function createLiveGame(code, mission) {
  const g = createGame(mission);
  const interp = new Interpreter(code, (i, globals) => {
    const native = (fn) => i.createNativeFunction(fn);
    i.setProperty(globals, 'movePlayer', native((dx) => movePlayer(g, Number(dx))));
    i.setProperty(globals, 'addScore', native(() => addScore(g, 1)));
    i.setProperty(globals, 'loseLife', native(() => loseLife(g)));
    i.setProperty(globals, 'setMessage', native((t) => setMessage(g, t)));
    i.setProperty(globals, 'gameOver', native(() => gameOver(g)));
    i.setProperty(globals, 'noLives', native(() => g.lives <= 0));
    i.setProperty(globals, 'scoreHigh', native(() => g.score >= (mission.winScore ?? 5)));
    i.setProperty(globals, 'highlightBlock', native(() => {}));
  });
  let steps = 0;
  while (interp.step()) {
    if (++steps > MAX_STEPS_PER_HANDLER) break;
  }
  callHandler(interp, 'onStart');

  return {
    state: g,
    press(key) {
      if (g.over) return;
      callHandler(interp, key === 'left' ? 'onLeft' : 'onRight');
    },
    // endless rain for free play, seeded so it still isn't Math.random in code
    tick(spawner) {
      if (g.over) return;
      callHandler(interp, 'onTick');
      const rain = spawner(g.tick);
      for (const event of stepPhysics(g, { rain })) {
        callHandler(interp, event === 'catch' ? 'onCatch' : 'onMiss');
      }
    },
  };
}

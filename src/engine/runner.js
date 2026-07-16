// Executes generated JavaScript in a sandboxed interpreter against a world.
// Synchronous: runs to completion (with step caps), leaving w.events for the
// renderer to animate. Never eval().
import Interpreter from 'js-interpreter';
import { moveForward, turn, collect, Bump } from './world.js';

const MAX_STEPS = 100000;
const MAX_EVENTS = 1000;

export function runProgram(code, w) {
  let currentBlock = null;
  const interp = new Interpreter(code, (i, globals) => {
    const native = (fn) => i.createNativeFunction(fn);
    i.setProperty(globals, 'highlightBlock', native((id) => { currentBlock = String(id); }));
    i.setProperty(globals, 'moveForward', native(() => moveForward(w, currentBlock)));
    i.setProperty(globals, 'turnLeft', native(() => turn(w, -1, currentBlock)));
    i.setProperty(globals, 'turnRight', native(() => turn(w, 1, currentBlock)));
    i.setProperty(globals, 'collectGem', native(() => collect(w, currentBlock)));
  });
  let steps = 0;
  try {
    while (interp.step()) {
      if (++steps > MAX_STEPS || w.events.length > MAX_EVENTS) {
        w.events.push({ type: 'timeout' });
        w.failed = true;
        break;
      }
    }
  } catch (e) {
    if (!(e instanceof Bump)) throw e;
    // bump already recorded as an event; program simply stops
  }
  return w;
}

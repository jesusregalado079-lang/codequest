// Engine self-check: every World 1 level is solvable at par, and the
// executor handles bumps, missing gems, and infinite loops safely.
// Run: npm test
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { loadLevel, isWin } from '../src/engine/world.js';
import { runProgram } from '../src/engine/runner.js';

const world1 = JSON.parse(readFileSync(new URL('../src/levels/world1.json', import.meta.url), 'utf8'));

// Solutions written as block strings: M=move, L=turn left, R=turn right, C=collect
const SOLUTIONS = {
  'world1-1': 'MMC',
  'world1-2': 'MMMMC',
  'world1-3': 'MMRMMC',
  'world1-4': 'MMLMMC',
  'world1-5': 'MMCMMC',
  'world1-6': 'MMRMMLMMC',
  'world1-7': 'MMCRMMC',
  'world1-8': 'MMLMMMMLMMC',
  'world1-9': 'MMCMMRMMRMCMMMC',
  'world1-10': 'MMMCRMMRMMCLMM',
};

const CODE = { M: 'moveForward();\n', L: 'turnLeft();\n', R: 'turnRight();\n', C: 'collectGem();\n' };
const toCode = (s) => [...s].map((c) => CODE[c]).join('');

for (const level of world1.levels) {
  const sol = SOLUTIONS[level.id];
  assert(sol, `missing solution for ${level.id}`);
  assert.strictEqual(sol.length, level.par, `${level.id}: par ${level.par} != solution length ${sol.length}`);
  const w = runProgram(toCode(sol), loadLevel(level));
  assert(!w.failed, `${level.id}: solution failed`);
  assert(isWin(w), `${level.id}: solution did not win (gems left: ${w.gems.size})`);
}

// Bump: walking into a wall stops the program and fails the run
{
  const w = runProgram(toCode('MMMMMM'), loadLevel(world1.levels[0]));
  assert(w.failed, 'bump should fail');
  assert.strictEqual(w.events.at(-1).type, 'bump');
  assert(!isWin(w));
}

// Collecting where there is no gem is harmless but wins nothing
{
  const w = runProgram(toCode('C'), loadLevel(world1.levels[0]));
  assert(!w.failed);
  assert.strictEqual(w.events.at(-1).type, 'nogem');
  assert(!isWin(w));
}

// Infinite loop is halted by the step cap
{
  const w = runProgram('while (true) { collectGem(); }', loadLevel(world1.levels[0]));
  assert(w.failed, 'infinite loop should time out');
  assert(w.events.some((e) => e.type === 'timeout'));
}

// Boss level: gems alone are not enough — must reach the exit flag
{
  const w = runProgram(toCode('MMMCRMMRMMC'), loadLevel(world1.levels[9]));
  assert(!w.failed);
  assert.strictEqual(w.gems.size, 0);
  assert(!isWin(w), 'boss should require standing on exit');
}

console.log(`ok — ${world1.levels.length} levels solvable at par, executor edge cases pass`);

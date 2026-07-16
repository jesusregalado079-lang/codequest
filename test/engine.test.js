// Engine self-check: every World 1 level is solvable at par, and the
// executor handles bumps, missing gems, and infinite loops safely.
// Run: npm test
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { loadLevel, isWin } from '../src/engine/world.js';
import { runProgram } from '../src/engine/runner.js';
import { runGame } from '../src/engine/arcade-runner.js';
import { friendlyError } from '../src/ui/errors.js';

const world1 = JSON.parse(readFileSync(new URL('../src/levels/world1.json', import.meta.url), 'utf8'));
const world2 = JSON.parse(readFileSync(new URL('../src/levels/world2.json', import.meta.url), 'utf8'));
const world3 = JSON.parse(readFileSync(new URL('../src/levels/world3.json', import.meta.url), 'utf8'));
const world4 = JSON.parse(readFileSync(new URL('../src/levels/world4.json', import.meta.url), 'utf8'));
const world5 = JSON.parse(readFileSync(new URL('../src/levels/world5.json', import.meta.url), 'utf8'));
const world6 = JSON.parse(readFileSync(new URL('../src/levels/world6.json', import.meta.url), 'utf8'));
const world7 = JSON.parse(readFileSync(new URL('../src/levels/world7.json', import.meta.url), 'utf8'));

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

// World 2: loop solutions as the real JavaScript Blockly's repeat block generates.
// Par is hand-counted blocks (loops make it fewer than executed steps).
const W2 = {
  'world2-1': 'for(var i=0;i<6;i++){moveForward();}collectGem();',
  'world2-2': 'for(var i=0;i<2;i++){moveForward();moveForward();moveForward();collectGem();}',
  'world2-3': 'for(var i=0;i<3;i++){moveForward();moveForward();moveForward();collectGem();turnRight();}',
  'world2-4': 'for(var i=0;i<4;i++){moveForward();turnLeft();moveForward();turnRight();}collectGem();',
  'world2-5': 'for(var i=0;i<3;i++){moveForward();moveForward();collectGem();}',
  'world2-6': 'for(var i=0;i<3;i++){for(var j=0;j<5;j++){moveForward();}collectGem();turnRight();}',
  'world2-7': 'for(var i=0;i<4;i++){moveForward();turnLeft();moveForward();collectGem();turnRight();}',
  'world2-8': 'for(var i=0;i<4;i++){moveForward();moveForward();collectGem();moveForward();moveForward();turnRight();}',
  'world2-9': 'for(var i=0;i<3;i++){moveForward();moveForward();moveForward();collectGem();turnLeft();}',
  'world2-10': 'for(var i=0;i<3;i++){moveForward();collectGem();turnRight();moveForward();turnLeft();}turnRight();for(var i=0;i<4;i++){moveForward();}',
};

for (const level of world2.levels) {
  const code = W2[level.id];
  assert(code, `missing solution for ${level.id}`);
  const w = runProgram(code, loadLevel(level));
  assert(!w.failed, `${level.id}: solution failed (${w.events.at(-1)?.type})`);
  assert(isWin(w), `${level.id}: solution did not win (gems left: ${w.gems.size})`);
}

// World 3: conditional solutions — the JS the if/if-else blocks generate.
const CHECK_GEM = 'if(onGem()){collectGem();}';
const STEER_R = 'if(pathAhead()){moveForward();}else{turnRight();}';
const STEER_L = 'if(pathAhead()){moveForward();}else{turnLeft();}';
const W3 = {
  'world3-1': `for(var i=0;i<6;i++){moveForward();${CHECK_GEM}}`,
  'world3-2': `for(var i=0;i<8;i++){moveForward();${CHECK_GEM}}`,
  'world3-3': `for(var i=0;i<7;i++){${STEER_R}}collectGem();`,
  'world3-4': `for(var i=0;i<14;i++){${STEER_R}}collectGem();`,
  'world3-5': `for(var i=0;i<7;i++){${STEER_R}${CHECK_GEM}}`,
  'world3-6': `for(var i=0;i<14;i++){${STEER_L}}collectGem();`,
  'world3-7': `for(var i=0;i<14;i++){${STEER_R}${CHECK_GEM}}`,
  'world3-8': `for(var i=0;i<12;i++){${STEER_R}${CHECK_GEM}}`,
  'world3-9': `for(var i=0;i<14;i++){${STEER_L}${CHECK_GEM}}`,
  'world3-10': `for(var i=0;i<16;i++){${STEER_R}${CHECK_GEM}}`,
};

for (const level of world3.levels) {
  const code = W3[level.id];
  assert(code, `missing solution for ${level.id}`);
  const w = runProgram(code, loadLevel(level));
  assert(!w.failed, `${level.id}: solution failed (${w.events.at(-1)?.type})`);
  assert(isWin(w), `${level.id}: solution did not win (gems left: ${w.gems.size})`);
}

// World 4: function solutions — the JS the teach/call blocks generate.
// Calls appear before definitions on purpose: hoisting must work in the
// sandboxed interpreter exactly like real JS.
const W4 = {
  'world4-1': 'star();star();star();function star(){moveForward();moveForward();collectGem();}',
  'world4-2': 'star();star();star();function star(){moveForward();moveForward();moveForward();collectGem();turnRight();}',
  'world4-3': 'star();turnRight();star();turnRight();star();function star(){for(var i=0;i<3;i++){moveForward();collectGem();}}',
  'world4-4': 'star();moon();star();moon();star();function star(){moveForward();moveForward();collectGem();}function moon(){turnRight();moveForward();turnLeft();}',
  'world4-5': 'star();star();for(var i=0;i<3;i++){moveForward();collectGem();}star();star();collectGem();function star(){moveForward();turnLeft();moveForward();turnRight();}',
  'world4-6': 'for(var i=0;i<6;i++){star();}function star(){moveForward();if(onGem()){collectGem();}}',
  'world4-7': 'star();moon();star();moon();star();function star(){moveForward();collectGem();moveForward();collectGem();}function moon(){turnRight();moveForward();turnLeft();}',
  'world4-8': 'star();turnRight();star();turnRight();star();function star(){for(var i=0;i<3;i++){moveForward();if(onGem()){collectGem();}}}',
  'world4-9': 'star();turnLeft();star();turnLeft();star();function star(){for(var i=0;i<3;i++){moveForward();collectGem();}}',
  'world4-10': 'star();star();for(var i=0;i<3;i++){moon();}star();star();for(var i=0;i<3;i++){moon();}function star(){moveForward();turnLeft();moveForward();turnRight();}function moon(){moveForward();if(onGem()){collectGem();}}',
};

for (const level of world4.levels) {
  const code = W4[level.id];
  assert(code, `missing solution for ${level.id}`);
  const w = runProgram(code, loadLevel(level));
  assert(!w.failed, `${level.id}: solution failed (${w.events.at(-1)?.type})`);
  assert(isWin(w), `${level.id}: solution did not win (gems left: ${w.gems.size})`);
}

// Calling an untaught move must throw (play.js catches it and shows a toast)
{
  let threw = false;
  try {
    runProgram('star();', loadLevel(world4.levels[0]));
  } catch {
    threw = true;
  }
  assert(threw, 'undefined function call should throw');
}

// World 5: variable solutions — count gems into `gems`, then use the count.
const V = 'var gems = 0;';
const TALLY = 'if(onGem()){collectGem();gems=gems+1;}';
const WALK_GEMS = 'for(var i=0;i<gems;i++){moveForward();}';
const W5 = {
  'world5-1': `${V}for(var k=0;k<3;k++){moveForward();collectGem();gems=gems+1;}${WALK_GEMS}`,
  'world5-2': `${V}for(var k=0;k<6;k++){moveForward();${TALLY}}${WALK_GEMS}`,
  'world5-3': `${V}for(var k=0;k<7;k++){moveForward();${TALLY}}turnRight();${WALK_GEMS}`,
  'world5-4': `${V}for(var k=0;k<5;k++){moveForward();${TALLY}}turnRight();${WALK_GEMS}turnLeft();${WALK_GEMS}`,
  'world5-5': `${V}function star(){moveForward();${TALLY}}for(var k=0;k<8;k++){star();}${WALK_GEMS}`,
  'world5-6': `${V}for(var k=0;k<5;k++){moveForward();${TALLY}}turnRight();moveForward();moveForward();turnRight();${WALK_GEMS}`,
  'world5-7': `${V}for(var k=0;k<3;k++){moveForward();turnLeft();moveForward();collectGem();gems=gems+1;turnRight();}${WALK_GEMS}`,
  'world5-8': `${V}function star(){moveForward();${TALLY}}for(var k=0;k<8;k++){star();}turnRight();${WALK_GEMS}`,
  'world5-9': `${V}for(var k=0;k<6;k++){moveForward();${TALLY}}turnLeft();${WALK_GEMS}`,
  'world5-10': `${V}function star(){moveForward();${TALLY}}for(var k=0;k<5;k++){star();}turnRight();${WALK_GEMS}turnLeft();for(var k=0;k<4;k++){star();}turnRight();${WALK_GEMS}`,
};

for (const level of world5.levels) {
  const code = W5[level.id];
  assert(code, `missing solution for ${level.id}`);
  const w = runProgram(code, loadLevel(level));
  assert(!w.failed, `${level.id}: solution failed (${w.events.at(-1)?.type})`);
  assert(isWin(w), `${level.id}: solution did not win (gems left: ${w.gems.size}, at ${w.pos.x},${w.pos.y})`);
}

// Miscounting must miss the flag: walk one step short on world5-1
{
  const w = runProgram(
    `${V}for(var k=0;k<3;k++){moveForward();collectGem();}gems=2;${WALK_GEMS}`,
    loadLevel(world5.levels[0])
  );
  assert(!w.failed && !isWin(w), 'wrong count should miss the exit');
}

// World 6: event handlers — the named functions the "when" blocks generate.
// Each mission's declarative check must pass with the intended wiring.
const ARROWS = 'function onLeft(){movePlayer(-1);}function onRight(){movePlayer(1);}';
const W6 = {
  'world6-1': ARROWS,
  'world6-2': "function onStart(){setMessage('GO!');}",
  'world6-3': 'function onCatch(){addScore();}',
  'world6-4': 'function onMiss(){loseLife();}',
  'world6-5': `${ARROWS}function onCatch(){addScore();}`,
  'world6-6': "function onCatch(){addScore();setMessage('NICE!');}",
  'world6-7': "function onMiss(){loseLife();setMessage('OOPS!');}",
  'world6-8': 'function onMiss(){loseLife();if(noLives()){gameOver();}}',
  'world6-9': "function onCatch(){addScore();if(scoreHigh()){setMessage('YOU WIN!');}}",
  'world6-10': `function onStart(){setMessage('GO!');}${ARROWS}` +
    "function onCatch(){addScore();setMessage('NICE!');}" +
    'function onMiss(){loseLife();if(noLives()){gameOver();}}',
};

for (const mission of world6.levels) {
  const code = W6[mission.id];
  assert(code, `missing solution for ${mission.id}`);
  const r = runGame(code, mission);
  assert(r.passed, `${mission.id}: intended wiring failed — ${r.fails.join('; ')}`);
  assert(r.frames.length > 0, `${mission.id}: no frames to animate`);
}

// An unwired event does nothing — the mission must NOT pass on empty handlers
for (const mission of world6.levels) {
  const r = runGame('', mission);
  assert(!r.passed, `${mission.id}: passes with no blocks at all`);
}

// A runaway handler is caught rather than freezing the page
{
  const r = runGame('function onCatch(){while(true){}}', world6.levels[2]);
  assert(!r.passed && r.fails[0].includes('forever'), 'runaway handler should be reported');
}

// World 7: the kid types this by hand, so the solutions ARE the level's
// intended source — and every one must stay inside the 3-star line budget.
const W7 = {
  'world7-1': 'moveForward();\ncollectGem();',
  'world7-2': 'moveForward();\nmoveForward();\nmoveForward();\nmoveForward();\ncollectGem();',
  'world7-3': 'moveForward();\nmoveForward();\nturnRight();\nmoveForward();\nmoveForward();\ncollectGem();',
  'world7-4': 'for (var i = 0; i < 6; i++) {\n  moveForward();\n}\ncollectGem();',
  'world7-5': 'for (var i = 0; i < 6; i++) {\n  moveForward();\n  if (onGem()) {\n    collectGem();\n  }\n}',
  'world7-6': 'for (var i = 0; i < 7; i++) {\n  if (pathAhead()) {\n    moveForward();\n  } else {\n    turnRight();\n  }\n}\ncollectGem();',
  'world7-7': 'function star() {\n  moveForward();\n  moveForward();\n  collectGem();\n}\nstar();\nstar();\nstar();',
  'world7-8': 'var gems = 0;\nfor (var i = 0; i < 3; i++) {\n  moveForward();\n  collectGem();\n  gems = gems + 1;\n}\nfor (var j = 0; j < gems; j++) {\n  moveForward();\n}',
  'world7-9': 'for (var i = 0; i < 14; i++) {\n  if (pathAhead()) {\n    moveForward();\n  } else {\n    turnRight();\n  }\n  if (onGem()) {\n    collectGem();\n  }\n}',
  'world7-10': 'for (var i = 0; i < 16; i++) {\n  if (pathAhead()) {\n    moveForward();\n  } else {\n    turnRight();\n  }\n  if (onGem()) {\n    collectGem();\n  }\n}',
};

const countLines = (src) =>
  src.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('//')).length;

for (const level of world7.levels) {
  const code = W7[level.id];
  assert(code, `missing solution for ${level.id}`);
  const w = runProgram(code, loadLevel(level));
  assert(!w.failed, `${level.id}: solution failed (${w.events.at(-1)?.type})`);
  assert(isWin(w), `${level.id}: solution did not win (gems left: ${w.gems.size})`);
  assert(countLines(code) <= level.par,
    `${level.id}: intended solution is ${countLines(code)} lines but par is ${level.par}`);
}

// Kid-typical mistakes must produce a helpful message, never a raw stack trace
for (const [label, src, expect] of [
  ['ES6 let', 'let x = 1;', /only understands var/],
  ['wrong case', 'moveforward();', /CAPITAL letters/],
  ['unclosed brace', 'for (var i = 0; i < 2; i++) {\n  moveForward();', /never closed|out of place/],
  ['typo', 'jump();', /doesn't know "jump"/],
]) {
  let msg = '';
  try {
    runProgram(src, loadLevel(world7.levels[0]));
  } catch (e) {
    msg = friendlyError(e, src);
  }
  assert(expect.test(msg), `${label}: unhelpful message — got "${msg}"`);
}

// Quiz sanity: every answer index points at a real choice
for (const world of [world2, world3, world4, world5, world6, world7]) {
  for (const q of world.quiz) {
    assert(q.choices[q.answer] !== undefined, `quiz "${q.q}": bad answer index`);
    assert(q.why, `quiz "${q.q}": missing explanation`);
  }
}

console.log(`ok — ${world1.levels.length} world-1 levels at par, ${world2.levels.length} world-2 loop, ${world3.levels.length} world-3 conditional, ${world4.levels.length} world-4 function, ${world5.levels.length} world-5 variable, ${world6.levels.length} world-6 event, ${world7.levels.length} world-7 typed levels solvable, quizzes valid, kid errors translated, executor edge cases pass`);

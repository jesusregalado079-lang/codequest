// Gem Rain: a tiny real-time arcade game the kids wire up with event blocks.
// Deterministic on purpose — gems fall on a fixed schedule and test inputs are
// scripted, so a mission can be auto-graded (and unit-tested in node).
// Same shape as the grid engine: run produces frames, the renderer replays them.

export const COLS = 7;
export const ROWS = 8;

export function createGame(mission) {
  return {
    lane: mission.startLane ?? 3,
    gems: [], // {lane, row}
    score: 0,
    lives: mission.lives ?? 3,
    message: '',
    over: false,
    tick: 0,
  };
}

export function movePlayer(g, dx) {
  g.lane = Math.max(0, Math.min(COLS - 1, g.lane + dx));
}

export function addScore(g, n = 1) {
  g.score += n;
}

export function loseLife(g) {
  g.lives = Math.max(0, g.lives - 1);
}

export function setMessage(g, text) {
  g.message = String(text).slice(0, 20);
}

export function gameOver(g) {
  g.over = true;
}

// Advances one tick of physics. Returns the events that fired this tick, in
// order — the runner turns those into calls to the kid's handlers.
export function stepPhysics(g, mission) {
  const fired = [];
  for (const drop of mission.rain ?? []) {
    if (drop.tick === g.tick) g.gems.push({ lane: drop.lane, row: 0 });
  }
  for (const gem of g.gems) gem.row += 1;
  const landed = g.gems.filter((gem) => gem.row >= ROWS - 1);
  g.gems = g.gems.filter((gem) => gem.row < ROWS - 1);
  for (const gem of landed) fired.push(gem.lane === g.lane ? 'catch' : 'miss');
  g.tick += 1;
  return fired;
}

// Declarative pass/fail from the mission JSON — keeps missions data, not code.
export function checkGoals(g, check = {}) {
  const fails = [];
  if (check.scoreAtLeast != null && g.score < check.scoreAtLeast)
    fails.push(`score is ${g.score}, needs ${check.scoreAtLeast}`);
  if (check.livesEqual != null && g.lives !== check.livesEqual)
    fails.push(`lives is ${g.lives}, should be ${check.livesEqual}`);
  if (check.laneEqual != null && g.lane !== check.laneEqual)
    fails.push(`hero is in lane ${g.lane}, should be ${check.laneEqual}`);
  if (check.messageEquals != null && g.message !== check.messageEquals)
    fails.push(`message is "${g.message}", should be "${check.messageEquals}"`);
  if (check.overEquals != null && g.over !== check.overEquals)
    fails.push(check.overEquals ? 'game should be over' : 'game ended too early');
  return fails;
}

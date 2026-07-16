// All worlds, in curriculum order. Add a world = import its JSON here.
import world1 from './world1.json';
import world2 from './world2.json';
import world3 from './world3.json';
import world4 from './world4.json';
import world5 from './world5.json';
import world6 from './world6.json';
import world7 from './world7.json';
import world8 from './world8.json';

export const WORLDS = [world1, world2, world3, world4, world5, world6, world7, world8];

// each world flavour has its own page: arcade = game, typed = code editor,
// everything else = the block puzzle page
export function levelUrl(world, level) {
  if (world.sandbox) return 'build.html';
  if (world.arcade) return `game.html?mission=${level.id}`;
  if (world.typed) return `code.html?level=${level.id}`;
  return `play.html?level=${level.id}`;
}

export function getWorld(id) {
  return WORLDS.find((w) => w.id === id);
}

export function findLevel(levelId) {
  for (const world of WORLDS) {
    const index = world.levels.findIndex((l) => l.id === levelId);
    if (index !== -1) return { world, level: world.levels[index], index };
  }
  return null;
}

// A world is playable once the previous world's boss is beaten — unless it
// names its own gate (Free Build opens early: building is the reward for
// learning, not for finishing everything).
export function worldUnlocked(worldIndex, profile) {
  if (worldIndex === 0) return true;
  const world = WORLDS[worldIndex];
  if (world.unlockAfter) return (profile.stars[world.unlockAfter] ?? 0) > 0;
  const prev = WORLDS[worldIndex - 1];
  return (profile.stars[prev.levels.at(-1).id] ?? 0) > 0;
}

export function levelUnlocked(world, levelIndex, profile) {
  if (levelIndex === 0) return true;
  return (profile.stars[world.levels[levelIndex - 1].id] ?? 0) > 0;
}

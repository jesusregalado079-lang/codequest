// All worlds, in curriculum order. Add a world = import its JSON here.
import world1 from './world1.json';
import world2 from './world2.json';
import world3 from './world3.json';
import world4 from './world4.json';
import world5 from './world5.json';

export const WORLDS = [world1, world2, world3, world4, world5];

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

// A world is playable once the previous world's boss is beaten.
export function worldUnlocked(worldIndex, profile) {
  if (worldIndex === 0) return true;
  const prev = WORLDS[worldIndex - 1];
  return (profile.stars[prev.levels.at(-1).id] ?? 0) > 0;
}

export function levelUnlocked(world, levelIndex, profile) {
  if (levelIndex === 0) return true;
  return (profile.stars[world.levels[levelIndex - 1].id] ?? 0) > 0;
}

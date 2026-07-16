// Blocky voxel-style hero, drawn with canvas rects — no image assets.
// Armor tiers are original designs (leather → iron → gold → diamond),
// unlocked by beating world bosses. Unlocks derive from stars, no extra state.

export const ARMOR = [
  { id: 'starter', name: 'Starter Tee', unlock: null, unlockText: 'always yours',
    helmet: null, chest: '#4a90d9', boots: '#3b3b3b' },
  { id: 'leather', name: 'Leather Kit', unlock: 'world1-10', unlockText: 'beat the World 1 boss',
    helmet: '#8b5a2b', chest: '#a06a34', boots: '#6f4620' },
  { id: 'iron', name: 'Iron Armor', unlock: 'world2-10', unlockText: 'beat the World 2 boss',
    helmet: '#c9ccd1', chest: '#b6bac1', boots: '#8f939b' },
  { id: 'gold', name: 'Gold Armor', unlock: 'world3-10', unlockText: 'beat the World 3 boss',
    helmet: '#f0c33c', chest: '#e6b422', boots: '#c2951a' },
  { id: 'diamond', name: 'Diamond Armor', unlock: 'world4-10', unlockText: 'beat the World 4 boss',
    helmet: '#5fd6d0', chest: '#3fc5be', boots: '#2fa39d' },
  { id: 'emerald', name: 'Emerald Armor', unlock: 'world5-10', unlockText: 'beat the World 5 boss',
    helmet: '#4fd97a', chest: '#3ecf6e', boots: '#2fae58' },
];

export function armorUnlocked(armor, profile) {
  return !armor.unlock || (profile.stars[armor.unlock] ?? 0) > 0;
}

export function getArmor(id) {
  return ARMOR.find((a) => a.id === id) ?? ARMOR[0];
}

// Draws the hero centred on (cx, cy), sized to fit a tile of `size` px.
// squash: collect-bounce scale. bob: walk-cycle 0..1 for a little hop.
export function drawHero(ctx, cx, cy, size, armor, { squash = 1, bob = 0 } = {}) {
  const u = size / 16; // voxel unit
  ctx.save();
  ctx.translate(cx, cy + Math.sin(bob * Math.PI) * -u);
  ctx.scale(squash, squash);

  const px = (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x * u, y * u, w * u, h * u);
  };

  // legs / boots
  px(-3.5, 3, 3, 4, armor.boots);
  px(0.5, 3, 3, 4, armor.boots);
  // torso / chestplate
  px(-4, -2, 8, 5, armor.chest);
  // arms (skin) with chest-coloured sleeves
  px(-6, -2, 2, 4, armor.chest);
  px(4, -2, 2, 4, armor.chest);
  px(-6, 1.6, 2, 1.4, '#e8b98c');
  px(4, 1.6, 2, 1.4, '#e8b98c');
  // head
  px(-3.5, -9, 7, 7, '#e8b98c');
  // helmet (skip for starter)
  if (armor.helmet) {
    px(-3.9, -9.4, 7.8, 3, armor.helmet);
    px(-3.9, -9.4, 1.4, 6, armor.helmet);
    px(2.5, -9.4, 1.4, 6, armor.helmet);
  } else {
    px(-3.5, -9, 7, 1.6, '#5a3b22'); // hair
  }
  // face
  px(-2.2, -6.4, 1.3, 1.3, '#222');
  px(0.9, -6.4, 1.3, 1.3, '#222');
  px(-1.2, -4.2, 2.4, 0.8, '#a05a3a'); // smile

  ctx.restore();
}

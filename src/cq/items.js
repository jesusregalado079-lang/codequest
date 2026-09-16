export const RARITY = {
  common: '#9aa4ad', rare: '#4a9df0', epic: '#a66bf0', legendary: '#f2b631',
};

export const LOOK_OPTIONS = {
  skin: [
    { id: 's1', hex: '#f6d7c3' }, { id: 's2', hex: '#eebc98' }, { id: 's3', hex: '#d9a07a' },
    { id: 's4', hex: '#b97a56' }, { id: 's5', hex: '#8d5a3b' }, { id: 's6', hex: '#5e3a24' },
  ],
  hairStyle: [
    { id: 'buzz', name: 'Buzz' }, { id: 'short', name: 'Short' }, { id: 'spiky', name: 'Spiky' },
    { id: 'curly', name: 'Curly' }, { id: 'long', name: 'Long' }, { id: 'swoop', name: 'Swoop' }, { id: 'none', name: 'No Hair' },
  ],
  hairColor: [
    { id: 'black', hex: '#1c1714' }, { id: 'darkbrown', hex: '#3b2417' }, { id: 'brown', hex: '#6b4226' },
    { id: 'blonde', hex: '#e0b85a' }, { id: 'red', hex: '#a8432a' }, { id: 'white', hex: '#e8e8e8' },
    { id: 'blue', hex: '#3c6fd6' }, { id: 'green', hex: '#3aa45c' },
  ],
  eyeColor: [
    { id: 'brown', hex: '#5b3a1e' }, { id: 'blue', hex: '#3a7bd5' }, { id: 'green', hex: '#3a9a5b' },
    { id: 'gray', hex: '#6d7680' }, { id: 'hazel', hex: '#8a6b2f' },
  ],
  shirtStyle: [
    { id: 'tee', name: 'Tee' }, { id: 'hoodie', name: 'Hoodie' }, { id: 'striped', name: 'Striped' }, { id: 'jacket', name: 'Jacket' },
  ],
  shirtColor: [
    { id: 'red', hex: '#d64545' }, { id: 'orange', hex: '#e8833a' }, { id: 'yellow', hex: '#e8c33a' },
    { id: 'green', hex: '#4caf50' }, { id: 'teal', hex: '#2bb3a6' }, { id: 'blue', hex: '#3f7fd9' },
    { id: 'purple', hex: '#8a5cd6' }, { id: 'pink', hex: '#e06aa8' }, { id: 'black', hex: '#2a2a2e' }, { id: 'white', hex: '#f0f0f0' },
  ],
  pantsColor: [
    { id: 'denim', hex: '#3b5b8c' }, { id: 'black', hex: '#26262b' }, { id: 'khaki', hex: '#b59a6a' },
    { id: 'gray', hex: '#6b7078' }, { id: 'olive', hex: '#4a6b3a' }, { id: 'brown', hex: '#6b4a2e' },
  ],
  shoesColor: [
    { id: 'white', hex: '#eeeeee' }, { id: 'black', hex: '#222222' }, { id: 'red', hex: '#c83c3c' },
    { id: 'blue', hex: '#3a66c8' }, { id: 'brown', hex: '#6b4226' }, { id: 'gray', hex: '#7a7a7a' },
  ],
};

export const DEFAULT_LOOK = {
  skin: 's2', hairStyle: 'swoop', hairColor: 'black', eyeColor: 'brown', shirtStyle: 'hoodie',
  shirtColor: 'orange', pantsColor: 'black', shoesColor: 'red',
};

export const GEAR_SLOTS = ['head', 'body', 'feet', 'mainHand', 'offHand', 'back', 'magic1', 'magic2'];
export const COSMETIC_LAYERS = ['hat', 'cape', 'face', 'hairFx', 'trail', 'title'];

export const ITEMS = [
  { id: 'start-blade', name: 'Start Blade', track: 'guided', lesson: 'g1', slot: 'mainHand', type: 'weapon', rarity: 'rare', flavor: 'A wooden sword with a glowing four-square pommel. Every hero starts somewhere.', effect: 'Swing for 2 damage. Press Space.', battle: { kind: 'melee', dmg: 2, reach: 1.2, cooldown: 0.4 } },
  { id: 'taskbar-boots', name: 'Taskbar Boots', track: 'guided', lesson: 'g2', slot: 'feet', type: 'armor', rarity: 'rare', flavor: 'Light boots that let you zip from place to place, just like zipping between apps.', effect: 'Move 25% faster.', battle: { kind: 'passive', moveSpeed: 0.25 } },
  { id: 'folder-backpack', name: 'Folder Backpack', track: 'guided', lesson: 'g3', slot: 'back', type: 'tool', rarity: 'rare', flavor: 'A sturdy pack with neat little pockets. Holds one healing apple.', effect: 'Press 1 once per battle to heal 2 hearts.', battle: { kind: 'consumable', apples: 1, heal: 2 } },
  { id: 'rename-rune', name: 'Rename Rune', track: 'guided', lesson: 'g4', slot: 'magic', type: 'spell', rarity: 'rare', flavor: 'Rename a monster "Chicken" and, poof, it\'s a harmless chicken for 3 seconds.', effect: 'Press E to turn a nearby enemy into a chicken for 3 seconds.', battle: { kind: 'ability', key: 'E', range: 4, duration: 3, cooldown: 8 } },
  { id: 'stop-sign-shield', name: 'Stop Sign Shield', track: 'guided', lesson: 'g5', slot: 'offHand', type: 'armor', rarity: 'rare', flavor: 'Raise it and tricks bounce right off.', effect: 'Hold Shift to block. Move 50% slower while blocking.', battle: { kind: 'block', blockMoveSpeed: -0.5 } },
  { id: 'switch-sword', name: 'Switch Sword', track: 'standard', lesson: 's1', slot: 'mainHand', type: 'weapon', rarity: 'rare', flavor: 'A blade that flips between a quick stance and a wide stance, the way Alt+Tab flips between windows.', effect: 'Press Q to swap quick and wide swings.', battle: { kind: 'melee', quick: { dmg: 2, cooldown: 0.3, reach: 1.1 }, wide: { dmg: 2, cooldown: 0.6, arc: 120, reach: 1.5 } } },
  { id: 'save-stone', name: 'Save Stone', track: 'standard', lesson: 's2', slot: 'magic', type: 'trinket', rarity: 'rare', flavor: 'Once per battle, if you fall, you pop back up right where you last touched the stone.', effect: 'Press 2 to move it. It revives you once at 3 hearts.', battle: { kind: 'revive', revives: 1, reviveHearts: 3 } },
  { id: 'undo-amulet', name: 'Undo Amulet', track: 'standard', lesson: 's3', slot: 'magic', type: 'trinket', rarity: 'rare', flavor: 'Once per battle, rewind 3 seconds and undo a hit.', effect: 'Press R once per battle to rewind 3 seconds.', battle: { kind: 'ability', rewind: 3, uses: 1 } },
  { id: 'copy-crystal-staff', name: 'Copy Crystal Staff', track: 'standard', lesson: 's4', slot: 'offHand', type: 'weapon', rarity: 'rare', flavor: 'Every bolt it fires comes with a twin, a perfect copy.', effect: 'Press E to fire two 1-damage bolts.', battle: { kind: 'ranged', key: 'E', dmg: 1, twinDmg: 1, cooldown: 0.5, range: 6 } },
  { id: 'scam-spotter-helmet', name: 'Scam-Spotter Helmet', track: 'standard', lesson: 's5', slot: 'head', type: 'armor', rarity: 'rare', flavor: 'See through disguises. Pop-up Mimics, the fake chests that bite, glow red.', effect: 'Reveal Mimics. Take 1 less damage every 5 seconds.', battle: { kind: 'passive', revealMimics: true, incomingDmgReduction: 1, minIncomingDmg: 1, cooldown: 5 } },
];

export const BARE_HANDS = { dmg: 1, reach: 1.0, cooldown: 0.45 };

const cosmetic = (id, name, layer, rarity, pool, colors, note) => ({
  id, name, layer, rarity, pool, price: pool === 'chest' ? ({ common: 40, rare: 80, epic: 160 })[rarity] : null, colors, ...(note ? { note } : {}),
});

export const COSMETICS = [
  cosmetic('cap-red', 'Red Cap', 'hat', 'common', 'chest', ['#d64545']),
  cosmetic('beanie-gray', 'Gray Beanie', 'hat', 'common', 'chest', ['#6d7680']),
  cosmetic('bandana-blue', 'Blue Bandana', 'hat', 'common', 'chest', ['#3a66c8']),
  cosmetic('headphones', 'Gamer Headphones', 'hat', 'rare', 'chest', ['#4a9df0', '#2a2a2e']),
  cosmetic('wizard-hat', 'Wizard Hat', 'hat', 'epic', 'chest', ['#a66bf0', '#5b3a9d']),
  cosmetic('pixel-crown', 'Pixel Crown', 'hat', 'legendary', 'milestone', ['#f2b631']),
  cosmetic('cape-red', 'Red Cape', 'cape', 'common', 'chest', ['#d64545']),
  cosmetic('cape-blue', 'Blue Cape', 'cape', 'common', 'chest', ['#3a66c8']),
  cosmetic('cape-night', 'Night Cape', 'cape', 'rare', 'chest', ['#20234f', '#f0f0f0'], 'star dots'),
  cosmetic('cape-flame', 'Flame Cape', 'cape', 'epic', 'chest', ['#e8833a', '#e8c33a'], 'orange to yellow'),
  cosmetic('cape-rainbow', 'Rainbow Cape', 'cape', 'legendary', 'milestone', ['#d64545', '#e8c33a', '#4caf50', '#3a66c8', '#8a5cd6']),
  cosmetic('pixel-wings', 'Pixel Wings', 'cape', 'legendary', 'milestone', ['#f0f0f0', '#a66bf0']),
  cosmetic('face-stripes', 'Battle Stripes', 'face', 'common', 'chest', ['#d64545']),
  cosmetic('sunglasses', 'Cool Shades', 'face', 'rare', 'chest', ['#2a2a2e']),
  cosmetic('hair-gold', 'Gold Hair', 'hairFx', 'rare', 'chest', ['#f2b631']),
  cosmetic('hair-galaxy', 'Galaxy Hair', 'hairFx', 'epic', 'chest', ['#8a5cd6', '#e06aa8'], 'purple to pink'),
  cosmetic('trail-leaf', 'Leaf Trail', 'trail', 'common', 'chest', ['#4caf50']),
  cosmetic('trail-sparkle', 'Sparkle Trail', 'trail', 'rare', 'chest', ['#f2b631', '#f0f0f0']),
  cosmetic('title-folder-finder', 'Folder Finder', 'title', 'rare', 'award', ['#4a9df0']),
  cosmetic('title-shortcut-ninja', 'Shortcut Ninja', 'title', 'rare', 'award', ['#4a9df0']),
  cosmetic('title-scam-spotter', 'Scam Spotter', 'title', 'rare', 'award', ['#4a9df0']),
  cosmetic('title-champion', 'Pack 1 Champion', 'title', 'legendary', 'milestone', ['#f2b631']),
];

export const LESSON_AWARDS = {
  g1: { item: 'start-blade', titles: [] }, g2: { item: 'taskbar-boots', titles: [] },
  g3: { item: 'folder-backpack', titles: [] }, g4: { item: 'rename-rune', titles: ['title-folder-finder'] },
  g5: { item: 'stop-sign-shield', titles: ['title-scam-spotter', 'title-shortcut-ninja'] },
  s1: { item: 'switch-sword', titles: [] }, s2: { item: 'save-stone', titles: ['title-folder-finder'] },
  s3: { item: 'undo-amulet', titles: [] }, s4: { item: 'copy-crystal-staff', titles: ['title-shortcut-ninja'] },
  s5: { item: 'scam-spotter-helmet', titles: ['title-scam-spotter'] },
};

export const TRACK_LESSONS = { guided: ['g1', 'g2', 'g3', 'g4', 'g5'], standard: ['s1', 's2', 's3', 's4', 's5'] };
export const SETS = { guided: { id: 'pathfinder', name: 'Pathfinder Set' }, standard: { id: 'commander', name: 'Commander Set' } };
export const RANKS = [
  { passed: 0, name: 'Rookie', rarity: 'common' }, { passed: 1, name: 'Apprentice', rarity: 'common' },
  { passed: 2, name: 'Scout', rarity: 'rare' }, { passed: 3, name: 'Adventurer', rarity: 'rare' },
  { passed: 4, name: 'Knight', rarity: 'epic' }, { passed: 5, name: 'Champion', rarity: 'legendary' },
];
export const LEGENDARY_CHOICES = ['pixel-crown', 'cape-rainbow', 'pixel-wings'];
export const GEMS = { chestOpen: 20, chestAllFirstTry: 10, chestHalfFirstTry: 5, practice: 10, battlePer5: 1, battleMax: 10, typingBest: 5, duplicate: 15, max: 99999 };
export const CHEST_ODDS = { common: 0.6, rare: 0.3, epic: 0.1 };
export const BASE_HEARTS = 5;

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.keys(value).forEach((key) => deepFreeze(value[key]));
  return Object.freeze(value);
}

[
  ITEMS, COSMETICS, LOOK_OPTIONS, DEFAULT_LOOK, RANKS, SETS, LESSON_AWARDS, TRACK_LESSONS,
  GEMS, CHEST_ODDS, RARITY, BARE_HANDS, LEGENDARY_CHOICES, GEAR_SLOTS, COSMETIC_LAYERS,
].forEach(deepFreeze);

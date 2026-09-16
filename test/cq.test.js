import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import * as catalog from '../src/cq/items.js';
import * as character from '../src/cq/character.js';
import {
  CHEST_ODDS, COSMETIC_LAYERS, COSMETICS, DEFAULT_LOOK, GEAR_SLOTS, GEMS, ITEMS,
  LEGENDARY_CHOICES, LESSON_AWARDS, LOOK_OPTIONS, RANKS, TRACK_LESSONS,
} from '../src/cq/items.js';
import {
  addGems, awardLesson, battleGems, buyCosmetic, chestGems, chooseLegendary, emptyEquipped,
  emptyWorn, equip, getCosmetic, getItem, grantCosmetic, grantItem, lockedTrackItems, maxHearts,
  normalizeCq, normalizeLook, packComplete, passedForTrack, randomLook, rankFor, rollChest, setProgress,
  spendGems, takeOff, traderStock, unequip, wear,
} from '../src/cq/character.js';

class MemoryStorage {
  #data = new Map();
  getItem(key) { return this.#data.has(key) ? this.#data.get(key) : null; }
  setItem(key, value) { this.#data.set(key, String(value)); }
  removeItem(key) { this.#data.delete(key); }
  clear() { this.#data.clear(); }
}

const known = (collection, id) => collection.some((entry) => entry.id === id);
const base = (track = 'guided') => normalizeCq({ track });

assert.strictEqual(ITEMS.length, 10);
assert.deepStrictEqual(Object.keys(CHEST_ODDS), ['common', 'rare', 'epic']);
ITEMS.forEach((item) => {
  assert.strictEqual(typeof item.battle.kind, 'string');
  if (item.battle.key) assert(item.effect.includes(`Press ${item.battle.key}`), `${item.id} must teach its battle key`);
});
assert.strictEqual(getItem('copy-crystal-staff').effect, 'Press E to fire two 1-damage bolts.');
assert.strictEqual(getItem('start-blade').flavor, 'A wooden sword with a glowing four-square pommel. Every hero starts somewhere.');
assert.deepStrictEqual(DEFAULT_LOOK, {
  skin: 's2', hairStyle: 'swoop', hairColor: 'black', eyeColor: 'brown', shirtStyle: 'hoodie',
  shirtColor: 'orange', pantsColor: 'black', shoesColor: 'red',
});
assert.strictEqual(getItem('rename-rune').flavor, 'Rename a monster "Chicken" and, poof, it\'s a harmless chicken for 3 seconds.');
assert.strictEqual(getItem('rename-rune').battle.key, 'E');
assert.deepStrictEqual(
  getItem('copy-crystal-staff').battle,
  { kind: 'ranged', key: 'E', dmg: 1, twinDmg: 1, cooldown: 0.5, range: 6 }
);
assert.strictEqual(getItem('copy-crystal-staff').slot, 'offHand');
['pixel-crown', 'cape-rainbow', 'pixel-wings', 'title-champion'].forEach((id) => {
  assert.strictEqual(getCosmetic(id).pool, 'milestone');
});
['title-folder-finder', 'title-shortcut-ninja', 'title-scam-spotter'].forEach((id) => {
  assert.strictEqual(getCosmetic(id).pool, 'award');
});
assert.deepStrictEqual(
  ['cape-night', 'cape-flame', 'hair-galaxy'].map((id) => getCosmetic(id).note),
  ['star dots', 'orange to yellow', 'purple to pink']
);
Object.values(LESSON_AWARDS).forEach((award) => {
  assert(getItem(award.item));
  award.titles.forEach((id) => assert(getCosmetic(id)));
});
COSMETICS.forEach((cosmetic) => {
  assert(COSMETIC_LAYERS.includes(cosmetic.layer));
  assert(['common', 'rare', 'epic', 'legendary'].includes(cosmetic.rarity));
  assert(['chest', 'milestone', 'award'].includes(cosmetic.pool));
  assert.deepStrictEqual(cosmetic.price, cosmetic.pool === 'chest' ? ({ common: 40, rare: 80, epic: 160 })[cosmetic.rarity] : null);
  assert(!/["(→]/.test(cosmetic.name));
});
Object.keys(LOOK_OPTIONS).forEach((field) => {
  const ids = LOOK_OPTIONS[field].map((option) => option.id);
  assert.strictEqual(new Set(ids).size, ids.length);
  assert(known(LOOK_OPTIONS[field], DEFAULT_LOOK[field]));
});
assert.deepStrictEqual(Object.keys(emptyEquipped()), GEAR_SLOTS);
assert.deepStrictEqual(Object.keys(emptyWorn()), COSMETIC_LAYERS);

assert.strictEqual(normalizeLook(null), null);
assert.deepStrictEqual(normalizeLook({ skin: 's1', shirtColor: 'nope' }), { ...DEFAULT_LOOK, skin: 's1' });
const fallbackLook = normalizeLook({});
fallbackLook.skin = 's1';
assert.strictEqual(fallbackLook.skin, 's1');
const mutableCq = normalizeCq({ track: 'guided' });
mutableCq.equipped.head = 'scam-spotter-helmet';
assert.strictEqual(mutableCq.equipped.head, 'scam-spotter-helmet');
let seed = 1;
const seeded = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
for (let i = 0; i < 200; i += 1) {
  const look = randomLook(seeded);
  Object.keys(LOOK_OPTIONS).forEach((field) => assert(known(LOOK_OPTIONS[field], look[field])));
}
for (const value of [NaN, undefined, -1, 1, 5]) {
  const look = randomLook(() => value);
  Object.keys(LOOK_OPTIONS).forEach((field) => assert(known(LOOK_OPTIONS[field], look[field])));
}

const garbage = normalizeCq({
  track: 'guided', look: { skin: 'wrong' }, owned: ['start-blade', 'start-blade', 2, 'missing'],
  equipped: { mainHand: 'start-blade', magic1: 'rename-rune', magic2: 'rename-rune', feet: 'start-blade' },
  cosmetics: ['cap-red', 'cap-red', 'title-folder-finder', 'bad'],
  worn: { hat: 'cap-red', cape: 'cap-red', title: 'title-folder-finder' }, gems: -5,
  lessonsPassed: ['g5', 'g1', 'bad', 's1', 'g1'], legendaryChoice: 'pixel-crown',
});
assert.deepStrictEqual(garbage.owned, ['start-blade']);
assert.deepStrictEqual(garbage.equipped, { ...emptyEquipped(), mainHand: 'start-blade' });
assert.deepStrictEqual(garbage.worn, { ...emptyWorn(), hat: 'cap-red', title: 'title-folder-finder' });
assert.strictEqual(garbage.gems, 0);
assert.deepStrictEqual(garbage.lessonsPassed, ['g1', 'g5', 's1']);
assert.strictEqual(garbage.legendaryChoice, null);
assert.strictEqual(normalizeCq({ gems: 1e9 }).gems, GEMS.max);
assert.strictEqual(normalizeCq({ gems: 'x' }).gems, 0);
assert.deepStrictEqual(normalizeCq(['nope']).owned, []);
assert.deepStrictEqual(normalizeCq(12).owned, []);
assert.deepStrictEqual(normalizeCq('nope').owned, []);
const magicLegacy = normalizeCq({ track: 'guided', owned: ['rename-rune'], equipped: { magic1: 'rename-rune', magic2: 'rename-rune' } });
assert.strictEqual(magicLegacy.equipped.magic1, 'rename-rune');
assert.strictEqual(magicLegacy.equipped.magic2, null);

const equipInput = grantItem(base(), 'start-blade');
const beforeEquip = JSON.stringify(equipInput);
let hero = equip(equipInput, 'start-blade');
assert.strictEqual(hero.equipped.mainHand, 'start-blade');
assert.strictEqual(JSON.stringify(equipInput), beforeEquip);
assert.deepStrictEqual(unequip(hero, 'mainHand').equipped, emptyEquipped());
assert.throws(() => equip(base(), 'start-blade'), /not owned/);
assert.throws(() => equip(hero, 'start-blade', 'head'), /cannot use/);
let mage = grantItem(grantItem(base(), 'rename-rune'), 'start-blade');
mage = equip(mage, 'rename-rune', 'magic2');
const magicNoSlot = equip(mage, 'rename-rune');
assert.deepStrictEqual(magicNoSlot, mage);
assert.notStrictEqual(magicNoSlot, mage);
mage = equip(mage, 'rename-rune', 'magic1');
assert.strictEqual(mage.equipped.magic1, 'rename-rune');
assert.strictEqual(mage.equipped.magic2, null);

let dressed = grantCosmetic(base(), 'cap-red');
dressed = wear(dressed, 'cap-red');
assert.strictEqual(dressed.worn.hat, 'cap-red');
assert.strictEqual(takeOff(dressed, 'hat').worn.hat, null);
assert.throws(() => wear(base(), 'cap-red'), /not owned/);
assert.strictEqual(grantItem(hero, 'start-blade').owned.length, 1);
assert.strictEqual(grantCosmetic(dressed, 'cap-red').cosmetics.length, 1);
assert.throws(() => grantItem(base(), 'none'), /unknown/);
assert.throws(() => grantCosmetic(base(), 'none'), /unknown/);

assert.strictEqual(addGems({ ...base(), gems: GEMS.max - 1 }, 100).gems, GEMS.max);
assert.strictEqual(spendGems({ ...base(), gems: 40 }, 40).gems, 0);
assert.throws(() => spendGems({ ...base(), gems: 39 }, 40), /not enough gems/);
assert.throws(() => spendGems({ ...base(), gems: 40 }, 0), /not enough gems/);

const stock = traderStock(grantCosmetic(base(), 'cap-red'));
assert(!stock.some((cosmetic) => cosmetic.id === 'cap-red'));
assert.strictEqual(stock[0].rarity, 'common');
const stockName = stock[0].name;
assert.throws(() => { stock[0].name = 'Changed'; }, TypeError);
assert.strictEqual(COSMETICS.find((cosmetic) => cosmetic.id === stock[0].id).name, stockName);
const bought = buyCosmetic({ ...base(), gems: 40 }, 'cap-red');
assert.strictEqual(bought.gems, 0);
assert(bought.cosmetics.includes('cap-red'));
assert.throws(() => buyCosmetic(bought, 'cap-red'));
assert.throws(() => buyCosmetic({ ...base(), gems: 999 }, 'pixel-crown'));
assert.throws(() => buyCosmetic(base(), 'cap-red'), /not enough gems/);

const chestInput = base();
const chestBefore = JSON.stringify(chestInput);
let rolls = [0.0, 0.0];
let chest = rollChest(chestInput, () => rolls.shift());
assert.strictEqual(chest.cosmetic, 'face-stripes');
assert.strictEqual(JSON.stringify(chestInput), chestBefore);
const allEpic = COSMETICS.filter((cosmetic) => cosmetic.pool === 'chest' && cosmetic.rarity === 'epic').map((cosmetic) => cosmetic.id);
const noEpic = normalizeCq({ track: 'guided', cosmetics: allEpic });
rolls = [0.95, 0.0];
chest = rollChest(noEpic, () => rolls.shift());
assert.strictEqual(getCosmetic(chest.cosmetic).rarity, 'rare');
const allChest = COSMETICS.filter((cosmetic) => cosmetic.pool === 'chest').map((cosmetic) => cosmetic.id);
chest = rollChest({ ...base(), cosmetics: allChest }, () => 0);
assert.deepStrictEqual({ cosmetic: chest.cosmetic, gems: chest.gems, cqGems: chest.cq.gems }, { cosmetic: null, gems: 15, cqGems: 15 });
for (const value of [NaN, undefined, -1, 1, 5]) {
  chest = rollChest(base(), () => value);
  assert(getCosmetic(chest.cosmetic));
}
rolls = [0.8999999999999999, 0];
assert.strictEqual(getCosmetic(rollChest(base(), () => rolls.shift()).cosmetic).rarity, 'rare');
rolls = [0.9, 0];
assert.strictEqual(getCosmetic(rollChest(base(), () => rolls.shift()).cosmetic).rarity, 'epic');

assert.strictEqual(chestGems({ firstTryCorrect: 2, total: 2 }), 30);
assert.strictEqual(chestGems({ firstTryCorrect: 1, total: 2 }), 25);
assert.strictEqual(chestGems({ firstTryCorrect: 0, total: 2 }), 20);
assert.strictEqual(chestGems({ firstTryCorrect: 3, total: 3 }), 30);
assert.strictEqual(chestGems({ firstTryCorrect: 2, total: 3 }), 25);
assert.strictEqual(chestGems({ firstTryCorrect: 1, total: 3 }), 20);
assert.strictEqual(battleGems(49), 9);
assert.strictEqual(battleGems(500), 10);

let awards = base();
let award = awardLesson(awards, 'g4');
assert.strictEqual(award.item, 'rename-rune');
assert.deepStrictEqual(award.titles, ['title-folder-finder']);
awards = award.cq;
award = awardLesson(awards, 'g1');
assert.deepStrictEqual(award.cq.lessonsPassed, ['g1', 'g4']);
assert.strictEqual(awardLesson(award.cq, 'g1').alreadyPassed, true);
assert.deepStrictEqual(awardLesson(award.cq, 's1'), { cq: award.cq, item: null, titles: [], alreadyPassed: false });
assert.strictEqual(lockedTrackItems(award.cq).length, 3);

const crossTrack = normalizeCq({ track: 'standard', lessonsPassed: ['g1', 's1', 's2'] });
assert.deepStrictEqual(crossTrack.lessonsPassed, ['g1', 's1', 's2']);
assert.deepStrictEqual(passedForTrack(crossTrack), ['s1', 's2']);
assert.strictEqual(rankFor(crossTrack).name, 'Scout');
assert.strictEqual(packComplete({ ...crossTrack, lessonsPassed: ['g1', ...TRACK_LESSONS.standard] }), true);

for (let passed = 0; passed <= 5; passed += 1) {
  assert.strictEqual(rankFor({ track: 'guided', lessonsPassed: TRACK_LESSONS.guided.slice(0, passed) }), RANKS[passed]);
}
let setHero = base();
TRACK_LESSONS.guided.forEach((lesson) => { setHero = grantItem(setHero, ITEMS.find((item) => item.lesson === lesson).id); });
assert.deepStrictEqual(setProgress(setHero), { id: 'pathfinder', name: 'Pathfinder Set', have: 0, total: 5, active: false });
for (const track of ['guided', 'standard']) {
  let trackHero = base(track);
  const trackItems = TRACK_LESSONS[track].map((lesson) => ITEMS.find((item) => item.lesson === lesson));
  trackItems.forEach((item) => { trackHero = grantItem(trackHero, item.id); });
  trackItems.forEach((item) => {
    const magicSlot = item.slot === 'magic' ? (trackHero.equipped.magic1 ? 'magic2' : 'magic1') : undefined;
    trackHero = equip(trackHero, item.id, magicSlot);
  });
  assert.strictEqual(new Set(Object.values(trackHero.equipped).filter(Boolean)).size, 5);
  assert.strictEqual(setProgress(trackHero).active, true);
  assert.strictEqual(maxHearts(trackHero), 6);
  if (track === 'guided') setHero = trackHero;
}
assert.strictEqual(setProgress(base(null)), null);
assert.strictEqual(packComplete(setHero), false);
assert.throws(() => chooseLegendary(setHero, 'pixel-crown'), /not complete/);
let champion = { ...setHero, lessonsPassed: [...TRACK_LESSONS.guided] };
assert(packComplete(champion));
assert.throws(() => chooseLegendary(champion, 'cap-red'), /invalid/);
champion = chooseLegendary(champion, LEGENDARY_CHOICES[0]);
assert.strictEqual(champion.legendaryChoice, 'pixel-crown');
assert(champion.cosmetics.includes('title-champion'));
assert.throws(() => chooseLegendary(champion, 'cape-rainbow'), /already chosen/);

globalThis.localStorage = new MemoryStorage();
globalThis.sessionStorage = new MemoryStorage();
const progress = await import('../src/progress.js');
localStorage.setItem('codequest-v1', JSON.stringify({
  profiles: [{ id: 'old', name: 'Old', cq: { track: 'standard' } }], active: 'old',
}));
assert.deepStrictEqual(progress.getCq('old'), base('standard'));
const changed = progress.updateCq('old', (cq) => grantItem(cq, 'switch-sword'));
assert(changed.owned.includes('switch-sword'));
assert(progress.getCq('old').owned.includes('switch-sword'));
assert.throws(() => progress.updateCq('missing', (cq) => cq), /profile not found/);
const saved = JSON.stringify(progress.getCq('old'));
assert.throws(() => progress.updateCq('old', () => { throw new Error('stop'); }), /stop/);
assert.strictEqual(JSON.stringify(progress.getCq('old')), saved);
assert.throws(() => progress.updateCq('old', () => []), /updateCq mutator must return a cq object/);
assert.strictEqual(JSON.stringify(progress.getCq('old')), saved);
const standardPassed = progress.updateCq('old', (cq) => ({ ...cq, lessonsPassed: ['s1'] }));
assert.deepStrictEqual(standardPassed.lessonsPassed, ['s1']);
progress.setTrack('old', 'guided');
progress.setTrack('old', 'standard');
assert.deepStrictEqual(progress.getCq('old').lessonsPassed, ['s1']);
assert.strictEqual(rankFor(progress.getCq('old')).name, 'Apprentice');
progress.importData(JSON.stringify({
  profiles: [{ id: 'garbage', cq: { track: 'guided', owned: ['bad', 'start-blade'], equipped: { head: 'start-blade' }, gems: 'bad' } }], active: 'garbage',
}));
assert.deepStrictEqual(progress.getCq('garbage').owned, ['start-blade']);
assert.strictEqual(progress.getCq('garbage').equipped.head, null);
assert.strictEqual(progress.getCq('garbage').gems, 0);

// Execute the UI's real markup functions without starting a browser or a profile session.
const uiSource = readFileSync(new URL('../src/cq/ui.js', import.meta.url), 'utf8')
  .replace(/^import[\s\S]*?;\n/gm, '').replace(/import\.meta\.env\.DEV/g, 'false');
function uiMarkup(expression, state = base(), overrides = {}) {
  return runInNewContext(`${uiSource}\ncq = testState; draft = { ...DEFAULT_LOOK }; ${expression}`, {
    ...catalog, ...character, ...overrides, testState: state,
    getActiveProfile: () => null, requireUnlockedProfile: () => null, document: { getElementById: () => ({}) },
    window: { matchMedia: () => ({ matches: true }) }, sessionStorage: new MemoryStorage(),
    location: { replace() {} },
  });
}
const editorMarkup = uiMarkup('editor(true)');
for (const label of ['Hair color: brown', 'Eye color: brown', 'Shirt color: blue', 'Pants: denim', 'Shoes: red', 'Skin tone 3', 'Swoop', 'Hoodie']) {
  assert(editorMarkup.includes(`aria-label="${label}"`), `Missing accessible option: ${label}`);
}
assert(uiMarkup('hero(true)').includes('HERO PREVIEW'));
assert(uiMarkup('hero(false)').includes('YOUR HERO'));
assert(!uiMarkup('hero(false)').includes('COMPUTER QUEST'));
assert(uiMarkup('hero(false)', setHero).includes(`+${maxHearts(setHero) - catalog.BASE_HEARTS} heart`));
assert(uiMarkup('hero(false)', setHero, { maxHearts: () => catalog.BASE_HEARTS + 3 }).includes('+3 hearts'), 'Heart text follows the character API');
for (const id of ['start-blade', 'copy-crystal-staff']) {
  const item = { ...getItem(id), flavor: 'Catalog flavor <new>', effect: 'Catalog effect <new>' };
  const markup = uiMarkup(`itemDetails(${JSON.stringify(item)})`);
  assert(markup.includes('Catalog flavor &#60;new&#62;'));
  assert(markup.includes('Catalog effect &#60;new&#62;'));
}

console.log('ok — Computer Quest catalog, pure character logic, storage normalization, and loot rules pass');

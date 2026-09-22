import {
  BASE_HEARTS, CHEST_ODDS, COSMETIC_LAYERS, COSMETICS, DEFAULT_LOOK, GEAR_SLOTS, GEMS,
  ITEMS, LEGENDARY_CHOICES, LESSON_AWARDS, LOOK_OPTIONS, RANKS, SETS, TRACK_LESSONS,
} from './items.js';
import { normalizeLessons, normalizeWindows } from './lesson-state.js';
import { normalizeTyping } from './typing/state.js';
import { normalizeDailyWork } from './daily-work/state.js';

const validTracks = ['guided', 'standard'];
const allLessons = [...TRACK_LESSONS.guided, ...TRACK_LESSONS.standard];
const itemById = new Map(ITEMS.map((item) => [item.id, item]));
const cosmeticById = new Map(COSMETICS.map((cosmetic) => [cosmetic.id, cosmetic]));

const uniqueKnown = (value, known) => {
  const result = [];
  if (!Array.isArray(value)) return result;
  value.forEach((id) => {
    if (typeof id === 'string' && known.has(id) && !result.includes(id)) result.push(id);
  });
  return result;
};

export const getItem = (id) => itemById.get(id) ?? null;
export const getCosmetic = (id) => cosmeticById.get(id) ?? null;

export function normalizeLook(value) {
  if (value == null) return null;
  const look = {};
  Object.keys(DEFAULT_LOOK).forEach((field) => {
    const valid = LOOK_OPTIONS[field].some((option) => option.id === value?.[field]);
    look[field] = valid ? value[field] : DEFAULT_LOOK[field];
  });
  return look;
}

function rngRoll(rng) {
  const value = rng();
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return 0;
  return Math.min(1 - Number.EPSILON, value);
}

function randomOption(options, rng) {
  const index = Math.min(options.length - 1, Math.floor(rngRoll(rng) * options.length));
  return options[index].id;
}

export function randomLook(rng = Math.random) {
  const look = {};
  Object.keys(DEFAULT_LOOK).forEach((field) => { look[field] = randomOption(LOOK_OPTIONS[field], rng); });
  return look;
}

export const emptyEquipped = () => Object.fromEntries(GEAR_SLOTS.map((slot) => [slot, null]));
export const emptyWorn = () => Object.fromEntries(COSMETIC_LAYERS.map((layer) => [layer, null]));

export function slotAccepts(slot, item) {
  if (!item || !GEAR_SLOTS.includes(slot)) return false;
  if (slot === 'magic1' || slot === 'magic2') return item.slot === 'magic';
  return item.slot === slot;
}

export function normalizeCq(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const track = validTracks.includes(source.track) ? source.track : null;
  const owned = uniqueKnown(source.owned, itemById);
  const cosmetics = uniqueKnown(source.cosmetics, cosmeticById);
  const equipped = emptyEquipped();
  const equippedIds = [];
  GEAR_SLOTS.forEach((slot) => {
    const id = source.equipped?.[slot];
    const item = getItem(id);
    if (owned.includes(id) && slotAccepts(slot, item) && !equippedIds.includes(id)) {
      equipped[slot] = id;
      equippedIds.push(id);
    }
  });
  const worn = emptyWorn();
  COSMETIC_LAYERS.forEach((layer) => {
    const id = source.worn?.[layer];
    const cosmetic = getCosmetic(id);
    if (cosmetics.includes(id) && cosmetic?.layer === layer) worn[layer] = id;
  });
  const gems = Number.isFinite(source.gems) ? Math.max(0, Math.min(GEMS.max, Math.floor(source.gems))) : 0;
  const listedLessons = Array.isArray(source.lessonsPassed) ? source.lessonsPassed : [];
  const lessonsPassed = allLessons.filter((id) => listedLessons.includes(id));
  const legendaryChoice = LEGENDARY_CHOICES.includes(source.legendaryChoice) && cosmetics.includes(source.legendaryChoice)
    ? source.legendaryChoice : null;
  return {
    track, look: normalizeLook(source.look), owned, equipped, cosmetics, worn, gems, lessonsPassed, legendaryChoice,
    windows: normalizeWindows(source.windows), lessons: normalizeLessons(source.lessons),
    typing: normalizeTyping(source.typing),
    dailyWork: normalizeDailyWork(source.dailyWork),
  };
}

export function passedForTrack(cq) {
  const normalized = normalizeCq(cq);
  return normalized.track ? TRACK_LESSONS[normalized.track].filter((id) => normalized.lessonsPassed.includes(id)) : [];
}

export function trackItems(track) {
  if (!validTracks.includes(track)) return [];
  return TRACK_LESSONS[track].map((lesson) => ITEMS.find((item) => item.lesson === lesson));
}

export function lockedTrackItems(cq) {
  const normalized = normalizeCq(cq);
  return trackItems(normalized.track)
    .filter((item) => !normalized.owned.includes(item.id))
    .map((item) => ({ item, lesson: item.lesson }));
}

export function equip(cq, itemId, slot) {
  const normalized = normalizeCq(cq);
  const item = getItem(itemId);
  if (!item || !normalized.owned.includes(itemId)) throw new Error('item is not owned');
  let target = slot;
  if (target == null) {
    if (Object.values(normalized.equipped).includes(itemId)) return normalized;
    if (item.slot === 'magic') target = normalized.equipped.magic1 ? (normalized.equipped.magic2 ? 'magic1' : 'magic2') : 'magic1';
    else target = item.slot;
  }
  if (!slotAccepts(target, item)) throw new Error('item cannot use this slot');
  const equipped = { ...normalized.equipped, [target]: itemId };
  if (item.slot === 'magic') {
    const other = target === 'magic1' ? 'magic2' : 'magic1';
    if (equipped[other] === itemId) equipped[other] = null;
  }
  return { ...normalized, equipped };
}

export function unequip(cq, slot) {
  const normalized = normalizeCq(cq);
  if (!GEAR_SLOTS.includes(slot)) return normalized;
  return { ...normalized, equipped: { ...normalized.equipped, [slot]: null } };
}

export function wear(cq, cosmeticId) {
  const normalized = normalizeCq(cq);
  const cosmetic = getCosmetic(cosmeticId);
  if (!cosmetic || !normalized.cosmetics.includes(cosmeticId)) throw new Error('cosmetic is not owned');
  return { ...normalized, worn: { ...normalized.worn, [cosmetic.layer]: cosmeticId } };
}

export function takeOff(cq, layer) {
  const normalized = normalizeCq(cq);
  if (!COSMETIC_LAYERS.includes(layer)) return normalized;
  return { ...normalized, worn: { ...normalized.worn, [layer]: null } };
}

export function grantItem(cq, id) {
  const normalized = normalizeCq(cq);
  if (!getItem(id)) throw new Error('unknown item');
  return normalized.owned.includes(id) ? normalized : { ...normalized, owned: [...normalized.owned, id] };
}

export function grantCosmetic(cq, id) {
  const normalized = normalizeCq(cq);
  if (!getCosmetic(id)) throw new Error('unknown cosmetic');
  return normalized.cosmetics.includes(id) ? normalized : { ...normalized, cosmetics: [...normalized.cosmetics, id] };
}

export function addGems(cq, amount) {
  const normalized = normalizeCq(cq);
  const n = Number.isFinite(amount) ? Math.floor(amount) : 0;
  return { ...normalized, gems: Math.max(0, Math.min(GEMS.max, normalized.gems + n)) };
}

export function spendGems(cq, amount) {
  const normalized = normalizeCq(cq);
  if (!Number.isInteger(amount) || amount <= 0 || normalized.gems < amount) throw new Error('not enough gems');
  return { ...normalized, gems: normalized.gems - amount };
}

const rarityOrder = { common: 0, rare: 1, epic: 2 };

export function traderStock(cq) {
  const normalized = normalizeCq(cq);
  return COSMETICS.filter((cosmetic) => cosmetic.pool === 'chest' && !normalized.cosmetics.includes(cosmetic.id))
    .sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity] || a.name.localeCompare(b.name));
}

export function buyCosmetic(cq, id) {
  const normalized = normalizeCq(cq);
  const cosmetic = getCosmetic(id);
  if (!cosmetic || cosmetic.pool !== 'chest' || normalized.cosmetics.includes(id)) throw new Error('cosmetic cannot be bought');
  return grantCosmetic(spendGems(normalized, cosmetic.price), id);
}

export function rollChest(cq, rng = Math.random) {
  const normalized = normalizeCq(cq);
  const roll = rngRoll(rng);
  const rarity = roll < 0.6 ? 'common' : roll < 0.9 ? 'rare' : 'epic';
  let choices = traderStock(normalized).filter((cosmetic) => cosmetic.rarity === rarity);
  if (!choices.length) {
    ['epic', 'rare', 'common'].some((fallback) => {
      choices = traderStock(normalized).filter((cosmetic) => cosmetic.rarity === fallback);
      return choices.length > 0;
    });
  }
  if (!choices.length) return { cq: addGems(normalized, GEMS.duplicate), cosmetic: null, gems: GEMS.duplicate };
  const index = Math.min(choices.length - 1, Math.floor(rngRoll(rng) * choices.length));
  const cosmetic = choices[index].id;
  return { cq: grantCosmetic(normalized, cosmetic), cosmetic, gems: 0 };
}

export function chestGems({ firstTryCorrect, total }) {
  const correct = Number.isFinite(firstTryCorrect) ? firstTryCorrect : 0;
  const questions = Number.isFinite(total) ? total : 0;
  return GEMS.chestOpen + (questions > 0 && correct >= questions ? GEMS.chestAllFirstTry : questions > 0 && correct * 2 >= questions ? GEMS.chestHalfFirstTry : 0);
}

export const battleGems = (poofs) => Math.min(GEMS.battleMax, Math.floor(Math.max(0, Number(poofs) || 0) / 5) * GEMS.battlePer5);

export function awardLesson(cq, lessonId) {
  const normalized = normalizeCq(cq);
  const allowed = normalized.track ? TRACK_LESSONS[normalized.track] : [];
  if (!allowed.includes(lessonId)) return { cq: normalized, item: null, titles: [], alreadyPassed: false };
  if (passedForTrack(normalized).includes(lessonId)) return { cq: normalized, item: null, titles: [], alreadyPassed: true };
  const award = LESSON_AWARDS[lessonId];
  let next = grantItem(normalized, award.item);
  award.titles.forEach((id) => { next = grantCosmetic(next, id); });
  next = { ...next, lessonsPassed: allLessons.filter((id) => [...next.lessonsPassed, lessonId].includes(id)) };
  return { cq: next, item: award.item, titles: [...award.titles], alreadyPassed: false };
}

export function rankFor(cq) {
  const count = Math.min(5, passedForTrack(cq).length);
  return RANKS[count];
}

export function setProgress(cq) {
  const normalized = normalizeCq(cq);
  if (!normalized.track) return null;
  const items = trackItems(normalized.track);
  const equipped = Object.values(normalized.equipped);
  const have = items.filter((item) => equipped.includes(item.id)).length;
  return { id: SETS[normalized.track].id, name: SETS[normalized.track].name, have, total: 5, active: have === 5 };
}

export const maxHearts = (cq) => BASE_HEARTS + (setProgress(cq)?.active ? 1 : 0);
export const packComplete = (cq) => {
  const normalized = normalizeCq(cq);
  return Boolean(normalized.track && passedForTrack(normalized).length === TRACK_LESSONS[normalized.track].length);
};

export function chooseLegendary(cq, id) {
  const normalized = normalizeCq(cq);
  if (!packComplete(normalized)) throw new Error('pack is not complete');
  if (normalized.legendaryChoice) throw new Error('legendary already chosen');
  if (!LEGENDARY_CHOICES.includes(id)) throw new Error('invalid legendary choice');
  let next = grantCosmetic(normalized, id);
  next = grantCosmetic(next, 'title-champion');
  return { ...next, legendaryChoice: id };
}

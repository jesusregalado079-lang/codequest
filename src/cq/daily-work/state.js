import { DAILY_WORK } from './content.js';
import { isValidIso } from '../iso.js';

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const STATUSES = ['unanswered', 'answered', 'correct', 'wrong'];
const COIN_DENOMS = ['penny', 'nickel', 'dime', 'quarter', 'dollar-bill'];
const WEEK_IDS = new Set(Object.values(DAILY_WORK).flatMap((track) => Object.keys(track.weeks)));
const FILL_BLANK_KEYS = new Set();
Object.values(DAILY_WORK).forEach((track) => Object.values(track.weeks).forEach((week) => {
  const sheets = [...week.weekItems, ...DAY_KEYS.reduce((all, dayKey) => all.concat(week.days[dayKey].sheets), [])];
  sheets.forEach((sheet) => sheet.items.forEach((item) => {
    if (item.kind === 'fill-blank') FILL_BLANK_KEYS.add(`${sheet.id}:${item.id}`);
  }));
}));
// Multiple-choice items store the picked LETTER. Saved state is not trusted: a value that is not a letter the
// authored item really has is dropped on load, so junk can never count as an answer. The key includes the week,
// day and sheet (sheet ids repeat across days); a count of -1 means two tracks author different kinds under the
// same key, and then nothing is validated rather than risk dropping a real answer.
const CHOICE_LETTERS = 'ABCDE';
const CHOICE_COUNTS = new Map();
const choiceKey = (weekId, dayKey, sheetId, itemId) => `${weekId}|${dayKey}|${sheetId}|${itemId}`;
Object.values(DAILY_WORK).forEach((track) => Object.keys(track.weeks).forEach((weekId) => {
  DAY_KEYS.forEach((dayKey) => track.weeks[weekId].days[dayKey].sheets.forEach((sheet) => sheet.items.forEach((item) => {
    const key = choiceKey(weekId, dayKey, sheet.id, item.id);
    const count = item.kind === 'multiple-choice' && Array.isArray(item.choices) ? item.choices.length : 0;
    CHOICE_COUNTS.set(key, CHOICE_COUNTS.has(key) && CHOICE_COUNTS.get(key) !== count ? -1 : count);
  })));
}));
const validChoiceValue = (value, count) => typeof value === 'string' && value.length === 1
  && CHOICE_LETTERS.indexOf(value) >= 0 && CHOICE_LETTERS.indexOf(value) < Math.min(count, CHOICE_LETTERS.length);
const object = (value) => value && typeof value === 'object' && !Array.isArray(value)
  && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null) ? value : {};
const iso = (value) => (isValidIso(value) ? value : null);
const safeKey = (value) => typeof value === 'string' && value.length > 0 && value.length <= 100
  && value !== '__proto__' && value !== 'constructor' && value !== 'prototype';
const has = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const string = (value) => typeof value === 'string' ? value.slice(0, 2000) : null;
const number = (value) => typeof value === 'number' && Number.isFinite(value) ? value : null;
const clampInt = (value, min, max) => Math.min(max, Math.max(min, Math.floor(value)));

function coinCounts(value) {
  const source = object(value);
  const result = {};
  COIN_DENOMS.forEach((denom) => {
    if (has(source, denom) && Number.isInteger(source[denom]) && source[denom] >= 0) {
      result[denom] = clampInt(source[denom], 0, 99);
    }
  });
  return result;
}

function itemValue(value, allowBlankArray) {
  if (value === null) return null;
  if (allowBlankArray && Array.isArray(value) && value.every((entry) => entry === null || typeof entry === 'string')) {
    return value.map((entry) => entry === null ? null : entry.slice(0, 2000));
  }
  const text = string(value);
  if (text !== null) return text;
  const numeric = number(value);
  if (numeric !== null) return numeric;
  if (value && typeof value === 'object' && !Array.isArray(value)) return coinCounts(value);
  return null;
}

function normalizeItems(value, sheetId, weekId, dayKey) {
  const source = object(value);
  const result = {};
  Object.keys(source).forEach((itemId) => {
    if (!safeKey(itemId)) return;
    const item = object(source[itemId]);
    const entry = {
      value: itemValue(item.value, FILL_BLANK_KEYS.has(`${sheetId}:${itemId}`)), status: STATUSES.includes(item.status) ? item.status : 'unanswered', checkedAt: iso(item.checkedAt),
    };
    const choices = CHOICE_COUNTS.get(choiceKey(weekId, dayKey, sheetId, itemId)) || 0;
    // A saved value that is not one of this item's letters is dropped, and the item goes back to unanswered.
    // A null value is fine when the item is untouched or a parent marked it wrong so it can be redone; but a
    // null value still marked answered/correct (what junk like an array or `true` normalizes to) is not a pick.
    const junk = entry.value === null ? entry.status === 'answered' || entry.status === 'correct' : !validChoiceValue(entry.value, choices);
    if (choices > 0 && junk) {
      entry.value = null; entry.status = 'unanswered'; entry.checkedAt = null;
    }
    result[itemId] = entry;
  });
  return result;
}

function normalizeSheets(value, weekId, dayKey) {
  const source = object(value);
  const result = {};
  Object.keys(source).forEach((sheetId) => {
    if (!safeKey(sheetId)) return;
    result[sheetId] = { items: normalizeItems(object(source[sheetId]).items, sheetId, weekId, dayKey) };
  });
  return result;
}

function normalizeDay(value, weekId, dayKey) {
  const source = object(value);
  return { sheets: normalizeSheets(source.sheets, weekId, dayKey), submittedAt: iso(source.submittedAt) };
}

export function emptyDailyWorkState() {
  return { weeks: {} };
}

export function normalizeDailyWork(value) {
  const source = object(value);
  const weeks = {};
  Object.keys(object(source.weeks)).forEach((weekId) => {
    if (!WEEK_IDS.has(weekId)) return;
    const days = {};
    const sourceDays = object(object(object(source.weeks)[weekId]).days);
    DAY_KEYS.forEach((dayKey) => {
      if (has(sourceDays, dayKey)) days[dayKey] = normalizeDay(sourceDays[dayKey], weekId, dayKey);
    });
    weeks[weekId] = { days };
  });
  return { weeks };
}

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

function normalizeItems(value, sheetId) {
  const source = object(value);
  const result = {};
  Object.keys(source).forEach((itemId) => {
    if (!safeKey(itemId)) return;
    const item = object(source[itemId]);
    result[itemId] = {
      value: itemValue(item.value, FILL_BLANK_KEYS.has(`${sheetId}:${itemId}`)), status: STATUSES.includes(item.status) ? item.status : 'unanswered', checkedAt: iso(item.checkedAt),
    };
  });
  return result;
}

function normalizeSheets(value) {
  const source = object(value);
  const result = {};
  Object.keys(source).forEach((sheetId) => {
    if (!safeKey(sheetId)) return;
    result[sheetId] = { items: normalizeItems(object(source[sheetId]).items, sheetId) };
  });
  return result;
}

function normalizeDay(value) {
  const source = object(value);
  return { sheets: normalizeSheets(source.sheets), submittedAt: iso(source.submittedAt) };
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
    const sourceDays = object(object(source.weeks)[weekId]).days;
    DAY_KEYS.forEach((dayKey) => {
      if (has(sourceDays, dayKey)) days[dayKey] = normalizeDay(sourceDays[dayKey]);
    });
    weeks[weekId] = { days };
  });
  return { weeks };
}

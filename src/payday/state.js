// Saving the Payday Helper: normalising what comes back from localStorage (never trust it), and the small pure
// helpers the iPad page uses to start, act on and close paydays. The newest payday is first; at most 30 are kept.
import {
  MAX_EARNED, MAX_REPLACEMENT, canBreak, cleanPieces, conserved, emptyPieces, isPieceId, jarAmounts, selectionFits, smallerIds,
} from './logic.js';
import { PHASES, SCREENS, act, newSession } from './session.js';

export const MAX_SESSIONS = 30;
const QUESTION_KEY = /^(earn|handed|add|spend|(give|save)\.(can|pick|replace|build))$/;
const FEEDBACK_KINDS = ['ok', 'hint', 'diff', 'example', 'stuck'];
const JARS = ['give', 'save', 'spend'];

const object = (value) => (value && typeof value === 'object' && !Array.isArray(value)
  && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null) ? value : {});
const isoLike = (value) => typeof value === 'string' && value.length >= 10 && value.length <= 40 && !Number.isNaN(Date.parse(value));
const text = (value, max = 400) => (typeof value === 'string' ? value.slice(0, max) : '');
const count = (value) => (Number.isInteger(value) && value >= 0 && value <= 100000 ? value : 0);

function normalizeFeedback(value) {
  const f = object(value);
  if (!FEEDBACK_KINDS.includes(f.kind)) return null;
  const out = { kind: f.kind };
  if (typeof f.text === 'string') out.text = text(f.text);
  if (typeof f.key === 'string' && QUESTION_KEY.test(f.key)) out.key = f.key;
  if (f.kind === 'stuck' && !out.key) return null;
  if (f.kind === 'example') {
    out.hint = text(f.hint);
    if (!Array.isArray(f.lines) || !f.lines.length) return null;
    out.lines = f.lines.filter((line) => typeof line === 'string').slice(0, 24).map((line) => line.slice(0, 500));
  }
  if (f.kind === 'diff') {
    if (typeof f.over === 'boolean') out.over = f.over;
    if (Number.isInteger(f.total)) out.total = count(f.total);
    if (Number.isInteger(f.amount)) out.amount = count(f.amount);
  }
  return out;
}

function normalizeQuestions(value) {
  const out = {};
  const source = object(value);
  Object.keys(source).forEach((key) => {
    if (!QUESTION_KEY.test(key)) return;
    const q = object(source[key]);
    out[key] = { misses: count(q.misses), streak: count(q.streak), hint: q.hint === true, example: q.example === true, stuck: q.stuck === true, ok: q.ok === true };
  });
  return out;
}

// A saved payday, rebuilt field by field, or null when it cannot be trusted (then it is simply dropped).
export function normalizeSession(raw) {
  const o = object(raw);
  if (o.v !== 1 || typeof o.id !== 'string' || o.id.length === 0 || o.id.length > 60 || !isoLike(o.startedAt)) return null;
  if (!SCREENS.includes(o.screen)) return null;
  const earned = Number.isInteger(o.earned) && o.earned >= 1 && o.earned <= MAX_EARNED ? o.earned : null;
  if (o.screen !== 'earn' && earned === null) return null;
  const beyond = ['jars', 'add', 'make', 'spend', 'done'].includes(o.screen);
  const jars = beyond ? jarAmounts(earned) : null;
  const built = { give: object(o.built).give ? cleanPieces(o.built.give) : null, save: object(o.built).save ? cleanPieces(o.built.save) : null };
  const hand = cleanPieces(o.hand);
  if (beyond) {
    if (o.screen === 'jars' || o.screen === 'add') { built.give = null; built.save = null; }
    const jar = o.screen === 'make' ? (o.jar === 'save' ? 'save' : 'give') : null;
    if (o.screen === 'make' && jar === 'save' && !built.give) return null;
    if ((o.screen === 'spend' || o.screen === 'done') && !(built.give && built.save)) return null;
    // the money in his hand plus the jars he has built must be exactly what he earned
    if (!conserved(earned, hand, [built.give, built.save].filter(Boolean))) return null;
  }
  const jar = o.screen === 'spend' || o.screen === 'done' ? 'spend' : (o.jar === 'save' ? 'save' : 'give');
  let phase = PHASES.includes(o.phase) ? o.phase : 'can';
  const breaking = canBreak(o.breaking) && hand[o.breaking] > 0 ? o.breaking : null;
  if (phase === 'replace' && !breaking) phase = 'pick';
  const allowed = breaking ? smallerIds(breaking) : [];
  const replacement = emptyPieces();
  const rawReplacement = cleanPieces(o.replacement, MAX_REPLACEMENT);
  allowed.forEach((id) => { replacement[id] = rawReplacement[id]; });
  const rawSelection = cleanPieces(o.selection);
  const selection = selectionFits(hand, rawSelection) ? rawSelection : emptyPieces();
  const tray = Array.isArray(o.tray) ? [...new Set(o.tray.filter((item) => JARS.includes(item)))] : [];
  const handed = cleanPieces(o.handed, 20);
  return {
    v: 1,
    id: o.id,
    startedAt: o.startedAt,
    finishedAt: o.screen === 'done' && isoLike(o.finishedAt) ? o.finishedAt : null,
    abandoned: o.abandoned === true && o.screen !== 'done',
    screen: o.screen,
    earned,
    handed,
    jars,
    hand: beyond ? hand : emptyPieces(),
    built: beyond ? built : { give: null, save: null },
    jar,
    phase,
    breaking,
    replacement,
    selection,
    tray: o.screen === 'add' ? tray : [],
    feedback: normalizeFeedback(o.feedback),
    qs: normalizeQuestions(o.qs),
  };
}

export const emptyPayday = () => ({ sessions: [] });

export function normalizePayday(value) {
  const sessions = (Array.isArray(object(value).sessions) ? value.sessions : []).map(normalizeSession).filter(Boolean);
  sessions.sort((a, b) => (a.startedAt < b.startedAt ? 1 : a.startedAt > b.startedAt ? -1 : 0));
  return { sessions: sessions.slice(0, MAX_SESSIONS) };
}

// The payday he is in the middle of, or null (none yet, the last one is finished, or it was given up).
export function openSession(payday) {
  const first = payday && payday.sessions && payday.sessions[0];
  return first && !first.finishedAt && !first.abandoned ? first : null;
}

// Saves a brand-new payday as the newest.
export function addSession(payday, session) {
  return { sessions: [session, ...(payday.sessions || []).filter((s) => s.id !== session.id)].slice(0, MAX_SESSIONS) };
}

// Applies one action to the open payday and returns the new payday state (same object when nothing changed).
export function actOnOpen(payday, action, now) {
  const open = openSession(payday);
  if (!open) return payday;
  const next = act(open, action, now);
  if (next === open) return payday;
  return { sessions: [next, ...payday.sessions.slice(1)] };
}

// "Start a new payday" while one is half done: the old one stays in the grown-up's list as not finished.
export function abandonOpen(payday) {
  const open = openSession(payday);
  if (!open) return payday;
  return { sessions: [{ ...open, abandoned: true, feedback: null }, ...payday.sessions.slice(1)] };
}

export { newSession };

// The Payday Helper's session: one payday, start to finish, as a plain JSON state plus a pure `act(state, action, now)`
// reducer. No DOM, no storage, no clock (the caller passes `now`). The view (view.js) only draws this state, and the
// parent summary (summary.js) only reads it, so every rule lives here once.
//
// The flow (spec v2): 1 earned -> 2 what he was handed (must match) -> recap -> 3 the three jars -> 4 add the jars ->
// 5 make Give, then Save (can I make it? / break a piece / build the jar), then Spend. The app checks everything
// itself and never shows him an answer: a wrong answer gets a hint, then a worked example with different money, then
// a hint again, then "show this screen to a grown-up" on the fourth miss in a row.
import {
  MAX_HANDED, MAX_REPLACEMENT, PIECE_IDS, addJarsExampleLine, applyBreak, canBreak, canMake, checkJar, checkReplacement, cleanPieces,
  conserved, emptyPieces, formatMoney, isPieceId, jarAmounts, matchCheck, parseDollars, parseEarned, pickExample, pieceCents, piecesTotal,
  smallerIds, takeFromHand, workedExampleLines,
} from './logic.js';

export const STUCK_AT = 4; // misses in a row on one question before the grown-up screen
export const SCREENS = ['earn', 'handed', 'recap', 'jars', 'add', 'make', 'spend', 'done'];
export const PHASES = ['can', 'pick', 'replace', 'build', 'built'];

export const COPY = Object.freeze({
  invalid: 'That does not look right. Check the amount and try again.',
  addHint: 'Add the jars one at a time. Start with Give plus Save, then add Spend.',
  pickHint: 'Look at how much you are missing. Which piece could you break to get the small coins you need?',
  spendHint: 'Look at every piece still in your hand. Tap them one at a time and watch your total.',
  grownUp: 'Show this screen to a grown-up.',
});

const emptyQuestion = () => ({ misses: 0, streak: 0, hint: false, example: false, stuck: false, ok: false });

export function newSession(now) {
  return {
    v: 1,
    id: `pd-${now}`,
    startedAt: now,
    finishedAt: null,
    abandoned: false,
    screen: 'earn',
    earned: null,
    handed: emptyPieces(),
    jars: null,
    hand: emptyPieces(),
    built: { give: null, save: null },
    jar: 'give',
    phase: 'can',
    breaking: null,
    replacement: emptyPieces(),
    selection: emptyPieces(),
    tray: [],
    feedback: null,
    qs: {},
  };
}

const copy = (state) => JSON.parse(JSON.stringify(state));
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const jarName = (jar) => (jar === 'give' ? 'Give' : jar === 'save' ? 'Save' : 'Spend');
const target = (state) => (state.jars ? state.jars[state.jar] : 0);

// The key a question is tracked under, so the parent summary can say "stuck on Save: which piece to break".
export const questionKeys = (state) => {
  if (state.screen === 'earn') return 'earn';
  if (state.screen === 'handed') return 'handed';
  if (state.screen === 'add') return 'add';
  if (state.screen === 'spend') return 'spend';
  if (state.screen === 'make') {
    const sub = { can: 'can', pick: 'pick', replace: 'replace', build: 'build' }[state.phase];
    return sub ? `${state.jar}.${sub}` : null;
  }
  return null;
};
const question = (state, key) => (state.qs[key] || (state.qs[key] = emptyQuestion()));

function ok(state, key, text) {
  if (key) { const q = question(state, key); q.ok = true; q.streak = 0; }
  state.feedback = text ? { kind: 'ok', text } : null;
  return state;
}

// Records a wrong answer and decides what he sees next: the question's own hint, then the stored example, then the
// hint again, then the grown-up screen. `hint` is the question's hint text (it never contains the answer).
function miss(state, key, hint, exampleLines) {
  const q = question(state, key);
  q.misses += 1;
  q.streak += 1;
  const rung = q.streak % STUCK_AT;
  if (rung === 0) {
    q.stuck = true;
    state.feedback = { kind: 'stuck', key, text: COPY.grownUp };
  } else if (rung === 2 && exampleLines) {
    q.example = true;
    state.feedback = { kind: 'example', key, hint, lines: exampleLines() };
  } else {
    q.hint = true;
    state.feedback = { kind: 'hint', key, text: hint };
  }
  return state;
}

// Steps 1 and 2 have their own plain messages (a typo, or the difference); only the fourth miss in a row changes it.
function plainMiss(state, key, text, extra) {
  const q = question(state, key);
  q.misses += 1;
  q.streak += 1;
  q.hint = true;
  if (q.streak >= STUCK_AT && q.streak % STUCK_AT === 0) { q.stuck = true; state.feedback = { kind: 'stuck', key, text: COPY.grownUp }; } else state.feedback = { kind: 'diff', key, text, ...(extra || {}) };
  return state;
}

const invariant = (state) => {
  if (state.earned === null || !state.jars || state.screen === 'earn' || state.screen === 'handed' || state.screen === 'recap' || state.screen === 'jars' || state.screen === 'add') return;
  const built = ['give', 'save'].map((jar) => state.built[jar]).filter(Boolean);
  if (!conserved(state.earned, state.hand, built)) throw new Error('payday: the money in his hand and jars no longer adds up to what he earned');
};

// A jar worth $0.00 (a tiny payday) has nothing to build, so it is skipped.
function enterJar(state, jar) {
  state.jar = jar;
  state.phase = 'can';
  state.breaking = null;
  state.replacement = emptyPieces();
  state.selection = emptyPieces();
  if (state.jars[jar] === 0) { state.built[jar] = emptyPieces(); state.phase = 'built'; }
}

function exampleFor(state) { return pickExample(state.earned); }

export function act(prev, action, now) {
  if (!action || typeof action.type !== 'string') return prev;
  const state = copy(prev);
  const type = action.type;
  // The grown-up screen is the only thing on screen until the button is pressed.
  if (state.feedback && state.feedback.kind === 'stuck') {
    if (type !== 'grownup-ok') return prev;
    const q = state.qs[state.feedback.key];
    if (q) { q.streak = 0; q.stuck = true; }
    state.feedback = null;
    return state;
  }
  if (state.screen === 'done' && type !== 'noop') return prev;
  const key = questionKeys(state);

  switch (type) {
    case 'dismiss': state.feedback = null; return state;

    // ----- Step 1: what he earned -----
    case 'earn-submit': {
      if (state.screen !== 'earn') return prev;
      const parsed = parseEarned(action.text);
      if (!parsed.ok) return plainMiss(state, 'earn', COPY.invalid);
      state.earned = parsed.cents;
      state.screen = 'handed';
      return ok(state, 'earn', null);
    }
    case 'change-amount': {
      if (state.screen !== 'handed' && state.screen !== 'recap') return prev;
      state.screen = 'earn'; state.feedback = null;
      return state;
    }

    // ----- Step 2: what he was handed -----
    case 'pieces-clear': {
      if (state.screen !== 'handed') return prev;
      state.handed = emptyPieces(); state.feedback = null;
      return state;
    }
    case 'piece-adjust': {
      if (state.screen !== 'handed' || !isPieceId(action.id)) return prev;
      state.handed = cleanPieces(state.handed);
      state.handed[action.id] = clamp(state.handed[action.id] + (action.delta > 0 ? 1 : -1), 0, MAX_HANDED);
      state.feedback = null;
      return state;
    }
    case 'handed-done': {
      if (state.screen !== 'handed') return prev;
      const check = matchCheck(state.earned, state.handed);
      if (check.kind === 'equal') {
        state.screen = 'recap';
        return ok(state, 'handed', `That matches! You earned ${formatMoney(state.earned)} and you were handed ${formatMoney(check.total)}.`);
      }
      const text = check.kind === 'over'
        ? `Your bills and coins add up to ${formatMoney(check.total)}, but you earned ${formatMoney(state.earned)}. That is ${formatMoney(check.diff)} too much. Look at what you were handed again.`
        : `Your bills and coins add up to ${formatMoney(check.total)}, but you earned ${formatMoney(state.earned)}. That is ${formatMoney(check.diff)} too little. Look at what you were handed again.`;
      return plainMiss(state, 'handed', text, { over: check.kind === 'over', total: check.total, amount: check.diff });
    }
    case 'change-pieces': {
      if (state.screen !== 'recap') return prev;
      state.screen = 'handed'; state.feedback = null;
      return state;
    }
    case 'recap-yes': {
      if (state.screen !== 'recap') return prev;
      state.jars = jarAmounts(state.earned);
      state.hand = cleanPieces(state.handed);
      state.built = { give: null, save: null };
      state.screen = 'jars';
      state.feedback = null;
      return state;
    }

    // ----- Step 3 and 4: the jars, then add them -----
    case 'jars-next': {
      if (state.screen !== 'jars') return prev;
      state.screen = 'add'; state.tray = []; state.feedback = null;
      return state;
    }
    case 'tray-add': {
      if (state.screen !== 'add' || !['give', 'save', 'spend'].includes(action.jar) || state.tray.includes(action.jar)) return prev;
      state.tray = [...state.tray, action.jar];
      return state;
    }
    case 'tray-remove': {
      if (state.screen !== 'add') return prev;
      state.tray = state.tray.filter((jar) => jar !== action.jar);
      return state;
    }
    case 'add-answer': {
      if (state.screen !== 'add') return prev;
      const typed = parseDollars(action.text);
      if (typed === state.earned) {
        state.screen = 'make';
        state.tray = [];
        enterJar(state, 'give');
        return ok(state, 'add', `Yes! That is the ${formatMoney(state.earned)} you earned.`);
      }
      return miss(state, 'add', COPY.addHint, () => [addJarsExampleLine(exampleFor(state))]);
    }

    // ----- Step 5: make Give, then Save -----
    case 'can-answer': {
      if (state.screen !== 'make' || state.phase !== 'can') return prev;
      const truth = canMake(state.hand, target(state));
      const said = action.value === 'yes' ? true : action.value === 'no' ? false : null;
      if (said === null) return prev;
      if (said === truth) {
        state.phase = truth ? 'build' : 'pick';
        state.selection = emptyPieces();
        return ok(state, key, null);
      }
      return miss(state, key, `Pick some pieces from your hand and add them up. Is there any group that makes exactly ${formatMoney(target(state))}?`, () => workedExampleLines(exampleFor(state)));
    }
    case 'pick-piece': {
      if (state.screen !== 'make' || state.phase !== 'pick') return prev;
      if (!canBreak(action.id) || !(state.hand[action.id] > 0)) {
        if (!isPieceId(action.id)) return prev;
        return miss(state, key, COPY.pickHint, () => workedExampleLines(exampleFor(state)));
      }
      state.breaking = action.id;
      state.replacement = emptyPieces();
      state.phase = 'replace';
      return ok(state, key, null);
    }
    case 'replace-adjust': {
      if (state.screen !== 'make' || state.phase !== 'replace' || !state.breaking) return prev;
      if (!smallerIds(state.breaking).includes(action.id)) return prev;
      state.replacement = cleanPieces(state.replacement, MAX_REPLACEMENT);
      state.replacement[action.id] = clamp(state.replacement[action.id] + (action.delta > 0 ? 1 : -1), 0, MAX_REPLACEMENT);
      state.feedback = null;
      return state;
    }
    case 'replace-cancel': {
      if (state.screen !== 'make' || state.phase !== 'replace') return prev;
      state.phase = 'pick'; state.breaking = null; state.replacement = emptyPieces(); state.feedback = null;
      return state;
    }
    case 'replace-done': {
      if (state.screen !== 'make' || state.phase !== 'replace' || !state.breaking) return prev;
      const check = checkReplacement(state.breaking, state.replacement);
      if (check.ok) {
        state.hand = applyBreak(state.hand, state.breaking, state.replacement);
        state.breaking = null; state.replacement = emptyPieces(); state.phase = 'can';
        invariant(state);
        return ok(state, key, 'Nice. Those pieces are worth the same. Your hand has changed.');
      }
      const hint = `The pieces you asked for add up to ${formatMoney(check.total)}. The piece you are breaking is worth ${formatMoney(check.target)}. Change the pieces so they add up to the same amount.`;
      return miss(state, key, hint, () => workedExampleLines(exampleFor(state)));
    }
    case 'jar-add': {
      if (state.screen !== 'make' || state.phase !== 'build' || !isPieceId(action.id)) return prev;
      state.selection = cleanPieces(state.selection);
      if (state.selection[action.id] >= (state.hand[action.id] || 0)) return prev;
      state.selection[action.id] += 1;
      state.feedback = null;
      return state;
    }
    case 'jar-remove': {
      if (state.screen !== 'make' || state.phase !== 'build' || !isPieceId(action.id)) return prev;
      state.selection = cleanPieces(state.selection);
      if (state.selection[action.id] < 1) return prev;
      state.selection[action.id] -= 1;
      state.feedback = null;
      return state;
    }
    case 'jar-done': {
      if (state.screen !== 'make' || state.phase !== 'build') return prev;
      const check = checkJar(state.hand, state.selection, target(state));
      if (check.ok) {
        state.built[state.jar] = cleanPieces(state.selection);
        state.hand = takeFromHand(state.hand, state.selection);
        state.selection = emptyPieces();
        state.phase = 'built';
        invariant(state);
        return ok(state, key, `Your ${jarName(state.jar)} jar has ${formatMoney(check.total)}. That is exactly right.`);
      }
      const hint = `Your jar has ${formatMoney(check.total)} in it, but this jar needs ${formatMoney(check.target)}. Take out a piece or swap one.`;
      return miss(state, key, hint, () => workedExampleLines(exampleFor(state)));
    }
    case 'jar-next': {
      if (state.screen !== 'make' || state.phase !== 'built') return prev;
      state.feedback = null;
      if (state.jar === 'give') { enterJar(state, 'save'); return state; }
      state.screen = 'spend'; state.jar = 'spend'; state.phase = 'can'; state.selection = emptyPieces();
      return state;
    }

    // ----- Spend: add what is left -----
    case 'spend-add': {
      if (state.screen !== 'spend' || !isPieceId(action.id)) return prev;
      state.selection = cleanPieces(state.selection);
      if (state.selection[action.id] >= (state.hand[action.id] || 0)) return prev;
      state.selection[action.id] += 1;
      return state;
    }
    case 'spend-remove': {
      if (state.screen !== 'spend' || !isPieceId(action.id)) return prev;
      state.selection = cleanPieces(state.selection);
      if (state.selection[action.id] < 1) return prev;
      state.selection[action.id] -= 1;
      return state;
    }
    case 'spend-answer': {
      if (state.screen !== 'spend') return prev;
      if (parseDollars(action.text) === state.jars.spend) {
        state.screen = 'done';
        state.finishedAt = now;
        invariant(state);
        return ok(state, 'spend', `That is exactly your Spend jar: ${formatMoney(state.jars.spend)}.`);
      }
      return miss(state, 'spend', COPY.spendHint, () => workedExampleLines(exampleFor(state)));
    }
    default: return prev;
  }
}

// What the screen needs that is derived, not stored: the pieces still in his hand (hand minus what he has tapped
// toward a jar or the Spend tray) and the running totals the trays show.
export function view(state) {
  const taken = cleanPieces(state.selection);
  const inHand = cleanPieces(state.hand);
  PIECE_IDS.forEach((id) => { inHand[id] = Math.max(0, inHand[id] - taken[id]); });
  const jarGoal = state.jars && (state.screen === 'make' || state.screen === 'spend') ? state.jars[state.jar] : null;
  return {
    inHand,
    taken,
    handTotal: piecesTotal(state.hand),
    handedTotal: piecesTotal(state.handed),
    selectionTotal: piecesTotal(state.selection),
    replacementTotal: piecesTotal(state.replacement),
    breakingCents: state.breaking ? pieceCents(state.breaking) : 0,
    trayTotal: state.jars ? state.tray.reduce((sum, jar) => sum + state.jars[jar], 0) : 0,
    jarGoal,
    smaller: state.breaking ? smallerIds(state.breaking) : [],
  };
}

// Questions he reached, with how each went: first-time | hint | example | stuck | in-progress.
export function outcomes(state) {
  return Object.keys(state.qs).map((key) => {
    const q = state.qs[key];
    const outcome = q.stuck ? 'stuck' : q.example ? 'example' : q.misses > 0 ? 'hint' : q.ok ? 'first-time' : 'in-progress';
    return { key, outcome, misses: q.misses };
  });
}

// Shared scoring and coaching for the A+ labs (SPEC 2.1-2.4, 3.1).
//
// scoreFrom(goals, traps) -> integer 0..100
//   goals: [{ pass: boolean, weight?: number > 0 }]   (weight defaults to 1)
//   traps: [{ hit: boolean, critical?: boolean }]
//   Score = earned goal weight / total goal weight * 100, minus one average goal's
//   worth (100 / goals.length) per trap hit, capped at 60 when a critical trap is hit,
//   floored at 0, rounded to an integer. No goals scores 0.
//
// createCoach(caseDef, mode = 'guided', { continuesFrom } = {}) -> coach
//   continuesFrom: the coach of the attempt whose state this one carries on (Try again keeps the state, so it keeps
//   the help): the new attempt starts assisted when that attempt was assisted. Only a fresh state (Restart, no
//   continuesFrom) can start unassisted, and createNextAttemptAssistance still assists the attempt after a walkthrough.
//   coach.hint(goalId)        -> { goalId, tier: 1|2|3, text, assisted } | null (null in exam mode or unknown goal)
//   coach.showMe(goalId)      -> tier-3 hint in any mode (the Show me button on results); marks the goal assisted
//   coach.observe(result)     -> { wrongActions, messages: [{ kind: 'done'|'trap'|'error', text }], offerHint }
//   coach.offerHint(secsSinceProgress) -> boolean (guided only: 60 s idle or 2 wrong actions)
//   coach.viewSolution()      -> marks the run assisted
//   coach.finishRun(checkResult, secs) -> { score, secs, mode, assisted }
//   coach.tiers / coach.assistedGoals / coach.wrongActions / coach.assisted (read-only views)
//
// createNextAttemptAssistance(store?, itemId?) queues a viewed walkthrough for the next attempt in this page session:
//   viewSolution() sets the flag, startAttempt(coach) marks that coach assisted and clears the flag (once), pending reads it.
//   With no store the flag lives in this object only. With a store (createPendingAssistStore) it is kept per item id, so
//   it survives a re-render of the case page, hash navigation away and back, and (through sessionStorage) a reload.
// createPendingAssistStore(memory = new Map(), storage = null) -> { has(itemId), set(itemId, on) }
//   memory: a Map the caller keeps for the page; storage: a Storage (sessionStorage) or null. Every storage call is
//   guarded, so blocked or full storage still leaves the in-memory flag. Once memory has an entry for an id it wins
//   over storage, so a failed removeItem never brings a consumed flag back on this page.

export const MODES = ['guided', 'practice', 'exam'];
export const CRITICAL_CAP = 60;
export const IDLE_HINT_SECS = 60;
export const WRONG_HINT_COUNT = 2;
const MAX_SECS = 86400;

export const PENDING_ASSIST_KEY = 'codequest-pro-assist-next';

export function createPendingAssistStore(memory = new Map(), storage = null) {
  const read = () => {
    try {
      const ids = JSON.parse(storage?.getItem(PENDING_ASSIST_KEY) || '[]');
      return Array.isArray(ids) ? ids.filter((x) => typeof x === 'string') : [];
    } catch { return []; }
  };
  const write = (ids) => {
    try {
      if (!storage) return;
      if (ids.length) storage.setItem(PENDING_ASSIST_KEY, JSON.stringify(ids));
      else storage.removeItem(PENDING_ASSIST_KEY);
    } catch { /* storage blocked or full: the in-memory flag still applies on this page */ }
  };
  return {
    has(itemId) { return memory.has(itemId) ? memory.get(itemId) === true : read().includes(itemId); },
    set(itemId, on) {
      memory.set(itemId, !!on);
      const rest = read().filter((x) => x !== itemId);
      write(on ? [...rest, itemId] : rest);
    },
  };
}

export function createNextAttemptAssistance(store = null, itemId = '') {
  let local = false;
  const get = () => (store ? store.has(itemId) : local);
  const put = (on) => { if (store) store.set(itemId, on); else local = on; };
  return {
    viewSolution() { put(true); },
    startAttempt(coach) {
      if (!get()) return;
      coach.viewSolution();
      put(false);
    },
    get pending() { return get(); },
  };
}

const weightOf = (goal) => Number.isFinite(goal?.weight) && goal.weight > 0 ? goal.weight : 1;

export function scoreFrom(goals, traps) {
  const list = Array.isArray(goals) ? goals : [];
  const hits = (Array.isArray(traps) ? traps : []).filter((trap) => trap?.hit);
  const total = list.reduce((sum, goal) => sum + weightOf(goal), 0);
  if (!total) return 0;
  const earned = list.reduce((sum, goal) => sum + (goal?.pass ? weightOf(goal) : 0), 0);
  const raw = Math.max(0, Math.round((100 * earned) / total - (100 * hits.length) / list.length));
  return hits.some((trap) => trap.critical) ? Math.min(raw, CRITICAL_CAP) : raw;
}

export function createCoach(caseDef, mode = 'guided', { continuesFrom = null } = {}) {
  if (!MODES.includes(mode)) throw new RangeError(`Unknown mode: ${mode}`);
  const inherited = !!continuesFrom?.assisted;
  const goals = new Map((caseDef?.goals || []).map((goal) => [goal.id, goal]));
  const traps = new Map((caseDef?.traps || []).map((trap) => [trap.id, trap]));
  const tiers = {};
  const assistedGoals = [];
  let wrongActions = 0;
  let solutionViewed = false;

  function giveHint(goalId, tier) {
    const goal = goals.get(goalId);
    if (!goal) return null;
    tiers[goalId] = Math.max(tiers[goalId] || 0, tier);
    if (tier === 3 && !assistedGoals.includes(goalId)) assistedGoals.push(goalId);
    return { goalId, tier, text: goal.hints[tier - 1], assisted: tier === 3 };
  }
  const isAssisted = () => inherited || solutionViewed || assistedGoals.length > 0;
  const offerHint = (secsSinceProgress) => mode === 'guided'
    && (secsSinceProgress >= IDLE_HINT_SECS || wrongActions >= WRONG_HINT_COUNT);

  return {
    mode,
    get tiers() { return { ...tiers }; },
    get assistedGoals() { return [...assistedGoals]; },
    get wrongActions() { return wrongActions; },
    get assisted() { return isAssisted(); },
    hint(goalId) {
      if (mode === 'exam') return null;
      return giveHint(goalId, Math.min(3, (tiers[goalId] || 0) + 1));
    },
    showMe(goalId) { return giveHint(goalId, 3); },
    // A wrong action is a rejected action or one that hits a trap; progress resets the count.
    observe(result) {
      const done = result?.goalsChanged || [];
      const hit = result?.trapsHit || [];
      if (result?.ok === false || hit.length) wrongActions += 1;
      else if (done.length) wrongActions = 0;
      const messages = mode !== 'guided' ? [] : [
        ...done.filter((id) => goals.has(id)).map((id) => ({ kind: 'done', text: `Done: ${goals.get(id).text}` })),
        ...hit.filter((id) => traps.has(id)).map((id) => ({ kind: 'trap', text: traps.get(id).message })),
        ...(result?.ok === false && result.msg ? [{ kind: 'error', text: result.msg }] : []),
      ];
      return { wrongActions, messages, offerHint: offerHint(0) };
    },
    offerHint,
    viewSolution() { solutionViewed = true; },
    finishRun(checkResult, secs) {
      const whole = Number.isFinite(secs) ? Math.floor(secs) : 0;
      return { score: checkResult.score, secs: Math.min(MAX_SECS, Math.max(0, whole)), mode, assisted: isAssisted() };
    },
  };
}

// The exams, in display order: each one's blueprint (synchronous), its question index (synchronous, generated, just the
// ids and which are held out) and a lazy loader for its full bank. Pages that only summarize progress (Journey, the
// exams hub, achievements) use the index; pages that show questions load the bank.
import { BLUEPRINTS } from './blueprints.js';
import { BANK_LOADERS } from './loaders.js';
import INDEX from './index-data.js';

export const DEFAULT_EXAM = 'secplus-801';

// The index as question-like objects ({ id, checkOnly }): enough for readiness, coverage and the review queue.
function indexQuestions(entry) {
  const ids = entry && Array.isArray(entry.ids) ? entry.ids : [];
  const held = new Set(entry && Array.isArray(entry.held) ? entry.held : []);
  return Object.freeze(ids.map((id, i) => Object.freeze(held.has(i) ? { id, checkOnly: true } : { id })));
}

export const EXAMS = Object.freeze(BLUEPRINTS.map((bp) => Object.freeze({
  id: bp.id,
  blueprint: bp,
  index: indexQuestions(INDEX[bp.id]),
  load: BANK_LOADERS[bp.id],
})));

export const examById = (id) => EXAMS.find((e) => e.id === id) || null;

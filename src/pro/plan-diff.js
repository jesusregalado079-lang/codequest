// "Differs on the other plan" notes. Some Expedited items and roadmap items point at the same link but ask for
// different work, so they keep separate checkmarks (see shared-keys.js). This builds the note shown next to each
// one: what the other plan asks for, and whether he finished that other item.
import stages from './expedited-path.js';
import { EXPEDITED_KEPT_SEPARATE } from './shared-keys.js';

// The stage's own name as the Expedited page titles it ("Stage 3", "Employment Gate #1"). The numbered badge counts the
// gates too, so it can differ from the title; the title is what he reads.
const stageOf = new Map();
stages.forEach((st) => (st.items || []).forEach((item) => { if (item.key) stageOf.set(item.key, String(st.title).split(' — ')[0]); }));

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Notes for an Expedited item: one per roadmap item it was compared with. `isDone(id)` reads a saved checkmark.
export function notesForExpedited(key, isDone) {
  const entry = EXPEDITED_KEPT_SEPARATE.find((e) => e.key === key);
  if (!entry) return [];
  return entry.roadmap.map((r) => ({ where: r.where.startsWith('Phase') ? `Full roadmap, ${r.where}` : r.where, asks: r.asks, done: isDone(r.id) === true }));
}

// Notes for a roadmap/Studies item: the Expedited item that links to the same place, if it was kept separate.
export function notesForRoadmap(id, isDone) {
  return EXPEDITED_KEPT_SEPARATE
    .filter((e) => e.roadmap.some((r) => r.id === id))
    .map((e) => ({ where: `Expedited plan, ${stageOf.get(e.key)}`, asks: e.expeditedAsks, done: isDone(e.key) === true }));
}

// One small block: where it differs, what that plan asks, and done / not done. Text, not colour alone.
export function planNoteHtml(notes) {
  if (!notes.length) return '';
  return `<div class="plan-diff" role="note">${notes.map((n) => `
    <p><b>Differs on the ${esc(n.where)}:</b> ${esc(n.asks)} <span class="pd-status${n.done ? ' is-done' : ''}">${n.done ? '✓ You finished that one' : 'You have not finished that one'}</span></p>`).join('')}
  </div>`;
}

// The labs as the labs pages see them before any content loads: the generated index (id, icon, name, group, pass mark,
// objectives, case ids) merged with the generated meta (kind, blurb, case titles, levels, minutes, objectives).
// Neither file holds lab content, so the hub and the lab pages never download a case file.
import LAB_INDEX from './catalog-index.js';
import META from './catalog-meta.js';

export const LABS = Object.freeze(LAB_INDEX.map((l) => Object.freeze({ ...l, kind: META[l.id]?.kind, blurb: META[l.id]?.blurb || '', cases: META[l.id]?.cases || l.cases })));
export const labOf = (labId) => LABS.find((l) => l.id === labId) || null;
export const isAplus = (lab) => !!lab && lab.group === 'aplus';

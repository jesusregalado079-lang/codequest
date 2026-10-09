// Pure helpers for the Career Path pages (no DOM, no storage): progress keys, per-group counts, the quiz pass mark.
// pro.js renders with these; test/pro-career.test.js checks them directly.

// Every resource has a permanent `id`. Deliverables use `out:<key>`, gate conditions `gate:<key>`, a passed quiz
// `quiz:<id>`.
export const outKey = (o) => `out:${o.key}`;
export const gateKey = (c) => `gate:${c.key}`;
export const quizKey = (id) => `quiz:${id}`;

// Every checkable thing in a group, in display order.
export function groupItems(g) {
  const links = g.links.map((l) => ({ key: l.id, hours: l.hours || 0 }));
  const outs = (g.outputs || []).map((o) => ({ key: outKey(o), hours: 0 }));
  return [...links, ...outs];
}

// `done` is the saved checkmark map ({ key: true }).
export function groupStats(g, done) {
  const items = groupItems(g);
  const finished = items.filter((i) => done[i.key] === true);
  const hoursTotal = items.reduce((s, i) => s + i.hours, 0);
  const hoursDone = finished.reduce((s, i) => s + i.hours, 0);
  return { done: finished.length, total: items.length, hoursDone, hoursTotal, pct: items.length ? Math.round((finished.length / items.length) * 100) : 0 };
}

// A quiz passes at two thirds right, rounded up: 2 of 3, 1 of 1, 2 of 2.
export const passMark = (n) => Math.ceil((n * 2) / 3);

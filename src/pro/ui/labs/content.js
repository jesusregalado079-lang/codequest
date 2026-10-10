// A lab's content (cases, sources, and for the A+ labs the refresher and glossary) loads on demand, one chunk per lab,
// only when a case page or an A+ lab page needs it. Each module is fetched once and kept.
const LOADERS = {
  fw: () => import('../../labs/content/firewall-cases.js'),
  logs: () => import('../../labs/content/log-sets.js'),
  subnet: () => import('../../labs/subnet.js').then((m) => ({ default: m.LEVELS, sources: {} })),
  cli: () => import('../../labs/content/cli-cases.js'),
  phish: () => import('../../labs/content/phish-cases.js'),
  code: () => import('../../labs/content/code-labs.js'),
  win: () => import('../../labs/aplus/content/win-cases.js'),
  shell: () => import('../../labs/aplus/content/shell-cases.js'),
  build: () => import('../../labs/aplus/content/build-cases.js'),
  router: () => import('../../labs/aplus/content/router-cases.js'),
  order: () => import('../../labs/aplus/content/order-cases.js'),
  mobprint: () => import('../../labs/aplus/content/mobprint-cases.js'),
};
const done = new Map();
const pending = new Map();

export const contentLoaded = (labId) => done.has(labId);
export function loadContent(labId, importer = (load) => load()) {
  if (done.has(labId)) return Promise.resolve(done.get(labId));
  if (!LOADERS[labId]) return Promise.reject(new Error(`No content for lab ${labId}`));
  if (!pending.has(labId)) {
    pending.set(labId, importer(LOADERS[labId]).then((m) => { done.set(labId, m); pending.delete(labId); return m; }, (e) => { pending.delete(labId); throw e; }));
  }
  return pending.get(labId);
}
// The lab as a runner needs it: its meta plus sources (and primer, terms, the whole module) from the loaded content.
export function withContent(lab, mod) {
  return { ...lab, sources: mod.sources || {}, primer: mod.primer || null, terms: mod.terms || {}, content: mod };
}
export function fullCase(mod, caseId) {
  return (Array.isArray(mod.default) ? mod.default : []).find((c) => c && c.id === caseId) || null;
}

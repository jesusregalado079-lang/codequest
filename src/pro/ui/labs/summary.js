// The labs summary and the labs-per-objective lookup without loading the labs content: both read the generated catalog
// index (src/pro/exam/tools/build-index.mjs), so the Journey card, the exam pages and the achievements stay light.
// The labs pages use this index plus the generated catalog-meta.js (ui/labs/meta.js) and load a lab's content only on its
// pages (ui/labs/content.js); test/pro-exams.test.js checks the index matches the catalog (../../labs/catalog.js).
import { labSummary } from '../../labs/lab-logic.js';
import { getLabs } from '../../progress.js';
import LAB_INDEX from './catalog-index.js';

export const labsSummary = () => labSummary(getLabs(), LAB_INDEX);

const SECPLUS = 'secplus-801';
export const LAB_LIST = LAB_INDEX;
// The objective ids a lab practices on one exam: Security+ reads `objs`, the others `examObjs` (same rule as the catalog).
export const labObjsFor = (lab, examId = SECPLUS) => (examId === SECPLUS ? lab.objs || [] : (lab.examObjs || {})[examId] || []);
// Labs that practice any of these objective ids on that exam.
export function labsForObjectives(objIds, examId = SECPLUS) {
  const want = new Set((objIds || []).map(String));
  return LAB_INDEX.filter((l) => labObjsFor(l, examId).some((o) => want.has(o)));
}

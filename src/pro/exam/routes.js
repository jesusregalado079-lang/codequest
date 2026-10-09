// Exam routes, parsed from the hash parts after 'exam':
//   #/exam                              the exams hub
//   #/exam/<examId>                     one exam's hub
//   #/exam/<examId>/domain/<n>          one domain
//   #/exam/<examId>/session             the open session
//   #/exam/<examId>/result/<attemptId>  a finished mock or check
// Links from before there was more than one exam (#/exam/domain/<n>, #/exam/session, #/exam/result/<id>) were all
// Security+; they redirect to the Security+ equivalent. An unknown exam id goes to the exams hub.
import { DEFAULT_EXAM, examById } from './registry.js';

const LEGACY = ['domain', 'session', 'result'];

// -> { hub: true } | { redirect: '/exam/...' } | { examId, view, arg }
export function examRoute(parts = []) {
  const segs = parts.filter((p) => p !== undefined && p !== '');
  const [first, view = '', arg] = segs;
  if (!first) return { hub: true };
  if (LEGACY.includes(first)) return { redirect: ['/exam', DEFAULT_EXAM, ...segs].join('/') };
  if (!examById(first)) return { redirect: '/exam' };
  return { examId: first, view, arg };
}

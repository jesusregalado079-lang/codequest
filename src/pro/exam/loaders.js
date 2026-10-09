// One lazy loader per exam: each bank is its own chunk, fetched only when that exam's pages need questions.
// Each resolves to { blueprint, questions, sources, byId } (blueprints.js examModule). retryImport lets the page's
// Retry button load a chunk again after a failed attempt (offline, or a deploy replaced it).
import { retryImport } from '../ui/lazy.js';

export const BANK_LOADERS = Object.freeze({
  'secplus-801': () => retryImport(() => import('./secplus-801.js'), (m) => !!m.default?.blueprint).then((m) => m.default),
  'netplus-009': () => retryImport(() => import('./netplus-009.js'), (m) => !!m.default?.blueprint).then((m) => m.default),
  'aplus-1201': () => retryImport(() => import('./aplus-1201.js'), (m) => !!m.default?.blueprint).then((m) => m.default),
  'aplus-1202': () => retryImport(() => import('./aplus-1202.js'), (m) => !!m.default?.blueprint).then((m) => m.default),
});

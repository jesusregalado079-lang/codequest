// The hands-on labs: six Security+ & Network+ labs, then six A+ labs (group 'aplus', content in ./aplus/content/).
// Declarative: names, icons, pass marks, and each lab's cases read from the content modules (counts and ids are never
// assumed). Subnet Sprint's "cases" are its four generated-drill levels. A+ labs also carry their refresher (`primer`)
// and glossary (`terms`).
import firewallCases, { sources as fwSources } from './content/firewall-cases.js';
import logSets, { sources as logSources } from './content/log-sets.js';
import cliCases, { sources as cliSources } from './content/cli-cases.js';
import phishCases, { sources as phishSources } from './content/phish-cases.js';
import codeLabs, { sources as codeSources } from './content/code-labs.js';
import { LEVELS } from './subnet.js';
import winCases, { sources as winSources, primer as winPrimer, terms as winTerms } from './aplus/content/win-cases.js';
import shellCases, { sources as shellSources, primer as shellPrimer, terms as shellTerms } from './aplus/content/shell-cases.js';
import buildCases, { sources as buildSources, primer as buildPrimer, terms as buildTerms } from './aplus/content/build-cases.js';
import routerCases, { sources as routerSources, primer as routerPrimer, terms as routerTerms } from './aplus/content/router-cases.js';
import orderCases, { sources as orderSources, primer as orderPrimer, terms as orderTerms } from './aplus/content/order-cases.js';
import mobprintCases, { sources as mobprintSources, primer as mobprintPrimer, terms as mobprintTerms } from './aplus/content/mobprint-cases.js';

const SUBNET_OBJS = ['3.1', '4.1']; // logical segmentation (3.1), segmentation as a mitigation (4.1)
// Network+ 1.7 (IPv4 addressing, subnetting) and A+ Core 1 2.6 (addressing and subnet masks on a SOHO network)
const SUBNET_EXAM_OBJS = { 'netplus-009': ['1.7'], 'aplus-1201': ['2.6'] };
const subnetCases = LEVELS.map((lv, i) => ({ ...lv, title: lv.name, level: i + 1, objs: SUBNET_OBJS, examObjs: SUBNET_EXAM_OBJS }));

const DEFS = [
  { id: 'fw', icon: '🧱', name: 'Firewall & Network Diagram', kind: 'firewall', pass: 80, source: firewallCases,
    blurb: 'Read the network, test it from a terminal, fix the ACL until every requirement passes.' },
  { id: 'logs', icon: '🔎', name: 'Log Detective', kind: 'logs', pass: 80, source: logSets,
    blurb: 'Read real-looking log lines and name the attack each snippet shows.' },
  { id: 'subnet', icon: '🧮', name: 'Subnet Sprint', kind: 'subnet', pass: 80, source: subnetCases,
    blurb: 'Ten quick subnetting questions per round, a fresh round every time.' },
  { id: 'cli', icon: '💻', name: 'Terminal Troubleshooter', kind: 'cli', pass: 80, source: cliCases,
    blurb: 'Investigate a broken or compromised host with commands, then diagnose and fix it.' },
  { id: 'phish', icon: '🎣', name: 'Phish Inspector', kind: 'phish', pass: 80, source: phishCases,
    blurb: 'Flag what is suspicious in an email, then decide: phishing or legitimate, and what to do.' },
  { id: 'code', icon: '🛠️', name: 'Detection Coder', kind: 'code', pass: 100, source: codeLabs,
    blurb: 'Write small JavaScript detections that a test suite checks, the way a SOC rule is built.' },
  // A+ labs (group 'aplus'): every case has goals, three-tier hints, traps, a solution walkthrough and three modes.
  { id: 'win', icon: '🪟', name: 'Windows Tool Finder', kind: 'sim', group: 'aplus', pass: 80, source: winCases,
    primer: winPrimer, terms: winTerms,
    blurb: 'Open the right Windows tool (Device Manager, Disk Management, Event Viewer, Services, Settings) and fix the ticket.' },
  { id: 'shell', icon: '⌨️', name: 'Command Line Fixer', kind: 'shell', group: 'aplus', pass: 80, source: shellCases,
    primer: shellPrimer, terms: shellTerms,
    blurb: 'Real command output on Windows cmd, PowerShell and Linux bash: diagnose with commands, then fix it.' },
  { id: 'build', icon: '🧰', name: 'PC Build Bench', kind: 'pcbuild', group: 'aplus', pass: 80, source: buildCases,
    primer: buildPrimer, terms: buildTerms,
    blurb: 'Pick compatible parts for a real request: sockets, memory, drives, case fit, cooling and power.' },
  { id: 'router', icon: '📶', name: 'SOHO Router Setup', kind: 'sim', group: 'aplus', pass: 80, source: routerCases,
    primer: routerPrimer, terms: routerTerms,
    blurb: 'Secure and configure a small office router in its admin pages without locking anyone out.' },
  { id: 'order', icon: '🪜', name: 'Fix It In Order', kind: 'order', group: 'aplus', pass: 80, source: orderCases,
    primer: orderPrimer, terms: orderTerms,
    blurb: 'Put the troubleshooting, malware removal and change steps in the right order, and answer what each step means here.' },
  { id: 'mobprint', icon: '📱', name: 'Mobile & Printer Fixes', kind: 'sim', group: 'aplus', pass: 80, source: mobprintCases,
    primer: mobprintPrimer, terms: mobprintTerms,
    blurb: 'Fix phone settings and printer problems from the device screens, the way a field tech does.' },
];

const list = (v) => (Array.isArray(v) ? v : []);
const byObjId = (a, b) => a.split('.').map(Number).reduce((d, n, i) => d || n - Number(b.split('.')[i] || 0), 0);
const okExamId = (k) => /^[a-z0-9-]{1,40}$/.test(k);
// Optional per-case `examObjs: { '<examId>': ['5.3', ...] }`: the objectives a case practices on the other exams.
// Security+ stays on `objs`. Junk keys or values are dropped.
export function normalizeExamObjs(raw) {
  const out = {};
  const o = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  Object.keys(o).forEach((k) => {
    const objs = [...new Set(list(o[k]).map(String).filter((x) => /^\d+\.\d+$/.test(x)))].sort(byObjId);
    if (okExamId(k) && objs.length) out[k] = objs;
  });
  return out;
}
const casesOf = (src) => list(src).filter((c) => c && typeof c.id === 'string')
  .map((c) => ({ id: c.id, title: String(c.title || c.id), level: Number(c.level) || 1, objs: list(c.objs).map(String), examObjs: normalizeExamObjs(c.examObjs),
    ...(Number.isFinite(c.minutes) && c.minutes > 0 ? { minutes: c.minutes } : {}) }));

// The union over a lab's cases, per exam: { '<examId>': [objective ids, sorted] }.
function unionExamObjs(cases) {
  const out = {};
  cases.forEach((c) => Object.entries(c.examObjs).forEach(([k, objs]) => { out[k] = [...new Set([...(out[k] || []), ...objs])].sort(byObjId); }));
  return out;
}

export const LABS = Object.freeze(DEFS.map(({ source, ...lab }) => {
  const cases = casesOf(source);
  const objs = [...new Set(cases.flatMap((c) => c.objs))].sort(byObjId);
  return Object.freeze({ ...lab, objs, examObjs: unionExamObjs(cases), cases });
}));

export const SECPLUS = 'secplus-801';
// The objective ids a lab (or one case) practices on one exam: Security+ reads `objs`, the others `examObjs`.
export const objsFor = (labOrCase, examId = SECPLUS) => (examId === SECPLUS ? labOrCase.objs : (labOrCase.examObjs || {})[examId] || []);

// Labs whose cases practice any of these objective ids on that exam (for the exam domain pages).
export function labsForObjectives(objIds, examId = SECPLUS) {
  const want = new Set(list(objIds).map(String));
  return LABS.filter((l) => objsFor(l, examId).some((o) => want.has(o)));
}

const SOURCES = Object.fromEntries(DEFS.map((d) => [d.id, d.source]));

// Source references per lab: { key: ['Title', 'https://...'] } (cases list keys in `src`).
export const LAB_SOURCES = Object.freeze({ fw: fwSources || {}, logs: logSources || {}, subnet: {}, cli: cliSources || {}, phish: phishSources || {}, code: codeSources || {},
  win: winSources || {}, shell: shellSources || {}, build: buildSources || {}, router: routerSources || {}, order: orderSources || {}, mobprint: mobprintSources || {} });

// The A+ labs (group 'aplus'), in display order, and the Security+ & Network+ labs (every other lab).
export const isAplus = (lab) => !!lab && lab.group === 'aplus';

export const labOf = (labId) => LABS.find((l) => l.id === labId) || null;

// The full content case (for Subnet Sprint: the LEVEL), or null.
export function caseOf(labId, caseId) {
  return list(SOURCES[labId]).find((c) => c && c.id === caseId) || null;
}

// The six hands-on labs, in display order. Declarative: names, icons, pass marks, and each lab's cases read from the
// content modules (counts and ids are never assumed). Subnet Sprint's "cases" are its four generated-drill levels.
import firewallCases, { sources as fwSources } from './content/firewall-cases.js';
import logSets, { sources as logSources } from './content/log-sets.js';
import cliCases, { sources as cliSources } from './content/cli-cases.js';
import phishCases, { sources as phishSources } from './content/phish-cases.js';
import codeLabs, { sources as codeSources } from './content/code-labs.js';
import { LEVELS } from './subnet.js';

const SUBNET_OBJS = ['3.1', '4.1']; // logical segmentation (3.1), segmentation as a mitigation (4.1)
const subnetCases = LEVELS.map((lv, i) => ({ ...lv, title: lv.name, level: i + 1, objs: SUBNET_OBJS }));

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
];

const list = (v) => (Array.isArray(v) ? v : []);
const casesOf = (src) => list(src).filter((c) => c && typeof c.id === 'string')
  .map((c) => ({ id: c.id, title: String(c.title || c.id), level: Number(c.level) || 1, objs: list(c.objs).map(String) }));
const byObjId = (a, b) => a.split('.').map(Number).reduce((d, n, i) => d || n - Number(b.split('.')[i] || 0), 0);

export const LABS = Object.freeze(DEFS.map(({ source, ...lab }) => {
  const cases = casesOf(source);
  const objs = [...new Set(cases.flatMap((c) => c.objs))].sort(byObjId);
  return Object.freeze({ ...lab, objs, cases });
}));

const SOURCES = Object.fromEntries(DEFS.map((d) => [d.id, d.source]));

// Source references per lab: { key: ['Title', 'https://...'] } (cases list keys in `src`).
export const LAB_SOURCES = Object.freeze({ fw: fwSources || {}, logs: logSources || {}, subnet: {}, cli: cliSources || {}, phish: phishSources || {}, code: codeSources || {} });

export const labOf = (labId) => LABS.find((l) => l.id === labId) || null;

// The full content case (for Subnet Sprint: the LEVEL), or null.
export function caseOf(labId, caseId) {
  return list(SOURCES[labId]).find((c) => c && c.id === caseId) || null;
}

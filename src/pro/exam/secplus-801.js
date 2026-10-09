// CompTIA Security+ SY0-801 (V8): the exam's published format and domains, checked 2026-10-08 against CompTIA's
// SY0-801 exam objectives (Document Version 2.0) and the V8 certification page. Objective labels are short summaries
// in our own words; the numbers match CompTIA's objectives so every question can be tagged to one.
import bank from './secplus-801-bank.js';

export const blueprint = Object.freeze({
  id: 'secplus-801',
  name: 'CompTIA Security+',
  code: 'SY0-801',
  version: 'V8',
  launches: '2026-11-17',
  previous: { code: 'SY0-701', retires: '2027-06-11' }, // English; other languages Aug 13, 2027
  checked: '2026-10-08',
  questions: 90,
  minutes: 90,
  passing: '750 on a 100 to 900 scale',
  types: 'Multiple choice and performance-based (hands-on simulations)',
  target: 85, // this app's own bar for a mock, stricter on purpose; CompTIA's scaled 750 is not a fixed percentage
  links: {
    page: 'https://www.comptia.org/en-us/certifications/security/v8/',
    objectives: 'https://lecbyo.files.cmp.optimizely.com/download/77f3bd3223ac11f180820e495f189928',
    v7: 'https://www.comptia.org/en-us/certifications/security/v7/',
    pbq: 'https://www.comptia.org/en-us/resources/test-policies/exam-development/performance-based-questions-explained/',
    demo: 'https://demosim.comptia.org/',
  },
  domains: [
    { n: 1, name: 'General Security Concepts', weight: 16, objectives: [
      { id: '1.1', label: 'Security concepts and controls' },
      { id: '1.2', label: 'Change management and its effect on security' },
      { id: '1.3', label: 'Cryptographic solutions' },
    ] },
    { n: 2, name: 'Threats, Vulnerabilities, and Attacks', weight: 24, objectives: [
      { id: '2.1', label: 'Threat and vulnerability characteristics' },
      { id: '2.2', label: 'Threat actors and motivations' },
      { id: '2.3', label: 'Threat vectors and sources' },
      { id: '2.4', label: 'Vulnerability types and attack surfaces' },
      { id: '2.5', label: 'Indicators of malicious activity (scenarios)' },
      { id: '2.6', label: 'AI threats and vulnerabilities' },
    ] },
    { n: 3, name: 'Security Architecture', weight: 19, objectives: [
      { id: '3.1', label: 'Architecture models and their security' },
      { id: '3.2', label: 'Managing the architecture to protect infrastructure (scenarios)' },
      { id: '3.3', label: 'Protecting data' },
      { id: '3.4', label: 'Resilience and recovery' },
    ] },
    { n: 4, name: 'Security Operations', weight: 27, objectives: [
      { id: '4.1', label: 'Mitigating controls, techniques and solutions (scenarios)' },
      { id: '4.2', label: 'Hardware, software and data asset management' },
      { id: '4.3', label: 'Vulnerability management (scenarios)' },
      { id: '4.4', label: 'Alerting and monitoring' },
      { id: '4.5', label: 'Identity and access management (scenarios)' },
      { id: '4.6', label: 'Automation and orchestration (scenarios)' },
      { id: '4.7', label: 'Incident response' },
      { id: '4.8', label: 'Using data sources in an investigation (scenarios)' },
    ] },
    { n: 5, name: 'Security Program Management and Oversight', weight: 14, objectives: [
      { id: '5.1', label: 'Governance, risk and compliance documents' },
      { id: '5.2', label: 'Risk management' },
      { id: '5.3', label: 'Third-party risk' },
      { id: '5.4', label: 'Security compliance' },
      { id: '5.5', label: 'Audits and assessments' },
      { id: '5.6', label: 'Security awareness (scenarios)' },
    ] },
  ],
});

// Bank questions carry `obj`; the domain is the objective's first number.
export const questions = Object.freeze(bank.questions.map((q) => Object.freeze({ ...q, d: Number(q.obj.split('.')[0]) })));
export const sources = bank.sources;
export const byId = Object.freeze(Object.fromEntries(questions.map((q) => [q.id, q])));

export default { blueprint, questions, sources, byId };

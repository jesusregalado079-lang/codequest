// The certification exams this app practices, in display order: each one's published format and domains. Small and
// synchronous on purpose (the Journey page, the exams hub and the achievements read them without loading a bank).
// Objective labels are short summaries in our own words; the numbers match CompTIA's objectives so every question can
// be tagged to one. Question banks load separately (registry.js).

// CompTIA Security+ SY0-801 (V8), checked 2026-10-08 against CompTIA's SY0-801 exam objectives (Document Version 2.0)
// and the V8 certification page.
export const SECPLUS_801 = Object.freeze({
  id: 'secplus-801',
  short: 'Security+',
  prefix: 'sp8',
  name: 'CompTIA Security+',
  code: 'SY0-801',
  version: 'V8',
  launches: '2026-11-17',
  previous: { code: 'SY0-701', retires: '2027-06-11' }, // English; other languages Aug 13, 2027
  checked: '2026-10-08',
  questions: 90,
  minutes: 90,
  passing: '750 on a 100 to 900 scale',
  passScore: 750,
  types: 'Multiple choice and performance-based (hands-on simulations)',
  target: 85, // this app's own bar for a mock, stricter on purpose; CompTIA's scaled 750 is not a fixed percentage
  sourcesNote: 'NIST, CISA, OWASP, MITRE, vendor docs',
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

// The three below were checked 2026-10-09 on comptia.org (cert pages) and against each exam's objectives document
// (.foreman/scratch/certs/SOURCES.md). CompTIA says an exam usually retires about three years after launch, so their
// retirement years are estimates.
const SHARED_LINKS = {
  pbq: 'https://www.comptia.org/en-us/resources/test-policies/exam-development/performance-based-questions-explained/',
  demo: 'https://demosim.comptia.org/',
};

// CompTIA Network+ V9 N10-009 (objectives Document Version 6.0).
export const NETPLUS_009 = Object.freeze({
  id: 'netplus-009',
  short: 'Network+',
  prefix: 'np9',
  name: 'CompTIA Network+',
  code: 'N10-009',
  version: 'V9',
  launched: '2024-06-20',
  retiresEst: '2027',
  checked: '2026-10-09',
  questions: 90,
  minutes: 90,
  passing: '720 on a 100 to 900 scale',
  passScore: 720,
  types: 'Multiple choice and performance-based (hands-on simulations)',
  target: 85,
  sourcesNote: 'IETF RFCs, IEEE, IANA, NIST, vendor docs',
  links: { page: 'https://www.comptia.org/en-us/certifications/network/', ...SHARED_LINKS },
  domains: [
    { n: 1, name: 'Networking Concepts', weight: 23, objectives: [
      { id: '1.1', label: 'The OSI reference model and its layers' },
      { id: '1.2', label: 'Network appliances, applications and functions' },
      { id: '1.3', label: 'Cloud concepts and connectivity options' },
      { id: '1.4', label: 'Ports, protocols, services and traffic types' },
      { id: '1.5', label: 'Transmission media and transceivers' },
      { id: '1.6', label: 'Topologies, architectures and network types' },
      { id: '1.7', label: 'IPv4 addressing (scenarios)' },
      { id: '1.8', label: 'Modern network use cases: SDN, VXLAN, zero trust, IaC, IPv6' },
    ] },
    { n: 2, name: 'Network Implementation', weight: 20, objectives: [
      { id: '2.1', label: 'Routing technologies' },
      { id: '2.2', label: 'Switching technologies and features (scenarios)' },
      { id: '2.3', label: 'Wireless devices and technologies (scenarios)' },
      { id: '2.4', label: 'Physical installation factors' },
    ] },
    { n: 3, name: 'Network Operations', weight: 19, objectives: [
      { id: '3.1', label: 'Organizational processes and procedures' },
      { id: '3.2', label: 'Network monitoring technologies (scenarios)' },
      { id: '3.3', label: 'Disaster recovery concepts' },
      { id: '3.4', label: 'IPv4 and IPv6 network services (scenarios)' },
      { id: '3.5', label: 'Network access and management methods' },
    ] },
    { n: 4, name: 'Network Security', weight: 14, objectives: [
      { id: '4.1', label: 'Basic network security concepts' },
      { id: '4.2', label: 'Attack types and their impact on the network' },
      { id: '4.3', label: 'Security features, defenses and solutions (scenarios)' },
    ] },
    { n: 5, name: 'Network Troubleshooting', weight: 24, objectives: [
      { id: '5.1', label: 'The troubleshooting methodology' },
      { id: '5.2', label: 'Cabling and physical interface issues (scenarios)' },
      { id: '5.3', label: 'Network service issues (scenarios)' },
      { id: '5.4', label: 'Performance issues (scenarios)' },
      { id: '5.5', label: 'Tools and protocols for solving network issues (scenarios)' },
    ] },
  ],
});

// CompTIA A+ Core 1 V15 220-1201 (objectives Document Version 4.0).
export const APLUS_1201 = Object.freeze({
  id: 'aplus-1201',
  short: 'A+ Core 1',
  prefix: 'ap1',
  name: 'CompTIA A+ Core 1',
  code: '220-1201',
  version: 'V15',
  launched: '2025-03-25',
  retiresEst: '2028',
  checked: '2026-10-09',
  questions: 90,
  minutes: 90,
  passing: '675 on a 100 to 900 scale',
  passScore: 675,
  types: 'Multiple choice and performance-based (hands-on simulations)',
  target: 85,
  sourcesNote: 'vendor docs, IEEE, USB-IF, JEDEC, IANA',
  links: { page: 'https://www.comptia.org/en-us/certifications/a/core-1-v15/', ...SHARED_LINKS },
  domains: [
    { n: 1, name: 'Mobile Devices', weight: 13, objectives: [
      { id: '1.1', label: 'Mobile device hardware and replacement (scenarios)' },
      { id: '1.2', label: 'Mobile accessories and connectivity options' },
      { id: '1.3', label: 'Mobile network connectivity and app support (scenarios)' },
    ] },
    { n: 2, name: 'Networking', weight: 23, objectives: [
      { id: '2.1', label: 'TCP and UDP ports, protocols and their purposes' },
      { id: '2.2', label: 'Wireless networking technologies' },
      { id: '2.3', label: 'Services provided by networked hosts' },
      { id: '2.4', label: 'Common network configuration concepts' },
      { id: '2.5', label: 'Networking hardware devices' },
      { id: '2.6', label: 'Setting up a small office or home network (scenarios)' },
      { id: '2.7', label: 'Internet connection types and network types' },
      { id: '2.8', label: 'Networking tools and their purposes' },
    ] },
    { n: 3, name: 'Hardware', weight: 25, objectives: [
      { id: '3.1', label: 'Display components and attributes' },
      { id: '3.2', label: 'Cable types and connectors' },
      { id: '3.3', label: 'RAM characteristics' },
      { id: '3.4', label: 'Storage devices' },
      { id: '3.5', label: 'Motherboards, CPUs and add-on cards (scenarios)' },
      { id: '3.6', label: 'Choosing and installing a power supply (scenarios)' },
      { id: '3.7', label: 'Multifunction devices and printers: setup and settings (scenarios)' },
      { id: '3.8', label: 'Printer maintenance (scenarios)' },
    ] },
    { n: 4, name: 'Virtualization and Cloud Computing', weight: 11, objectives: [
      { id: '4.1', label: 'Virtualization concepts' },
      { id: '4.2', label: 'Cloud computing concepts' },
    ] },
    { n: 5, name: 'Hardware and Network Troubleshooting', weight: 28, objectives: [
      { id: '5.1', label: 'Motherboard, RAM, CPU and power problems (scenarios)' },
      { id: '5.2', label: 'Drive and RAID problems (scenarios)' },
      { id: '5.3', label: 'Video, projector and display problems (scenarios)' },
      { id: '5.4', label: 'Mobile device problems (scenarios)' },
      { id: '5.5', label: 'Network problems (scenarios)' },
      { id: '5.6', label: 'Printer problems (scenarios)' },
    ] },
  ],
});

// CompTIA A+ Core 2 V15 220-1202 (objectives Document Version 4.0).
export const APLUS_1202 = Object.freeze({
  id: 'aplus-1202',
  short: 'A+ Core 2',
  prefix: 'ap2',
  name: 'CompTIA A+ Core 2',
  code: '220-1202',
  version: 'V15',
  launched: '2025-03-25',
  retiresEst: '2028',
  checked: '2026-10-09',
  questions: 90,
  minutes: 90,
  passing: '700 on a 100 to 900 scale',
  passScore: 700,
  types: 'Multiple choice and performance-based (hands-on simulations)',
  target: 85,
  sourcesNote: 'Microsoft, Apple, Google and Linux docs, NIST, CISA, OSHA, EPA',
  links: { page: 'https://www.comptia.org/en-us/certifications/a/core-2-v15/', ...SHARED_LINKS },
  domains: [
    { n: 1, name: 'Operating Systems', weight: 28, objectives: [
      { id: '1.1', label: 'Operating system types and their purposes' },
      { id: '1.2', label: 'OS installations and upgrades (scenarios)' },
      { id: '1.3', label: 'Windows editions and their features' },
      { id: '1.4', label: 'Windows features and tools (scenarios)' },
      { id: '1.5', label: 'Windows command-line tools (scenarios)' },
      { id: '1.6', label: 'Windows settings (scenarios)' },
      { id: '1.7', label: 'Windows networking on a client (scenarios)' },
      { id: '1.8', label: 'macOS features and tools' },
      { id: '1.9', label: 'Linux desktop features and tools' },
      { id: '1.10', label: 'Installing applications to requirements (scenarios)' },
      { id: '1.11', label: 'Cloud-based productivity tools (scenarios)' },
    ] },
    { n: 2, name: 'Security', weight: 28, objectives: [
      { id: '2.1', label: 'Security measures and their purposes' },
      { id: '2.2', label: 'Windows security settings (scenarios)' },
      { id: '2.3', label: 'Wireless security protocols and authentication' },
      { id: '2.4', label: 'Malware types and how to detect, remove and prevent them' },
      { id: '2.5', label: 'Social engineering attacks, threats and vulnerabilities' },
      { id: '2.6', label: 'Malware removal steps for a small office or home (scenarios)' },
      { id: '2.7', label: 'Workstation security and hardening (scenarios)' },
      { id: '2.8', label: 'Securing mobile devices (scenarios)' },
      { id: '2.9', label: 'Data destruction and disposal' },
      { id: '2.10', label: 'Securing small office and home networks (scenarios)' },
      { id: '2.11', label: 'Browser security settings (scenarios)' },
    ] },
    { n: 3, name: 'Software Troubleshooting', weight: 23, objectives: [
      { id: '3.1', label: 'Windows OS problems (scenarios)' },
      { id: '3.2', label: 'Mobile OS and app problems (scenarios)' },
      { id: '3.3', label: 'Mobile OS and app security problems (scenarios)' },
      { id: '3.4', label: 'PC security problems (scenarios)' },
    ] },
    { n: 4, name: 'Operational Procedures', weight: 21, objectives: [
      { id: '4.1', label: 'Documentation and support systems (scenarios)' },
      { id: '4.2', label: 'Change management procedures (scenarios)' },
      { id: '4.3', label: 'Workstation backup and recovery (scenarios)' },
      { id: '4.4', label: 'Safety procedures (scenarios)' },
      { id: '4.5', label: 'Environmental impacts and controls' },
      { id: '4.6', label: 'Prohibited content, privacy, licensing and policy' },
      { id: '4.7', label: 'Communication and professionalism (scenarios)' },
      { id: '4.8', label: 'Scripting basics' },
      { id: '4.9', label: 'Remote access technologies (scenarios)' },
      { id: '4.10', label: 'Artificial intelligence basics' },
    ] },
  ],
});

export const BLUEPRINTS = Object.freeze([SECPLUS_801, NETPLUS_009, APLUS_1201, APLUS_1202]);

// Bank questions carry `obj`; the domain is the objective's first number ('1.10' is domain 1).
export const domainOfObj = (obj) => Number(String(obj).split('.')[0]);

// A loaded bank as the exam pages use it: { blueprint, questions (with domain `d`), sources, byId }.
export function examModule(blueprint, bank) {
  const questions = Object.freeze((bank.questions || []).map((q) => Object.freeze({ ...q, d: domainOfObj(q.obj) })));
  return { blueprint, questions, sources: bank.sources || {}, byId: Object.freeze(Object.fromEntries(questions.map((q) => [q.id, q]))) };
}

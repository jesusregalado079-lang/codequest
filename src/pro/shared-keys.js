// Which Expedited checkmarks are the same checkmark as a roadmap one, and which are deliberately NOT.
// A checkmark is saved under an item's key, so two items show one checkmark only when they use the same key.
//
// SHARING RULES (test/pro-career.test.js enforces the mechanical ones)
//  1. Share one id only when both roadmaps ask for the SAME work, at the SAME scope, with the SAME finish line.
//     Checking it on either page must then mean exactly the same thing on both.
//  2. The same link is not enough. Several items cite one URL but ask for different work (see the list below).
//  3. Never share a smaller item with a larger one. Finishing the smaller (Bandit to level 15) would falsely
//     mark the larger (all 34 levels) done.
//  4. Never share a "do or build this" item with a "read or use this resource" item, in either direction. The
//     checkmark would claim work that was not done.
//  5. One Expedited key maps to at most one roadmap id. If the roadmap lists the same resource twice, the
//     Expedited item stays separate.
//  6. Every Expedited item whose link matches a roadmap, Extra or Studies link must be listed in
//     EXPEDITED_SHARED_V1 or EXPEDITED_KEPT_SEPARATE, with a written reason. The test fails otherwise, so a new
//     item forces a decision.
//  7. Moving an item from separate to shared needs a new carry-over migration (never edit the one below) and the
//     same change must delete its entry from EXPEDITED_KEPT_SEPARATE.
//  8. Every separate item also says, in plain words, what each plan asks for (`expeditedAsks`, `roadmap[].asks`).
//     plan-diff.js shows those on both pages next to the item, with whether the OTHER plan's item is done.

// Added 2026-10-26. These Expedited items use the roadmap id as their key, so one checkmark shows on both
// roadmaps (like the two Professor Messer courses). Each pair is [old Expedited key, roadmap id]: a checkmark
// already saved under the old key is carried over once. FROZEN: add a new migration instead of editing this one.
export const EXPEDITED_SHARED_V1 = Object.freeze([
  ['exp0-shell', 'p2-the-unix-shell-absolute-beginner-navigation'],
  ['exp7-powershell', 'p2-introduction-to-powershell'],
  ['exp8-owasp-agentic-applications', 'p8-owasp-top-10-for-agentic-applications'],
]);

// Added 2026-10-26. The Studies copies of KC7 and Wazuh (from the 10/16 approved batch) had their own ids, so they
// never showed the roadmap's checkmark. They now use the roadmap ids, as SCHEMA.md requires for the same course listed
// on two pages. Each pair is [old Studies id, roadmap id]: a checkmark already saved under the old id is carried over
// once. FROZEN: add a new migration instead of editing this one.
export const STUDIES_SHARED_V1 = Object.freeze([
  ['s-approved-p3-kc7', 'p3-kc7'],
  ['s-approved-p3-wazuh', 'p3-wazuh'],
]);

// Expedited items that use a roadmap id as their key from the start (nothing to carry over): the two Professor
// Messer courses, and the items added 2026-10-26 that ask for exactly the roadmap's work. Together with the targets
// of EXPEDITED_SHARED_V1 this is the complete list of shared checkmarks; the test checks it against the data.
export const EXPEDITED_SHARED_DIRECT = Object.freeze([
  'p2-comptia-network-n10-009-free-course',
  'p2-comptia-security-sy0-701-foundations-checkpoint',
  's3-switchlab',
  'p3-kql-sample-queries',
  'p3-kc7',
  'p6-pwc-cyber-security-consulting-job-simulation',
  'p6-deloitte-cyber-job-simulation',
  'p6-tata-iam-developer-job-simulation',
]);

// Written record of every Expedited item that links to the same place as a roadmap item but keeps its OWN
// checkmark. The Expedited key stays `exp…`, never a roadmap id. Checking either side never checks the other.
//   key           the Expedited item
//   expeditedAsks what the Expedited item asks for, in plain words (shown on the roadmap item)
//   roadmap       each roadmap/Studies item it was compared with: its id, where it lives, what it asks for
//                 (`asks` is shown on the Expedited item)
//   reason        why they stay separate, citing the rule numbers above
export const EXPEDITED_KEPT_SEPARATE = Object.freeze([
  {
    key: 'exp2-interview',
    expeditedAsks: 'Practice six named interview scenarios: no internet, locked account, slow PC, printer failure, software install and a permissions issue.',
    roadmap: [
      { id: 's3-servicedesk-simulator', where: 'Studies list', asks: 'Lists the ServiceDesk Simulator site as a practice tool. It sets no scenario list and no finish line.' },
    ],
    reason: 'Expedited asks for practice on six named interview scenarios (no internet, locked account, slow PC, printer, software install, permissions). The Studies entry is only the ServiceDesk Simulator site, one tool for that practice. Using the site once does not mean the scenario practice is done (rule 4).',
  },
  {
    key: 'exp4-windowslogs',
    expeditedAsks: 'A wider Windows security lab: local users and groups, failed and successful logins, Event Viewer filtering and exported evidence.',
    roadmap: [
      { id: 'p2-event-viewer-inspect-windows-evidence', where: 'Phase 2', asks: 'Event Viewer only: log types, filtering and export, logon auditing, and correlating your test account. Local accounts and groups are a separate roadmap item.' },
    ],
    reason: 'Expedited is a wider Windows security lab: local users and groups, failed and successful logins, Event Viewer filtering and exported evidence. The roadmap item covers the Event Viewer part only (log types, filtering, auditing, correlating the test account); local accounts and groups are a separate roadmap item (p2-windows-local-accounts-groups-and-permissions). Finishing the narrower roadmap item must not complete the wider lab (rule 3).',
  },
  {
    key: 'exp4-linux',
    expeditedAsks: 'Bandit through at least level 15 before the SOC lab. The full game is left for the backup roadmap.',
    roadmap: [
      { id: 'p2-bandit-wargame', where: 'Phase 2', asks: 'All 34 Bandit levels, not just the first 15.' },
    ],
    reason: 'Expedited asks for Bandit through at least level 15 before the SOC lab. The roadmap asks for all 34 levels. Sharing would mark the whole game done at level 15 (rule 3).',
  },
  {
    key: 'exp5-sysmon',
    expeditedAsks: 'Configure Sysmon (installed with a starter configuration in the step before) and identify useful process, network and login telemetry. Sending it to Wazuh is its own separate Expedited item.',
    roadmap: [
      { id: 'p3-sysmon', where: 'Phase 3', asks: 'Install Sysmon and the Wazuh agent on the HP, forward the events to the Wazuh manager, and verify collection before any Atomic test.' },
    ],
    reason: 'Different scope. Expedited asks to configure Sysmon (installed in the step before) and identify useful process, network and login telemetry. The roadmap item also installs the Wazuh agent and forwards the events to the Wazuh manager, which Expedited tracks as its own separate item (exp5-wazuh). Neither completes the other (rules 1 and 3).',
  },
  {
    key: 'exp5-wazuh',
    expeditedAsks: 'Run Wazuh\'s single-node Docker deployment in WSL2 on the HP, send lab telemetry to it and verify events arrive reliably.',
    roadmap: [
      { id: 'p3-wazuh', where: 'Phase 3', asks: 'A bigger build: a reproducible single-node setup on the HP plus sanitized dashboards and a demo. Custom detections are a separate roadmap item.' },
    ],
    reason: 'Expedited asks only to run Wazuh on the HP and verify that telemetry arrives. The Phase 3 roadmap item also asks for a reproducible setup, sanitized dashboards and a demo, so finishing the Expedited step must not complete it (rule 3). The Studies Wazuh entry uses the roadmap id, so it shows the same note.',
  },
  {
    key: 'exp5-detect',
    expeditedAsks: 'Create or tune one Wazuh custom rule, test malicious and benign cases, and document one false positive and your adjustment.',
    roadmap: [
      { id: 'p3-wazuh-custom-rules-deploy-and-test', where: 'Phase 3', asks: 'A bigger job: translate Sigma rules to the fields Wazuh actually decodes, test with wazuh-logtest, replay lab actions, save alert evidence and commit the rule files.' },
    ],
    reason: 'Expedited asks for one custom rule with a false-positive write-up. The Phase 3 roadmap item also translates Sigma rules, tests them with wazuh-logtest, replays lab actions and commits the rule files, so finishing the Expedited step must not complete it (rule 3).',
  },
  {
    key: 'exp5-attack',
    expeditedAsks: 'Simulate at least two harmless, controlled techniques in your own lab and map them to MITRE ATT&CK.',
    roadmap: [
      { id: 'p3-att-and-ck-matrix', where: 'Phase 3', asks: 'Map observed techniques and evidence to ATT&CK, then build the coverage matrix and an incident report with timeline, severity, containment, remediation and detection limits.' },
    ],
    reason: 'Expedited asks to simulate at least two harmless techniques in your own lab and map them to ATT&CK. The roadmap item is a reference whose time also covers the coverage matrix and an incident report with timeline, severity, containment and remediation. Different deliverables (rules 1 and 4).',
  },
  {
    key: 'exp8-owasp',
    expeditedAsks: 'Study the 2026 LLM/GenAI risks and reproduce harmless prompt-injection and evaluation cases with synthetic data.',
    roadmap: [
      { id: 'p8-owasp-top-10-for-llm-applications', where: 'Phase 8', asks: 'Revisit the 2026 edition against your own implementation, mark each item applicable or not, and add cases to the evaluation harness.' },
      { id: 'p3-owasp-top-10-for-llm-applications', where: 'Phase 3', asks: 'Read the 2026 edition alongside the working lab, then finish the starter agent threat model and prompt evaluations from Phase 1.' },
    ],
    reason: 'Expedited asks to study the 2026 LLM/GenAI risks and reproduce harmless prompt-injection and evaluation cases with synthetic data. The roadmap lists this resource twice (Phase 3 reading plus the agent threat model, Phase 8 revisit and applicability scoping), each with different work, and one Expedited key cannot match both (rules 4 and 5).',
  },
  {
    key: 'exp8-atlas',
    expeditedAsks: 'Map two AI-system threat scenarios to MITRE ATLAS.',
    roadmap: [
      { id: 'p8-mitre-atlas', where: 'Phase 8', asks: 'Reference item: MITRE ATLAS, the ATT&CK counterpart for threats to AI systems. It sets no mapping task.' },
    ],
    reason: 'Expedited is an exercise: map two AI-system threat scenarios to MITRE ATLAS. The roadmap item is the ATLAS reference with no defined task. Reading or using the reference is not the mapping exercise (rule 4).',
  },
  {
    key: 'exp8-mcp',
    expeditedAsks: 'Threat-model one MCP/agent workflow: tools, permissions, trust boundaries, injection paths, data exposure and human approval gates.',
    roadmap: [
      { id: 'p8-model-context-protocol-specification', where: 'Phase 8', asks: 'Go much further: threat-model a real local MCP server, run controlled attack tests, harden its permissions and build a secure reference.' },
    ],
    reason: 'Expedited asks to threat-model one MCP/agent workflow. The roadmap item is far larger: threat-model a real local MCP server, run controlled attack tests, harden permissions and build a secure reference. Finishing the smaller Expedited task must not complete the roadmap build (rule 3).',
  },
]);

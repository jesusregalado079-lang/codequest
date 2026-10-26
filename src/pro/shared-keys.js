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

// Added 2026-10-26. These Expedited items use the roadmap id as their key, so one checkmark shows on both
// roadmaps (like the two Professor Messer courses). Each pair is [old Expedited key, roadmap id]: a checkmark
// already saved under the old key is carried over once. FROZEN: add a new migration instead of editing this one.
export const EXPEDITED_SHARED_V1 = Object.freeze([
  ['exp0-shell', 'p2-the-unix-shell-absolute-beginner-navigation'],
  ['exp7-powershell', 'p2-introduction-to-powershell'],
  ['exp8-owasp-agentic-applications', 'p8-owasp-top-10-for-agentic-applications'],
]);

// Written record of every Expedited item that links to the same place as a roadmap item but keeps its OWN
// checkmark, and why. The Expedited key stays `exp…`, never a roadmap id. `roadmap` lists the roadmap ids it was
// compared with. Checking either side never checks the other.
export const EXPEDITED_KEPT_SEPARATE = Object.freeze([
  {
    key: 'exp2-interview',
    roadmap: ['s3-servicedesk-simulator'],
    reason: 'Expedited asks for practice on six named interview scenarios (no internet, locked account, slow PC, printer, software install, permissions). The Studies entry is only the ServiceDesk Simulator site, one tool for that practice. Using the site once does not mean the scenario practice is done (rule 4).',
  },
  {
    key: 'exp4-windowslogs',
    roadmap: ['p2-event-viewer-inspect-windows-evidence'],
    reason: 'Expedited is a wider Windows security lab: local users and groups, failed and successful logins, Event Viewer filtering and exported evidence. The roadmap item covers the Event Viewer part only (log types, filtering, auditing, correlating the test account); local accounts and groups are a separate roadmap item (p2-windows-local-accounts-groups-and-permissions). Finishing the narrower roadmap item must not complete the wider lab (rule 3).',
  },
  {
    key: 'exp4-linux',
    roadmap: ['p2-bandit-wargame'],
    reason: 'Expedited asks for Bandit through at least level 15 before the SOC lab. The roadmap asks for all 34 levels. Sharing would mark the whole game done at level 15 (rule 3).',
  },
  {
    key: 'exp5-sysmon',
    roadmap: ['p3-sysmon'],
    reason: 'Different scope. Expedited asks to install and configure Sysmon and identify useful process, network and login telemetry. The roadmap item also installs the Wazuh agent and forwards the events to the Wazuh manager, which Expedited tracks as its own separate item (exp5-wazuh). Neither completes the other (rules 1 and 3).',
  },
  {
    key: 'exp5-attack',
    roadmap: ['p3-att-and-ck-matrix'],
    reason: 'Expedited asks to simulate at least two harmless techniques in your own lab and map them to ATT&CK. The roadmap item is a reference whose time also covers the coverage matrix and an incident report with timeline, severity, containment and remediation. Different deliverables (rules 1 and 4).',
  },
  {
    key: 'exp8-owasp',
    roadmap: ['p8-owasp-top-10-for-llm-applications', 'p3-owasp-top-10-for-llm-applications'],
    reason: 'Expedited asks to study the 2026 LLM/GenAI risks and reproduce harmless prompt-injection and evaluation cases with synthetic data. The roadmap lists this resource twice (Phase 3 reading plus the agent threat model, Phase 8 revisit and applicability scoping), each with different work, and one Expedited key cannot match both (rules 4 and 5).',
  },
  {
    key: 'exp8-atlas',
    roadmap: ['p8-mitre-atlas'],
    reason: 'Expedited is an exercise: map two AI-system threat scenarios to MITRE ATLAS. The roadmap item is the ATLAS reference with no defined task. Reading or using the reference is not the mapping exercise (rule 4).',
  },
  {
    key: 'exp8-mcp',
    roadmap: ['p8-model-context-protocol-specification'],
    reason: 'Expedited asks to threat-model one MCP/agent workflow. The roadmap item is far larger: threat-model a real local MCP server, run controlled attack tests, harden permissions and build a secure reference. Finishing the smaller Expedited task must not complete the roadmap build (rule 3).',
  },
]);

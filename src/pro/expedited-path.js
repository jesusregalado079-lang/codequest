// Expedited roadmap — employment-first cybersecurity path.
// This is additive: the original career-path.js remains the deep/backup curriculum.
// Costs are US retail planning figures checked in 2026 and should be verified before purchase.

export const summary = {
  title: 'Expedited Cybersecurity Roadmap',
  subtitle: 'Zero IT experience → first technical role → security role',
  target: 'Start IT applications around months 2–3; become security-competitive around months 6–9 while continuing the full roadmap as backup training.',
  costNote: 'Training can be mostly free. Current planning budget for all three CompTIA exams at US retail: A+ $548 total ($274 × 2), Network+ $399, Security+ $439 = $1,386 before discounts, taxes, retakes, or bundles. Verify pricing before purchase.',
};

const E = (n, title, opts) => ({ n, title, ...opts });

export default [
  E(0, 'Stage 0 — Computer & IT Orientation', {
    timing: '1–2 weeks',
    months: 'weeks 1–2',
    cost: '$0',
    hours: [12, 20],
    blurb: 'Get comfortable with the systems underneath cybersecurity before chasing certifications. The goal is basic confidence with Windows, files, users, permissions, command line, troubleshooting, and a simple VM.',
    items: [
      { key: 'exp0-windows', name: 'Windows basics: files, processes, Task Manager, Device Manager, updates, users and permissions', hours: 5, url: 'https://learn.microsoft.com/en-us/windows/' },
      { key: 'exp0-shell', name: 'Absolute-beginner shell navigation: pwd, ls, cd, mkdir, cp, mv, rm, help/man', hours: 4, url: 'https://swcarpentry.github.io/shell-novice/' },
      { key: 'exp0-vm', name: 'Create one disposable Windows or Linux virtual machine and document how to start, stop, snapshot and restore it', hours: 4 },
      { key: 'exp0-proof', name: 'Checkpoint: explain administrator vs standard user, file permissions, process vs service, and what an operating system does without AI assistance', hours: 2 },
    ],
  }),

  E(1, 'Stage 1 — CompTIA A+ + Hands-On Support Skills', {
    timing: '8–12 weeks',
    months: 'months 1–3',
    cost: '$548 retail exam budget',
    hours: [90, 130],
    blurb: 'Your first major foundation because you are starting from zero traditional IT experience. Learn both A+ cores and practice the troubleshooting skills that entry-level IT support jobs screen for. Do not wait for perfection before moving to the employment gate.',
    items: [
      { key: 'exp1-a-core1', name: 'A+ Core 1 (220-1201): hardware, mobile devices, networking, virtualization/cloud, troubleshooting', hours: 45, url: 'https://www.comptia.org/certifications/a' },
      { key: 'exp1-a-core2', name: 'A+ Core 2 (220-1202): operating systems, security, software troubleshooting, operational procedures', hours: 45, url: 'https://www.comptia.org/certifications/a' },
      { key: 'exp1-lab', name: 'Hands-on support lab: create user, change permissions, install/remove software, inspect startup apps/services, troubleshoot a broken network setting, document fixes', hours: 15 },
      { key: 'exp1-practice', name: 'Readiness gate: consistently score about 80–85%+ on reputable practice exams and explain missed answers without relying on AI', hours: 10 },
      { key: 'exp1-exam1', name: 'Optional/expected: pass A+ Core 1 exam — current planning price $274 retail', hours: 0 },
      { key: 'exp1-exam2', name: 'Optional/expected: pass A+ Core 2 exam — current planning price $274 retail', hours: 0 },
    ],
  }),

  E(2, 'Employment Gate #1 — Start Applying Now', {
    timing: 'start around months 2–3; continue weekly',
    months: 'months 2–4+',
    cost: '$0',
    hours: [12, 24],
    blurb: 'Do not wait for Security+ to start building paid technical experience. Apply for Tier 1 help desk, service desk, desktop support, IT technician and security-adjacent support roles while continuing the roadmap.',
    items: [
      { key: 'exp2-resume', name: 'Create a technical resume version featuring CodeQuest/AI projects, support lab, GitHub, A+ progress and troubleshooting evidence', hours: 4 },
      { key: 'exp2-postings', name: 'Save 10 current local/location-eligible IT support postings and record recurring skills/cert requirements', hours: 3 },
      { key: 'exp2-apps10', name: 'Submit first 10 targeted applications', hours: 4 },
      { key: 'exp2-apps25', name: 'Reach 25 targeted applications and review response rate; adjust resume if needed', hours: 5 },
      { key: 'exp2-interview', name: 'Practice support interview scenarios: no internet, locked account, slow PC, printer failure, software install, permissions issue', hours: 4 },
    ],
  }),

  E(3, 'Stage 2 — Networking Core', {
    timing: '5–8 weeks',
    months: 'months 3–5',
    cost: '$0 learning / $399 Network+ exam if taken',
    hours: [55, 80],
    blurb: 'Cybersecurity becomes much easier once networking stops being mysterious. Learn the Network+ material whether or not you immediately buy the exam.',
    items: [
      { key: 'https://www.professormesser.com/network-plus/n10-009/n10-009-video/n10-009-training-course/', name: 'Professor Messer Network+ N10-009 full course + notes/practice', hours: 40, url: 'https://www.professormesser.com/network-plus/n10-009/n10-009-video/n10-009-training-course/' },
      { key: 'exp3-wireshark', name: 'Wireshark lab: capture DNS, TCP handshake and HTTP/HTTPS traffic; identify source/destination IPs and ports', hours: 8, url: 'https://www.wireshark.org/docs/' },
      { key: 'exp3-dns', name: 'Troubleshooting gate: machine can ping 8.8.8.8 but names do not resolve — diagnose and explain why DNS is suspected', hours: 3 },
      { key: 'exp3-core', name: 'Explain DHCP, DNS, NAT, TCP vs UDP, common ports, subnetting basics, routers, switches, VPNs and firewalls without AI', hours: 5 },
      { key: 'exp3-netexam', name: 'Optional: take Network+ N10-009 if it materially helps your target roles — current planning price $399 retail', hours: 0 },
    ],
  }),

  E(4, 'Stage 3 — Security+ + Security Foundations', {
    timing: '5–8 weeks',
    months: 'months 4–6',
    cost: '$0 learning / $439 Security+ exam',
    hours: [55, 80],
    blurb: 'Build the broad security vocabulary employers expect, but pair it with actual Windows/Linux evidence. Take Security+ when you understand the material and can afford the exam without creating financial strain.',
    items: [
      { key: 'https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/sy0-701-comptia-security-plus-course/', name: 'Professor Messer Security+ SY0-701 course + notes/practice', hours: 35, url: 'https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/sy0-701-comptia-security-plus-course/' },
      { key: 'exp4-windowslogs', name: 'Windows security lab: local users/groups, failed/successful logins, Event Viewer filtering and exported evidence', hours: 8, url: 'https://learn.microsoft.com/en-us/shows/inside/event-viewer' },
      { key: 'exp4-linux', name: 'Linux practice: complete Bandit through at least level 15 before SOC lab; continue the full game on the backup roadmap', hours: 8, url: 'https://overthewire.org/wargames/bandit/' },
      { key: 'exp4-incident', name: 'Write one mini incident report separating detection, containment, eradication, recovery and lessons learned', hours: 3 },
      { key: 'exp4-practice', name: 'Security+ readiness gate: stable 80–85%+ practice scores plus ability to explain threat/vulnerability/risk, authn/authz, hashing/encryption and incident response', hours: 5 },
      { key: 'exp4-secexam', name: 'Pass Security+ SY0-701 — current planning price $439 retail', hours: 0 },
    ],
  }),

  E(5, 'Stage 4 — SOC Portfolio Lab', {
    timing: '4–8 weeks',
    months: 'months 5–7',
    cost: '$0–$50 typical lab budget',
    hours: [45, 70],
    blurb: 'Turn certifications into evidence. Build a small Windows/Linux defensive lab, generate known activity, collect logs, write a detection and explain a false positive. This is the expedited version of your deeper Phase 3 Defensive Engineering Lab.',
    items: [
      { key: 'exp5-lab', name: 'Build Windows + Linux VM lab and one simple network diagram', hours: 10 },
      { key: 'exp5-sysmon', name: 'Install/configure Sysmon and identify useful process/network/login telemetry', hours: 7, url: 'https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon' },
      { key: 'exp5-wazuh', name: 'Send lab telemetry to Wazuh and verify events arrive reliably', hours: 10, url: 'https://documentation.wazuh.com/' },
      { key: 'exp5-attack', name: 'Simulate at least two harmless, controlled techniques in your own lab and map them to MITRE ATT&CK', hours: 8, url: 'https://attack.mitre.org/' },
      { key: 'exp5-detect', name: 'Create/tune at least one detection, test malicious + benign cases, document one false positive and your adjustment', hours: 8 },
      { key: 'exp5-writeup', name: 'Publish a sanitized GitHub case study: architecture → event → detection → investigation → tuning → lessons learned', hours: 8 },
    ],
  }),

  E(6, 'Employment Gate #2 — Security-Adjacent / SOC Roles', {
    timing: 'start around months 6–7; continue until hired',
    months: 'months 6–9+',
    cost: '$0',
    hours: [18, 30],
    blurb: 'Now target SOC Analyst I, Junior Security Analyst, NOC, IAM support, security support and IT roles with security duties. Keep help-desk/IT support as the adjacent fallback because paid technical experience compounds quickly.',
    items: [
      { key: 'exp6-portfolio', name: 'Create interview-ready portfolio page linking A+/Network+/Security+ progress, SOC lab, diagram and incident walkthrough', hours: 5 },
      { key: 'exp6-postings', name: 'Refresh 10 security/security-adjacent postings and rank recurring tools: SIEM, EDR, AD/Entra, ticketing, PowerShell, networking', hours: 3 },
      { key: 'exp6-apps', name: 'Submit 20 targeted security/security-adjacent applications', hours: 8 },
      { key: 'exp6-mock', name: 'Complete two mock SOC interviews with log-analysis and incident-triage scenarios', hours: 4 },
      { key: 'exp6-role', name: 'Land first technical role or paid technical client contract; document actual duties and gaps to train next', hours: 0 },
    ],
  }),

  E(7, 'Stage 5 — Automation & Cloud Security', {
    timing: '6–10 weeks, preferably while employed/applying',
    months: 'months 7–10',
    cost: '$0–$100 lab/cloud budget',
    hours: [55, 85],
    blurb: 'Add Python, PowerShell, cloud/IAM and CI only after the employment-first foundation is moving. Pull the deeper material from your original roadmap as the exact job or portfolio gap demands.',
    items: [
      { key: 'exp7-python', name: 'Python: files, JSON, requests, regex, error handling; build one log or IOC automation', hours: 20, url: 'https://docs.python.org/3/tutorial/' },
      { key: 'exp7-powershell', name: 'PowerShell: objects, pipelines, Get-Process, Get-WinEvent, Export-Csv; automate one evidence collection task', hours: 10, url: 'https://learn.microsoft.com/en-us/training/modules/introduction-to-powershell/' },
      { key: 'exp7-cloud', name: 'Cloud/IAM lab: users/roles, least privilege, MFA, logging; deliberately misconfigure something in a controlled lab and prove the remediation', hours: 20 },
      { key: 'exp7-ci', name: 'Add tests/CI to one security automation repository and preserve a failing-before/passing-after example', hours: 8 },
    ],
  }),

  E(8, 'Stage 6 — AI / Agent Security Specialization', {
    timing: 'ongoing after conventional foundations',
    months: 'months 9–18+',
    cost: '$0+ depending on models/labs',
    hours: [45, 80],
    blurb: 'This is where your existing agentic-AI experience becomes a differentiator. Treat AI security as a specialization layered on top of conventional IT/security, not as a shortcut around it.',
    items: [
      { key: 'exp8-owasp', name: 'Study OWASP LLM/GenAI risks and reproduce harmless prompt-injection/evaluation cases using synthetic data', hours: 12, url: 'https://owasp.org/www-project-top-10-for-large-language-model-applications/' },
      { key: 'exp8-atlas', name: 'Map two AI-system threat scenarios to MITRE ATLAS', hours: 6, url: 'https://atlas.mitre.org/' },
      { key: 'exp8-mcp', name: 'Threat-model one MCP/agent workflow: tools, permissions, trust boundaries, injection paths, data exposure and human approval gates', hours: 12, url: 'https://modelcontextprotocol.io/' },
      { key: 'exp8-project', name: 'Publish one sanitized AI-agent security assessment project with test cases, observed failures, mitigations and manual verification', hours: 15 },
      { key: 'exp8-positioning', name: 'Resume positioning: security/IT professional with AI-agent automation specialization — do not claim AI-security expert before real experience supports it', hours: 2 },
    ],
  }),
];

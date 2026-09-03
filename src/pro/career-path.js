// "Career Path" — Jesse's baby-to-cybersecurity-engineer roadmap.
//
// 8-phase plan designed from scratch by Codex (gpt-5.6-luna, 2026-09-03) from a brief
// containing every resource verified across 14 Instagram posts plus a prior independent
// review. AI/prompting is the operating layer of every phase; free resources first,
// portfolio second, paid certs only after the gate below opens.
//
// Shape: each phase has `links` (external resources — every one has a URL so you know
// where to go) and `outputs` (the checkable deliverables the phase must produce).
// Both are tracked with the same per-device checkbox as the Studies page.
// `hours` on a link is a midpoint estimate used by the Progress page.

const P = (n, title, opts) => ({ n, title, ...opts });

export default [
  P(1, 'Phase 1 — AI Security Operator', {
    months: '0–1, alongside Phase 2',
    hours: [25, 40],
    blurb:
      'Turn the AI fluency you already have into a repeatable engineering workflow — before touching a single cert. The robot drafts; you verify every command and assumption; everything lands in a public repo you can explain line by line.',
    links: [
      { name: 'AI Fluency: Frameworks & Foundations', by: 'Anthropic', url: 'https://www.anthropic.com/ai-fluency', hours: 3, note: 'Free certificate. ~2-4hrs.', quiz: [
        { q: 'You ask an AI agent to refactor a function and it hands back code that runs without errors. What\'s the fluent move before you ship it?', choices: ['Ship it immediately since it runs without errors', 'Read and verify the logic yourself — a runnable output isn\'t the same as a correct one', 'Ask a different AI model to double-check it, no manual review needed', 'Reject it automatically since AI-generated code can\'t be trusted'], answer: 1, why: 'AI fluency means treating the model as a fast collaborator, not an unsupervised authority — verification is still yours to do, every time.' },
        { q: 'A prompt that works well for one task suddenly gives worse results on a very similar task. What does this usually mean?', choices: ['The model is broken and needs to be restarted', 'Context and phrasing matter — small differences in a task change what the model needs to know to do it well', 'AI models perform randomly and consistency shouldn\'t be expected', 'You should always reuse the exact same prompt regardless of the task'], answer: 1, why: 'Effective AI collaboration means adapting instructions to what a specific task actually needs, not treating one prompt as universal.' },
        { q: 'What\'s the core safety risk when giving an AI agent access to tools like files, bash, or APIs?', choices: ['Agents are always the fastest way to complete any task', 'Excessive agency — the agent taking actions beyond what a task needs or what you actually authorized', 'Tool access always makes an agent slower', 'Agents can only read files, never modify them'], answer: 1, why: 'Giving an agent more tool access than a task needs is the core "excessive agency" risk you\'ll see again in Phase 8\'s AI-security work.' },
      ] },
      { name: 'Foundations of Prompt Engineering', by: 'AWS Skill Builder', url: 'https://skillbuilder.aws/', hours: 4, note: 'Free badge, ~3-5hrs. Search the catalog for "Foundations of Prompt Engineering".', quiz: [
        { q: 'You want an AI to format its output as a JSON object every time. What\'s the most reliable technique?', choices: ['Ask nicely and hope it remembers', 'Give an explicit example of the exact output format you want (few-shot)', 'Use all capital letters for emphasis', 'Make the prompt as short as possible'], answer: 1, why: 'Showing the model a concrete example of the format you want is far more reliable than describing it abstractly.' },
        { q: 'A prompt gives inconsistent results across runs on a task that should have one clear answer. What\'s the standard fix?', choices: ['Switch to a different AI provider entirely', 'Add explicit constraints and structure to the prompt, reducing ambiguity in what\'s being asked', 'Run it repeatedly until you get the answer you want', 'Inconsistency is unavoidable and can\'t be improved'], answer: 1, why: 'Ambiguous prompts get ambiguous answers — tightening the instructions is the first lever, before assuming the model itself is the problem.' },
        { q: 'What does "context window" refer to in prompt engineering?', choices: ['How much text/history the model can consider at once when generating a response', 'The physical screen size where you\'re typing the prompt', 'How long you have to wait for a response', 'The number of AI models you can use at the same time'], answer: 0, why: 'The context window is the model\'s working memory for a request — what\'s inside it is what the model can actually use to answer.' },
      ] },
      { name: 'Claude Certified Architect — Foundations (CCA-F)', by: 'Anthropic', url: 'https://anthropic.skilljar.com/claude-certified-architect-foundations-access-request', hours: 6, note: 'Free. Currently gated to Claude Partner Network members (joining is free) — request access here. Proctored, 60q/120min: agentic architecture, MCP, Claude Code, prompt engineering. ~4-8hrs incl. prep.', quiz: [
        { q: 'In the Model Context Protocol (MCP), what does a server expose to a connected client?', choices: ['Only images and video files', 'Tools, resources, and prompts that the connected AI model can use', 'A direct connection to the model\'s training data', 'Nothing — MCP servers are passive logging systems'], answer: 1, why: 'MCP servers expose capabilities (tools/resources/prompts) an AI client can call — it\'s how Claude Code reaches things like your filesystem or a database.' },
        { q: 'Why give an AI agent the LEAST tool access necessary for a task?', choices: ['It makes the agent respond faster', 'Least privilege — it limits the blast radius if the agent misbehaves or is manipulated', 'It saves money on API calls', 'Agents with fewer tools always reason better'], answer: 1, why: 'Least privilege is a core security principle — you\'ll build it hands-on in Phase 5\'s IAM lab and Phase 8\'s agent hardening.' },
        { q: 'A webpage a Claude Code agent reads contains hidden text instructing it to exfiltrate your SSH keys. What\'s this attack called?', choices: ['A denial-of-service attack', 'Prompt injection — untrusted content trying to hijack the agent\'s instructions', 'A buffer overflow', 'Social engineering targeting you directly, not the agent'], answer: 1, why: 'Prompt injection through untrusted content (web pages, files, tool results) is #1 on the OWASP LLM Top 10 later in this phase — treat content the agent reads as data, never as commands.' },
      ] },
      { name: 'Career Essentials in Generative AI', by: 'Microsoft + LinkedIn Learning', url: 'https://www.linkedin.com/learning/paths/career-essentials-in-generative-ai-by-microsoft-and-linkedin', hours: 6, note: 'Free professional-certificate path, ~5-8hrs.', quiz: [
        { q: 'What is "hallucination" in the context of generative AI?', choices: ['When the model refuses to answer a question', 'When the model generates confident, plausible-sounding output that is factually wrong', 'A type of image-generation artifact only', 'When the model runs out of memory'], answer: 1, why: 'Hallucination is stated-with-confidence wrongness — output that reads well but isn\'t grounded in fact, which is why verification stays your job.' },
        { q: 'Which best describes the relationship between AI, machine learning, and generative AI?', choices: ['They\'re three unrelated fields', 'Generative AI is a subset of machine learning, which is a subset of the broader field of AI', 'Generative AI came first, then ML, then AI', 'AI and machine learning are the exact same thing'], answer: 1, why: 'AI is the broad field, machine learning is an approach within it (learning from data), and generative AI is a specific application of ML focused on creating new content.' },
      ] },
      { name: 'AI For Everyone', by: 'DeepLearning.AI', url: 'https://www.deeplearning.ai/courses/ai-for-everyone/', hours: 5, note: 'Free to audit, ~4-6hrs. The verified certificate costs extra — the learning does not.', quiz: [
        { q: 'What\'s usually the biggest bottleneck in a real-world AI project — more than the algorithm itself?', choices: ['Finding a fast enough GPU', 'Data — getting enough good, relevant, well-labeled data for the task', 'The programming language used', 'The color scheme of the user interface'], answer: 1, why: 'Most real AI-project failures trace back to data quality/availability, not algorithm choice — a theme you\'ll see again building the Phase 3 detection lab.' },
        { q: 'What\'s a realistic current limitation of AI systems?', choices: ['AI can already fully replace human judgment in every domain', 'AI is good at narrow, well-defined tasks but struggles with broad common sense or judgment', 'AI systems never make mistakes once deployed', 'AI requires no human oversight after deployment'], answer: 1, why: 'Narrow competence, not general judgment, is the honest current state — exactly why "never outsource understanding" matters throughout this whole roadmap.' },
      ] },
      { name: 'AI Boost Bites: Your Edge in the AI-Powered World', by: 'Google Skills', url: 'https://www.skills.google/paths/2480', hours: 7, note: 'Free. 43 short (~10min) video lessons + hands-on challenges: Gemini, Gemini for Workspace, Gemini Notebook, AI Studio.', quiz: [
        { q: 'The path teaches Gemini, Gemini for Workspace, Gemini Notebook, and AI Studio. What do these have in common?', choices: ['They\'re all Google\'s practical AI tools for real business tasks — content creation, research, market intelligence', 'They\'re competing companies\' products bundled for comparison', 'They\'re programming languages', 'They only work inside Google Cloud Console'], answer: 0, why: 'The path is a tactical toolkit for Google\'s own AI product suite, not abstract AI theory — each "bite" ends in a hands-on challenge applying the tool immediately.' },
        { q: 'Each lesson in this path is followed by what?', choices: ['A 3-hour reading assignment', 'A hands-on challenge applying what you just learned', 'A group discussion forum', 'Nothing — lessons are watch-only'], answer: 1, why: 'The format is built around immediate application, not passive video-watching — matches the "verify, don\'t just consume" habit from Phase 1\'s AI Fluency course.' },
      ] },
      { name: 'Gemini Enterprise Agent Ready (GEAR)', by: 'Google Cloud', url: 'https://www.skills.google/paths', hours: 8, note: 'Free no-cost subscription — 35 monthly credits for hands-on agent-building labs on Google Skills. Search "GEAR" or "Agents" path on skills.google/paths once joined.' },
      { name: 'OWASP Top 10 for LLM Applications', by: 'OWASP', url: 'https://owasp.org/www-project-top-10-for-large-language-model-applications/', hours: 5, codex: true, note: 'Codex addition. Free, ~4-6hrs. Read it before you build the threat model below.', quiz: [
        { q: 'What is LLM01 on the OWASP Top 10 for LLM Applications?', choices: ['Insecure Output Handling', 'Prompt Injection', 'Denial of Service', 'Model Theft'], answer: 1, why: 'Prompt Injection sits at #1 because it\'s the most common and highest-impact way untrusted input hijacks an LLM application\'s behavior.' },
        { q: 'What risk does "Excessive Agency" describe on this list?', choices: ['The LLM taking damaging actions because it was granted more autonomy, tools, or permissions than the task needed', 'The LLM being too slow to respond to user requests', 'Users being too emotionally dependent on AI', 'The LLM refusing too many legitimate requests'], answer: 0, why: 'Same principle as the CCA-F question above — over-permissioned agents are a named, ranked risk category, not a hypothetical.' },
        { q: 'Why is "Insecure Output Handling" dangerous specifically?', choices: ['Because LLM output is always too long', 'Because passing LLM output directly into a shell, database query, or webpage without validation can enable injection attacks', 'Because it uses too much bandwidth', 'Because it makes responses slower to generate'], answer: 1, why: 'Treat LLM output like any other untrusted input — validate it before it touches a shell, a database, or a browser, the same discipline as validating a web form.' },
      ] },
    ],
    outputs: [
      { key: 'p1-workbench', name: 'Public repo: security-ai-workbench' },
      { key: 'p1-prompts', name: 'Versioned prompt library with eval examples (threat modeling, log analysis, code review, detection writing, incident reports, client deliverables)' },
      { key: 'p1-agent', name: 'Agent workflow: research a topic → cite sources → generate a lab task → test it → write the README' },
      { key: 'p1-threatmodel', name: 'One documented MCP/agent threat model (tools, permissions, data flow, prompt injection, excessive agency)' },
    ],
  }),

  P(2, 'Phase 2 — Computing and Network Base', {
    months: '0–6, the long climb',
    hours: [220, 280],
    blurb:
      'Enough Linux, Windows, networking, Python, Git, and SQL to understand security evidence — not to master any one of them. Codex\'s warning: do NOT finish the full ~300hr freeCodeCamp cert before moving on; poor opportunity cost for this target. Ask the agent to generate harder exercises from your own mistakes.',
    links: [
      { name: 'Bandit Wargame', by: 'OverTheWire', url: 'https://overthewire.org/wargames/bandit/', hours: 18, note: 'All 34 levels, hands-on Linux shell, free. ~15-20hrs. You are on level 0.', quiz: [
        { q: 'You just SSH\'d into a Bandit level. Which command lists the files in your current directory, including hidden ones?', choices: ['cd -a', 'ls -la', 'find --hidden', 'pwd -h'], answer: 1, why: '`ls -la` lists all entries (-a, including dotfiles) with details (-l). This is the first command you\'ll reach for on every level.' },
        { q: 'A file in your home directory is executable but not readable — `cat` won\'t show its contents. What can you still do?', choices: ['Delete it and hope a new copy appears', 'Run it — execute permission lets the file run even without read permission — and observe its output', 'It\'s impossible without root access', 'Rename the file to change its permissions'], answer: 1, why: 'Execute and read are separate permission bits — a binary can run without being readable, which shows up in later Bandit levels using setuid binaries.' },
        { q: 'What\'s the whole point of a Bandit level, structurally?', choices: ['Find the next level\'s password using the specific Linux skill that level is teaching — a file, `find`, a running process, decoding, etc.', 'Wait for the password to be emailed to you', 'Every level has the same password', 'Passwords are encrypted and unrecoverable without external tools'], answer: 0, why: 'Every level is built around one Linux skill; the password is the proof you used it correctly.' },
      ] },
      { name: 'Linux Fundamentals (free rooms)', by: 'TryHackMe', url: 'https://tryhackme.com/module/linux-fundamentals', hours: 5, note: 'Free-tier rooms only, ~3-6hrs.' },
      { name: 'GitHub Skills', by: 'GitHub', url: 'https://skills.github.com', hours: 5, note: 'Free, interactive, official. Do "Introduction to GitHub" first. ~5hrs.' },
      { name: 'CompTIA Network+ (N10-009) free course', by: 'Professor Messer', url: 'https://www.professormesser.com/network-plus/n10-009/n10-009-video/n10-009-training-course/', hours: 40, note: 'Free full video course, ~40hrs with practice. Learn it here — buying the exam is a later decision (see the gate).' },
      { name: 'Scientific Computing with Python — core modules only', by: 'freeCodeCamp', url: 'https://www.freecodecamp.org/learn/scientific-computing-with-python/', hours: 75, note: 'Free. Scoped to ~75hrs: syntax, functions, file I/O, basic scripting. Stop there.' },
      { name: 'SQL & Relational Databases 101', by: 'IBM (Cognitive Class)', url: 'https://cognitiveclass.ai/', hours: 12, note: 'Free, ~10-15hrs. Search the catalog for "SQL and Relational Databases 101". Needed to query SIEM/log data in Phase 3.' },
      { name: 'CS50x — selected weeks only', by: 'Harvard', url: 'https://cs50.harvard.edu/x/', hours: 60, note: 'Free OpenCourseWare, ~50-75hrs for the selected weeks. Verified certificate costs extra. Not the whole course.' },
      { name: 'Introduction to PowerShell', by: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/training/modules/introduction-to-powershell/', hours: 20, codex: true, note: 'Codex addition. Free, ~15-25hrs across the PowerShell learning path. Windows evidence is read in PowerShell.' },
    ],
    outputs: [
      { key: 'p2-bandit', name: 'Bandit completion proof' },
      { key: 'p2-logparser', name: 'Repo: Python log parser' },
      { key: 'p2-ioc', name: 'Repo: IOC enrichment script' },
      { key: 'p2-ps', name: 'Repo: PowerShell process & event collector' },
      { key: 'p2-sql', name: 'SQL investigation exercises' },
      { key: 'p2-netnotes', name: 'Network troubleshooting notes' },
      { key: 'p2-labdiagram', name: 'One small home-lab diagram' },
      { key: 'p2-writeups', name: '10+ original technical write-ups' },
    ],
  }),

  P(3, 'Phase 3 — Defensive Engineering Lab', {
    months: '3–6',
    hours: [120, 160],
    blurb:
      'The minimum portfolio that proves real security-operations ability — what job postings ask for beside a cert. Build order: deploy Windows with Sysmon → forward logs to Wazuh/Elastic → run controlled techniques → map to ATT&CK → write a Sigma rule → test false positives → write the incident report. Finishing this is the FIRST EMPLOYABILITY THRESHOLD (month 6-8).',
    links: [
      { name: 'VirtualBox', by: 'Oracle', url: 'https://www.virtualbox.org', hours: 3, note: 'Free. Home-lab VMs — one Windows eval VM, one Linux VM.' },
      { name: 'Sysmon', by: 'Microsoft Sysinternals', url: 'https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon', hours: 3, note: 'Free. Endpoint logging on the Windows VM.' },
      { name: 'Wazuh', by: 'Wazuh', url: 'https://wazuh.com', hours: 8, note: 'Free open-source SIEM. Feed it your Sysmon logs. (Elastic is the free alternative: elastic.co/security)' },
      { name: 'Atomic Red Team', by: 'Red Canary', url: 'https://github.com/redcanaryco/atomic-red-team', hours: 8, codex: true, note: 'Codex addition. Free. Controlled technique simulation — PowerShell abuse, suspicious process creation, credential access, persistence.' },
      { name: 'ATT&CK Matrix', by: 'MITRE', url: 'https://attack.mitre.org', hours: 6, note: 'Free reference. Map every simulated technique to it.' },
      { name: 'Sigma rules', by: 'SigmaHQ', url: 'https://github.com/SigmaHQ/sigma', hours: 10, note: 'Free. The detection-rule format. Write three, test each against benign noise.' },
      { name: 'Velociraptor', by: 'Rapid7 (open source)', url: 'https://docs.velociraptor.app/', hours: 6, codex: true, note: 'Codex addition, optional. Endpoint investigation tool.' },
      { name: 'TryHackMe (free tier, ongoing)', by: 'TryHackMe', url: 'https://tryhackme.com', hours: 20, note: 'Keep practicing past the Linux rooms.' },
      { name: 'HTB Academy (free tier)', by: 'Hack The Box', url: 'https://academy.hackthebox.com', hours: 20, note: 'Free tier. Defensive and fundamentals modules.' },
    ],
    outputs: [
      { key: 'p3-repo', name: 'Public detection-lab repo with reproducible setup instructions' },
      { key: 'p3-dashboards', name: 'Sanitized dashboard exports / screenshots' },
      { key: 'p3-sigma', name: 'Three tested Sigma rules' },
      { key: 'p3-report', name: 'One incident report: timeline, evidence, severity, containment, remediation' },
      { key: 'p3-matrix', name: 'MITRE ATT&CK coverage matrix' },
      { key: 'p3-video', name: 'Short screen-recording demo of the lab' },
    ],
  }),

  P(4, 'Phase 4 — Small-Business Security Audit Lane', {
    lane: true,
    months: 'opens 7–10; start relationships in Phase 2',
    hours: [60, 100],
    blurb:
      'INCOME LANE. Monetize the audit and reporting skill you already sell — before waiting on an employer. Codex: first revenue is likelier here than from bug bounty or a job. Narrow scope on purpose: hygiene, MFA/identity, backups, patching, storage permissions, external attack surface, risk register. DO NOT sell pentesting, compliance certification, or "comprehensive security" claims. Explicit scope, authorization, limitations, and escalation language on every engagement.',
    links: [
      { name: 'CIS Controls v8', by: 'Center for Internet Security', url: 'https://www.cisecurity.org/controls/v8', hours: 8, codex: true, note: 'Codex addition. Free. The checklist backbone of a small-business hygiene assessment.' },
      { name: 'Cybersecurity Framework 2.0', by: 'NIST', url: 'https://www.nist.gov/cyberframework', hours: 8, codex: true, note: 'Codex addition. Free. Structure the report around Govern / Identify / Protect / Detect / Respond / Recover.' },
      { name: 'Application Security Verification Standard (ASVS)', by: 'OWASP', url: 'https://owasp.org/www-project-application-security-verification-standard/', hours: 6, codex: true, note: 'Codex addition. Free. Only for engagements with a web-app scope.' },
      { name: 'AWS Free Tier', by: 'Amazon Web Services', url: 'https://aws.amazon.com/free/', hours: 4, note: 'Free. Practice the cloud-storage permissions review on your own account first.' },
    ],
    outputs: [
      { key: 'p4-service', name: 'Productized service page' },
      { key: 'p4-scope', name: 'Scope & authorization template' },
      { key: 'p4-checklist', name: 'Evidence-request checklist' },
      { key: 'p4-rubric', name: 'Risk-scoring rubric' },
      { key: 'p4-sample', name: 'Branded sample report using synthetic data' },
      { key: 'p4-pilot', name: 'One paid pilot, or three documented unpaid pilots' },
      { key: 'p4-pipeline', name: 'Reusable AI-assisted reporting workflow that never exposes client secrets to unapproved models' },
    ],
  }),

  P(5, 'Phase 5 — Cloud and Security Automation', {
    months: '6–10',
    hours: [120, 180],
    blurb:
      'Engineering depth. Opens cloud security, DevSecOps, IAM, and security-automation roles — the branch Codex thinks fits your background better than pure SOC. Break it in a controlled account, fix it, prove the fix, automate the check so it cannot regress.',
    links: [
      { name: 'AWS Free Tier — IAM / CloudTrail / S3 lab', by: 'Amazon Web Services', url: 'https://aws.amazon.com/free/', hours: 30, note: 'Free. Least-privilege IAM design, CloudTrail investigation, a deliberately misconfigured S3 bucket (your account only) → remediate → verify.' },
      { name: 'Google Cloud Cybersecurity Certificate', by: 'Google Cloud Skills Boost', url: 'https://www.cloudskillsboost.google/paths/419', hours: 18, note: 'Free self-paced badge path, ~15-20hrs. Different product from the paid Coursera "Google Cybersecurity Certificate".' },
      { name: 'Terraform tutorials', by: 'HashiCorp', url: 'https://developer.hashicorp.com/terraform/tutorials', hours: 20, codex: true, note: 'Codex addition. Free. Infrastructure as code for the cloud lab.' },
      { name: 'Checkov (and Trivy)', by: 'Prisma Cloud / Aqua', url: 'https://www.checkov.io/', hours: 8, codex: true, note: 'Codex addition. Free scanners for Terraform and dependencies — wire one into a CI pipeline. Trivy: trivy.dev' },
      { name: 'HTB Academy — cloud modules', by: 'Hack The Box', url: 'https://academy.hackthebox.com', hours: 12, note: 'Free tier, where available.' },
    ],
    outputs: [
      { key: 'p5-repo', name: 'Public cloud-security repo with sanitized account identifiers' },
      { key: 'p5-diagram', name: 'Architecture diagram' },
      { key: 'p5-evidence', name: 'Before/after permissions evidence' },
      { key: 'p5-tool', name: 'Python tool that audits IAM or cloud configuration' },
      { key: 'p5-ci', name: 'CI pipeline that scans infrastructure or dependencies' },
      { key: 'p5-casestudy', name: 'Published technical case study' },
    ],
  }),

  P(6, 'Phase 6 — First Technical Role', {
    months: 'apply from 8–10; land 10–18',
    hours: [40, 80],
    blurb:
      'Convert the portfolio into paid technical experience. Apply BROADLY — "cybersecurity engineer" is not an entry-level title. Targets: junior SOC analyst, security operations analyst, IT support with security duties, NOC analyst, IAM analyst, cloud operations associate, junior AppSec/DevSecOps analyst, security automation analyst, vulnerability-management analyst. Run adversarial mock interviews where the agent challenges every technical claim before a human does.',
    links: [
      { name: 'Data Analytics Job Simulation', by: 'Deloitte (via Forage)', url: 'https://www.theforage.com/simulations/Deloitte-Australia/data-analytics-s5zy', hours: 6, note: 'Free, ~5-6hrs. A completed, named job simulation is a recognized line on a resume/LinkedIn.' },
      { name: 'Job postings — local employers', by: 'LinkedIn Jobs', url: 'https://www.linkedin.com/jobs/', hours: 10, note: 'Extract the recurring requirements from 20+ local postings; build lab extensions that match them.' },
      { name: 'Job-description → skills-gap analyzer', by: 'Your GitHub', url: 'https://github.com/new', hours: 12, codex: true, note: 'Codex addition. Build it: paste a posting, get the gaps vs your portfolio. Uses the Phase 1 workbench.' },
      { name: 'TryHackMe / HTB Academy — keep going', by: 'TryHackMe · Hack The Box', url: 'https://tryhackme.com', hours: 20, note: 'Ongoing practice during the application window.' },
    ],
    outputs: [
      { key: 'p6-apps', name: '50–100 targeted applications' },
      { key: 'p6-resumes', name: 'Five role-specific resume versions (SOC, cloud, AppSec, IAM, automation)' },
      { key: 'p6-star', name: 'Every project converted to STAR-format interview evidence' },
      { key: 'p6-portfolio', name: 'Interview portfolio: architecture diagrams + incident walkthroughs' },
      { key: 'p6-role', name: 'FIRST TECHNICAL ROLE, client contract, or recurring audit revenue' },
    ],
  }),

  P(7, 'Phase 7 — Bug-Bounty Track', {
    lane: true,
    months: 'opens 8–12, parallel',
    hours: [100, 200],
    blurb:
      'INCOME LANE, second and slower. Offensive web-security judgment and an independent income path. Codex\'s honest note: income is often ZERO for many months — treat as skill-building that might pay. Starts only after the Linux, networking, Python, and web fundamentals of Phase 2. Practice on your own vulnerable apps first. NEVER test anything outside explicit written authorization.',
    links: [
      { name: 'Web Security Academy', by: 'PortSwigger', url: 'https://portswigger.net/web-security', hours: 60, codex: true, note: 'Codex addition. Free, the best web-security curriculum available. Start here.' },
      { name: 'Hacker101', by: 'HackerOne', url: 'https://www.hacker101.com', hours: 20, note: 'Free training + CTF. Bug-bounty on-ramp.' },
      { name: 'Bugcrowd University', by: 'Bugcrowd', url: 'https://bugcrowd.com/hackers/bugcrowd-university/', hours: 10, note: 'Free. Second platform, same lane.' },
      { name: 'Web Security Testing Guide (WSTG)', by: 'OWASP', url: 'https://owasp.org/www-project-web-security-testing-guide/', hours: 15, codex: true, note: 'Codex addition. Free. The methodology reference for your write-ups.' },
      { name: 'HTB Academy — web modules', by: 'Hack The Box', url: 'https://academy.hackthebox.com', hours: 25, note: 'Free tier.' },
    ],
    outputs: [
      { key: 'p7-vulnapp', name: 'Local vulnerable-app lab (AI-generated, for practice only)' },
      { key: 'p7-writeups', name: 'Five polished vulnerability write-ups: reproduction steps + business impact' },
      { key: 'p7-method', name: 'Methodology repo' },
      { key: 'p7-submit', name: 'Authorized submissions to HackerOne / Bugcrowd' },
      { key: 'p7-accepted', name: 'First accepted valid report — if achieved' },
    ],
  }),

  P(8, 'Phase 8 — AI Security Branch (specialization)', {
    months: '12–24, layered on the fundamentals',
    hours: [100, 160],
    blurb:
      'Secure LLM apps, AI agents, and MCP-connected systems. Codex\'s verdict: a strong fit for your background — as a layer ON TOP OF conventional security, never a substitute. Market read: SOC, cloud, IAM, and AppSec have substantially larger entry-level markets; AI security is smaller, newer, concentrated in AI companies, consultancies, platform vendors, and large enterprises. Position as "security engineer with AI-agent and automation specialization", not "AI security expert", until there is real experience behind it.',
    links: [
      { name: 'MITRE ATLAS', by: 'MITRE', url: 'https://atlas.mitre.org/', hours: 8, codex: true, note: 'Codex addition. Free. ATT&CK\'s counterpart for adversarial threats to AI systems.' },
      { name: 'AI Risk Management Framework', by: 'NIST', url: 'https://www.nist.gov/itl/ai-risk-management-framework', hours: 8, codex: true, note: 'Codex addition. Free. The governance backbone for a client-facing AI-risk assessment.' },
      { name: 'OWASP Top 10 for LLM Applications (revisit)', by: 'OWASP', url: 'https://owasp.org/www-project-top-10-for-large-language-model-applications/', hours: 4, note: 'Free. Now build a test for each item.' },
      { name: 'Prompt-injection & agent-evaluation labs', by: 'Anthropic docs', url: 'https://docs.anthropic.com/', hours: 20, codex: true, note: 'Codex addition: vendor documentation on agent safety, tool permissions, and evaluations. Use the docs of whichever model you test against.' },
      { name: 'Model Context Protocol — specification', by: 'MCP', url: 'https://modelcontextprotocol.io/', hours: 8, note: 'Free. You threat-model this in Phase 1; here you attack and harden real servers.' },
    ],
    outputs: [
      { key: 'p8-toolkit', name: 'Public AI-security assessment toolkit' },
      { key: 'p8-harness', name: 'Prompt-injection test harness + tool-permission / excessive-agency test suite' },
      { key: 'p8-exfil', name: 'Data-exfiltration scenarios + output validation with human-approval gates' },
      { key: 'p8-threatmodel', name: 'MCP server threat model + secure agent reference architecture' },
      { key: 'p8-reports', name: 'One technical report + one executive report' },
      { key: 'p8-pilot', name: 'Pilot AI-security assessment offered to existing business clients' },
    ],
  }),
];

// Codex's timeline at 14 hrs/week. `requires` = phase numbers that must be 100% complete
// for the Progress page to mark the milestone reached. Lanes (4, 7) are not required for
// the employment milestones — they are parallel income tracks.
export const milestones = [
  { when: 'Months 0–2', label: 'Computing and AI-workflow foundation', evidence: 'Bandit progress, scripts, AI workflow, GitHub activity', requires: [1] },
  { when: 'Months 3–6', label: 'Lab builder', evidence: 'Detection lab, Sigma rules, incident report', requires: [1, 2] },
  { when: 'Months 6–8', label: 'First plausibly sellable milestone', evidence: 'Sample audit package, cloud project, automation tool', requires: [1, 2, 3], big: true },
  { when: 'Months 7–10', label: 'Freelance and job-market entry', evidence: 'Paid pilot, applications, interviews', requires: [1, 2, 3, 4] },
  { when: 'Months 8–12', label: 'Bug-bounty opening', evidence: 'Authorized practice, first submissions', requires: [1, 2, 3, 7] },
  { when: 'Months 10–18', label: 'First technical role', evidence: 'SOC, NOC, IT/security, IAM, cloud, AppSec, or automation', requires: [1, 2, 3, 5, 6], big: true },
  { when: 'Months 12–24', label: 'Specialization depth', evidence: 'Cloud, AppSec, detection engineering, or AI security', requires: [1, 2, 3, 5, 6, 8] },
  { when: 'Years 3–6+', label: 'Engineer-level progression', evidence: 'Ownership of systems, architecture, automation, incident response, production security', requires: [1, 2, 3, 4, 5, 6, 7, 8], big: true },
];

// The paid-certification gate. All four must be true before buying ANY paid cert.
// These are manual checkboxes on the Progress page — none can be derived from study progress.
export const gate = {
  first: 'CompTIA Security+ — $439',
  firstUrl: 'https://www.comptia.org/certifications/security',
  why: 'Strongest consensus in the inventory, appears in real entry-program requirements, broad HR filter. It validates hands-on work; it does not replace it.',
  conditions: [
    { key: 'gate-repos', name: 'Detection lab, cloud project, and automation project are public and explainable' },
    { key: 'gate-income', name: 'At least one paid audit / contract / recurring revenue exists — or a serious interview pipeline has started' },
    { key: 'gate-market', name: 'Target job market checked for repeated certification requirements' },
    { key: 'gate-gap', name: 'The certification closes a specific hiring gap' },
  ],
  triggers: [
    'Three or more target postings explicitly require or strongly prefer it, or',
    'A specific employer or recruiter confirms it is a screening requirement, or',
    'Audit revenue can fund it without touching operating cash.',
  ],
  second: [
    { name: 'BTL1', by: 'Security Blue Team', url: 'https://securityblue.team/btl1', note: 'confirmed SOC / blue-team path · ~$490' },
    { name: 'CCNA', by: 'Cisco', url: 'https://www.cisco.com/site/us/en/learn/training-certifications/certifications/ccna/index.html', note: 'networking-heavy roles · $300-330' },
    { name: 'AWS Solutions Architect Associate', by: 'AWS', url: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/', note: 'cloud-security progression · $150' },
    { name: 'RHCSA', by: 'Red Hat', url: 'https://www.redhat.com/en/services/certification/rhcsa', note: 'Linux-heavy engineering roles · $500' },
    { name: 'SC-200', by: 'Microsoft', url: 'https://learn.microsoft.com/en-us/credentials/certifications/security-operations-analyst/', note: 'only for Sentinel / Defender / Entra shops' },
  ],
  overruled: [
    'Network+ — not automatically next after Security+. Buy only if networking stays weak or postings demand it; otherwise prove it through labs, or go straight to CCNA.',
    'BTL1 — valuable, but not before the gate. Its hands-on content overlaps the Phase 3 detection lab.',
    'ISC2 CC — unnecessary if you can build equivalent fundamentals and are heading to Security+. Only if a local employer explicitly recognizes it.',
    'AWS Cloud Practitioner — correctly low priority. Cloud vocabulary is free to learn.',
    'A+ — stays skipped for this track unless a help-desk role uses it as a screen.',
    'OSCP — excellent, but premature and misaligned with a cloud / automation / AI-security direction.',
    'CISSP — a long-term outcome, not a milestone. Five-year experience requirement makes it irrelevant to initial employability.',
  ],
};

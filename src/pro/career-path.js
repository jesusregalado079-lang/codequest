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
// `hours` on a link is a roadmap planning estimate used by the Progress page,
// including scoped exercises/builds in its note, not a provider runtime claim.
// Phase ranges = rounded 80%–120% of the sum of link hours. Outputs reuse that
// budget. Extras and elapsed hiring/client waits are excluded.

const P = (n, title, opts) => ({ n, title, ...opts });

export default [
  P(1, 'Phase 1 — AI Security Operator', {
    months: '0–1, alongside Phase 2',
    hours: [10, 16],
    blurb:
      'Start with AI Fluency, one prompting course, and NVIDIA’s conceptual agent overview. Learn Git before publishing a small verified workflow. Take the opening shell lessons in Phase 2 before using Git in a terminal. Develop security-specific prompts and threat models during Phase 3; choose extra AI-awareness courses only if they fill a gap.',
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
      { name: 'Agentic AI Explained', by: 'NVIDIA Deep Learning Institute', url: 'https://www.nvidia.com/en-us/training/self-paced-courses/', hours: 1, note: 'Free, 1hr. What agentic AI actually is — how agents plan, use tools, and act autonomously. Conceptual, not hands-on coding. Search the free-courses catalog for "Agentic AI Explained".', quiz: [
        { q: 'What distinguishes an "agentic" AI system from a plain chatbot that just answers questions?', choices: ['Agentic systems can plan multi-step tasks and take actions using tools, not just generate text replies', 'Agentic systems are always faster to respond', 'There\'s no real difference, it\'s just marketing language', 'Agentic systems never make mistakes'], answer: 0, why: 'Agency means the system can decide what to do next and act — call a tool, read a result, decide the following step — not just produce one text response.' },
      ] },
      { name: 'Pro Git — first repository and remote workflow', by: 'Scott Chacon & Ben Straub', url: 'https://git-scm.com/book/en/v2', hours: 5, note: 'Free. Read Getting Started sections 1.1 and 1.3–1.7, Git Basics 2.1–2.5, and Git Branching 3.1–3.2 and 3.5. Practice init/clone, status/diff, add/commit, branch/merge, and remote push/pull. Use a disposable repo, then publish the workbench; allocation includes its README and verified workflow.' },
    ],
    outputs: [
      { key: 'p1-workbench', name: 'Public security-ai-workbench repo after Pro Git practice: commit history, one merged branch, and reproducible README steps; check for secrets before publishing' },
      { key: 'p1-prompts', name: 'Starter prompt library: one research prompt and one verification example now; complete log-analysis, detection-writing, and incident-report evaluations in Phase 3' },
      { key: 'p1-agent', name: 'Small verified workflow: research a topic → cite sources → draft a harmless task → run and check it → record actual results in the README' },
      { key: 'p1-threatmodel', name: 'Start an agent-risk sketch: tools, permissions, data, and unknowns; develop a tested threat model with real lab evidence in Phase 3' },
    ],
  }),

  P(2, 'Phase 2 — Computing and Network Base', {
    months: '0–6, the long climb',
    hours: [208, 312],
    blurb:
      'Build Linux, Windows, networking, security, Python, Git, SQL, and web/API fundamentals. Start with shell navigation, then follow the scoped resources below. Choose a primary role family and one adjacent fallback from local postings before committing to the Phase 3 portfolio. Finish the practical foundations assessment before treating the detection lab as job evidence. Hours include the named exercises and outputs; certificates are not required.',
    links: [
      { name: 'The Unix Shell — absolute-beginner navigation', by: 'Software Carpentry', url: 'https://swcarpentry.github.io/shell-novice/', hours: 4, note: 'Free. Before Bandit and Phase 1 command-line Git, complete Introducing the Shell, Navigating Files and Directories, and Working With Files and Directories. Practice pwd, ls, cd, cp, mv, rm, mkdir, and man/help in a disposable folder. Then do Pipes and Filters; revisit Finding Things during Bandit.' },
      { name: 'Bandit Wargame', by: 'OverTheWire', url: 'https://overthewire.org/wargames/bandit/', hours: 18, note: 'All 34 levels, hands-on Linux shell, free. ~15-20hrs. You are on level 0.', quiz: [
        { q: 'You just SSH\'d into a Bandit level. Which command lists the files in your current directory, including hidden ones?', choices: ['cd -a', 'ls -la', 'find --hidden', 'pwd -h'], answer: 1, why: '`ls -la` lists all entries (-a, including dotfiles) with details (-l). This is the first command you\'ll reach for on every level.' },
        { q: 'A file in your home directory is executable but not readable — `cat` won\'t show its contents. What can you still do?', choices: ['Delete it and hope a new copy appears', 'Run it — execute permission lets the file run even without read permission — and observe its output', 'It\'s impossible without root access', 'Rename the file to change its permissions'], answer: 1, why: 'Execute and read are separate permission bits — a binary can run without being readable, which shows up in later Bandit levels using setuid binaries.' },
        { q: 'What\'s the whole point of a Bandit level, structurally?', choices: ['Find the next level\'s password using the specific Linux skill that level is teaching — a file, `find`, a running process, decoding, etc.', 'Wait for the password to be emailed to you', 'Every level has the same password', 'Passwords are encrypted and unrecoverable without external tools'], answer: 0, why: 'Every level is built around one Linux skill; the password is the proof you used it correctly.' },
      ] },
      { name: 'Linux Fundamentals (free rooms)', by: 'TryHackMe', url: 'https://tryhackme.com/module/linux-fundamentals', hours: 5, note: 'Free-tier rooms only, ~3-6hrs.' },
      { name: 'GitHub Skills', by: 'GitHub', url: 'https://skills.github.com', hours: 1, note: 'Free. Complete Introduction to GitHub. It teaches repositories, branches, commits, and pull requests through the GitHub interface; Phase 1 Pro Git supplies local Git and push/pull practice. This is collaboration practice, not a substitute for command-line Git.' },
      { name: 'CompTIA Network+ (N10-009) free course', by: 'Professor Messer', url: 'https://www.professormesser.com/network-plus/n10-009/n10-009-video/n10-009-training-course/', hours: 40, note: 'Free full video course, ~40hrs with practice. Learn it here — buying the exam is a later decision (see the gate).' },
      { name: 'CS50x — Weeks 1, 2, 3, 4, and 6', by: 'Harvard', url: 'https://cs50.harvard.edu/x/', hours: 55, note: 'Free OpenCourseWare. In order: Week 1 C, Week 2 Arrays, Week 3 Algorithms, Week 4 Memory, Week 6 Python. Watch those lectures and shorts, then complete their problem sets using the less-comfortable option wherever offered. Skip Weeks 0, 5, and 7 onward and the final project for this track. Complete Week 6 before the freeCodeCamp practice; no paid certificate needed.' },
      { name: 'Scientific Computing with Python — five practice projects', by: 'freeCodeCamp', url: 'https://www.freecodecamp.org/learn/scientific-computing-with-python/', hours: 30, note: 'Free. Do only: Learn String Manipulation by Building a Cipher; Learn How to Work with Numbers and Strings by Implementing the Luhn Algorithm; Learn Lambda Functions by Building an Expense Tracker; Learn Python List Comprehension by Building a Case Converter Program; Learn Regular Expressions by Building a Password Generator. Stop after Password Generator. Skip certification projects and later algorithms/OOP here. File I/O and JSON follow in the Python tutorial below.' },
      { name: 'SQL & Relational Databases 101', by: 'IBM (Cognitive Class)', url: 'https://cognitiveclass.ai/', hours: 12, note: 'Free, ~10-15hrs. Search the catalog for "SQL and Relational Databases 101". Needed to query SIEM/log data in Phase 3.' },
      { name: 'Introduction to PowerShell', by: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/training/modules/introduction-to-powershell/', hours: 10, codex: true, note: 'Free. Complete this module, then use its linked help to practice Get-Help, objects, pipelines, Get-Process, Get-WinEvent, and Export-Csv. Allocation includes the process/event collector; Windows administration is covered separately below.' },
      { name: 'Coding Interview University — Data Structures & Complexity', by: 'jwasham (GitHub)', url: 'https://github.com/jwasham/coding-interview-university#data-structures', hours: 8, note: 'Free, scoped reference: Big-O, arrays, stacks, queues, hash tables, and binary search. Compare a list scan with dictionary lookup in your log parser. Stop once you can explain the tradeoff; advanced interview algorithms are in extras.' },
      { name: 'CompTIA Security+ (SY0-701) — foundations checkpoint', by: 'Professor Messer', url: 'https://www.professormesser.com/security-plus/sy0-701/sy0-701-video/sy0-701-comptia-security-plus-course/', hours: 35, note: 'Free video course. Budget 30–40 hours with notes and the recovery/risk assessment below, not just playback. Cover threat vs vulnerability vs risk, authentication vs authorization, hashing vs encryption, patching, backups/restoration, and incident preparation, detection, containment, eradication, recovery, and lessons learned. Learn the content now; the paid exam stays behind the gate.' },
      { name: 'HTTP fundamentals — browser to server', by: 'MDN Web Docs', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP', hours: 8, note: 'Free. Follow Overview of HTTP, HTTP messages, request methods, response status codes, headers, cookies, and TLS guides. Explain GET/POST/PUT/PATCH/DELETE, status families, headers, cookie-backed sessions, and what TLS protects. Use DevTools and curl to annotate a request; includes the connection-troubleshooting assessment.' },
      { name: 'API requests, JSON, and authentication', by: 'Postman Docs', url: 'https://learning.postman.com/docs/use/send-requests/requests/', hours: 4, note: 'Free docs. Follow request method, parameters, headers, and body sections, then Authorization → authorization types (Basic, API key, Bearer token, OAuth 2.0). Send and inspect JSON; compare a successful request with missing/invalid credentials against a local lab API. Explain authentication vs endpoint authorization; sanitize tokens from evidence. Includes the IOC enrichment script using documented API responses or saved fixtures.' },
      { name: 'Python tutorial — Reading and Writing Files / Saving structured data with json', by: 'Python Software Foundation', url: 'https://docs.python.org/3/tutorial/inputoutput.html', hours: 6, note: 'Free. Complete Reading and Writing Files and Saving structured data with json after the five freeCodeCamp projects. Build the login-log parser with with-open file handling, JSON input, timestamp/account filters, and malformed-record handling. Include a sample log, expected counts, and a runnable command.' },
      { name: 'Windows local accounts, groups, and permissions', by: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/windows/security/identity-protection/access-control/local-accounts', hours: 6, note: 'Free documentation plus lab. Read How to manage local user accounts and follow the LocalAccounts cmdlet reference. Create a standard local user and group in a disposable Windows VM; grant read access to one folder and withhold access to another. Prove effective access while signed in as that user; keep a separate administrator for recovery.' },
      { name: 'Windows administration — services and scheduled tasks', by: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/windows-commands', hours: 6, note: 'Free command reference, scoped lab rather than the whole index. Read and practice net user, net localgroup, icacls, sc.exe query, schtasks, and wevtutil. Inspect a service and its account/startup type; create/run/remove a harmless scheduled task and export evidence. Inspect the same settings in Services and Task Scheduler.' },
      { name: 'Event Viewer — inspect Windows evidence', by: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/shows/inside/event-viewer', hours: 2, note: 'Free introduction plus practice. Distinguish Application/System/Security logs, filter and export events. Enable success/failure logon auditing in the lab, generate both outcomes for your test account, and correlate the account and timestamps with the PowerShell export.' },
      { name: 'Active Directory Domain Services fundamentals', by: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/training/paths/deploy-manage-identity-infrastructure/', hours: 4, note: 'Free. Complete only the first module, Introduction to AD DS. Explain domains, domain controllers, organizational units, users, and groups; compare local accounts with domain identities. Defer domain deployment, hybrid configuration, and the rest of this path.' },
      { name: 'Introduction to Microsoft Entra — identity concepts', by: 'Microsoft Learn', url: 'https://learn.microsoft.com/en-us/training/paths/describe-capabilities-of-microsoft-identity-access/', hours: 2, note: 'Free. Complete Describe the function and identity types of Microsoft Entra ID and Describe the authentication capabilities of Microsoft Entra ID. Compare local Windows, AD DS, and Entra identities, including tenant, directory, MFA, and hybrid identity. No paid tenant or full hybrid lab required.' },
      { name: 'Job postings — choose target roles before the portfolio', by: 'LinkedIn Jobs', url: 'https://www.linkedin.com/jobs/', hours: 4, note: 'Research exercise: collect 10 current local or location-eligible postings with URLs, dates, role families, recurring skills, and certification requirements. Pick one primary family (SOC, IAM, cloud/AppSec, or IT support with security duties) and one adjacent fallback. Use the evidence to choose Phase 3 scenarios and Phase 5 extensions; refresh in Phase 6.' },
    ],
    outputs: [
      { key: 'p2-role-target', name: 'Before Phase 3: dated comparison of 10 real local/location-eligible postings, a primary role family, one adjacent fallback, and ranked skills to demonstrate' },
      { key: 'p2-identity-assessment', name: 'Foundations assessment: create a restricted local user/group, prove allowed and blocked folder access, generate successful and failed logins, find them in Event Viewer, and export matching evidence for the Python parser; explain local vs AD DS vs Entra identity' },
      { key: 'p2-recovery-assessment', name: 'Foundations assessment: back up a lab folder and record hashes, deliberately damage a copy, restore from backup, and verify contents/permissions. Explain hashing vs encryption, document a patch check, and write an incident note separating threat, vulnerability, risk, containment, remediation, and recovery' },
      { key: 'p2-bandit', name: 'Bandit completion proof' },
      { key: 'p2-logparser', name: 'Repo: Python parser for the test account’s exported login evidence, with timestamp/account filters, malformed-record handling, sample input, and verified expected output' },
      { key: 'p2-ioc', name: 'Repo: IOC enrichment script' },
      { key: 'p2-ps', name: 'Repo: PowerShell process & event collector' },
      { key: 'p2-sql', name: 'SQL investigation exercises' },
      { key: 'p2-netnotes', name: 'Foundations assessment: annotate a browser request/response (method, status, headers, cookies/session, TLS), deliberately break lab DNS or a lab service, diagnose with command output, fix it, and prove connectivity returned' },
      { key: 'p2-labdiagram', name: 'One small home-lab diagram' },
      { key: 'p2-writeups', name: '10+ original technical write-ups' },
    ],
  }),

  P(3, 'Phase 3 — Defensive Engineering Lab', {
    months: '4–8, after the foundations assessment',
    hours: [92, 138],
    blurb:
      'Build after the Phase 2 foundations assessment, using the chosen role family to select scenarios. Order: deploy Windows/Linux lab → log Sysmon events to Wazuh → simulate controlled techniques → map to ATT&CK and implement detections → test malicious and benign cases → report. Wazuh manager is the detection backend: keep Sigma as portable source and manually translate each simple rule into native Wazuh XML with documented field mappings. Finish the Phase 1 security prompts and agent-risk model using observed lab behavior.',
    links: [
      { name: 'VirtualBox', by: 'Oracle', url: 'https://www.virtualbox.org', hours: 3, note: 'Free. Home-lab VMs: one Windows evaluation VM and one Linux VM. Do this setup early for the Phase 2 administration assessment, then reuse it here; count setup time once, in this allocation.' },
      { name: 'Sysmon', by: 'Microsoft Sysinternals', url: 'https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon', hours: 3, note: 'Free. Endpoint logging on the Windows VM.' },
      { name: 'Wazuh', by: 'Wazuh', url: 'https://wazuh.com', hours: 16, note: 'Free open-source SIEM. Deploy a Wazuh manager/indexer/dashboard and forward Windows Sysmon events through the agent. Verify collection before simulation. Allocation includes reproducible setup, sanitized dashboards, and the demo; detection deployment is budgeted in the custom-rules resource below.' },
      { name: 'Atomic Red Team', by: 'Red Canary', url: 'https://github.com/redcanaryco/atomic-red-team', hours: 8, codex: true, note: 'Codex addition. Free. Controlled technique simulation — PowerShell abuse, suspicious process creation, credential access, persistence.' },
      { name: 'ATT&CK Matrix', by: 'MITRE', url: 'https://attack.mitre.org', hours: 10, note: 'Free reference. Map observed techniques and evidence to ATT&CK; no graph-algorithm prerequisite. Allocation includes the coverage matrix and incident report with timeline, severity, containment, remediation, and detection limits.' },
      { name: 'Sigma rules', by: 'SigmaHQ', url: 'https://github.com/SigmaHQ/sigma', hours: 10, note: 'Free. Write three simple single-event Sigma rules from observed Sysmon logs. Wazuh is the chosen backend; Sigma YAML is not loaded directly. Preserve logsource, selections, condition, ATT&CK tags, and false-positive notes, then manually translate detection logic to native Wazuh XML using the custom-rules resource below. Record unsupported semantics rather than claiming automatic equivalence.' },
      { name: 'TryHackMe (free tier, ongoing)', by: 'TryHackMe', url: 'https://tryhackme.com', hours: 20, note: 'Keep practicing past the Linux rooms.' },
      { name: 'HTB Academy (free tier)', by: 'Hack The Box', url: 'https://academy.hackthebox.com', hours: 20, note: 'Free tier. Defensive and fundamentals modules.' },
      { name: 'Coding Interview University — How Programs Actually Run', by: 'jwasham (GitHub)', url: 'https://github.com/jwasham/coding-interview-university#processes-and-threads', hours: 6, note: 'Free. Read processes and threads, then explain process IDs, parent-child relationships, command lines, and execution context in captured Sysmon events. Caches, endianness, and floating-point representation are background architecture, not fields Sysmon generally logs; defer those topics.' },
      { name: 'OWASP Top 10 for LLM Applications', by: 'OWASP', url: 'https://owasp.org/www-project-top-10-for-large-language-model-applications/', hours: 5, codex: true, note: 'Free. Read alongside the working lab, then finish the starter agent threat model and prompt evaluations from Phase 1. Trace actual tools, permissions, data flow, untrusted inputs, and verification checks; test a harmless prompt-injection case against synthetic lab data.', quiz: [
        { q: 'What is LLM01 on the OWASP Top 10 for LLM Applications?', choices: ['Insecure Output Handling', 'Prompt Injection', 'Denial of Service', 'Model Theft'], answer: 1, why: 'OWASP labels Prompt Injection LLM01. It describes untrusted input changing an LLM application\'s intended behavior; list position alone is not evidence of attack frequency.' },
        { q: 'What risk does "Excessive Agency" describe on this list?', choices: ['The LLM taking damaging actions because it was granted more autonomy, tools, or permissions than the task needed', 'The LLM being too slow to respond to user requests', 'Users being too emotionally dependent on AI', 'The LLM refusing too many legitimate requests'], answer: 0, why: 'The same least-privilege principle as the starter agent-risk sketch — over-permissioned agents are a named, ranked risk category, not a hypothetical.' },
        { q: 'Why is "Insecure Output Handling" dangerous specifically?', choices: ['Because LLM output is always too long', 'Because passing LLM output directly into a shell, database query, or webpage without validation can enable injection attacks', 'Because it uses too much bandwidth', 'Because it makes responses slower to generate'], answer: 1, why: 'Treat LLM output like any other untrusted input — validate it before it touches a shell, a database, or a browser, the same discipline as validating a web form.' },
      ] },
      { name: 'Wazuh custom rules — deploy and test Sigma translations', by: 'Wazuh documentation', url: 'https://documentation.wazuh.com/current/user-manual/ruleset/rules/custom.html', hours: 14, note: 'Free. Map Sigma fields to fields actually decoded by Wazuh (for example Image to win.eventdata.image, after verifying a sample). Save XML under /var/ossec/etc/rules/local_rules.xml with unique custom IDs in the documented 100000–120000 range. Run /var/ossec/bin/wazuh-logtest on positive and benign raw events; restart wazuh-manager, replay lab actions, and save alert IDs/timestamps. Commit YAML, XML, mappings, versions, fixtures, and results; benign cases must not trigger your custom rules.' },
    ],
    outputs: [
      { key: 'p3-repo', name: 'Public detection-lab repo with reproducible setup instructions' },
      { key: 'p3-dashboards', name: 'Sanitized dashboard exports / screenshots' },
      { key: 'p3-sigma', name: 'Three Sigma rules plus deployed Wazuh XML translations: source-to-decoded-field mapping, rule IDs, supported semantics, positive/benign fixtures, wazuh-logtest results, and replayed alert evidence after manager restart' },
      { key: 'p3-report', name: 'One incident report: timeline, evidence, severity, containment, remediation' },
      { key: 'p3-matrix', name: 'MITRE ATT&CK coverage matrix' },
      { key: 'p3-video', name: 'Short screen-recording demo of the lab' },
      { key: 'p3-ai-evals', name: 'Complete Phase 1 security prompts with known-answer log-analysis, detection-writing, and incident-report examples from this lab; record AI mistakes and manual verification' },
      { key: 'p3-agent-threatmodel', name: 'Develop the Phase 1 risk sketch into a threat model of the actual lab assistant: tools, permissions, data flow, injection/excessive-agency risks, and a harmless tested mitigation; defer MCP-specific implementation to Phase 8 if MCP is not used here' },
    ],
  }),

  P(4, 'Phase 4 — Small-Business Security Audit Lane', {
    lane: true,
    months: 'opens 7–10; start relationships in Phase 2',
    hours: [50, 74],
    blurb:
      'INCOME LANE. Monetize the audit and reporting skill you already sell — before waiting on an employer. Codex: first revenue is likelier here than from bug bounty or a job. Narrow scope on purpose: hygiene, MFA/identity, backups, patching, storage permissions, external attack surface, risk register. DO NOT sell pentesting, compliance certification, or "comprehensive security" claims. Explicit scope, authorization, limitations, and escalation language on every engagement.',
    links: [
      { name: 'CIS Controls v8', by: 'Center for Internet Security', url: 'https://www.cisecurity.org/controls/v8', hours: 24, codex: true, note: 'Free reference. Allocation includes reading, hygiene checklist, evidence requests, scope/authorization template, and service-page draft for the optional audit lane.' },
      { name: 'Cybersecurity Framework 2.0', by: 'NIST', url: 'https://www.nist.gov/cyberframework', hours: 24, codex: true, note: 'Free reference. Allocation includes Govern / Identify / Protect / Detect / Respond / Recover mapping, risk rubric, synthetic report, reporting workflow, and pilot preparation/delivery. Client scheduling and sales wait time are not study hours.' },
      { name: 'Application Security Verification Standard (ASVS)', by: 'OWASP', url: 'https://owasp.org/www-project-application-security-verification-standard/', hours: 6, codex: true, note: 'Codex addition. Free. Only for engagements with a web-app scope.' },
      { name: 'AWS Free Tier', by: 'Amazon Web Services', url: 'https://aws.amazon.com/free/', hours: 8, note: 'Practice cloud-storage permissions in your own controlled lab. Allocation includes audit-sample evidence collection; check current free-tier eligibility and charges before provisioning.' },
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
    hours: [88, 132],
    blurb:
      'Build cloud security and automation evidence for the role selected in Phase 2. Break a configuration in a controlled lab, fix it, and prove the fix. Learn code structure and testing inside the Python audit tool: separate collection, policy evaluation, and reporting; use fixtures and regression tests in CI. Advanced recursion, dynamic programming, and system design are optional extras.',
    links: [
      { name: 'AWS Free Tier — IAM / CloudTrail / S3 lab', by: 'Amazon Web Services', url: 'https://aws.amazon.com/free/', hours: 40, note: 'Hands-on allocation includes least-privilege IAM, CloudTrail investigation, a controlled S3 misconfiguration, remediation, architecture diagram, before/after evidence, and case study. Keep lab data synthetic and access constrained. Check current free-tier eligibility and costs before provisioning.' },
      { name: 'Google Cloud Cybersecurity Certificate', by: 'Google Cloud Skills Boost', url: 'https://www.cloudskillsboost.google/paths/419', hours: 18, note: 'Free self-paced badge path, ~15-20hrs. Different product from the paid Coursera "Google Cybersecurity Certificate".' },
      { name: 'Terraform tutorials', by: 'HashiCorp', url: 'https://developer.hashicorp.com/terraform/tutorials', hours: 20, codex: true, note: 'Codex addition. Free. Infrastructure as code for the cloud lab.' },
      { name: 'Checkov (and Trivy)', by: 'Prisma Cloud / Aqua', url: 'https://www.checkov.io/', hours: 20, codex: true, note: 'Free tools. Build the Python IAM/configuration auditor alongside infrastructure scanning in CI. Separate collection, policy checks, and reporting; test safe, unsafe, missing-data, and API-error fixtures without live credentials. Show a failing check and passing remediation. Allocation includes tool development and regression tests; advanced CIU reading is in extras.' },
      { name: 'HTB Academy — cloud modules', by: 'Hack The Box', url: 'https://academy.hackthebox.com', hours: 12, note: 'Free tier, where available.' },
      { name: 'AWS Certified Cloud Practitioner', by: 'AWS', url: 'https://aws.amazon.com/certification/certified-cloud-practitioner/', hours: 25, note: '$100 exam. Re-added after real signal from two independent creators: Symoné Berry\'s tier list and Daniel Cho\'s "certs that actually made me money" video both credited this one for landing early roles. Take the exam after the hands-on IAM/CloudTrail/S3 lab above — it validates the skill you\'ll already have, not a substitute for building it.', quiz: [
        { q: 'What does the AWS Cloud Practitioner cert actually validate, in the context of this phase?', choices: ['Deep hands-on engineering skill across all AWS services', 'Foundational cloud vocabulary and concepts — a badge for knowledge you\'re already building hands-on in this phase\'s IAM/CloudTrail/S3 lab', 'The ability to write Terraform from scratch', 'Nothing — it\'s purely decorative'], answer: 1, why: 'It\'s an entry-level, vocabulary-and-concepts exam — real signal for a resume, but the actual skill comes from the hands-on lab work you\'re already doing in this phase.' },
      ] },
    ],
    outputs: [
      { key: 'p5-repo', name: 'Public cloud-security repo with sanitized account identifiers' },
      { key: 'p5-diagram', name: 'Architecture diagram' },
      { key: 'p5-evidence', name: 'Before/after permissions evidence' },
      { key: 'p5-tool', name: 'Python IAM/cloud auditor with separate collection, policy, and reporting modules; documented usage, sample data, and tests for safe/unsafe configurations, missing data, and API failures' },
      { key: 'p5-ci', name: 'CI pipeline running auditor regression tests and infrastructure/dependency scans, with saved evidence of a failing misconfiguration and passing remediation' },
      { key: 'p5-casestudy', name: 'Published technical case study' },
    ],
  }),

  P(6, 'Phase 6 — First Technical Role', {
    months: 'apply from 8–10; land 10–18',
    hours: [38, 58],
    blurb:
      'Convert the portfolio into paid technical experience. Prioritize the primary role family and adjacent fallback chosen in Phase 2, revisiting that choice against current postings. Target entry roles in SOC, IAM, cloud operations, NOC, IT support with security duties, or junior AppSec/automation where requirements fit. Budget includes resume tailoring, applications, and mock interviews; employer response time is outside study hours. CIU Getting the Job remains optional supplementary reading in extras and is not scored for this phase.',
    links: [
      { name: 'Data Analytics Job Simulation', by: 'Deloitte (via Forage)', url: 'https://www.theforage.com/simulations/Deloitte-Australia/data-analytics-s5zy', hours: 6, note: 'Free, ~5-6hrs. A completed, named job simulation is a recognized line on a resume/LinkedIn.' },
      { name: 'Job postings — local employers', by: 'LinkedIn Jobs', url: 'https://www.linkedin.com/jobs/', hours: 10, note: 'Refresh the Phase 2 primary/fallback decision using 20 current local/location-eligible postings. Record recurring skills and certification screens. Allocation includes role-specific resumes and targeted applications; extend the application window as needed.' },
      { name: 'Job-description → skills-gap analyzer', by: 'Your GitHub', url: 'https://github.com/new', hours: 12, codex: true, note: 'Codex addition. Build it: paste a posting, get the gaps vs your portfolio. Uses the Phase 1 workbench.' },
      { name: 'TryHackMe / HTB Academy — keep going', by: 'TryHackMe · Hack The Box', url: 'https://tryhackme.com', hours: 20, note: 'Budget for ongoing technical practice, STAR project walkthroughs, portfolio assembly, and adversarial mock interviews during the application window.' },
    ],
    outputs: [
      { key: 'p6-apps', name: '50–100 targeted applications' },
      { key: 'p6-resumes', name: 'Resume versions tailored to the primary role family and adjacent fallback, with claims tied to demonstrated evidence' },
      { key: 'p6-star', name: 'Every project converted to STAR-format interview evidence' },
      { key: 'p6-portfolio', name: 'Interview portfolio: architecture diagrams + incident walkthroughs' },
      { key: 'p6-role', name: 'First technical role or technical client contract, with duties and scope documented; optional audit revenue is tracked in Phase 4' },
    ],
  }),

  P(7, 'Phase 7 — Bug-Bounty Track', {
    lane: true,
    months: 'opens 8–12, parallel',
    hours: [104, 156],
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
      { key: 'p7-accepted', name: 'Submission outcome log: accepted, rejected, or pending, with feedback and next steps; an accepted report is a stretch outcome, not required for phase completion' },
    ],
  }),

  P(8, 'Phase 8 — AI Security Branch (specialization)', {
    months: '12–24, layered on the fundamentals',
    hours: [64, 96],
    blurb:
      'Secure LLM apps, AI agents, and MCP-connected systems. Codex\'s verdict: a strong fit for your background — as a layer ON TOP OF conventional security, never a substitute. Market read: SOC, cloud, IAM, and AppSec have substantially larger entry-level markets; AI security is smaller, newer, concentrated in AI companies, consultancies, platform vendors, and large enterprises. Position as "security engineer with AI-agent and automation specialization", not "AI security expert", until there is real experience behind it.',
    links: [
      { name: 'Securing Agents with NemoClaw and OpenShell', by: 'NVIDIA Deep Learning Institute', url: 'https://www.nvidia.com/en-us/training/self-paced-courses/', hours: 4, note: 'Free, 4hrs. Hardening AI agents against attacks. Note: OpenShell is itself a sandboxed runtime with policy controls, not raw/unrestricted shell access — the course teaches how to configure and reason about that sandbox correctly. Search the free-courses catalog for "Securing Agents with NemoClaw and OpenShell".', quiz: [
        { q: 'Why sandbox an AI agent\'s tool access instead of letting it run commands directly on the host?', choices: ['Sandboxing is only for performance reasons, not safety', 'It contains the blast radius — a manipulated or buggy agent can\'t reach beyond what the sandbox permits', 'Sandboxes make agents run faster', 'It\'s required by law in every country'], answer: 1, why: 'The same least-privilege principle from the earlier agent-risk work — a sandbox is that principle enforced at the execution layer, not just the prompt layer.' },
        { q: 'An agent reads a file containing hidden instructions telling it to delete logs, and its sandbox policy happens to allow that action. What class of failure does this risk combine?', choices: ['Prompt injection (the hidden instructions) plus excessive agency (the policy grants more than the task needs)', 'A hardware failure', 'A network outage', 'A licensing violation'], answer: 0, why: 'This is exactly why agent security treats injection and agency as a pair — untrusted input plus an over-permissioned sandbox policy is the dangerous combination, not either alone. A well-scoped policy is the actual defense here, not the mere presence of a sandbox.' },
      ] },
      { name: 'MITRE ATLAS', by: 'MITRE', url: 'https://atlas.mitre.org/', hours: 8, codex: true, note: 'Codex addition. Free. ATT&CK\'s counterpart for adversarial threats to AI systems.' },
      { name: 'AI Risk Management Framework', by: 'NIST', url: 'https://www.nist.gov/itl/ai-risk-management-framework', hours: 8, codex: true, note: 'Codex addition. Free. The governance backbone for a client-facing AI-risk assessment.' },
      { name: 'OWASP Top 10 for LLM Applications (revisit)', by: 'OWASP', url: 'https://owasp.org/www-project-top-10-for-large-language-model-applications/', hours: 4, note: 'Free. Revisit risks against your implementation; scope each item as applicable or not applicable, then add relevant cases to the separately budgeted evaluation harness.' },
      { name: 'Prompt-injection & agent-evaluation labs', by: 'Anthropic docs', url: 'https://docs.anthropic.com/', hours: 40, codex: true, note: 'Vendor documentation on tool permissions and evaluations. Allocation includes the assessment toolkit, injection/exfiltration harness with synthetic data, output validation, and technical/executive reports. Use the documentation for the model under test and record observed results; prepare a scoped client-pilot offer from this evidence.' },
      { name: 'Model Context Protocol — specification', by: 'MCP', url: 'https://modelcontextprotocol.io/', hours: 16, note: 'Free specification. Extend the agent-risk work begun in Phase 1 and tested in Phase 3 to a real local MCP server. Allocation includes data-flow threat modeling, controlled attack tests, permission hardening, and a secure reference architecture.' },
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

// Calendar windows are planning estimates, not promises of employment or seniority.
// `requires` contains phases that must be complete for the renderer to mark the milestone.
// Optional lanes (4, 7) and specialization (8) do not block the core engineering route.
export const milestones = [
  { when: 'Months 0–1', label: 'AI-workflow starter', evidence: 'Verified workflow, starter risk sketch, and versioned GitHub repo', requires: [1] },
  { when: 'Months 4–8', label: 'Lab builder', evidence: 'Foundations assessment, detection lab, deployed Sigma/Wazuh rules, and incident report', requires: [1, 2, 3] },
  { when: 'Months 6–10', label: 'First plausibly sellable milestone', evidence: 'Cloud-security project, tested automation tool, and case study; assess readiness for a narrowly scoped service. The optional audit package is earned separately in Phase 4.', requires: [1, 2, 3, 5], big: true },
  { when: 'Months 8–18', label: 'Job-market or technical-contract entry', evidence: 'Targeted applications, interview portfolio, and a first technical role or contract; audit-lane revenue is separate', requires: [1, 2, 3, 5, 6] },
  { when: 'Months 8–12, optional lane', label: 'Bug-bounty practice and submissions', evidence: 'Web-fundamentals assessment, vulnerability write-ups, and authorized submissions; acceptance is not guaranteed', requires: [1, 2, 7] },
  { when: 'Months 10–18', label: 'First technical role or contract', evidence: 'Documented SOC, NOC, IT/security, IAM, cloud, AppSec, or automation duties', requires: [1, 2, 3, 5, 6], big: true },
  { when: 'Months 12–24, optional specialization', label: 'AI-security specialization evidence', evidence: 'Cloud/automation foundation plus AI assessment toolkit, tested MCP threat model, and reports', requires: [1, 2, 3, 5, 8] },
  { when: 'Years 3–6+ of applied experience', label: 'Foundation for engineer-level progression', evidence: 'Detection, cloud, automation, and technical work evidence. Phase completion marks preparation; engineer-level responsibility still requires demonstrated production ownership, architecture decisions, and incident response.', requires: [1, 2, 3, 5, 6], big: true },
];

// The paid-certification gate. All four must be true before buying ANY paid cert.
// These are manual checkboxes on the Progress page — none can be derived from study progress.
export const gate = {
  first: 'CompTIA Security+ — $439',
  firstUrl: 'https://www.comptia.org/certifications/security',
  why: 'Strongest consensus in the inventory, appears in real entry-program requirements, broad HR filter. It validates hands-on work; it does not replace it.',
  conditions: [
    { key: 'gate-repos', name: 'Public, explainable hands-on evidence relevant to the target role: detection lab for SOC, or cloud project and tested automation for cloud/IAM roles' },
    { key: 'gate-income', name: 'The full exam cost is affordable without debt or touching essential personal/operating cash; budgeted savings, employer funding, or audit/contract revenue can cover it' },
    { key: 'gate-market', name: 'Dated market evidence: at least three target postings require or strongly prefer this certification, OR a specific employer/recruiter confirms it is a screening requirement' },
    { key: 'gate-gap', name: 'The certification closes the documented hiring gap for the chosen role; exam preparation includes practical demonstrations of the relevant skills' },
  ],
  triggers: [
    'Hiring relevance: three or more target postings explicitly require or strongly prefer it, OR a specific employer/recruiter confirms it is a screening requirement.',
    'Affordability: audit or contract revenue can fund it without touching operating cash; budgeted savings or employer funding also qualify. Revenue alone does not prove hiring relevance.',
    'Buy only when every condition above is met. Applications and interviews may start before certification; an existing interview pipeline is not required.',
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
    'AWS Cloud Practitioner — originally deprioritized here since cloud vocabulary is free to learn; re-added to Phase 5 (Jesse\'s call) after real signal from two independent creators crediting it for early roles. $100 is low enough that the earlier objection doesn\'t hold much weight either way.',
    'A+ — stays skipped for this track unless a help-desk role uses it as a screen.',
    'OSCP — excellent, but premature and misaligned with a cloud / automation / AI-security direction.',
    'CISSP — a long-term outcome, not a milestone. Five-year experience requirement makes it irrelevant to initial employability.',
  ],
};

// Optional curriculum: excluded from all phase totals, milestones, and the paid-cert gate.
// Choose a resource to fill a demonstrated gap; completing every extra is never required.
export const extras = [
  {
    title: 'AI awareness and product courses — choose one or do later',
    blurb: 'Optional alternatives for a specific gap or tool you use. Phase 1 already provides the starting workflow; do not stack all these courses before building. Check current access, pricing, and promotional terms before enrolling.',
    links: [
      { name: 'Career Essentials in Generative AI', by: 'Microsoft + LinkedIn Learning', url: 'https://www.linkedin.com/learning/paths/career-essentials-in-generative-ai-by-microsoft-and-linkedin', hours: 6, note: 'Free professional-certificate path, ~5-8hrs.', quiz: [
        { q: 'What is "hallucination" in the context of generative AI?', choices: ['When the model refuses to answer a question', 'When the model generates confident, plausible-sounding output that is factually wrong', 'A type of image-generation artifact only', 'When the model runs out of memory'], answer: 1, why: 'Hallucination is stated-with-confidence wrongness — output that reads well but isn\'t grounded in fact, which is why verification stays your job.' },
        { q: 'Which best describes the relationship between AI, machine learning, and generative AI?', choices: ['They\'re three unrelated fields', 'Generative AI is a subset of machine learning, which is a subset of the broader field of AI', 'Generative AI came first, then ML, then AI', 'AI and machine learning are the exact same thing'], answer: 1, why: 'AI is the broad field, machine learning is an approach within it (learning from data), and generative AI is a specific application of ML focused on creating new content.' },
      ] },
      { name: 'AI For Everyone', by: 'DeepLearning.AI', url: 'https://www.deeplearning.ai/courses/ai-for-everyone/', hours: 5, note: 'Free to audit, ~4-6hrs. The verified certificate costs extra — the learning does not.', quiz: [
        { q: 'What\'s usually the biggest bottleneck in a real-world AI project — more than the algorithm itself?', choices: ['Finding a fast enough GPU', 'Data — getting enough good, relevant, well-labeled data for the task', 'The programming language used', 'The color scheme of the user interface'], answer: 1, why: 'Most real AI-project failures trace back to data quality/availability, not algorithm choice — a theme you\'ll see again building the Phase 3 detection lab.' },
        { q: 'What\'s a realistic current limitation of AI systems?', choices: ['AI can already fully replace human judgment in every domain', 'AI is good at narrow, well-defined tasks but struggles with broad common sense or judgment', 'AI systems never make mistakes once deployed', 'AI requires no human oversight after deployment'], answer: 1, why: 'Narrow competence, not general judgment, is the honest current state — exactly why "never outsource understanding" matters throughout this whole roadmap.' },
      ] },
      { name: 'Google AI Professional Certificate', by: 'Google (grow.google / Coursera)', url: 'https://grow.google/ai-professional/', hours: 7, note: '$49/mo Coursera, 7 courses ~1hr each (~7hrs). Free for eligible US small businesses (<=500 employees) via grow.google/small-business — Kairos Authority likely qualifies, check before paying. Bonus either way: 3 months free Google AI Pro — Google AI Pro is $19.99/mo, so that\'s ~$60 of value, not the $147 an earlier estimate here assumed.', quiz: [
        { q: 'The certificate includes 3 months of Google AI Pro free. What does that bonus actually save you if you\'d otherwise pay for it?', choices: ['Nothing, Google AI Pro is always free', 'About $60 — Google AI Pro runs $19.99/month', 'About $147 — Google AI Pro runs ~$49/month', 'Free cloud storage only, no AI tools'], answer: 1, why: 'At $19.99/mo, 3 months free is about $60 of value on top of the certificate itself — a real but smaller perk than it first sounds. Worth confirming you actually redeem it, not just the course completion.' },
      ] },
      { name: 'AI Boost Bites: Your Edge in the AI-Powered World', by: 'Google Skills', url: 'https://www.skills.google/paths/2480', hours: 7, note: 'Free. 43 short (~10min) video lessons + hands-on challenges: Gemini, Gemini for Workspace, Gemini Notebook, AI Studio.', quiz: [
        { q: 'The path teaches Gemini, Gemini for Workspace, Gemini Notebook, and AI Studio. What do these have in common?', choices: ['They\'re all Google\'s practical AI tools for real business tasks — content creation, research, market intelligence', 'They\'re competing companies\' products bundled for comparison', 'They\'re programming languages', 'They only work inside Google Cloud Console'], answer: 0, why: 'The path is a tactical toolkit for Google\'s own AI product suite, not abstract AI theory — each "bite" ends in a hands-on challenge applying the tool immediately.' },
        { q: 'Each lesson in this path is followed by what?', choices: ['A 3-hour reading assignment', 'A hands-on challenge applying what you just learned', 'A group discussion forum', 'Nothing — lessons are watch-only'], answer: 1, why: 'The format is built around immediate application, not passive video-watching — matches the "verify, don\'t just consume" habit from Phase 1\'s AI Fluency course.' },
      ] },
      { name: 'Gemini Enterprise Agent Ready (GEAR)', by: 'Google Cloud', url: 'https://www.skills.google/paths', hours: 8, note: 'Free no-cost subscription — 35 monthly credits for hands-on agent-building labs on Google Skills. Search "GEAR" or "Agents" path on skills.google/paths once joined.' },
    ],
  },
  {
    title: 'Optional architect certification — only after the paid-cert gate',
    blurb: 'CCA-F is supplementary and paid/access-gated. Verify current eligibility and price with Anthropic and apply the same affordability and hiring-relevance gate before buying. It is not a Phase 1 prerequisite.',
    links: [
      { name: 'Claude Certified Architect — Foundations (CCA-F)', by: 'Anthropic', url: 'https://anthropic.skilljar.com/claude-certified-architect-foundations-access-request', hours: 6, note: '$125 before partner discounts (per Anthropic\'s own FAQ — NOT free). Currently also gated to Claude Partner Network members (joining the network itself is free) — request access here. Proctored, 60q/120min: agentic architecture, MCP, Claude Code, prompt engineering. ~4-8hrs incl. prep. Weigh this against the free-first sequencing before paying.', quiz: [
        { q: 'In the Model Context Protocol (MCP), what does a server expose to a connected client?', choices: ['Only images and video files', 'Tools, resources, and prompts that the connected AI model can use', 'A direct connection to the model\'s training data', 'Nothing — MCP servers are passive logging systems'], answer: 1, why: 'MCP servers expose capabilities (tools/resources/prompts) an AI client can call — it\'s how Claude Code reaches things like your filesystem or a database.' },
        { q: 'Why give an AI agent the LEAST tool access necessary for a task?', choices: ['It makes the agent respond faster', 'Least privilege — it limits the blast radius if the agent misbehaves or is manipulated', 'It saves money on API calls', 'Agents with fewer tools always reason better'], answer: 1, why: 'Least privilege is a core security principle — you\'ll build it hands-on in Phase 5\'s IAM lab and Phase 8\'s agent hardening.' },
        { q: 'A webpage a Claude Code agent reads contains hidden text instructing it to exfiltrate your SSH keys. What\'s this attack called?', choices: ['A denial-of-service attack', 'Prompt injection — untrusted content trying to hijack the agent\'s instructions', 'A buffer overflow', 'Social engineering targeting you directly, not the agent'], answer: 1, why: 'Prompt injection through untrusted content (web pages, files, tool results) is #1 on the OWASP LLM Top 10 in Phase 3 — treat content the agent reads as data, never as commands.' },
      ] },
    ],
  },
  {
    title: 'Optional investigation and job-search supplements',
    blurb: 'Use Velociraptor if endpoint investigation fits the chosen role. In Phase 6, CIU Getting the Job is optional supplementary reading, excluded from phase scoring and hours.',
    links: [
      { name: 'Velociraptor', by: 'Rapid7 (open source)', url: 'https://docs.velociraptor.app/', hours: 6, codex: true, note: 'Codex addition, optional. Endpoint investigation tool.' },
      { name: 'Coding Interview University — Getting the Job', by: 'jwasham (GitHub)', url: 'https://github.com/jwasham/coding-interview-university#getting-the-job', hours: 2, note: 'Free, optional Phase 6 supplement: skim resume, job search, interview process, and questions to ask the interviewer. No required output or phase-completion checkbox depends on this extra.' },
    ],
  },
  {
    title: 'NVIDIA Robotics & Simulation (optional — not part of the cybersecurity path)',
    blurb:
      'These are real, free NVIDIA Deep Learning Institute courses — same catalog as the two picks added to your Phases 1 and 8 — but every one below is about robotics or 3D simulation, not cybersecurity. Nothing here counts toward any phase, milestone, or the paid-cert gate. Purely optional, do it only if the subject itself interests you.',
    links: [
      { name: 'An Introduction to Developing With NVIDIA Omniverse', by: 'NVIDIA DLI', url: 'https://www.nvidia.com/en-us/training/self-paced-courses/', hours: 2, note: 'Free, 2hrs. Building 3D applications and digital twins in Omniverse.' },
      { name: 'Extend Omniverse Kit Applications for Building Digital Twins', by: 'NVIDIA DLI', url: 'https://www.nvidia.com/en-us/training/self-paced-courses/', hours: 2, note: 'Free, 2hrs. Extending Omniverse Kit for digital-twin applications.' },
      { name: 'Fundamentals of Working With OpenUSD', by: 'NVIDIA DLI', url: 'https://www.nvidia.com/en-us/training/self-paced-courses/', hours: 2, note: 'Free, 2hrs. Universal Scene Description — the 3D file format behind Omniverse.' },
      { name: 'Creating an Omniverse Extension With Python', by: 'NVIDIA DLI', url: 'https://www.nvidia.com/en-us/training/self-paced-courses/', hours: 2, note: 'Free, 2hrs. Python scripting inside Omniverse — the one item here that at least uses Python.' },
      { name: "A Beginner's Guide to Autonomous Robots", by: 'NVIDIA DLI', url: 'https://www.nvidia.com/en-us/training/self-paced-courses/', hours: 1, note: 'Free, 1hr. What makes a robot "autonomous" — perception, planning, control, at a conceptual level.' },
      { name: 'Generating High-Quality Motion Data for Robotics With MobilityGen', by: 'NVIDIA DLI', url: 'https://www.nvidia.com/en-us/training/self-paced-courses/', hours: 2, note: 'Free, ~1.5hrs. Synthetic motion-data generation for training robotics models.' },
      { name: 'Software-in-the-Loop Testing for Robots With OpenUSD, Isaac Sim, and ROS', by: 'NVIDIA DLI', url: 'https://www.nvidia.com/en-us/training/self-paced-courses/', hours: 2, note: 'Free, 2hrs. Testing robot software in simulation before touching real hardware.' },
      { name: 'Building AI-Powered Material Generation for Omniverse With DGX Cloud', by: 'NVIDIA DLI', url: 'https://www.nvidia.com/en-us/training/self-paced-courses/', hours: 2, note: 'Free, 2hrs. Generating 3D materials/textures with AI, on DGX Cloud.' },
    ],
  },
  {
    title: 'Coding Interview University — CS Theory Bonus (optional — not part of the cybersecurity path)',
    blurb:
      'Optional trees/heaps/sorting, graphs/string search, recursion/dynamic programming, design, and scalability. Use only when a project or target interview calls for them. Phase 2 keeps a small data-structures reference; Phase 3 keeps processes/threads. Phase 5 learns testing through its actual tool, and Phase 6 job reading stays optional.',
    links: [
      { name: 'Coding Interview University — Trees, Heaps & Sorting', by: 'jwasham (GitHub)', url: 'https://github.com/jwasham/coding-interview-university#trees', hours: 20, note: 'Free. BSTs, heaps/priority queues, sorting algorithms.' },
      { name: 'Coding Interview University — Graphs & String Searching', by: 'jwasham (GitHub)', url: 'https://github.com/jwasham/coding-interview-university#graphs', hours: 15, note: 'Free, optional. Study graph traversal or string-search algorithms when a project or interview needs them. Neither is a prerequisite for ATT&CK mapping or the detection lab.' },
      { name: 'Coding Interview University — Recursion, DP & Software Design', by: 'jwasham (GitHub)', url: 'https://github.com/jwasham/coding-interview-university#recursion', hours: 25, note: 'Free, optional CS/interview depth: recursion, dynamic programming, and design patterns. Phase 5 already teaches code structure and tests through the automation project; this reading is not a prerequisite.' },
      { name: 'Coding Interview University — System Design & Scalability', by: 'jwasham (GitHub)', url: 'https://github.com/jwasham/coding-interview-university#system-design-scalability-data-handling', hours: 20, note: 'Free, optional-advanced section of the repo. How real systems scale — useful if the cloud/AppSec branch is where you end up specializing.' },
      { name: 'Combinatorics, Probability & NP-Completeness', by: 'jwasham (GitHub)', url: 'https://github.com/jwasham/coding-interview-university#recursion', hours: 15, note: 'Free. Combinatorics & probability, NP/NP-Complete/approximation algorithms — theoretical CS, rarely load-bearing for security work day to day.' },
      { name: 'Compilers, Emacs/Vim & Unix Power Tools', by: 'jwasham (GitHub)', url: 'https://github.com/jwasham/coding-interview-university#additional-learning', hours: 15, note: 'Free. How compilers work, editor mastery, deeper Unix tooling — genuinely useful long-term, not required for any phase or the paid-cert gate.' },
    ],
  },
  {
    title: 'CISSP — future landmark, not active path (years away)',
    blurb: 'Added as a visible reference point, not something to work toward now. CISSP requires 5 years of paid security experience (2 with an approved waiver) to fully certify — you earn this on the job, years into the career, not by studying for it early. Keeping it here so it\'s trackable as a landmark instead of invisible.',
    links: [
      { name: 'CISSP', by: 'ISC2', url: 'https://www.isc2.org/certifications/cissp', hours: 70, note: '$749 exam + $125/yr maintenance. Requires 5 years paid security experience (2 with a qualifying waiver) — you can pass the exam early as an "Associate of ISC2" while accumulating the experience. Every source in this research agreed: its name alone carries weight with recruiters, used for senior positions and promotions. Do not start studying for this until you\'re well into Phase 6 or beyond.' },
    ],
  },
];

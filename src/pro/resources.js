import { hpSetup } from './security-resources.js';

// "Studies" — curated external study links, shown on the #/resources page.
// Each group credits where it came from. Add more groups over time.
export default [
  {
    "title": "Approved Hands-on Security Labs",
    "blurb": "Practice sequence: Juice Shop → WebGoat/DVWA → VAmPI → crAPI → DVGA when relevant. KC7 builds investigation skills alongside the defensive lab. Full roadmap placement: Phase 3 for defensive work, Phase 7 for web/API practice. Use the HP checklist below before Wazuh or Atomic Red Team.",
    "source": {
      "label": "Approved conversation review · official project documentation",
      "url": "https://github.com/juice-shop/juice-shop"
    },
    guide: hpSetup,
    "links": [
      {
        "id": "p3-kc7",
        "name": "KC7: browser investigation cases",
        "by": "KC7 Foundation",
        "url": "https://kc7cyber.com/",
        "note": "Practice is included in the existing KQL allocation. Free browser investigations with KQL. Start with a beginner case such as A Rap Beef; create a free account to save progress. Optional early practice alongside A+; return here to connect investigation queries to Wazuh evidence. Save a sanitized case walkthrough."
      },
      {
        "id": "s-approved-p7-juice-shop",
        "name": "OWASP Juice Shop: first web practice target",
        "by": "OWASP",
        "url": "https://github.com/juice-shop/juice-shop",
        "note": "Free. Start here, then WebGoat and DVWA. Mac or HP. Run docker run --rm -p 127.0.0.1:3000:3000 bkimminich/juice-shop. Keep it local; skip challenges requiring paid AI services. Use the official companion guide linked below for hints. Save challenge evidence for your write-ups."
      },
      {
        "id": "s-approved-p7-webgoat",
        "name": "WebGoat: exploit, understand, fix",
        "by": "OWASP",
        "url": "https://github.com/WebGoat/WebGoat",
        "note": "Free guided web-security lessons. Mac or HP. Follow the official local Docker setup and bind published ports to 127.0.0.1. Learn the mitigation after reproducing each flaw."
      },
      {
        "id": "s-approved-p7-dvwa",
        "name": "DVWA: repeat bugs at stronger security levels",
        "by": "digininja",
        "url": "https://github.com/digininja/DVWA",
        "note": "Free beginner web lab. Use the HP and official Docker Compose instructions; keep its published service on 127.0.0.1. Compare security levels and document how the defenses change. Never deploy it publicly."
      },
      {
        "id": "s-approved-p7-vampi",
        "name": "VAmPI: API security starter",
        "by": "erev0s",
        "url": "https://github.com/erev0s/VAmPI",
        "note": "Free. Begin the API sequence here after HTTP/JSON fundamentals, then crAPI, then DVGA. Mac or HP. Local Mac command: docker run --rm -p 127.0.0.1:5001:5000 erev0s/vampi:latest. Compare vulnerable and secure modes using its API specification and Postman collection."
      },
      {
        "id": "s-approved-p7-crapi",
        "name": "crAPI: realistic API practice",
        "by": "OWASP",
        "url": "https://github.com/OWASP/crAPI",
        "note": "Free multi-service API lab after VAmPI. Run on the HP with the official Docker Compose setup and localhost bindings. Stop Wazuh and other heavy labs first. Check current AI/chatbot requirements; skip paid integrations."
      },
      {
        "id": "s-approved-p7-dvga",
        "name": "DVGA: GraphQL specialization",
        "by": "dolevf",
        "url": "https://github.com/dolevf/Damn-Vulnerable-GraphQL-Application",
        "note": "Free GraphQL practice on the HP after VAmPI and crAPI, or when an authorized target uses GraphQL. Begin in Beginner mode. Follow project setup with localhost-only port bindings. Kept as a later specialization, not a prerequisite for first submissions."
      },
      {
        "id": "p3-wazuh",
        "name": "Wazuh: HP defensive lab",
        "by": "Wazuh",
        "url": "https://documentation.wazuh.com/current/deployment-options/docker/wazuh-container.html",
        "note": "Follow the HP setup checklist above. Full roadmap Phase 3 contains the tracked defensive-lab work. Keep Sysmon and Defender active, verify telemetry before tests, and clean up each test afterward."
      },
      {
        "id": "s-approved-p3-atomic-red-team",
        "name": "Atomic Red Team: HP attack-and-detect practice",
        "by": "Red Canary",
        "url": "https://github.com/redcanaryco/atomic-red-team",
        "note": "Follow the HP setup checklist above. Full roadmap Phase 3 contains the tracked defensive-lab work. Keep Sysmon and Defender active, verify telemetry before tests, and clean up each test afterward."
      }
    ]
  },
  {
    "title": "Approved Security References and Report Examples",
    "blurb": "Use alongside the practice labs. Read original reports, then write your own reproduction steps, impact and mitigation. Older directories may contain stale links. Full roadmap placement: Phase 7.",
    "source": {
      "label": "Approved conversation review · official project documentation",
      "url": "https://github.com/ngalongc/bug-bounty-reference"
    },
    "links": [
      {
        "id": "s-approved-p7-juice-shop-guide",
        "name": "Pwning OWASP Juice Shop: companion guide",
        "by": "OWASP Juice Shop",
        "url": "https://pwning.owasp-juice.shop/",
        "note": "Free hints and explanations. Use after attempting a challenge; explain the bug and mitigation in your own words."
      },
      {
        "id": "s-approved-p7-ngalongc-writeups",
        "name": "Bug bounty reports by vulnerability type",
        "by": "ngalongc",
        "url": "https://github.com/ngalongc/bug-bounty-reference",
        "note": "Older reference list. Read reports matching your current lab bug; record reproduction, impact and remediation patterns. Individual links may be stale. Write original reports rather than copying examples."
      },
      {
        "id": "s-approved-p7-awesome-writeups",
        "name": "Awesome Bugbounty Writeups",
        "by": "devanshbatham",
        "url": "https://github.com/devanshbatham/Awesome-Bugbounty-Writeups",
        "note": "Supplementary older report directory by bug type. Check each linked report before relying on it; individual links may be stale."
      },
      {
        "id": "s-approved-p7-hacktivity",
        "name": "HackerOne Hacktivity: disclosed reports",
        "by": "HackerOne",
        "url": "https://hackerone.com/hacktivity",
        "note": "Read publicly disclosed reports alongside the older directories. Compare scope, evidence, business impact and remediation. Public examples do not authorize testing the same companies."
      },
      {
        "id": "s-approved-p7-payloads-all-the-things",
        "name": "PayloadsAllTheThings",
        "by": "swisskyrepo",
        "url": "https://github.com/swisskyrepo/PayloadsAllTheThings",
        "note": "Look up the vulnerability you are practicing when a lab challenge blocks you. Reference material, not a course to finish. Use only in your own labs or within a program’s explicit scope and testing limits."
      },
      {
        "id": "s-approved-p7-hacktricks",
        "name": "HackTricks",
        "by": "HackTricks",
        "url": "https://hacktricks.wiki/",
        "note": "Methodology reference for web, Windows and Linux topics. Use when stuck, alongside PayloadsAllTheThings. Skip sponsored paid training. Only apply techniques to authorized labs or targets."
      }
    ]
  },
  {
    "title": "Approved CTF and Bounty Platforms",
    "blurb": "Progress from labs to Hacker101 CTF, then authorized VDP reports and paid programs when ready. Later platforms remain available without becoming prerequisites. Always follow each program’s scope and disclosure policy. Full roadmap placement: Phase 7.",
    "source": {
      "label": "Approved conversation review · official project documentation",
      "url": "https://docs.hackerone.com/en/articles/8456935-hacker-101"
    },
    "links": [
      {
        "id": "s-approved-p7-hacker101-ctf",
        "name": "Hacker101 CTF: private-invite eligibility milestone",
        "by": "HackerOne",
        "url": "https://ctf.hacker101.com/",
        "note": "Free browser CTF after beginner lab practice. HackerOne documentation sets 26 points as eligibility for private-program invitations; invitations are not guaranteed. Track points on Hacker101 and check off the separate milestone below. CTF practice is included in the Hacker101 study allocation."
      },
      {
        "id": "s-approved-p7-hackerone-vdp",
        "name": "HackerOne VDPs: first authorized reports",
        "by": "HackerOne",
        "url": "https://hackerone.com/directory/programs",
        "note": "Start with an explicitly authorized vulnerability disclosure program after the labs and CTF. VDPs may offer no payment. Read scope and disclosure rules before testing; submit only reproducible in-scope findings. Check current account and identity requirements directly. This is the first step toward the existing submissions deliverable."
      },
      {
        "id": "s-approved-p7-hackerone-paid",
        "name": "HackerOne: paid bounty programs",
        "by": "HackerOne",
        "url": "https://hackerone.com/bug-bounty-programs",
        "note": "Move to paid programs after solid lab evidence and report-writing practice. Check the program’s scope, eligibility, identity, tax and payout requirements before participating. Payment and private invitations are not guaranteed."
      },
      {
        "id": "s-approved-p7-bugcrowd-platform",
        "name": "Bugcrowd: second bounty platform",
        "by": "Bugcrowd",
        "url": "https://www.bugcrowd.com/engagements/",
        "note": "Use alongside HackerOne once you can write clear reports. Read each engagement’s scope, testing limits and disclosure terms. Check current identity, tax and payout requirements in researcher onboarding."
      },
      {
        "id": "s-approved-p7-intigriti",
        "name": "Intigriti: later program expansion",
        "by": "Intigriti",
        "url": "https://www.intigriti.com/",
        "note": "Kept for later, after HackerOne/Bugcrowd reporting practice. Explore programs and Hackademy. Check current identity verification and eligibility before submissions and payouts."
      },
      {
        "id": "s-approved-p7-yeswehack",
        "name": "YesWeHack: later program expansion",
        "by": "YesWeHack",
        "url": "https://www.yeswehack.com/",
        "note": "Explore after the first platforms. Verify identity, supported payout currency, payment methods and transfer terms directly before participating."
      },
      {
        "id": "s-approved-p7-synack",
        "name": "Synack Red Team: experienced-researcher goal",
        "by": "Synack",
        "url": "https://www.synack.com/red-team/",
        "note": "Long-term application goal after a strong public research record and practical experience. Review current selection and screening requirements before applying. Not an entry-level income milestone."
      }
    ]
  },
  {
    title: 'Approved Pentesting Certification Ladder',
    source: { label: 'Approved review · official certification providers', url: 'https://portswigger.net/web-security/certification' },
    blurb: 'After Security+ and income, with the paid-cert gate satisfied. Suggested order from your review: Security+ → PJPT (or eJPT) → BSCP → PNPT or CPTS → OSCP, preferably employer funded. Track A for web/bounty: BSCP → CWES. Track B for network/Active Directory jobs: PJPT or eJPT → PNPT or CPTS → OSCP. Track C: PenTest+ only for a documented employer/DoD need. This is a choice of routes, not a shopping list. Verify current prices, bundles, subscriptions and prerequisites on each provider page. Preparation time is not added to core roadmap totals.',
    links: [
      {"id": "s-approved-pjpt", "name": "PJPT: first network pentesting option", "by": "TCM Security", "url": "https://certifications.tcm-sec.com/pjpt/", "note": "Track B. Junior internal-network pentest and professional report. Choose PJPT or eJPT as your first practical cert, not both. Paid; wait until after Security+ and income."},
      {"id": "s-approved-ejpt", "name": "eJPT: alternative to PJPT", "by": "INE Security", "url": "https://ine.com/security/certifications/ejpt-certification", "note": "Track B alternative. Beginner practical penetration testing. Choose this instead of PJPT if its training better fits your gaps. Check training access and exam bundle terms before paying."},
      {"id": "s-approved-bscp", "name": "Burp Suite Certified Practitioner (BSCP)", "by": "PortSwigger", "url": "https://portswigger.net/web-security/certification", "note": "Track A, web/bounty. First paid web cert after the free Web Security Academy and practical labs. An active Burp Suite Professional subscription is required in addition to the exam. Budget both; verify current checkout totals."},
      {"id": "s-approved-cwes", "name": "HTB CWES: web exploitation specialist", "by": "Hack The Box", "url": "https://academy.hackthebox.com/preview/certifications/htb-certified-web-exploitation-specialist", "note": "Track A. Second web cert after BSCP if the web/bounty branch remains useful. Formerly CBBH. Check the current prerequisite path, training access and voucher bundle."},
      {"id": "s-approved-pnpt", "name": "PNPT: professional pentesting progression", "by": "TCM Security", "url": "https://certifications.tcm-sec.com/pnpt/", "note": "Track B. After PJPT/eJPT and report-writing practice. Professional engagement with a report and live debrief. Compare with CPTS and choose based on the role you want."},
      {"id": "s-approved-cpts", "name": "HTB CPTS: alternative professional progression", "by": "Hack The Box", "url": "https://academy.hackthebox.com/preview/certifications/htb-certified-penetration-testing-specialist", "note": "Track B. Alternative to PNPT, with broad practical pentesting and reporting. Verify the required path, training and current voucher package before buying."},
      {"id": "s-approved-oscp", "name": "OSCP / OSCP+: final pentesting goal", "by": "OffSec", "url": "https://www.offsec.com/courses/pen-200/", "note": "Track B. Last, preferably employer funded, after practical experience and PNPT or CPTS. Review current PEN-200 packages, exam rules and the distinction between OSCP and OSCP+ renewal requirements. Not a beginner purchase."},
      {"id": "s-approved-pentest-plus", "name": "PenTest+: conditional employer requirement", "by": "CompTIA", "url": "https://www.comptia.org/en-us/certifications/pentest/", "note": "Track C. Only if target Department of Defense contractor postings or an employer require it. Confirm the exact role’s qualification requirements and current exam version directly; do not assume blanket eligibility."},
    ],
  },
  {
    title: 'Free AI Courses and Credentials (2026)',
    blurb:
      'Five free courses and credentials worth putting on a résumé — from beginner-friendly to hands-on. Do them alongside the CodeQuest Pro tiers.',
    source: { label: '@cindiezhu · Instagram reel', url: 'https://www.instagram.com/reel/DbD2MDUJDIq/' },
    links: [
      {
        id: 's1-intro-to-machine-learning',
        name: 'Intro to Machine Learning',
        by: 'Kaggle',
        url: 'https://www.kaggle.com/learn/intro-to-machine-learning',
        note: 'Hands-on ML in the browser — build and validate your first models. Free.',
      },
      {
        id: 'linkedin-genai-career-essentials',
        name: 'Career Essentials in Generative AI',
        by: 'Microsoft + LinkedIn Learning',
        url: 'https://www.linkedin.com/learning/paths/career-essentials-in-generative-ai-by-microsoft-and-linkedin',
        note: 'Five courses, about 4 hours. Free through 2027, with a badge of completion for your LinkedIn profile.',
      },
      {
        id: 'ai-fluency',
        name: 'AI Fluency: Framework & Foundations',
        by: 'Anthropic',
        url: 'https://www.anthropic.com/ai-fluency',
        note: 'How to work with AI systems effectively, ethically, and safely. Certificate on completion.',
      },
      {
        id: 's1-ai-fundamentals',
        name: 'AI Fundamentals',
        by: 'IBM SkillsBuild',
        url: 'https://skillsbuild.org',
        note: 'Foundations of AI with a digital credential. Search the catalog for "AI Fundamentals".',
      },
      {
        id: 's1-elements-of-ai',
        name: 'Elements of AI',
        by: 'University of Helsinki',
        url: 'https://www.elementsofai.com',
        note: 'The classic free intro — demystifies AI, no math or coding required. 2M+ learners.',
      },
    ],
  },
  {
    title: 'Top 5 Cybersecurity Certs for Beginners (2026)',
    blurb:
      'Beginner-friendly certs recommended for a first cybersecurity résumé — paid, not free like the group above. Note: a commenter on the source post pushed back on TryHackMe certs specifically ("no way we\'re out here recommending THM") — some in the industry rate CompTIA Security+ and BTL1 as more widely recognized than TryHackMe\'s newer certs. Worth weighing before paying.',
    source: { label: '@withlove.sandra · Instagram carousel', url: 'https://www.instagram.com/p/DcQ5uFZFisu/' },
    links: [
      {
        id: 's2-security-analyst-level-1-sal1',
        name: 'Security Analyst Level 1 (SAL1)',
        by: 'TryHackMe',
        url: 'https://tryhackme.com/certification/security-analyst-level-1',
        note: '~20-30hrs, hands-on labs. From $349; existing Premium subscribers get 25% off (about $262). Includes one free retake and a 24-hour exam window. Valid 3 years.',
      },
      {
        id: 's2-blue-team-level-1-btl1',
        name: 'Blue Team Level 1 (BTL1)',
        by: 'Centri',
        url: 'https://www.centri.org/certifications/blue-team-level-1',
        note: 'SOC/blue-team focused. Course card says about 30 hours; FAQ estimates 40-50 hours. £399, 4 months access, one free resit.',
      },
      {
        id: 's2-security',
        name: 'Security+',
        by: 'CompTIA',
        url: 'https://www.comptia.org/certifications/security',
        note: '~50-60hrs, the industry-standard vendor-neutral baseline. Widely recognized by employers; approved under DoDM 8140.03. CompTIA launches Security+ V8 (SY0-801) on November 17, 2026, and the English SY0-701 retires June 11, 2027. V8 weights the domains differently (Security Operations 27%, Threats 24%, Architecture 19%, General Concepts 16%, Program Management 14%), so study for the version you will actually sit; the Sec+ Exam tab practices SY0-801.',
      },
      {
        id: 's2-google-cybersecurity-certificate',
        name: 'Google Cybersecurity Certificate',
        by: 'Google (Coursera)',
        url: 'https://grow.google/certificates/cybersecurity/',
        note: 'Eight courses, typically 3-6 months at 5-10 hours per week. No experience required; Coursera is $49/month. Includes AI training and a discounted Security+ dual credential.',
      },
      {
        id: 's2-certified-junior-cybersecurity-associate-cjca',
        name: 'Certified Junior Cybersecurity Associate (CJCA)',
        by: 'Hack The Box',
        url: 'https://academy.hackthebox.com/preview/certifications/htb-certified-junior-cybersecurity-associate',
        note: '~20-30hrs, hands-on exam in a live range. $105 standalone voucher, or included with the $490/year Silver Annual plan. Complete the full Junior Cybersecurity Analyst path before the exam.',
      },
    ],
  },
  {
    title: 'Hands-On Networking Labs, Free Tier (2026)',
    blurb:
      'Pro has subnetting, firewall and router labs but no switch command-line practice (VLANs, trunks, routing). This browser lab site fills that gap, and VLANs and segmentation come back in Security+. Use the free tier; the paid plan is optional and not needed to start.',
    source: { label: '@archin3t · Instagram reel', url: 'https://www.instagram.com/reel/DeVhieCM9aq/' },
    links: [
      {
        id: 's3-switchlab',
        name: 'SwitchLab',
        by: 'SwitchLab',
        url: 'https://switchlab.dev',
        note: 'Free tier ($0, no card): sandbox, flashcards, Meet the CLI, Learn Switching, Network Foundations 1-3, the first few routing labs, and one full CCNA practice exam with unlimited retakes. The 43 CCNA command-line labs need a paid plan ($22/month or $99/year). Checked 2026-10-13; the Reddit quotes on its home page are the site\'s own picks.',
      },
    ],
  },
  {
    title: 'Help-Desk Practice, Free Plan (2026)',
    blurb:
      'Tier 1 help desk is the entry job, and this browser simulator gives practice on the tickets interviews ask about (password reset, no internet, dead PC, locked account). Use the free plan daily; the paid plan is optional and not needed to start.',
    source: { label: '@bigibz1 · Instagram reel', url: 'https://www.instagram.com/reel/DeztMMyp_KI/' },
    links: [
      {
        id: 's3-servicedesk-simulator',
        name: 'ServiceDesk Simulator',
        by: 'ServiceDesk Simulator',
        url: 'https://servicedesk-simulator.com',
        note: 'Free plan ($0, no card): 5 ticket completions and 1 voice call a day, plus the desktop tools, past tickets and leaderboard. The AI mock interview, voicemails and team chat calls need Pro ($20/month or $199/year). The 16 written modules are free to read. Checked 2026-10-25; the "players who got hired" quotes on its home page are the site\'s own picks and it calls them individual experiences.',
      },
    ],
  },
  {
    title: 'Downtime: Free IT Help-Desk Game Demo (2026)',
    blurb:
      'Optional downtime play, not a study block, and it does not count as study hours or resume evidence. The free Steam demo drops you into an IT office with randomized computer, network and printer tickets, so it reinforces the Windows and networking basics from Expedited Stage 1. Windows only, so play it on the HP, not the iMac. The full game is a paid Early Access title and is not needed.',
    source: { label: 'El Taquero · Instagram reel', url: 'https://www.instagram.com/reel/DbTw3nXyTN4/' },
    links: [
      {
        id: 's3-it-specialist-simulator-demo',
        name: 'IT Specialist Simulator (free demo)',
        by: 'Pixel Team RED',
        url: 'https://store.steampowered.com/app/3388180/IT_Specialist_Simulator_Demo/',
        note: 'Free demo ($0, Steam account needed). Covers an intro scene, a timed day of randomized tickets, setting a network address through NCPA.cpl, and a short job-market mini-game. Windows 10+ only; the listed minimums are an i5-6300HQ, 8 GB RAM and GTX 950-class graphics, so confirm it runs on the HP before counting on it. The full game ($13.99, Early Access) is optional. Checked 2026-10-25; the reviewer\'s "pretty accurate" claim is his own opinion.',
      },
    ],
  },
];

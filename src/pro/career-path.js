// "Career Path" — Jesse's personal baby-to-cybersecurity-engineer roadmap.
// Separate from the generic "Studies" links: this is a sequenced, staged plan,
// not a grab-bag of extra reading. Same {title, blurb, source, links} shape as
// resources.js so it reuses the same render/progress code.
export default [
  {
    title: 'Stage 1 — Free Fundamentals (Weeks 1-11 @ 2hrs/day)',
    blurb:
      'The starting stage of a full baby-to-cybersecurity-career roadmap, built from a review of 13 Instagram posts plus a cross-check against real job postings and community consensus. Stage 1 is entirely free — no certs, no cost — just hands-on fundamentals before any paid certification or portfolio project. Core path first, electives whenever you want a change of pace.',
    source: { label: 'Career-path research session', url: 'https://www.instagram.com/cyberwithdiego/' },
    links: [
      {
        name: 'Bandit Wargame',
        by: 'OverTheWire',
        url: 'https://overthewire.org/wargames/bandit/',
        note: 'Weeks 1-2 (~28hrs w/ TryHackMe below). All 34 levels, hands-on Linux shell practice, free.',
      },
      {
        name: 'Linux Fundamentals (free rooms)',
        by: 'TryHackMe',
        url: 'https://tryhackme.com/module/linux-fundamentals',
        note: 'Weeks 1-2, alongside Bandit. Free-tier rooms only.',
      },
      {
        name: 'GitHub Skills',
        by: 'GitHub',
        url: 'https://skills.github.com',
        note: 'Week 3 (~5hrs). Free, interactive, official. Do "Introduction to GitHub" first.',
      },
      {
        name: 'Scientific Computing with Python',
        by: 'freeCodeCamp',
        url: 'https://www.freecodecamp.org/learn/scientific-computing-with-python/',
        note: 'Weeks 3-8 (~75hrs scoped to core fundamentals, not the full ~300hr cert). Syntax, functions, file I/O, basic scripting.',
      },
      {
        name: 'CompTIA Network+ (N10-009) free course',
        by: 'Professor Messer',
        url: 'https://www.professormesser.com/network-plus/n10-009/n10-009-video/n10-009-training-course/',
        note: 'Weeks 9-11 (~40hrs w/ practice). Free full video course covering the same material as the paid exam.',
      },
      {
        name: 'AI Fluency: Frameworks & Foundations',
        by: 'Anthropic',
        url: 'https://www.anthropic.com/ai-fluency',
        note: 'Elective, any week. Free, ~2-4hrs. Duplicate of the Studies page if already done there.',
      },
      {
        name: 'AI Fundamentals',
        by: 'IBM SkillsBuild',
        url: 'https://skillsbuild.org',
        note: 'Elective, any week. Free. Duplicate of the Studies page if already done there.',
      },
      {
        name: 'Intro to Deep Learning',
        by: 'Kaggle',
        url: 'https://www.kaggle.com/learn/intro-to-deep-learning',
        note: 'Elective, any week. Free, ~4hrs. Do "Intro to Machine Learning" (Studies page) first.',
      },
      {
        name: 'AI For Everyone',
        by: 'DeepLearning.AI',
        url: 'https://www.deeplearning.ai/courses/ai-for-everyone/',
        note: 'Elective, any week. Free to audit on Coursera.',
      },
      {
        name: 'Google Cloud Cybersecurity Certificate',
        by: 'Google Cloud Skills Boost',
        url: 'https://www.cloudskillsboost.google/paths/419',
        note: 'Elective, any week. Free self-paced badge path — different product from the paid Coursera "Google Cybersecurity Certificate" on the Studies page.',
      },
    ],
  },
  {
    title: 'Stage 2 — Build the Portfolio (hands-on labs, mostly free)',
    blurb:
      'The single biggest gap real job postings flag: certs alone don’t prove you can do the work. This stage builds three publishable projects — a detection lab, a cloud security project, and a Python automation script — using free tools.',
    links: [
      {
        name: 'TryHackMe',
        by: 'TryHackMe',
        url: 'https://tryhackme.com',
        note: 'Keep going past Stage 1’s free rooms — more hands-on practice, free tier is enough for now.',
      },
      {
        name: 'VirtualBox',
        by: 'Oracle',
        url: 'https://www.virtualbox.org',
        note: 'Free. Build your home lab VMs here — a Windows VM is the base of the detection lab below.',
      },
      {
        name: 'Sysmon',
        by: 'Microsoft Sysinternals',
        url: 'https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon',
        note: 'Free. Install on your lab Windows VM for real endpoint logging.',
      },
      {
        name: 'Wazuh',
        by: 'Wazuh',
        url: 'https://wazuh.com',
        note: 'Free, open-source SIEM. Feed it your Sysmon logs — this is your detection lab’s core.',
      },
      {
        name: 'Sigma rules',
        by: 'SigmaHQ',
        url: 'https://github.com/SigmaHQ/sigma',
        note: 'Free. The detection-rule format to write your first rule in — pair with a real MITRE ATT&CK technique.',
      },
      {
        name: 'ATT&CK Matrix',
        by: 'MITRE',
        url: 'https://attack.mitre.org',
        note: 'Free reference. Pick one real technique, simulate it in your lab, detect it, write it up.',
      },
      {
        name: 'AWS Free Tier',
        by: 'Amazon Web Services',
        url: 'https://aws.amazon.com/free/',
        note: 'Free. Cloud security project: set up over-permissive IAM, CloudTrail logging, a misconfigured S3 bucket, then fix it. Document the before/after.',
      },
    ],
  },
  {
    title: 'Stage 3 — First Paid Cert + Start Selling',
    blurb:
      'Once Stage 2’s three projects are published on your own GitHub, get the one cert every source agreed on, and open two income lanes at once: bug bounty platforms and local/freelance clients — you don’t need to wait for a traditional job offer.',
    links: [
      {
        name: 'Security+',
        by: 'CompTIA',
        url: 'https://www.comptia.org/certifications/security',
        note: '$439. The consensus pick across every source in this research — real job req language, highest cross-source rating.',
      },
      {
        name: 'Hacker101',
        by: 'HackerOne',
        url: 'https://www.hacker101.com',
        note: 'Free training + CTF. Bug bounty on-ramp — practice and a first possible income lane at once.',
      },
      {
        name: 'Bugcrowd University',
        by: 'Bugcrowd',
        url: 'https://bugcrowd.com/hackers/bugcrowd-university/',
        note: 'Free. Second bug-bounty platform, same lane as Hacker101 above.',
      },
    ],
  },
  {
    title: 'Stage 4 — Pick Your Branch',
    blurb:
      'Specialize once Stage 2/3 show you what you actually enjoy. Pick one — don’t do all five at once.',
    links: [
      {
        name: 'Blue Team Level 1 (BTL1)',
        by: 'Security Blue Team',
        url: 'https://securityblue.team/btl1',
        note: 'SOC/Blue Team branch. ~$490. Already on the Studies page as a Top-5-beginner pick.',
      },
      {
        name: 'CySA+',
        by: 'CompTIA',
        url: 'https://www.comptia.org/certifications/cybersecurity-analyst',
        note: 'SOC/Blue Team branch, alternative to BTL1. $439.',
      },
      {
        name: 'PEN-200 / OSCP',
        by: 'OffSec',
        url: 'https://www.offsec.com/courses/pen-200/',
        note: 'Offensive/Red Team branch. $1,749, hardest hands-on cert on this whole list. Practice free first on HTB Academy below.',
      },
      {
        name: 'HTB Academy',
        by: 'Hack The Box',
        url: 'https://academy.hackthebox.com',
        note: 'Free tier. OSCP prep — do this before spending on PEN-200 above.',
      },
      {
        name: 'RHCSA',
        by: 'Red Hat',
        url: 'https://www.redhat.com/en/services/certification/rhcsa',
        note: 'Cloud/Infra branch, pair with CKA below. $500.',
      },
      {
        name: 'CKA',
        by: 'Linux Foundation / CNCF',
        url: 'https://www.cncf.io/training/certification/cka/',
        note: 'Cloud/Infra branch, pair with RHCSA above. $445.',
      },
      {
        name: 'CCNA',
        by: 'Cisco',
        url: 'https://www.cisco.com/site/us/en/learn/training-certifications/certifications/ccna/index.html',
        note: 'Networking branch. $300-330.',
      },
      {
        name: 'SecurityX',
        by: 'CompTIA',
        url: 'https://www.comptia.org/certifications/securityx',
        note: 'Generalist-advanced branch (formerly CASP+). ~$509.',
      },
    ],
  },
  {
    title: 'Stage 5 — Capstone (earned on the job, years 3-5)',
    blurb:
      'The terminal "engineer/architect" credential. Can’t be rushed — requires real paid security experience. This is a marker to work toward, not something to study for yet.',
    links: [
      {
        name: 'CISSP',
        by: 'ISC2',
        url: 'https://www.isc2.org/certifications/cissp',
        note: '$749 + $125/yr. Requires 5 years paid security experience (2 with a waiver) to fully certify — you can pass the exam early as an "Associate of ISC2" while you earn the experience.',
      },
    ],
  },
];

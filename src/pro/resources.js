// "Studies" — curated external study links, shown on the #/resources page.
// Each group credits where it came from. Add more groups over time.
export default [
  {
    title: 'Free AI Certificates (2026)',
    blurb:
      'Five free courses/certificates worth putting on a résumé — from beginner-friendly to hands-on. Do them alongside the CodeQuest Pro tiers.',
    source: { label: '@cindiezhu · Instagram reel', url: 'https://www.instagram.com/reel/DbD2MDUJDIq/' },
    links: [
      {
        name: 'Intro to Machine Learning',
        by: 'Kaggle',
        url: 'https://www.kaggle.com/learn/intro-to-machine-learning',
        note: 'Hands-on ML in the browser — build and validate your first models. Free.',
      },
      {
        name: 'Career Essentials in Generative AI',
        by: 'Microsoft + LinkedIn Learning',
        url: 'https://www.linkedin.com/learning/paths/career-essentials-in-generative-ai-by-microsoft-and-linkedin',
        note: 'Professional certificate path. Free to complete; adds to your LinkedIn.',
      },
      {
        name: 'AI Fluency: Frameworks & Foundations',
        by: 'Anthropic',
        url: 'https://www.anthropic.com/ai-fluency',
        note: 'How to work with AI systems effectively, ethically, and safely. Certificate on completion.',
      },
      {
        name: 'AI Fundamentals',
        by: 'IBM SkillsBuild',
        url: 'https://skillsbuild.org',
        note: 'Foundations of AI with a digital credential. Search the catalog for "AI Fundamentals".',
      },
      {
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
        name: 'Security Analyst Level 1 (SAL1)',
        by: 'TryHackMe',
        url: 'https://tryhackme.com/certification/security-analyst-level-1',
        note: '~20-30hrs, hands-on labs. $349 (voucher + 3mo premium), or $297 with existing premium. Valid 3 years.',
      },
      {
        name: 'Blue Team Level 1 (BTL1)',
        by: 'Security Blue Team',
        url: 'https://securityblue.team/btl1',
        note: '~30-40hrs, SOC/blue-team focused. £399 (~$490), includes 4mo access + one free retake.',
      },
      {
        name: 'Security+',
        by: 'CompTIA',
        url: 'https://www.comptia.org/certifications/security',
        note: '~50-60hrs, the industry-standard vendor-neutral baseline. Widely recognized by employers; DoD 8570.01-M approved.',
      },
      {
        name: 'Google Cybersecurity Certificate',
        by: 'Google (Coursera)',
        url: 'https://grow.google/certificates/cybersecurity/',
        note: '~6 months at 10hrs/week. No experience required. Coursera subscription pricing, not free.',
      },
      {
        name: 'Certified Junior Cybersecurity Associate (CJCA)',
        by: 'Hack The Box',
        url: 'https://academy.hackthebox.com/preview/certifications/htb-certified-junior-cybersecurity-associate',
        note: '~20-30hrs, hands-on exam in a live range. ~$490 (Silver Annual subscription includes one voucher).',
      },
    ],
  },
  {
    title: 'Career Path — Stage 1: Free Fundamentals (Weeks 1-11 @ 2hrs/day)',
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
        note: 'Elective, any week. Free, ~2-4hrs. Duplicate of the group above if already done.',
      },
      {
        name: 'AI Fundamentals',
        by: 'IBM SkillsBuild',
        url: 'https://skillsbuild.org',
        note: 'Elective, any week. Free. Duplicate of the group above if already done.',
      },
      {
        name: 'Intro to Deep Learning',
        by: 'Kaggle',
        url: 'https://www.kaggle.com/learn/intro-to-deep-learning',
        note: 'Elective, any week. Free, ~4hrs. Do "Intro to Machine Learning" (above group) first.',
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
        note: 'Elective, any week. Free self-paced badge path — different product from the paid Coursera "Google Cybersecurity Certificate" above.',
      },
    ],
  },
];

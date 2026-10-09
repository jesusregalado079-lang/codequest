// "Studies" — curated external study links, shown on the #/resources page.
// Each group credits where it came from. Add more groups over time.
export default [
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
];

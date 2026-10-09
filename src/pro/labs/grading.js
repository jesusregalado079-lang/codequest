const list = (value) => Array.isArray(value) ? value : [];
const normalize = (value) => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').toLowerCase() : '';

export function gradeMatch(set, picks) {
  const results = list(set?.snippets).map((snippet, i) => {
    const pick = list(picks)[i] ?? null;
    const answer = snippet?.answer;
    return { i, pick, answer, pass: answer !== undefined && pick === answer };
  });
  const passed = results.filter((result) => result.pass).length;
  return { results, passed, total: results.length, score: results.length ? Math.round(100 * passed / results.length) : 0 };
}

export function cliRespond(caseDef, input) {
  const command = normalize(input);
  if (!command) return '';
  const commands = list(caseDef?.commands);
  if (command === 'help') return `Commands you can run here:\n${commands.map((entry) => entry?.cmd || '').join('\n')}`;
  const match = commands.find((entry) => normalize(entry?.cmd) === command || list(entry?.aliases).some((alias) => normalize(alias) === command));
  if (match) return match.out;
  const word = command.split(' ')[0];
  return caseDef?.os === 'windows'
    ? `'${word}' is not recognized as an internal or external command.`
    : `${word}: command not found`;
}

export function gradeCli(caseDef, answers = {}) {
  const diagOk = caseDef?.diagnosis?.answer !== undefined && answers?.diagnosis === caseDef.diagnosis.answer;
  const fixOk = caseDef?.fix?.answer !== undefined && answers?.fix === caseDef.fix.answer;
  return { diagOk, fixOk, score: 50 * Number(diagOk) + 50 * Number(fixOk) };
}

export const PHISH_ACTIONS = [
  { id: 'report', text: 'Report it with the Report Phishing button and do not interact' },
  { id: 'verify', text: 'Check it through a known channel first (call the number on file, open the site yourself)' },
  { id: 'proceed', text: 'It is legitimate: go ahead as asked' },
  { id: 'reply', text: 'Reply to the sender and ask if it is real' },
];

export function phishSpotIds(caseDef) {
  const mail = caseDef?.mail || {};
  const ids = ['from', 'subject', 'auth'];
  if (mail.replyTo) ids.push('reply');
  if (mail.returnPath) ids.push('return');
  for (const paragraph of list(mail.body)) {
    for (const segment of list(paragraph)) if (segment && typeof segment === 'object' && typeof segment.spot === 'string') ids.push(segment.spot);
  }
  list(mail.attachments).forEach((_, i) => ids.push(`att-${i}`));
  return [...new Set(ids)];
}

export function gradePhish(caseDef, answers = {}) {
  if (!caseDef || typeof caseDef !== 'object') {
    return { verdictOk: false, actionOk: false, found: [], missed: [], falseFlags: [], score: 0 };
  }
  const spots = caseDef?.spots || {};
  const bad = Object.keys(spots).filter((id) => spots[id]?.bad === true);
  const flagged = new Set(list(answers?.flagged).filter((id) => typeof id === 'string'));
  const found = bad.filter((id) => flagged.has(id));
  const missed = bad.filter((id) => !flagged.has(id));
  const falseFlags = [...flagged].filter((id) => !bad.includes(id));
  const flagScore = Math.max(0, Math.min(1, bad.length
    ? (found.length - 0.5 * falseFlags.length) / bad.length
    : 1 - 0.5 * falseFlags.length));
  const verdictOk = caseDef?.verdict !== undefined && answers?.verdict === caseDef.verdict;
  const actionOk = caseDef?.action !== undefined && answers?.action === caseDef.action;
  return { verdictOk, actionOk, found, missed, falseFlags, score: Math.round(40 * Number(verdictOk) + 20 * Number(actionOk) + 40 * flagScore) };
}

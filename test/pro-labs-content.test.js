// CodeQuest Pro hands-on labs: every content file follows its rules. Firewall starting rules fail and the reference
// rules pass, code-lab solutions pass their own tests and starters do not, every phishing spot the page can show has a
// verdict, answers are spread, objectives are real SY0-801 ids, and samples use only fictional domains and safe IPs.
// Run: npm test
import assert from 'node:assert/strict';
import vm from 'node:vm';

const { blueprint } = await import('../src/pro/exam/secplus-801.js');
const fw = await import('../src/pro/labs/firewall.js');
const G = await import('../src/pro/labs/grading.js');
const files = {
  firewall: await import('../src/pro/labs/content/firewall-cases.js'),
  code: await import('../src/pro/labs/content/code-labs.js'),
  logs: await import('../src/pro/labs/content/log-sets.js'),
  cli: await import('../src/pro/labs/content/cli-cases.js'),
  phish: await import('../src/pro/labs/content/phish-cases.js'),
};

let checks = 0;
const failures = [];
const ok = (cond, msg) => { checks += 1; if (!cond) failures.push(msg); };
const OBJS = new Set(blueprint.domains.flatMap((d) => d.objectives.map((o) => o.id)));
const { BLUEPRINTS } = await import('../src/pro/exam/blueprints.js');
const EXAM_OBJS = Object.fromEntries(BLUEPRINTS.map((bp) => [bp.id, new Set(bp.domains.flatMap((d) => d.objectives.map((o) => o.id)))]));

// every string anywhere inside a value, with its path
function strings(v, path = '', out = []) {
  if (typeof v === 'string') out.push([path, v]);
  else if (Array.isArray(v)) v.forEach((x, i) => strings(x, `${path}[${i}]`, out));
  else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => strings(x, `${path}.${k}`, out));
  return out;
}

// Public IPs only from the documentation ranges; private, loopback, link-local, masks and 0.0.0.0 are fine.
function safeIp(ip) {
  const o = ip.split('.').map(Number);
  if (o.some((n) => n > 255)) return true; // not an address (e.g. a version string)
  const [a, b, c] = o;
  return a === 10 || a === 127 || a === 0 || a === 255 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)
    || (a === 169 && b === 254) || (a === 192 && b === 0 && c === 2) || (a === 198 && b === 51 && c === 100) || (a === 203 && b === 0 && c === 113)
    || a >= 224;
}

// shared rules for every file
for (const [name, mod] of Object.entries(files)) {
  const cases = mod.default;
  const sources = mod.sources;
  ok(Array.isArray(cases) && cases.length > 0, `${name}: default export is a non-empty array`);
  ok(sources && typeof sources === 'object', `${name}: exports sources`);
  Object.entries(sources).forEach(([k, v]) => {
    ok(/^[a-z0-9-]+$/.test(k), `${name}: source key ${k} is lowercase-hyphen`);
    ok(Array.isArray(v) && v.length === 2 && typeof v[0] === 'string' && /^https:\/\//.test(v[1]), `${name}: source ${k} is [title, https url]`);
    ok(!/wikipedia\.org|quizlet|examcompass|professormesser|dion/i.test(v[1]), `${name}: source ${k} is not a prep site or Wikipedia`);
  });
  const ids = new Set();
  let lastLevel = 0;
  cases.forEach((c) => {
    ok(typeof c.id === 'string' && !ids.has(c.id), `${name}: id ${c.id} unique`);
    ids.add(c.id);
    ok(/^[a-z]+-\d{2}$/.test(c.id), `${name}: id ${c.id} looks like xx-01`);
    ok([1, 2, 3].includes(c.level), `${c.id}: level 1 to 3`);
    ok(c.level >= lastLevel, `${c.id}: levels rise through the file`);
    lastLevel = c.level;
    ok(typeof c.title === 'string' && c.title.length > 2 && c.title.length <= 70, `${c.id}: title`);
    ok(Array.isArray(c.objs) && c.objs.length >= 1 && c.objs.every((o) => OBJS.has(o)), `${c.id}: objs are SY0-801 objective ids (${c.objs})`);
    if (c.examObjs !== undefined) {
      ok(c.examObjs && typeof c.examObjs === 'object' && !Array.isArray(c.examObjs), `${c.id}: examObjs is an object`);
      for (const [exam, list] of Object.entries(c.examObjs || {})) {
        ok(EXAM_OBJS[exam] && exam !== 'secplus-801', `${c.id}: examObjs key ${exam} is a non-Security+ exam id`);
        ok(Array.isArray(list) && list.length >= 1 && list.every((o) => EXAM_OBJS[exam]?.has(o)), `${c.id}: examObjs ${exam} are that exam's objective ids (${list})`);
      }
    }
    ok(Array.isArray(c.src) && c.src.length >= 1 && c.src.length <= 4 && c.src.every((k) => sources[k]), `${c.id}: src keys exist`);
    strings(c).forEach(([p, s]) => {
      ok(!/[–—]/.test(s), `${c.id}${p}: no em or en dash`);
      // code labs test address classifiers, so they need edge addresses such as 172.32.0.1 or 11.0.0.1
      if (name !== 'code') (s.match(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g) || []).forEach((ip) => ok(safeIp(ip), `${c.id}${p}: IP ${ip} is private or documentation-range`));
    });
  });
}

// prose fields carry no markup
const prose = (id, label, s) => ok(typeof s === 'string' && s.trim().length > 0 && !/<\/?[a-z][^>]*>/i.test(s) && !/\*\*|```/.test(s), `${id}: ${label} is plain text`);

// ---------- firewall ----------
const fwCases = files.firewall.default;
ok(fwCases.length === 12, `firewall: 12 cases (has ${fwCases.length})`);
fwCases.forEach((c) => {
  prose(c.id, 'brief', c.brief);
  prose(c.id, 'why', c.why);
  ok(Array.isArray(c.tasks) && c.tasks.length >= 2 && c.tasks.length <= 5, `${c.id}: 2 to 5 tasks`);
  c.tasks.forEach((t) => prose(c.id, 'task', t));
  const nodeIds = new Set(c.nodes.map((n) => n.id));
  ok(nodeIds.size === c.nodes.length, `${c.id}: node ids unique`);
  ok(c.nodes.filter((n) => n.kind === 'firewall').length === 1, `${c.id}: exactly one firewall`);
  ok(c.nodes.filter((n) => n.kind === 'internet').length >= 1, `${c.id}: an internet node`);
  c.nodes.forEach((n) => {
    ok(['internet', 'firewall', 'switch', 'server', 'db', 'pc', 'admin'].includes(n.kind), `${c.id}/${n.id}: known kind`);
    ok(n.x >= 0 && n.x <= 100 && n.y >= 0 && n.y <= 100, `${c.id}/${n.id}: x,y inside the box`);
    if (n.kind !== 'firewall' && n.kind !== 'switch') {
      ok(fw.parseIp(n.ip) !== null && typeof n.zone === 'string' && n.zone, `${c.id}/${n.id}: ip and zone`);
      if (n.kind !== 'internet') ok(fw.parseIp(n.mask) !== null && fw.parseIp(n.gw) !== null, `${c.id}/${n.id}: mask and gateway for ipconfig`);
    }
  });
  for (let i = 0; i < c.nodes.length; i += 1) for (let k = i + 1; k < c.nodes.length; k += 1) {
    const a = c.nodes[i]; const b = c.nodes[k];
    ok(Math.hypot(a.x - b.x, (a.y - b.y) * 0.5625) >= 9, `${c.id}: ${a.id} and ${b.id} are not on top of each other`);
  }
  c.links.forEach(([a, b]) => ok(nodeIds.has(a) && nodeIds.has(b), `${c.id}: link ${a}-${b} joins real nodes`));
  const ruleIds = new Set();
  [...c.rules, ...c.solution].forEach((r) => ok(fw.validateRule(r) === null, `${c.id}: rule ${JSON.stringify(r)} is valid`));
  c.rules.forEach((r) => { ok(!ruleIds.has(r.id), `${c.id}: rule id ${r.id} unique`); ruleIds.add(r.id); });
  ok(c.goals.length >= 3 && c.goals.length <= 7, `${c.id}: 3 to 7 goals`);
  ok(c.goals.some((g) => g.expect === 'deny'), `${c.id}: at least one deny goal`);
  c.goals.forEach((g) => {
    prose(c.id, 'goal text', g.text);
    const s = fw.nodeForIp(c, g.src); const d = fw.nodeForIp(c, g.dst);
    ok(s && d && s.zone !== d.zone, `${c.id}: goal "${g.text}" crosses the firewall`);
    ok(['tcp', 'udp', 'icmp'].includes(g.proto) && ['allow', 'deny'].includes(g.expect), `${c.id}: goal proto/expect`);
  });
  const start = fw.gradeFirewall(c, c.rules);
  ok(start.passed < start.total, `${c.id}: the starting rules fail at least one goal`);
  const end = fw.gradeFirewall(c, c.solution);
  ok(end.passed === end.total && end.score === 100, `${c.id}: the reference rules pass every goal (${end.passed}/${end.total})`);
});

// ---------- code labs (same concatenation as src/pro/engine/runner-worker.js) ----------
function runLab(userCode, tests) {
  const results = [];
  const ctx = { console: { log: () => {} } };
  ctx.assert = (cond, msg) => { if (!cond) throw new Error(msg ?? 'assertion failed'); };
  ctx.__cqReport = (i, pass, error) => { results[i] = { pass, error }; };
  vm.createContext(ctx);
  try { new Function(userCode); } catch (e) { return { userError: `syntax: ${e.message}`, passed: 0 }; }
  const parts = [userCode, ';'];
  tests.forEach((t, i) => parts.push(`try { ${t.code}\n; __cqReport(${i}, true); } catch (e) { __cqReport(${i}, false, String((e && e.message) || e)); }`));
  try { vm.runInContext(parts.join('\n'), ctx, { timeout: 2000 }); } catch (e) { return { userError: String(e), passed: 0 }; }
  const res = tests.map((t, i) => results[i] ?? { pass: false, error: 'not run' });
  return { passed: res.filter((r) => r.pass).length, res };
}
const codeLabs = files.code.default;
ok(codeLabs.length === 7, `code: 7 labs (has ${codeLabs.length})`);
codeLabs.forEach((c) => {
  prose(c.id, 'why', c.why);
  prose(c.id, 'hint', c.hint);
  ok(typeof c.brief === 'string' && c.brief.length > 20, `${c.id}: brief`);
  ok(c.tests.length >= 4 && c.tests.length <= 7, `${c.id}: 4 to 7 tests (has ${c.tests.length})`);
  ok(new Set(c.tests.map((t) => t.name)).size === c.tests.length, `${c.id}: test names unique`);
  c.tests.forEach((t) => ok(typeof t.code === 'string' && (() => { try { new Function(t.code); return true; } catch { return false; } })(), `${c.id}: test "${t.name}" parses`));
  const sol = runLab(c.solution, c.tests);
  ok(!sol.userError && sol.passed === c.tests.length, `${c.id}: the solution passes every test (${sol.passed}/${c.tests.length}${sol.userError ? ` ${sol.userError}` : ''}${sol.res ? ` ${JSON.stringify(sol.res.filter((r) => !r.pass))}` : ''})`);
  const st = runLab(c.starter, c.tests);
  ok(st.passed < c.tests.length, `${c.id}: the starter does not already pass`);
});

// ---------- log detective ----------
const sets = files.logs.default;
const LABELS = files.logs.LABELS;
ok(LABELS && Object.keys(LABELS).length >= 8, 'logs: LABELS exported');
ok(sets.length === 9, `logs: 9 sets (has ${sets.length})`);
sets.forEach((s) => {
  ok(s.labels.length >= 6 && s.labels.length <= 8 && new Set(s.labels).size === s.labels.length && s.labels.every((l) => LABELS[l]), `${s.id}: 6 to 8 known labels`);
  ok(s.snippets.length >= 4 && s.snippets.length <= 5, `${s.id}: 4 or 5 snippets`);
  ok(new Set(s.snippets.map((x) => x.answer)).size === s.snippets.length, `${s.id}: answers distinct`);
  s.snippets.forEach((x, i) => {
    ok(s.labels.includes(x.answer), `${s.id}#${i}: answer is one of the labels`);
    ok(x.lines.length >= 1 && x.lines.length <= 10 && x.lines.every((l) => typeof l === 'string' && l.length > 0 && l.length <= 170), `${s.id}#${i}: 1 to 10 lines under 170 chars`);
    prose(`${s.id}#${i}`, 'why', x.why);
    prose(`${s.id}#${i}`, 'source', x.source);
  });
  const g = G.gradeMatch(s, s.snippets.map((x) => x.answer));
  ok(g.score === 100, `${s.id}: right answers score 100`);
});

// ---------- terminal troubleshooter ----------
const cli = files.cli.default;
ok(cli.length === 12, `cli: 12 cases (has ${cli.length})`);
const positions = [0, 0, 0, 0];
let longest = 0;
cli.forEach((c) => {
  ok(['windows', 'linux'].includes(c.os), `${c.id}: os`);
  prose(c.id, 'symptom', c.symptom);
  ok(c.commands.length >= 4 && c.commands.length <= 7, `${c.id}: 4 to 7 commands (has ${c.commands.length})`);
  const seen = new Set();
  c.commands.forEach((cmd) => {
    [cmd.cmd, ...(cmd.aliases || [])].map((x) => x.trim().replace(/\s+/g, ' ').toLowerCase()).forEach((k) => { ok(!seen.has(k), `${c.id}: command "${k}" listed once`); seen.add(k); });
    ok(typeof cmd.out === 'string' && cmd.out.length > 0, `${c.id}: "${cmd.cmd}" has output`);
    ok(G.cliRespond(c, `  ${cmd.cmd.toUpperCase()}  `) === cmd.out, `${c.id}: cliRespond finds "${cmd.cmd}"`);
  });
  ['diagnosis', 'fix'].forEach((part) => {
    const q = c[part];
    ok(q.choices.length === 4 && new Set(q.choices).size === 4, `${c.id}.${part}: 4 distinct choices`);
    ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3, `${c.id}.${part}: answer 0 to 3`);
    const wrong = [0, 1, 2, 3].filter((i) => i !== q.answer).map(String).sort();
    ok(JSON.stringify(Object.keys(q.whyNot).sort()) === JSON.stringify(wrong), `${c.id}.${part}: whyNot for each wrong choice only`);
    prose(c.id, `${part}.why`, q.why);
    positions[q.answer] += 1;
    if (q.choices[q.answer].length >= Math.max(...q.choices.map((x) => x.length))) longest += 1;
    const others = q.choices.filter((x, i) => i !== q.answer).map((x) => x.length);
    ok(q.choices[q.answer].length <= 1.35 * Math.max(...others), `${c.id}.${part}: the answer is not much longer than the other choices (${q.choices[q.answer].length} vs ${Math.max(...others)})`);
  });
  ok(G.gradeCli(c, { diagnosis: c.diagnosis.answer, fix: c.fix.answer }).score === 100, `${c.id}: right answers score 100`);
});
ok(positions.every((n) => n >= 2), `cli: answer positions spread (${positions.join('/')})`);
ok(longest <= Math.ceil(cli.length * 2 * 0.3), `cli: the answer is not usually the longest (${longest} of ${cli.length * 2})`);

// ---------- phish inspector ----------
const phish = files.phish.default;
ok(phish.length === 12, `phish: 12 cases (has ${phish.length})`);
ok(phish.filter((c) => c.verdict === 'phish').length === 7 && phish.filter((c) => c.verdict === 'legit').length === 5, 'phish: 7 phishing + 5 legitimate');
ok(phish.some((c) => c.verdict === 'legit' && c.action === 'verify'), 'phish: a legitimate request that still needs verifying');
const ACTIONS = new Set(G.PHISH_ACTIONS.map((a) => a.id));
phish.forEach((c) => {
  ok(['phish', 'legit'].includes(c.verdict) && ACTIONS.has(c.action) && c.action !== 'reply', `${c.id}: verdict and action`);
  ok(c.verdict === 'legit' || c.action === 'report', `${c.id}: phishing is reported`);
  const m = c.mail;
  const domainOk = (addr) => /@[a-z0-9.-]+\.example$/i.test(addr);
  ok(domainOk(m.from.addr) && domainOk(m.to), `${c.id}: from/to use .example domains`);
  if (m.replyTo) ok(domainOk(m.replyTo), `${c.id}: reply-to uses a .example domain`);
  if (m.returnPath) ok(domainOk(m.returnPath), `${c.id}: return-path uses a .example domain`);
  m.body.flat().filter((seg) => seg && typeof seg === 'object' && seg.href).forEach((seg) => {
    let host = '';
    try { host = new URL(seg.href).hostname; } catch { /* checked below */ }
    ok(/\.example$/.test(host), `${c.id}: link ${seg.href} goes to a .example host`);
  });
  const ids = G.phishSpotIds(c);
  ok(ids.length === new Set(ids).size, `${c.id}: spot ids unique`);
  ids.forEach((id) => ok(c.spots[id] && typeof c.spots[id].bad === 'boolean', `${c.id}: spot ${id} has a verdict`));
  Object.keys(c.spots).forEach((id) => ok(ids.includes(id), `${c.id}: spot ${id} is shown on the page`));
  Object.values(c.spots).forEach((s) => prose(c.id, 'spot why', s.why));
  const bad = ids.filter((id) => c.spots[id].bad);
  ok(c.verdict === 'legit' ? bad.length <= 1 : bad.length >= 2, `${c.id}: ${bad.length} suspicious spots fits the verdict`);
  ok(G.gradePhish(c, { flagged: bad, verdict: c.verdict, action: c.action }).score === 100, `${c.id}: a perfect answer scores 100`);
  prose(c.id, 'why', c.why);
});

assert.ok(failures.length === 0, `${failures.length} content problems:\n${failures.join('\n')}`);
console.log(`ok — pro labs content: ${checks} checks (firewall rules solvable, code solutions pass, every phishing spot judged, fictional domains and safe IPs)`);

import assert from 'node:assert/strict';

const L = await import('../src/pro/labs/lab-logic.js');
const F = await import('../src/pro/labs/firewall.js');
const S = await import('../src/pro/labs/subnet.js');
const G = await import('../src/pro/labs/grading.js');

const mulberry32 = (seed) => () => {
  seed += 0x6d2b79f5;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Saved runs and damaged storage.
assert.equal(L.PASS, 80);
assert.equal(L.RUNS_CAP, 10);
assert.deepEqual(L.emptyLabs(), {});
for (const bad of [null, undefined, '', 4, NaN, [], ['x']]) assert.deepEqual(L.normalizeLabs(bad), {});
const damaged = JSON.parse('{"fw/ok":[{"t":3,"score":80,"secs":1},{"t":1,"score":100,"secs":0},{"t":"2","score":80,"secs":1},{"t":4,"score":null,"secs":1},{"t":5,"score":80,"secs":86401}],"constructor/x":[{"t":1,"score":1,"secs":1}],"__proto__/x":[{"t":1,"score":1,"secs":1}],"x/y":{}}');
assert.deepEqual(L.normalizeLabs(damaged), { 'fw/ok': [{ t: 1, score: 100, secs: 0 }, { t: 3, score: 80, secs: 1 }] });
for (const id of ['A/b', 'a_b/c', 'a/b/c', 'a/', '/b', 'constructor/x', 'prototype/x', 'a/constructor', `${'a'.repeat(79)}/b`]) {
  assert.deepEqual(L.recordRun({}, id, { t: 1, score: 90, secs: 1 }), {});
}
for (const run of [{ t: 0, score: 1, secs: 1 }, { t: NaN, score: 1, secs: 1 }, { t: 1.2, score: 1, secs: 1 }, { t: 1, score: 101, secs: 1 }, { t: 1, score: -1, secs: 1 }, { t: 1, score: 2.5, secs: 1 }, { t: 1, score: 1, secs: -1 }, { t: 1, score: 1, secs: Infinity }, { t: 1, score: 1, secs: 86401 }, null]) {
  assert.deepEqual(L.recordRun({}, 'fw/ok', run), {});
}
const huge = Array(1_000_000);
huge[0] = { t: 1, score: 1, secs: 1 };
huge[999_999] = { t: 2, score: 2, secs: 2 };
assert.equal(L.normalizeLabs({ 'fw/ok': huge })['fw/ok'].length, 2);
const sparse = [];
sparse.length = 0xffffffff;
sparse[0xfffffffe] = { t: 9, score: 90, secs: 9 };
assert.deepEqual(L.normalizeLabs({ 'fw/ok': sparse })['fw/ok'], [{ t: 9, score: 90, secs: 9 }]);
assert.deepEqual(L.recordRun({}, 'fw/ok', { t: null, score: 90, secs: 1 }), {});
const many = Array.from({ length: 30 }, (_, i) => ({ t: 30 - i, score: i, secs: i }));
assert.deepEqual(L.normalizeLabs({ 'fw/ok': many })['fw/ok'].map((run) => run.t), [1, 22, 23, 24, 25, 26, 27, 28, 29, 30]);
const bestFirst = { t: 1, score: 100, secs: 1 };
const lowerRuns = Array.from({ length: 10 }, (_, i) => ({ t: i + 2, score: 40, secs: 1 }));
const allRuns = [bestFirst, ...lowerRuns];
let retried = {};
for (const run of allRuns) retried = L.recordRun(retried, 'fw/ok', run);
assert.equal(L.bestScore(retried, 'fw/ok'), 100);
assert.equal(L.isPassed(retried, 'fw/ok'), true);
assert.equal(retried['fw/ok'].length, L.RUNS_CAP);
assert.deepEqual(retried['fw/ok'].map((run) => run.t), [1, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
const mergedRetries = L.mergeLabs({ 'fw/ok': allRuns.slice(0, 6) }, { 'fw/ok': allRuns.slice(6) });
assert.deepEqual(mergedRetries, retried);
assert.equal(L.bestScore(mergedRetries, 'fw/ok'), 100);
assert.equal(L.isPassed(mergedRetries, 'fw/ok'), true);
const rawRuns = [bestFirst, ...Array.from({ length: 14 }, (_, i) => ({ t: i + 2, score: 40, secs: 1 }))];
const normalizedRetries = L.normalizeLabs({ 'fw/ok': rawRuns });
assert.deepEqual(normalizedRetries['fw/ok'].map((run) => run.t), [1, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
assert.equal(L.bestScore(normalizedRetries, 'fw/ok'), 100);
assert.equal(L.isPassed(normalizedRetries, 'fw/ok'), true);
assert.deepEqual(L.normalizeLabs(normalizedRetries), normalizedRetries);
const tiedBest = L.normalizeLabs({ 'fw/ok': [bestFirst, { t: 2, score: 100, secs: 2 }, ...rawRuns.slice(2)] });
assert.deepEqual(tiedBest['fw/ok'].map((run) => run.t), [1, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
const initial = { 'fw/ok': [{ t: 1, score: 80, secs: 4 }] };
const next = L.recordRun(initial, 'fw/ok', { t: 2, score: 100, secs: 5 });
assert.deepEqual(initial, { 'fw/ok': [{ t: 1, score: 80, secs: 4 }] });
assert.notEqual(next, initial);
assert.equal(L.bestScore(next, 'fw/ok'), 100);
assert.equal(L.bestScore(next, 'fw/missing'), null);
assert.equal(L.bestScore(next, 'constructor'), null);
assert.equal(L.isPassed(next, 'constructor'), false);
assert.equal(L.isPassed(next, 'fw/ok'), true);
assert.equal(L.isPassed(next, 'fw/ok', 101), false);
const merged = L.mergeLabs(initial, { 'fw/ok': [{ t: 1, score: 80, secs: 99 }, { t: 2, score: 70, secs: 5 }], 'cli/one': [{ t: 3, score: 60, secs: 9 }] });
assert.equal(merged['fw/ok'].length, 2);
assert.equal(merged['fw/ok'][0].secs, 4);
assert.equal(merged['cli/one'].length, 1);
assert.deepEqual(L.mergeLabs(null, 'bad'), {});
const summary = L.labSummary(merged, [{ id: 'fw', name: 'Firewall', icon: 'f', cases: [{ id: 'ok' }, { id: 'next' }] }, { id: 'cli', name: 'Terminal', icon: 'c', pass: 100, cases: [{ id: 'one' }] }]);
assert.deepEqual([summary.total, summary.passed, summary.perfect, summary.attempted, summary.runs], [3, 1, 0, 2, 3]);
assert.equal(summary.perLab[0].nextCaseId, 'next');
assert.equal(summary.perLab[1].nextCaseId, 'one');
assert.deepEqual(summary.recent.map((r) => r.t), [3, 2, 1]);
assert.deepEqual(summary.recent[0], { itemId: 'cli/one', labId: 'cli', caseId: 'one', score: 60, t: 3 });
assert.deepEqual(L.labSummary(null, []), { total: 0, passed: 0, perfect: 0, attempted: 0, runs: 0, perLab: [], recent: [] });

// Firewall parsing, matching, routes, and terminal output.
assert.equal(F.parseIp('10.0.1.10'), 167772426);
assert.equal(F.formatIp(167772426), '10.0.1.10');
assert.equal(F.parseIp('255.255.255.255'), 0xffffffff);
assert.equal(F.formatIp(0), '0.0.0.0');
for (const ip of ['', '1.2.3', '1.2.3.4.5', '256.1.1.1', '-1.2.3.4', '+1.2.3.4', ' 1.2.3.4', '1.2.3.4 ', 'a.b.c.d', null, 10]) assert.equal(F.parseIp(ip), null);
assert.equal(F.formatIp(-1), null);
assert.equal(F.formatIp(2 ** 32), null);
assert.deepEqual(F.parseCidr('any'), { base: 0, bits: 0 });
assert.deepEqual(F.parseCidr('10.0.1.10'), { base: 167772426, bits: 32 });
assert.deepEqual(F.parseCidr('10.0.1.10/24'), { base: 167772416, bits: 24 });
assert.deepEqual(F.parseCidr('10.0.1.10/0'), { base: 0, bits: 0 });
for (const cidr of ['10.0.0.1/33', '10.0.0.1/-1', 'any/0', '1.2.3.256/24', ' 10.0.0.1', null]) assert.equal(F.parseCidr(cidr), null);
assert.equal(F.addrMatches('10.0.1.0/24', '10.0.1.255'), true);
assert.equal(F.addrMatches('10.0.1.0/24', '10.0.2.1'), false);
assert.equal(F.addrMatches('any', '203.0.113.1'), true);
assert.equal(F.addrMatches('invalid', '203.0.113.1'), false);
assert.deepEqual(F.parsePorts('any'), [[0, 65535]]);
assert.deepEqual(F.parsePorts('22,8000-8100'), [[22, 22], [8000, 8100]]);
assert.deepEqual(F.parsePorts('0,65535'), [[0, 0], [65535, 65535]]);
for (const port of ['', '65536', '10-9', '-1', '22,', '1-65536', 'abc', null]) assert.equal(F.parsePorts(port), null);
assert.equal(F.portMatches('22,8000-8100', 8050), true);
assert.equal(F.portMatches('22,8000-8100', 23), false);
assert.equal(F.portMatches('any', null), false);
const allowWeb = { id: 'r1', action: 'allow', src: 'any', dst: '10.0.1.10', proto: 'tcp', port: '443' };
const denyWeb = { ...allowWeb, action: 'deny' };
assert.equal(F.validateRule(allowWeb), null);
for (const rule of [null, {}, { ...allowWeb, action: 'drop' }, { ...allowWeb, src: 'x' }, { ...allowWeb, dst: 'x' }, { ...allowWeb, proto: 'sctp' }, { ...allowWeb, port: '65536' }, { ...allowWeb, proto: 'icmp', port: '443' }]) assert.equal(typeof F.validateRule(rule), 'string');
const webFlow = { src: '203.0.113.50', dst: '10.0.1.10', proto: 'tcp', port: 443 };
assert.equal(F.ruleMatches(allowWeb, webFlow), true);
assert.equal(F.ruleMatches(allowWeb, { ...webFlow, port: 80 }), false);
assert.equal(F.ruleMatches({ ...allowWeb, proto: 'any' }, webFlow), true);
assert.equal(F.ruleMatches({ ...allowWeb, proto: 'icmp', port: 'any' }, { ...webFlow, proto: 'icmp', port: null }), true);
assert.equal(F.ruleMatches({ ...allowWeb, port: 'bad' }, webFlow), false);
assert.deepEqual(F.evaluate([denyWeb, allowWeb], webFlow), { action: 'deny', index: 0 });
assert.deepEqual(F.evaluate([{ ...allowWeb, port: 'bad' }, allowWeb], webFlow), { action: 'allow', index: 1 });
assert.deepEqual(F.evaluate([], webFlow), { action: 'deny', index: -1 });
const fwCase = {
  nodes: [
    { id: 'inet', kind: 'internet', label: 'Outside', ip: '203.0.113.50', zone: 'outside' },
    { id: 'fw', kind: 'firewall', label: 'EDGE', zone: null },
    { id: 'web', kind: 'server', ip: '10.0.1.10', mask: '255.255.255.0', gw: '10.0.1.1', zone: 'dmz' },
    { id: 'db', kind: 'db', ip: '10.0.2.20', zone: 'inside' },
    { id: 'pc', kind: 'pc', ip: '10.0.2.50', zone: 'inside' },
  ],
  goals: [
    { text: 'Web', ...webFlow, expect: 'allow' },
    { text: 'Database', ...webFlow, dst: '10.0.2.20', port: 1433, expect: 'deny' },
  ],
};
assert.equal(F.nodeForIp(fwCase, '10.0.1.10').id, 'web');
assert.equal(F.nodeForIp(fwCase, '198.51.100.7').id, 'inet');
assert.equal(F.nodeForIp(fwCase, '10.0.9.9'), null);
assert.equal(F.nodeForIp(fwCase, '172.31.2.1'), null);
assert.equal(F.nodeForIp(fwCase, '172.32.2.1').id, 'inet');
assert.deepEqual(F.routeFlow(fwCase, [], { ...webFlow, src: '10.0.2.50', dst: '10.0.2.20' }), { action: 'allow', index: -1, via: 'switch' });
assert.deepEqual(F.routeFlow(fwCase, [allowWeb], webFlow), { action: 'allow', index: 0, via: 'firewall' });
assert.deepEqual(F.routeFlow(fwCase, [], { ...webFlow, dst: '10.0.9.9' }), { action: 'nohost', index: -1, via: 'firewall' });
assert.deepEqual(F.gradeFirewall(fwCase, [allowWeb]), { results: [
  { text: 'Web', expect: 'allow', got: 'allow', pass: true, index: 0 },
  { text: 'Database', expect: 'deny', got: 'deny', pass: true, index: -1 },
], passed: 2, total: 2, score: 100 });
assert.equal(F.gradeFirewall(fwCase, [denyWeb]).score, 50);
assert.match(F.simulate(fwCase, [allowWeb], 'web', '  IPconfig  '), /IPv4 Address: 10\.0\.1\.10\nSubnet Mask: 255\.255\.255\.0\nDefault Gateway: 10\.0\.1\.1/);
assert.equal(F.simulate(fwCase, [], 'inet', 'ifconfig'), 'This is the outside test host 203.0.113.50.');
assert.match(F.simulate(fwCase, [], 'web', 'ip a'), /10\.0\.1\.10/);
assert.match(F.simulate(fwCase, [], 'inet', 'help'), /nc -zvu/);
const pingOk = F.simulate(fwCase, [{ ...allowWeb, proto: 'icmp', port: 'any' }], 'inet', 'ping 10.0.1.10');
assert.equal((pingOk.match(/Reply from/g) || []).length, 4);
assert.match(pingOk, /Sent = 4, Received = 4, Lost = 0 \(0% loss\)/);
const pingBlocked = F.simulate(fwCase, [], 'inet', 'ping 10.0.1.10');
assert.equal((pingBlocked.match(/Request timed out\./g) || []).length, 4);
assert.match(pingBlocked, /Lost = 4 \(100% loss\)/);
assert.equal(F.simulate(fwCase, [], 'inet', 'ping 10.0.9.9'), 'Destination host unreachable.');
assert.equal(F.simulate(fwCase, [allowWeb], 'inet', 'nc -zv 10.0.1.10 443'), 'Connection to 10.0.1.10 443 port [tcp/https] succeeded!');
assert.equal(F.simulate(fwCase, [], 'inet', 'nc -zv 10.0.1.10 443'), 'nc: connect to 10.0.1.10 port 443 (tcp) failed: Connection timed out');
assert.match(F.simulate(fwCase, [{ ...allowWeb, proto: 'udp', port: '53' }], 'inet', 'nc -zvu 10.0.1.10 53'), /\[udp\/domain\] succeeded!/);
assert.equal(F.simulate(fwCase, [allowWeb], 'inet', 'tnc 10.0.1.10 -port 443'), 'ComputerName : 10.0.1.10\nRemotePort : 443\nTcpTestSucceeded : True');
assert.match(F.simulate(fwCase, [], 'inet', 'tnc 10.0.1.10 -port 443'), /TcpTestSucceeded : False$/);
assert.match(F.simulate(fwCase, [allowWeb], 'inet', 'nc -zv 10.0.1.10 443', { trace: true }), /\[trace\] EDGE rule 1 \(allow tcp any -> 10\.0\.1\.10:443\)$/);
assert.match(F.simulate(fwCase, [], 'inet', 'nc -zv 10.0.1.10 443', { trace: true }), /\[trace\] EDGE no rule matched: implicit deny$/);
assert.match(F.simulate(fwCase, [], 'pc', 'ping 10.0.2.20', { trace: true }), /\[trace\] same zone, switched directly$/);
assert.equal(F.simulate(fwCase, [], 'inet', 'curl 10.0.1.10'), "'curl' is not a command here. Type help.");

// Independent subnet math uses arithmetic on octets, not engine helpers.
const asNumber = (ip) => ip.split('.').reduce((n, octet) => n * 256 + Number(octet), 0);
const asIp = (n) => [24, 16, 8, 0].map((shift) => Math.floor(n / 2 ** shift) % 256).join('.');
const expected = (ip, bits) => {
  const size = 2 ** (32 - bits);
  const network = Math.floor(asNumber(ip) / size) * size;
  return { network: asIp(network), broadcast: asIp(network + size - 1), first: asIp(network + 1), last: asIp(network + size - 2), hosts: size - 2 };
};
assert.equal(S.LEVELS.length, 4);
assert.deepEqual(S.LEVELS.map((level) => level.id), ['subnet-1', 'subnet-2', 'subnet-3', 'subnet-4']);
for (const [ip, bits, network, broadcast, first, last] of [
  ['10.1.77.9', 16, '10.1.0.0', '10.1.255.255', '10.1.0.1', '10.1.255.254'],
  ['172.16.200.9', 17, '172.16.128.0', '172.16.255.255', '172.16.128.1', '172.16.255.254'],
  ['172.31.17.9', 23, '172.31.16.0', '172.31.17.255', '172.31.16.1', '172.31.17.254'],
  ['192.168.2.129', 25, '192.168.2.128', '192.168.2.255', '192.168.2.129', '192.168.2.254'],
  ['10.0.0.6', 30, '10.0.0.4', '10.0.0.7', '10.0.0.5', '10.0.0.6'],
]) {
  assert.equal(S.networkOf(ip, bits), network);
  assert.equal(S.broadcastOf(ip, bits), broadcast);
  assert.equal(S.firstHost(ip, bits), first);
  assert.equal(S.lastHost(ip, bits), last);
  assert.deepEqual(expected(ip, bits), { network, broadcast, first, last, hosts: 2 ** (32 - bits) - 2 });
}
for (const bits of [0, 16, 17, 23, 24, 25, 27, 30, 31, 32]) assert.equal(S.cidrFromMask(S.maskFromCidr(bits)), bits);
assert.equal(S.cidrFromMask('255.0.255.0'), null);
assert.equal(S.maskFromCidr(33), null);
assert.equal(S.usableHosts(30), 2);
assert.equal(S.usableHosts(31), 0);
assert.equal(S.usableHosts(32), 0);
for (const [hosts, bits] of [[2, 30], [3, 29], [30, 27], [254, 24], [255, 23], [4000, 20]]) assert.equal(S.cidrForHosts(hosts), bits);
assert.equal(S.cidrForHosts(0), null);
const q = S.makeQuestion('subnet-2', mulberry32(11));
assert.ok(S.LEVELS[1].kinds.includes(q.kind));
assert.equal(S.checkAnswer(q, ` ${q.answer} `), true);
assert.equal(S.checkAnswer(q, 'wrong'), false);
assert.equal(S.checkAnswer({ answer: '27', input: 'cidr' }, ' /27 '), true);
assert.equal(S.checkAnswer({ answer: 'yes', input: 'yesno' }, 'Y'), true);
assert.equal(S.checkAnswer({ answer: 'no', input: 'yesno' }, 'nO'), true);
assert.equal(S.checkAnswer({ answer: '4,094', input: 'number' }, '4094'), false);
assert.equal(S.checkAnswer({ answer: '4094', input: 'number' }, '4,094'), true);
assert.equal(S.checkAnswer(null, ''), false);
for (const level of S.LEVELS) {
  const round = S.makeRound(level.id, 10, mulberry32(42));
  assert.equal(round.length, 10);
  assert.equal(new Set(round.map((item) => item.prompt)).size, 10);
  assert.ok(level.kinds.every((kind) => round.some((item) => item.kind === kind)));
  assert.deepEqual(S.makeRound(level.id, 10, mulberry32(42)), round);
  const spread = S.makeRound(level.id, level.kinds.length * 3 + 2, mulberry32(73));
  const counts = level.kinds.map((kind) => spread.filter((item) => item.kind === kind).length);
  assert.ok(counts.every((count) => count === 3 || count === 4));
}
const shuffledKinds = S.makeRound('subnet-4', 18, mulberry32(42)).map((item) => item.kind);
assert.notDeepEqual(shuffledKinds, Array.from({ length: 18 }, (_, i) => S.LEVELS[3].kinds[i % S.LEVELS[3].kinds.length]));
for (const [levelId, bits] of [['subnet-3', 16], ['subnet-4', 24]]) {
  const rng = mulberry32(bits);
  let boundaryQuestion;
  for (let i = 0; i < 1000 && !boundaryQuestion; i += 1) {
    const item = S.makeQuestion(levelId, rng);
    if (item.bits === bits && ['network', 'broadcast', 'first', 'last', 'same'].includes(item.kind)) boundaryQuestion = item;
  }
  assert.ok(boundaryQuestion);
  const { ip, explain } = boundaryQuestion;
  assert.ok(explain.includes(`/${bits} ends on an octet boundary: keep the first ${bits / 8} octets and zero the rest for the network (${S.networkOf(ip, bits)}); set the rest to 255 for the broadcast (${S.broadcastOf(ip, bits)}).`));
  assert.doesNotMatch(explain, /block of 1 in the/);
}
for (const [levelId, place] of [['subnet-3', 'third'], ['subnet-2', 'fourth']]) {
  const item = S.makeRound(levelId, 20, mulberry32(16)).find((question) => question.bits % 8 !== 0 && ['network', 'broadcast', 'first', 'last'].includes(question.kind));
  assert.match(item.explain, new RegExp(`block of \\d+ in the ${place} octet`));
}
const sameSeed = S.makeQuestion('subnet-4', mulberry32(285));
assert.equal(sameSeed.kind, 'same');
assert.equal(sameSeed.answer, 'yes');
const sameAddresses = sameSeed.prompt.match(/(?:\d{1,3}\.){3}\d{1,3}/g);
assert.notEqual(sameAddresses[0], sameAddresses[1]);
assert.equal(expected(sameAddresses[0], sameSeed.bits).network, expected(sameAddresses[1], sameSeed.bits).network);
for (const level of S.LEVELS) {
  const rng = mulberry32(100 + Number(level.id.at(-1)));
  for (let i = 0; i < 2000; i += 1) {
    const item = S.makeQuestion(level.id, rng);
    assert.ok(level.kinds.includes(item.kind));
    assert.equal(S.checkAnswer(item, item.answer), true);
    assert.ok(item.explain.includes('block') || item.explain.includes('prefix') || item.explain.includes('octet boundary'));
    if (item.ip) {
      const octets = item.ip.split('.').map(Number);
      assert.ok(octets[0] === 10 || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) || (octets[0] === 192 && octets[1] === 168));
    }
    if (['network', 'broadcast', 'first', 'last'].includes(item.kind)) {
      assert.equal(item.answer, expected(item.ip, item.bits)[item.kind]);
      assert.notEqual(item.answer, item.ip);
    } else if (item.kind === 'hosts') assert.equal(Number(item.answer), 2 ** (32 - item.bits) - 2);
    else if (item.kind === 'mask') assert.equal(item.answer, asIp(2 ** 32 - 2 ** (32 - item.bits)));
    else if (item.kind === 'cidr') assert.equal(item.answer, String(item.bits));
    else if (item.kind === 'fit') {
      const need = Number(item.prompt.match(/at least (\d+)/)[1]);
      assert.ok(2 ** (32 - Number(item.answer)) - 2 >= need);
      assert.ok(2 ** (31 - Number(item.answer)) - 2 < need);
    } else if (item.kind === 'same') {
      const addresses = item.prompt.match(/(?:\d{1,3}\.){3}\d{1,3}/g);
      if (item.answer === 'yes') assert.notEqual(addresses[0], addresses[1]);
      const a = expected(addresses[0], item.bits).network;
      const b = expected(addresses[1], item.bits).network;
      assert.equal(item.answer, a === b ? 'yes' : 'no');
    }
  }
}

// Matching, terminal diagnosis, and phishing scoring.
const logs = { snippets: [{ answer: 'brute-force' }, { answer: 'sqli' }, { answer: 'beaconing' }] };
assert.deepEqual(G.gradeMatch(logs, ['brute-force', 'x', 'beaconing']), { results: [
  { i: 0, pick: 'brute-force', answer: 'brute-force', pass: true },
  { i: 1, pick: 'x', answer: 'sqli', pass: false },
  { i: 2, pick: 'beaconing', answer: 'beaconing', pass: true },
], passed: 2, total: 3, score: 67 });
assert.equal(G.gradeMatch(logs, []).score, 0);
assert.equal(G.gradeMatch({}, []).total, 0);
const cli = { os: 'windows', commands: [{ cmd: 'ipconfig /all', aliases: ['ipconfig'], out: 'IPv4: 10.0.0.2' }, { cmd: 'ping 10.0.0.1', aliases: [], out: 'Reply' }], diagnosis: { answer: 2 }, fix: { answer: 0 } };
assert.equal(G.cliRespond(cli, '  IPconfig   /ALL  '), 'IPv4: 10.0.0.2');
assert.equal(G.cliRespond(cli, 'ipconfig'), 'IPv4: 10.0.0.2');
assert.equal(G.cliRespond(cli, 'help'), 'Commands you can run here:\nipconfig /all\nping 10.0.0.1');
assert.equal(G.cliRespond(cli, '  '), '');
assert.equal(G.cliRespond(cli, 'whoami /all'), "'whoami' is not recognized as an internal or external command.");
assert.equal(G.cliRespond({ ...cli, os: 'linux' }, 'WHOAMI'), 'whoami: command not found');
assert.deepEqual(G.gradeCli(cli, { diagnosis: 2, fix: 0 }), { diagOk: true, fixOk: true, score: 100 });
assert.deepEqual(G.gradeCli(cli, { diagnosis: 1, fix: 0 }), { diagOk: false, fixOk: true, score: 50 });
assert.deepEqual(G.gradeCli(cli, {}), { diagOk: false, fixOk: false, score: 0 });
assert.deepEqual(G.PHISH_ACTIONS.map((action) => action.id), ['report', 'verify', 'proceed', 'reply']);
const phish = {
  verdict: 'phish', action: 'report',
  mail: { replyTo: 'other@example.example', returnPath: 'bounce@example.example', body: [['Text', { spot: 'link-1', text: 'Open', href: 'https://bad.example' }], [{ spot: 'urgent', text: 'Now' }]], attachments: [{ name: 'a.exe' }] },
  spots: { from: { bad: true }, subject: { bad: false }, auth: { bad: true }, reply: { bad: true }, return: { bad: false }, 'link-1': { bad: true }, urgent: { bad: false }, 'att-0': { bad: true } },
};
assert.deepEqual(G.phishSpotIds(phish), ['from', 'subject', 'auth', 'reply', 'return', 'link-1', 'urgent', 'att-0']);
assert.deepEqual(G.phishSpotIds({ mail: {} }), ['from', 'subject', 'auth']);
const phishScore = G.gradePhish(phish, { flagged: ['from', 'auth', 'subject'], verdict: 'phish', action: 'report' });
assert.deepEqual(phishScore.found, ['from', 'auth']);
assert.deepEqual(phishScore.missed, ['reply', 'link-1', 'att-0']);
assert.deepEqual(phishScore.falseFlags, ['subject']);
assert.equal(phishScore.score, 72);
assert.equal(G.gradePhish(phish, { flagged: ['from', 'auth', 'reply', 'link-1', 'att-0'], verdict: 'phish', action: 'report' }).score, 100);
assert.equal(G.gradePhish(phish, { flagged: ['subject', 'return', 'urgent'], verdict: 'legit', action: 'reply' }).score, 0);
const legit = { verdict: 'legit', action: 'verify', mail: {}, spots: { from: { bad: false }, subject: { bad: false }, auth: { bad: false } } };
assert.equal(G.gradePhish(legit, { flagged: [], verdict: 'legit', action: 'verify' }).score, 100);
assert.equal(G.gradePhish(legit, { flagged: ['from'], verdict: 'legit', action: 'verify' }).score, 80);
assert.equal(G.gradePhish(legit, { flagged: ['from', 'subject', 'auth'], verdict: 'legit', action: 'verify' }).score, 60);
assert.equal(G.gradePhish(legit, { flagged: ['from', 'from'], verdict: 'legit', action: 'verify' }).score, 80);
assert.equal(G.gradePhish(null, null).score, 0);

console.log('ok — pro labs engines: saved runs, firewall routing and terminal, subnet drills, grading, damaged input');

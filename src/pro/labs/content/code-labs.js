export const sources = {
  guessing: ['MITRE ATT&CK T1110.001: Password Guessing', 'https://attack.mitre.org/techniques/T1110/001/'],
  spraying: ['MITRE ATT&CK T1110.003: Password Spraying', 'https://attack.mitre.org/techniques/T1110/003/'],
  private: ['RFC 1918: Address Allocation for Private Internets', 'https://www.rfc-editor.org/rfc/rfc1918'],
  loopback: ['RFC 1122: Requirements for Internet Hosts, Communication Layers', 'https://www.rfc-editor.org/rfc/rfc1122'],
  firewall: ['NIST SP 800-41 Rev. 1: Guidelines on Firewalls and Firewall Policy', 'https://csrc.nist.gov/pubs/sp/800/41/r1/final'],
  beacon: ['MITRE ATT&CK T1071.001: Web Protocols', 'https://attack.mitre.org/techniques/T1071/001/'],
  dhcp: ['RFC 2131: Dynamic Host Configuration Protocol', 'https://www.rfc-editor.org/rfc/rfc2131'],
  'dhcp-attack': ['MITRE ATT&CK T1557.003: DHCP Spoofing', 'https://attack.mitre.org/techniques/T1557/003/'],
  scanning: ['MITRE ATT&CK T1595.001: Scanning IP Blocks', 'https://attack.mitre.org/techniques/T1595/001/'],
};

export default [
  {
    id: 'code-01', level: 1, title: 'Count SSH password failures', objs: ['4.4', '4.8'], examObjs: { 'netplus-009': ['3.2'] },
    brief: 'Write findBruteForce(lines, limit). Each input line is an SSH authentication log entry. Count only lines containing Failed password, by source IP. Return IPs with at least limit failures as an array sorted as text (the default JavaScript sort()). A line such as "sshd[91]: Failed password for ana from 198.51.100.23 port 51122 ssh2" with limit 1 returns ["198.51.100.23"]. Lines for invalid users also count.',
    starter: `function findBruteForce(lines, limit) {
  return [];
}
`,
    tests: [
      { name: 'flags an IP at the exact failure limit', code: `{ const lines = ['sshd[1]: Failed password for ana from 198.51.100.23 port 51122 ssh2', 'sshd[2]: Failed password for ana from 198.51.100.23 port 51123 ssh2', 'sshd[3]: Failed password for ana from 198.51.100.23 port 51124 ssh2']; assert(JSON.stringify(findBruteForce(lines, 3)) === JSON.stringify(['198.51.100.23']), 'three failures should meet limit three'); }` },
      { name: 'ignores accepted logins', code: `{ const lines = ['sshd[1]: Accepted password for ana from 192.0.2.5 port 51122 ssh2', 'sshd[2]: Failed password for ana from 192.0.2.5 port 51123 ssh2']; assert(findBruteForce(lines, 2).length === 0, 'accepted logins do not count'); }` },
      { name: 'counts invalid user failures', code: `{ const lines = ['sshd[1]: Failed password for invalid user guest from 203.0.113.8 port 53000 ssh2']; assert(JSON.stringify(findBruteForce(lines, 1)) === JSON.stringify(['203.0.113.8']), 'invalid user failure should count'); }` },
      { name: 'keeps sources separate and sorts the result', code: `{ const lines = ['Failed password for a from 203.0.113.9 port 1 ssh2', 'Failed password for b from 198.51.100.2 port 2 ssh2', 'Failed password for c from 203.0.113.9 port 3 ssh2', 'Failed password for d from 198.51.100.2 port 4 ssh2', 'Failed password for e from 192.0.2.4 port 5 ssh2']; assert(JSON.stringify(findBruteForce(lines, 2)) === JSON.stringify(['198.51.100.2', '203.0.113.9']), 'only two qualifying sources, sorted'); }` },
      { name: 'returns an empty array for no failures', code: `{ assert(JSON.stringify(findBruteForce([], 1)) === '[]', 'empty input yields empty array'); }` },
    ],
    hint: 'Look for Failed password and capture the address after from. Keep one count per address.',
    solution: String.raw`function findBruteForce(lines, limit) {
  const counts = new Map();
  for (const line of lines) {
    const match = /Failed password for (?:invalid user )?\S+ from (\d{1,3}(?:\.\d{1,3}){3}) port\b/.exec(line);
    if (match) counts.set(match[1], (counts.get(match[1]) || 0) + 1);
  }
  return [...counts.keys()].filter(ip => counts.get(ip) >= limit).sort();
}
`,
    why: 'Repeated failed authentication from one source can indicate password guessing. Security+ may present this as a log aggregation or SIEM alerting task. This simple count has no time window and may miss slow or distributed guessing, so a real alert needs more context.',
    src: ['guessing'],
  },
  {
    id: 'code-02', level: 2, title: 'Spot attempts across accounts', objs: ['2.5', '4.4', '4.8'], examObjs: { 'netplus-009': ['3.2'] },
    brief: 'Write findSprayers(lines, minUsers). Read SSH Failed password lines in the same format as the prior lab. Return a sorted array of source IPs that failed against at least minUsers distinct user names. Repeated attempts against one user count once. Both "for ana from" and "for invalid user ana from" are valid failure forms. Example: two failures against ana from 192.0.2.4 with minUsers 2 returns [].',
    starter: `function findSprayers(lines, minUsers) {
  return [];
}
`,
    tests: [
      { name: 'flags one source targeting three distinct users', code: `{ const lines = ['Failed password for ana from 192.0.2.4 port 1 ssh2', 'Failed password for ben from 192.0.2.4 port 2 ssh2', 'Failed password for cyd from 192.0.2.4 port 3 ssh2']; assert(JSON.stringify(findSprayers(lines, 3)) === JSON.stringify(['192.0.2.4']), 'three users should qualify'); }` },
      { name: 'does not count repeated attempts against one user twice', code: `{ const lines = ['Failed password for ana from 192.0.2.4 port 1 ssh2', 'Failed password for ana from 192.0.2.4 port 2 ssh2']; assert(findSprayers(lines, 2).length === 0, 'one distinct user stays below threshold'); }` },
      { name: 'accepts invalid user failure format', code: `{ const lines = ['Failed password for invalid user guest from 198.51.100.7 port 1 ssh2', 'Failed password for ana from 198.51.100.7 port 2 ssh2']; assert(JSON.stringify(findSprayers(lines, 2)) === JSON.stringify(['198.51.100.7']), 'invalid user format counts'); }` },
      { name: 'separates and sorts multiple sources', code: `{ const lines = ['Failed password for a from 203.0.113.5 port 1 ssh2', 'Failed password for b from 203.0.113.5 port 2 ssh2', 'Failed password for a from 198.51.100.6 port 3 ssh2', 'Failed password for b from 198.51.100.6 port 4 ssh2', 'Failed password for c from 192.0.2.9 port 5 ssh2']; assert(JSON.stringify(findSprayers(lines, 2)) === JSON.stringify(['198.51.100.6', '203.0.113.5']), 'only qualifying sources, sorted'); }` },
      { name: 'ignores successful authentication', code: `{ const lines = ['Accepted password for ana from 192.0.2.4 port 1 ssh2', 'Failed password for ben from 192.0.2.4 port 2 ssh2']; assert(findSprayers(lines, 2).length === 0, 'accepted line does not count'); }` },
    ],
    hint: 'Keep a Set of user names for each source IP. A Set ignores repeats.',
    solution: String.raw`function findSprayers(lines, minUsers) {
  const usersByIp = new Map();
  for (const line of lines) {
    const match = /Failed password for (?:invalid user )?(\S+) from (\d{1,3}(?:\.\d{1,3}){3}) port\b/.exec(line);
    if (!match) continue;
    if (!usersByIp.has(match[2])) usersByIp.set(match[2], new Set());
    usersByIp.get(match[2]).add(match[1]);
  }
  return [...usersByIp.keys()].filter(ip => usersByIp.get(ip).size >= minUsers).sort();
}
`,
    why: 'Password spraying tries credentials across many accounts, often to avoid per-account lockouts. Security+ may describe many distinct failed accounts in authentication logs. This lab detects source and user breadth only; real investigations also use time windows, success events, shared passwords when visible, and distributed source correlation.',
    src: ['spraying'],
  },
  {
    id: 'code-03', level: 2, title: 'Classify local IPv4 addresses', objs: ['3.2', '4.8'], examObjs: { 'netplus-009': ['1.7'], 'aplus-1201': ['2.6'] },
    brief: 'Write isPrivateIp(ip). Return true for valid IPv4 addresses in the RFC 1918 private ranges or 127.0.0.0/8 loopback, false for other or malformed addresses. Examples: 172.16.0.1 returns true; 172.32.0.1 returns false. Accept exactly four decimal octets from 0 to 255, without spaces, signs, or leading zeroes on multi-digit octets.',
    starter: `function isPrivateIp(ip) {
  return false;
}
`,
    tests: [
      { name: 'recognizes all three private blocks', code: `{ assert(isPrivateIp('10.1.2.3') && isPrivateIp('172.16.0.1') && isPrivateIp('172.31.255.254') && isPrivateIp('192.168.2.5'), 'all RFC 1918 ranges'); }` },
      { name: 'recognizes the full loopback block', code: `{ assert(isPrivateIp('127.0.0.1') && isPrivateIp('127.22.4.9'), '127/8 is loopback'); }` },
      { name: 'rejects addresses next to private boundaries', code: `{ assert(!isPrivateIp('172.15.255.255') && !isPrivateIp('172.32.0.1') && !isPrivateIp('192.169.0.1') && !isPrivateIp('11.0.0.1'), 'outside private boundaries'); }` },
      { name: 'rejects documentation and public addresses', code: `{ assert(!isPrivateIp('203.0.113.9') && !isPrivateIp('198.51.100.7'), 'documentation addresses are not private'); }` },
      { name: 'rejects malformed IPv4 text', code: `{ assert(!isPrivateIp('10.0.0.256') && !isPrivateIp('10.0.0') && !isPrivateIp(' 10.0.0.1') && !isPrivateIp('010.0.0.1') && !isPrivateIp('10.0.0.-1'), 'invalid dotted decimal'); }` },
    ],
    hint: 'Validate all four octets first, then compare the first one or two octets with the range boundaries.',
    solution: String.raw`function isPrivateIp(ip) {
  if (typeof ip !== 'string') return false;
  const parts = ip.split('.');
  if (parts.length !== 4 || parts.some(part => !/^(0|[1-9]\d{0,2})$/.test(part) || Number(part) > 255)) return false;
  const [a, b] = parts.map(Number);
  return a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}
`,
    why: 'RFC 1918 reserves three ranges for private internets; 127/8 is loopback under RFC 1122, not an RFC 1918 range. Security+ may ask you to identify internal or local traffic in logs. Validate the address before classifying it, and remember that a private source address alone does not prove the traffic is trustworthy.',
    src: ['private', 'loopback'],
  },
  {
    id: 'code-04', level: 2, title: 'Apply the first firewall match', objs: ['3.2', '4.1', '4.4'], examObjs: { 'netplus-009': ['4.3'] },
    brief: 'Write firstMatch(rules, flow). Return "allow" or "deny". Read rules from top to bottom and return the action of the first match. If none match, return "deny". Each rule has action, src, dst, proto, and port. src, dst, proto, and port match the corresponding flow value exactly or use the string "any". A flow port is a number, while a rule port may be a number or its decimal string. Example: [{action:"allow",src:"any",dst:"10.0.1.10",proto:"tcp",port:"443"}] permits {src:"192.0.2.1",dst:"10.0.1.10",proto:"tcp",port:443}.',
    starter: `function firstMatch(rules, flow) {
  return 'allow';
}
`,
    tests: [
      { name: 'uses the first matching deny before a later allow', code: `{ const rules = [{action:'deny',src:'any',dst:'10.0.1.10',proto:'tcp',port:'443'},{action:'allow',src:'any',dst:'10.0.1.10',proto:'tcp',port:'443'}]; assert(firstMatch(rules,{src:'192.0.2.5',dst:'10.0.1.10',proto:'tcp',port:443}) === 'deny', 'first deny wins'); }` },
      { name: 'uses the first matching allow before a later deny', code: `{ const rules = [{action:'allow',src:'192.0.2.5',dst:'10.0.1.10',proto:'tcp',port:443},{action:'deny',src:'any',dst:'any',proto:'any',port:'any'}]; assert(firstMatch(rules,{src:'192.0.2.5',dst:'10.0.1.10',proto:'tcp',port:443}) === 'allow', 'specific allow wins'); }` },
      { name: 'skips a rule whose source differs', code: `{ const rules = [{action:'deny',src:'203.0.113.2',dst:'any',proto:'any',port:'any'},{action:'allow',src:'any',dst:'10.0.1.10',proto:'tcp',port:'443'}]; assert(firstMatch(rules,{src:'192.0.2.5',dst:'10.0.1.10',proto:'tcp',port:443}) === 'allow', 'different source does not match'); }` },
      { name: 'matches protocol and port separately', code: `{ const rules = [{action:'allow',src:'any',dst:'any',proto:'udp',port:'53'}]; assert(firstMatch(rules,{src:'10.0.2.5',dst:'192.0.2.53',proto:'tcp',port:53}) === 'deny' && firstMatch(rules,{src:'10.0.2.5',dst:'192.0.2.53',proto:'udp',port:53}) === 'allow', 'protocol matters'); }` },
      { name: 'denies when no rule matches', code: `{ assert(firstMatch([],{src:'192.0.2.5',dst:'10.0.1.10',proto:'tcp',port:443}) === 'deny', 'implicit deny'); }` },
    ],
    hint: 'Check every field of a rule. Stop on the first rule for which all fields match.',
    solution: `function firstMatch(rules, flow) {
  for (const rule of rules) {
    const matches = ['src', 'dst', 'proto', 'port'].every(field =>
      rule[field] === 'any' || String(rule[field]) === String(flow[field]));
    if (matches) return rule.action;
  }
  return 'deny';
}
`,
    why: 'Firewall policy is ordered: the first matching rule decides, then an implicit deny handles unmatched traffic. Security+ may ask which access control list entry affects a flow. Follow the fields and order exactly; an allow later in the list cannot override an earlier matching deny.',
    src: ['firewall'],
  },
  {
    id: 'code-05', level: 3, title: 'Find regular outbound contact', objs: ['2.5', '4.4', '4.8'], examObjs: { 'netplus-009': ['3.2'] },
    brief: 'Write findBeaconing(connections, minHits, tolerance). Each record has host, dst, and t, where t is a timestamp in seconds. minHits is at least 3. Group by host and destination, sort timestamps, and examine every gap between consecutive records in a group. Return sorted strings of the form "host|dst" for groups with at least minHits records, positive gaps, and a largest gap minus smallest gap no greater than tolerance seconds. Example: times 0, 60, 121 with minHits 3 and tolerance 1 qualify. Groups do not share records.',
    starter: `function findBeaconing(connections, minHits, tolerance) {
  return [];
}
`,
    tests: [
      { name: 'flags a regular three contact pattern', code: `{ const c = [{host:'10.0.0.5',dst:'203.0.113.9',t:0},{host:'10.0.0.5',dst:'203.0.113.9',t:60},{host:'10.0.0.5',dst:'203.0.113.9',t:121}]; assert(JSON.stringify(findBeaconing(c,3,1)) === JSON.stringify(['10.0.0.5|203.0.113.9']), 'gaps 60 and 61 qualify'); }` },
      { name: 'sorts timestamps before measuring gaps', code: `{ const c = [{host:'10.0.0.5',dst:'203.0.113.9',t:120},{host:'10.0.0.5',dst:'203.0.113.9',t:0},{host:'10.0.0.5',dst:'203.0.113.9',t:60}]; assert(findBeaconing(c,3,0).length === 1, 'input order must not matter'); }` },
      { name: 'rejects irregular timing outside tolerance', code: `{ const c = [{host:'10.0.0.5',dst:'203.0.113.9',t:0},{host:'10.0.0.5',dst:'203.0.113.9',t:60},{host:'10.0.0.5',dst:'203.0.113.9',t:180}]; assert(findBeaconing(c,3,10).length === 0, 'gaps differ by 60'); }` },
      { name: 'requires enough contacts and positive gaps', code: `{ const c = [{host:'10.0.0.5',dst:'203.0.113.9',t:0},{host:'10.0.0.5',dst:'203.0.113.9',t:0},{host:'10.0.0.5',dst:'203.0.113.9',t:60}]; assert(findBeaconing(c,3,60).length === 0 && findBeaconing(c.slice(0,2),3,60).length === 0, 'duplicate time and low count fail'); }` },
      { name: 'keeps host and destination pairs separate and sorts', code: `{ const c = [{host:'10.0.0.8',dst:'203.0.113.2',t:0},{host:'10.0.0.8',dst:'203.0.113.2',t:30},{host:'10.0.0.8',dst:'203.0.113.2',t:60},{host:'10.0.0.5',dst:'192.0.2.9',t:0},{host:'10.0.0.5',dst:'192.0.2.9',t:30},{host:'10.0.0.5',dst:'192.0.2.9',t:60},{host:'10.0.0.8',dst:'192.0.2.9',t:99}]; assert(JSON.stringify(findBeaconing(c,3,0)) === JSON.stringify(['10.0.0.5|192.0.2.9','10.0.0.8|203.0.113.2']), 'two independent sorted pairs'); }` },
    ],
    hint: 'Use a Map keyed by host and destination. Sort each group of times, then compare its shortest and longest gaps.',
    solution: `function findBeaconing(connections, minHits, tolerance) {
  const groups = new Map();
  for (const { host, dst, t } of connections) {
    const key = host + '|' + dst;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(t);
  }
  const found = [];
  for (const [key, times] of groups) {
    if (times.length < minHits || times.length < 2) continue;
    times.sort((a, b) => a - b);
    const gaps = times.slice(1).map((time, i) => time - times[i]);
    if (gaps.every(gap => gap > 0) && Math.max(...gaps) - Math.min(...gaps) <= tolerance) found.push(key);
  }
  return found.sort();
}
`,
    why: 'Regular outbound contact can be a command and control beacon. MITRE ATT&CK discusses repetitive web traffic as one detection signal. Security+ may present this as network metadata or alert tuning. Timing alone is weak evidence: scheduled updates also look regular, while an attacker can add jitter or change destinations.',
    src: ['beacon'],
  },
  {
    id: 'code-06', level: 3, title: 'Spot DHCP pool starvation', objs: ['2.5', '4.4', '4.8'], examObjs: { 'netplus-009': ['3.2', '4.2', '5.3'] },
    brief: 'Write findDhcpStarvation(events, minMacs, windowSeconds). Each event has t (seconds), port, mac, and type. Consider only type "DISCOVER". For each switch port, flag it if at least minMacs distinct MACs send DISCOVER within any inclusive window of windowSeconds (last t minus first t is at most windowSeconds). Return flagged port names sorted as text. Input may be unsorted. Example: two distinct MACs at t=0 and t=10 on Gi1/0/4 with minMacs=2 and windowSeconds=10 returns ["Gi1/0/4"].',
    starter: `function findDhcpStarvation(events, minMacs, windowSeconds) {\n  return [];\n}\n`,
    tests: [
      { name: 'flags threshold at inclusive boundary', code: `{ const e=[{t:0,port:'Gi1/0/4',mac:'02:00:00:00:00:01',type:'DISCOVER'},{t:10,port:'Gi1/0/4',mac:'02:00:00:00:00:02',type:'DISCOVER'}]; assert(JSON.stringify(findDhcpStarvation(e,2,10))===JSON.stringify(['Gi1/0/4']),'boundary qualifies'); }` },
      { name: 'does not count a repeated MAC twice', code: `{ const e=[{t:0,port:'Gi1/0/4',mac:'02:00:00:00:00:01',type:'DISCOVER'},{t:1,port:'Gi1/0/4',mac:'02:00:00:00:00:01',type:'DISCOVER'}]; assert(findDhcpStarvation(e,2,10).length===0,'one distinct MAC'); }` },
      { name: 'uses a moving window on unsorted input', code: `{ const e=[{t:19,port:'Gi1/0/4',mac:'02:00:00:00:00:03',type:'DISCOVER'},{t:0,port:'Gi1/0/4',mac:'02:00:00:00:00:01',type:'DISCOVER'},{t:11,port:'Gi1/0/4',mac:'02:00:00:00:00:02',type:'DISCOVER'}]; assert(JSON.stringify(findDhcpStarvation(e,2,8))===JSON.stringify(['Gi1/0/4']),'t 11 and 19 qualify'); }` },
      { name: 'keeps ports separate and sorts results', code: `{ const e=[{t:1,port:'Gi1/0/9',mac:'02:00:00:00:00:01',type:'DISCOVER'},{t:2,port:'Gi1/0/9',mac:'02:00:00:00:00:02',type:'DISCOVER'},{t:1,port:'Gi1/0/2',mac:'02:00:00:00:00:03',type:'DISCOVER'},{t:2,port:'Gi1/0/2',mac:'02:00:00:00:00:04',type:'DISCOVER'},{t:1,port:'Gi1/0/8',mac:'02:00:00:00:00:05',type:'DISCOVER'}]; assert(JSON.stringify(findDhcpStarvation(e,2,2))===JSON.stringify(['Gi1/0/2','Gi1/0/9']),'two ports sorted'); }` },
      { name: 'ignores offers and nonoverlapping requests', code: `{ const e=[{t:0,port:'Gi1/0/4',mac:'02:00:00:00:00:01',type:'DISCOVER'},{t:1,port:'Gi1/0/4',mac:'02:00:00:00:00:02',type:'OFFER'},{t:30,port:'Gi1/0/4',mac:'02:00:00:00:00:03',type:'DISCOVER'}]; assert(findDhcpStarvation(e,2,10).length===0,'offers and distant requests do not qualify'); }` },
    ],
    hint: 'Group DISCOVER events by port and sort them by t. Try a window starting at each event and count unique MACs inside it.',
    solution: `function findDhcpStarvation(events, minMacs, windowSeconds) {\n  const byPort = new Map();\n  for (const event of events) {\n    if (event.type !== 'DISCOVER') continue;\n    if (!byPort.has(event.port)) byPort.set(event.port, []);\n    byPort.get(event.port).push(event);\n  }\n  const found = [];\n  for (const [port, entries] of byPort) {\n    entries.sort((a, b) => a.t - b.t);\n    for (let i = 0; i < entries.length; i += 1) {\n      const macs = new Set();\n      for (let j = i; j < entries.length && entries[j].t - entries[i].t <= windowSeconds; j += 1) {\n        macs.add(entries[j].mac);\n      }\n      if (macs.size >= minMacs) { found.push(port); break; }\n    }\n  }\n  return found.sort();\n}\n`,
    why: 'A burst of DHCP requests from many client MACs on one port can consume the address pool. MITRE describes this as DHCP exhaustion. Network+ may show the same clue as an empty scope. This detector is a triage signal: a legitimate device farm can also create a burst, so confirm the port, lease state, and inventory.',
    src: ['dhcp','dhcp-attack'],
  },
  {
    id: 'code-07', level: 3, title: 'Find horizontal scans in deny logs', objs: ['2.5', '4.4', '4.8'], examObjs: { 'netplus-009': ['3.2'] },
    brief: 'Write findHorizontalScanners(logs, minHosts, windowSeconds). Each firewall record has t (seconds), action, proto, src, dst, and port. Consider only denied TCP records. A source qualifies if it probes at least minHosts distinct destination IPs on the same destination port within any inclusive window of windowSeconds. Return qualifying source IPs sorted as text. Input may be unsorted. Example: one source denied to two hosts on port 445 at t=0 and t=5, with minHosts=2 and windowSeconds=5, qualifies. Many ports on one host are a vertical scan and do not qualify.',
    starter: `function findHorizontalScanners(logs, minHosts, windowSeconds) {\n  return [];\n}\n`,
    tests: [
      { name: 'flags distinct hosts at the time boundary', code: `{ const l=[{t:0,action:'deny',proto:'tcp',src:'192.0.2.8',dst:'10.1.1.1',port:445},{t:5,action:'deny',proto:'tcp',src:'192.0.2.8',dst:'10.1.1.2',port:445}]; assert(JSON.stringify(findHorizontalScanners(l,2,5))===JSON.stringify(['192.0.2.8']),'boundary qualifies'); }` },
      { name: 'ignores repeated hosts and vertical scans', code: `{ const l=[{t:0,action:'deny',proto:'tcp',src:'192.0.2.8',dst:'10.1.1.1',port:22},{t:1,action:'deny',proto:'tcp',src:'192.0.2.8',dst:'10.1.1.1',port:23},{t:2,action:'deny',proto:'tcp',src:'192.0.2.8',dst:'10.1.1.1',port:22}]; assert(findHorizontalScanners(l,2,5).length===0,'one destination is not horizontal'); }` },
      { name: 'uses a sliding window with unsorted logs', code: `{ const l=[{t:19,action:'deny',proto:'tcp',src:'192.0.2.8',dst:'10.1.1.3',port:445},{t:0,action:'deny',proto:'tcp',src:'192.0.2.8',dst:'10.1.1.1',port:445},{t:11,action:'deny',proto:'tcp',src:'192.0.2.8',dst:'10.1.1.2',port:445}]; assert(JSON.stringify(findHorizontalScanners(l,2,8))===JSON.stringify(['192.0.2.8']),'t 11 and 19 qualify'); }` },
      { name: 'keeps sources and ports separate then sorts', code: `{ const l=[{t:0,action:'deny',proto:'tcp',src:'203.0.113.9',dst:'10.1.1.1',port:445},{t:1,action:'deny',proto:'tcp',src:'203.0.113.9',dst:'10.1.1.2',port:445},{t:0,action:'deny',proto:'tcp',src:'192.0.2.8',dst:'10.1.1.1',port:22},{t:1,action:'deny',proto:'tcp',src:'192.0.2.8',dst:'10.1.1.2',port:22},{t:2,action:'deny',proto:'tcp',src:'198.51.100.7',dst:'10.1.1.3',port:22}]; assert(JSON.stringify(findHorizontalScanners(l,2,5))===JSON.stringify(['192.0.2.8','203.0.113.9']),'two sources sorted'); }` },
      { name: 'ignores allowed and UDP records', code: `{ const l=[{t:0,action:'allow',proto:'tcp',src:'192.0.2.8',dst:'10.1.1.1',port:445},{t:1,action:'deny',proto:'udp',src:'192.0.2.8',dst:'10.1.1.2',port:445},{t:2,action:'deny',proto:'tcp',src:'192.0.2.8',dst:'10.1.1.3',port:445}]; assert(findHorizontalScanners(l,2,5).length===0,'only one denied TCP destination'); }` },
      { name: 'requires the same destination port', code: `{ const l=[{t:0,action:'deny',proto:'tcp',src:'192.0.2.8',dst:'10.1.1.1',port:22},{t:1,action:'deny',proto:'tcp',src:'192.0.2.8',dst:'10.1.1.2',port:445}]; assert(findHorizontalScanners(l,2,5).length===0,'different ports are not one horizontal sweep'); }` },
      { name: 'ignores hosts outside the window', code: `{ const l=[{t:0,action:'deny',proto:'tcp',src:'192.0.2.8',dst:'10.1.1.1',port:445},{t:6,action:'deny',proto:'tcp',src:'192.0.2.8',dst:'10.1.1.2',port:445}]; assert(findHorizontalScanners(l,2,5).length===0,'6 seconds apart is outside a 5 second window'); }` },
    ],
    hint: 'Group denied TCP records by source and destination port. Sort by time, then count distinct destination IPs in each candidate window.',
    solution: `function findHorizontalScanners(logs, minHosts, windowSeconds) {\n  const groups = new Map();\n  for (const row of logs) {\n    if (row.action !== 'deny' || row.proto !== 'tcp') continue;\n    const key = row.src + '|' + row.port;\n    if (!groups.has(key)) groups.set(key, []);\n    groups.get(key).push(row);\n  }\n  const found = new Set();\n  for (const [key, entries] of groups) {\n    entries.sort((a, b) => a.t - b.t);\n    for (let i = 0; i < entries.length; i += 1) {\n      const hosts = new Set();\n      for (let j = i; j < entries.length && entries[j].t - entries[i].t <= windowSeconds; j += 1) {\n        hosts.add(entries[j].dst);\n      }\n      if (hosts.size >= minHosts) { found.add(entries[i].src); break; }\n    }\n  }\n  return [...found].sort();\n}\n`,
    why: 'A horizontal scan tries one service across many hosts. Deny logs can reveal its breadth even when no connection succeeds. Network+ may describe this as repeated blocked connections to many destinations. Authorized inventory scans can look similar, so validate the source and change window before escalating.',
    src: ['scanning','firewall'],
  },
];

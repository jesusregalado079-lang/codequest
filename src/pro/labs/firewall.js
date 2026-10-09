export function parseIp(s) {
  if (typeof s !== 'string' || !/^(?:\d{1,3}\.){3}\d{1,3}$/.test(s)) return null;
  const parts = s.split('.').map(Number);
  if (parts.some((part) => part > 255)) return null;
  return (((parts[0] * 0x1000000) + (parts[1] << 16) + (parts[2] << 8) + parts[3]) >>> 0);
}

export function formatIp(n) {
  if (!Number.isInteger(n) || n < 0 || n > 0xffffffff) return null;
  return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
}

export function parseCidr(s) {
  if (s === 'any') return { base: 0, bits: 0 };
  if (typeof s !== 'string') return null;
  const match = /^(\d{1,3}(?:\.\d{1,3}){3})(?:\/(\d{1,2}))?$/.exec(s);
  if (!match) return null;
  const ip = parseIp(match[1]);
  const bits = match[2] === undefined ? 32 : Number(match[2]);
  if (ip === null || bits > 32) return null;
  const mask = bits ? (0xffffffff << (32 - bits)) >>> 0 : 0;
  return { base: (ip & mask) >>> 0, bits };
}

export function addrMatches(spec, ip) {
  const cidr = parseCidr(spec);
  const n = parseIp(ip);
  if (!cidr || n === null) return false;
  const mask = cidr.bits ? (0xffffffff << (32 - cidr.bits)) >>> 0 : 0;
  return ((n & mask) >>> 0) === cidr.base;
}

export function parsePorts(spec) {
  if (spec === 'any') return [[0, 65535]];
  if (typeof spec !== 'string' || !spec.length) return null;
  const out = [];
  for (const item of spec.split(',')) {
    const match = /^(\d{1,5})(?:-(\d{1,5}))?$/.exec(item.trim());
    if (!match) return null;
    const lo = Number(match[1]);
    const hi = match[2] === undefined ? lo : Number(match[2]);
    if (lo > 65535 || hi > 65535 || lo > hi) return null;
    out.push([lo, hi]);
  }
  return out;
}

export function portMatches(spec, port) {
  const ranges = parsePorts(spec);
  return Number.isInteger(port) && port >= 0 && port <= 65535 && !!ranges?.some(([lo, hi]) => port >= lo && port <= hi);
}

export function validateRule(rule) {
  if (!rule || typeof rule !== 'object' || Array.isArray(rule)) return 'Rule must be an object';
  if (!['allow', 'deny'].includes(rule.action)) return 'Action must be allow or deny';
  if (!parseCidr(rule.src)) return 'Source must be any, an IP, or a CIDR like 10.0.1.0/24';
  if (!parseCidr(rule.dst)) return 'Destination must be any, an IP, or a CIDR like 10.0.1.0/24';
  if (!['tcp', 'udp', 'icmp', 'any'].includes(rule.proto)) return 'Protocol must be tcp, udp, icmp, or any';
  if (rule.proto === 'icmp' && rule.port !== 'any') return 'ICMP port must be any';
  if (!parsePorts(rule.port)) return 'Port must be any, a port, or a range';
  return null;
}

export function ruleMatches(rule, flow) {
  if (validateRule(rule) || !flow || !['tcp', 'udp', 'icmp'].includes(flow.proto)) return false;
  if (!addrMatches(rule.src, flow.src) || !addrMatches(rule.dst, flow.dst)) return false;
  if (rule.proto !== 'any' && rule.proto !== flow.proto) return false;
  return flow.proto === 'icmp' || portMatches(rule.port, flow.port);
}

export function evaluate(rules, flow) {
  if (Array.isArray(rules)) {
    for (let index = 0; index < rules.length; index += 1) {
      if (ruleMatches(rules[index], flow)) return { action: rules[index].action, index };
    }
  }
  return { action: 'deny', index: -1 };
}

function isPublic(ip) {
  const n = parseIp(ip);
  if (n === null) return false;
  const a = n >>> 24;
  const b = (n >>> 16) & 255;
  return a > 0 && a < 224 && a !== 10 && a !== 127
    && !(a === 100 && b >= 64 && b <= 127)
    && !(a === 169 && b === 254)
    && !(a === 172 && b >= 16 && b <= 31)
    && !(a === 192 && b === 168);
}

export function nodeForIp(caseDef, ip) {
  const nodes = Array.isArray(caseDef?.nodes) ? caseDef.nodes : [];
  if (parseIp(ip) === null) return null;
  return nodes.find((node) => node?.ip === ip) || (isPublic(ip) ? nodes.find((node) => node?.kind === 'internet') || null : null);
}

export function routeFlow(caseDef, rules, flow) {
  const src = nodeForIp(caseDef, flow?.src);
  const dst = nodeForIp(caseDef, flow?.dst);
  if (!src || !dst) return { action: 'nohost', index: -1, via: 'firewall' };
  if (src.zone != null && src.zone === dst.zone) return { action: 'allow', index: -1, via: 'switch' };
  return { ...evaluate(rules, flow), via: 'firewall' };
}

export function gradeFirewall(caseDef, rules) {
  const goals = Array.isArray(caseDef?.goals) ? caseDef.goals : [];
  const results = goals.map((goal) => {
    const { action, index } = routeFlow(caseDef, rules, goal);
    return { text: goal.text, expect: goal.expect, got: action, pass: action === goal.expect, index };
  });
  const passed = results.filter((result) => result.pass).length;
  return { results, passed, total: results.length, score: results.length ? Math.round(100 * passed / results.length) : 0 };
}

const SERVICES = { 22: 'ssh', 25: 'smtp', 53: 'domain', 80: 'http', 443: 'https', 445: 'microsoft-ds', 1433: 'ms-sql-s', 3306: 'mysql', 3389: 'ms-wbt-server', 8080: 'http-alt' };

export function simulate(caseDef, rules, fromNodeId, command, options = {}) {
  const trace = options?.trace === true;
  const nodes = Array.isArray(caseDef?.nodes) ? caseDef.nodes : [];
  const from = nodes.find((node) => node?.id === fromNodeId);
  const words = typeof command === 'string' ? command.trim().split(/\s+/) : [];
  const lower = words.map((word) => word.toLowerCase());
  if (!words.length || !words[0]) return '';
  if (lower.length === 1 && lower[0] === 'help') return 'Commands: help, ipconfig, ifconfig, ip a, ping <ip>, nc -zv <ip> <port>, nc -zvu <ip> <port>, tnc <ip> -port <n>';
  if (lower.join(' ') === 'ipconfig' || lower.join(' ') === 'ifconfig' || lower.join(' ') === 'ip a') {
    if (!from) return 'Destination host unreachable.';
    if (from.kind === 'internet') return `This is the outside test host ${from.ip}.`;
    return `IPv4 Address: ${from.ip}\nSubnet Mask: ${from.mask}\nDefault Gateway: ${from.gw}`;
  }
  let proto;
  let ip;
  let port = null;
  let mode;
  if (lower[0] === 'ping' && lower.length === 2) {
    [ip] = words.slice(1); proto = 'icmp'; mode = 'ping';
  } else if (lower[0] === 'nc' && ['-zv', '-zvu'].includes(lower[1]) && lower.length === 4) {
    ip = words[2]; port = Number(words[3]); proto = lower[1] === '-zvu' ? 'udp' : 'tcp'; mode = 'nc';
  } else if (lower[0] === 'tnc' && lower[2] === '-port' && lower.length === 4) {
    ip = words[1]; port = Number(words[3]); proto = 'tcp'; mode = 'tnc';
  } else {
    return `'${lower[0]}' is not a command here. Type help.`;
  }
  if (parseIp(ip) === null || (port !== null && (!Number.isInteger(port) || port < 0 || port > 65535))) {
    return 'Destination host unreachable.';
  }
  const result = routeFlow(caseDef, rules, { src: from?.ip, dst: ip, proto, port });
  let output;
  if (result.action === 'nohost') output = 'Destination host unreachable.';
  else if (mode === 'ping') {
    output = result.action === 'allow'
      ? [...Array.from({ length: 4 }, (_, i) => `Reply from ${ip}: bytes=32 time=${i + 1}ms TTL=64`), 'Sent = 4, Received = 4, Lost = 0 (0% loss)'].join('\n')
      : [...Array(4).fill('Request timed out.'), 'Sent = 4, Received = 0, Lost = 4 (100% loss)'].join('\n');
  } else if (mode === 'tnc') {
    output = `ComputerName : ${ip}\nRemotePort : ${port}\nTcpTestSucceeded : ${result.action === 'allow' ? 'True' : 'False'}`;
  } else {
    output = result.action === 'allow'
      ? `Connection to ${ip} ${port} port [${proto}/${SERVICES[port] || '*'}] succeeded!`
      : `nc: connect to ${ip} port ${port} (${proto}) failed: Connection timed out`;
  }
  if (!trace || result.action === 'nohost') return output;
  if (result.via === 'switch') return `${output}\n[trace] same zone, switched directly`;
  const label = nodes.find((node) => node?.kind === 'firewall')?.label || 'FW1';
  if (result.index === -1) return `${output}\n[trace] ${label} no rule matched: implicit deny`;
  const rule = rules[result.index];
  return `${output}\n[trace] ${label} rule ${result.index + 1} (${rule.action} ${rule.proto} ${rule.src} -> ${rule.dst}:${rule.port})`;
}

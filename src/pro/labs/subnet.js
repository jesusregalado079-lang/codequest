import { formatIp, parseIp } from './firewall.js';

export const LEVELS = [
  { id: 'subnet-1', name: 'Masks and sizes', blurb: 'Convert masks, prefixes, and host counts.', kinds: ['mask', 'cidr', 'hosts'] },
  { id: 'subnet-2', name: 'Last-octet subnets', blurb: 'Find subnet boundaries in the last octet.', kinds: ['network', 'broadcast', 'first', 'last'] },
  { id: 'subnet-3', name: 'Bigger blocks', blurb: 'Find boundaries across larger blocks.', kinds: ['network', 'broadcast', 'first', 'last', 'hosts'] },
  { id: 'subnet-4', name: 'Plan and compare', blurb: 'Choose a subnet and compare addresses.', kinds: ['fit', 'same', 'network', 'broadcast', 'first', 'last', 'hosts', 'mask', 'cidr'] },
];

const validBits = (bits) => Number.isInteger(bits) && bits >= 0 && bits <= 32;
const maskNum = (bits) => bits ? (0xffffffff << (32 - bits)) >>> 0 : 0;

export function maskFromCidr(bits) {
  return validBits(bits) ? formatIp(maskNum(bits)) : null;
}

export function cidrFromMask(mask) {
  const value = parseIp(mask);
  if (value === null) return null;
  for (let bits = 0; bits <= 32; bits += 1) if (maskNum(bits) === value) return bits;
  return null;
}

export function networkOf(ip, bits) {
  const value = parseIp(ip);
  return value === null || !validBits(bits) ? null : formatIp((value & maskNum(bits)) >>> 0);
}

export function broadcastOf(ip, bits) {
  const value = parseIp(ip);
  return value === null || !validBits(bits) ? null : formatIp(((value & maskNum(bits)) | (~maskNum(bits))) >>> 0);
}

export function firstHost(ip, bits) {
  const network = networkOf(ip, bits);
  return network === null || bits > 30 ? null : formatIp(parseIp(network) + 1);
}

export function lastHost(ip, bits) {
  const broadcast = broadcastOf(ip, bits);
  return broadcast === null || bits > 30 ? null : formatIp(parseIp(broadcast) - 1);
}

export function usableHosts(bits) {
  return validBits(bits) ? (bits >= 31 ? 0 : 2 ** (32 - bits) - 2) : null;
}

export function cidrForHosts(n) {
  if (!Number.isInteger(n) || n < 2) return null;
  for (let bits = 30; bits >= 0; bits -= 1) if (usableHosts(bits) >= n) return bits;
  return null;
}

const random = (rng, max) => Math.min(max - 1, Math.max(0, Math.floor((Number(rng()) || 0) * max)));
const choose = (list, rng) => list[random(rng, list.length)];
const prefix = (lo, hi, rng) => lo + random(rng, hi - lo + 1);
function privateIp(rng) {
  const group = random(rng, 3);
  if (group === 0) return `10.${random(rng, 256)}.${random(rng, 256)}.${random(rng, 256)}`;
  if (group === 1) return `172.${16 + random(rng, 16)}.${random(rng, 256)}.${random(rng, 256)}`;
  return `192.168.${random(rng, 256)}.${random(rng, 256)}`;
}

function blockExplanation(ip, bits, kind, answer) {
  const octet = Math.floor(bits / 8);
  let boundary;
  if (bits % 8 === 0) {
    boundary = `/${bits} ends on an octet boundary: keep the first ${octet} ${octet === 1 ? 'octet' : 'octets'} and zero the rest for the network (${networkOf(ip, bits)}); set the rest to 255 for the broadcast (${broadcastOf(ip, bits)}).`;
  } else {
    const size = 2 ** (8 - bits % 8);
    const octets = ip.split('.').map(Number);
    const start = Math.floor(octets[octet] / size) * size;
    const end = start + size - 1;
    const place = ['first', 'second', 'third', 'fourth'][octet];
    boundary = `/${bits} means a block of ${size} in the ${place} octet. ${octets[octet]} falls in the ${start} to ${end} block. The network is ${networkOf(ip, bits)} and the broadcast is ${broadcastOf(ip, bits)}.`;
  }
  if (kind === 'first') return `${boundary} The first usable host is one after the network: ${answer}.`;
  if (kind === 'last') return `${boundary} The last usable host is one before the broadcast: ${answer}.`;
  if (kind === 'hosts') return `/${bits} leaves ${32 - bits} host bits, a block of ${2 ** (32 - bits)} addresses. Subtract network and broadcast: ${answer} usable hosts.`;
  return `${boundary} The ${kind} address is ${answer}.`;
}

function questionFor(kind, levelId, rng) {
  const bits = levelId === 'subnet-3' ? prefix(16, 23, rng)
    : levelId === 'subnet-2' ? prefix(25, 30, rng) : prefix(24, 30, rng);
  if (kind === 'fit') {
    const n = 2 + random(rng, 3999);
    const answer = String(cidrForHosts(n));
    return { kind, prompt: `What is the smallest subnet prefix with at least ${n} usable hosts?`, answer, input: 'cidr', explain: `${n} hosts need ${n + 2} addresses including network and broadcast. Round up to the next power-of-two block: ${2 ** (32 - Number(answer))} addresses, so the prefix is /${answer}.` };
  }
  if (kind === 'mask' || kind === 'cidr' || kind === 'hosts') {
    if (kind === 'mask') return { kind, bits, prompt: `What dotted-decimal mask is /${bits}?`, answer: maskFromCidr(bits), input: 'mask', explain: `/${bits} has ${bits} leading one bits and a block of ${2 ** (32 - bits)} addresses. The dotted mask is ${maskFromCidr(bits)}.` };
    if (kind === 'cidr') return { kind, bits, prompt: `What CIDR prefix is mask ${maskFromCidr(bits)}?`, answer: String(bits), input: 'cidr', explain: `${maskFromCidr(bits)} has ${bits} contiguous one bits, leaving a block of ${2 ** (32 - bits)} addresses. The prefix is /${bits}.` };
    return { kind, bits, prompt: `How many usable hosts are in a /${bits} subnet?`, answer: String(usableHosts(bits)), input: 'number', explain: blockExplanation('10.0.0.1', bits, kind, usableHosts(bits)) };
  }
  if (kind === 'same') {
    const same = random(rng, 2) === 0;
    const a = privateIp(rng);
    const sameBase = parseIp(networkOf(a, bits));
    const size = 2 ** (32 - bits);
    let b;
    if (same) {
      const offset = 1 + random(rng, size - 1);
      b = formatIp(sameBase + ((parseIp(a) - sameBase + offset) % size));
    } else {
      b = privateIp(rng);
      if (networkOf(a, bits) === networkOf(b, bits)) b = a.startsWith('10.') ? '192.168.0.1' : '10.0.0.1';
    }
    const answer = same ? 'yes' : 'no';
    return { kind, ip: a, bits, prompt: `Are ${a} and ${b} in the same /${bits} subnet?`, answer, input: 'yesno', explain: `${blockExplanation(a, bits, 'network', networkOf(a, bits))} ${b} has network ${networkOf(b, bits)}, so the answer is ${answer}.` };
  }
  let ip = privateIp(rng);
  const answerFor = (address) => ({ network: networkOf, broadcast: broadcastOf, first: firstHost, last: lastHost }[kind](address, bits));
  for (let tries = 0; tries < 8 && answerFor(ip) === ip; tries += 1) ip = privateIp(rng);
  if (answerFor(ip) === ip) ip = formatIp(parseIp(ip) ^ 3);
  const answer = answerFor(ip);
  return { kind, ip, bits, prompt: `What is the ${kind === 'first' ? 'first usable host' : kind === 'last' ? 'last usable host' : kind} address for ${ip}/${bits}?`, answer, input: 'ip', explain: blockExplanation(ip, bits, kind, answer) };
}

export function makeQuestion(levelId, rng = Math.random) {
  const level = LEVELS.find((entry) => entry.id === levelId) || LEVELS[0];
  return questionFor(choose(level.kinds, rng), level.id, rng);
}

export function checkAnswer(q, input) {
  if (!q || input === null || input === undefined) return false;
  const value = String(input).trim().replace(/\s+/g, '').toLowerCase();
  const answer = String(q.answer).toLowerCase();
  if (q.input === 'yesno') return ({ y: 'yes', yes: 'yes', n: 'no', no: 'no' })[value] === answer;
  if (q.input === 'cidr') return value.replace(/^\//, '') === answer;
  if (q.input === 'number') return value.replace(/,/g, '') === answer;
  return value === answer;
}

export function makeRound(levelId, n = 10, rng = Math.random) {
  const level = LEVELS.find((entry) => entry.id === levelId) || LEVELS[0];
  const count = Number.isInteger(n) && n > 0 ? n : 0;
  const questions = [];
  const prompts = new Set();
  const kinds = Array.from({ length: count }, (_, i) => level.kinds[i % level.kinds.length]);
  for (let i = kinds.length - 1; i > 0; i -= 1) {
    const j = random(rng, i + 1);
    [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
  }
  for (let i = 0; i < count; i += 1) {
    const kind = kinds[i];
    let q;
    for (let tries = 0; tries < 1000; tries += 1) {
      q = questionFor(kind, level.id, rng);
      if (!prompts.has(q.prompt)) break;
    }
    if (prompts.has(q.prompt)) q = { ...q, prompt: `${q.prompt} (drill ${i + 1})` };
    questions.push(q);
    prompts.add(q.prompt);
  }
  return questions;
}

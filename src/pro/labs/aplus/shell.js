// Command Line Fixer engine (SPEC 3.3): a deterministic shell simulator for
// Linux bash, the Windows Command Prompt and Windows PowerShell 5.1.
// Pure data in, text out: it never touches a real file system, process or network.
//
// createShell(caseDef) -> sh
//   sh.run(line)      -> { out, exit, goalsChanged, trapsHit, clear? }
//   sh.elevate()      -> same shape; Windows only ("Run as administrator")
//   sh.check()        -> { goals, traps, score }
//   sh.complete(text) -> { line, matches }   Tab completion of commands and paths
//   sh.prompt()       -> prompt or pending question text; sh.awaiting -> null | { secret }
//   sh.snapshot() / sh.restore(snap) / sh.reset()
//   sh.state, sh.fs, sh.cwd, sh.user, sh.admin, sh.history, sh.os, sh.host
// Case predicates: { key: 'dotted.state.path' | 'session.admin', op, value },
//   { path: '/abs/path', field?: 'mode'|'owner'|'group'|'type'|'content'|'size'|'attrs', op, value },
//   { ran: 'regex', ok?: true, flags?, cwd?: '/absolute/path', lists?: '/absolute/file' },
//   { ranSequence: ['regex', ...], flags?, within?: 'diskpart', resetOn?: 'regex', resetTo?: n, every?: 'regex' },
//   { all: [] }, { any: [] }, { not: {} }.
// ran: cwd? requires the working directory at the time of that command; lists? requires that
//   command to be an ls -l whose output shows that file (see listingIncludes).
// ranSequence matches distinct successful history entries in order; other commands may intervene.
//   A line matching resetOn that is not the next step sends progress back to step resetTo (default 0;
//   never forward) and is then tried as that step. After a full match the last step may repeat until a
//   reset. With every, each successful line matching it must complete the sequence, or the predicate fails.
//   Ops: eq ne in notin gte lte truthy falsy matches hasBits lacksBits (octal mode bits).
import { scoreFrom } from './coach.js';

const OSES = ['linux', 'windows-cmd', 'powershell'];
const DEFAULT_NOW = '2026-10-09T09:12:00';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const RULE79 = '-'.repeat(79);
const PROGRESS = '[==========================100.0%==========================]';

const copy = (value) => structuredClone(value);
const pad2 = (n) => String(n).padStart(2, '0');
const commas = (n) => Math.round(n).toLocaleString('en-US');
const byteLength = (text) => new TextEncoder().encode(String(text)).length;
const escapeRe = (text) => text.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
const isIp = (text) => /^\d{1,3}(\.\d{1,3}){3}$/.test(String(text));
const hasWildcard = (text) => /[*?]/.test(text);
const trimLines = (text) => text.split('\n').map((line) => line.trimEnd()).join('\n');

function splitLines(text) {
  const lines = String(text ?? '').split('\n');
  if (lines.at(-1) === '') lines.pop();
  return lines;
}

// GNU style -h sizes: powers of 1024, rounded up, one decimal below 10.
function human(bytes) {
  if (bytes < 1024) return String(Math.max(0, Math.round(bytes)));
  const units = ['K', 'M', 'G', 'T', 'P'];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) { value /= 1024; i += 1; }
  if (value < 10) {
    const up = Math.ceil(value * 10) / 10;
    return up < 10 ? `${up.toFixed(1)}${units[i]}` : `10${units[i]}`;
  }
  const up = Math.ceil(value);
  return up < 1024 || i === units.length - 1 ? `${up}${units[i]}` : `1.0${units[i + 1]}`;
}

function clock(iso) {
  const [date, time = '00:00:00'] = String(iso).split('T');
  const [y, m, d] = date.split('-').map(Number);
  const [h = 0, mi = 0, s = 0] = time.split(':').map(Number);
  return {
    y, m, d, h, mi, s, hh: ((h + 11) % 12) + 1, ap: h < 12 ? 'AM' : 'PM',
    dow: new Date(Date.UTC(y, m - 1, d)).getUTCDay(), epoch: Date.UTC(y, m - 1, d, h, mi, s) / 1000,
  };
}

const DATES = {
  ls(iso, nowIso) {
    const t = clock(iso);
    const age = clock(nowIso).epoch - t.epoch;
    const head = `${MONTHS[t.m - 1].slice(0, 3)} ${String(t.d).padStart(2)}`;
    return age > 182 * 86400 || age < -3600 ? `${head}  ${t.y}` : `${head} ${pad2(t.h)}:${pad2(t.mi)}`;
  },
  cmd(iso) { const t = clock(iso); return `${pad2(t.m)}/${pad2(t.d)}/${t.y}  ${pad2(t.hh)}:${pad2(t.mi)} ${t.ap}`; },
  ps(iso) { const t = clock(iso); return [`${t.m}/${t.d}/${t.y}`, `${t.hh}:${pad2(t.mi)} ${t.ap}`]; },
  long(iso) { const t = clock(iso); return `${DAYS[t.dow]}, ${MONTHS[t.m - 1]} ${t.d}, ${t.y} ${t.hh}:${pad2(t.mi)}:${pad2(t.s)} ${t.ap}`; },
  systemd(iso) { const t = clock(iso); return `${DAYS[t.dow].slice(0, 3)} ${t.y}-${pad2(t.m)}-${pad2(t.d)} ${pad2(t.h)}:${pad2(t.mi)}:${pad2(t.s)} UTC`; },
  dig(iso) { const t = clock(iso); return `${DAYS[t.dow].slice(0, 3)} ${MONTHS[t.m - 1].slice(0, 3)} ${pad2(t.d)} ${pad2(t.h)}:${pad2(t.mi)}:${pad2(t.s)} UTC ${t.y}`; },
  gp(iso) { const t = clock(iso); return `${t.m}/${t.d}/${t.y} at ${t.hh}:${pad2(t.mi)}:${pad2(t.s)} ${t.ap}`; },
  top(iso) { const t = clock(iso); return `${pad2(t.h)}:${pad2(t.mi)}:${pad2(t.s)}`; },
};

function ago(fromIso, nowIso) {
  const secs = Math.max(0, clock(nowIso).epoch - clock(fromIso).epoch);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h >= 24) { const days = Math.floor(h / 24); return `${days} day${days > 1 ? 's' : ''} ago`; }
  if (h) return `${h}h ${m}min ago`;
  if (m) return s ? `${m}min ${s}s ago` : `${m}min ago`;
  return `${s}s ago`;
}

// ---------- Linux permission bits ----------
const modeNum = (mode) => Number.parseInt(String(mode ?? '0'), 8) || 0;
const modeStr = (n) => n.toString(8).padStart(n > 0o777 ? 4 : 3, '0');

function modeText(node) {
  const m = modeNum(node.mode);
  const triad = (bits, special, letter) => `${bits & 4 ? 'r' : '-'}${bits & 2 ? 'w' : '-'}${
    special ? (bits & 1 ? letter : letter.toUpperCase()) : (bits & 1 ? 'x' : '-')}`;
  return (node.type === 'dir' ? 'd' : '-') + triad((m >> 6) & 7, m & 0o4000, 's')
    + triad((m >> 3) & 7, m & 0o2000, 's') + triad(m & 7, m & 0o1000, 't');
}

const CLAUSE = /^([ugoa]*)((?:[-+=](?:[ugo]|[rwxXst]*))+)$/;
const SHIFT = { u: 6, g: 3, o: 0 };

// chmod symbolic modes per chmod(1): [ugoa...][[-+=][perms...]...]; with no ugoa the umask bits are left alone.
function symbolicMode(start, spec, isDir, umask) {
  let mode = start;
  for (const clause of spec.split(',')) {
    const m = CLAUSE.exec(clause);
    if (!m) return null;
    const who = m[1] === '' || m[1].includes('a') ? 'ugo' : m[1];
    const masked = m[1] === '' ? umask : 0;
    for (const [, op, perms] of m[2].matchAll(/([-+=])([ugo]|[rwxXst]*)/g)) {
      let rwx = 0;
      let special = 0;
      if (/^[ugo]$/.test(perms)) rwx = (mode >> SHIFT[perms]) & 7;
      else {
        for (const c of perms) {
          if (c === 'r') rwx |= 4;
          else if (c === 'w') rwx |= 2;
          else if (c === 'x' || (c === 'X' && (isDir || (mode & 0o111)))) rwx |= 1;
          else if (c === 's') special |= (who.includes('u') ? 0o4000 : 0) | (who.includes('g') ? 0o2000 : 0);
          else if (c === 't' && who.includes('o')) special |= 0o1000;
        }
      }
      let bits = special;
      let classes = 0;
      for (const w of new Set(who)) { bits |= rwx << SHIFT[w]; classes |= 7 << SHIFT[w]; }
      bits &= ~masked;
      if (op === '+') mode |= bits;
      else if (op === '-') mode &= ~bits;
      else mode = (mode & ~(classes & ~masked)) | bits;
    }
  }
  return mode;
}

function parseMode(spec, current, isDir, umask) {
  if (/^[0-7]{1,4}$/.test(spec)) return Number.parseInt(spec, 8);
  return symbolicMode(current, spec, isDir, umask);
}

// ---------- predicates ----------
const OPS = {
  eq: (a, b) => a === b,
  ne: (a, b) => a !== b,
  in: (a, b) => Array.isArray(b) && b.includes(a),
  notin: (a, b) => Array.isArray(b) && !b.includes(a),
  gte: (a, b) => typeof a === 'number' && a >= b,
  lte: (a, b) => typeof a === 'number' && a <= b,
  truthy: (a) => !!a,
  falsy: (a) => !a,
  matches: (a, b, flags) => { try { return new RegExp(b, flags).test(String(a ?? '')); } catch { return false; } },
  hasBits: (a, b) => a !== undefined && (modeNum(a) & modeNum(b)) === modeNum(b),
  lacksBits: (a, b) => a !== undefined && (modeNum(a) & modeNum(b)) === 0,
};

// ---------- parsing ----------
function tokenize(line, os, trackGlob = false) {
  const words = [];
  let word = '';
  let glob = [];
  let open = false;
  let quote = '';
  const append = (c, active) => { word += c; glob.push(active); };
  const push = () => { words.push(trackGlob ? { word, glob } : word); word = ''; glob = []; open = false; };
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (quote) { if (c === quote) quote = ''; else append(c, false); continue; }
    if (c === '"' || (c === "'" && os !== 'windows-cmd')) { quote = c; open = true; continue; }
    if (c === '\\' && os === 'linux' && i + 1 < line.length) { append(line[i + 1], false); i += 1; open = true; continue; }
    if (c === ' ' || c === '\t') { if (open) push(); continue; }
    append(c, true);
    open = true;
  }
  if (open) push();
  return words;
}

function splitPipes(line) {
  const parts = [];
  let current = '';
  let quote = '';
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (quote) { if (c === quote) quote = ''; current += c; continue; }
    if (c === '"' || c === "'") { quote = c; current += c; continue; }
    if (c === '\\' && i + 1 < line.length) { current += c + line[i + 1]; i += 1; continue; }
    if (c === '|') { parts.push(current.trim()); current = ''; continue; }
    current += c;
  }
  parts.push(current.trim());
  return parts;
}

function globRe(glob, ignoreCase) {
  let source = '^';
  for (const c of glob) source += c === '*' ? '.*' : c === '?' ? '.' : /[\\^$.|+(){}]/.test(c) ? `\\${c}` : c;
  return new RegExp(`${source}$`, ignoreCase ? 'i' : '');
}

// GNU grep basic regular expressions: \| \+ \? \( \) \{ \} are the operators.
function breToJs(pattern) {
  let out = '';
  for (let i = 0; i < pattern.length; i += 1) {
    const c = pattern[i];
    if (c === '\\' && i + 1 < pattern.length) {
      const next = pattern[i + 1];
      out += '|+?(){}'.includes(next) ? next : `\\${next}`;
      i += 1;
    } else out += '|+?(){}'.includes(c) ? `\\${c}` : c;
  }
  return out;
}

// GNU style short/long options. Returns { flags, values, operands } or { error }.
function gnuOptions(cmd, args, { short = '', valued = '', long = {} } = {}, badExit = 1) {
  const flags = new Set();
  const values = {};
  const operands = [];
  const bad = (text) => ({ error: { out: '', err: `${cmd}: ${text}\nTry '${cmd} --help' for more information.`, exit: badExit } });
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--') { operands.push(...args.slice(i + 1)); break; }
    if (a.startsWith('--')) {
      const [name, inline] = a.slice(2).split('=');
      const flag = long[name];
      if (!flag) return bad(`unrecognized option '${a}'`);
      if (valued.includes(flag)) values[flag] = inline ?? args[(i += 1)];
      else flags.add(flag);
    } else if (a.startsWith('-') && a.length > 1) {
      for (let j = 1; j < a.length; j += 1) {
        const c = a[j];
        if (valued.includes(c)) { values[c] = a.slice(j + 1) || args[(i += 1)]; break; }
        if (!short.includes(c)) return bad(`invalid option -- '${c}'`);
        flags.add(c);
      }
    } else operands.push(a);
  }
  return { flags, values, operands };
}

// ---------- paths ----------
function collapse(segments) {
  const out = [];
  for (const s of segments) {
    if (!s || s === '.') continue;
    if (s === '..') out.pop();
    else out.push(s);
  }
  return out;
}

const LINUX_PATH = {
  sep: '/',
  isRoot: (p) => p === '/',
  parent: (p) => (p === '/' ? null : p.slice(0, p.lastIndexOf('/')) || '/'),
  base: (p) => (p === '/' ? '/' : p.slice(p.lastIndexOf('/') + 1)),
  join: (dir, name) => (dir === '/' ? `/${name}` : `${dir}/${name}`),
  same: (a, b) => a === b,
  within: (p, dir) => dir === '/' || p === dir || p.startsWith(`${dir}/`),
  resolve(raw, cwd, home) {
    let p = String(raw);
    if (p === '~' || p.startsWith('~/')) p = home + p.slice(1);
    if (!p.startsWith('/')) p = `${cwd}/${p}`;
    return `/${collapse(p.split('/')).join('/')}`;
  },
};

const winRootOf = (p) => (p.startsWith('\\\\') ? p.split('\\').slice(0, 4).join('\\') : `${p.slice(0, 2).toUpperCase()}\\`);

const WIN_PATH = {
  sep: '\\',
  isRoot: (p) => p === winRootOf(p),
  parent(p) {
    if (WIN_PATH.isRoot(p)) return null;
    const head = p.slice(0, p.lastIndexOf('\\'));
    return /^[A-Za-z]:$/.test(head) ? `${head}\\` : head;
  },
  base: (p) => (WIN_PATH.isRoot(p) ? p : p.slice(p.lastIndexOf('\\') + 1)),
  join: (dir, name) => (dir.endsWith('\\') ? dir + name : `${dir}\\${name}`),
  same: (a, b) => a.toLowerCase() === b.toLowerCase(),
  within(p, dir) {
    const a = p.toLowerCase();
    const b = dir.toLowerCase();
    return a === b || a.startsWith(b.endsWith('\\') ? b : `${b}\\`);
  },
  resolve(raw, cwd, home, tilde) {
    let s = String(raw).replace(/\//g, '\\');
    if (tilde && (s === '~' || s.startsWith('~\\'))) s = home + s.slice(1);
    const cwdRoot = winRootOf(cwd);
    const cwdRest = cwd.slice(cwdRoot.length);
    let root;
    let rest;
    const drive = /^([A-Za-z]):(.*)$/.exec(s);
    if (drive) {
      root = `${drive[1].toUpperCase()}:\\`;
      rest = drive[2];
      if (!rest.startsWith('\\') && WIN_PATH.same(root, cwdRoot)) rest = `${cwdRest}\\${rest}`;
    } else if (s.startsWith('\\\\')) { root = winRootOf(s); rest = s.slice(root.length); }
    else if (s.startsWith('\\')) { root = cwdRoot; rest = s; }
    else { root = cwdRoot; rest = `${cwdRest}\\${s}`; }
    const segments = collapse(rest.split('\\'));
    return segments.length ? WIN_PATH.join(root, segments.join('\\')) : root;
  },
};

// ---------- IPv4 ----------
const ipToInt = (ip) => ip.split('.').reduce((n, octet) => (n * 256) + Number(octet), 0);
const intToIp = (n) => [24, 16, 8, 0].map((s) => Math.floor(n / 2 ** s) % 256).join('.');
const maskToPrefix = (mask) => ipToInt(mask).toString(2).replace(/0+$/, '').length;
const networkOf = (ip, prefix) => Math.floor(ipToInt(ip) / 2 ** (32 - prefix)) * 2 ** (32 - prefix);
const sameSubnet = (a, b, prefix) => networkOf(a, prefix) === networkOf(b, prefix);
const isApipa = (ip) => String(ip).startsWith('169.254.');

function msText(ms) {
  if (ms < 1) return ms.toFixed(3);
  if (ms < 10) return ms.toFixed(2);
  if (ms < 100) return ms.toFixed(1);
  return ms.toFixed(0);
}

function columns(widths, cells) {
  return cells.map((cell, i) => {
    const [w, align] = widths[i] ?? [0, 'l'];
    return align === 'r' ? String(cell).padStart(w) : String(cell).padEnd(w);
  }).join(' ').trimEnd();
}

function listBlock(pairs) {
  const width = Math.max(...pairs.map(([label]) => label.length));
  return `\n${pairs.map(([label, value]) => `${label.padEnd(width)} : ${value}`.trimEnd()).join('\n')}\n`;
}

// ---------- reference text: man pages, cmd help, /? usage ----------
const MAN = {
  pwd: [1, 'print name of current/working directory', 'pwd [OPTION]...'],
  ls: [1, 'list directory contents', 'ls [OPTION]... [FILE]...'],
  cat: [1, 'concatenate files and print on the standard output', 'cat [OPTION]... [FILE]...'],
  less: [1, 'opposite of more', 'less [options] [file...]'],
  head: [1, 'output the first part of files', 'head [OPTION]... [FILE]...'],
  tail: [1, 'output the last part of files', 'tail [OPTION]... [FILE]...'],
  mkdir: [1, 'make directories', 'mkdir [OPTION]... DIRECTORY...'],
  rm: [1, 'remove files or directories', 'rm [OPTION]... [FILE]...'],
  cp: [1, 'copy files and directories', 'cp [OPTION]... [-T] SOURCE DEST\n       cp [OPTION]... SOURCE... DIRECTORY'],
  mv: [1, 'move (rename) files', 'mv [OPTION]... [-T] SOURCE DEST\n       mv [OPTION]... SOURCE... DIRECTORY'],
  touch: [1, 'change file timestamps', 'touch [OPTION]... FILE...'],
  truncate: [1, 'shrink or extend the size of a file to the specified size', 'truncate OPTION... FILE...'],
  chmod: [1, 'change file mode bits', 'chmod [OPTION]... MODE[,MODE]... FILE...\n       chmod [OPTION]... OCTAL-MODE FILE...'],
  chown: [1, 'change file owner and group', 'chown [OPTION]... [OWNER][:[GROUP]] FILE...'],
  chgrp: [1, 'change group ownership', 'chgrp [OPTION]... GROUP FILE...'],
  grep: [1, 'print lines that match patterns', 'grep [OPTION...] PATTERNS [FILE...]'],
  find: [1, 'search for files in a directory hierarchy', 'find [-H] [-L] [-P] [-D debugopts] [-Olevel] [starting-point...] [expression]'],
  df: [1, 'report file system space usage', 'df [OPTION]... [FILE]...'],
  du: [1, 'estimate file space usage', 'du [OPTION]... [FILE]...'],
  ps: [1, 'report a snapshot of the current processes.', 'ps [options]'],
  top: [1, 'display Linux processes', 'top -hv|-bcEeHiOSs1 -d secs -n max -u|U user -p pids -o field -w [cols]'],
  kill: [1, 'terminate a process', 'kill [-signal|-s signal|-p] [-q value] [-a] [--] pid|name...'],
  sudo: [8, 'execute a command as another user', 'sudo [-u user] [-i | -s] [command [arg ...]]'],
  su: [1, 'run a command with substitute user and group ID', 'su [options] [-] [user [argument...]]'],
  apt: [8, 'command-line interface', 'apt [-h] [-o=config_string] [-c=config_file] [-t=target_release] [-a=architecture]\n           {list | search | show | update | install pkg... | remove pkg... | upgrade | full-upgrade}'],
  dnf: [8, 'DNF Command Reference', 'dnf [options] <command> [<args>...]'],
  systemctl: [1, 'Control the systemd system and service manager', 'systemctl [OPTIONS...] COMMAND [UNIT...]'],
  ip: [8, 'show / manipulate routing, network devices, interfaces and tunnels', 'ip [ OPTIONS ] OBJECT { COMMAND | help }'],
  ping: [8, 'send ICMP ECHO_REQUEST to network hosts', 'ping [-aAbBdCDfhHLnOqrRUvV46] [-c count] [-i interval] [-W timeout] destination'],
  dig: [1, 'DNS lookup utility', 'dig [@server] [-b address] [-p port#] [-q name] [-t type] [-x addr] [name] [type] [class] [queryopt...]'],
  nslookup: [1, 'query Internet name servers interactively', 'nslookup [-option] [name | -] [server]'],
  man: [1, 'an interface to the system reference manuals', 'man [man options] [[section] page ...] ...'],
  whoami: [1, 'print effective user name', 'whoami [OPTION]...'],
  hostname: [1, "show or set the system's host name", 'hostname [-s|--short] [-f|--fqdn] [-i|--ip-address]'],
  clear: [1, 'clear the terminal screen', 'clear [-Ttype] [-V] [-x]'],
};

const CMD_INFO = {
  cd: ['Displays the name of or changes the current directory.', 'CHDIR [/D] [drive:][path]\nCHDIR [..]\nCD [/D] [drive:][path]\nCD [..]\n\n  ..   Specifies that you want to change to the parent directory.'],
  chkdsk: ['Checks a disk and displays a status report.', 'CHKDSK [volume[[path]filename]]] [/F] [/V] [/R] [/X] [/I] [/C] [/L[:size]] [/B] [/scan] [/spotfix]\n\n  volume              Specifies the drive letter (followed by a colon),\n                      mount point, or volume name.\n  /F                  Fixes errors on the disk.\n  /R                  Locates bad sectors and recovers readable information\n                      (implies /F, when /scan not specified).\n  /X                  Forces the volume to dismount first if necessary.'],
  cls: ['Clears the screen.', 'CLS'],
  copy: ['Copies one or more files to another location.', 'COPY [/D] [/V] [/N] [/Y | /-Y] [/Z] [/L] [/A | /B ] source [/A | /B]\n     [+ source [/A | /B] [+ ...]] [destination [/A | /B]]\n\n  /Y           Suppresses prompting to confirm you want to overwrite an\n               existing destination file.'],
  del: ['Deletes one or more files.', 'DEL [/P] [/F] [/S] [/Q] [/A[[:]attributes]] names\nERASE [/P] [/F] [/S] [/Q] [/A[[:]attributes]] names\n\n  /F            Force deleting of read-only files.\n  /S            Delete specified files from all subdirectories.\n  /Q            Quiet mode, do not ask if ok to delete on global wildcard'],
  dir: ['Displays a list of files and subdirectories in a directory.', 'DIR [drive:][path][filename] [/A[[:]attributes]] [/B] [/C] [/D] [/L] [/N]\n  [/O[[:]sortorder]] [/P] [/Q] [/R] [/S] [/T[[:]timefield]] [/W] [/X] [/4]\n\n  /A          Displays files with specified attributes.\n  /B          Uses bare format (no heading information or summary).'],
  diskpart: ['Displays or configures Disk Partition properties.', 'Microsoft DiskPart version 10.0\n\nDISKPART [/s <script>] [/?]'],
  dism: ['Deployment Image Servicing and Management tool.', 'DISM.exe {/Image:<path_to_offline_image> | /Online} [dism_options]\n         {servicing_command} [<servicing_arguments>]\n\nIMAGE CLEANUP OPTIONS:\n\n  /Cleanup-Image /CheckHealth     Reports whether the image is healthy, repairable or non-repairable.\n  /Cleanup-Image /ScanHealth      Scans the component store for corruption.\n  /Cleanup-Image /RestoreHealth   Scans for corruption and repairs it. Use /Source and\n                                  /LimitAccess to choose where repair files come from.'],
  exit: ['Quits the CMD.EXE program (command interpreter).', 'EXIT [/B] [exitCode]'],
  format: ['Formats a disk for use with Windows.', 'FORMAT volume [/FS:file-system] [/V:label] [/Q] [/L[:state]] [/A:size] [/C] [/I:state] [/X] [/P:passes] [/S:state]\n\n  volume          Specifies the drive letter (followed by a colon),\n                  mount point, or volume name.\n  /FS:filesystem  Specifies the type of the file system (FAT, FAT32, exFAT,\n                  NTFS, UDF, ReFS).\n  /V:label        Specifies the volume label.\n  /Q              Performs a quick format.'],
  gpresult: ['Displays Group Policy information for machine or user.', 'GPRESULT [/S system [/U username [/P [password]]]] [/SCOPE scope]\n           [/USER targetusername] [/R | /V | /Z] [(/X | /H) <filename> [/F]]\n\n    /R             Displays RSoP summary data.'],
  gpupdate: ['Updates multiple Group Policy settings.', 'GPUpdate [/Target:{Computer | User}] [/Force] [/Wait:<value>]\n          [/Logoff] [/Boot] [/Sync]\n\n    /Force: Reapplies all policy settings. By default, only policy settings\n            that have changed are applied.'],
  help: ['Provides Help information for Windows commands.', 'HELP [command]'],
  hostname: ['Prints the name of the current host.', 'hostname'],
  ipconfig: ['Displays and refreshes TCP/IP configuration values.', 'USAGE:\n    ipconfig [/allcompartments] [/? | /all |\n                                 /renew [adapter] | /release [adapter] |\n                                 /renew6 [adapter] | /release6 [adapter] |\n                                 /flushdns | /displaydns | /registerdns |\n                                 /showclassid adapter |\n                                 /setclassid adapter [classid] ]'],
  md: ['Creates a directory.', 'MKDIR [drive:]path\nMD [drive:]path'],
  move: ['Moves one or more files from one directory to another directory.', 'To move one or more files:\nMOVE [/Y | /-Y] [drive:][path]filename1[,...] destination\n\nTo rename a directory:\nMOVE [/Y | /-Y] [drive:][path]dirname1 dirname2'],
  net: ['Manages users, groups, services and network connections.', 'The syntax of this command is:\n\nNET\n    [ ACCOUNTS | COMPUTER | CONFIG | CONTINUE | FILE | GROUP | HELP |\n      HELPMSG | LOCALGROUP | PAUSE | SESSION | SHARE | START |\n      STATISTICS | STOP | TIME | USE | USER | VIEW ]'],
  netstat: ['Displays protocol statistics and current TCP/IP network connections.', 'NETSTAT [-a] [-b] [-e] [-f] [-i] [-n] [-o] [-p proto] [-r] [-s] [-t] [-x] [-y] [interval]\n\n  -a            Displays all connections and listening ports.\n  -n            Displays addresses and port numbers in numerical form.\n  -o            Displays the owning process ID associated with each connection.'],
  nslookup: ['Queries DNS servers.', 'Usage:\n   nslookup [-opt ...]             # interactive mode using default server\n   nslookup [-opt ...] - server    # interactive mode using \'server\'\n   nslookup [-opt ...] host        # just look up \'host\' using default server\n   nslookup [-opt ...] host server # just look up \'host\' using \'server\''],
  pathping: ['Traces a route and measures loss at each hop.', 'Usage: pathping [-g host-list] [-h maximum_hops] [-i address] [-n]\n                [-p period] [-q num_queries] [-w timeout]\n                [-4] [-6] target_name'],
  ping: ['Sends ICMP echo requests.', 'Usage: ping [-t] [-a] [-n count] [-l size] [-f] [-i TTL] [-v TOS]\n            [-r count] [-s count] [[-j host-list] | [-k host-list]]\n            [-w timeout] [-R] [-S srcaddr] [-c compartment] [-p]\n            [-4] [-6] target_name'],
  rd: ['Removes a directory.', 'RMDIR [/S] [/Q] [drive:]path\nRD [/S] [/Q] [drive:]path\n\n    /S      Removes all directories and files in the specified directory\n            in addition to the directory itself.  Used to remove a directory\n            tree.\n\n    /Q      Quiet mode, do not ask if ok to remove a directory tree with /S'],
  robocopy: ['Advanced utility to copy files and directory trees', `${RULE79}\n   ROBOCOPY     ::     Robust File Copy for Windows\n${RULE79}\n\n             Usage :: ROBOCOPY source destination [file [file]...] [options]\n\n                /S :: copy Subdirectories, but not empty ones.\n                /E :: copy subdirectories, including Empty ones.\n              /MIR :: MIRror a directory tree (equivalent to /E plus /PURGE).\n             /PURGE :: delete dest files/dirs that no longer exist in source.\n              /MOV :: MOVe files (delete from source after copying).\n             /MOVE :: MOVE files AND dirs (delete from source after copying).`],
  sfc: ['Scans and repairs protected Windows system files.', 'Microsoft (R) Windows (R) Resource Checker Version 6.0\nCopyright (C) Microsoft Corporation. All rights reserved.\n\nScans the integrity of all protected system files and replaces incorrect versions with\ncorrect Microsoft versions.\n\nSFC [/SCANNOW] [/VERIFYONLY] [/SCANFILE=<file>] [/VERIFYFILE=<file>]\n\n/SCANNOW        Scans integrity of all protected system files and repairs files with\n                problems when possible.\n/VERIFYONLY     Scans integrity of all protected system files. No repair operation is\n                performed.'],
  shutdown: ['Allows proper local or remote shutdown of machine.', 'Usage: shutdown [/i | /l | /s | /sg | /r | /g | /a | /p | /h | /e | /o] [/hybrid] [/soft] [/fw] [/f]\n    [/m \\\\computer][/t xxx][/d [p|u:]xx:yy [/c "comment"]]\n\n    /s         Shutdown the computer.\n    /r         Full shutdown and restart the computer.\n    /a         Abort a system shutdown.\n    /t xxx     Set the time-out period before shutdown to xxx seconds.'],
  taskkill: ['Kill or stop a running process or application.', 'TASKKILL [/S system [/U username [/P [password]]]]\n         { [/FI filter] [/PID processid | /IM imagename] } [/T] [/F]\n\nDescription:\n    This tool is used to terminate tasks by process id (PID) or image name.'],
  tasklist: ['Displays all currently running tasks including services.', 'TASKLIST [/S system [/U username [/P [password]]]]\n         [/M [module] | /SVC | /V] [/FI filter] [/FO format] [/NH]\n\nDescription:\n    This tool displays a list of currently running processes on\n    either a local or remote machine.'],
  tracert: ['Traces the route to a destination.', 'Usage: tracert [-d] [-h maximum_hops] [-j host-list] [-w timeout]\n               [-R] [-S srcaddr] [-4] [-6] target_name'],
  type: ['Displays the contents of a text file.', 'TYPE [drive:][path]filename'],
  whoami: ['Displays user, group and privileges information.', 'WHOAMI [/UPN | /FQDN | /LOGONID]\n\nWHOAMI { [/USER] [/GROUPS] [/CLAIMS] [/PRIV] } [/FO format] [/NH]'],
  winver: ['Shows the Windows version (About Windows).', 'winver'],
  xcopy: ['Copies files and directory trees.', 'XCOPY source [destination] [/A | /M] [/D[:date]] [/P] [/S [/E]] [/V] [/W]\n                           [/C] [/I] [/Q] [/F] [/L] [/G] [/H] [/R] [/T] [/U]\n                           [/K] [/N] [/O] [/X] [/Y] [/-Y] [/Z] [/B] [/J]\n\n  /S           Copies directories and subdirectories except empty ones.\n  /E           Copies directories and subdirectories, including empty ones.\n  /I           If destination does not exist and copying more than one file,\n               assumes that destination must be a directory.'],
};

const CMD_ALIASES = { chdir: 'cd', mkdir: 'md', rmdir: 'rd', erase: 'del' };
const PS_EXTERNAL = ['chkdsk', 'diskpart', 'dism', 'format', 'gpresult', 'gpupdate', 'hostname', 'ipconfig', 'net', 'netstat', 'nslookup', 'pathping', 'ping', 'robocopy', 'sfc', 'shutdown', 'taskkill', 'tasklist', 'tracert', 'whoami', 'winver', 'xcopy'];
const PS_CMDLETS = {
  'Get-Service': 'Gets the services on the computer.',
  'Start-Service': 'Starts one or more stopped services.',
  'Stop-Service': 'Stops one or more running services.',
  'Restart-Service': 'Stops and then starts one or more services.',
  'Get-Process': 'Gets the processes that are running on the local computer.',
  'Stop-Process': 'Stops one or more running processes.',
  'Get-NetIPConfiguration': 'Gets IP network configuration.',
  'Test-NetConnection': 'Displays diagnostic information for a connection.',
  'Get-ChildItem': 'Gets the items and child items in one or more specified locations.',
  'Copy-Item': 'Copies an item from one location to another.',
  'Move-Item': 'Moves an item from one location to another.',
  'Remove-Item': 'Deletes the specified items.',
  'Get-Content': 'Gets the content of the item at the specified location.',
  'Set-Location': 'Sets the current working location to a specified location.',
  'Get-Location': 'Gets information about the current working location.',
  'New-Item': 'Creates a new item.',
  'Start-Process': 'Starts one or more processes on the local computer.',
  'Clear-Host': 'Clears the display in the host program.',
};
const PS_SYNTAX = {
  'Get-Service': 'Get-Service [[-Name] <string[]>] [-DisplayName <string[]>]',
  'Start-Service': 'Start-Service [-Name] <string[]>',
  'Stop-Service': 'Stop-Service [-Name] <string[]> [-Force]',
  'Restart-Service': 'Restart-Service [-Name] <string[]> [-Force]',
  'Get-Process': 'Get-Process [[-Name] <string[]>] [-Id <int[]>]',
  'Stop-Process': 'Stop-Process [-Id] <int[]> [-Force]\nStop-Process -Name <string[]> [-Force]',
  'Get-NetIPConfiguration': 'Get-NetIPConfiguration [[-InterfaceAlias] <string>] [-Detailed]',
  'Test-NetConnection': 'Test-NetConnection [[-ComputerName] <string>] [-Port <int>]',
  'Get-ChildItem': 'Get-ChildItem [[-Path] <string[]>] [[-Filter] <string>] [-Recurse] [-Force] [-File] [-Directory]',
  'Copy-Item': 'Copy-Item [-Path] <string[]> [[-Destination] <string>] [-Recurse] [-Force]',
  'Move-Item': 'Move-Item [-Path] <string[]> [[-Destination] <string>] [-Force]',
  'Remove-Item': 'Remove-Item [-Path] <string[]> [-Recurse] [-Force]',
  'Get-Content': 'Get-Content [-Path] <string[]> [-TotalCount <long>] [-Tail <int>]',
  'Set-Location': 'Set-Location [[-Path] <string>]',
  'Get-Location': 'Get-Location',
  'New-Item': 'New-Item [-Path] <string[]> [-ItemType <string>] [-Name <string>]',
  'Start-Process': 'Start-Process [-FilePath] <string> [-Verb <string>]',
  'Clear-Host': 'Clear-Host',
};
const PS_ALIASES = {
  dir: 'Get-ChildItem', ls: 'Get-ChildItem', gci: 'Get-ChildItem',
  cd: 'Set-Location', chdir: 'Set-Location', sl: 'Set-Location',
  pwd: 'Get-Location', gl: 'Get-Location',
  cat: 'Get-Content', type: 'Get-Content', gc: 'Get-Content',
  copy: 'Copy-Item', cp: 'Copy-Item', cpi: 'Copy-Item',
  move: 'Move-Item', mv: 'Move-Item', mi: 'Move-Item',
  del: 'Remove-Item', erase: 'Remove-Item', rm: 'Remove-Item', rmdir: 'Remove-Item', rd: 'Remove-Item', ri: 'Remove-Item',
  ps: 'Get-Process', gps: 'Get-Process', kill: 'Stop-Process', spps: 'Stop-Process',
  gsv: 'Get-Service', sasv: 'Start-Service', spsv: 'Stop-Service',
  ni: 'New-Item', mkdir: 'New-Item', md: 'New-Item', start: 'Start-Process', saps: 'Start-Process',
  cls: 'Clear-Host', clear: 'Clear-Host',
};

const LOCAL_GROUPS = {
  Administrators: 'Administrators have complete and unrestricted access to the computer/domain',
  'Backup Operators': 'Backup Operators can override security restrictions for the sole purpose of backing up or restoring files',
  Guests: 'Guests have the same access as members of the Users group by default, except for the Guest account which is further restricted',
  'Remote Desktop Users': 'Members in this group are granted the right to logon remotely',
  Users: 'Users are prevented from making accidental or intentional system-wide changes and can run most applications',
};

const CBS_NOTE = 'For online repairs, details are included in the CBS log file located at\nwindir\\Logs\\CBS\\CBS.log. For example C:\\Windows\\Logs\\CBS\\CBS.log. For offline\nrepairs, details are included in the log file provided by the /OFFLOGFILE flag.';
const ACCESS_DENIED_NET = 'System error 5 has occurred.\n\nAccess is denied.\n';

// ---------- initial runtime ----------
function normalizeNode(node, win) {
  const type = node.type === 'dir' ? 'dir' : 'file';
  const out = { ...copy(node), type };
  if (!win) {
    out.owner = node.owner ?? 'root';
    out.group = node.group ?? out.owner;
    out.mode = modeStr(modeNum(node.mode ?? (type === 'dir' ? '755' : '644')));
  }
  if (type === 'file' && out.content === undefined && out.size === undefined) out.content = '';
  return out;
}

function initialRuntime(caseDef) {
  const win = caseDef.os !== 'linux';
  const P = win ? WIN_PATH : LINUX_PATH;
  const user = caseDef.user ?? (win ? 'User' : 'student');
  const home = caseDef.home ?? (win ? `C:\\Users\\${user}` : `/home/${user}`);
  const anchor = win ? 'C:\\' : '/';
  const fs = {};
  const lower = new Set();
  const has = (p) => lower.has(win ? p.toLowerCase() : p);
  const add = (p, node) => { if (!has(p)) { fs[p] = node; lower.add(win ? p.toLowerCase() : p); } };
  for (const [raw, node] of Object.entries(caseDef.fs ?? {})) add(P.resolve(raw, anchor, home, true), normalizeNode(node, win));
  const defaults = win
    ? { 'C:\\Windows': { protected: true }, 'C:\\Windows\\System32': { protected: true }, 'C:\\Program Files': { protected: true }, 'C:\\Users': {}, [home]: {} }
    : { '/root': { mode: '700' }, '/tmp': { mode: '1777' }, '/home': {}, [home]: { owner: user, group: user, mode: '750' } };
  for (const [p, extra] of Object.entries(defaults)) add(p, normalizeNode({ type: 'dir', ...extra }, win));
  const cwd = P.resolve(caseDef.cwd ?? home, anchor, home, true);
  add(cwd, normalizeNode({ type: 'dir' }, win));
  const ownDir = win ? {} : { owner: user, group: user, mode: '775' };
  for (const p of Object.keys(fs)) {
    for (let d = P.parent(p); d; d = P.parent(d)) add(d, normalizeNode({ type: 'dir', ...(P.within(d, home) ? ownDir : {}) }, win));
  }
  if (!win) add('/', normalizeNode({ type: 'dir' }, false));
  const state = copy(caseDef.state ?? {});
  if (win) {
    initWindowsState(state, user);
    for (const letter of Object.keys(state.volumes)) add(`${letter}\\`, normalizeNode({ type: 'dir' }, true));
  } else initLinuxState(state, caseDef, user, fs);
  return {
    fs, state, pending: null, history: [],
    session: { user, admin: win && !!caseDef.admin, cwd, home, stack: [], mode: '', disk: null, part: null, sudoOk: false },
  };
}

function initLinuxState(state, caseDef, user, fs) {
  const admins = ['fedora', 'rhel'].includes(caseDef.distro) ? 'wheel' : 'sudo';
  const users = { root: { uid: 0, groups: ['root'] }, [user]: { uid: 1000, groups: caseDef.sudoer === false ? [user] : [user, admins] } };
  let uid = 999;
  for (const node of Object.values(fs)) {
    if (!users[node.owner]) { users[node.owner] = { uid, groups: [node.group] }; uid -= 1; }
  }
  state.users = { ...users, ...state.users };
  const groups = new Set([...(state.groups ?? []), ...Object.values(state.users).flatMap((u) => u.groups)]);
  for (const node of Object.values(fs)) groups.add(node.group);
  state.groups = [...groups];
}

function initWindowsState(state, user) {
  state.windows = { version: '24H2', build: '26100.4652', toolVersion: '10.0.26100.1150', systemFiles: 'ok', componentStore: 'healthy', ...state.windows };
  state.volumes = { 'C:': { label: 'Windows', fs: 'NTFS', serial: '6A2F-1C3D', sizeBytes: 510770802688, freeBytes: 112233445566, system: true }, ...state.volumes };
  state.users = {
    Administrator: { active: false, groups: ['Administrators'], comment: 'Built-in account for administering the computer/domain' },
    DefaultAccount: { active: false, groups: ['System Managed Accounts Group'], comment: 'A user account managed by the system.' },
    Guest: { active: false, groups: ['Guests'], comment: 'Built-in account for guest access to the computer/domain' },
    WDAGUtilityAccount: { active: false, groups: [], comment: 'A user account managed and used by the system for Windows Defender Application Guard scenarios.' },
    [user]: { active: true, groups: ['Users'] },
    ...state.users,
  };
  state.mappedDrives = { ...state.mappedDrives };
  for (const disk of Object.values(state.disks ?? {})) {
    for (const part of disk.partitions ?? []) {
      if (!part.letter || state.volumes[`${part.letter}:`]) continue;
      const bytes = Math.round(part.sizeGB * 1024 ** 3);
      state.volumes[`${part.letter}:`] = { label: part.label, fs: part.fs ?? 'RAW', serial: '4C1E-77A2', sizeBytes: bytes, freeBytes: bytes, removable: !!disk.removable, system: !!disk.system };
    }
  }
}

// ---------- the shell ----------
export function createShell(caseDef) {
  if (!OSES.includes(caseDef?.os)) throw new RangeError(`Unknown shell os: ${caseDef?.os}`);
  const os = caseDef.os;
  const win = os !== 'linux';
  const P = win ? WIN_PATH : LINUX_PATH;
  const host = caseDef.host ?? (win ? 'WS-01' : 'host01');
  const distro = caseDef.distro ?? 'ubuntu';
  const packageTool = ['fedora', 'rhel'].includes(distro) ? 'dnf' : 'apt';
  const initial = initialRuntime(caseDef);
  let rt = copy(initial);

  const now = () => rt.state.clock ?? caseDef.now ?? DEFAULT_NOW;
  const ok = (out = '', extra = {}) => ({ out, err: '', exit: 0, ...extra });
  const fail = (err, exit = 1, out = '') => ({ out, err, exit });
  const say = (out, exit) => ({ out, err: '', exit });
  const ask = (kind, text, data = {}, secret = false) => { rt.pending = { kind, text, data, secret }; };

  // ----- state keys -----
  function getKey(path) {
    if (Object.hasOwn(rt.state, path)) return rt.state[path];
    const [head, ...rest] = String(path).split('.');
    let value = head === 'session' ? rt.session : rt.state[head];
    for (const part of rest) value = value?.[part];
    return value;
  }
  function setKey(path, value) {
    const parts = String(path).split('.');
    let target = rt.state;
    for (const part of parts.slice(0, -1)) {
      if (typeof target[part] !== 'object' || target[part] === null) target[part] = {};
      target = target[part];
    }
    target[parts.at(-1)] = value;
  }

  // ----- file system -----
  const loginUser = initial.session.user;
  const homeOf = (u) => (u === loginUser ? rt.session.home : u === 'root' ? '/root' : `/home/${u}`);
  const resolve = (raw) => P.resolve(raw, rt.session.cwd, win ? rt.session.home : homeOf(euid()), os === 'powershell');
  function real(p) {
    if (!win) return p;
    const letter = p.slice(0, 2).toUpperCase();
    const target = /^[A-Z]:$/.test(letter) && rt.state.mappedDrives?.[letter];
    if (!target) return p;
    const rest = p.slice(3);
    return rest ? `${target}\\${rest}` : target;
  }
  function keyOf(p) {
    const r = real(p);
    if (Object.hasOwn(rt.fs, r)) return r;
    if (!win) return undefined;
    const low = r.toLowerCase();
    return Object.keys(rt.fs).find((key) => key.toLowerCase() === low);
  }
  const nodeAt = (p) => { const key = p == null ? undefined : keyOf(p); return key === undefined ? undefined : rt.fs[key]; };
  const nameOrder = (a, b) => {
    const x = win ? a.toLowerCase() : a.replace(/^\.+/, '').toLowerCase();
    const y = win ? b.toLowerCase() : b.replace(/^\.+/, '').toLowerCase();
    return x < y ? -1 : x > y ? 1 : a < b ? -1 : a > b ? 1 : 0;
  };
  function childrenOf(p) {
    const key = keyOf(p);
    if (key === undefined) return [];
    return Object.keys(rt.fs)
      .filter((k) => k !== key && P.parent(k) !== null && P.same(P.parent(k), key))
      .map((k) => ({ name: P.base(k), path: P.join(p, P.base(k)), node: rt.fs[k] }))
      .sort((a, b) => nameOrder(a.name, b.name));
  }
  // Bash expands unquoted pathname patterns before dispatch, including before sudo.
  function expandLinuxWord({ word, glob }) {
    const parts = word.split('/');
    const masks = [];
    let offset = 0;
    for (const part of parts) { masks.push(glob.slice(offset, offset + part.length)); offset += part.length + 1; }
    const absolute = word.startsWith('/');
    let candidates = [{ path: absolute ? '/' : rt.session.cwd, text: '' }];
    let expanded = false;
    for (let i = absolute ? 1 : 0; i < parts.length; i += 1) {
      const part = parts[i];
      const mask = masks[i];
      let source = '^';
      let wildcard = false;
      for (let j = 0; j < part.length; j += 1) {
        const c = part[j];
        if (mask[j] && c === '*') { source += '.*'; wildcard = true; }
        else if (mask[j] && c === '?') { source += '.'; wildcard = true; }
        else if (mask[j] && c === '[') {
          const end = part.indexOf(']', j + 1);
          if (end > j + 1 && mask[end] && mask.slice(j + 1, end).every(Boolean)) {
            const body = part.slice(j + 1, end);
            source += `[${body[0] === '!' ? `^${body.slice(1)}` : body.replace(/^\^/, '\\^')}]`;
            j = end;
            wildcard = true;
          } else source += '\\[';
        } else source += escapeRe(c);
      }
      source += '$';
      const shown = (base, name) => `${base}${base || absolute ? '/' : ''}${name}`;
      if (wildcard) {
        expanded = true;
        const re = new RegExp(source);
        candidates = candidates.flatMap((candidate) => {
          if (nodeAt(candidate.path)?.type !== 'dir' || !may(candidate.path, 5)) return [];
          return childrenOf(candidate.path)
            .filter((child) => (!child.name.startsWith('.') || part.startsWith('.')) && re.test(child.name))
            .map((child) => ({ path: child.path, text: shown(candidate.text, child.name) }));
        });
      } else candidates = candidates.map((candidate) => {
        const text = shown(candidate.text, part);
        return { path: resolve(text), text };
      });
      if (!candidates.length) return [word]; // Bash default: unmatched patterns remain literal.
    }
    if (!expanded) return [word];
    const matches = candidates.filter((candidate) => nodeAt(candidate.path));
    return matches.length ? matches.map((candidate) => candidate.text).sort() : [word];
  }
  function walk(p, denied) {
    const out = [];
    const visit = (path, node) => {
      out.push({ path, node });
      if (node.type !== 'dir') return;
      if (denied && !may(path, 5)) { denied(path); return; }
      for (const child of childrenOf(path)) visit(child.path, child.node);
    };
    const node = nodeAt(p);
    if (node) visit(p, node);
    return out;
  }
  const relative = (base, p) => (P.same(base, p) ? '' : p.slice(base.length + (base.endsWith(P.sep) ? 0 : 1)));
  const sizeOf = (node) => (node.type === 'dir' ? (win ? 0 : 4096) : node.size ?? byteLength(node.content ?? ''));
  function adjustUsage(key, deltaBytes) {
    if (!deltaBytes) return;
    if (win) {
      const vol = rt.state.volumes?.[key.slice(0, 2).toUpperCase()];
      if (vol && typeof vol.freeBytes === 'number') vol.freeBytes = Math.max(0, vol.freeBytes - deltaBytes);
      return;
    }
    const mounts = Object.keys(rt.state.filesystems ?? {}).filter((m) => P.within(key, m)).sort((a, b) => b.length - a.length);
    const fsys = mounts.length ? rt.state.filesystems[mounts[0]] : null;
    if (!fsys) return;
    const k = deltaBytes / 1024;
    fsys.usedK = Math.max(0, Math.round(fsys.usedK + k));
    if (typeof fsys.availK === 'number') fsys.availK = Math.max(0, Math.round(fsys.availK - k));
  }
  function putNode(p, node) {
    const parentKey = keyOf(P.parent(p) ?? p);
    const key = keyOf(p) ?? (parentKey && !P.isRoot(p) ? P.join(parentKey, P.base(p)) : real(p));
    const old = rt.fs[key];
    rt.fs[key] = node;
    if (node.type === 'file') adjustUsage(key, sizeOf(node) - (old?.type === 'file' ? sizeOf(old) : 0));
  }
  function removeTree(p, account = true) {
    const key = keyOf(p);
    if (key === undefined) return;
    for (const k of Object.keys(rt.fs)) {
      if (!P.within(k, key)) continue;
      if (account && rt.fs[k].type === 'file') adjustUsage(k, -sizeOf(rt.fs[k]));
      delete rt.fs[k];
    }
  }
  function moveTree(src, dst) {
    const entries = walk(src).map((e) => [relative(src, e.path), e.node]);
    removeTree(dst, true);
    removeTree(src, false);
    for (const [rel, node] of entries) {
      const to = rel ? P.join(dst, rel) : dst;
      const key = keyOf(P.parent(to) ?? to);
      rt.fs[key && !P.isRoot(to) ? P.join(key, P.base(to)) : real(to)] = node;
    }
  }
  function writeCopy(to, from, meta) {
    const existing = nodeAt(to);
    if (existing && existing.type === 'file') {
      const before = sizeOf(existing);
      if (from.content !== undefined) existing.content = from.content;
      if (from.size !== undefined) existing.size = from.size; else delete existing.size;
      existing.mtime = from.mtime ?? now();
      adjustUsage(keyOf(to), sizeOf(existing) - before);
      return;
    }
    if (existing) return;
    putNode(to, { ...copy(from), ...meta });
  }
  function copyTree(src, dst, meta = () => ({})) {
    for (const e of walk(src)) {
      const rel = relative(src, e.path);
      writeCopy(rel ? P.join(dst, rel) : dst, e.node, meta(e.node));
    }
  }

  // ----- Linux users and permissions -----
  const euid = () => rt.session.user;
  const groupsOf = (u) => rt.state.users?.[u]?.groups ?? [u];
  const umask = () => modeNum(caseDef.umask ?? (euid() === 'root' ? '022' : '002'));
  function bitsFor(node, u) {
    if (u === 'root') return 7;
    const m = modeNum(node.mode);
    if (node.owner === u) return (m >> 6) & 7;
    if (groupsOf(u).includes(node.group)) return (m >> 3) & 7;
    return m & 7;
  }
  function searchable(p, u = euid()) {
    for (let d = P.parent(p); d; d = P.parent(d)) {
      const n = nodeAt(d);
      if (n && !(bitsFor(n, u) & 1)) return false;
    }
    return true;
  }
  function may(p, want, u = euid()) {
    if (win) return true;
    const n = nodeAt(p);
    if (!n || !searchable(p, u)) return false;
    if (u === 'root') return !(want & 1) || n.type === 'dir' || (modeNum(n.mode) & 0o111) !== 0;
    return (bitsFor(n, u) & want) === want;
  }
  const newNode = (type) => ({
    type, owner: euid(), group: groupsOf(euid())[0], mtime: now(),
    mode: modeStr((type === 'dir' ? 0o777 : 0o666) & ~umask()),
    ...(type === 'file' ? { content: '' } : {}),
  });
  function winWritable(p) {
    if (rt.session.admin) return true;
    for (let d = p; d; d = P.parent(d)) if (nodeAt(d)?.protected) return false;
    return true;
  }
  const lookupDenied = (p) => !searchable(p);

  // ----- network model shared by every OS -----
  const net = () => rt.state.network ?? {};
  const hostEntries = () => Object.entries(net().hosts ?? {});
  function addresses() {
    if (win) {
      return Object.entries(net().adapters ?? {})
        .filter(([, a]) => a.connected !== false && a.ipv4)
        .map(([name, a]) => ({ name, ip: a.ipv4, prefix: maskToPrefix(a.mask ?? '255.255.255.0'), gateway: a.gateway, dns: a.dns ?? [] }));
    }
    return Object.entries(net().interfaces ?? {})
      .filter(([, i]) => i.state !== 'DOWN' && i.ipv4)
      .map(([name, i]) => { const [ip, prefix] = i.ipv4.split('/'); return { name, ip, prefix: Number(prefix), gateway: net().gateway, dns: net().dns ?? ['127.0.0.53'] }; });
  }
  const usable = () => addresses().filter((a) => !isApipa(a.ip));
  function hasRoute(ip) {
    if (ip.startsWith('127.')) return true;
    return usable().some((a) => sameSubnet(a.ip, ip, a.prefix) || a.gateway);
  }
  function hostFor(target) {
    const lower = String(target).toLowerCase();
    const named = hostEntries().find(([name]) => name.toLowerCase() === lower);
    if (named) return { name: named[0], ...named[1], ip: named[1].ip ?? (isIp(named[0]) ? named[0] : undefined) };
    if (!isIp(target)) return null;
    const byIp = hostEntries().find(([, h]) => h.ip === target);
    return byIp ? { name: byIp[0], ...byIp[1] } : null;
  }
  const dnsWorks = () => usable().length > 0;
  function lookup(name, useCache) {
    if (isIp(name)) return name;
    if (/^localhost$/i.test(name)) return '127.0.0.1';
    const cached = useCache && win ? Object.entries(net().dnsCache ?? {}).find(([n]) => n.toLowerCase() === name.toLowerCase()) : null;
    if (cached) return cached[1].ip;
    if (!dnsWorks()) return null;
    return hostFor(name)?.ip ?? null;
  }
  function reachable(ip) {
    if (ip.startsWith('127.')) return true;
    if (!hasRoute(ip)) return false;
    const entry = hostFor(ip);
    if (entry) return entry.reachable !== false;
    return usable().some((a) => a.gateway === ip);
  }
  const replyMs = (ip) => hostFor(ip)?.ms ?? (usable().some((a) => a.gateway === ip) ? 1 : 12);
  const reverseName = (ip) => (hostEntries().find(([n, h]) => h.ip === ip && !isIp(n)) ?? [null])[0];

  // ----- predicates and scoring -----
  // True when history entry h is a long listing (ls -l, Linux) whose output shows `target`:
  // an operand that resolves (from the cwd recorded with h) to the file, or to its directory
  // (unless -d). No operand lists h.cwd. Only the first pipeline segment counts, and a shell
  // glob's * and ? never match '/'.
  function listingIncludes(h, target) {
    if (win || typeof h.cwd !== 'string') return false;
    const words = tokenize(splitPipes(h.line)[0], 'linux');
    if (words[0] === 'sudo') words.shift();
    if (words.shift() !== 'ls') return false;
    const options = gnuOptions('ls', words, { short: 'lahdA1', long: { all: 'a', 'almost-all': 'A', 'human-readable': 'h', directory: 'd' } }, 2);
    if (options.error || !options.flags.has('l')) return false;
    const wanted = P.resolve(target, '/', rt.session.home);
    const shown = options.flags.has('d') ? [wanted] : [wanted, P.parent(wanted)];
    const operands = options.operands.length ? options.operands : ['.'];
    return operands.some((raw) => {
      const path = P.resolve(raw, h.cwd, rt.session.home);
      if (!hasWildcard(raw)) return shown.some((p) => P.same(path, p));
      const re = new RegExp(`^${[...path].map((c) => (c === '*' ? '[^/]*' : c === '?' ? '[^/]' : escapeRe(c))).join('')}$`);
      return shown.some((p) => re.test(p));
    });
  }

  function test(pred) {
    if (pred == null) return false;
    if (typeof pred === 'boolean') return pred;
    if (pred.all) return pred.all.every(test);
    if (pred.any) return pred.any.some(test);
    if (pred.not) return !test(pred.not);
    if (pred.ran !== undefined) {
      let re;
      try { re = new RegExp(pred.ran, pred.flags ?? (win ? 'i' : '')); } catch { return false; }
      return rt.history.some((h) => (!pred.ok || h.exit === 0)
        && (pred.cwd === undefined || (typeof h.cwd === 'string' && P.same(h.cwd, pred.cwd)))
        && (pred.lists === undefined || listingIncludes(h, pred.lists))
        && (re.lastIndex = 0, re.test(h.line)));
    }
    if (pred.ranSequence !== undefined) {
      if (!Array.isArray(pred.ranSequence) || pred.ranSequence.length === 0) return false;
      let patterns, resetOn, every;
      try {
        const flags = pred.flags ?? (win ? 'i' : '');
        patterns = pred.ranSequence.map((pattern) => new RegExp(pattern, flags));
        if (pred.resetOn !== undefined) resetOn = new RegExp(pred.resetOn, flags);
        if (pred.every !== undefined) every = new RegExp(pred.every, flags);
      }
      catch { return false; }
      const resetTo = Number.isInteger(pred.resetTo) ? Math.max(0, Math.min(pred.resetTo, patterns.length - 1)) : 0;
      const hit = (re, line) => { re.lastIndex = 0; return re.test(line); };
      let next = 0;
      let matched = false;
      let required = 0;
      for (const h of rt.history) {
        if (h.exit !== 0 || (pred.within !== undefined && h.mode !== pred.within)) continue;
        let advanced = hit(patterns[next], h.line);
        if (!advanced && resetOn && hit(resetOn, h.line)) {
          next = Math.min(next, resetTo);
          advanced = hit(patterns[next], h.line);
        }
        let completed = false;
        if (advanced && ++next === patterns.length) {
          // After a full match the last step may repeat until a reset (clean, clean).
          completed = true;
          matched = true;
          next = patterns.length - 1;
        }
        if (every && hit(every, h.line)) {
          required += 1;
          if (!completed) return false;
        }
      }
      return matched && (!every || required > 0);
    }
    let actual;
    if (pred.path !== undefined) {
      const node = nodeAt(P.resolve(pred.path, win ? 'C:\\' : '/', rt.session.home, true));
      actual = !pred.field ? node : pred.field === 'size' && node ? sizeOf(node) : node?.[pred.field];
    } else actual = getKey(pred.key);
    const op = OPS[pred.op ?? (pred.value === undefined ? 'truthy' : 'eq')];
    return op ? op(actual, pred.value, pred.flags) : false;
  }
  function check() {
    const goals = (caseDef.goals ?? []).map((g) => ({
      id: g.id, pass: test(g.check), text: g.text, why: g.why, expect: g.expect,
      ...(g.weight === undefined ? {} : { weight: g.weight }),
    }));
    const traps = (caseDef.traps ?? []).map((t) => ({
      id: t.id, hit: test(t.check), message: t.message, why: t.why, ...(t.critical ? { critical: true } : {}),
    }));
    return { goals, traps, score: scoreFrom(goals, traps) };
  }
  function finish(res, before) {
    const after = check();
    const out = trimLines([res.err, res.out].filter((part) => part).join('\n'));
    return {
      out, exit: res.exit,
      goalsChanged: after.goals.filter((g, i) => g.pass && !before.goals[i].pass).map((g) => g.id),
      trapsHit: after.traps.filter((t, i) => t.hit && !before.traps[i].hit).map((t) => t.id),
      ...(res.clear ? { clear: true } : {}),
    };
  }

  // ----- scripted responses (SPEC: exact outputs, optionally keyed by state) -----
  function scripted(line) {
    const table = caseDef.responses ?? {};
    const norm = (s) => { const t = s.trim().replace(/\s+/g, ' '); return win ? t.toLowerCase() : t; };
    const target = norm(line);
    const key = Object.keys(table).find((k) => norm(k) === target);
    if (key === undefined) return null;
    const variants = Array.isArray(table[key]) ? table[key] : [table[key]];
    const pick = variants.find((v) => typeof v === 'string' || !v.when || test(v.when));
    if (pick === undefined) return null;
    if (typeof pick === 'string') return ok(pick);
    for (const [path, value] of Object.entries(pick.set ?? {})) setKey(path, value);
    return say(pick.out ?? '', pick.exit ?? 0);
  }

  // =====================================================================
  // Linux (bash on Ubuntu 24.04 by default; distro 'fedora'/'rhel' uses dnf)
  // =====================================================================
  function readText(raw) {
    const p = resolve(raw);
    const n = nodeAt(p);
    if (!n) return { why: lookupDenied(p) ? 'Permission denied' : 'No such file or directory' };
    if (!searchable(p)) return { why: 'Permission denied' };
    if (n.type === 'dir') return { why: 'Is a directory', dir: true };
    if (!may(p, 4)) return { why: 'Permission denied' };
    return { text: n.content ?? '' };
  }

  function lsFormat(entries, flags, withTotal) {
    if (!flags.has('l')) return entries.map((e) => e.name).join(flags.has('1') ? '\n' : '  ');
    const hr = flags.has('h');
    const rows = entries.map((e) => {
      const n = e.node;
      const links = n.type === 'dir' ? 2 + childrenOf(e.path).filter((c) => c.node.type === 'dir').length : 1;
      return [modeText(n), String(links), n.owner, n.group, hr ? human(sizeOf(n)) : String(sizeOf(n)), DATES.ls(n.mtime ?? now(), now()), e.name];
    });
    const w = [1, 2, 3, 4].map((i) => Math.max(0, ...rows.map((r) => r[i].length)));
    const lines = rows.map((r) => `${r[0]} ${r[1].padStart(w[0])} ${r[2].padEnd(w[1])} ${r[3].padEnd(w[2])} ${r[4].padStart(w[3])} ${r[5]} ${r[6]}`);
    if (withTotal) {
      const kb = entries.reduce((sum, e) => sum + (e.node.type === 'dir' ? 4 : Math.ceil(sizeOf(e.node) / 4096) * 4), 0);
      lines.unshift(`total ${hr ? human(kb * 1024) : kb}`);
    }
    return lines.join('\n');
  }

  function headTail(cmd, args, io, pick) {
    const expanded = args.flatMap((a) => (/^-\d+$/.test(a) ? ['-n', a.slice(1)] : [a]));
    const o = gnuOptions(cmd, expanded, { valued: 'n', short: 'qv', long: { lines: 'n' } });
    if (o.error) return o.error;
    const count = Number.parseInt(o.values.n ?? '10', 10);
    if (Number.isNaN(count)) return fail(`${cmd}: invalid number of lines: ‘${o.values.n}’`);
    if (!o.operands.length) return ok(pick(splitLines(io.stdin), count).join('\n'));
    const blocks = [];
    const errs = [];
    for (const raw of o.operands) {
      const r = readText(raw);
      if (r.why) { errs.push(r.dir ? `${cmd}: error reading '${raw}': Is a directory` : `${cmd}: cannot open '${raw}' for reading: ${r.why}`); continue; }
      const body = pick(splitLines(r.text), count).join('\n');
      blocks.push(o.operands.length > 1 ? `==> ${raw} <==\n${body}` : body);
    }
    return { out: blocks.join('\n\n'), err: errs.join('\n'), exit: errs.length ? 1 : 0 };
  }

  function chmodLike(cmd, args, apply) {
    const flags = new Set();
    const rest = [];
    for (const a of args) {
      if (!rest.length && /^-[Rvcf]+$/.test(a)) for (const c of a.slice(1)) flags.add(c);
      else if (!rest.length && a === '--recursive') flags.add('R');
      else rest.push(a);
    }
    if (!rest.length) return fail(`${cmd}: missing operand\nTry '${cmd} --help' for more information.`);
    const [spec, ...files] = rest;
    if (!files.length) return fail(`${cmd}: missing operand after ‘${spec}’\nTry '${cmd} --help' for more information.`);
    const prep = apply.prepare(spec);
    if (prep.error) return fail(prep.error);
    const errs = [];
    for (const raw of files) {
      const p = resolve(raw);
      const n = nodeAt(p);
      if (!n || !searchable(p)) { errs.push(`${cmd}: cannot access '${raw}': ${n ? 'Permission denied' : 'No such file or directory'}`); continue; }
      const targets = flags.has('R') ? walk(p) : [{ path: p, node: n }];
      for (const t of targets) {
        const shown = t.path === p ? raw : `${raw.replace(/\/$/, '')}/${relative(p, t.path)}`;
        const problem = apply.change(t.node, prep);
        if (problem) errs.push(`${cmd}: ${problem} '${shown}': Operation not permitted`);
      }
    }
    return errs.length ? fail(errs.join('\n')) : ok();
  }

  function startService(name, svc) {
    if (svc.startWhen && !test(svc.startWhen)) {
      svc.active = 'failed';
      svc.since = now();
      return fail(`Job for ${name}.service failed because the control process exited with error code.\nSee "systemctl status ${name}.service" and "journalctl -xeu ${name}.service" for details.`);
    }
    if (svc.active !== 'active') {
      svc.active = 'active';
      svc.since = now();
      const t = clock(now());
      svc.log = [`${MONTHS[t.m - 1].slice(0, 3)} ${pad2(t.d)} ${pad2(t.h)}:${pad2(t.mi)}:${pad2(t.s)} ${host} systemd[1]: Started ${name}.service - ${svc.description ?? name}.`];
    }
    return ok();
  }

  function serviceStatus(name, svc) {
    const preset = svc.preset ?? (packageTool === 'apt' ? 'enabled' : 'disabled');
    const dot = svc.active === 'active' ? '●' : svc.active === 'failed' ? '×' : '○';
    const since = svc.since ?? now();
    const active = svc.active === 'active' ? `active (running) since ${DATES.systemd(since)}; ${ago(since, now())}`
      : svc.active === 'failed' ? `failed (Result: exit-code) since ${DATES.systemd(since)}; ${ago(since, now())}` : 'inactive (dead)';
    const lines = [
      `${dot} ${name}.service - ${svc.description ?? name}`,
      `     Loaded: loaded (/usr/lib/systemd/system/${name}.service; ${svc.enabled ? 'enabled' : 'disabled'}; preset: ${preset})`,
      `     Active: ${active}`,
    ];
    if (svc.docs) lines.push(`       Docs: ${svc.docs}`);
    if (svc.active === 'active') lines.push(`   Main PID: ${svc.pid ?? 1200} (${svc.process ?? name})`);
    if (svc.log?.length) lines.push('', ...svc.log);
    return lines.join('\n');
  }

  function aptInstallText(pkgs) {
    const pk = rt.state.packages;
    const lines = [];
    let n = 0;
    for (const name of pkgs) {
      const p = pk.available[name];
      n += 1;
      lines.push(`Get:${n} http://archive.ubuntu.com/ubuntu ${p.repo ?? 'noble/main'} ${p.arch ?? 'amd64'} ${name} ${p.arch ?? 'amd64'} ${p.version} [${p.downloadKB ?? 100} kB]`);
    }
    const total = pkgs.reduce((s, name) => s + (pk.available[name].downloadKB ?? 100), 0);
    lines.push(`Fetched ${commas(total)} kB in 1s (${commas(total)} kB/s)`);
    for (const name of pkgs) {
      const p = pk.available[name];
      lines.push(`Selecting previously unselected package ${name}.`, '(Reading database ... 74512 files and directories currently installed.)',
        `Preparing to unpack .../${name}_${p.version}_${p.arch ?? 'amd64'}.deb ...`, `Unpacking ${name} (${p.version}) ...`);
    }
    for (const name of pkgs) {
      const p = pk.available[name];
      lines.push(`Setting up ${name} (${p.version}) ...`);
      pk.installed[name] = p.version;
      if (p.service) {
        const svc = { description: p.description ?? name, active: 'active', enabled: true, since: now(), ...p.service.state };
        rt.state.services = { ...rt.state.services, [p.service.name]: svc };
        if (svc.enabled) lines.push(`Created symlink /etc/systemd/system/multi-user.target.wants/${p.service.name}.service → /usr/lib/systemd/system/${p.service.name}.service.`);
      }
    }
    lines.push('Processing triggers for man-db (2.12.0-4build2) ...');
    return lines;
  }

  const APT_HEAD = 'Reading package lists... Done\nBuilding dependency tree... Done\nReading state information... Done';
  const APT_LOCK = 'E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)\nE: Unable to acquire the dpkg frontend lock (/var/lib/dpkg/lock-frontend), are you root?';
  const DNF_ROOT = 'Error: This command has to be run with superuser privileges (under the root user on most systems).';

  function packages() {
    rt.state.packages = { updated: false, upgradable: 0, available: {}, installed: {}, ...rt.state.packages };
    rt.state.packages.available ??= {};
    rt.state.packages.installed ??= {};
    return rt.state.packages;
  }

  function aptCmd(args) {
    const yes = args.some((a) => ['-y', '--yes', '--assume-yes'].includes(a));
    const [verb, ...names] = args.filter((a) => !a.startsWith('-'));
    const pk = packages();
    const root = euid() === 'root';
    const summary = (inst, rem) => `0 upgraded, ${inst} newly installed, ${rem} to remove and ${pk.upgradable} not upgraded.`;
    if (!verb) return ok('apt 2.8.3 (amd64)\nUsage: apt [options] command\n\nMost used commands:\n  list - list packages based on package names\n  update - update list of available packages\n  install - install packages\n  remove - remove packages\n  upgrade - upgrade the system by installing/upgrading packages');
    if (verb === 'update') {
      if (!root) return fail('E: Could not open lock file /var/lib/apt/lists/lock - open (13: Permission denied)\nE: Unable to lock directory /var/lib/apt/lists/', 100);
      pk.updated = true;
      const tail = pk.upgradable ? `${pk.upgradable} package${pk.upgradable > 1 ? 's' : ''} can be upgraded. Run 'apt list --upgradable' to see them.` : 'All packages are up to date.';
      return ok(`Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease\nGet:2 http://archive.ubuntu.com/ubuntu noble-updates InRelease [126 kB]\nGet:3 http://security.ubuntu.com/ubuntu noble-security InRelease [126 kB]\nHit:4 http://archive.ubuntu.com/ubuntu noble-backports InRelease\nFetched 252 kB in 1s (310 kB/s)\n${APT_HEAD}\n${tail}`);
    }
    if (verb === 'install') {
      if (!root) return fail(APT_LOCK, 100);
      const missing = names.find((n) => !pk.available[n] || (pk.available[n].needsUpdate && !pk.updated));
      if (missing) return say(`${APT_HEAD}\nE: Unable to locate package ${missing}`, 100);
      const fresh = names.filter((n) => !pk.installed[n]);
      const already = names.filter((n) => pk.installed[n]).map((n) => `${n} is already the newest version (${pk.installed[n]}).`);
      if (!fresh.length) return ok([APT_HEAD, ...already, summary(0, 0)].join('\n'));
      const deps = [...new Set(fresh.flatMap((n) => pk.available[n].depends ?? []))].filter((d) => !pk.installed[d] && pk.available[d] && !fresh.includes(d));
      const all = [...deps, ...fresh];
      const head = [APT_HEAD, ...already];
      if (deps.length) head.push('The following additional packages will be installed:', `  ${deps.join(' ')}`);
      head.push('The following NEW packages will be installed:', `  ${all.join(' ')}`, summary(all.length, 0));
      const dl = all.reduce((s, n) => s + (pk.available[n].downloadKB ?? 100), 0);
      const inst = all.reduce((s, n) => s + (pk.available[n].installedKB ?? 400), 0);
      head.push(`Need to get ${commas(dl)} kB of archives.`, `After this operation, ${commas(inst)} kB of additional disk space will be used.`);
      if (deps.length && !yes) { ask('apt-install', 'Do you want to continue? [Y/n] ', { all }); return ok(head.join('\n')); }
      return ok([...head, ...aptInstallText(all)].join('\n'));
    }
    if (verb === 'remove' || verb === 'purge') {
      if (!root) return fail(APT_LOCK, 100);
      const unknown = names.find((n) => !pk.available[n] && !pk.installed[n]);
      if (unknown) return say(`${APT_HEAD}\nE: Unable to locate package ${unknown}`, 100);
      const present = names.filter((n) => pk.installed[n]);
      const absent = names.filter((n) => !pk.installed[n]).map((n) => `Package '${n}' is not installed, so not removed`);
      if (!present.length) return ok([APT_HEAD, ...absent, summary(0, 0)].join('\n'));
      const head = [APT_HEAD, ...absent, 'The following packages will be REMOVED:', `  ${present.join(' ')}`, summary(0, present.length)];
      if (!yes) { ask('apt-remove', 'Do you want to continue? [Y/n] ', { names: present }); return ok(head.join('\n')); }
      return ok([...head, ...aptRemove(present)].join('\n'));
    }
    if (verb === 'upgrade' || verb === 'full-upgrade') {
      if (!root) return fail(APT_LOCK, 100);
      const count = pk.upgradable;
      pk.upgradable = 0;
      return ok(`${APT_HEAD}\nCalculating upgrade... Done\n${count} upgraded, 0 newly installed, 0 to remove and 0 not upgraded.`);
    }
    if (verb === 'list') {
      const rows = Object.entries(pk.installed).sort().map(([n, v]) => `${n}/noble,now ${v} amd64 [installed]`);
      return ok(['Listing... Done', ...rows].join('\n'));
    }
    return fail(`E: Invalid operation ${verb}`, 100);
  }

  function aptRemove(names) {
    const pk = packages();
    const lines = ['(Reading database ... 74512 files and directories currently installed.)'];
    for (const n of names) {
      lines.push(`Removing ${n} (${pk.installed[n]}) ...`);
      delete pk.installed[n];
      const svc = pk.available[n]?.service?.name;
      if (svc && rt.state.services?.[svc]) delete rt.state.services[svc];
    }
    lines.push('Processing triggers for man-db (2.12.0-4build2) ...');
    return lines;
  }

  function dnfTable(verbWord, names) {
    const pk = packages();
    const rows = names.map((n) => {
      const p = pk.available[n] ?? { version: pk.installed[n] };
      return ` ${n.padEnd(16)} x86_64   ${String(p.version).padEnd(24)} ${(p.repo ?? 'appstream').padEnd(12)} ${p.downloadKB ?? 100} k`;
    });
    return ['Dependencies resolved.', '='.repeat(80), ' Package          Arch     Version                  Repository   Size', '='.repeat(80),
      `${verbWord}:`, ...rows, '', 'Transaction Summary', '='.repeat(80),
      `${verbWord === 'Installing' ? 'Install' : 'Remove'}  ${names.length} Package${names.length > 1 ? 's' : ''}`, ''].join('\n');
  }

  function dnfCmd(args) {
    const yes = args.some((a) => ['-y', '--assumeyes'].includes(a));
    const [verb, ...names] = args.filter((a) => !a.startsWith('-'));
    const pk = packages();
    if (!verb) return fail('usage: dnf [options] COMMAND\n\nList of Main Commands:\n\ninstall                   install a package or packages on your system\nremove                    remove a package or packages from your system\nupgrade                   upgrade a package or packages on your system', 1);
    if (euid() !== 'root' && ['install', 'remove', 'erase', 'upgrade', 'update'].includes(verb)) return fail(DNF_ROOT);
    if (verb === 'install') {
      const missing = names.find((n) => !pk.available[n]);
      if (missing) return say(`Last metadata expiration check: 0:12:45 ago on ${DATES.systemd(now()).replace(' UTC', '')}.\nNo match for argument: ${missing}\nError: Unable to find a match: ${missing}`, 1);
      const fresh = names.filter((n) => !pk.installed[n]);
      if (!fresh.length) return ok(names.map((n) => `Package ${n}-${pk.installed[n]}.x86_64 is already installed.`).concat('Dependencies resolved.', 'Nothing to do.', 'Complete!').join('\n'));
      const head = dnfTable('Installing', fresh);
      if (!yes) { ask('dnf', 'Is this ok [y/N]: ', { op: 'install', names: fresh }); return ok(head); }
      return ok(`${head}\n${dnfApply('install', fresh)}`);
    }
    if (verb === 'remove' || verb === 'erase') {
      const present = names.filter((n) => pk.installed[n]);
      if (!present.length) return say(`No match for argument: ${names[0] ?? ''}\nNo packages marked for removal.\nDependencies resolved.\nNothing to do.\nComplete!`, 0);
      const head = dnfTable('Removing', present);
      if (!yes) { ask('dnf', 'Is this ok [y/N]: ', { op: 'remove', names: present }); return ok(head); }
      return ok(`${head}\n${dnfApply('remove', present)}`);
    }
    if (verb === 'upgrade' || verb === 'update') { pk.upgradable = 0; return ok('Dependencies resolved.\nNothing to do.\nComplete!'); }
    return fail(`No such command: ${verb}. Please use /usr/bin/dnf --help`);
  }

  function dnfApply(op, names) {
    const pk = packages();
    const lines = ['Running transaction'];
    for (const n of names) {
      if (op === 'install') {
        const p = pk.available[n];
        pk.installed[n] = p.version;
        lines.push(`  Installing       : ${n}-${p.version}.x86_64`);
        if (p.service) rt.state.services = { ...rt.state.services, [p.service.name]: { description: p.description ?? n, active: 'inactive', enabled: false, ...p.service.state } };
      } else {
        lines.push(`  Erasing          : ${n}-${pk.installed[n]}.x86_64`);
        delete pk.installed[n];
        const svc = pk.available[n]?.service?.name;
        if (svc) delete rt.state.services?.[svc];
      }
    }
    lines.push('', op === 'install' ? 'Installed:' : 'Removed:', ...names.map((n) => `  ${n}-${pk.available[n]?.version ?? ''}.x86_64`), '', 'Complete!');
    return lines.join('\n');
  }

  function systemctlCmd(args) {
    const withNow = args.includes('--now');
    const [verb = 'list-units', ...units] = args.filter((a) => !a.startsWith('-'));
    const services = rt.state.services ?? {};
    const unitName = (u) => u.replace(/\.service$/, '');
    if (verb === 'list-units') {
      const rows = Object.entries(services).sort().map(([n, s]) => `  ${`${n}.service`.padEnd(24)} loaded ${s.active.padEnd(8)} ${(s.active === 'active' ? 'running' : 'dead').padEnd(7)} ${s.description ?? n}`);
      return ok([`  ${'UNIT'.padEnd(24)} LOAD   ACTIVE   SUB     DESCRIPTION`, ...rows, '', `${rows.length} loaded units listed.`].join('\n'));
    }
    const known = ['status', 'start', 'stop', 'restart', 'reload', 'enable', 'disable', 'is-active', 'is-enabled', 'daemon-reload'];
    if (!known.includes(verb)) return fail(`Unknown command verb '${verb}'.`);
    if (verb === 'daemon-reload') return euid() === 'root' ? ok() : fail('Failed to reload daemon: Interactive authentication required.');
    if (!units.length) {
      if (verb === 'status') return ok(`● ${host}\n    State: running\n    Units: ${Object.keys(services).length} loaded (incl. loaded aliases)\n     Jobs: 0 queued\n   Failed: ${Object.values(services).filter((s) => s.active === 'failed').length} units`);
      return fail('Too few arguments.');
    }
    const outs = [];
    const errs = [];
    let exit = 0;
    for (const raw of units) {
      const name = unitName(raw);
      const svc = services[name];
      if (verb === 'status') {
        if (!svc) { errs.push(`Unit ${name}.service could not be found.`); exit = 4; continue; }
        outs.push(serviceStatus(name, svc));
        if (svc.active !== 'active') exit = 3;
        continue;
      }
      if (verb === 'is-active') { const s = svc?.active ?? 'inactive'; outs.push(s); if (s !== 'active') exit = 3; continue; }
      if (verb === 'is-enabled') {
        if (!svc) { errs.push(`Failed to get unit file state for ${name}.service: No such file or directory`); exit = 1; continue; }
        outs.push(svc.enabled ? 'enabled' : 'disabled');
        if (!svc.enabled) exit = 1;
        continue;
      }
      const unitVerb = ['enable', 'disable'].includes(verb);
      if (euid() !== 'root') {
        errs.push(unitVerb ? `Failed to ${verb} unit: Interactive authentication required.` : `Failed to ${verb} ${name}.service: Interactive authentication required.\nSee system logs and 'systemctl status ${name}.service' for details.`);
        exit = 1;
        continue;
      }
      if (!svc) {
        errs.push(unitVerb ? `Failed to ${verb} unit: Unit file ${name}.service does not exist.` : `Failed to ${verb} ${name}.service: Unit ${name}.service not found.`);
        exit = unitVerb ? 1 : 5;
        continue;
      }
      let res = ok();
      if (verb === 'start') res = startService(name, svc);
      else if (verb === 'stop') svc.active = 'inactive';
      else if (verb === 'restart' || verb === 'reload') { svc.active = 'inactive'; res = startService(name, svc); }
      else if (verb === 'enable') {
        if (!svc.enabled) outs.push(`Created symlink /etc/systemd/system/multi-user.target.wants/${name}.service → /usr/lib/systemd/system/${name}.service.`);
        svc.enabled = true;
        if (withNow) res = startService(name, svc);
      } else if (verb === 'disable') {
        if (svc.enabled) outs.push(`Removed "/etc/systemd/system/multi-user.target.wants/${name}.service".`);
        svc.enabled = false;
        if (withNow) svc.active = 'inactive';
      }
      if (res.exit) { errs.push(res.err); exit = res.exit; }
    }
    return { out: outs.join('\n'), err: errs.join('\n'), exit };
  }

  function ipCmd(args) {
    const [obj = ''] = args;
    const ifaces = { lo: { mac: '00:00:00:00:00:00', ipv4: '127.0.0.1/8', state: 'UNKNOWN', loopback: true }, ...net().interfaces };
    if (!obj) return fail('Usage: ip [ OPTIONS ] OBJECT { COMMAND | help }\nwhere  OBJECT := { address | link | neighbor | route | rule | ... }', 255);
    const isAddr = 'address'.startsWith(obj) || obj === 'addr';
    const isLink = 'link'.startsWith(obj);
    const isRoute = 'route'.startsWith(obj);
    if (isAddr || isLink) {
      const blocks = Object.entries(ifaces).map(([name, i], idx) => {
        const up = i.state !== 'DOWN';
        const flags = i.loopback ? '<LOOPBACK,UP,LOWER_UP>' : up ? '<BROADCAST,MULTICAST,UP,LOWER_UP>' : '<BROADCAST,MULTICAST>';
        const lines = [`${idx + 1}: ${name}: ${flags} mtu ${i.loopback ? 65536 : i.mtu ?? 1500} qdisc ${i.loopback ? 'noqueue' : 'fq_codel'} state ${i.state ?? 'UP'} group default qlen 1000`,
          `    link/${i.loopback ? 'loopback' : 'ether'} ${i.mac ?? '08:00:27:3a:5c:1e'} brd ${i.loopback ? '00:00:00:00:00:00' : 'ff:ff:ff:ff:ff:ff'}`];
        if (isAddr && i.ipv4) {
          const [ip, prefix] = i.ipv4.split('/');
          const brd = intToIp(networkOf(ip, Number(prefix)) + 2 ** (32 - Number(prefix)) - 1);
          lines.push(i.loopback ? `    inet ${i.ipv4} scope host lo` : `    inet ${i.ipv4} brd ${brd} scope global ${i.dynamic === false ? '' : 'dynamic '}noprefixroute ${name}`,
            i.dynamic === false || i.loopback ? '       valid_lft forever preferred_lft forever' : '       valid_lft 86137sec preferred_lft 86137sec');
        }
        return lines.join('\n');
      });
      return ok(blocks.join('\n'));
    }
    if (isRoute) {
      const lines = [];
      for (const [name, i] of Object.entries(net().interfaces ?? {})) {
        if (!i.ipv4 || i.state === 'DOWN') continue;
        const [ip, prefix] = i.ipv4.split('/');
        const proto = i.dynamic === false ? 'static' : 'dhcp';
        if (net().gateway && sameSubnet(ip, net().gateway, Number(prefix))) lines.unshift(`default via ${net().gateway} dev ${name} proto ${proto} ${proto === 'dhcp' ? `src ${ip} ` : ''}metric 100`);
        lines.push(`${intToIp(networkOf(ip, Number(prefix)))}/${prefix} dev ${name} proto kernel scope link src ${ip} metric 100`);
      }
      return ok(lines.join('\n'));
    }
    return fail(`Object "${obj}" is unknown, try "ip help".`, 1);
  }

  function linuxPing(args) {
    const o = gnuOptions('ping', args, { short: '46nqv', valued: 'cWiws' }, 2);
    if (o.error) return o.error;
    const target = o.operands.at(-1);
    if (!target) return fail('ping: usage error: Destination address required', 1);
    const ip = lookup(target, false);
    if (!ip) return fail(`ping: ${target}: Temporary failure in name resolution`, 2);
    if (!hasRoute(ip)) return fail('ping: connect: Network is unreachable', 2);
    const count = Number(o.values.c ?? 4);
    const up = reachable(ip);
    const ms = replyMs(ip);
    const label = target === ip ? ip : `${target} (${ip})`;
    const lines = [`PING ${target} (${ip}) 56(84) bytes of data.`];
    if (up) for (let i = 1; i <= count; i += 1) lines.push(`64 bytes from ${label}: icmp_seq=${i} ttl=${hostFor(ip)?.ttl ?? 64} time=${msText(ms)} ms`);
    lines.push('', `--- ${target} ping statistics ---`,
      `${count} packets transmitted, ${up ? count : 0} received, ${up ? 0 : 100}% packet loss, time ${(count - 1) * 1000 + (up ? 4 : 62)}ms`);
    if (up) lines.push(`rtt min/avg/max/mdev = ${msText(ms)}/${msText(ms)}/${msText(ms)}/0.000 ms`);
    return say(lines.join('\n'), up ? 0 : 1);
  }

  function digCmd(args) {
    const short = args.includes('+short');
    const words = args.filter((a) => !a.startsWith('+') && !a.startsWith('@') && !a.startsWith('-'));
    const name = words[0] ?? '.';
    const type = (words[1] ?? 'A').toUpperCase();
    const server = net().dns?.[0] ?? '127.0.0.53';
    if (!dnsWorks()) return say(`;; communications error to ${server}#53: timed out\n;; communications error to ${server}#53: timed out\n;; communications error to ${server}#53: timed out\n\n; <<>> DiG 9.18.30-0ubuntu0.24.04.2-Ubuntu <<>> ${args.join(' ')}\n;; global options: +cmd\n;; no servers could be reached`, 9);
    const entry = hostFor(name);
    const answer = type === 'A' && entry?.ip ? entry.ip : null;
    if (short) return ok(answer ?? '');
    const fqdn = name.endsWith('.') ? name : `${name}.`;
    const id = [...name].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 65536, 7);
    const lines = ['', `; <<>> DiG 9.18.30-0ubuntu0.24.04.2-Ubuntu <<>> ${args.join(' ')}`, ';; global options: +cmd', ';; Got answer:',
      `;; ->>HEADER<<- opcode: QUERY, status: ${entry ? 'NOERROR' : 'NXDOMAIN'}, id: ${id}`,
      `;; flags: qr rd ra; QUERY: 1, ANSWER: ${answer ? 1 : 0}, AUTHORITY: 0, ADDITIONAL: 1`, '',
      ';; OPT PSEUDOSECTION:', '; EDNS: version: 0, flags:; udp: 65494', ';; QUESTION SECTION:', `;${fqdn}\t\t\tIN\t${type}`, ''];
    if (answer) lines.push(';; ANSWER SECTION:', `${fqdn}\t\t${entry.ttl ?? 300}\tIN\tA\t${answer}`, '');
    lines.push(';; Query time: 12 msec', `;; SERVER: ${server}#53(${server}) (UDP)`, `;; WHEN: ${DATES.dig(now())}`, `;; MSG SIZE  rcvd: ${answer ? 56 : 40}`, '');
    return ok(lines.join('\n'));
  }

  function nslookupCmd(args) {
    const name = args.find((a) => !a.startsWith('-'));
    if (win) {
      const adapter = addresses()[0];
      const serverIp = args.filter((a) => !a.startsWith('-'))[1] ?? adapter?.dns?.[0] ?? '';
      const serverName = net().dnsServerName ?? 'UnKnown';
      if (!dnsWorks()) return say(`DNS request timed out.\n    timeout was 2 seconds.\nServer:  UnKnown\nAddress:  ${serverIp}\n\n*** UnKnown can't find ${name ?? ''}: No response from server`, 1);
      const head = `Server:  ${serverName}\nAddress:  ${serverIp}\n`;
      if (!name) return ok(`Default ${head}`);
      const entry = hostFor(name);
      if (!entry?.ip) return say(`${head}\n*** ${serverName} can't find ${name}: Non-existent domain`, 1);
      return ok(`${head}\nNon-authoritative answer:\nName:    ${entry.name}\nAddress:  ${entry.ip}\n`);
    }
    const server = net().dns?.[0] ?? '127.0.0.53';
    if (!name) return ok(`> Server:\t\t${server}\nAddress:\t${server}#53`);
    if (!dnsWorks()) return say(`;; communications error to ${server}#53: timed out\n;; no servers could be reached\n`, 1);
    const entry = hostFor(name);
    const head = `Server:\t\t${server}\nAddress:\t${server}#53\n`;
    if (!entry?.ip) return say(`${head}\n** server can't find ${name}: NXDOMAIN\n`, 1);
    return ok(`${head}\nNon-authoritative answer:\nName:\t${entry.name}\nAddress: ${entry.ip}\n`);
  }

  function psTable(rows, kind) {
    if (kind === 'aux') {
      const w = [[8, 'l'], [7, 'r'], [4, 'r'], [4, 'r'], [6, 'r'], [5, 'r'], [8, 'l'], [4, 'l'], [5, 'l'], [6, 'r'], [0, 'l']];
      return [columns(w, ['USER', 'PID', '%CPU', '%MEM', 'VSZ', 'RSS', 'TTY', 'STAT', 'START', 'TIME', 'COMMAND']),
        ...rows.map((p) => columns(w, [p.user, p.pid, (p.cpu ?? 0).toFixed(1), (p.mem ?? 0).toFixed(1), p.vsz ?? 0, p.rss ?? 0, p.tty ?? '?', p.stat ?? 'S', p.start ?? '09:00', p.time ?? '0:00', p.command]))].join('\n');
    }
    if (kind === 'ef') {
      const w = [[8, 'l'], [7, 'r'], [7, 'r'], [2, 'r'], [5, 'l'], [8, 'l'], [8, 'r'], [0, 'l']];
      return [columns(w, ['UID', 'PID', 'PPID', 'C', 'STIME', 'TTY', 'TIME', 'CMD']),
        ...rows.map((p) => columns(w, [p.user, p.pid, p.ppid ?? 1, 0, p.start ?? '09:00', p.tty ?? '?', p.ctime ?? '00:00:00', p.command]))].join('\n');
    }
    const w = [[7, 'r'], [8, 'l'], [8, 'r'], [0, 'l']];
    return [columns(w, ['PID', 'TTY', 'TIME', 'CMD']), ...rows.map((p) => columns(w, [p.pid, p.tty ?? '?', p.ctime ?? '00:00:00', p.command.split(' ')[0].split('/').at(-1)]))].join('\n');
  }

  function processList() {
    return Object.entries(rt.state.processes ?? {}).map(([pid, p]) => ({ pid: Number(pid), ...p })).sort((a, b) => a.pid - b.pid);
  }

  function linuxProcs(args) {
    const style = args.join(' ');
    const procs = processList();
    if (!style) {
      const shellPid = 2201;
      const mine = [{ pid: shellPid, tty: 'pts/0', command: 'bash' }, ...procs.filter((p) => p.tty === 'pts/0' && p.user === euid()), { pid: shellPid + 44, tty: 'pts/0', command: 'ps' }];
      return ok(psTable(mine, 'plain'));
    }
    if (['aux', 'axu', '-aux', 'auxww'].includes(style)) return ok(psTable(procs, 'aux'));
    if (['-ef', '-e -f', '-eF'].includes(style)) return ok(psTable(procs, 'ef'));
    if (['-e', '-A', 'ax'].includes(style)) return ok(psTable(procs, 'plain'));
    return fail("error: unsupported option (BSD syntax)\n\nUsage:\n ps [options]\n\n Try 'ps --help <simple|list|output|threads|misc|all>'\n  or 'ps --help <s|l|o|t|m|a>'\n for additional help text.\n\nFor more details see ps(1).");
  }

  function topCmd() {
    const procs = processList().sort((a, b) => (b.cpu ?? 0) - (a.cpu ?? 0) || a.pid - b.pid);
    const mem = { total: 7951.2, free: 4120.4, used: 2015.3, cache: 1815.5, ...rt.state.memory };
    const us = Math.min(100, procs.reduce((s, p) => s + (p.cpu ?? 0), 0));
    const w = [[7, 'r'], [8, 'l'], [3, 'r'], [3, 'r'], [7, 'r'], [6, 'r'], [6, 'r'], [1, 'l'], [5, 'r'], [5, 'r'], [9, 'r'], [0, 'l']];
    const f = (n) => n.toFixed(1);
    return ok([
      `top - ${DATES.top(now())} up ${rt.state.uptime ?? '3 days,  2:14'},  1 user,  load average: ${rt.state.load ?? '0.08, 0.05, 0.01'}`,
      `Tasks: ${String(procs.length).padStart(3)} total,   1 running, ${String(Math.max(0, procs.length - 1)).padStart(3)} sleeping,   0 stopped,   0 zombie`,
      `%Cpu(s): ${f(us).padStart(4)} us,  0.7 sy,  0.0 ni, ${f(Math.max(0, 99.3 - us)).padStart(4)} id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st`,
      `MiB Mem : ${f(mem.total).padStart(8)} total, ${f(mem.free).padStart(8)} free, ${f(mem.used).padStart(8)} used, ${f(mem.cache).padStart(8)} buff/cache`,
      `MiB Swap: ${f(2048).padStart(8)} total, ${f(2048).padStart(8)} free, ${f(0).padStart(8)} used. ${f(mem.total - mem.used).padStart(8)} avail Mem`,
      '',
      columns(w, ['PID', 'USER', 'PR', 'NI', 'VIRT', 'RES', 'SHR', 'S', '%CPU', '%MEM', 'TIME+', 'COMMAND']),
      ...procs.map((p) => columns(w, [p.pid, p.user, 20, 0, p.vsz ?? 0, p.rss ?? 0, Math.round((p.rss ?? 0) / 3), (p.stat ?? 'S')[0], f(p.cpu ?? 0), f(p.mem ?? 0), p.timePlus ?? '0:00.00', p.command.split(' ')[0].split('/').at(-1).replace(/:$/, '')])),
    ].join('\n'));
  }

  function killCmd(args, io) {
    const signals = { 1: 'HUP', 9: 'KILL', 15: 'TERM', HUP: 'HUP', KILL: 'KILL', TERM: 'TERM', INT: 'INT', 2: 'INT' };
    let signal = 'TERM';
    const pids = [];
    for (let i = 0; i < args.length; i += 1) {
      const a = args[i];
      if (a === '-l') return ok(' 1) SIGHUP\t 2) SIGINT\t 3) SIGQUIT\t 4) SIGILL\t 5) SIGTRAP\n 6) SIGABRT\t 7) SIGBUS\t 8) SIGFPE\t 9) SIGKILL\t10) SIGUSR1\n11) SIGSEGV\t12) SIGUSR2\t13) SIGPIPE\t14) SIGALRM\t15) SIGTERM');
      const spec = a === '-s' ? args[(i += 1)] : a.startsWith('-') ? a.slice(1) : null;
      if (spec === null) { pids.push(a); continue; }
      signal = signals[String(spec).toUpperCase().replace(/^SIG/, '')];
      if (!signal) return fail(`bash: kill: ${spec}: invalid signal specification`);
    }
    if (!pids.length) return fail('kill: usage: kill [-s sigspec | -n signum | -sigspec] pid | jobspec ... or kill -l [sigspec]', 2);
    const errs = [];
    for (const pid of pids) {
      const proc = rt.state.processes?.[pid];
      const why = !/^\d+$/.test(pid) ? null : !proc ? 'No such process' : euid() !== 'root' && proc.user !== euid() ? 'Operation not permitted' : '';
      if (why === null) { errs.push(`bash: kill: ${pid}: arguments must be process or job IDs`); continue; }
      if (why) { errs.push(io.viaSudo ? `kill: (${pid}): ${why}` : `bash: kill: (${pid}) - ${why}`); continue; }
      if (signal === 'HUP' || (signal !== 'KILL' && proc.ignoresTerm)) continue;
      delete rt.state.processes[pid];
      const svc = proc.service && rt.state.services?.[proc.service];
      if (svc) svc.active = signal === 'KILL' ? 'failed' : 'inactive';
    }
    return errs.length ? fail(errs.join('\n')) : ok();
  }

  function execFile(name) {
    const p = resolve(name);
    const n = nodeAt(p);
    if (!n) return fail(`bash: ${name}: No such file or directory`, 127);
    if (n.type === 'dir') return fail(`bash: ${name}: Is a directory`, 126);
    if (!may(p, 1) || (euid() !== 'root' && !may(p, 4))) return fail(`bash: ${name}: Permission denied`, 126);
    return runProgram(n);
  }
  function runProgram(node) {
    const behavior = node.exec ?? {};
    for (const [path, value] of Object.entries(behavior.set ?? {})) setKey(path, value);
    return say(behavior.out ?? '', behavior.exit ?? 0);
  }

  function enterRootShell(login) {
    rt.session.stack.push({ user: rt.session.user, cwd: rt.session.cwd });
    rt.session.user = 'root';
    if (login) rt.session.cwd = '/root';
  }

  function sudoCmd(args) {
    if (!args.length) return fail('usage: sudo -h | -K | -k | -V\nusage: sudo -v [-ABkNnS] [-g group] [-h host] [-p prompt] [-u user]\nusage: sudo [-ABbEHkNnPS] [-C num] [-D directory] [-g group] [-h host] [-p prompt] [-R directory] [-T timeout] [-u user] [VAR=value] [-i | -s] [command [arg ...]]');
    if (euid() !== 'root' && !groupsOf(euid()).some((g) => g === 'sudo' || g === 'wheel')) {
      return fail(`${euid()} is not in the sudoers file.\nThis incident has been reported to the administrator.`);
    }
    if (caseDef.sudoPassword && !rt.session.sudoOk && euid() !== 'root') {
      ask('sudo', `[sudo] password for ${euid()}: `, { args, tries: 0 }, true);
      return ok();
    }
    return sudoRun(args);
  }
  function sudoRun(args) {
    if (args[0] === '-i' || args[0] === '-s' || (args[0] === 'su' && args.length <= 2)) { enterRootShell(args[0] !== '-s'); return ok(); }
    const [name] = args;
    const runnable = name.includes('/') ? nodeAt(resolve(name))?.type === 'file' && may(resolve(name), 1, 'root') : LINUX[name] && !['cd', 'exit', 'help'].includes(name);
    if (!runnable) return fail(`sudo: ${name}: command not found`);
    const previous = rt.session.user;
    rt.session.user = 'root';
    try { return runArgv(args, { viaSudo: true }); } finally { rt.session.user = previous; }
  }

  function suCmd(args) {
    const target = args.filter((a) => a !== '-' && a !== '-l').at(0) ?? 'root';
    if (target !== 'root' && !rt.state.users?.[target]) return fail(`su: user ${target} does not exist or the user entry does not contain all the required fields`);
    if (euid() === 'root') { enterRootShell(args.includes('-')); return ok(); }
    ask('su', 'Password: ', { login: args.includes('-') || args.includes('-l'), target }, true);
    return ok();
  }

  function duCmd(args) {
    const o = gnuOptions('du', args, { short: 'shac', long: { summarize: 's', 'human-readable': 'h', all: 'a', total: 'c' } });
    if (o.error) return o.error;
    const fmtK = (k) => (o.flags.has('h') ? human(k * 1024) : String(k));
    const out = [];
    const errs = [];
    let grand = 0;
    for (const raw of o.operands.length ? o.operands : ['.']) {
      const p = resolve(raw);
      if (!nodeAt(p) || !searchable(p)) { errs.push(`du: cannot access '${raw}': ${nodeAt(p) ? 'Permission denied' : 'No such file or directory'}`); continue; }
      const label = (path) => (P.same(path, p) ? raw : `${raw.replace(/\/$/, '')}/${relative(p, path)}`);
      const visit = (path, node) => {
        if (node.type !== 'dir') { const k = Math.ceil(sizeOf(node) / 4096) * 4; if (P.same(path, p) || o.flags.has('a')) out.push(`${fmtK(k)}\t${label(path)}`); return k; }
        let k = 4;
        if (!may(path, 5)) errs.push(`du: cannot read directory '${label(path)}': Permission denied`);
        else for (const c of childrenOf(path)) k += visit(c.path, c.node);
        if (!o.flags.has('s') || P.same(path, p)) out.push(`${fmtK(k)}\t${label(path)}`);
        return k;
      };
      grand += visit(p, nodeAt(p));
    }
    if (o.flags.has('c')) out.push(`${fmtK(grand)}\ttotal`);
    return { out: out.join('\n'), err: errs.join('\n'), exit: errs.length ? 1 : 0 };
  }

  function dfCmd(args) {
    const o = gnuOptions('df', args, { short: 'hT', long: { 'human-readable': 'h' } });
    if (o.error) return o.error;
    const systems = Object.entries(rt.state.filesystems ?? {});
    let list = systems;
    const errs = [];
    if (o.operands.length) {
      list = [];
      for (const raw of o.operands) {
        const p = resolve(raw);
        if (!nodeAt(p)) { errs.push(`df: ${raw}: No such file or directory`); continue; }
        const match = systems.filter(([m]) => P.within(p, m)).sort((a, b) => b[0].length - a[0].length)[0];
        if (match) list.push(match);
      }
    }
    const h = o.flags.has('h');
    const size = (k) => (h ? human(k * 1024) : String(k));
    const rows = list.map(([mount, f]) => {
      const avail = f.availK ?? Math.max(0, f.sizeK - f.usedK);
      const pct = f.usedK + avail ? Math.ceil((f.usedK * 100) / (f.usedK + avail)) : 0;
      return [f.source ?? 'none', size(f.sizeK), size(f.usedK), size(avail), `${pct}%`, mount];
    });
    const header = h ? ['Filesystem', 'Size', 'Used', 'Avail', 'Use%', 'Mounted on'] : ['Filesystem', '1K-blocks', 'Used', 'Available', 'Use%', 'Mounted on'];
    const all = [header, ...rows];
    const minimum = h ? [14, 5, 5, 5, 4] : [14, 9, 8, 9, 4];
    const w = minimum.map((min, i) => [Math.max(min, ...all.map((r) => r[i].length)), i ? 'r' : 'l']);
    return { out: rows.length ? all.map((r) => columns([...w, [0, 'l']], r)).join('\n') : '', err: errs.join('\n'), exit: errs.length ? 1 : 0 };
  }

  function findCmd(args) {
    const firstTest = args.findIndex((a) => a.startsWith('-'));
    const starts = firstTest < 0 ? args : args.slice(0, firstTest);
    let i = starts.length;
    const tests = [];
    let maxdepth = Infinity;
    for (; i < args.length; i += 1) {
      const a = args[i];
      const value = args[i + 1];
      if (['-name', '-iname', '-type', '-maxdepth'].includes(a) && value === undefined) return fail(`find: missing argument to \`${a}'`);
      if (a === '-name' || a === '-iname') { const re = globRe(value, a === '-iname'); tests.push((e) => re.test(e.name)); i += 1; }
      else if (a === '-type') {
        if (!['f', 'd'].includes(value)) return fail(`find: Unknown argument to -type: ${value}`);
        tests.push((e) => (value === 'd') === (e.node.type === 'dir'));
        i += 1;
      } else if (a === '-maxdepth') { maxdepth = Number(value); i += 1; }
      else if (a !== '-print') return fail(`find: unknown predicate \`${a}'`);
    }
    const lines = [];
    let exit = 0;
    for (const raw of starts.length ? starts : ['.']) {
      const p = resolve(raw);
      const n = nodeAt(p);
      if (!n || !searchable(p)) { lines.push(`find: ‘${raw}’: ${n ? 'Permission denied' : 'No such file or directory'}`); exit = 1; continue; }
      const visit = (path, node, depth, label) => {
        const entry = { name: depth || raw === '/' ? P.base(path) : raw.replace(/\/+$/, '').split('/').at(-1), node };
        if (tests.every((t) => t(entry))) lines.push(label);
        if (node.type !== 'dir' || depth >= maxdepth) return;
        if (!may(path, 5)) { lines.push(`find: ‘${label}’: Permission denied`); exit = 1; return; }
        for (const c of childrenOf(path)) visit(c.path, c.node, depth + 1, label === '/' ? `/${c.name}` : `${label}/${c.name}`);
      };
      visit(p, n, 0, raw.length > 1 ? raw.replace(/\/$/, '') : raw);
    }
    return say(lines.join('\n'), exit);
  }

  function grepCmd(args, io) {
    const o = gnuOptions('grep', args, { short: 'rRinlvcwEFHhs', long: { recursive: 'r', 'ignore-case': 'i', 'line-number': 'n', 'files-with-matches': 'l', 'invert-match': 'v', count: 'c' } }, 2);
    if (o.error) return o.error;
    if (!o.operands.length) return fail("Usage: grep [OPTION]... PATTERNS [FILE]...\nTry 'grep --help' for more information.", 2);
    const [pattern, ...targets] = o.operands;
    let source = o.flags.has('F') ? escapeRe(pattern) : o.flags.has('E') ? pattern : breToJs(pattern);
    if (o.flags.has('w')) source = `\\b(?:${source})\\b`;
    let re;
    try { re = new RegExp(source, o.flags.has('i') ? 'i' : ''); } catch { return fail('grep: Unmatched ( or \\(', 2); }
    const recursive = o.flags.has('r') || o.flags.has('R');
    const sources = [];
    const errs = [];
    const quiet = o.flags.has('s');
    if (!targets.length && !recursive) sources.push({ label: '(standard input)', text: io.stdin ?? '' });
    for (const raw of targets.length ? targets : recursive ? ['.'] : []) {
      const p = resolve(raw);
      const n = nodeAt(p);
      if (!n || !searchable(p)) { errs.push(`grep: ${raw}: ${n ? 'Permission denied' : 'No such file or directory'}`); continue; }
      if (n.type !== 'dir') {
        if (!may(p, 4)) errs.push(`grep: ${raw}: Permission denied`);
        else sources.push({ label: raw, text: n.content ?? '' });
        continue;
      }
      if (!recursive) { errs.push(`grep: ${raw}: Is a directory`); continue; }
      const label = (path) => (targets.length ? `${raw.replace(/\/$/, '')}/${relative(p, path)}` : relative(p, path));
      for (const e of walk(p, (d) => errs.push(`grep: ${label(d)}: Permission denied`))) {
        if (e.node.type !== 'file') continue;
        if (!may(e.path, 4)) errs.push(`grep: ${label(e.path)}: Permission denied`);
        else sources.push({ label: label(e.path), text: e.node.content ?? '' });
      }
    }
    const prefix = !o.flags.has('h') && (o.flags.has('H') || recursive || sources.length > 1);
    const out = [];
    let matched = false;
    for (const src of sources) {
      const hits = splitLines(src.text).map((line, idx) => [line, idx]).filter(([line]) => re.test(line) !== o.flags.has('v'));
      if (hits.length) matched = true;
      if (o.flags.has('l')) { if (hits.length) out.push(src.label); continue; }
      if (o.flags.has('c')) { out.push(prefix ? `${src.label}:${hits.length}` : String(hits.length)); continue; }
      for (const [line, idx] of hits) out.push(`${prefix ? `${src.label}:` : ''}${o.flags.has('n') ? `${idx + 1}:` : ''}${line}`);
    }
    return { out: out.join('\n'), err: quiet ? '' : errs.join('\n'), exit: errs.length ? 2 : matched ? 0 : 1 };
  }

  const LINUX = {
    pwd: () => ok(rt.session.cwd),
    cd(args) {
      if (args.length > 1) return fail('bash: cd: too many arguments');
      const raw = args[0] ?? '~';
      const p = resolve(raw);
      const n = nodeAt(p);
      if (!n) return fail(`bash: cd: ${raw}: No such file or directory`);
      if (n.type !== 'dir') return fail(`bash: cd: ${raw}: Not a directory`);
      if (!may(p, 1)) return fail(`bash: cd: ${raw}: Permission denied`);
      rt.session.cwd = p;
      return ok();
    },
    ls(args) {
      const o = gnuOptions('ls', args, { short: 'lahdA1', long: { all: 'a', 'almost-all': 'A', 'human-readable': 'h', directory: 'd' } }, 2);
      if (o.error) return o.error;
      const errs = [];
      const files = [];
      const dirs = [];
      for (const raw of o.operands.length ? o.operands : ['.']) {
        const p = resolve(raw);
        const n = nodeAt(p);
        if (!n || !searchable(p)) { errs.push(`ls: cannot access '${raw}': ${n || lookupDenied(p) ? 'Permission denied' : 'No such file or directory'}`); continue; }
        (n.type === 'dir' && !o.flags.has('d') ? dirs : files).push({ name: raw, path: p, node: n });
      }
      const blocks = [];
      if (files.length) blocks.push(lsFormat(files, o.flags, false));
      const headed = o.operands.length > 1;
      for (const d of dirs) {
        if (!may(d.path, 4)) { errs.push(`ls: cannot open directory '${d.name}': Permission denied`); continue; }
        let entries = childrenOf(d.path).filter((c) => o.flags.has('a') || o.flags.has('A') || !c.name.startsWith('.'));
        if (o.flags.has('a')) {
          const up = P.parent(d.path) ?? d.path;
          entries = [{ name: '.', path: d.path, node: d.node }, { name: '..', path: up, node: nodeAt(up) }, ...entries];
        }
        const body = lsFormat(entries, o.flags, true);
        blocks.push(headed ? `${d.name}:\n${body}` : body);
      }
      return { out: blocks.join('\n\n'), err: errs.join('\n'), exit: errs.length ? 2 : 0 };
    },
    cat(args, io) {
      if (!args.length) return ok(io.stdin ?? '');
      const parts = [];
      const errs = [];
      for (const raw of args) {
        const r = readText(raw);
        if (r.why) errs.push(`cat: ${raw}: ${r.why}`);
        else parts.push(r.text.replace(/\n$/, ''));
      }
      return { out: parts.join('\n'), err: errs.join('\n'), exit: errs.length ? 1 : 0 };
    },
    less(args, io) {
      if (!args.length) return io.stdin === undefined ? fail('Missing filename ("less --help" for help)') : ok(io.stdin);
      const r = readText(args[0]);
      if (r.why) return fail(r.dir ? `${args[0]} is a directory` : `${args[0]}: ${r.why}`);
      return ok(r.text.replace(/\n$/, ''));
    },
    head: (args, io) => headTail('head', args, io, (lines, n) => lines.slice(0, n)),
    tail: (args, io) => headTail('tail', args, io, (lines, n) => lines.slice(Math.max(0, lines.length - n))),
    mkdir(args) {
      const o = gnuOptions('mkdir', args, { short: 'pv', long: { parents: 'p' } });
      if (o.error) return o.error;
      if (!o.operands.length) return fail("mkdir: missing operand\nTry 'mkdir --help' for more information.");
      const errs = [];
      for (const raw of o.operands) {
        const p = resolve(raw);
        const existing = nodeAt(p);
        if (existing) { if (!(o.flags.has('p') && existing.type === 'dir')) errs.push(`mkdir: cannot create directory ‘${raw}’: File exists`); continue; }
        if (!o.flags.has('p') && !nodeAt(P.parent(p))) { errs.push(`mkdir: cannot create directory ‘${raw}’: No such file or directory`); continue; }
        const missing = [];
        for (let d = p; d && !nodeAt(d); d = P.parent(d)) missing.unshift(d);
        for (const d of missing) {
          if (!may(P.parent(d), 3)) { errs.push(`mkdir: cannot create directory ‘${raw}’: Permission denied`); break; }
          putNode(d, newNode('dir'));
        }
      }
      return errs.length ? fail(errs.join('\n')) : ok();
    },
    rm(args) {
      const o = gnuOptions('rm', args, { short: 'rRfidv', long: { recursive: 'r', force: 'f', dir: 'd' } });
      if (o.error) return o.error;
      const recursive = o.flags.has('r') || o.flags.has('R');
      const force = o.flags.has('f');
      if (!o.operands.length) return force ? ok() : fail("rm: missing operand\nTry 'rm --help' for more information.");
      const errs = [];
      for (const raw of o.operands) {
        const p = resolve(raw);
        if (p === '/' && recursive) { errs.push("rm: it is dangerous to operate recursively on '/'\nrm: use --no-preserve-root to override this failsafe"); continue; }
        const n = nodeAt(p);
        if (!n || !searchable(p)) { if (n || !force) errs.push(`rm: cannot remove '${raw}': ${n ? 'Permission denied' : 'No such file or directory'}`); continue; }
        if (n.type === 'dir' && !recursive && !o.flags.has('d')) { errs.push(`rm: cannot remove '${raw}': Is a directory`); continue; }
        const blocked = !may(P.parent(p), 3) || (n.type === 'dir' && walk(p).some((e) => e.node.type === 'dir' && !may(e.path, 7)));
        if (blocked) { errs.push(`rm: cannot remove '${raw}': Permission denied`); continue; }
        removeTree(p);
      }
      return errs.length ? fail(errs.join('\n')) : ok();
    },
    cp(args) {
      const o = gnuOptions('cp', args, { short: 'rRaipvf', long: { recursive: 'r', archive: 'a', preserve: 'p' } });
      if (o.error) return o.error;
      if (o.operands.length < 2) return fail(o.operands.length ? `cp: missing destination file operand after '${o.operands[0]}'\nTry 'cp --help' for more information.` : "cp: missing file operand\nTry 'cp --help' for more information.");
      const recursive = ['r', 'R', 'a'].some((f) => o.flags.has(f));
      const preserve = o.flags.has('a') || o.flags.has('p');
      const destRaw = o.operands.at(-1);
      const dest = resolve(destRaw);
      const destNode = nodeAt(dest);
      const sources = o.operands.slice(0, -1);
      if (sources.length > 1 && destNode?.type !== 'dir') return fail(`cp: target '${destRaw}' is not a directory`);
      const errs = [];
      for (const raw of sources) {
        const p = resolve(raw);
        const n = nodeAt(p);
        if (!n || !searchable(p)) { errs.push(`cp: cannot stat '${raw}': ${n ? 'Permission denied' : 'No such file or directory'}`); continue; }
        if (n.type === 'dir' && !recursive) { errs.push(`cp: -r not specified; omitting directory '${raw}'`); continue; }
        const target = destNode?.type === 'dir' ? P.join(dest, P.base(p)) : dest;
        if (P.within(target, p)) { errs.push(`cp: cannot copy a directory, '${raw}', into itself, '${destRaw}'`); continue; }
        if (!may(p, 4)) { errs.push(`cp: cannot open '${raw}' for reading: Permission denied`); continue; }
        const kind = n.type === 'dir' ? 'directory' : 'regular file';
        if (!nodeAt(P.parent(target))) { errs.push(`cp: cannot create ${kind} '${destRaw}': No such file or directory`); continue; }
        if (!may(P.parent(target), 3)) { errs.push(`cp: cannot create ${kind} '${destRaw}': Permission denied`); continue; }
        copyTree(p, target, (node) => (preserve ? {} : { owner: euid(), group: groupsOf(euid())[0], mode: modeStr(modeNum(node.mode) & ~umask()), mtime: now() }));
      }
      return errs.length ? fail(errs.join('\n')) : ok();
    },
    mv(args) {
      const o = gnuOptions('mv', args, { short: 'fivn', long: { force: 'f' } });
      if (o.error) return o.error;
      if (o.operands.length < 2) return fail(o.operands.length ? `mv: missing destination file operand after '${o.operands[0]}'\nTry 'mv --help' for more information.` : "mv: missing file operand\nTry 'mv --help' for more information.");
      const destRaw = o.operands.at(-1);
      const dest = resolve(destRaw);
      const destNode = nodeAt(dest);
      const sources = o.operands.slice(0, -1);
      if (sources.length > 1 && destNode?.type !== 'dir') return fail(`mv: target '${destRaw}' is not a directory`);
      const errs = [];
      for (const raw of sources) {
        const p = resolve(raw);
        const n = nodeAt(p);
        if (!n || !searchable(p)) { errs.push(`mv: cannot stat '${raw}': ${n ? 'Permission denied' : 'No such file or directory'}`); continue; }
        const target = destNode?.type === 'dir' ? P.join(dest, P.base(p)) : dest;
        if (P.same(target, p)) { errs.push(`mv: '${raw}' and '${destRaw}' are the same file`); continue; }
        if (P.within(target, p)) { errs.push(`mv: cannot move '${raw}' to a subdirectory of itself, '${target}'`); continue; }
        if (!nodeAt(P.parent(target))) { errs.push(`mv: cannot move '${raw}' to '${destRaw}': No such file or directory`); continue; }
        if (!may(P.parent(p), 3) || !may(P.parent(target), 3)) { errs.push(`mv: cannot move '${raw}' to '${destRaw}': Permission denied`); continue; }
        moveTree(p, target);
      }
      return errs.length ? fail(errs.join('\n')) : ok();
    },
    touch(args) {
      if (!args.length) return fail("touch: missing file operand\nTry 'touch --help' for more information.");
      const errs = [];
      for (const raw of args.filter((a) => !a.startsWith('-'))) {
        const p = resolve(raw);
        const n = nodeAt(p);
        if (n) {
          if (euid() !== 'root' && n.owner !== euid() && !may(p, 2)) errs.push(`touch: cannot touch '${raw}': Permission denied`);
          else n.mtime = now();
        } else if (!nodeAt(P.parent(p))) errs.push(`touch: cannot touch '${raw}': No such file or directory`);
        else if (!may(P.parent(p), 3)) errs.push(`touch: cannot touch '${raw}': Permission denied`);
        else putNode(p, newNode('file'));
      }
      return errs.length ? fail(errs.join('\n')) : ok();
    },
    truncate(args) {
      const o = gnuOptions('truncate', args, { short: 'c', valued: 's', long: { size: 's' } });
      if (o.error) return o.error;
      if (o.values.s === undefined) return fail("truncate: you must specify either '--size' or '--reference'\nTry 'truncate --help' for more information.");
      const size = Number(o.values.s);
      if (!Number.isInteger(size) || size < 0) return fail(`truncate: Invalid number: ‘${o.values.s}’`);
      const errs = [];
      for (const raw of o.operands) {
        const p = resolve(raw);
        const n = nodeAt(p);
        if (!n) { if (!nodeAt(P.parent(p))) errs.push(`truncate: cannot open '${raw}' for writing: No such file or directory`); else putNode(p, { ...newNode('file'), size }); continue; }
        if (n.type === 'dir') { errs.push(`truncate: cannot open '${raw}' for writing: Is a directory`); continue; }
        if (!may(p, 2)) { errs.push(`truncate: cannot open '${raw}' for writing: Permission denied`); continue; }
        const before = sizeOf(n);
        n.content = (n.content ?? '').slice(0, size);
        n.size = size;
        n.mtime = now();
        adjustUsage(keyOf(p), size - before);
      }
      return errs.length ? fail(errs.join('\n')) : ok();
    },
    chmod: (args) => chmodLike('chmod', args, {
      prepare: (spec) => (/^[0-7]{1,4}$/.test(spec) || symbolicMode(0, spec, false, 0) !== null ? { spec } : { error: `chmod: invalid mode: ‘${spec}’\nTry 'chmod --help' for more information.` }),
      change(node, { spec }) {
        if (euid() !== 'root' && node.owner !== euid()) return 'changing permissions of';
        node.mode = modeStr(parseMode(spec, modeNum(node.mode), node.type === 'dir', umask()));
        return '';
      },
    }),
    chown: (args) => chmodLike('chown', args, {
      prepare(spec) {
        const m = /^([^:.]*)(?:[:.](.*))?$/.exec(spec);
        const owner = m[1] || null;
        if (owner && !rt.state.users?.[owner]) return { error: `chown: invalid user: ‘${spec}’` };
        const group = m[2] === undefined ? null : m[2] === '' ? (owner ? groupsOf(owner)[0] : null) : m[2];
        if (group && !rt.state.groups.includes(group)) return { error: `chown: invalid group: ‘${spec}’` };
        return { owner, group };
      },
      change(node, { owner, group }) {
        if (euid() !== 'root') {
          if (owner && owner !== node.owner) return 'changing ownership of';
          if (group && (node.owner !== euid() || !groupsOf(euid()).includes(group))) return 'changing ownership of';
        }
        if (owner) node.owner = owner;
        if (group) node.group = group;
        return '';
      },
    }),
    chgrp: (args) => chmodLike('chgrp', args, {
      prepare: (group) => (rt.state.groups.includes(group) ? { group } : { error: `chgrp: invalid group: ‘${group}’` }),
      change(node, { group }) {
        if (euid() !== 'root' && (node.owner !== euid() || !groupsOf(euid()).includes(group))) return 'changing group of';
        node.group = group;
        return '';
      },
    }),
    grep: grepCmd,
    find: findCmd,
    df: dfCmd,
    du: duCmd,
    ps: linuxProcs,
    top: topCmd,
    kill: killCmd,
    sudo: sudoCmd,
    su: suCmd,
    apt: aptCmd,
    dnf: dnfCmd,
    systemctl: systemctlCmd,
    ip: ipCmd,
    ping: linuxPing,
    dig: digCmd,
    nslookup: nslookupCmd,
    whoami: () => ok(euid()),
    hostname: () => ok(host),
    clear: () => ok('', { clear: true }),
    exit() {
      const previous = rt.session.stack.pop();
      if (!previous) return ok();
      rt.session.user = previous.user;
      rt.session.cwd = previous.cwd;
      return ok('logout');
    },
    man(args) {
      if (!args.length) return fail("What manual page do you want?\nFor example, try 'man man'.");
      const name = args.at(-1);
      const page = MAN[name];
      if (!page || !LINUX[name]) return fail(`No manual entry for ${name}`, 16);
      const [section, summary, synopsis] = page;
      const title = `${name.toUpperCase()}(${section})`;
      const middle = section === 1 ? 'User Commands' : "System Manager's Manual";
      const gap = Math.max(1, Math.floor((78 - title.length * 2 - middle.length) / 2));
      return ok(`${title}${' '.repeat(gap)}${middle}${' '.repeat(gap)}${title}\n\nNAME\n       ${name} - ${summary}\n\nSYNOPSIS\n       ${synopsis}`);
    },
    help() {
      const names = Object.keys(LINUX).filter((n) => n !== 'help').sort();
      return ok([`Commands available on ${host}:`, ...names.map((n) => `  ${n.padEnd(10)} ${MAN[n]?.[1] ?? (n === 'cd' ? 'change the shell working directory' : 'leave the current shell')}`),
        '', "Type 'man <command>' or '<command> --help' for the syntax."].join('\n'));
    },
    bash: (args) => runScript('bash', args),
    sh: (args) => runScript('sh', args),
  };
  if (packageTool === 'apt') delete LINUX.dnf;
  else delete LINUX.apt;

  function runScript(shell, args) {
    if (!args.length) return ok();
    const p = resolve(args[0]);
    const n = nodeAt(p);
    if (!n) return fail(`${shell}: ${args[0]}: No such file or directory`, 127);
    if (n.type === 'dir' || !may(p, 4)) return fail(`${shell}: ${args[0]}: ${n.type === 'dir' ? 'Is a directory' : 'Permission denied'}`, 126);
    return runProgram(n);
  }

  function runArgv(argv, io = {}) {
    const [name, ...args] = argv;
    if (name.includes('/')) return execFile(name);
    const fn = LINUX[name];
    if (!fn) return fail(`${name}: command not found`, 127);
    if (args[0] === '--help' && MAN[name]) {
      const [, summary, synopsis] = MAN[name];
      return ok(`Usage: ${synopsis.split('\n')[0]}\n${summary[0].toUpperCase()}${summary.slice(1).replace(/\.$/, '')}.`);
    }
    return fn(args, io);
  }

  function runLinuxLine(line) {
    const segments = splitPipes(line);
    if (segments.some((s) => !s)) return fail("bash: syntax error near unexpected token `|'", 2);
    const errs = [];
    let res = ok();
    let stdin;
    for (const segment of segments) {
      res = runArgv(tokenize(segment, 'linux', true).flatMap(expandLinuxWord), { stdin });
      if (res.err) errs.push(res.err);
      stdin = res.out;
    }
    return { ...res, err: errs.join('\n') };
  }

  // =====================================================================
  // Windows Command Prompt (Windows 11)
  // =====================================================================
  const cmdSwitches = (args) => new Set(args.filter((a) => a.startsWith('/')).map((a) => a.toLowerCase()));
  const cmdOperands = (args) => args.filter((a) => !a.startsWith('/'));
  const volumeOf = (p) => rt.state.volumes?.[p.slice(0, 2).toUpperCase()];
  const driveExists = (letter) => Boolean(rt.state.volumes?.[letter] || rt.state.mappedDrives?.[letter] || nodeAt(`${letter}\\`));

  function matchFiles(raw) {
    const p = resolve(raw);
    if (hasWildcard(P.base(p))) {
      const re = globRe(P.base(p), true);
      return childrenOf(P.parent(p)).filter((c) => c.node.type === 'file' && re.test(c.name));
    }
    const n = nodeAt(p);
    if (!n) return [];
    if (n.type === 'dir') return childrenOf(p).filter((c) => c.node.type === 'file');
    return [{ name: P.base(p), path: p, node: n }];
  }

  function dirHeader(p) {
    const letter = p.slice(0, 1).toUpperCase();
    const vol = volumeOf(p);
    return `${vol?.label ? ` Volume in drive ${letter} is ${vol.label}` : ` Volume in drive ${letter} has no label.`}\n Volume Serial Number is ${vol?.serial ?? '1A2B-3C4D'}\n\n Directory of ${p}\n`;
  }

  function cmdDir(args) {
    const sw = cmdSwitches(args);
    const ops = cmdOperands(args);
    const p = resolve(ops[0] ?? '.');
    const n = nodeAt(p);
    let dirPath = p;
    let pattern = null;
    if (!n || n.type === 'file') { dirPath = P.parent(p) ?? p; pattern = P.base(p); }
    const dn = nodeAt(dirPath);
    if (!dn || dn.type !== 'dir') return fail('The system cannot find the path specified.');
    const re = pattern && globRe(pattern, true);
    const showAll = [...sw].some((s) => s.startsWith('/a'));
    const entries = childrenOf(dirPath).filter((e) => (!re || re.test(e.name)) && (showAll || !/[HS]/i.test(e.node.attrs ?? '')));
    if (sw.has('/b')) return entries.length ? ok(entries.map((e) => e.name).join('\n')) : fail('File Not Found');
    if (!entries.length) return say(`${dirHeader(dirPath)}\nFile Not Found`, 1);
    const listed = !pattern && !P.isRoot(dirPath) ? [{ name: '.', node: dn }, { name: '..', node: nodeAt(P.parent(dirPath)) }, ...entries] : entries;
    const rows = listed.map((e) => `${DATES.cmd(e.node.mtime ?? now())}${e.node.type === 'dir' ? '    <DIR>         ' : commas(sizeOf(e.node)).padStart(18)} ${e.name}`);
    const files = listed.filter((e) => e.node.type === 'file');
    const bytes = files.reduce((s, e) => s + sizeOf(e.node), 0);
    const free = volumeOf(dirPath)?.freeBytes ?? 0;
    return ok([dirHeader(dirPath), ...rows,
      `${String(files.length).padStart(16)} File(s)${commas(bytes).padStart(15)} bytes`,
      `${String(listed.length - files.length).padStart(16)} Dir(s)  ${commas(free).padStart(14)} bytes free`].join('\n'));
  }

  function cmdCd(args) {
    const sw = cmdSwitches(args);
    const target = cmdOperands(args).join(' ');
    if (!target) return ok(rt.session.cwd);
    if (/^[a-z]:$/i.test(target)) return ok(`${target.toUpperCase()}\\`);
    if (target.startsWith('\\\\')) return fail(`"${target}"\nCMD does not support UNC paths as current directories.`);
    const p = resolve(target);
    const n = nodeAt(p);
    if (!n) return fail('The system cannot find the path specified.');
    if (n.type !== 'dir') return fail('The directory name is invalid.');
    if (!P.same(winRootOf(p), winRootOf(rt.session.cwd)) && !sw.has('/d')) return ok();
    rt.session.cwd = p;
    return ok();
  }

  function overwriteOrRun(to, flags, text, data) {
    if (nodeAt(to) && !flags.has('/y')) { ask('overwrite', text, data); return true; }
    return false;
  }

  function ensureDirs(p) {
    const chain = [];
    for (let d = p; d && !nodeAt(d); d = P.parent(d)) chain.unshift(d);
    chain.forEach((d) => putNode(d, win ? { type: 'dir', mtime: now() } : newNode('dir')));
  }

  function doCopy({ from, to, names, concat }) {
    if (concat) {
      const content = from.map((f) => nodeAt(f)?.content ?? '').join('');
      writeCopy(to, { type: 'file', content, mtime: now() }, {});
    } else from.forEach((f, i) => writeCopy(to[i], nodeAt(f), {}));
    return ok([...(names ?? []), `        ${concat ? 1 : from.length} file(s) copied.`].join('\n'));
  }

  function cmdCopy(args) {
    const sw = cmdSwitches(args);
    const ops = cmdOperands(args);
    if (!ops.length) return fail('The syntax of the command is incorrect.');
    const sources = matchFiles(ops[0]);
    if (!sources.length) return fail('The system cannot find the file specified.', 1, '        0 file(s) copied.');
    const dest = resolve(ops[1] ?? '.');
    const intoDir = nodeAt(dest)?.type === 'dir';
    if (!intoDir && !nodeAt(P.parent(dest))) return fail('The system cannot find the path specified.', 1, '        0 file(s) copied.');
    const targets = sources.map((s) => (intoDir ? P.join(dest, s.name) : dest));
    if (sources.some((s, i) => P.same(real(s.path), real(targets[i])))) return fail('The file cannot be copied onto itself.', 1, '        0 file(s) copied.');
    if (!targets.every((t) => winWritable(t))) return fail('Access is denied.', 1, '        0 file(s) copied.');
    const listNames = hasWildcard(ops[0]) || nodeAt(resolve(ops[0]))?.type === 'dir';
    const data = { from: sources.map((s) => s.path), to: targets, names: listNames ? sources.map((s) => s.name) : null, concat: sources.length > 1 && !intoDir };
    if (sources.length === 1 && overwriteOrRun(targets[0], sw, `Overwrite ${targets[0]}? (Yes/No/All): `, { op: 'copy', ...data })) return ok();
    return doCopy(data);
  }

  function doXcopy({ src, dest, files }) {
    const names = [];
    for (const f of files) {
      const rel = relative(src, f.path);
      const to = rel ? P.join(dest, rel) : dest;
      if (f.node.type === 'dir') { if (!nodeAt(to)) putNode(to, { type: 'dir', mtime: now() }); continue; }
      ensureDirs(P.parent(to));
      writeCopy(to, f.node, {});
      names.push(f.path);
    }
    return ok([...names, `${names.length} File(s) copied`].join('\n'));
  }

  function cmdXcopy(args) {
    const sw = cmdSwitches(args);
    const ops = cmdOperands(args);
    if (!ops.length) return fail('Invalid number of parameters\n0 File(s) copied');
    const src = resolve(ops[0]);
    const n = nodeAt(src);
    if (!n) return fail(`File not found - ${P.base(src)}`, 4, '0 File(s) copied');
    const sub = sw.has('/s') || sw.has('/e');
    let files;
    if (n.type === 'file') files = [{ path: src, node: n }];
    else {
      files = sub ? walk(src).slice(1) : childrenOf(src).filter((c) => c.node.type === 'file');
      if (sw.has('/s') && !sw.has('/e')) files = files.filter((f) => f.node.type === 'file' || walk(f.path).some((e) => e.node.type === 'file'));
    }
    const base = n.type === 'file' ? P.parent(src) : src;
    const destRaw = ops[1] ?? '.';
    const dest = resolve(destRaw);
    const data = { src: base, dest, files: files.map((f) => ({ path: f.path, node: f.node })) };
    if (!winWritable(dest)) return fail('Access denied', 4, '0 File(s) copied');
    if (!nodeAt(dest) && n.type === 'dir' && !sw.has('/i')) {
      ask('xcopy', `Does ${destRaw} specify a file name\nor directory name on the target\n(F = file, D = directory)? `, data);
      return ok();
    }
    if (!nodeAt(dest)) putNode(dest, { type: 'dir', mtime: now() });
    return doXcopy(data);
  }

  function roboSize(bytes) {
    if (bytes < 1024) return String(bytes);
    const units = ['k', 'm', 'g', 't'];
    let v = bytes / 1024;
    let i = 0;
    while (v >= 1024 && i < units.length - 1) { v /= 1024; i += 1; }
    return `${v.toFixed(v < 10 ? 2 : 1)} ${units[i]}`;
  }

  function cmdRobocopy(args) {
    const sw = cmdSwitches(args);
    const ops = cmdOperands(args);
    if (ops.length < 2) return ok(CMD_INFO.robocopy[1]);
    const src = resolve(ops[0]);
    const dest = resolve(ops[1]);
    const patterns = ops.slice(2);
    const mir = sw.has('/mir');
    const deep = mir || sw.has('/e') || sw.has('/s');
    const purge = mir || sw.has('/purge');
    const moveFiles = sw.has('/mov') || sw.has('/move');
    const options = ['*.*', deep ? '/S' : '', mir || sw.has('/e') ? '/E' : '', '/DCOPY:DA', '/COPY:DAT', purge ? '/PURGE' : '', mir ? '/MIR' : '', sw.has('/mov') ? '/MOV' : '', sw.has('/move') ? '/MOVE' : '', '/R:1000000', '/W:30'].filter(Boolean).join(' ');
    const slash = (p) => (p.endsWith('\\') ? p : `${p}\\`);
    const header = ['', RULE79, '   ROBOCOPY     ::     Robust File Copy for Windows', RULE79, '',
      `  Started : ${DATES.long(now())}`, `   Source : ${slash(src)}`, `     Dest : ${slash(dest)}`, '',
      `    Files : ${patterns.length ? patterns.join(' ') : '*.*'}`, '', `  Options : ${options}`, '', '-'.repeat(78), ''];
    const srcNode = nodeAt(src);
    if (srcNode?.type !== 'dir') {
      return say([...header, `${DATES.cmd(now()).replace('  ', ' ')} ERROR 2 (0x00000002) Accessing Source Directory ${slash(src)}`, 'The system cannot find the file specified.', ''].join('\n'), 16);
    }
    if (!winWritable(dest)) return say([...header, `${DATES.cmd(now()).replace('  ', ' ')} ERROR 5 (0x00000005) Accessing Destination Directory ${slash(dest)}`, 'Access is denied.', ''].join('\n'), 16);
    const fileRes = patterns.map((g) => globRe(g, true));
    const wanted = (name) => !fileRes.length || fileRes.some((re) => re.test(name));
    const stats = { dirs: [0, 0, 0, 0], files: [0, 0, 0, 0], bytes: [0, 0, 0, 0] };
    const lines = [];
    const visit = (from, to) => {
      const kids = childrenOf(from);
      const files = kids.filter((k) => k.node.type === 'file' && wanted(k.name));
      const isNew = !nodeAt(to);
      stats.dirs[0] += 1;
      if (isNew) { putNode(to, { type: 'dir', mtime: now() }); stats.dirs[1] += 1; } else stats.dirs[2] += 1;
      lines.push(`\t${isNew ? '  New Dir  ' : '           '}${String(files.length).padStart(8)}\t${slash(from)}`);
      for (const f of files) {
        const target = P.join(to, f.name);
        const existing = nodeAt(target);
        const size = sizeOf(f.node);
        stats.files[0] += 1;
        stats.bytes[0] += size;
        if (existing && sizeOf(existing) === size && existing.mtime === f.node.mtime) { stats.files[2] += 1; stats.bytes[2] += size; continue; }
        lines.push(`\t    ${existing ? 'Newer   ' : 'New File'}  \t\t${roboSize(size).padStart(8)}\t${f.name}`);
        writeCopy(target, f.node, {});
        stats.files[1] += 1;
        stats.bytes[1] += size;
        if (moveFiles) removeTree(f.path);
      }
      for (const extra of childrenOf(to)) {
        const inSource = kids.some((k) => P.same(k.name, extra.name) && (extra.node.type === 'dir' ? deep : wanted(k.name)));
        if (inSource) continue;
        if (extra.node.type === 'dir' && !deep) continue;
        if (extra.node.type === 'file' && !wanted(extra.name)) continue;
        lines.push(extra.node.type === 'dir' ? `\t*EXTRA Dir        -1\t${slash(extra.path)}` : `\t    *EXTRA File \t\t${roboSize(sizeOf(extra.node)).padStart(8)}\t${extra.name}`);
        if (extra.node.type === 'dir') stats.dirs[3] += 1; else { stats.files[3] += 1; stats.bytes[3] += sizeOf(extra.node); }
        if (purge) removeTree(extra.path);
      }
      if (deep) for (const d of kids.filter((k) => k.node.type === 'dir')) {
        if (!sw.has('/s') || mir || sw.has('/e') || walk(d.path).some((e) => e.node.type === 'file')) visit(d.path, P.join(to, d.name));
      }
      if (sw.has('/move') && !P.same(from, src) && !childrenOf(from).length) removeTree(from);
    };
    visit(src, dest);
    const row = (label, cells) => `${label}${cells.map((c) => String(c).padStart(10)).join('')}`;
    const summary = ['', '-'.repeat(78), '',
      row('          ', ['Total', 'Copied', 'Skipped', 'Mismatch', 'FAILED', 'Extras']),
      row('    Dirs :', [stats.dirs[0], stats.dirs[1], stats.dirs[2], 0, 0, stats.dirs[3]]),
      row('   Files :', [stats.files[0], stats.files[1], stats.files[2], 0, 0, stats.files[3]]),
      row('   Bytes :', [roboSize(stats.bytes[0]), roboSize(stats.bytes[1]), roboSize(stats.bytes[2]), 0, 0, roboSize(stats.bytes[3])]),
      `   Times :   0:00:00   0:00:00                       0:00:00   0:00:00`,
      `   Ended : ${DATES.long(now())}`, ''];
    const code = (stats.files[1] ? 1 : 0) + (stats.files[3] || stats.dirs[3] ? 2 : 0);
    return say([...header, ...lines, ...summary].join('\n'), code);
  }

  function cmdMove(args) {
    const sw = cmdSwitches(args);
    const ops = cmdOperands(args);
    if (ops.length < 1) return fail('The syntax of the command is incorrect.');
    const p = resolve(ops[0]);
    const n = nodeAt(p);
    const sources = hasWildcard(P.base(p)) ? matchFiles(ops[0]) : n ? [{ name: P.base(p), path: p, node: n }] : [];
    if (!sources.length) return fail('The system cannot find the file specified.');
    const dest = resolve(ops[1] ?? '.');
    const intoDir = nodeAt(dest)?.type === 'dir';
    const targets = sources.map((s) => (intoDir ? P.join(dest, s.name) : dest));
    if (![...sources.map((s) => s.path), ...targets].every((t) => winWritable(t))) return fail('Access is denied.');
    const data = { from: sources.map((s) => s.path), to: targets, dirs: sources.some((s) => s.node.type === 'dir') };
    if (sources.length === 1 && !data.dirs && overwriteOrRun(targets[0], sw, `Overwrite ${targets[0]}? (Yes/No/All): `, { op: 'move', ...data })) return ok();
    return doMove(data);
  }
  function doMove({ from, to, dirs }) {
    from.forEach((f, i) => moveTree(f, to[i]));
    return ok(`        ${from.length} ${dirs ? 'dir(s)' : 'file(s)'} moved.`);
  }

  function deleteFiles(paths, force) {
    const lines = [];
    for (const p of paths) {
      const n = nodeAt(p);
      if (!n) continue;
      if ((/R/i.test(n.attrs ?? '') && !force) || !winWritable(p)) { lines.push(`${p}\nAccess is denied.`); continue; }
      removeTree(p);
    }
    return lines.length ? fail(lines.join('\n')) : ok();
  }

  function cmdDel(args) {
    const sw = cmdSwitches(args);
    const ops = cmdOperands(args);
    if (!ops.length) return fail('The syntax of the command is incorrect.');
    const missing = [];
    const paths = [];
    let confirmDir = null;
    for (const raw of ops) {
      const p = resolve(raw);
      const n = nodeAt(p);
      const wild = hasWildcard(P.base(p));
      if (!n && !wild) { missing.push(`Could Not Find ${p}`); continue; }
      const dir = n?.type === 'dir' ? p : wild ? P.parent(p) : null;
      const files = (sw.has('/s') && dir ? walk(dir).filter((e) => e.node.type === 'file' && (!wild || globRe(P.base(p), true).test(P.base(e.path))))
        : matchFiles(raw)).map((f) => f.path);
      if (!files.length) { missing.push(`Could Not Find ${p}`); continue; }
      if (dir && (n?.type === 'dir' || /^\*(\.\*)?$/.test(P.base(p)))) confirmDir = dir;
      paths.push(...files);
    }
    if (confirmDir && !sw.has('/q')) {
      ask('del', `${confirmDir}\\*, Are you sure (Y/N)? `, { paths, force: sw.has('/f') });
      return say(missing.join('\n'), missing.length ? 1 : 0);
    }
    const res = deleteFiles(paths, sw.has('/f'));
    return { out: missing.join('\n'), err: res.err, exit: missing.length || res.exit ? 1 : 0 };
  }

  function cmdMd(args) {
    const ops = cmdOperands(args);
    if (!ops.length) return fail('The syntax of the command is incorrect.');
    const errs = [];
    for (const raw of ops) {
      const p = resolve(raw);
      if (nodeAt(p)) { errs.push(`A subdirectory or file ${raw} already exists.`); continue; }
      if (!winWritable(p)) { errs.push('Access is denied.'); continue; }
      ensureDirs(p);
    }
    return errs.length ? fail(errs.join('\n')) : ok();
  }

  function cmdRd(args) {
    const sw = cmdSwitches(args);
    const raw = cmdOperands(args).join(' ');
    if (!raw) return fail('The syntax of the command is incorrect.');
    const p = resolve(raw);
    const n = nodeAt(p);
    if (!n) return fail('The system cannot find the file specified.');
    if (n.type !== 'dir') return fail('The directory name is invalid.');
    if (P.within(rt.session.cwd, p)) return fail('The process cannot access the file because it is being used by another process.');
    if (!winWritable(p)) return fail('Access is denied.');
    if (childrenOf(p).length && !sw.has('/s')) return fail('The directory is not empty.');
    if (sw.has('/s') && !sw.has('/q')) { ask('rd', `${raw}, Are you sure (Y/N)? `, { path: p }); return ok(); }
    removeTree(p);
    return ok();
  }

  function cmdType(args) {
    const ops = cmdOperands(args);
    if (!ops.length) return fail('The syntax of the command is incorrect.');
    const parts = [];
    const errs = [];
    for (const raw of ops) {
      const n = nodeAt(resolve(raw));
      if (!n) errs.push('The system cannot find the file specified.');
      else if (n.type === 'dir') errs.push('Access is denied.');
      else parts.push((n.content ?? '').replace(/\n$/, ''));
    }
    return { out: parts.join('\n'), err: errs.join('\n'), exit: errs.length ? 1 : 0 };
  }

  // ipconfig field labels pad to 34 characters with alternating dots (". . .").
  function ipField(label, value) {
    let s = label;
    while (s.length < 34) s += s.length % 2 === 0 && !(label.endsWith('Suffix') && s.length === label.length) ? '.' : ' ';
    return `   ${s}: ${value ?? ''}`;
  }

  function adapterBlock(name, a, all) {
    const kind = a.kind ?? 'Ethernet';
    const lines = [`${kind} adapter ${name}:`, ''];
    if (a.connected === false) {
      lines.push(ipField('Media State', 'Media disconnected'), ipField('Connection-specific DNS Suffix', ''));
      if (all) lines.push(ipField('Description', a.description ?? 'Ethernet Adapter'), ipField('Physical Address', a.mac ?? '3C-52-82-4A-19-7E'), ipField('DHCP Enabled', a.dhcp === false ? 'No' : 'Yes'), ipField('Autoconfiguration Enabled', 'Yes'));
      return lines.join('\n');
    }
    lines.push(ipField('Connection-specific DNS Suffix', a.ipv4 && !isApipa(a.ipv4) ? a.suffix ?? '' : ''));
    if (all) lines.push(ipField('Description', a.description ?? 'Ethernet Adapter'), ipField('Physical Address', a.mac ?? '3C-52-82-4A-19-7E'), ipField('DHCP Enabled', a.dhcp === false ? 'No' : 'Yes'), ipField('Autoconfiguration Enabled', 'Yes'));
    lines.push(ipField('Link-local IPv6 Address', `${a.ipv6 ?? 'fe80::1c2b:9e5f:4a7d:12'}%${a.index ?? 12}${all ? '(Preferred)' : ''}`));
    if (a.ipv4) {
      lines.push(ipField(isApipa(a.ipv4) ? 'Autoconfiguration IPv4 Address' : 'IPv4 Address', `${a.ipv4}${all ? '(Preferred)' : ''}`), ipField('Subnet Mask', a.mask ?? '255.255.255.0'));
      if (all && a.dhcp !== false && !isApipa(a.ipv4)) lines.push(ipField('Lease Obtained', DATES.long(a.leaseObtained ?? now())), ipField('Lease Expires', DATES.long(a.leaseExpires ?? '2026-10-10T08:02:11')));
    }
    lines.push(ipField('Default Gateway', a.ipv4 ? a.gateway ?? '' : ''));
    if (all) {
      if (a.dhcp !== false && a.ipv4 && !isApipa(a.ipv4)) lines.push(ipField('DHCP Server', a.dhcpServer ?? a.gateway ?? ''));
      const dns = a.ipv4 && !isApipa(a.ipv4) ? a.dns ?? [] : ['fec0:0:0:ffff::1%1', 'fec0:0:0:ffff::2%1', 'fec0:0:0:ffff::3%1'];
      dns.forEach((d, i) => lines.push(i ? `${' '.repeat(39)}${d}` : ipField('DNS Servers', d)));
      lines.push(ipField('NetBIOS over Tcpip', 'Enabled'));
    }
    return lines.join('\n');
  }

  function ipconfigReport(all) {
    const head = ['', 'Windows IP Configuration', ''];
    if (all) {
      head.push(ipField('Host Name', host), ipField('Primary Dns Suffix', net().primarySuffix ?? ''), ipField('Node Type', 'Hybrid'), ipField('IP Routing Enabled', 'No'), ipField('WINS Proxy Enabled', 'No'));
      const suffixes = Object.values(net().adapters ?? {}).map((a) => a.suffix).filter(Boolean);
      if (suffixes.length) head.push(ipField('DNS Suffix Search List', suffixes[0]));
      head.push('');
    } else head.push('');
    return [...head, Object.entries(net().adapters ?? {}).map(([n, a]) => adapterBlock(n, a, all)).join('\n\n')].join('\n');
  }

  function cmdIpconfig(args) {
    const sw = cmdSwitches(args);
    const adapters = net().adapters ?? {};
    if (!args.length) return ok(ipconfigReport(false));
    if (sw.has('/all')) return ok(ipconfigReport(true));
    if (sw.has('/flushdns')) {
      setKey('network.dnsCache', {});
      return ok('\nWindows IP Configuration\n\nSuccessfully flushed the DNS Resolver Cache.');
    }
    if (sw.has('/displaydns')) {
      const entries = Object.entries(net().dnsCache ?? {}).map(([name, e]) => [`    ${name}`, `    ${'-'.repeat(40)}`, `    Record Name . . . . . : ${name}`, '    Record Type . . . . . : 1',
        `    Time To Live  . . . . : ${e.ttl ?? 3600}`, '    Data Length . . . . . : 4', '    Section . . . . . . . : Answer', `    A (Host) Record . . . : ${e.ip}`, ''].join('\n'));
      return ok(['', 'Windows IP Configuration', '', ...entries].join('\n'));
    }
    if (sw.has('/release') || sw.has('/renew')) {
      // Microsoft Learn Q&A: Windows 11 release/renew in an elevated prompt; the accepted
      // elevation answer names this error text for non-elevated ipconfig commands.
      // https://learn.microsoft.com/en-us/answers/questions/3931283/problem-with-dns-cache-windows-11-wi-fi
      // https://learn.microsoft.com/en-us/answers/questions/2561469/why-is-it-when-i-type-ipconfig-flushdns-in-windows
      if (!rt.session.admin) return fail('The requested operation requires elevation.');
      const dhcp = Object.entries(adapters).filter(([, a]) => a.dhcp !== false && a.connected !== false);
      if (!dhcp.length) return fail('The operation failed as no adapter is in the state permissible for\nthis operation.');
      const errs = [];
      for (const [name, a] of dhcp) {
        if (sw.has('/release')) { a.ipv4 = null; a.released = true; continue; }
        if (!a.dhcpOffer) {
          errs.push(`An error occurred while renewing interface ${name} : unable to contact your DHCP server. Request has timed out.`);
          a.ipv4 = a.apipa ?? a.ipv4 ?? '169.254.73.18';
          if (isApipa(a.ipv4)) { a.mask = '255.255.0.0'; a.gateway = ''; }
          continue;
        }
        Object.assign(a, a.dhcpOffer, { leaseObtained: now(), released: false });
      }
      return { out: ipconfigReport(false), err: errs.join('\n'), exit: errs.length ? 1 : 0 };
    }
    return fail('\nError: unrecongnized or incomplete command line.', 1, CMD_INFO.ipconfig[1]);
  }

  function winPing(args) {
    let count = 4;
    const operands = [];
    for (let i = 0; i < args.length; i += 1) {
      const flag = args[i].toLowerCase();
      if (/^[-/][nwlis]$/.test(flag)) { if (flag.endsWith('n')) count = Number(args[i + 1]) || 4; i += 1; }
      else if (!/^[-/]/.test(flag)) operands.push(args[i]);
    }
    const target = operands.at(-1);
    if (!target) return ok(CMD_INFO.ping[1]);
    const ip = lookup(target, true);
    if (!ip) return fail(`Ping request could not find host ${target}. Please check the name and try again.`);
    const head = `\nPinging ${target === ip ? ip : `${target} [${ip}]`} with 32 bytes of data:`;
    const stats = (recv) => `\nPing statistics for ${ip}:\n    Packets: Sent = ${count}, Received = ${recv}, Lost = ${count - recv} (${Math.round(((count - recv) / count) * 100)}% loss),`;
    if (!ip.startsWith('127.') && !usable().some((a) => sameSubnet(a.ip, ip, a.prefix) || a.gateway)) {
      return say(`${head}\n${Array(count).fill('PING: transmit failed. General failure.').join('\n')}\n${stats(0)}`, 1);
    }
    if (!reachable(ip)) return say(`${head}\n${Array(count).fill('Request timed out.').join('\n')}\n${stats(0)}`, 1);
    const ms = replyMs(ip);
    const time = ms < 1 ? 'time<1ms' : `time=${Math.round(ms)}ms`;
    const shown = Math.max(1, Math.round(ms));
    const replies = Array(count).fill(`Reply from ${ip}: bytes=32 ${time} TTL=${hostFor(ip)?.ttl ?? 128}`).join('\n');
    return ok(`${head}\n${replies}\n${stats(count)}\nApproximate round trip times in milli-seconds:\n    Minimum = ${shown}ms, Maximum = ${shown}ms, Average = ${shown}ms`);
  }

  function routeHops(ip) {
    const gateway = usable().find((a) => a.gateway)?.gateway;
    const entry = hostFor(ip);
    if (entry?.hops) return entry.hops;
    if (reachable(ip)) return usable().some((a) => sameSubnet(a.ip, ip, a.prefix)) ? [ip] : [gateway, ip];
    return [gateway, ...Array(29).fill('*')];
  }

  function cmdTracert(args) {
    const numeric = args.some((a) => a.toLowerCase() === '-d');
    const target = args.filter((a) => !a.startsWith('-')).at(-1);
    if (!target) return ok(CMD_INFO.tracert[1]);
    const ip = lookup(target, true);
    if (!ip) return fail(`Unable to resolve target system name ${target}.`);
    const label = (hop) => { const name = !numeric && reverseName(hop); return name ? `${name} [${hop}]` : hop; };
    const lines = ['', `Tracing route to ${target === ip ? ip : `${target} [${ip}]`}`, 'over a maximum of 30 hops:', ''];
    routeHops(ip).forEach((hop, i) => {
      const n = String(i + 1).padStart(3);
      if (hop === '*') { lines.push(`${n}${'*'.padStart(6)}${'*'.padStart(9)}${'*'.padStart(9)}     Request timed out.`); return; }
      const ms = replyMs(hop);
      const t = ms < 1 ? '<1 ms' : `${Math.round(ms)} ms`;
      lines.push(`${n}${t.padStart(9)}${t.padStart(9)}${t.padStart(9)}  ${label(hop)}`);
    });
    lines.push('', 'Trace complete.');
    return ok(lines.join('\n'));
  }

  function cmdPathping(args) {
    const numeric = args.some((a) => a.toLowerCase() === '-n');
    const target = args.filter((a) => !a.startsWith('-')).at(-1);
    if (!target) return ok(CMD_INFO.pathping[1]);
    const ip = lookup(target, true);
    if (!ip) return fail(`Unable to resolve target system name ${target}.`);
    const self = usable()[0]?.ip ?? '0.0.0.0';
    const hops = routeHops(ip).filter((h) => h !== '*').slice(0, 30);
    const label = (hop) => { const name = !numeric && reverseName(hop); return name ? `${name} [${hop}]` : hop; };
    const lines = ['', `Tracing route to ${target === ip ? ip : `${target} [${ip}]`}`, 'over a maximum of 30 hops:', `  0  ${host} [${self}]`];
    hops.forEach((hop, i) => lines.push(`${String(i + 1).padStart(3)}  ${label(hop)}`));
    lines.push('', `Computing statistics for ${25 * (hops.length + 1)} seconds...`, '            Source to Here   This Node/Link', 'Hop  RTT    Lost/Sent = Pct  Lost/Sent = Pct  Address',
      `  0                                           ${host} [${self}]`);
    hops.forEach((hop, i) => {
      const lost = reachable(hop) ? 0 : 100;
      lines.push(`                                ${lost}/ 100 = ${String(lost).padStart(2)}%   |`,
        `${String(i + 1).padStart(3)}${`${Math.round(replyMs(hop))}ms`.padStart(6)}   ${String(lost).padStart(3)}/ 100 = ${String(lost).padStart(2)}%   ${String(lost).padStart(3)}/ 100 = ${String(lost).padStart(2)}%  ${label(hop)}`);
    });
    lines.push('', 'Trace complete.');
    return ok(lines.join('\n'));
  }

  function cmdNetstat(args) {
    const letters = new Set(args.filter((a) => /^[-/]/.test(a)).flatMap((a) => [...a.slice(1).toLowerCase()]));
    const rows = (rt.state.connections ?? []).filter((c) => letters.has('a') || (c.state !== 'LISTENING' && c.proto?.toUpperCase() !== 'UDP'));
    const head = `  Proto  Local Address          Foreign Address        State${letters.has('o') ? '           PID' : ''}`;
    const lines = rows.map((c) => `  ${(c.proto ?? 'TCP').padEnd(6)} ${c.local.padEnd(22)} ${(c.foreign ?? '*:*').padEnd(22)} ${letters.has('o') ? `${(c.state ?? '').padEnd(15)} ${c.pid ?? 0}` : c.state ?? ''}`);
    return ok(['', 'Active Connections', '', head, ...lines].join('\n'));
  }

  function cmdTasklist(args) {
    const lower = args.map((a) => a.toLowerCase());
    let procs = processList();
    const fi = lower.indexOf('/fi');
    if (fi >= 0) {
      const m = /^(imagename|pid)\s+eq\s+(.+)$/i.exec(args[fi + 1] ?? '');
      if (!m) return fail('ERROR: The search filter cannot be recognized.');
      procs = procs.filter((p) => (m[1].toLowerCase() === 'pid' ? String(p.pid) === m[2] : globRe(m[2], true).test(p.name)));
      if (!procs.length) return ok('INFO: No tasks are running which match the specified criteria.');
    }
    const w = [[25, 'l'], [8, 'r'], [16, 'l'], [11, 'r'], [12, 'r']];
    return ok(['', columns(w, ['Image Name', 'PID', 'Session Name', 'Session#', 'Mem Usage']),
      columns(w, ['='.repeat(25), '='.repeat(8), '='.repeat(16), '='.repeat(11), '='.repeat(12)]),
      ...procs.map((p) => columns(w, [p.name, p.pid, p.session ?? 'Console', p.sessionNum ?? 1, `${commas(p.memK ?? 0)} K`]))].join('\n'));
  }

  function cmdTaskkill(args) {
    const lower = args.map((a) => a.toLowerCase());
    const force = lower.includes('/f');
    const valuesAfter = (flag) => lower.flatMap((a, i) => (a === flag && args[i + 1] ? [args[i + 1]] : []));
    const pids = valuesAfter('/pid');
    const names = valuesAfter('/im');
    if (!pids.length && !names.length) return fail('ERROR: Invalid syntax. Neither /FI nor /PID nor /IM were specified.\nType "TASKKILL /?" for usage.');
    const out = [];
    const errs = [];
    let exit = 0;
    const kill = (proc, byName) => {
      const who = byName ? `the process "${proc.name}" with PID ${proc.pid}` : `the process with PID ${proc.pid}`;
      if (proc.system && !rt.session.admin) { errs.push(`ERROR: The process with PID ${proc.pid} could not be terminated.\nReason: Access is denied.`); exit = 1; return; }
      if (!force && proc.needsForce) { errs.push(`ERROR: The process with PID ${proc.pid} could not be terminated.\nReason: This process can only be terminated forcefully (with /F option).`); exit = 1; return; }
      out.push(force ? `SUCCESS: The process ${byName ? `"${proc.name}" with PID ${proc.pid}` : `with PID ${proc.pid}`} has been terminated.` : `SUCCESS: Sent termination signal to ${who}.`);
      if (force || !proc.hung) delete rt.state.processes[proc.pid];
    };
    for (const pid of pids) {
      const proc = rt.state.processes?.[pid];
      if (!proc) { errs.push(`ERROR: The process "${pid}" not found.`); exit = 128; continue; }
      kill({ pid, ...proc }, false);
    }
    for (const name of names) {
      const matches = processList().filter((p) => globRe(name, true).test(p.name));
      if (!matches.length) { errs.push(`ERROR: The process "${name}" not found.`); exit = 128; continue; }
      matches.forEach((p) => kill(p, true));
    }
    return { out: out.join('\n'), err: errs.join('\n'), exit };
  }

  function cmdSfc(args) {
    const lower = args.map((a) => a.toLowerCase());
    const action = lower.find((a) => a === '/scannow' || a === '/verifyonly');
    if (!action) return ok(CMD_INFO.sfc[1]);
    if (!rt.session.admin) return fail('You must be an administrator running a console session in order to\nuse the sfc utility.');
    const w = rt.state.windows;
    const head = '\nBeginning system scan.  This process will take some time.\n\nBeginning verification phase of system scan.\nVerification 100% complete.\n\n';
    if (w.sfcBlocked) return say(`${head}Windows Resource Protection could not perform the requested operation.`, 1);
    if (w.systemFiles !== 'corrupt') { w.lastSfc = 'clean'; return ok(`${head}Windows Resource Protection did not find any integrity violations.`); }
    if (action === '/verifyonly') { w.lastSfc = 'found'; return say(`${head}Windows Resource Protection found integrity violations. Details are included in the CBS.Log windir\\Logs\\CBS\\CBS.log. For example\nC:\\Windows\\Logs\\CBS\\CBS.log.`, 1); }
    if (w.componentStore === 'healthy') {
      w.systemFiles = 'ok';
      w.lastSfc = 'repaired';
      return ok(`${head}Windows Resource Protection found corrupt files and successfully repaired them.\n${CBS_NOTE}`);
    }
    w.lastSfc = 'unrepaired';
    return say(`${head}Windows Resource Protection found corrupt files but was unable to fix some of them.\n${CBS_NOTE}`, 1);
  }

  function cmdDism(args) {
    const w = rt.state.windows;
    const lower = args.map((a) => a.toLowerCase());
    const head = `\nDeployment Image Servicing and Management tool\nVersion: ${w.toolVersion}\n`;
    const log = '\nThe DISM log file can be found at C:\\WINDOWS\\Logs\\DISM\\dism.log';
    if (!args.length || lower.includes('/?')) return ok(`${head}\n${CMD_INFO.dism[1]}`);
    if (!rt.session.admin) return say(`${head}\n\nError: 740\n\nElevated permissions are required to run DISM.\nUse an elevated command prompt to complete these tasks.`, 740);
    const unknown = (opt) => say(`${head}\n\nError: 87\n\nThe ${opt.replace(/^\//, '')} option is unknown.\nFor more information, refer to the help by running DISM.exe /?.\n${log}`, 87);
    if (!lower.includes('/online')) return unknown(lower.find((a) => a !== '/cleanup-image') ?? args[0]);
    if (!lower.includes('/cleanup-image')) return unknown(args.find((a) => a.toLowerCase() !== '/online') ?? '/online');
    const op = ['/checkhealth', '/scanhealth', '/restorehealth'].find((o) => lower.includes(o));
    if (!op) return unknown(args.find((a) => !['/online', '/cleanup-image'].includes(a.toLowerCase())) ?? 'cleanup-image');
    const body = `${head}\nImage Version: 10.0.${w.build}\n\n`;
    const state = w.componentStore;
    if (op !== '/restorehealth') {
      const verdict = state === 'healthy' ? 'No component store corruption detected.' : 'The component store is repairable.';
      return ok(`${body}${op === '/scanhealth' ? `${PROGRESS} ` : ''}${verdict}\nThe operation completed successfully.`);
    }
    const sourceArg = args.find((a) => a.toLowerCase().startsWith('/source:'));
    let sourceOk = false;
    if (sourceArg) {
      const raw = sourceArg.slice(8).replace(/^(wim|esd):/i, '').replace(/:\d+$/, '');
      sourceOk = Boolean(nodeAt(resolve(raw)));
    }
    const blocked = state === 'source-needed' ? !sourceOk : lower.includes('/limitaccess') && !sourceOk;
    if (state !== 'healthy' && blocked) {
      return say(`${body}${PROGRESS}\n\nError: 0x800f081f\n\nThe source files could not be found.\nUse the "Source" option to specify the location of the files that are required to restore the feature. For more information on specifying a source location, see https://go.microsoft.com/fwlink/?LinkId=243077.\n${log}`, 0x800f081f);
    }
    w.componentStore = 'healthy';
    return ok(`${body}${PROGRESS} The restore operation completed successfully.\nThe operation completed successfully.`);
  }

  function chkdskStages(vol, fix, surface) {
    const lines = [`The type of the file system is ${vol.fs ?? 'NTFS'}.`];
    if (vol.label) lines.push(`Volume label is ${vol.label}.`);
    lines.push('');
    if (!fix) lines.push('WARNING!  /F parameter not specified.', 'Running CHKDSK in read-only mode.', '');
    lines.push('Stage 1: Examining basic file system structure ...', 'File verification completed.', '',
      'Stage 2: Examining file name linkage ...', 'Index verification completed.', '',
      'Stage 3: Examining security descriptors ...', 'Security descriptor verification completed.', '');
    if (surface) lines.push('Stage 4: Looking for bad clusters in user file data ...', 'File data verification completed.', '', 'Stage 5: Looking for bad, free clusters ...', 'Free space verification is complete.', '');
    if (!vol.errors && !(surface && vol.badSectors)) lines.push('Windows has scanned the file system and found no problems.', 'No further action is required.');
    else if (!fix) lines.push('Windows has scanned the file system and found problems.', 'Run CHKDSK with the /F (fix) option to correct these.');
    else lines.push('Windows has made corrections to the file system.', 'No further action is required.');
    return lines.join('\n');
  }

  function cmdChkdsk(args) {
    const lower = args.map((a) => a.toLowerCase());
    if (!rt.session.admin) return fail('Access Denied as you do not have sufficient privileges or\nthe disk may be locked by another process.\nYou have to invoke this utility running in elevated mode\nand make sure the disk is unlocked.', 3);
    const letter = (args.find((a) => /^[a-z]:$/i.test(a)) ?? rt.session.cwd.slice(0, 2)).toUpperCase();
    const vol = rt.state.volumes?.[letter];
    if (!vol) return fail('Cannot open volume for direct access.', 3);
    const surface = lower.includes('/r');
    const fix = surface || lower.includes('/f') || lower.includes('/x');
    if (!fix) return say(chkdskStages(vol, false, false), vol.errors ? 3 : 0);
    if (vol.system) {
      ask('chkdsk', 'checked the next time the system restarts? (Y/N) ', { letter, surface });
      return ok(`The type of the file system is ${vol.fs ?? 'NTFS'}.\nCannot lock current drive.\n\nChkdsk cannot run because the volume is in use by another\nprocess.  Would you like to schedule this volume to be`);
    }
    const text = chkdskStages(vol, true, surface);
    const fixed = vol.errors || (surface && vol.badSectors);
    vol.errors = false;
    if (surface) vol.badSectors = false;
    return say(text, fixed ? 1 : 0);
  }

  function restartWindows(action, secs) {
    for (const vol of Object.values(rt.state.volumes ?? {})) {
      if (!vol.checkScheduled) continue;
      vol.errors = false;
      if (vol.checkMode === '/r') vol.badSectors = false;
      vol.checkScheduled = false;
      vol.lastBootCheck = now();
    }
    setKey('network.dnsCache', {});
    rt.state.power = { ...rt.state.power, restarts: (rt.state.power?.restarts ?? 0) + 1, last: action };
    rt.session.admin = false;
    rt.session.mode = '';
    rt.session.cwd = rt.session.home;
    const verb = action === 'restart' ? 'Windows restarts' : 'Windows shuts down and is powered back on';
    return ok(`[${verb}${secs ? ` after ${secs} seconds` : ''}. You sign in again as ${rt.session.user} with a new, non-elevated prompt.]`);
  }

  function cmdShutdown(args) {
    const lower = args.map((a) => a.toLowerCase());
    if (lower.includes('/a')) return fail('Unable to abort the system shutdown because no shutdown was in progress.(1116)', 1116);
    const action = lower.includes('/r') ? 'restart' : lower.includes('/s') ? 'shutdown' : null;
    if (!action) return ok(CMD_INFO.shutdown[1]);
    const t = lower.indexOf('/t');
    return restartWindows(action, t >= 0 ? Number(args[t + 1]) : 30);
  }

  function cmdGpupdate(args) {
    const pending = rt.state.gp?.pending ?? {};
    for (const [key, value] of Object.entries(pending)) setKey(key, value);
    rt.state.gp = { ...rt.state.gp, pending: {}, lastUpdate: now(), forced: rt.state.gp?.forced || args.some((a) => a.toLowerCase() === '/force') };
    return ok('Updating policy...\n\nComputer Policy update has completed successfully.\nUser Policy update has completed successfully.\n');
  }

  function cmdGpresult(args) {
    const lower = args.map((a) => a.toLowerCase());
    if (!lower.includes('/r')) return ok(CMD_INFO.gpresult[1]);
    const gp = rt.state.gp ?? {};
    const domain = rt.state.domain;
    const who = `${(domain ?? host).toUpperCase()}\\${rt.session.user}`;
    const applied = (title, gpos) => [`    Applied Group Policy Objects`, `    ${'-'.repeat(29)}`, ...(gpos?.length ? gpos : ['Local Group Policy']).map((g) => `        ${g}`), ''];
    const lines = ['', 'Microsoft (R) Windows (R) Operating System Group Policy Result tool v2.0', '© Microsoft Corporation. All rights reserved.', '',
      `Created on ${DATES.gp(now())}`, '', '', `RSOP data for ${who} on ${host} : Logging Mode`, '-'.repeat(`RSOP data for ${who} on ${host} : Logging Mode`.length), '',
      `OS Configuration:            ${domain ? 'Member Workstation' : 'Standalone Workstation'}`, `OS Version:                  10.0.${rt.state.windows.build.split('.')[0]}`,
      `Site Name:                   ${domain ? 'Default-First-Site-Name' : 'N/A'}`, 'Roaming Profile:             N/A', `Local Profile:               ${rt.session.home}`,
      'Connected over a slow link?: No', ''];
    if (rt.session.admin) {
      lines.push('', 'COMPUTER SETTINGS', '-'.repeat(17), `    Last time Group Policy was applied: ${DATES.gp(gp.lastUpdate ?? now())}`,
        `    Group Policy was applied from:      ${gp.dc ?? 'N/A'}`, '', ...applied('computer', gp.computerGpos));
    }
    lines.push('', 'USER SETTINGS', '-'.repeat(13), `    Last time Group Policy was applied: ${DATES.gp(gp.lastUpdate ?? now())}`,
      `    Group Policy was applied from:      ${gp.dc ?? 'N/A'}`, '', ...applied('user', gp.userGpos));
    return ok(lines.join('\n'));
  }

  // ----- net -----
  const winUsers = () => rt.state.users;
  const findUser = (name) => Object.keys(winUsers()).find((u) => u.toLowerCase() === String(name).toLowerCase());
  const groupNames = () => [...new Set([...Object.keys(LOCAL_GROUPS), ...(rt.state.localGroups ?? []), ...Object.values(winUsers()).flatMap((u) => u.groups ?? [])])].sort();
  const findGroup = (name) => groupNames().find((g) => g.toLowerCase() === String(name).toLowerCase());
  const DONE = 'The command completed successfully.\n';

  function netUser(rest) {
    const sw = rest.filter((a) => a.startsWith('/')).map((a) => a.toLowerCase());
    const [name, password] = rest.filter((a) => !a.startsWith('/'));
    if (!name) {
      const names = Object.keys(winUsers()).sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
      const rows = [];
      for (let i = 0; i < names.length; i += 3) rows.push(names.slice(i, i + 3).map((n) => n.padEnd(25)).join('').trimEnd());
      return ok(`\nUser accounts for \\\\${host}\n\n${RULE79}\n${rows.join('\n')}\n${DONE}`);
    }
    const existing = findUser(name);
    const changes = sw.length || password !== undefined;
    if (changes && !rt.session.admin) return fail(ACCESS_DENIED_NET, 2);
    if (sw.includes('/add')) {
      if (existing) return fail('The account already exists.\n\nMore help is available by typing NET HELPMSG 2224.\n', 2);
      winUsers()[name] = { active: true, groups: ['Users'] };
      return ok(DONE);
    }
    if (!existing) return fail('The user name could not be found.\n\nMore help is available by typing NET HELPMSG 2221.\n', 2);
    const u = winUsers()[existing];
    if (sw.includes('/delete')) { delete winUsers()[existing]; return ok(DONE); }
    const active = sw.find((s) => s.startsWith('/active:'));
    if (active) { u.active = active.endsWith('yes'); return ok(DONE); }
    if (password !== undefined) { u.passwordSet = now(); return ok(DONE); }
    const row = (label, value) => `${label.padEnd(29)}${value ?? ''}`.trimEnd();
    const set = DATES.gp(u.passwordSet ?? '2026-09-01T08:14:22').replace(' at', '');
    return ok([row('User name', existing), row('Full Name', u.fullName ?? ''), row('Comment', u.comment ?? ''), row("User's comment", ''),
      row('Country/region code', '000 (System Default)'), row('Account active', u.active ? 'Yes' : 'No'), row('Account expires', 'Never'), '',
      row('Password last set', set), row('Password expires', 'Never'), row('Password changeable', set), row('Password required', 'Yes'),
      row('User may change password', 'Yes'), '', row('Workstations allowed', 'All'), row('Logon script', ''), row('User profile', ''), row('Home directory', ''),
      row('Last logon', u.lastLogon ? DATES.gp(u.lastLogon).replace(' at', '') : 'Never'), '', row('Logon hours allowed', 'All'), '',
      row('Local Group Memberships', (u.groups ?? []).map((g) => `*${g}`).join('  ') || '*None'), row('Global Group memberships', '*None'), DONE].join('\n'));
  }

  function netLocalgroup(rest) {
    const sw = rest.filter((a) => a.startsWith('/')).map((a) => a.toLowerCase());
    const words = rest.filter((a) => !a.startsWith('/'));
    if (!words.length) return ok(`\nAliases for \\\\${host}\n\n${RULE79}\n${groupNames().map((g) => `*${g}`).join('\n')}\n${DONE}`);
    const group = findGroup(words[0]);
    if (!group) return fail('System error 1376 has occurred.\n\nThe specified local group does not exist.\n', 2);
    const members = () => Object.entries(winUsers()).filter(([, u]) => (u.groups ?? []).includes(group)).map(([n]) => n).sort();
    if (sw.includes('/add') || sw.includes('/delete')) {
      if (!rt.session.admin) return fail(ACCESS_DENIED_NET, 2);
      const errs = [];
      for (const raw of words.slice(1)) {
        const user = findUser(raw);
        if (!user) { errs.push(`There is no such global user or group: ${raw}.\n\nMore help is available by typing NET HELPMSG 3783.\n`); continue; }
        const groups = winUsers()[user].groups ??= [];
        if (sw.includes('/add')) {
          if (groups.includes(group)) errs.push('System error 1378 has occurred.\n\nThe specified account name is already a member of the group.\n');
          else groups.push(group);
        } else if (!groups.includes(group)) errs.push('System error 1377 has occurred.\n\nThe specified account name is not a member of the group.\n');
        else groups.splice(groups.indexOf(group), 1);
      }
      return errs.length ? fail(errs.join('\n'), 2) : ok(DONE);
    }
    return ok([`Alias name     ${group}`, `Comment        ${LOCAL_GROUPS[group] ?? ''}`.trimEnd(), '', 'Members', '', RULE79, ...members(), DONE].join('\n'));
  }

  function netUse(rest) {
    const sw = rest.filter((a) => a.startsWith('/')).map((a) => a.toLowerCase());
    const words = rest.filter((a) => !a.startsWith('/'));
    const mapped = rt.state.mappedDrives;
    if (!words.length) {
      const rows = Object.entries(mapped).sort().map(([letter, unc]) => `OK           ${letter.padEnd(10)}${unc.padEnd(26)}Microsoft Windows Network`);
      return ok(rows.length ? `New connections will be remembered.\n\n\nStatus       Local     Remote                    Network\n\n${RULE79}\n${rows.join('\n')}\n${DONE}`
        : 'New connections will be remembered.\n\nThere are no entries in the list.\n');
    }
    const [first, second] = words;
    if (sw.includes('/delete')) {
      const letter = Object.keys(mapped).find((l) => l.toLowerCase() === first.toLowerCase());
      if (!letter) return fail('The network connection could not be found.\n\nMore help is available by typing NET HELPMSG 2250.\n', 2);
      delete mapped[letter];
      return ok(`${letter} was deleted successfully.\n`);
    }
    const unc = first.startsWith('\\\\') ? first : second;
    let letter = first.startsWith('\\\\') ? null : first.toUpperCase();
    const target = unc && keyOf(resolve(unc));
    if (!target || nodeAt(target)?.type !== 'dir') return fail('System error 53 has occurred.\n\nThe network path was not found.\n', 2);
    if (letter === '*') letter = 'ZYXWVUTSRQPONMLKJIHGFED'.split('').map((c) => `${c}:`).find((l) => !driveExists(l));
    if (letter && driveExists(letter)) return fail('System error 85 has occurred.\n\nThe local device name is already in use.\n', 2);
    if (letter) mapped[letter] = target;
    return ok(`${first === '*' ? `Drive ${letter} is now connected to ${unc}.\n\n` : ''}${DONE}`);
  }

  function findService(name) {
    const services = rt.state.services ?? {};
    const lower = String(name).toLowerCase();
    return Object.keys(services).find((k) => k.toLowerCase() === lower || services[k].display?.toLowerCase() === lower);
  }

  function netStartStop(verb, rest) {
    const services = rt.state.services ?? {};
    const name = rest.join(' ');
    if (!name) {
      if (verb === 'stop') return fail('The syntax of this command is:\n\nNET STOP\nservice\n');
      const running = Object.values(services).filter((s) => s.status === 'Running').map((s) => `   ${s.display}`).sort();
      return ok(`These Windows services are started:\n\n${running.join('\n')}\n\n${DONE}`);
    }
    const key = findService(name);
    if (!key) return fail('The service name is invalid.\n\nMore help is available by typing NET HELPMSG 2185.\n', 2);
    const svc = services[key];
    if (!rt.session.admin) return fail(ACCESS_DENIED_NET, 2);
    if (verb === 'start') {
      if (svc.status === 'Running') return fail('The requested service has already been started.\n\nMore help is available by typing NET HELPMSG 2182.\n', 2);
      if (svc.startType === 'Disabled') return fail('System error 1058 has occurred.\n\nThe service cannot be started, either because it is disabled or because it has no enabled devices associated with it.\n', 2);
      if (svc.startWhen && !test(svc.startWhen)) return say(`The ${svc.display} service is starting.\nThe ${svc.display} service could not be started.\n\nThe service did not report an error.\n\nMore help is available by typing NET HELPMSG 3534.\n`, 2);
      svc.status = 'Running';
      return ok(`The ${svc.display} service is starting.\nThe ${svc.display} service was started successfully.\n`);
    }
    if (svc.status !== 'Running') return fail(`The ${svc.display} service is not started.\n\nMore help is available by typing NET HELPMSG 3521.\n`, 2);
    svc.status = 'Stopped';
    return ok(`The ${svc.display} service is stopping.\nThe ${svc.display} service was stopped successfully.\n`);
  }

  function cmdNet(args) {
    const [sub = '', ...rest] = args;
    switch (sub.toLowerCase()) {
      case 'user': case 'users': return netUser(rest);
      case 'localgroup': return netLocalgroup(rest);
      case 'use': return netUse(rest);
      case 'start': case 'stop': return netStartStop(sub.toLowerCase(), rest);
      default: return fail(CMD_INFO.net[1]);
    }
  }

  function cmdWhoami(args) {
    if (args.some((a) => !a.startsWith('/'))) return fail(`ERROR: Invalid argument/option - '${args.find((a) => !a.startsWith('/'))}'.\nType "WHOAMI /?" for usage.`);
    if (args.length) return fail(`ERROR: Invalid argument/option - '${args[0]}'.\nType "WHOAMI /?" for usage.`);
    return ok(`${(rt.state.domain ?? host).toLowerCase()}\\${rt.session.user.toLowerCase()}`);
  }

  function cmdFormat(args) {
    const lower = args.map((a) => a.toLowerCase());
    const letter = args.find((a) => /^[a-z]:$/i.test(a))?.toUpperCase();
    if (!letter) return fail('Required parameter missing -');
    if (!rt.session.admin) return fail('Access denied as you do not have sufficient privileges.\nYou have to invoke this utility running in elevated mode.', 4);
    const vol = rt.state.volumes?.[letter];
    if (!vol) return fail('Invalid drive specification.', 4);
    if (vol.system) return fail('Format cannot run because the volume is in use by another\nprocess.', 4);
    const fsArg = lower.find((a) => a.startsWith('/fs:'))?.slice(4);
    const label = args.find((a) => a.toLowerCase().startsWith('/v:'))?.slice(3);
    const data = { letter, fs: fsArg ? ({ ntfs: 'NTFS', fat32: 'FAT32', exfat: 'exFAT', fat: 'FAT' }[fsArg] ?? fsArg.toUpperCase()) : vol.fs ?? 'NTFS', label, quick: lower.includes('/q') };
    if (vol.removable) { ask('format', 'and press ENTER when ready...', data); return ok(`Insert new disk for drive ${letter}`); }
    ask('format', 'Proceed with Format (Y/N)? ', data);
    return ok(`The type of the file system is ${vol.fs ?? 'RAW'}.\nWARNING, ALL DATA ON NON-REMOVABLE DISK\nDRIVE ${letter} WILL BE LOST!`);
  }

  function doFormat({ letter, fs, label, quick }) {
    const vol = rt.state.volumes[letter];
    const root = `${letter}\\`;
    for (const c of childrenOf(root)) removeTree(c.path, false);
    Object.assign(vol, { fs, label: label ?? vol.label, freeBytes: vol.sizeBytes ?? 0, errors: false, badSectors: false });
    const gb = ((vol.sizeBytes ?? 0) / 1024 ** 3).toFixed(1);
    return ok([`${quick ? 'QuickFormatting' : 'Verifying'} ${gb} GB`, 'Creating file system structures.', 'Format complete.', `${gb.padStart(12)} GB total disk space.`, `${gb.padStart(12)} GB are available.`].join('\n'));
  }

  // ----- diskpart -----
  const disks = () => rt.state.disks ?? {};
  const selectedDisk = () => (rt.session.disk === null ? null : disks()[rt.session.disk]);
  const selectedPart = () => selectedDisk()?.partitions?.[rt.session.part] ?? null;
  const NO_DISK = 'There is no disk selected.\nPlease select a disk and try again.';
  const NO_VOLUME = 'There is no volume selected.\nPlease select a volume and try again.';
  const gbText = (gb) => (gb >= 1 ? `${Math.round(gb)} GB` : gb > 0 ? `${Math.round(gb * 1024)} MB` : '0 B');
  function volumesList() {
    const list = [];
    for (const [num, disk] of Object.entries(disks())) {
      (disk.partitions ?? []).forEach((part, idx) => { if (part.fs || part.letter) list.push({ disk: num, idx, part, removable: disk.removable, system: disk.system }); });
    }
    return list;
  }

  function cmdDiskpart() {
    if (!rt.session.admin) return fail('[DiskPart needs administrator rights. Open Command Prompt with Run as administrator, then run diskpart again.]');
    rt.session.mode = 'diskpart';
    rt.session.disk = null;
    rt.session.part = null;
    return ok(`\nMicrosoft DiskPart version ${rt.state.windows.toolVersion}\n\nCopyright (C) Microsoft Corporation.\nOn computer: ${host}`);
  }

  function diskpartLine(line) {
    const words = line.trim().split(/\s+/);
    const lower = words.map((w) => w.toLowerCase());
    const [verb, a1, a2] = lower;
    const disk = selectedDisk();
    switch (verb) {
      case 'list': {
        if (a1 === 'disk') {
          const rows = Object.entries(disks()).map(([n, d]) => {
            const used = (d.partitions ?? []).reduce((s, p) => s + p.sizeGB, 0);
            return `${String(n) === String(rt.session.disk) ? '*' : ' '} ${`Disk ${n}`.padEnd(8)}  ${(d.status ?? 'Online').padEnd(13)}  ${gbText(d.sizeGB).padStart(7)}  ${gbText(Math.max(0, d.sizeGB - used)).padStart(7)}  ${'   '}  ${d.gpt ? ' * ' : ''}`.trimEnd();
          });
          return ok(['', '  Disk ###  Status         Size     Free     Dyn  Gpt', '  --------  -------------  -------  -------  ---  ---', ...rows].join('\n'));
        }
        if (a1 === 'volume' || a1 === 'vol') {
          const rows = volumesList().map((v, i) => {
            const selected = String(v.disk) === String(rt.session.disk) && v.idx === rt.session.part;
            const info = v.system && v.part.letter === 'C' ? 'Boot' : '';
            return `${selected ? '*' : ' '} ${`Volume ${i}`.padEnd(10)}   ${v.part.letter ?? ' '}   ${(v.part.label ?? '').padEnd(11)}  ${(v.part.fs ?? 'RAW').padEnd(5)}  ${(v.removable ? 'Removable' : 'Partition').padEnd(10)}  ${gbText(v.part.sizeGB).padStart(7)}  ${'Healthy'.padEnd(9)}  ${info}`.trimEnd();
          });
          return ok(['', '  Volume ###  Ltr  Label        Fs     Type        Size     Status     Info', '  ----------  ---  -----------  -----  ----------  -------  ---------  --------', ...rows].join('\n'));
        }
        if (a1 === 'partition' || a1 === 'part') {
          if (!disk) return fail(NO_DISK);
          if (!disk.partitions?.length) return fail('There are no partitions on this disk to show.');
          const rows = disk.partitions.map((p, i) => `${i === rt.session.part ? '*' : ' '} ${`Partition ${i + 1}`.padEnd(13)}  ${(p.type ?? 'Primary').padEnd(16)}  ${gbText(p.sizeGB).padStart(7)}  ${i ? gbText(disk.partitions.slice(0, i).reduce((s, x) => s + x.sizeGB, 0)) : '1024 KB'}`.trimEnd());
          return ok(['', '  Partition ###  Type              Size     Offset', '  -------------  ----------------  -------  -------', ...rows].join('\n'));
        }
        return ok('\nMicrosoft DiskPart version 10.0\n\nDISK        - Display a list of disks. For example, LIST DISK.\nPARTITION   - Display a list of partitions on the selected disk.\nVOLUME      - Display a list of volumes. For example, LIST VOLUME.');
      }
      case 'detail': case 'det': {
        if (a1 !== 'disk') return fail('The arguments specified for this command are not valid.\nFor more information on the command type: HELP DETAIL');
        if (!disk) return fail(NO_DISK);
        const yn = (v) => (v ? 'Yes' : 'No');
        const vols = volumesList().map((v, i) => ({ ...v, i })).filter((v) => String(v.disk) === String(rt.session.disk));
        const rows = vols.map((v) => `  ${`Volume ${v.i}`.padEnd(10)}   ${v.part.letter ?? ' '}   ${(v.part.label ?? '').padEnd(11)}  ${(v.part.fs ?? 'RAW').padEnd(5)}  ${(v.removable ? 'Removable' : 'Partition').padEnd(10)}  ${gbText(v.part.sizeGB).padStart(7)}  Healthy    ${v.system && v.part.letter === 'C' ? 'Boot' : ''}`.trimEnd());
        return ok([
          '', disk.model ?? (disk.removable ? 'USB Flash Disk USB Device' : 'Internal Disk'),
          `Disk ID: ${disk.id ?? `{${String(rt.session.disk).padStart(8, '0')}-0000-0000-0000-000000000000}`}`,
          `Type   : ${disk.bus ?? (disk.removable ? 'USB' : 'SATA')}`, `Status : ${disk.status ?? 'Online'}`,
          `Boot Disk  : ${yn(disk.system)}`, `Pagefile Disk  : ${yn(disk.system)}`, '',
          ...(rows.length ? ['  Volume ###  Ltr  Label        Fs     Type        Size     Status     Info', '  ----------  ---  -----------  -----  ----------  -------  ---------  --------', ...rows] : ['There are no volumes.']),
        ].join('\n'));
      }
      case 'select': case 'sel': {
        if (a1 === 'disk') {
          if (a2 === undefined || !disks()[a2]) { rt.session.disk = null; rt.session.part = null; return fail('The disk you specified is not valid.\n\nThere is no disk selected.'); }
          rt.session.disk = a2;
          rt.session.part = null;
          return ok(`\nDisk ${a2} is now the selected disk.`);
        }
        if (a1 === 'partition' || a1 === 'part') {
          if (!disk) return fail(NO_DISK);
          const idx = Number(a2) - 1;
          if (!disk.partitions?.[idx]) return fail('The partition you specified is not valid.\nPlease select a valid partition.\n\nThere is no partition selected.');
          rt.session.part = idx;
          return ok(`\nPartition ${a2} is now the selected partition.`);
        }
        if (a1 === 'volume' || a1 === 'vol') {
          const v = /^[a-z]$/i.test(a2 ?? '') ? volumesList().find((x) => x.part.letter === a2.toUpperCase()) : volumesList()[Number(a2)];
          if (!v) return fail('The volume you selected is not valid or does not exist.');
          rt.session.disk = v.disk;
          rt.session.part = v.idx;
          return ok(`\nVolume ${volumesList().indexOf(v)} is the selected volume.`);
        }
        return fail('The arguments specified for this command are not valid.\nFor more information on the command type: HELP SELECT');
      }
      case 'clean': {
        if (!disk) return fail(NO_DISK);
        if (disk.system) { disk.cleanAttempted = true; return fail('Virtual Disk Service error:\nClean is not allowed on the disk containing the current boot,\nsystem, pagefile, crashdump or hibernation volume.'); }
        for (const part of disk.partitions ?? []) {
          if (!part.letter) continue;
          removeTree(`${part.letter}:\\`, false);
          delete rt.state.volumes[`${part.letter}:`];
        }
        disk.partitions = [];
        disk.cleaned = true;
        rt.session.part = null;
        return ok('\nDiskPart succeeded in cleaning the disk.');
      }
      case 'create': {
        if (a1 !== 'partition' || a2 !== 'primary') return fail('The arguments specified for this command are not valid.\nFor more information on the command type: HELP CREATE PARTITION PRIMARY');
        if (!disk) return fail(NO_DISK);
        const used = (disk.partitions ?? []).reduce((s, p) => s + p.sizeGB, 0);
        const free = disk.sizeGB - used;
        const sizeArg = lower.find((w) => w.startsWith('size='));
        const size = sizeArg ? Number(sizeArg.slice(5)) / 1024 : free;
        if (free < 0.01 || size > free) return fail('Virtual Disk Service error:\nThere is not enough usable space for this operation.');
        disk.partitions = [...(disk.partitions ?? []), { sizeGB: size, type: 'Primary' }];
        rt.session.part = disk.partitions.length - 1;
        return ok('\nDiskPart succeeded in creating the specified partition.');
      }
      case 'format': {
        const part = selectedPart();
        if (!part) return fail(NO_VOLUME);
        if (disk.system) return fail('Virtual Disk Service error:\nThe operation is not supported on a boot, system, pagefile,\ncrashdump or hibernation volume.');
        const fsArg = lower.find((w) => w.startsWith('fs='))?.slice(3) ?? 'ntfs';
        const fs = { ntfs: 'NTFS', fat32: 'FAT32', exfat: 'exFAT' }[fsArg];
        if (!fs) return fail('Virtual Disk Service error:\nThe file system specified is not valid.');
        if (fs === 'FAT32' && part.sizeGB > 32) return fail('Virtual Disk Service error:\nThe volume size is too big.');
        part.fs = fs;
        part.label = words.find((w) => w.toLowerCase().startsWith('label='))?.slice(6) ?? part.label;
        part.quick = lower.includes('quick');
        if (part.letter) {
          removeTree(`${part.letter}:\\`, false);
          rt.fs[`${part.letter}:\\`] = { type: 'dir' };
          Object.assign(rt.state.volumes[`${part.letter}:`] ?? {}, { fs, label: part.label, freeBytes: Math.round(part.sizeGB * 1024 ** 3) });
        }
        return ok('\n  100 percent completed\n\nDiskPart successfully formatted the volume.');
      }
      case 'assign': {
        const part = selectedPart();
        if (!part) return fail(NO_VOLUME);
        const wantArg = lower.find((w) => w.startsWith('letter='))?.slice(7).toUpperCase();
        const letter = wantArg ?? 'DEFGHIJKLMNOPQRSTUVWXYZ'.split('').find((c) => !driveExists(`${c}:`));
        if (!letter || driveExists(`${letter}:`)) return fail('Virtual Disk Service error:\nThe specified drive letter is not free to be assigned.');
        part.letter = letter;
        rt.state.volumes = { ...rt.state.volumes, [`${letter}:`]: { label: part.label, fs: part.fs ?? 'RAW', serial: '4C1E-77A2', sizeBytes: Math.round(part.sizeGB * 1024 ** 3), freeBytes: Math.round(part.sizeGB * 1024 ** 3), removable: !!disk.removable } };
        rt.fs[`${letter}:\\`] = { type: 'dir' };
        return ok('\nDiskPart successfully assigned the drive letter or mount point.');
      }
      case 'active': {
        if (!selectedPart()) return fail('There is no partition selected.\nPlease select a partition and try again.');
        if (disk.gpt) return fail('The selected disk is not a fixed MBR disk.\nThe ACTIVE command can only be used on fixed MBR disks.');
        selectedPart().active = true;
        return ok('\nDiskPart marked the current partition as active.');
      }
      case 'exit':
        rt.session.mode = '';
        return ok('\nLeaving DiskPart...');
      case 'rem': case undefined:
        return ok();
      default:
        return ok('\nMicrosoft DiskPart version 10.0\n\nASSIGN      - Assign a drive letter or mount point to the selected volume.\nCLEAN       - Clear the configuration information, or all information, off the\n              disk.\nCREATE      - Create a volume, partition or virtual disk.\nEXIT        - Exit DiskPart.\nFORMAT      - Format the volume or partition.\nLIST        - Display a list of objects.\nSELECT      - Shift the focus to an object.');
    }
  }

  const CMD = {
    cd: cmdCd, dir: cmdDir, copy: cmdCopy, xcopy: cmdXcopy, robocopy: cmdRobocopy, move: cmdMove, del: cmdDel, md: cmdMd, rd: cmdRd, type: cmdType,
    ipconfig: cmdIpconfig, ping: winPing, tracert: cmdTracert, pathping: cmdPathping, nslookup: nslookupCmd, netstat: cmdNetstat,
    tasklist: cmdTasklist, taskkill: cmdTaskkill, sfc: cmdSfc, dism: cmdDism, chkdsk: cmdChkdsk, gpupdate: cmdGpupdate, gpresult: cmdGpresult,
    net: cmdNet, shutdown: cmdShutdown, hostname: () => ok(host), whoami: cmdWhoami, format: cmdFormat, diskpart: cmdDiskpart,
    winver: () => ok(`[About Windows]\nMicrosoft Windows\nVersion ${rt.state.windows.version} (OS Build ${rt.state.windows.build})\n© Microsoft Corporation. All rights reserved.`),
    cls: () => ok('', { clear: true }),
    exit: () => ok(),
    help(args) {
      if (args[0]) {
        const key = CMD_ALIASES[args[0].toLowerCase()] ?? args[0].toLowerCase();
        return CMD_INFO[key] ? ok(`${CMD_INFO[key][0]}\n\n${CMD_INFO[key][1]}`) : fail('This command is not supported by the help utility.  Try "x /?".'.replace('x', args[0]));
      }
      const rows = Object.keys(CMD).sort().map((k) => `${k.toUpperCase().padEnd(15)}${CMD_INFO[k]?.[0] ?? ''}`);
      return ok(['For more information on a specific command, type HELP command-name', ...rows].join('\n'));
    },
  };

  function runCmdLine(line) {
    const expanded = line.replace(/%(\w+)%/g, (all, name) => cmdEnv()[name.toUpperCase()] ?? all);
    let [name = '', ...args] = tokenize(expanded, 'windows-cmd');
    const glued = /^(cd|chdir)([.\\].*)$/i.exec(name);
    if (glued) { name = glued[1]; args = [glued[2], ...args]; }
    if (/^[a-z]:$/i.test(name)) {
      const letter = name.toUpperCase();
      if (!driveExists(letter)) return fail('The system cannot find the drive specified.');
      rt.session.cwd = `${letter}\\`;
      return ok();
    }
    const key = CMD_ALIASES[name.toLowerCase()] ?? name.toLowerCase().replace(/\.exe$/, '');
    const fn = CMD[key];
    if (!fn) return fail(`'${name}' is not recognized as an internal or external command,\noperable program or batch file.`, 9009);
    if (args[0] === '/?' && CMD_INFO[key]) return ok(key === 'robocopy' ? CMD_INFO[key][1] : `${CMD_INFO[key][0]}\n\n${CMD_INFO[key][1]}`);
    return fn(args);
  }

  function cmdEnv() {
    return { USERPROFILE: rt.session.home, USERNAME: rt.session.user, COMPUTERNAME: host, SYSTEMROOT: 'C:\\Windows', WINDIR: 'C:\\Windows', SYSTEMDRIVE: 'C:', TEMP: `${rt.session.home}\\AppData\\Local\\Temp`, HOMEDRIVE: 'C:' };
  }

  // =====================================================================
  // Windows PowerShell 5.1
  // =====================================================================
  function psError(line, { cmdlet, prefix = cmdlet, message, category, target = '', exception, errorId, at = 0, length = line.length }) {
    return [`${prefix} : ${message}`, `At line:1 char:${at + 1}`, `+ ${line}`, `+ ${' '.repeat(at)}${'~'.repeat(Math.max(1, length))}`,
      `    + CategoryInfo          : ${category}: (${target}) [${cmdlet ?? ''}], ${exception}`, `    + FullyQualifiedErrorId : ${errorId}`].join('\n');
  }
  const psClass = (cmdlet) => `Microsoft.PowerShell.Commands.${cmdlet.replace('-', '')}Command`;
  const notFoundPath = (line, cmdlet, p) => psError(line, { cmdlet, message: `Cannot find path '${p}' because it does not exist.`, category: 'ObjectNotFound', target: `${p}:String`, exception: 'ItemNotFoundException', errorId: `PathNotFound,${psClass(cmdlet)}` });

  const PS_PARAMS = {
    'Get-Service': { positional: ['Name'], values: ['Name', 'DisplayName'], switches: [] },
    'Start-Service': { positional: ['Name'], values: ['Name', 'DisplayName'], switches: ['PassThru'] },
    'Stop-Service': { positional: ['Name'], values: ['Name', 'DisplayName'], switches: ['Force', 'PassThru'] },
    'Restart-Service': { positional: ['Name'], values: ['Name', 'DisplayName'], switches: ['Force', 'PassThru'] },
    'Get-Process': { positional: ['Name'], values: ['Name', 'Id'], switches: [] },
    'Stop-Process': { positional: ['Id'], values: ['Id', 'Name'], switches: ['Force', 'PassThru'] },
    'Get-NetIPConfiguration': { positional: ['InterfaceAlias'], values: ['InterfaceAlias'], switches: ['Detailed', 'All'] },
    'Test-NetConnection': { positional: ['ComputerName'], values: ['ComputerName', 'Port', 'CommonTCPPort', 'InformationLevel'], switches: ['TraceRoute'] },
    'Get-ChildItem': { positional: ['Path', 'Filter'], values: ['Path', 'Filter', 'LiteralPath'], switches: ['Recurse', 'Force', 'File', 'Directory', 'Name'] },
    'Copy-Item': { positional: ['Path', 'Destination'], values: ['Path', 'Destination', 'LiteralPath'], switches: ['Recurse', 'Force', 'PassThru'] },
    'Move-Item': { positional: ['Path', 'Destination'], values: ['Path', 'Destination', 'LiteralPath'], switches: ['Force', 'PassThru'] },
    'Remove-Item': { positional: ['Path'], values: ['Path', 'LiteralPath', 'Filter'], switches: ['Recurse', 'Force'] },
    'Get-Content': { positional: ['Path'], values: ['Path', 'TotalCount', 'Tail', 'LiteralPath'], switches: [] },
    'Set-Location': { positional: ['Path'], values: ['Path', 'LiteralPath'], switches: ['PassThru'] },
    'Get-Location': { positional: [], values: [], switches: [] },
    'New-Item': { positional: ['Path'], values: ['Path', 'ItemType', 'Name', 'Value'], switches: ['Force'] },
    'Start-Process': { positional: ['FilePath', 'ArgumentList'], values: ['FilePath', 'ArgumentList', 'Verb', 'WorkingDirectory'], switches: ['Wait', 'PassThru', 'NoNewWindow'] },
    'Clear-Host': { positional: [], values: [], switches: [] },
  };

  function psParams(cmdlet, tokens, line) {
    const spec = PS_PARAMS[cmdlet];
    const names = [...spec.values, ...spec.switches];
    const out = {};
    const positional = [];
    for (let i = 0; i < tokens.length; i += 1) {
      const t = tokens[i];
      if (/^-[A-Za-z]/.test(t)) {
        const raw = t.slice(1).split(':')[0];
        const exact = names.find((n) => n.toLowerCase() === raw.toLowerCase());
        const hits = names.filter((n) => n.toLowerCase().startsWith(raw.toLowerCase()));
        const name = exact ?? (hits.length === 1 ? hits[0] : null);
        if (!name) {
          const at = line.indexOf(t);
          return {
            error: psError(line, hits.length > 1
              ? { cmdlet, message: `Parameter cannot be processed because the parameter name '${raw}' is ambiguous. Possible matches include: ${hits.map((h) => `-${h}`).join(' ')}.`, category: 'InvalidArgument', target: ':', exception: 'ParameterBindingException', errorId: `AmbiguousParameter,${psClass(cmdlet)}`, at, length: t.length }
              : { cmdlet, message: `A parameter cannot be found that matches parameter name '${raw}'.`, category: 'InvalidArgument', target: ':', exception: 'ParameterBindingException', errorId: `NamedParameterNotFound,${psClass(cmdlet)}`, at, length: t.length }),
          };
        }
        if (spec.switches.includes(name)) out[name] = true;
        else out[name] = tokens[(i += 1)];
      } else positional.push(t);
    }
    for (const name of spec.positional) if (out[name] === undefined && positional.length) out[name] = positional.shift();
    return out;
  }

  const psList = (value) => (value === undefined ? [] : String(value).split(',').map((s) => s.trim()).filter(Boolean));

  const dirsFirst = (entries) => [...entries].sort((a, b) => (a.node.type === b.node.type ? 0 : a.node.type === 'dir' ? -1 : 1));

  function psChildBlock(dir, entries) {
    const rows = dirsFirst(entries).map((e) => {
      const attrs = e.node.attrs ?? '';
      const mode = e.node.type === 'dir' ? `d-${/R/i.test(attrs) ? 'r' : '-'}${/H/i.test(attrs) ? 'h' : '-'}${/S/i.test(attrs) ? 's' : '-'}-`
        : `-a${/R/i.test(attrs) ? 'r' : '-'}${/H/i.test(attrs) ? 'h' : '-'}${/S/i.test(attrs) ? 's' : '-'}-`;
      const [date, time] = DATES.ps(e.node.mtime ?? now());
      return `${mode}${date.padStart(18)}${time.padStart(10)}${(e.node.type === 'dir' ? '' : String(sizeOf(e.node))).padStart(15)} ${e.name}`;
    });
    return ['', '', `    Directory: ${dir}`, '', '', 'Mode                 LastWriteTime         Length Name', '----                 -------------         ------ ----', ...rows, ''].join('\n');
  }

  const psItemPath = (o) => o.Path ?? o.LiteralPath;

  const PS = {
    'Get-ChildItem'(o, line) {
      const raw = psItemPath(o) ?? '.';
      const p = resolve(raw);
      const n = nodeAt(p);
      if (!n && !hasWildcard(P.base(p))) return fail(notFoundPath(line, 'Get-ChildItem', p));
      const dir = n?.type === 'dir' ? p : P.parent(p);
      const nameRe = n?.type === 'dir' ? null : globRe(P.base(p), true);
      const filterRe = o.Filter ? globRe(o.Filter, true) : null;
      const keep = (e) => (o.Force || !/[HS]/i.test(e.node.attrs ?? '')) && (!o.File || e.node.type === 'file') && (!o.Directory || e.node.type === 'dir')
        && (!filterRe || filterRe.test(e.name)) && (!nameRe || nameRe.test(e.name));
      const dirs = o.Recurse ? walk(dir).filter((e) => e.node.type === 'dir').map((e) => e.path) : [dir];
      if (o.Name) return ok(dirs.flatMap((d) => dirsFirst(childrenOf(d).filter(keep)).map((e) => relative(dir, e.path))).join('\n'));
      const blocks = dirs.map((d) => [d, childrenOf(d).filter(keep)]).filter(([, entries]) => entries.length).map(([d, entries]) => psChildBlock(d, entries));
      return ok(blocks.join('\n'));
    },
    'Set-Location'(o, line) {
      const p = resolve(psItemPath(o) ?? '~');
      const n = nodeAt(p);
      if (!n) return fail(notFoundPath(line, 'Set-Location', p));
      if (n.type !== 'dir') return fail(psError(line, { cmdlet: 'Set-Location', message: `Cannot find path '${p}' because it does not exist.`, category: 'ObjectNotFound', target: `${p}:String`, exception: 'ItemNotFoundException', errorId: 'PathNotFound,Microsoft.PowerShell.Commands.SetLocationCommand' }));
      rt.session.cwd = p;
      return ok();
    },
    'Get-Location': () => ok(`\nPath\n----\n${rt.session.cwd}\n`),
    'Get-Content'(o, line) {
      const p = resolve(psItemPath(o) ?? '');
      const n = nodeAt(p);
      if (!n) return fail(notFoundPath(line, 'Get-Content', p));
      if (n.type === 'dir') return fail(psError(line, { cmdlet: 'Get-Content', message: `Access to the path '${p}' is denied.`, category: 'PermissionDenied', target: `${p}:String`, exception: 'UnauthorizedAccessException', errorId: 'GetContentReaderUnauthorizedAccessError,Microsoft.PowerShell.Commands.GetContentCommand' }));
      let lines = splitLines(n.content);
      if (o.TotalCount !== undefined) lines = lines.slice(0, Number(o.TotalCount));
      if (o.Tail !== undefined) lines = lines.slice(Math.max(0, lines.length - Number(o.Tail)));
      return ok(lines.join('\n'));
    },
    'Copy-Item'(o, line) {
      const src = resolve(psItemPath(o) ?? '');
      const n = nodeAt(src);
      if (!n) return fail(notFoundPath(line, 'Copy-Item', src));
      const dest = resolve(o.Destination ?? '.');
      const target = nodeAt(dest)?.type === 'dir' ? P.join(dest, P.base(src)) : dest;
      if (!winWritable(target)) return fail(psError(line, { cmdlet: 'Copy-Item', message: `Access to the path '${target}' is denied.`, category: 'PermissionDenied', target: `${src}:FileInfo`, exception: 'UnauthorizedAccessException', errorId: `CopyFileInfoItemUnauthorizedAccessError,${psClass('Copy-Item')}` }));
      if (n.type === 'dir' && !o.Recurse) { if (!nodeAt(target)) putNode(target, { type: 'dir', mtime: now() }); return ok(); }
      copyTree(src, target);
      return ok();
    },
    'Move-Item'(o, line) {
      const src = resolve(psItemPath(o) ?? '');
      if (!nodeAt(src)) return fail(notFoundPath(line, 'Move-Item', src));
      const dest = resolve(o.Destination ?? '.');
      const target = nodeAt(dest)?.type === 'dir' ? P.join(dest, P.base(src)) : dest;
      if (!winWritable(target) || !winWritable(src)) return fail(psError(line, { cmdlet: 'Move-Item', message: `Access to the path '${src}' is denied.`, category: 'WriteError', target: `${src}:FileInfo`, exception: 'IOException', errorId: `MoveFileInfoItemIOError,${psClass('Move-Item')}` }));
      moveTree(src, target);
      return ok();
    },
    'Remove-Item'(o, line) {
      const p = resolve(psItemPath(o) ?? '');
      const n = nodeAt(p);
      if (!n) return fail(notFoundPath(line, 'Remove-Item', p));
      if (!winWritable(p) || (/R/i.test(n.attrs ?? '') && !o.Force)) {
        return fail(psError(line, { cmdlet: 'Remove-Item', message: `Cannot remove item ${p}: You do not have sufficient access rights to perform this operation.`, category: 'PermissionDenied', target: `${p}:FileInfo`, exception: 'IOException', errorId: `RemoveFileSystemItemUnAuthorizedAccess,${psClass('Remove-Item')}` }));
      }
      if (n.type === 'dir' && childrenOf(p).length && !o.Recurse) {
        ask('ps-remove', '[Y] Yes  [A] Yes to All  [N] No  [L] No to All  [S] Suspend  [?] Help (default is "Y"): ', { path: p });
        return ok(`\nConfirm\nThe item at ${p} has children and the Recurse parameter was not specified. If you continue, all children will be removed with the item. Are you sure you want to continue?`);
      }
      removeTree(p);
      return ok();
    },
    'New-Item'(o, line) {
      const p = resolve(o.Name ? P.join(resolve(o.Path ?? '.'), o.Name) : o.Path ?? '');
      if (nodeAt(p) && !o.Force) return fail(psError(line, { cmdlet: 'New-Item', message: `An item with the specified name ${p} already exists.`, category: 'ResourceExists', target: `${p}:String`, exception: 'IOException', errorId: `DirectoryExist,${psClass('New-Item')}` }));
      const type = /^dir/i.test(o.ItemType ?? '') ? 'dir' : 'file';
      ensureDirs(P.parent(p));
      putNode(p, type === 'dir' ? { type, mtime: now() } : { type, content: o.Value ?? '', mtime: now() });
      return ok(psChildBlock(P.parent(p), [{ name: P.base(p), node: nodeAt(p) }]));
    },
    'Get-Service'(o, line) {
      const services = rt.state.services ?? {};
      let keys = Object.keys(services).sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));
      for (const [field, list] of [['Name', psList(o.Name)], ['DisplayName', psList(o.DisplayName)]]) {
        if (!list.length) continue;
        const errs = [];
        keys = keys.filter((k) => list.some((pat) => globRe(pat, true).test(field === 'Name' ? k : services[k].display ?? '')));
        for (const pat of list.filter((x) => !hasWildcard(x) && !keys.some((k) => globRe(x, true).test(field === 'Name' ? k : services[k].display ?? '')))) {
          errs.push(psError(line, { cmdlet: 'Get-Service', message: `Cannot find any service with service ${field === 'Name' ? 'name' : 'display name'} '${pat}'.`, category: 'ObjectNotFound', target: `${pat}:String`, exception: 'ServiceCommandException', errorId: `NoServiceFoundForGiven${field},Microsoft.PowerShell.Commands.GetServiceCommand` }));
        }
        if (errs.length) return { out: keys.length ? serviceTable(keys) : '', err: errs.join('\n'), exit: 1 };
      }
      return ok(serviceTable(keys));
    },
    'Start-Service': (o, line) => psServiceChange('Start-Service', o, line),
    'Stop-Service': (o, line) => psServiceChange('Stop-Service', o, line),
    'Restart-Service': (o, line) => psServiceChange('Restart-Service', o, line),
    'Get-Process'(o, line) {
      let procs = processList();
      if (o.Id !== undefined) {
        const ids = psList(o.Id);
        const missing = ids.find((id) => !rt.state.processes?.[id]);
        if (missing) return fail(psError(line, { cmdlet: 'Get-Process', message: `Cannot find a process with the process identifier ${missing}.`, category: 'ObjectNotFound', target: `${missing}:Int32`, exception: 'ProcessCommandException', errorId: 'NoProcessFoundForGivenId,Microsoft.PowerShell.Commands.GetProcessCommand' }));
        procs = procs.filter((p) => ids.includes(String(p.pid)));
      }
      const names = psList(o.Name);
      if (names.length) {
        const bare = (p) => p.name.replace(/\.exe$/i, '');
        const missing = names.find((n) => !procs.some((p) => globRe(n, true).test(bare(p))));
        if (missing && !hasWildcard(missing)) return fail(psError(line, { cmdlet: 'Get-Process', message: `Cannot find a process with the name "${missing}". Verify the process name and call the cmdlet again.`, category: 'ObjectNotFound', target: `${missing}:String`, exception: 'ProcessCommandException', errorId: 'NoProcessFoundForGivenName,Microsoft.PowerShell.Commands.GetProcessCommand' }));
        procs = procs.filter((p) => names.some((n) => globRe(n, true).test(bare(p))));
      }
      procs.sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) || a.pid - b.pid);
      const w = [[7, 'r'], [7, 'r'], [8, 'r'], [10, 'r'], [10, 'r'], [6, 'r'], [3, 'r'], [0, 'l']];
      return ok(['', columns(w, ['Handles', 'NPM(K)', 'PM(K)', 'WS(K)', 'CPU(s)', 'Id', 'SI', 'ProcessName']),
        columns(w, ['-------', '------', '-----', '-----', '------', '--', '--', '-----------']),
        ...procs.map((p) => columns(w, [p.handles ?? 245, p.npmK ?? 15, p.pmK ?? Math.round((p.memK ?? 0) / 3), p.memK ?? 0, (p.cpuSecs ?? 0.31).toFixed(2), p.pid, p.sessionNum ?? 1, p.name.replace(/\.exe$/i, '')])), ''].join('\n'));
    },
    'Stop-Process'(o, line) {
      const targets = [];
      for (const id of psList(o.Id)) {
        const proc = rt.state.processes?.[id];
        if (!proc) return fail(psError(line, { cmdlet: 'Stop-Process', message: `Cannot find a process with the process identifier ${id}.`, category: 'ObjectNotFound', target: `${id}:Int32`, exception: 'ProcessCommandException', errorId: 'NoProcessFoundForGivenId,Microsoft.PowerShell.Commands.StopProcessCommand' }));
        targets.push({ pid: id, ...proc });
      }
      for (const name of psList(o.Name)) {
        const hits = processList().filter((p) => globRe(name, true).test(p.name.replace(/\.exe$/i, '')));
        if (!hits.length) return fail(psError(line, { cmdlet: 'Stop-Process', message: `Cannot find a process with the name "${name}". Verify the process name and call the cmdlet again.`, category: 'ObjectNotFound', target: `${name}:String`, exception: 'ProcessCommandException', errorId: 'NoProcessFoundForGivenName,Microsoft.PowerShell.Commands.StopProcessCommand' }));
        targets.push(...hits);
      }
      if (!targets.length) return fail(psError(line, { cmdlet: 'Stop-Process', message: "Cannot bind argument to parameter 'Id' because it is null.", category: 'InvalidData', target: ':', exception: 'ParameterBindingValidationException', errorId: 'ParameterArgumentValidationErrorNullNotAllowed,Microsoft.PowerShell.Commands.StopProcessCommand' }));
      const errs = [];
      for (const p of targets) {
        if (p.system && !rt.session.admin) {
          errs.push(psError(line, { cmdlet: 'Stop-Process', message: `Cannot stop process "${p.name.replace(/\.exe$/i, '')} (${p.pid})" because of the following error: Access is denied`, category: 'CloseError', target: `System.Diagnostics.Process (${p.name.replace(/\.exe$/i, '')}):Process`, exception: 'ProcessCommandException', errorId: 'CouldNotStopProcess,Microsoft.PowerShell.Commands.StopProcessCommand' }));
          continue;
        }
        delete rt.state.processes[p.pid];
      }
      return errs.length ? fail(errs.join('\n')) : ok();
    },
    'Get-NetIPConfiguration'(o) {
      const entries = Object.entries(net().adapters ?? {}).filter(([name, a]) => a.connected !== false && (!o.InterfaceAlias || globRe(o.InterfaceAlias, true).test(name)));
      return ok(entries.map(([name, a]) => listBlock([['InterfaceAlias', name], ['InterfaceIndex', a.index ?? 12], ['InterfaceDescription', a.description ?? 'Ethernet Adapter'],
        ['NetProfile.Name', a.ipv4 && !isApipa(a.ipv4) ? a.suffix ?? 'Network' : 'Unidentified network'], ['IPv4Address', a.ipv4 ?? ''], ['IPv4DefaultGateway', a.gateway ?? ''], ['DNSServer', (a.dns ?? []).join('\n                     ')]])).join(''));
    },
    'Test-NetConnection'(o) {
      const target = o.ComputerName ?? 'internetbeacon.msedge.net';
      const port = o.Port ?? { HTTP: 80, RDP: 3389, SMB: 445, WINRM: 5985 }[String(o.CommonTCPPort ?? '').toUpperCase()];
      const src = usable()[0];
      const ip = lookup(target, true);
      if (!ip) return say(`WARNING: Name resolution of ${target} failed\n${listBlock([['ComputerName', target], ['RemoteAddress', ''], ['InterfaceAlias', ''], ['SourceAddress', ''], ['PingSucceeded', 'False']])}`, 1);
      const up = reachable(ip);
      const warn = up ? '' : `WARNING: Ping to ${ip} failed with status: TimedOut\n`;
      if (port === undefined) {
        return say(`${warn}${listBlock([['ComputerName', target], ['RemoteAddress', ip], ['InterfaceAlias', src?.name ?? ''], ['SourceAddress', src?.ip ?? ''], ['PingSucceeded', up ? 'True' : 'False'], ['PingReplyDetails (RTT)', `${up ? Math.round(replyMs(ip)) : 0} ms`]])}`, up ? 0 : 1);
      }
      const open = up && (hostFor(ip)?.ports ?? []).includes(Number(port));
      const pairs = [['ComputerName', target], ['RemoteAddress', ip], ['RemotePort', port], ['InterfaceAlias', src?.name ?? ''], ['SourceAddress', src?.ip ?? '']];
      if (!open) pairs.push(['PingSucceeded', up ? 'True' : 'False'], ['PingReplyDetails (RTT)', `${up ? Math.round(replyMs(ip)) : 0} ms`]);
      pairs.push(['TcpTestSucceeded', open ? 'True' : 'False']);
      return say(`${open ? '' : `WARNING: TCP connect to (${ip} : ${port}) failed\n`}${open ? '' : warn}${listBlock(pairs)}`, open ? 0 : 1);
    },
    'Start-Process'(o) {
      const file = String(o.FilePath ?? '').toLowerCase().replace(/\.exe$/, '');
      if (/^runas$/i.test(o.Verb ?? '') && ['cmd', 'powershell', 'pwsh', 'wt'].includes(file)) {
        elevateSession();
        return ok('[User Account Control: Yes. A new elevated window opens and this session continues in it.]');
      }
      return ok();
    },
    'Clear-Host': () => ok('', { clear: true }),
  };

  function serviceTable(keys) {
    const services = rt.state.services ?? {};
    const width = Math.max(18, ...keys.map((k) => k.length));
    return ['', `Status   ${'Name'.padEnd(width)} DisplayName`, `------   ${'----'.padEnd(width)} -----------`,
      ...keys.map((k) => `${(services[k].status ?? 'Stopped').padEnd(8)} ${k.padEnd(width)} ${services[k].display ?? k}`), ''].join('\n');
  }

  function psServiceChange(cmdlet, o, line) {
    const services = rt.state.services ?? {};
    const names = [...psList(o.Name), ...psList(o.DisplayName)];
    const errs = [];
    for (const raw of names) {
      const key = findService(raw);
      if (!key) {
        errs.push(psError(line, { cmdlet, message: `Cannot find any service with service name '${raw}'.`, category: 'ObjectNotFound', target: `${raw}:String`, exception: 'ServiceCommandException', errorId: `NoServiceFoundForGivenName,${psClass(cmdlet)}` }));
        continue;
      }
      const svc = services[key];
      const label = `${svc.display ?? key} (${key})`;
      const verb = cmdlet === 'Start-Service' ? 'started' : 'stopped';
      const blocked = (reason) => errs.push(psError(line, { cmdlet, message: `Service '${label}' cannot be ${verb} due to the following error: ${reason}`, category: 'OpenError', target: 'System.ServiceProcess.ServiceController:ServiceController', exception: 'ServiceCommandException', errorId: `Could${cmdlet === 'Start-Service' ? 'NotStart' : 'NotStop'}Service,${psClass(cmdlet)}` }));
      if (!rt.session.admin) { blocked(`Cannot open ${key} service on computer '.'.`); continue; }
      if (cmdlet !== 'Start-Service') svc.status = 'Stopped';
      if (cmdlet === 'Stop-Service') continue;
      if (svc.startType === 'Disabled' || (svc.startWhen && !test(svc.startWhen))) { blocked(`Cannot start service ${key} on computer '.'.`); continue; }
      svc.status = 'Running';
    }
    return errs.length ? fail(errs.join('\n')) : ok();
  }

  function runPsLine(line) {
    const expanded = line.replace(/\$env:(\w+)/gi, (all, name) => cmdEnv()[name.toUpperCase()] ?? all).replace(/\$HOME\b/gi, rt.session.home);
    const [name = '', ...rawArgs] = tokenize(expanded, 'powershell');
    const lower = name.toLowerCase().replace(/\.exe$/, '');
    // mkdir and md are PowerShell functions that call New-Item -ItemType Directory.
    const args = lower === 'mkdir' || lower === 'md' ? [...rawArgs, '-ItemType', 'Directory'] : rawArgs;
    const cmdlet = PS_ALIASES[lower] ?? Object.keys(PS).find((k) => k.toLowerCase() === lower);
    if (cmdlet) {
      if (args[0] === '-?') return ok(`\nNAME\n    ${cmdlet}\n\nSYNOPSIS\n    ${PS_CMDLETS[cmdlet]}\n\n\nSYNTAX\n    ${PS_SYNTAX[cmdlet].split('\n').join('\n\n    ')}\n`);
      if (cmdlet === 'Set-Location' && /^[a-z]:$/i.test(args[0] ?? '') && !driveExists(args[0].toUpperCase())) return fail(psError(line, { cmdlet, message: `Cannot find drive. A drive with the name '${args[0][0]}' does not exist.`, category: 'ObjectNotFound', target: `${args[0][0]}:String`, exception: 'DriveNotFoundException', errorId: `DriveNotFound,${psClass(cmdlet)}` }));
      const o = psParams(cmdlet, args, line);
      if (o.error) return fail(o.error);
      return PS[cmdlet](o, line);
    }
    if (/^[a-z]:$/i.test(name)) return runPsLine(`Set-Location ${name}\\`);
    if (PS_EXTERNAL.includes(lower)) {
      if (args[0] === '/?' && CMD_INFO[lower]) return ok(`${CMD_INFO[lower][0]}\n\n${CMD_INFO[lower][1]}`);
      return CMD[lower](args);
    }
    if (lower === 'help' || lower === 'get-help') return ok(psHelp());
    if (lower === 'exit') return ok();
    return fail(psError(line, { prefix: name, message: `The term '${name}' is not recognized as the name of a cmdlet, function, script file, or operable program. Check the spelling of the name, or if a path was included, verify that the path is correct and try again.`, category: 'ObjectNotFound', target: `${name}:String`, exception: 'CommandNotFoundException', errorId: 'CommandNotFoundException', length: name.length }));
  }

  function psHelp() {
    const width = Math.max(...Object.keys(PS_CMDLETS).map((k) => k.length)) + 2;
    return ['', 'Cmdlets available in this session:', '', ...Object.keys(PS_CMDLETS).sort().map((k) => `  ${k.padEnd(width)}${PS_CMDLETS[k]}`), '',
      'Windows programs you can also run here:', `  ${PS_EXTERNAL.join(', ')}`, '', 'Type <cmdlet> -? or <program> /? for the syntax.', ''].join('\n');
  }

  // =====================================================================
  // Prompts (Y/N questions, passwords) and dispatch
  // =====================================================================
  const yes = (answer) => /^y/i.test(answer);
  const PROMPTS = {
    sudo(answer, data) {
      if (answer === caseDef.sudoPassword) { rt.session.sudoOk = true; return sudoRun(data.args); }
      if (data.tries + 1 >= 3) return fail('sudo: 3 incorrect password attempts');
      ask('sudo', `[sudo] password for ${euid()}: `, { ...data, tries: data.tries + 1 }, true);
      return fail('Sorry, try again.');
    },
    su(answer, data) {
      const expected = data.target === 'root' ? caseDef.rootPassword : rt.state.users?.[data.target]?.password;
      if (!expected || answer !== expected) return fail('su: Authentication failure');
      rt.session.stack.push({ user: rt.session.user, cwd: rt.session.cwd });
      rt.session.user = data.target;
      if (data.login) rt.session.cwd = data.target === 'root' ? '/root' : `/home/${data.target}`;
      return ok();
    },
    'apt-install': (answer, data) => (answer === '' || yes(answer) ? ok(aptInstallText(data.all).join('\n')) : fail('Abort.')),
    'apt-remove': (answer, data) => (answer === '' || yes(answer) ? ok(aptRemove(data.names).join('\n')) : fail('Abort.')),
    dnf: (answer, data) => (yes(answer) ? ok(dnfApply(data.op, data.names)) : fail('Operation aborted.')),
    chkdsk(answer, data) {
      if (!yes(answer)) return ok();
      Object.assign(rt.state.volumes[data.letter], { checkScheduled: true, checkMode: data.surface ? '/r' : '/f' });
      return ok('This volume will be checked the next time the system restarts.');
    },
    overwrite(answer, data) {
      if (!/^[ya]/i.test(answer)) return ok(`        0 file(s) ${data.op === 'move' ? 'moved' : 'copied'}.`);
      return data.op === 'move' ? doMove(data) : doCopy(data);
    },
    xcopy(answer, data) {
      if (/^d/i.test(answer)) { putNode(data.dest, { type: 'dir', mtime: now() }); return doXcopy(data); }
      if (/^f/i.test(answer)) {
        const file = data.files.find((f) => f.node.type === 'file');
        if (file) writeCopy(data.dest, file.node, {});
        return ok(`${file ? file.path : ''}\n${file ? 1 : 0} File(s) copied`);
      }
      ask('xcopy', '(F = file, D = directory)? ', data);
      return ok();
    },
    del: (answer, data) => (yes(answer) ? deleteFiles(data.paths, data.force) : ok()),
    rd(answer, data) { if (yes(answer)) removeTree(data.path); return ok(); },
    'ps-remove'(answer, data) { if (answer === '' || /^[ya]/i.test(answer)) removeTree(data.path); return ok(); },
    format: (answer, data) => (rt.state.volumes[data.letter].removable || yes(answer) ? doFormat(data) : ok()),
  };

  function answer(text) {
    const { kind, data } = rt.pending;
    rt.pending = null;
    return PROMPTS[kind](text, data);
  }

  function dispatch(line) {
    if (rt.session.mode === 'diskpart') return diskpartLine(line);
    if (os === 'linux') return runLinuxLine(line);
    return os === 'powershell' ? runPsLine(line) : runCmdLine(line);
  }

  function elevateSession() {
    rt.session.admin = true;
    rt.session.mode = '';
    rt.session.cwd = 'C:\\Windows\\System32';
    if (!nodeAt(rt.session.cwd)) putNode(rt.session.cwd, { type: 'dir', protected: true });
  }

  // ----- Tab completion -----
  function commandNames() {
    if (rt.session.mode === 'diskpart') return ['active', 'assign', 'clean', 'create', 'exit', 'format', 'help', 'list', 'select'];
    if (os === 'linux') return Object.keys(LINUX).sort();
    if (os === 'windows-cmd') return Object.keys(CMD).sort();
    return [...Object.keys(PS_CMDLETS), ...PS_EXTERNAL].sort((a, b) => a.localeCompare(b));
  }

  function pathMatches(token) {
    const cut = Math.max(token.lastIndexOf('/'), win ? token.lastIndexOf('\\') : -1);
    const dirPart = token.slice(0, cut + 1);
    const fragment = token.slice(cut + 1);
    const dir = resolve(dirPart || '.');
    if (!win && !may(dir, 5)) return [];
    const starts = (name) => (win ? name.toLowerCase().startsWith(fragment.toLowerCase()) : name.startsWith(fragment));
    return childrenOf(dir)
      .filter((c) => starts(c.name) && (win || fragment.startsWith('.') || !c.name.startsWith('.')))
      .map((c) => {
        const full = `${dirPart}${c.name}${c.node.type === 'dir' ? P.sep : ''}`;
        if (!/\s/.test(c.name)) return full;
        return win ? `"${full}"` : full.replace(/ /g, '\\ ');
      });
  }

  function commonPrefix(items) {
    let prefix = items[0];
    for (const item of items.slice(1)) {
      let i = 0;
      while (i < prefix.length && i < item.length && (win ? prefix[i].toLowerCase() === item[i].toLowerCase() : prefix[i] === item[i])) i += 1;
      prefix = prefix.slice(0, i);
    }
    return prefix;
  }

  const api = {
    get os() { return os; },
    get host() { return host; },
    get state() { return rt.state; },
    get fs() { return rt.fs; },
    get cwd() { return rt.session.cwd; },
    get user() { return rt.session.user; },
    get admin() { return rt.session.admin; },
    get history() { return rt.history.map((h) => h.line); },
    get awaiting() { return rt.pending ? { secret: rt.pending.secret } : null; },
    prompt() {
      if (rt.pending) return rt.pending.text;
      if (rt.session.mode === 'diskpart') return 'DISKPART> ';
      if (os === 'powershell') return `PS ${rt.session.cwd}> `;
      if (os === 'windows-cmd') return `${rt.session.cwd}>`;
      const home = homeOf(euid());
      const where = P.within(rt.session.cwd, home) && home !== '/' ? `~${rt.session.cwd.slice(home.length)}` : rt.session.cwd;
      return `${euid()}@${host}:${where}${euid() === 'root' ? '#' : '$'} `;
    },
    run(line) {
      const text = String(line ?? '').replace(/[\r\n]+/g, ' ').trim();
      const before = check();
      const answering = Boolean(rt.pending);
      if (!text && !answering) return finish(ok(), before);
      const mode = rt.session.mode;
      const cwd = rt.session.cwd;
      const res = answering ? answer(text) : scripted(text) ?? dispatch(text);
      if (!answering) rt.history.push({ line: text, exit: res.exit, cwd, ...(mode ? { mode } : {}) });
      else if (!rt.pending && rt.history.length) rt.history.at(-1).exit = res.exit;
      return finish(res, before);
    },
    elevate() {
      const before = check();
      if (!win) return finish(fail('Run as administrator is a Windows action. On Linux, use sudo.'), before);
      rt.pending = null;
      elevateSession();
      return finish(ok(), before);
    },
    check,
    complete(input) {
      const text = String(input ?? '');
      if (rt.pending) return { line: text, matches: [] };
      const [, head, token] = /^(.*?)(\S*)$/s.exec(text);
      const first = !head.trim();
      const matches = first
        ? commandNames().filter((c) => (win ? c.toLowerCase().startsWith(token.toLowerCase()) : c.startsWith(token)))
        : pathMatches(token);
      if (!matches.length) return { line: text, matches };
      if (matches.length === 1) {
        const done = matches[0];
        return { line: head + done + (first || !done.replace(/"$/, '').endsWith(P.sep) ? ' ' : ''), matches };
      }
      const common = commonPrefix(matches);
      return { line: head + (common.length > token.length ? common : token), matches };
    },
    snapshot: () => copy(rt),
    restore(snapshot) {
      const before = check();
      if (!snapshot || typeof snapshot.fs !== 'object' || typeof snapshot.state !== 'object' || !snapshot.session || !Array.isArray(snapshot.history)) {
        return { ok: false, msg: 'Not a shell snapshot.', goalsChanged: [], trapsHit: [] };
      }
      rt = copy(snapshot);
      const res = finish(ok(), before);
      return { ok: true, msg: 'Restored.', goalsChanged: res.goalsChanged, trapsHit: res.trapsHit };
    },
    reset() {
      rt = copy(initial);
      return { ok: true, msg: 'Reset to the start of the case.', goalsChanged: [], trapsHit: [] };
    },
  };
  return api;
}

// Replays one `solution`/`trapDemo` step: a command line string, or { action: 'elevate' }.
export function applyStep(sh, step) {
  const action = step && typeof step === 'object' && 'do' in step ? step.do : step;
  if (typeof action === 'string') return sh.run(action);
  if (action?.action === 'elevate') return sh.elevate();
  throw new TypeError(`Unknown shell step: ${JSON.stringify(step)}`);
}

// Command names a host understands (for content checks and UI help).
export function commandsFor(os, distro = 'ubuntu') {
  if (os === 'linux') {
    const pkg = ['fedora', 'rhel'].includes(distro) ? 'dnf' : 'apt';
    return ['apt', 'bash', 'cat', 'cd', 'chgrp', 'chmod', 'chown', 'clear', 'cp', 'df', 'dig', 'dnf', 'du', 'exit', 'find', 'grep', 'head', 'help', 'hostname', 'ip', 'kill', 'less', 'ls', 'man', 'mkdir', 'mv', 'nslookup', 'ping', 'ps', 'pwd', 'rm', 'sh', 'su', 'sudo', 'systemctl', 'tail', 'top', 'touch', 'truncate', 'whoami']
      .filter((c) => (c === 'apt' || c === 'dnf' ? c === pkg : true));
  }
  if (os === 'windows-cmd') return ['cd', 'chkdsk', 'cls', 'copy', 'del', 'dir', 'diskpart', 'dism', 'exit', 'format', 'gpresult', 'gpupdate', 'help', 'hostname', 'ipconfig', 'md', 'move', 'net', 'netstat', 'nslookup', 'pathping', 'ping', 'rd', 'robocopy', 'sfc', 'shutdown', 'taskkill', 'tasklist', 'tracert', 'type', 'whoami', 'winver', 'xcopy'];
  if (os === 'powershell') return [...Object.keys(PS_CMDLETS), ...PS_EXTERNAL].sort();
  throw new RangeError(`Unknown shell os: ${os}`);
}

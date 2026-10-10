import assert from 'node:assert/strict';
import { applyStep, commandsFor, createShell } from '../src/pro/labs/aplus/shell.js';
import shellCases, { primer, sources, terms } from '../src/pro/labs/aplus/content/shell-cases.js';

let count = 0;
const failures = [];
const test = (name, fn) => {
  try { fn(); count += 1; } catch (error) { failures.push(name); console.error(`FAIL ${name}\n${error.message}\n`); }
};
const shape = (r) => {
  assert.equal(typeof r.out, 'string');
  assert.equal(typeof r.exit, 'number');
  assert.ok(Array.isArray(r.goalsChanged) && Array.isArray(r.trapsHit));
  return r;
};
const run = (sh, line) => shape(sh.run(line));
const out = (sh, line) => run(sh, line).out;

// ---------------- fixtures ----------------
const linuxCase = (extra = {}) => ({
  os: 'linux', host: 'web01', user: 'jordan', cwd: '/home/jordan',
  fs: {
    '/home/jordan/notes.txt': { owner: 'jordan', group: 'jordan', mode: '644', content: 'alpha\nBeta error\ngamma\nerror two\n', mtime: '2026-10-08T17:42' },
    '/home/jordan/.hidden': { owner: 'jordan', group: 'jordan', mode: '600', content: 'secret\n' },
    '/home/jordan/run.sh': { owner: 'jordan', group: 'jordan', mode: '644', content: '#!/bin/bash\n', exec: { out: 'ran ok', set: { 'flags.ran': true } } },
    '/home/jordan/Docs/a.log': { owner: 'jordan', group: 'jordan', mode: '644', content: 'x\n' },
    '/etc/app/app.conf': { owner: 'root', group: 'www-data', mode: '600', content: 'port=8080\n' },
    '/var/log/syslog': { owner: 'syslog', group: 'adm', mode: '640', content: 'Oct  9 09:01 web01 app[812]: error: cannot open /etc/app/app.conf\nOct  9 09:02 web01 kernel: ok\n' },
    '/var/log/app/huge.log.1': { owner: 'root', group: 'root', mode: '640', size: 5 * 1024 ** 3 },
    '/srv/private': { type: 'dir', owner: 'root', group: 'root', mode: '700' },
    '/srv/private/key.pem': { owner: 'root', group: 'root', mode: '600', content: 'k' },
  },
  state: {
    filesystems: { '/': { source: '/dev/sda2', sizeK: 51290592, usedK: 51200000, availK: 0 } },
    services: { nginx: { description: 'A high performance web server and a reverse proxy server', active: 'inactive', enabled: false, docs: 'man:nginx(8)' },
      appd: { description: 'Order app', active: 'failed', enabled: true, startWhen: { path: '/etc/app/app.conf', field: 'group', op: 'eq', value: 'appsvc' }, log: ['Oct 09 09:01:00 web01 appd[812]: cannot open /etc/app/app.conf'] } },
    packages: { upgradable: 2, available: { tree: { version: '2.1.1-2ubuntu3', description: 'displays an indented directory tree' },
      apache2: { version: '2.4.58-1ubuntu8.4', needsUpdate: true, depends: ['apache2-bin'], service: { name: 'apache2' } }, 'apache2-bin': { version: '2.4.58-1ubuntu8.4' } },
      installed: { 'openssh-server': '1:9.6p1-3ubuntu13.5' } },
    processes: { 1: { user: 'root', command: '/sbin/init', cpu: 0, mem: 0.1 }, 812: { user: 'appsvc', command: '/usr/bin/appd', cpu: 3.2, mem: 1.4, service: 'appd' }, 2300: { user: 'jordan', command: 'sleep 999', tty: 'pts/0' }, 2400: { user: 'jordan', command: 'stubborn', ignoresTerm: true } },
    users: { appsvc: { uid: 998, groups: ['appsvc'] }, 'www-data': { uid: 33, groups: ['www-data'] } },
    network: { interfaces: { enp0s3: { ipv4: '192.168.1.20/24', mac: '08:00:27:aa:bb:cc' } }, gateway: '192.168.1.1',
      hosts: { 'www.example': { ip: '203.0.113.10', ms: 14.2 }, 'down.example': { ip: '198.51.100.7', reachable: false } } },
  },
  ...extra,
});

const winFs = {
  'C:\\Users\\avery\\Documents\\report.docx': { size: 12288, mtime: '2026-10-08T16:31' },
  'C:\\Users\\avery\\Documents\\notes.txt': { content: 'hello\nworld\n', mtime: '2026-10-09T08:00' },
  'C:\\Users\\avery\\Documents\\Old\\keep.txt': { content: 'k' },
  'C:\\Users\\avery\\Documents\\ro.txt': { content: 'r', attrs: 'R' },
  'C:\\Users\\avery\\Documents\\hidden.ini': { content: 'h', attrs: 'H' },
  'C:\\Windows\\System32\\drivers\\etc\\hosts': { content: '# hosts\n' },
  'C:\\Program Files\\App\\app.exe': { size: 1000 },
  '\\\\fileserver\\backups\\avery\\stale.txt': { content: 'old' },
  'C:\\Sources\\install.wim': { size: 4000000000 },
};
const winState = () => ({
  windows: { systemFiles: 'corrupt', componentStore: 'repairable' },
  volumes: { 'D:': { label: 'Data', fs: 'NTFS', serial: '11AA-22BB', sizeBytes: 500 * 1024 ** 3, freeBytes: 400 * 1024 ** 3, errors: true, badSectors: true } },
  services: { Spooler: { display: 'Print Spooler', status: 'Running', startType: 'Automatic' }, wuauserv: { display: 'Windows Update', status: 'Stopped', startType: 'Manual' },
    RemoteRegistry: { display: 'Remote Registry', status: 'Stopped', startType: 'Disabled' } },
  processes: { 4: { name: 'System', memK: 144, system: true, session: 'Services', sessionNum: 0 }, 4120: { name: 'notepad.exe', memK: 18012 }, 5200: { name: 'badapp.exe', memK: 90000, needsForce: true } },
  connections: [{ proto: 'TCP', local: '0.0.0.0:135', foreign: '0.0.0.0:0', state: 'LISTENING', pid: 1196 }, { proto: 'TCP', local: '192.168.10.44:49702', foreign: '203.0.113.80:443', state: 'ESTABLISHED', pid: 4120 }],
  disks: { 0: { sizeGB: 476, system: true, gpt: true, partitions: [{ sizeGB: 476, fs: 'NTFS', letter: 'C', label: 'Windows' }] }, 1: { sizeGB: 58, removable: true, partitions: [{ sizeGB: 58, fs: 'exFAT', letter: 'E', label: 'USB' }] } },
  gp: { pending: { 'policy.screenLock': true }, dc: 'dc1.corp.example' },
  network: {
    dnsServerName: 'dns1.corp.example', dnsCache: { 'intranet.corp.example': { ip: '192.168.10.80', ttl: 2854 } },
    adapters: { Ethernet: { ipv4: '169.254.73.18', mask: '255.255.0.0', gateway: '', dns: ['192.168.10.53'], suffix: 'corp.example',
      dhcpOffer: { ipv4: '192.168.10.44', mask: '255.255.255.0', gateway: '192.168.10.1', dns: ['192.168.10.53'], dhcpServer: '192.168.10.1' } } },
    hosts: { 'intranet.corp.example': { ip: '192.168.10.90', ms: 3, ports: [443] }, 'old.corp.example': { ip: '192.168.10.80', reachable: false } },
  },
});
const winCase = (os = 'windows-cmd', extra = {}) => ({ os, host: 'FD-PC-03', user: 'avery', fs: winFs, state: winState(), ...extra });

// ---------------- construction and API ----------------
test('rejects unknown os and exposes the API', () => {
  assert.throws(() => createShell({ os: 'dos' }), RangeError);
  const sh = createShell(linuxCase());
  for (const key of ['run', 'check', 'complete', 'snapshot', 'restore', 'reset', 'prompt', 'elevate']) assert.equal(typeof sh[key], 'function');
  assert.equal(sh.os, 'linux');
  assert.equal(sh.cwd, '/home/jordan');
  assert.equal(sh.prompt(), 'jordan@web01:~$ ');
  assert.equal(createShell(winCase()).prompt(), 'C:\\Users\\avery>');
  assert.equal(createShell(winCase('powershell')).prompt(), 'PS C:\\Users\\avery> ');
  assert.deepEqual(commandsFor('linux').includes('apt'), true);
  assert.deepEqual(commandsFor('linux', 'rhel').includes('apt'), false);
  assert.ok(commandsFor('windows-cmd').includes('robocopy'));
  assert.ok(commandsFor('powershell').includes('Get-Service'));
  assert.throws(() => commandsFor('dos'), RangeError);
});

test('every listed command is accepted by its host', () => {
  for (const [os, list] of [['linux', commandsFor('linux')], ['windows-cmd', commandsFor('windows-cmd')], ['powershell', commandsFor('powershell')]]) {
    const sh = createShell(os === 'linux' ? linuxCase() : winCase(os));
    for (const name of list) {
      const r = run(sh, name);
      assert.doesNotMatch(r.out, /command not found|is not recognized/, `${os} ${name}`);
      if (sh.awaiting) run(sh, 'n');
      if (sh.prompt() === 'DISKPART> ') run(sh, 'exit');
    }
  }
});

test('unknown commands use the real error text', () => {
  const lx = createShell(linuxCase());
  assert.deepEqual([out(lx, 'foo'), lx.run('foo').exit], ['foo: command not found', 127]);
  assert.match(out(lx, 'LS'), /^LS: command not found$/);
  const cmd = createShell(winCase());
  const r = run(cmd, 'foo');
  assert.equal(r.out, "'foo' is not recognized as an internal or external command,\noperable program or batch file.");
  assert.equal(r.exit, 9009);
  assert.equal(run(cmd, 'IPCONFIG').exit, 0);
  const ps = createShell(winCase('powershell'));
  const e = out(ps, 'Get-Foo');
  assert.match(e, /^Get-Foo : The term 'Get-Foo' is not recognized as the name of a cmdlet/);
  assert.match(e, /\+ ~~~~~~~\n/);
  assert.match(e, /CommandNotFoundException$/);
  assert.equal(createShell(linuxCase({ distro: 'rhel' })).run('apt update').out, 'apt: command not found');
});

// ---------------- path resolution ----------------
test('Linux paths: relative, .., ~, absolute and case sensitivity', () => {
  const sh = createShell(linuxCase());
  run(sh, 'cd Docs');
  assert.equal(sh.cwd, '/home/jordan/Docs');
  assert.equal(sh.prompt(), 'jordan@web01:~/Docs$ ');
  run(sh, 'cd ../../..');
  assert.equal(sh.cwd, '/');
  run(sh, 'cd ~/Docs/../Docs/.');
  assert.equal(sh.cwd, '/home/jordan/Docs');
  run(sh, 'cd');
  assert.equal(sh.cwd, '/home/jordan');
  assert.equal(out(sh, 'cd docs'), 'bash: cd: docs: No such file or directory');
  assert.equal(out(sh, 'cd notes.txt'), 'bash: cd: notes.txt: Not a directory');
  assert.equal(out(sh, 'cd /srv/private'), 'bash: cd: /srv/private: Permission denied');
  assert.equal(out(sh, 'cd a b'), 'bash: cd: too many arguments');
  assert.equal(out(sh, 'cat ~/notes.txt').split('\n')[0], 'alpha');
  assert.equal(out(sh, 'pwd'), '/home/jordan');
});

test('Windows paths: drive letters, backslashes, forward slashes and case-insensitivity', () => {
  const sh = createShell(winCase());
  run(sh, 'cd documents');
  assert.equal(sh.cwd, 'C:\\Users\\avery\\documents');
  assert.equal(out(sh, 'type NOTES.TXT'), 'hello\nworld');
  run(sh, 'cd..');
  assert.equal(sh.cwd, 'C:\\Users\\avery');
  run(sh, 'cd \\');
  assert.equal(sh.cwd, 'C:\\');
  run(sh, 'cd Users/avery/Documents/Old');
  assert.equal(sh.cwd, 'C:\\Users\\avery\\Documents\\Old');
  run(sh, 'cd ..\\..');
  assert.equal(sh.cwd, 'C:\\Users\\avery');
  assert.equal(out(sh, 'cd'), 'C:\\Users\\avery');
  assert.equal(out(sh, 'cd C:\\Nope'), 'The system cannot find the path specified.');
  assert.equal(out(sh, 'cd Documents\\notes.txt'), 'The directory name is invalid.');
  assert.equal(out(sh, 'cd "Program Files"'), 'The system cannot find the path specified.');
  run(sh, 'cd C:\\Program Files');
  assert.equal(sh.cwd, 'C:\\Program Files');
  run(sh, 'cd %USERPROFILE%');
  assert.equal(sh.cwd, 'C:\\Users\\avery');
  run(sh, 'D:');
  assert.equal(sh.cwd, 'D:\\');
  assert.equal(out(sh, 'Q:'), 'The system cannot find the drive specified.');
  run(sh, 'cd C:\\Windows');
  assert.equal(sh.cwd, 'D:\\', 'cd to another drive without /d keeps the current drive');
  run(sh, 'cd /d C:\\Windows');
  assert.equal(sh.cwd, 'C:\\Windows');
  assert.match(out(sh, 'cd \\\\fileserver\\backups'), /CMD does not support UNC paths as current directories\./);
  const ps = createShell(winCase('powershell'));
  run(ps, 'cd ~\\Documents');
  assert.equal(ps.cwd, 'C:\\Users\\avery\\Documents');
  run(ps, 'Set-Location $env:USERPROFILE');
  assert.equal(ps.cwd, 'C:\\Users\\avery');
  assert.match(out(ps, 'Set-Location C:\\nope'), /^Set-Location : Cannot find path 'C:\\nope' because it does not exist\./);
});

// ---------------- Linux file commands ----------------
test('ls: -l -a -h, columns, hidden files and errors', () => {
  const sh = createShell(linuxCase());
  assert.equal(out(sh, 'ls'), 'Docs  notes.txt  run.sh');
  assert.equal(out(sh, 'ls -a'), '.  ..  Docs  .hidden  notes.txt  run.sh');
  const long = out(sh, 'ls -l').split('\n');
  assert.equal(long[0], 'total 12');
  assert.equal(long[1], 'drwxrwxr-x 2 jordan jordan 4096 Oct  9 09:12 Docs');
  assert.equal(long[2], '-rw-r--r-- 1 jordan jordan   33 Oct  8 17:42 notes.txt');
  assert.match(out(sh, 'ls -la'), /^total 24\ndrwxr-x--- 3 jordan jordan 4096 Oct  9 09:12 \.\ndrwxr-xr-x 3 root   root   4096 Oct  9 09:12 \.\.\n/);
  assert.match(out(sh, 'ls -lh /var/log/app'), /-rw-r----- 1 root root 5\.0G Oct  9 09:12 huge\.log\.1/);
  assert.equal(out(sh, 'ls -l notes.txt'), '-rw-r--r-- 1 jordan jordan 33 Oct  8 17:42 notes.txt');
  const missing = run(sh, 'ls nope');
  assert.deepEqual([missing.out, missing.exit], ["ls: cannot access 'nope': No such file or directory", 2]);
  assert.equal(out(sh, 'ls /srv/private'), "ls: cannot open directory '/srv/private': Permission denied");
  assert.equal(out(sh, 'ls -z'), "ls: invalid option -- 'z'\nTry 'ls --help' for more information.");
  assert.equal(out(sh, 'ls Docs notes.txt'), 'notes.txt\n\nDocs:\na.log');
  assert.equal(out(sh, 'sudo ls /srv/private'), 'key.pem');
});

test('cat, less, head, tail and pipes', () => {
  const sh = createShell(linuxCase());
  assert.equal(out(sh, 'cat notes.txt'), 'alpha\nBeta error\ngamma\nerror two');
  assert.equal(out(sh, 'cat nope'), 'cat: nope: No such file or directory');
  assert.equal(out(sh, 'cat Docs'), 'cat: Docs: Is a directory');
  assert.equal(out(sh, 'cat /var/log/syslog'), 'cat: /var/log/syslog: Permission denied');
  assert.equal(out(sh, 'less notes.txt').split('\n').length, 4);
  assert.equal(out(sh, 'less Docs'), 'Docs is a directory');
  assert.equal(out(sh, 'head -n 2 notes.txt'), 'alpha\nBeta error');
  assert.equal(out(sh, 'head -1 notes.txt'), 'alpha');
  assert.equal(out(sh, 'tail -n 1 notes.txt'), 'error two');
  assert.equal(out(sh, 'tail -2 notes.txt Docs/a.log'), '==> notes.txt <==\ngamma\nerror two\n\n==> Docs/a.log <==\nx');
  assert.equal(out(sh, 'head nope'), "head: cannot open 'nope' for reading: No such file or directory");
  assert.equal(out(sh, 'cat notes.txt | grep -i beta'), 'Beta error');
  assert.equal(out(sh, 'cat notes.txt | head -n 1 | tail -n 1'), 'alpha');
  assert.equal(out(sh, 'cat notes.txt |'), "bash: syntax error near unexpected token `|'");
  assert.equal(out(sh, 'cat /var/log/syslog | grep error'), 'cat: /var/log/syslog: Permission denied');
});

test('mkdir, touch, rm, cp, mv, truncate with permissions', () => {
  const sh = createShell(linuxCase());
  assert.equal(run(sh, 'mkdir new').exit, 0);
  assert.equal(sh.fs['/home/jordan/new'].mode, '775');
  assert.equal(out(sh, 'mkdir new'), 'mkdir: cannot create directory ‘new’: File exists');
  assert.equal(out(sh, 'mkdir a/b'), 'mkdir: cannot create directory ‘a/b’: No such file or directory');
  run(sh, 'mkdir -p a/b/c');
  assert.equal(sh.fs['/home/jordan/a/b/c'].type, 'dir');
  assert.equal(out(sh, 'mkdir /etc/x'), 'mkdir: cannot create directory ‘/etc/x’: Permission denied');
  assert.equal(out(sh, 'mkdir'), "mkdir: missing operand\nTry 'mkdir --help' for more information.");
  run(sh, 'touch a/b/c/f.txt');
  assert.deepEqual([sh.fs['/home/jordan/a/b/c/f.txt'].owner, sh.fs['/home/jordan/a/b/c/f.txt'].mode], ['jordan', '664']);
  assert.equal(out(sh, 'touch /etc/x'), "touch: cannot touch '/etc/x': Permission denied");
  assert.equal(out(sh, 'touch nodir/x'), "touch: cannot touch 'nodir/x': No such file or directory");
  assert.equal(out(sh, 'cp notes.txt'), "cp: missing destination file operand after 'notes.txt'\nTry 'cp --help' for more information.");
  assert.equal(out(sh, 'cp a z'), "cp: -r not specified; omitting directory 'a'");
  run(sh, 'cp -r a z');
  assert.ok(sh.fs['/home/jordan/z/b/c/f.txt']);
  run(sh, 'cp notes.txt Docs');
  assert.equal(sh.fs['/home/jordan/Docs/notes.txt'].content, sh.fs['/home/jordan/notes.txt'].content);
  assert.equal(out(sh, 'cp nope x'), "cp: cannot stat 'nope': No such file or directory");
  assert.equal(out(sh, 'cp notes.txt /etc/'), "cp: cannot create regular file '/etc/': Permission denied");
  assert.equal(out(sh, 'cp notes.txt run.sh nowhere'), "cp: target 'nowhere' is not a directory");
  run(sh, 'mv z y');
  assert.ok(sh.fs['/home/jordan/y/b/c/f.txt'] && !sh.fs['/home/jordan/z']);
  assert.equal(out(sh, 'mv nope x'), "mv: cannot stat 'nope': No such file or directory");
  assert.equal(out(sh, 'mv y y/b'), "mv: cannot move 'y' to a subdirectory of itself, '/home/jordan/y/b/y'");
  assert.equal(out(sh, 'mv notes.txt /etc/'), "mv: cannot move 'notes.txt' to '/etc/': Permission denied");
  assert.equal(out(sh, 'rm a'), "rm: cannot remove 'a': Is a directory");
  assert.equal(out(sh, 'rm nope'), "rm: cannot remove 'nope': No such file or directory");
  assert.equal(run(sh, 'rm -f nope').exit, 0);
  run(sh, 'rm -r a');
  assert.equal(sh.fs['/home/jordan/a'], undefined);
  assert.equal(out(sh, 'rm /var/log/syslog'), "rm: cannot remove '/var/log/syslog': Permission denied");
  assert.equal(out(sh, 'sudo rm -rf /'), "rm: it is dangerous to operate recursively on '/'\nrm: use --no-preserve-root to override this failsafe");
  assert.equal(out(sh, 'truncate notes.txt'), "truncate: you must specify either '--size' or '--reference'\nTry 'truncate --help' for more information.");
  run(sh, 'truncate -s 0 notes.txt');
  assert.equal(sh.fs['/home/jordan/notes.txt'].size, 0);
});

test('disk usage follows file changes: df, du', () => {
  const sh = createShell(linuxCase());
  assert.equal(out(sh, 'df -h'), 'Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda2        49G   49G     0 100% /');
  assert.equal(out(sh, 'df'), 'Filesystem     1K-blocks     Used Available Use% Mounted on\n/dev/sda2       51290592 51200000         0 100% /');
  assert.equal(out(sh, 'df /nope'), 'df: /nope: No such file or directory');
  assert.equal(out(sh, 'du -sh /var/log'), '5.1G\t/var/log');
  assert.equal(out(sh, 'sudo du -sh /var/log'), '5.1G\t/var/log');
  assert.equal(out(sh, 'sudo du -h /var/log'), '5.1G\t/var/log/app\n5.1G\t/var/log');
  assert.equal(out(sh, 'du -s Docs'), '8\tDocs');
  assert.equal(out(sh, 'du -sh /srv/private'), "du: cannot read directory '/srv/private': Permission denied\n4.0K\t/srv/private");
  assert.equal(out(sh, 'du nope'), "du: cannot access 'nope': No such file or directory");
  run(sh, 'sudo rm /var/log/app/huge.log.1');
  assert.equal(out(sh, 'df -h /'), 'Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda2        49G   44G  5.0G  90% /');
});

test('du -s and -sh report file operands, including files matched by a glob', () => {
  const sh = createShell(linuxCase());
  assert.equal(out(sh, 'du -s notes.txt'), '4\tnotes.txt');
  assert.equal(out(sh, 'du -sh notes.txt'), '4.0K\tnotes.txt');
  assert.equal(out(sh, 'du -sh Docs/a.log'), '4.0K\tDocs/a.log');
  assert.equal(out(sh, 'du -sh /var/log/*'), '5.1G\t/var/log/app\n4.0K\t/var/log/syslog');
});

test('bash expands *, ? and bracket patterns before commands, but preserves quotes and unmatched patterns', () => {
  const sh = createShell(linuxCase());
  assert.equal(out(sh, 'ls *.txt'), 'notes.txt');
  assert.equal(out(sh, 'ls Docs/?.log'), 'Docs/a.log');
  assert.equal(out(sh, 'ls Docs/[ab].log'), 'Docs/a.log');
  assert.equal(out(sh, 'ls Docs/[!b].log'), 'Docs/a.log');
  assert.equal(out(sh, 'ls "*.txt"'), "ls: cannot access '*.txt': No such file or directory");
  assert.equal(out(sh, 'ls \\*.txt'), "ls: cannot access '*.txt': No such file or directory");
  assert.equal(out(sh, 'ls *.missing'), "ls: cannot access '*.missing': No such file or directory");
  assert.equal(out(sh, 'ls *'), 'notes.txt  run.sh\n\nDocs:\na.log');
  assert.equal(run(sh, 'sudo rm /var/log/app/*.1').exit, 0);
  assert.equal(sh.fs['/var/log/app/huge.log.1'], undefined);
});

test('chmod: octal, symbolic, umask, recursive, owner rule and errors', () => {
  const sh = createShell(linuxCase());
  const mode = (p) => sh.fs[p].mode;
  run(sh, 'chmod u+x run.sh');
  assert.equal(mode('/home/jordan/run.sh'), '744');
  run(sh, 'chmod 750 run.sh');
  assert.equal(mode('/home/jordan/run.sh'), '750');
  run(sh, 'chmod go-rwx,u=rw run.sh');
  assert.equal(mode('/home/jordan/run.sh'), '600');
  run(sh, 'chmod +x run.sh');
  assert.equal(mode('/home/jordan/run.sh'), '711', 'no who: applies to all but respects umask');
  run(sh, 'chmod a+w run.sh');
  assert.equal(mode('/home/jordan/run.sh'), '733');
  run(sh, 'chmod g=u run.sh');
  assert.equal(mode('/home/jordan/run.sh'), '773');
  run(sh, 'chmod o= run.sh');
  assert.equal(mode('/home/jordan/run.sh'), '770');
  run(sh, 'chmod 4755 run.sh');
  assert.match(out(sh, 'ls -l run.sh'), /^-rwsr-xr-x /);
  run(sh, 'chmod 1777 Docs');
  assert.match(out(sh, 'ls -ld Docs'), /^drwxrwxrwt /);
  run(sh, 'chmod -R go-w Docs');
  assert.equal(mode('/home/jordan/Docs'), '1755');
  run(sh, 'chmod -x run.sh');
  assert.equal(mode('/home/jordan/run.sh'), '4644');
  assert.equal(out(sh, 'chmod 999 run.sh'), "chmod: invalid mode: ‘999’\nTry 'chmod --help' for more information.");
  assert.equal(out(sh, 'chmod u+x'), "chmod: missing operand after ‘u+x’\nTry 'chmod --help' for more information.");
  assert.equal(out(sh, 'chmod 644 nope'), "chmod: cannot access 'nope': No such file or directory");
  assert.equal(out(sh, 'chmod 644 /etc/app/app.conf'), "chmod: changing permissions of '/etc/app/app.conf': Operation not permitted");
  assert.equal(run(sh, 'sudo chmod 640 /etc/app/app.conf').exit, 0);
  assert.equal(mode('/etc/app/app.conf'), '640');
});

test('chown and chgrp: root only for owner changes, member groups for owners', () => {
  const sh = createShell(linuxCase());
  assert.equal(out(sh, 'chown appsvc notes.txt'), "chown: changing ownership of 'notes.txt': Operation not permitted");
  assert.equal(out(sh, 'chown bob notes.txt'), 'chown: invalid user: ‘bob’');
  assert.equal(out(sh, 'chown jordan:nogroup notes.txt'), 'chown: invalid group: ‘jordan:nogroup’');
  run(sh, 'sudo chown appsvc:www-data /etc/app/app.conf');
  assert.deepEqual([sh.fs['/etc/app/app.conf'].owner, sh.fs['/etc/app/app.conf'].group], ['appsvc', 'www-data']);
  run(sh, 'sudo chown root: /etc/app/app.conf');
  assert.deepEqual([sh.fs['/etc/app/app.conf'].owner, sh.fs['/etc/app/app.conf'].group], ['root', 'root']);
  assert.equal(out(sh, 'chgrp adm notes.txt'), "chgrp: changing group of 'notes.txt': Operation not permitted");
  assert.equal(run(sh, 'chgrp sudo notes.txt').exit, 0, 'owner may chgrp to a group they belong to');
  assert.equal(out(sh, 'chgrp nope notes.txt'), 'chgrp: invalid group: ‘nope’');
  run(sh, 'sudo chgrp -R adm Docs');
  assert.equal(sh.fs['/home/jordan/Docs/a.log'].group, 'adm');
});

test('grep and find', () => {
  const sh = createShell(linuxCase());
  assert.equal(out(sh, 'grep error notes.txt'), 'Beta error\nerror two');
  assert.equal(out(sh, 'grep -in BETA notes.txt'), '2:Beta error');
  assert.equal(out(sh, 'grep -c error notes.txt'), '2');
  assert.equal(out(sh, 'grep -v error notes.txt'), 'alpha\ngamma');
  assert.equal(run(sh, 'grep zzz notes.txt').exit, 1);
  assert.equal(out(sh, 'grep -l x notes.txt Docs/a.log'), 'Docs/a.log');
  assert.equal(out(sh, 'grep -r x Docs'), 'Docs/a.log:x');
  assert.equal(out(sh, 'grep "error\\|alpha" notes.txt'), 'alpha\nBeta error\nerror two');
  assert.equal(out(sh, 'grep -E "^(alpha|gamma)$" notes.txt'), 'alpha\ngamma');
  assert.equal(out(sh, 'grep x Docs'), 'grep: Docs: Is a directory');
  const denied = run(sh, 'grep -r error /var/log');
  assert.equal(denied.exit, 2);
  assert.match(denied.out, /grep: \/var\/log\/syslog: Permission denied/);
  assert.equal(out(sh, 'sudo grep -rn "cannot open" /var/log'), '/var/log/syslog:1:Oct  9 09:01 web01 app[812]: error: cannot open /etc/app/app.conf');
  assert.equal(out(sh, 'grep'), "Usage: grep [OPTION]... PATTERNS [FILE]...\nTry 'grep --help' for more information.");
  assert.equal(out(sh, 'find . -name "*.log"'), './Docs/a.log');
  assert.equal(out(sh, 'find Docs -type d'), 'Docs');
  assert.equal(out(sh, 'find ~ -maxdepth 1 -type f -iname "NOTES*"'), '~/notes.txt');
  assert.equal(out(sh, 'find /srv -name "*.pem"'), "find: ‘/srv/private’: Permission denied");
  assert.equal(out(sh, 'sudo find /srv -name "*.pem"'), '/srv/private/key.pem');
  assert.equal(out(sh, 'find nope'), 'find: ‘nope’: No such file or directory');
  assert.equal(out(sh, 'find . -size 1k'), "find: unknown predicate `-size'");
  assert.equal(out(sh, 'find . -name'), "find: missing argument to `-name'");
});

// ---------------- Linux processes, services, packages, network, help ----------------
test('ps, top and kill', () => {
  const sh = createShell(linuxCase());
  const aux = out(sh, 'ps aux').split('\n');
  assert.equal(aux[0], 'USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND');
  assert.match(aux[2], /^appsvc       812  3\.2  1\.4 /);
  assert.match(out(sh, 'ps'), /^    PID TTY          TIME CMD\n   2201 pts\/0    00:00:00 bash\n   2300 pts\/0    00:00:00 sleep\n/);
  assert.match(out(sh, 'ps -ef'), /^UID          PID    PPID  C STIME TTY          TIME CMD\n/);
  assert.match(out(sh, 'ps -Q'), /^error: unsupported option \(BSD syntax\)/);
  const top = out(sh, 'top').split('\n');
  assert.match(top[0], /^top - 09:12:00 up /);
  assert.equal(top[6], '    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND');
  assert.match(top[7], /^    812 appsvc /);
  assert.equal(out(sh, 'kill 812'), 'bash: kill: (812) - Operation not permitted');
  assert.equal(out(sh, 'kill 999'), 'bash: kill: (999) - No such process');
  assert.equal(out(sh, 'kill abc'), 'bash: kill: abc: arguments must be process or job IDs');
  assert.equal(out(sh, 'kill -FOO 1'), 'bash: kill: FOO: invalid signal specification');
  run(sh, 'kill 2400');
  assert.ok(sh.state.processes[2400], 'SIGTERM ignored');
  run(sh, 'kill -9 2400');
  assert.equal(sh.state.processes[2400], undefined);
  assert.equal(out(sh, 'sudo kill 999'), 'kill: (999): No such process');
  run(sh, 'sudo kill -SIGKILL 812');
  assert.equal(sh.state.services.appd.active, 'failed');
});

test('sudo and su prompts, sudoers and root shells', () => {
  const sh = createShell(linuxCase({ sudoPassword: 'Bakery!2026', rootPassword: 'r00t' }));
  run(sh, 'sudo cat /etc/app/app.conf');
  assert.equal(sh.prompt(), '[sudo] password for jordan: ');
  assert.deepEqual(sh.awaiting, { secret: true });
  assert.equal(out(sh, 'wrong'), 'Sorry, try again.');
  assert.equal(sh.prompt(), '[sudo] password for jordan: ');
  assert.equal(out(sh, 'Bakery!2026'), 'port=8080');
  assert.deepEqual(sh.history, ['sudo cat /etc/app/app.conf'], 'passwords never reach history');
  assert.equal(out(sh, 'sudo cat /etc/app/app.conf'), 'port=8080', 'sudo caches the authentication');
  assert.equal(out(sh, 'sudo cd /root'), 'sudo: cd: command not found');
  run(sh, 'sudo -i');
  assert.equal(sh.prompt(), 'root@web01:~# ');
  assert.equal(sh.cwd, '/root');
  assert.equal(out(sh, 'whoami'), 'root');
  assert.equal(out(sh, 'exit'), 'logout');
  assert.equal(sh.user, 'jordan');
  run(sh, 'su -');
  assert.equal(sh.prompt(), 'Password: ');
  assert.equal(out(sh, 'bad'), 'su: Authentication failure');
  run(sh, 'su -');
  run(sh, 'r00t');
  assert.equal(sh.user, 'root');
  run(sh, 'exit');
  const triple = createShell(linuxCase({ sudoPassword: 'x' }));
  run(triple, 'sudo ls');
  run(triple, 'a');
  run(triple, 'b');
  assert.equal(out(triple, 'c'), 'sudo: 3 incorrect password attempts');
  assert.equal(triple.awaiting, null);
  const plain = createShell(linuxCase({ sudoer: false }));
  assert.equal(out(plain, 'sudo ls'), 'jordan is not in the sudoers file.\nThis incident has been reported to the administrator.');
  assert.equal(out(plain, 'su'), '');
  assert.equal(out(plain, 'anything'), 'su: Authentication failure', 'Ubuntu root has no password');
});

test('systemctl status/start/stop/restart/enable/disable', () => {
  const sh = createShell(linuxCase());
  const status = run(sh, 'systemctl status nginx');
  assert.equal(status.exit, 3);
  assert.equal(status.out, '○ nginx.service - A high performance web server and a reverse proxy server\n     Loaded: loaded (/usr/lib/systemd/system/nginx.service; disabled; preset: enabled)\n     Active: inactive (dead)\n       Docs: man:nginx(8)');
  assert.equal(out(sh, 'systemctl start nginx'), "Failed to start nginx.service: Interactive authentication required.\nSee system logs and 'systemctl status nginx.service' for details.");
  assert.equal(out(sh, 'systemctl enable nginx'), 'Failed to enable unit: Interactive authentication required.');
  assert.equal(out(sh, 'sudo systemctl enable --now nginx.service'), 'Created symlink /etc/systemd/system/multi-user.target.wants/nginx.service → /usr/lib/systemd/system/nginx.service.');
  assert.deepEqual([sh.state.services.nginx.active, sh.state.services.nginx.enabled], ['active', true]);
  assert.match(out(sh, 'systemctl status nginx'), /^● nginx\.service .*\n.*enabled; preset: enabled\)\n     Active: active \(running\) since Fri 2026-10-09 09:12:00 UTC; 0s ago\n/);
  assert.deepEqual([out(sh, 'systemctl is-active nginx'), out(sh, 'systemctl is-enabled nginx')], ['active', 'enabled']);
  run(sh, 'sudo systemctl stop nginx');
  assert.equal(sh.state.services.nginx.active, 'inactive');
  run(sh, 'sudo systemctl restart nginx');
  assert.equal(sh.state.services.nginx.active, 'active');
  assert.equal(out(sh, 'sudo systemctl disable --now nginx'), 'Removed "/etc/systemd/system/multi-user.target.wants/nginx.service".');
  assert.deepEqual([sh.state.services.nginx.active, sh.state.services.nginx.enabled], ['inactive', false]);
  const missing = run(sh, 'systemctl status ghost');
  assert.deepEqual([missing.out, missing.exit], ['Unit ghost.service could not be found.', 4]);
  assert.equal(run(sh, 'sudo systemctl start ghost').exit, 5);
  assert.equal(out(sh, 'systemctl start'), 'Too few arguments.');
  assert.equal(out(sh, 'systemctl frob x'), "Unknown command verb 'frob'.");
  const failed = run(sh, 'sudo systemctl restart appd');
  assert.equal(failed.out, 'Job for appd.service failed because the control process exited with error code.\nSee "systemctl status appd.service" and "journalctl -xeu appd.service" for details.');
  assert.match(out(sh, 'systemctl status appd'), /^× appd\.service - Order app\n[\s\S]*Active: failed \(Result: exit-code\)[\s\S]*cannot open \/etc\/app\/app\.conf$/);
  run(sh, 'sudo chgrp appsvc /etc/app/app.conf');
  assert.equal(run(sh, 'sudo systemctl restart appd').exit, 0);
  assert.equal(sh.state.services.appd.active, 'active');
});

test('successful systemctl restart replaces stale failure journal with Started', () => {
  const sh = createShell(linuxCase());
  assert.match(out(sh, 'systemctl status appd'), /cannot open \/etc\/app\/app.conf/);
  run(sh, 'sudo chown root:appsvc /etc/app/app.conf');
  assert.equal(run(sh, 'sudo systemctl restart appd').exit, 0);
  const status = out(sh, 'systemctl status appd');
  assert.match(status, /Active: active \(running\)/);
  assert.match(status, /systemd\[1\]: Started appd\.service - Order app\./);
  assert.doesNotMatch(status, /cannot open|FAILURE|Failed with result/);
});

test('apt and dnf over the package list', () => {
  const sh = createShell(linuxCase());
  assert.equal(out(sh, 'apt update'), 'E: Could not open lock file /var/lib/apt/lists/lock - open (13: Permission denied)\nE: Unable to lock directory /var/lib/apt/lists/');
  assert.match(out(sh, 'apt install tree'), /are you root\?$/);
  assert.match(out(sh, 'sudo apt install apache2'), /E: Unable to locate package apache2$/);
  assert.match(out(sh, 'sudo apt update'), /2 packages can be upgraded\. Run 'apt list --upgradable' to see them\.$/);
  const ask = run(sh, 'sudo apt install apache2');
  assert.match(ask.out, /The following additional packages will be installed:\n  apache2-bin\nThe following NEW packages will be installed:\n  apache2-bin apache2\n0 upgraded, 2 newly installed, 0 to remove and 2 not upgraded\./);
  assert.equal(sh.prompt(), 'Do you want to continue? [Y/n] ');
  const done = run(sh, '');
  assert.match(done.out, /Setting up apache2 \(2\.4\.58-1ubuntu8\.4\) \.\.\.\nCreated symlink \/etc\/systemd\/system\/multi-user\.target\.wants\/apache2\.service/);
  assert.deepEqual([sh.state.packages.installed.apache2, sh.state.services.apache2.active], ['2.4.58-1ubuntu8.4', 'active']);
  assert.match(out(sh, 'sudo apt install -y tree'), /Setting up tree \(2\.1\.1-2ubuntu3\) \.\.\./);
  assert.match(out(sh, 'sudo apt install tree'), /tree is already the newest version \(2\.1\.1-2ubuntu3\)\./);
  run(sh, 'sudo apt remove tree');
  assert.equal(out(sh, 'n'), 'Abort.');
  assert.ok(sh.state.packages.installed.tree);
  run(sh, 'sudo apt remove apache2');
  assert.match(out(sh, 'Y'), /Removing apache2/);
  assert.equal(sh.state.services.apache2, undefined);
  assert.match(out(sh, 'sudo apt remove nginx2'), /E: Unable to locate package nginx2/);
  assert.match(out(sh, 'sudo apt upgrade'), /2 upgraded, 0 newly installed/);
  assert.equal(out(sh, 'sudo apt frob'), 'E: Invalid operation frob');
  const rh = createShell(linuxCase({ distro: 'rhel', state: { packages: { available: { httpd: { version: '2.4.62-4.el10', service: { name: 'httpd' } } } } } }));
  assert.equal(out(rh, 'dnf install httpd'), 'Error: This command has to be run with superuser privileges (under the root user on most systems).');
  assert.match(out(rh, 'sudo dnf install httpd'), /Installing:\n httpd/);
  assert.equal(rh.prompt(), 'Is this ok [y/N]: ');
  assert.equal(out(rh, ''), 'Operation aborted.');
  assert.match(out(rh, 'sudo dnf install -y httpd'), /Complete!$/);
  assert.deepEqual([rh.state.services.httpd.active, rh.state.services.httpd.enabled], ['inactive', false], 'RHEL does not start services on install');
  assert.match(out(rh, 'sudo dnf install nope'), /Error: Unable to find a match: nope$/);
  assert.match(out(rh, 'sudo dnf remove -y httpd'), /Removed:/);
});

test('apt uses each package architecture in download and archive lines', () => {
  const sh = createShell(shellCases.find((c) => c.id === 'shell-03'));
  run(sh, 'sudo apt update');
  const install = out(sh, 'sudo apt install -y nginx');
  assert.match(install, /Get:\d+ .* amd64 nginx amd64 1\.24\.0/);
  assert.match(install, /Get:\d+ .* all nginx-common all 1\.24\.0/);
  assert.match(install, /nginx-common_1\.24\.0-2ubuntu7\.18_all\.deb/);
});

test('ip, ping, dig and nslookup on Linux', () => {
  const sh = createShell(linuxCase());
  const addr = out(sh, 'ip a');
  assert.match(addr, /^1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 /);
  assert.match(addr, /2: enp0s3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000\n    link\/ether 08:00:27:aa:bb:cc brd ff:ff:ff:ff:ff:ff\n    inet 192\.168\.1\.20\/24 brd 192\.168\.1\.255 scope global dynamic noprefixroute enp0s3/);
  assert.equal(out(sh, 'ip route'), 'default via 192.168.1.1 dev enp0s3 proto dhcp src 192.168.1.20 metric 100\n192.168.1.0/24 dev enp0s3 proto kernel scope link src 192.168.1.20 metric 100');
  assert.equal(out(sh, 'ip frob'), 'Object "frob" is unknown, try "ip help".');
  const ping = run(sh, 'ping -c 2 www.example');
  assert.equal(ping.out, 'PING www.example (203.0.113.10) 56(84) bytes of data.\n64 bytes from www.example (203.0.113.10): icmp_seq=1 ttl=64 time=14.2 ms\n64 bytes from www.example (203.0.113.10): icmp_seq=2 ttl=64 time=14.2 ms\n\n--- www.example ping statistics ---\n2 packets transmitted, 2 received, 0% packet loss, time 1004ms\nrtt min/avg/max/mdev = 14.2/14.2/14.2/0.000 ms');
  const lost = run(sh, 'ping down.example');
  assert.equal(lost.exit, 1);
  assert.match(lost.out, /4 packets transmitted, 0 received, 100% packet loss/);
  assert.equal(out(sh, 'ping nope.example'), 'ping: nope.example: Temporary failure in name resolution');
  assert.equal(out(sh, 'dig +short www.example'), '203.0.113.10');
  assert.match(out(sh, 'dig www.example'), /status: NOERROR[\s\S]*;; ANSWER SECTION:\nwww\.example\.\t\t300\tIN\tA\t203\.0\.113\.10/);
  assert.match(out(sh, 'dig nope.example'), /status: NXDOMAIN/);
  assert.equal(out(sh, 'nslookup www.example'), 'Server:\t\t127.0.0.53\nAddress:\t127.0.0.53#53\n\nNon-authoritative answer:\nName:\twww.example\nAddress: 203.0.113.10\n');
  assert.match(out(sh, 'nslookup nope.example'), /\*\* server can't find nope\.example: NXDOMAIN/);
  const offline = createShell(linuxCase({ state: { network: { interfaces: { enp0s3: { ipv4: null, state: 'DOWN' } } } } }));
  assert.equal(out(offline, 'ping 192.0.2.1'), 'ping: connect: Network is unreachable');
  assert.match(out(offline, 'dig www.example'), /no servers could be reached/);
});

test('man, --help, help, whoami, hostname, clear', () => {
  const sh = createShell(linuxCase());
  assert.match(out(sh, 'man ls'), /^LS\(1\) +User Commands +LS\(1\)\n\nNAME\n       ls - list directory contents\n\nSYNOPSIS\n       ls \[OPTION\]\.\.\. \[FILE\]\.\.\.$/);
  assert.match(out(sh, 'man sudo'), /SUDO\(8\) +System Manager's Manual/);
  const none = run(sh, 'man cd');
  assert.deepEqual([none.out, none.exit], ['No manual entry for cd', 16]);
  assert.equal(out(sh, 'man'), "What manual page do you want?\nFor example, try 'man man'.");
  assert.equal(out(sh, 'chmod --help'), 'Usage: chmod [OPTION]... MODE[,MODE]... FILE...\nChange file mode bits.');
  assert.match(out(sh, 'help'), /^Commands available on web01:\n/);
  assert.match(out(sh, 'help'), /systemctl +Control the systemd system and service manager/);
  assert.equal(out(sh, 'whoami'), 'jordan');
  assert.equal(out(sh, 'hostname'), 'web01');
  assert.deepEqual(sh.run('clear'), { out: '', exit: 0, goalsChanged: [], trapsHit: [], clear: true });
});

test('executing scripts needs the execute bit; bash script.sh only needs read', () => {
  const sh = createShell(linuxCase());
  const denied = run(sh, './run.sh');
  assert.deepEqual([denied.out, denied.exit], ['bash: ./run.sh: Permission denied', 126]);
  assert.equal(run(sh, './nope.sh').exit, 127);
  assert.equal(out(sh, './Docs'), 'bash: ./Docs: Is a directory');
  assert.equal(out(sh, 'sudo ./run.sh'), 'sudo: ./run.sh: command not found');
  assert.equal(out(sh, 'bash run.sh'), 'ran ok');
  assert.equal(sh.state.flags.ran, true);
  run(sh, 'chmod u+x run.sh');
  assert.equal(out(sh, '/home/jordan/run.sh'), 'ran ok');
});

// ---------------- Windows cmd ----------------
test('dir: header, rows, summary, wildcards, /b, /a and errors', () => {
  const sh = createShell(winCase());
  const listing = out(sh, 'dir Documents').split('\n');
  assert.deepEqual(listing.slice(0, 5), [' Volume in drive C is Windows', ' Volume Serial Number is 6A2F-1C3D', '', ' Directory of C:\\Users\\avery\\Documents', '']);
  assert.equal(listing[5], '10/09/2026  09:12 AM    <DIR>          .');
  assert.ok(listing.includes('10/08/2026  04:31 PM            12,288 report.docx'));
  assert.ok(!listing.some((l) => l.includes('hidden.ini')));
  assert.equal(listing.at(-2), '               3 File(s)         12,301 bytes');
  assert.equal(listing.at(-1), '               3 Dir(s)  112,233,445,566 bytes free');
  assert.ok(out(sh, 'dir /a Documents').includes('hidden.ini'));
  assert.equal(out(sh, 'dir /b Documents\\*.txt'), 'notes.txt\nro.txt');
  assert.match(out(sh, 'dir Documents\\*.zip'), /Directory of C:\\Users\\avery\\Documents\n\nFile Not Found$/);
  assert.equal(out(sh, 'dir C:\\nope\\x'), 'The system cannot find the path specified.');
  assert.match(out(sh, 'dir D:\\'), /^ Volume in drive D is Data\n Volume Serial Number is 11AA-22BB/);
});

test('copy, xcopy, move, del, md, rd, type', () => {
  const sh = createShell(winCase());
  run(sh, 'cd Documents');
  assert.equal(out(sh, 'copy notes.txt n2.txt'), '        1 file(s) copied.');
  assert.equal(run(sh, 'copy notes.txt n2.txt').out, '');
  assert.equal(sh.prompt(), 'Overwrite C:\\Users\\avery\\Documents\\n2.txt? (Yes/No/All): ');
  assert.equal(out(sh, 'No'), '        0 file(s) copied.');
  assert.equal(out(sh, 'copy /Y notes.txt n2.txt'), '        1 file(s) copied.');
  assert.equal(out(sh, 'copy *.txt Old'), 'n2.txt\nnotes.txt\nro.txt\n        3 file(s) copied.');
  assert.equal(out(sh, 'copy nope.txt x'), 'The system cannot find the file specified.\n        0 file(s) copied.');
  assert.equal(out(sh, 'copy notes.txt notes.txt'), 'The file cannot be copied onto itself.\n        0 file(s) copied.');
  assert.equal(out(sh, 'copy notes.txt C:\\Windows\\System32'), 'Access is denied.\n        0 file(s) copied.');
  assert.equal(out(sh, 'copy notes.txt C:\\nope\\x.txt'), 'The system cannot find the path specified.\n        0 file(s) copied.');
  run(sh, 'xcopy C:\\Users\\avery\\Documents C:\\Backup /E');
  assert.equal(sh.prompt(), 'Does C:\\Backup specify a file name\nor directory name on the target\n(F = file, D = directory)? ');
  assert.match(out(sh, 'D'), /C:\\Users\\avery\\Documents\\Old\\keep\.txt\n[\s\S]*\d+ File\(s\) copied$/);
  assert.ok(sh.fs['C:\\Backup\\Old\\keep.txt']);
  assert.match(out(sh, 'xcopy C:\\Users\\avery\\Documents C:\\Backup2 /S /I'), /File\(s\) copied$/);
  assert.equal(out(sh, 'xcopy nope C:\\x'), 'File not found - nope\n0 File(s) copied');
  assert.equal(out(sh, 'move /Y n2.txt Old'), '        1 file(s) moved.');
  assert.ok(!sh.fs['C:\\Users\\avery\\Documents\\n2.txt']);
  assert.equal(out(sh, 'move Old Archive'), '        1 dir(s) moved.');
  assert.ok(sh.fs['C:\\Users\\avery\\Documents\\Archive\\keep.txt']);
  assert.equal(out(sh, 'move nope x'), 'The system cannot find the file specified.');
  assert.equal(out(sh, 'del nope.txt'), 'Could Not Find C:\\Users\\avery\\Documents\\nope.txt');
  assert.equal(out(sh, 'del ro.txt'), 'C:\\Users\\avery\\Documents\\ro.txt\nAccess is denied.');
  assert.equal(run(sh, 'del /F ro.txt').exit, 0);
  run(sh, 'del Archive');
  assert.equal(sh.prompt(), 'C:\\Users\\avery\\Documents\\Archive\\*, Are you sure (Y/N)? ');
  run(sh, 'Y');
  assert.ok(!sh.fs['C:\\Users\\avery\\Documents\\Archive\\keep.txt'] && sh.fs['C:\\Users\\avery\\Documents\\Archive']);
  run(sh, 'del /Q C:\\Backup\\*.*');
  assert.ok(!sh.fs['C:\\Backup\\notes.txt'] && sh.fs['C:\\Backup\\Old\\keep.txt']);
  assert.equal(out(sh, 'md New\\Deep\\Dir'), '');
  assert.ok(sh.fs['C:\\Users\\avery\\Documents\\New\\Deep\\Dir']);
  assert.equal(out(sh, 'md New'), 'A subdirectory or file New already exists.');
  assert.equal(out(sh, 'mkdir C:\\Windows\\Test'), 'Access is denied.');
  assert.equal(out(sh, 'rd New'), 'The directory is not empty.');
  run(sh, 'rd /s New');
  assert.equal(sh.prompt(), 'New, Are you sure (Y/N)? ');
  run(sh, 'y');
  assert.ok(!sh.fs['C:\\Users\\avery\\Documents\\New']);
  assert.equal(out(sh, 'rmdir /s /q C:\\Backup'), '');
  assert.equal(out(sh, 'rd nope'), 'The system cannot find the file specified.');
  assert.equal(out(sh, 'rd notes.txt'), 'The directory name is invalid.');
  assert.equal(out(sh, 'rd C:\\Users'), 'The process cannot access the file because it is being used by another process.');
  assert.equal(out(sh, 'type nope'), 'The system cannot find the file specified.');
  assert.equal(out(sh, 'type Archive'), 'Access is denied.');
});

test('robocopy /E /MIR /MOV with summary and exit codes', () => {
  const sh = createShell(winCase());
  run(sh, 'net use Z: \\\\fileserver\\backups');
  const first = run(sh, 'robocopy C:\\Users\\avery\\Documents Z:\\avery /E');
  assert.equal(first.exit, 3, 'files copied (1) + extras present (2)');
  assert.match(first.out, /^\n-{79}\n   ROBOCOPY     ::     Robust File Copy for Windows\n-{79}\n\n  Started : Friday, October 9, 2026 9:12:00 AM\n   Source : C:\\Users\\avery\\Documents\\\n     Dest : Z:\\avery\\\n/);
  assert.match(first.out, /  Options : \*\.\* \/S \/E \/DCOPY:DA \/COPY:DAT \/R:1000000 \/W:30/);
  assert.match(first.out, /\t    New File  \t\t  12\.0 k\treport\.docx/);
  assert.match(first.out, /\*EXTRA File \t\t       3\tstale\.txt/);
  assert.match(first.out, /               Total    Copied   Skipped  Mismatch    FAILED    Extras\n    Dirs :         2         1         1         0         0         0\n   Files :         5         5         0         0         0         1\n/);
  assert.ok(sh.fs['\\\\fileserver\\backups\\avery\\stale.txt'], '/E keeps extras');
  assert.ok(sh.fs['\\\\fileserver\\backups\\avery\\Old\\keep.txt']);
  const again = run(sh, 'robocopy C:\\Users\\avery\\Documents Z:\\avery /MIR');
  assert.equal(again.exit, 2);
  assert.match(again.out, /\/PURGE \/MIR/);
  assert.ok(!sh.fs['\\\\fileserver\\backups\\avery\\stale.txt'], '/MIR purges extras');
  run(sh, 'md C:\\Out');
  assert.equal(run(sh, 'robocopy C:\\Users\\avery\\Documents\\Old C:\\Out /MOV').exit, 1);
  assert.ok(sh.fs['C:\\Out\\keep.txt'] && !sh.fs['C:\\Users\\avery\\Documents\\Old\\keep.txt']);
  const bad = run(sh, 'robocopy C:\\Nope C:\\Out');
  assert.equal(bad.exit, 16);
  assert.match(bad.out, /ERROR 2 \(0x00000002\) Accessing Source Directory C:\\Nope\\\nThe system cannot find the file specified\./);
  assert.match(out(sh, 'robocopy /?'), /\/MIR :: MIRror a directory tree \(equivalent to \/E plus \/PURGE\)\./);
});

test('ipconfig: basic, /all, /release, /renew, /flushdns, /displaydns, elevation', () => {
  const sh = createShell(winCase());
  assert.equal(out(sh, 'ipconfig'), '\nWindows IP Configuration\n\n\nEthernet adapter Ethernet:\n\n   Connection-specific DNS Suffix  . :\n   Link-local IPv6 Address . . . . . : fe80::1c2b:9e5f:4a7d:12%12\n   Autoconfiguration IPv4 Address. . : 169.254.73.18\n   Subnet Mask . . . . . . . . . . . : 255.255.0.0\n   Default Gateway . . . . . . . . . :');
  assert.equal(out(sh, 'ipconfig /renew'), 'The requested operation requires elevation.');
  assert.equal(out(sh, 'ipconfig /release'), 'The requested operation requires elevation.');
  assert.equal(sh.state.network.adapters.Ethernet.ipv4, '169.254.73.18');
  assert.match(out(sh, 'ipconfig /bogus'), /^\nError: unrecongnized or incomplete command line\.\nUSAGE:/);
  sh.elevate();
  assert.match(out(sh, 'ipconfig /renew'), /   IPv4 Address\. \. \. \. \. \. \. \. \. \. \. : 192\.168\.10\.44\n   Subnet Mask \. \. \. \. \. \. \. \. \. \. \. : 255\.255\.255\.0\n   Default Gateway \. \. \. \. \. \. \. \. \. : 192\.168\.10\.1$/);
  const all = out(sh, 'ipconfig /all');
  for (const line of ['   Host Name . . . . . . . . . . . . : FD-PC-03', '   Physical Address. . . . . . . . . : 3C-52-82-4A-19-7E', '   DHCP Enabled. . . . . . . . . . . : Yes',
    '   IPv4 Address. . . . . . . . . . . : 192.168.10.44(Preferred)', '   Lease Obtained. . . . . . . . . . : Friday, October 9, 2026 9:12:00 AM',
    '   DHCP Server . . . . . . . . . . . : 192.168.10.1', '   DNS Servers . . . . . . . . . . . : 192.168.10.53', '   NetBIOS over Tcpip. . . . . . . . : Enabled']) assert.ok(all.includes(line), line);
  assert.match(out(sh, 'ipconfig /displaydns'), /    Record Name \. \. \. \. \. : intranet\.corp\.example\n[\s\S]*    A \(Host\) Record \. \. \. : 192\.168\.10\.80/);
  assert.equal(out(sh, 'ipconfig /flushdns'), '\nWindows IP Configuration\n\nSuccessfully flushed the DNS Resolver Cache.');
  assert.deepEqual(sh.state.network.dnsCache, {});
  run(sh, 'ipconfig /release');
  assert.equal(sh.state.network.adapters.Ethernet.ipv4, null);
  assert.doesNotMatch(out(sh, 'ipconfig'), /IPv4/);
  const noDhcp = createShell(winCase('windows-cmd', { admin: true, state: { ...winState(), network: { adapters: { Ethernet: { ipv4: '169.254.9.9', mask: '255.255.0.0', dns: [] } } } } }));
  const failed = run(noDhcp, 'ipconfig /renew');
  assert.equal(failed.exit, 1);
  assert.match(failed.out, /^An error occurred while renewing interface Ethernet : unable to contact your DHCP server\. Request has timed out\./);
});

test('ping, tracert, pathping, nslookup: cache vs DNS, APIPA failure', () => {
  const sh = createShell(winCase());
  assert.match(out(sh, 'ping intranet.corp.example'), /Pinging intranet\.corp\.example \[192\.168\.10\.80\] with 32 bytes of data:\nPING: transmit failed\. General failure\./);
  assert.equal(out(sh, 'ping other.corp.example'), 'Ping request could not find host other.corp.example. Please check the name and try again.');
  sh.elevate();
  run(sh, 'ipconfig /renew');
  const stale = run(sh, 'ping -n 2 intranet.corp.example');
  assert.equal(stale.out, '\nPinging intranet.corp.example [192.168.10.80] with 32 bytes of data:\nRequest timed out.\nRequest timed out.\n\nPing statistics for 192.168.10.80:\n    Packets: Sent = 2, Received = 0, Lost = 2 (100% loss),');
  assert.equal(out(sh, 'nslookup intranet.corp.example'), 'Server:  dns1.corp.example\nAddress:  192.168.10.53\n\nNon-authoritative answer:\nName:    intranet.corp.example\nAddress:  192.168.10.90\n');
  assert.match(out(sh, 'nslookup nope.corp.example'), /\*\*\* dns1\.corp\.example can't find nope\.corp\.example: Non-existent domain/);
  run(sh, 'ipconfig /flushdns');
  const fresh = run(sh, 'ping intranet.corp.example');
  assert.equal(fresh.exit, 0);
  assert.match(fresh.out, /Reply from 192\.168\.10\.90: bytes=32 time=3ms TTL=128\n[\s\S]*    Minimum = 3ms, Maximum = 3ms, Average = 3ms$/);
  assert.equal(out(sh, 'tracert intranet.corp.example'), '\nTracing route to intranet.corp.example [192.168.10.90]\nover a maximum of 30 hops:\n\n  1     3 ms     3 ms     3 ms  intranet.corp.example [192.168.10.90]\n\nTrace complete.');
  const far = out(sh, 'tracert -d 203.0.113.50').split('\n');
  assert.equal(far[4], '  1     1 ms     1 ms     1 ms  192.168.10.1');
  assert.equal(far[5], '  2     *        *        *     Request timed out.');
  assert.match(out(sh, 'pathping -n intranet.corp.example'), /Computing statistics for 50 seconds\.\.\.\n            Source to Here   This Node\/Link\nHop  RTT    Lost\/Sent = Pct  Lost\/Sent = Pct  Address/);
  assert.match(out(sh, 'ping /?'), /Usage: ping \[-t\] \[-a\] \[-n count\]/);
});

test('netstat, tasklist, taskkill', () => {
  const sh = createShell(winCase());
  assert.equal(out(sh, 'netstat -ano'), '\nActive Connections\n\n  Proto  Local Address          Foreign Address        State           PID\n  TCP    0.0.0.0:135            0.0.0.0:0              LISTENING       1196\n  TCP    192.168.10.44:49702    203.0.113.80:443       ESTABLISHED     4120');
  assert.equal(out(sh, 'netstat').split('\n').length, 5);
  const list = out(sh, 'tasklist').split('\n');
  assert.equal(list[1], 'Image Name                     PID Session Name        Session#    Mem Usage');
  assert.equal(list[2], '========================= ======== ================ =========== ============');
  assert.equal(list[4], 'notepad.exe                   4120 Console                    1     18,012 K');
  assert.equal(out(sh, 'tasklist /FI "IMAGENAME eq nothing.exe"'), 'INFO: No tasks are running which match the specified criteria.');
  assert.match(out(sh, 'tasklist /FI "PID eq 4120"'), /notepad\.exe +4120/);
  assert.equal(out(sh, 'taskkill /IM badapp.exe'), 'ERROR: The process with PID 5200 could not be terminated.\nReason: This process can only be terminated forcefully (with /F option).');
  assert.equal(out(sh, 'taskkill /IM badapp.exe /F'), 'SUCCESS: The process "badapp.exe" with PID 5200 has been terminated.');
  assert.equal(out(sh, 'taskkill /PID 4120'), 'SUCCESS: Sent termination signal to the process with PID 4120.');
  assert.equal(sh.state.processes[4120], undefined);
  assert.equal(out(sh, 'taskkill /PID 4 /F'), 'ERROR: The process with PID 4 could not be terminated.\nReason: Access is denied.');
  const missing = run(sh, 'taskkill /PID 999');
  assert.deepEqual([missing.out, missing.exit], ['ERROR: The process "999" not found.', 128]);
  assert.match(out(sh, 'taskkill'), /^ERROR: Invalid syntax\. Neither \/FI nor \/PID nor \/IM were specified\./);
});

test('sfc and DISM: admin rule, results and repair order', () => {
  const sh = createShell(winCase());
  assert.equal(out(sh, 'sfc /scannow'), 'You must be an administrator running a console session in order to\nuse the sfc utility.');
  assert.match(out(sh, 'DISM /Online /Cleanup-Image /RestoreHealth'), /Error: 740\n\nElevated permissions are required to run DISM\./);
  assert.match(out(sh, 'sfc'), /SFC \[\/SCANNOW\]/);
  const r = sh.elevate();
  assert.equal(r.exit, 0);
  assert.equal(sh.cwd, 'C:\\Windows\\System32');
  assert.equal(sh.prompt(), 'C:\\Windows\\System32>');
  assert.equal(out(sh, 'sfc /verifyonly').split('\n').at(-2), 'Windows Resource Protection found integrity violations. Details are included in the CBS.Log windir\\Logs\\CBS\\CBS.log. For example');
  const first = run(sh, 'sfc /scannow');
  assert.equal(first.out, '\nBeginning system scan.  This process will take some time.\n\nBeginning verification phase of system scan.\nVerification 100% complete.\n\nWindows Resource Protection found corrupt files but was unable to fix some of them.\nFor online repairs, details are included in the CBS log file located at\nwindir\\Logs\\CBS\\CBS.log. For example C:\\Windows\\Logs\\CBS\\CBS.log. For offline\nrepairs, details are included in the log file provided by the /OFFLOGFILE flag.');
  assert.match(out(sh, 'dism /online /cleanup-image /checkhealth'), /Image Version: 10\.0\.26100\.4652\n\nThe component store is repairable\.\nThe operation completed successfully\.$/);
  assert.match(out(sh, 'DISM /Online /Cleanup-Image /ScanHealth'), /\[=+100\.0%=+\] The component store is repairable\./);
  assert.match(out(sh, 'DISM /Online /Cleanup-Image /RestorHealth'), /Error: 87\n\nThe RestorHealth option is unknown\./);
  assert.match(out(sh, 'DISM /Cleanup-Image /RestoreHealth'), /Error: 87/);
  assert.match(out(sh, 'DISM /Online /Cleanup-Image /RestoreHealth'), /The restore operation completed successfully\.\nThe operation completed successfully\.$/);
  assert.match(out(sh, 'sfc /scannow'), /found corrupt files and successfully repaired them\./);
  assert.match(out(sh, 'sfc /scannow'), /did not find any integrity violations\.$/);
  const offline = createShell(winCase('windows-cmd', { admin: true, state: { ...winState(), windows: { systemFiles: 'corrupt', componentStore: 'source-needed' } } }));
  assert.match(out(offline, 'DISM /Online /Cleanup-Image /RestoreHealth'), /Error: 0x800f081f\n\nThe source files could not be found\./);
  assert.match(out(offline, 'DISM /Online /Cleanup-Image /RestoreHealth /Source:wim:C:\\Sources\\nope.wim:1 /LimitAccess'), /0x800f081f/);
  assert.match(out(offline, 'DISM /Online /Cleanup-Image /RestoreHealth /Source:wim:C:\\Sources\\install.wim:1 /LimitAccess'), /The restore operation completed successfully/);
});

test('chkdsk: read-only scan, /f on a data volume, scheduling on the system volume, restart', () => {
  const sh = createShell(winCase());
  assert.match(out(sh, 'chkdsk'), /^Access Denied as you do not have sufficient privileges or/);
  sh.elevate();
  const scan = run(sh, 'chkdsk D:');
  assert.equal(scan.exit, 3);
  assert.match(scan.out, /WARNING!  \/F parameter not specified\.\nRunning CHKDSK in read-only mode\.[\s\S]*Windows has scanned the file system and found problems\.\nRun CHKDSK with the \/F \(fix\) option to correct these\.$/);
  assert.match(out(sh, 'chkdsk D: /f'), /Windows has made corrections to the file system\.\nNo further action is required\.$/);
  assert.equal(sh.state.volumes['D:'].badSectors, true, '/f does not scan for bad sectors');
  assert.match(out(sh, 'chkdsk D: /r'), /Stage 5: Looking for bad, free clusters/);
  assert.equal(sh.state.volumes['D:'].badSectors, false);
  const sys = run(sh, 'chkdsk C: /f');
  assert.equal(sys.out, 'The type of the file system is NTFS.\nCannot lock current drive.\n\nChkdsk cannot run because the volume is in use by another\nprocess.  Would you like to schedule this volume to be');
  assert.equal(sh.prompt(), 'checked the next time the system restarts? (Y/N) ');
  assert.equal(out(sh, 'Y'), 'This volume will be checked the next time the system restarts.');
  assert.equal(sh.state.volumes['C:'].checkScheduled, true);
  assert.equal(out(sh, 'chkdsk Q:'), 'Cannot open volume for direct access.');
  assert.match(out(sh, 'shutdown /r /t 0'), /^\[Windows restarts\. You sign in again as avery with a new, non-elevated prompt\.\]$/);
  assert.equal(sh.state.volumes['C:'].checkScheduled, false);
  assert.equal(sh.admin, false);
  assert.equal(sh.cwd, 'C:\\Users\\avery');
  assert.equal(out(sh, 'shutdown /a'), 'Unable to abort the system shutdown because no shutdown was in progress.(1116)');
  assert.match(out(sh, 'shutdown'), /^Usage: shutdown \[\/i \| \/l \| \/s/);
});

test('gpupdate, gpresult, whoami, hostname, winver, help and /?', () => {
  const sh = createShell(winCase());
  assert.equal(out(sh, 'gpupdate /force'), 'Updating policy...\n\nComputer Policy update has completed successfully.\nUser Policy update has completed successfully.\n');
  assert.equal(sh.state.policy.screenLock, true);
  assert.equal(sh.state.gp.forced, true);
  const gp = out(sh, 'gpresult /r');
  assert.match(gp, /RSOP data for FD-PC-03\\avery on FD-PC-03 : Logging Mode\n-{55}\n/);
  assert.doesNotMatch(gp, /COMPUTER SETTINGS/, 'standard users see only user settings');
  assert.match(gp, /USER SETTINGS\n-{13}\n    Last time Group Policy was applied: 10\/9\/2026 at 9:12:00 AM\n    Group Policy was applied from:      dc1\.corp\.example/);
  sh.elevate();
  assert.match(out(sh, 'gpresult /r'), /COMPUTER SETTINGS/);
  assert.equal(out(sh, 'whoami'), 'fd-pc-03\\avery');
  assert.match(out(sh, 'whoami /x y'), /^ERROR: Invalid argument\/option - 'y'\./);
  assert.equal(out(sh, 'hostname'), 'FD-PC-03');
  assert.match(out(sh, 'winver'), /Version 24H2 \(OS Build 26100\.4652\)/);
  assert.match(out(sh, 'help'), /^For more information on a specific command, type HELP command-name\nCD             Displays the name of or changes the current directory\./);
  assert.match(out(sh, 'help robocopy'), /Advanced utility to copy files and directory trees/);
  assert.match(out(sh, 'chkdsk /?'), /^Checks a disk and displays a status report\.\n\nCHKDSK \[volume/);
  assert.match(out(sh, 'xcopy /?'), /\/E +Copies directories and subdirectories, including empty ones\./);
  assert.deepEqual(sh.run('cls').clear, true);
});

test('net user, net localgroup, net use, net start/stop', () => {
  const sh = createShell(winCase());
  assert.equal(out(sh, 'net user'), `\nUser accounts for \\\\FD-PC-03\n\n${'-'.repeat(79)}\nAdministrator            avery                    DefaultAccount\nGuest                    WDAGUtilityAccount\nThe command completed successfully.\n`);
  assert.match(out(sh, 'net user avery'), /^User name                    avery\n[\s\S]*Account active               Yes\n[\s\S]*Local Group Memberships      \*Users\nGlobal Group memberships     \*None\nThe command completed successfully\.\n$/);
  assert.match(out(sh, 'net user ghost'), /^The user name could not be found\.\n\nMore help is available by typing NET HELPMSG 2221\./);
  assert.equal(out(sh, 'net user temp P@ss1 /add'), 'System error 5 has occurred.\n\nAccess is denied.\n');
  assert.match(out(sh, 'net localgroup'), /\*Administrators\n\*Backup Operators\n/);
  assert.match(out(sh, 'net localgroup administrators'), /^Alias name     Administrators\nComment        Administrators have complete and unrestricted access to the computer\/domain\n\nMembers\n\n-{79}\nAdministrator\nThe command completed successfully\.\n$/);
  assert.match(out(sh, 'net localgroup Nope'), /System error 1376 has occurred\./);
  sh.elevate();
  assert.equal(out(sh, 'net user temp P@ss1 /add'), 'The command completed successfully.\n');
  assert.match(out(sh, 'net user temp P@ss1 /add'), /The account already exists\./);
  run(sh, 'net user temp /active:no');
  assert.equal(sh.state.users.temp.active, false);
  run(sh, 'net user temp /delete');
  assert.equal(sh.state.users.temp, undefined);
  run(sh, 'net localgroup Administrators avery /add');
  assert.ok(sh.state.users.avery.groups.includes('Administrators'));
  assert.match(out(sh, 'net localgroup Administrators avery /add'), /System error 1378 has occurred\./);
  run(sh, 'net localgroup Administrators avery /delete');
  assert.match(out(sh, 'net localgroup Administrators avery /delete'), /System error 1377 has occurred\./);
  assert.equal(out(sh, 'net use'), 'New connections will be remembered.\n\nThere are no entries in the list.\n');
  assert.match(out(sh, 'net use Z: \\\\nas\\none'), /System error 53 has occurred\.\n\nThe network path was not found\./);
  assert.equal(out(sh, 'net use Z: \\\\FILESERVER\\Backups'), 'The command completed successfully.\n');
  assert.match(out(sh, 'net use Y: \\\\fileserver\\backups'), /The command completed successfully/);
  assert.match(out(sh, 'net use Z: \\\\fileserver\\backups'), /System error 85 has occurred\.\n\nThe local device name is already in use\./);
  assert.match(out(sh, 'net use'), /OK           Z:        \\\\fileserver\\backups      Microsoft Windows Network/);
  assert.equal(out(sh, 'type Z:\\avery\\stale.txt'), 'old');
  assert.equal(out(sh, 'net use Y: /delete'), 'Y: was deleted successfully.\n');
  assert.match(out(sh, 'net use Q: /delete'), /The network connection could not be found\./);
  assert.match(out(sh, 'net use * \\\\fileserver\\backups'), /^Drive Y: is now connected to \\\\fileserver\\backups\./);
  assert.match(out(sh, 'net start'), /These Windows services are started:\n\n   Print Spooler\n/);
  assert.match(out(sh, 'net start spooler'), /The requested service has already been started\./);
  assert.equal(out(sh, 'net stop "Print Spooler"'), 'The Print Spooler service is stopping.\nThe Print Spooler service was stopped successfully.\n');
  assert.match(out(sh, 'net stop spooler'), /The Print Spooler service is not started\./);
  assert.equal(out(sh, 'net start spooler'), 'The Print Spooler service is starting.\nThe Print Spooler service was started successfully.\n');
  assert.match(out(sh, 'net start RemoteRegistry'), /System error 1058 has occurred\./);
  assert.match(out(sh, 'net start ghost'), /The service name is invalid\./);
  assert.match(out(sh, 'net'), /^The syntax of this command is:/);
});

test('net use maps the requested UNC subfolder', () => {
  const sh = createShell(winCase());
  assert.equal(out(sh, 'net use X: \\\\fileserver\\backups\\avery'), 'The command completed successfully.\n');
  assert.equal(sh.state.mappedDrives['X:'], '\\\\fileserver\\backups\\avery');
  assert.equal(out(sh, 'type X:\\stale.txt'), 'old');
  assert.match(out(sh, 'net use Y: \\\\fileserver\\backups\\missing'), /System error 53 has occurred/);
});

test('diskpart: list, select, clean (system disk refused), create, format, assign', () => {
  const sh = createShell(winCase());
  assert.match(out(sh, 'diskpart'), /administrator/);
  assert.notEqual(sh.prompt(), 'DISKPART> ');
  sh.elevate();
  assert.equal(out(sh, 'diskpart'), '\nMicrosoft DiskPart version 10.0.26100.1150\n\nCopyright (C) Microsoft Corporation.\nOn computer: FD-PC-03');
  assert.equal(sh.prompt(), 'DISKPART> ');
  assert.equal(out(sh, 'list disk'), '\n  Disk ###  Status         Size     Free     Dyn  Gpt\n  --------  -------------  -------  -------  ---  ---\n  Disk 0    Online          476 GB      0 B        *\n  Disk 1    Online           58 GB      0 B');
  assert.equal(out(sh, 'clean'), 'There is no disk selected.\nPlease select a disk and try again.');
  assert.equal(out(sh, 'select disk 7'), 'The disk you specified is not valid.\n\nThere is no disk selected.');
  assert.equal(out(sh, 'select disk 0'), '\nDisk 0 is now the selected disk.');
  assert.equal(out(sh, 'clean'), 'Virtual Disk Service error:\nClean is not allowed on the disk containing the current boot,\nsystem, pagefile, crashdump or hibernation volume.');
  assert.equal(sh.state.disks[0].cleanAttempted, true);
  run(sh, 'select disk 1');
  assert.match(out(sh, 'list disk'), /\* Disk 1    Online           58 GB      0 B$/);
  assert.equal(out(sh, 'create partition primary'), 'Virtual Disk Service error:\nThere is not enough usable space for this operation.');
  assert.equal(out(sh, 'clean'), '\nDiskPart succeeded in cleaning the disk.');
  assert.equal(sh.state.volumes['E:'], undefined);
  assert.equal(out(sh, 'format fs=ntfs quick'), 'There is no volume selected.\nPlease select a volume and try again.');
  assert.equal(out(sh, 'create partition primary'), '\nDiskPart succeeded in creating the specified partition.');
  assert.equal(out(sh, 'format fs=fat32 quick'), 'Virtual Disk Service error:\nThe volume size is too big.');
  assert.equal(out(sh, 'format fs=exfat quick label=FIRMWARE'), '\n  100 percent completed\n\nDiskPart successfully formatted the volume.');
  assert.equal(out(sh, 'assign letter=C'), 'Virtual Disk Service error:\nThe specified drive letter is not free to be assigned.');
  assert.equal(out(sh, 'assign'), '\nDiskPart successfully assigned the drive letter or mount point.');
  assert.match(out(sh, 'list volume'), /\* Volume 1     E   FIRMWARE     exFAT  Removable     58 GB  Healthy$/);
  assert.match(out(sh, 'list partition'), /\* Partition 1    Primary             58 GB  1024 KB/);
  assert.equal(out(sh, 'active'), '\nDiskPart marked the current partition as active.');
  run(sh, 'select disk 0');
  assert.equal(out(sh, 'select partition 1'), '\nPartition 1 is now the selected partition.');
  assert.equal(out(sh, 'active'), 'The selected disk is not a fixed MBR disk.\nThe ACTIVE command can only be used on fixed MBR disks.');
  assert.equal(out(sh, 'format fs=ntfs quick'), 'Virtual Disk Service error:\nThe operation is not supported on a boot, system, pagefile,\ncrashdump or hibernation volume.');
  assert.match(out(sh, 'bogus'), /Microsoft DiskPart version/);
  assert.equal(out(sh, 'exit'), '\nLeaving DiskPart...');
  assert.equal(sh.prompt(), 'C:\\Windows\\System32>');
  assert.equal(sh.state.volumes['E:'].fs, 'exFAT');
  assert.match(out(sh, 'dir E:\\'), / Volume in drive E is FIRMWARE\n[\s\S]*File Not Found$/);
  assert.ok(sh.history.includes('select disk 0'));
});

test('format: elevation, prompt, removable flow and system volume', () => {
  const sh = createShell(winCase());
  assert.match(out(sh, 'format D: /fs:ntfs /q'), /^Access denied as you do not have sufficient privileges\./);
  sh.elevate();
  assert.equal(out(sh, 'format C: /q'), 'Format cannot run because the volume is in use by another\nprocess.');
  assert.equal(out(sh, 'format Q:'), 'Invalid drive specification.');
  assert.equal(out(sh, 'format'), 'Required parameter missing -');
  assert.equal(out(sh, 'format D: /fs:ntfs /q /v:Archive'), 'The type of the file system is NTFS.\nWARNING, ALL DATA ON NON-REMOVABLE DISK\nDRIVE D: WILL BE LOST!');
  assert.equal(sh.prompt(), 'Proceed with Format (Y/N)? ');
  assert.match(out(sh, 'y'), /^QuickFormatting 500\.0 GB\nCreating file system structures\.\nFormat complete\./);
  assert.equal(sh.state.volumes['D:'].label, 'Archive');
  assert.equal(out(sh, 'format E: /fs:exfat /q'), 'Insert new disk for drive E:');
  assert.equal(sh.prompt(), 'and press ENTER when ready...');
  assert.match(out(sh, ''), /Format complete\./);
  assert.equal(sh.state.volumes['E:'].fs, 'exFAT');
});

// ---------------- PowerShell ----------------
test('PowerShell file cmdlets and aliases', () => {
  const sh = createShell(winCase('powershell'));
  assert.equal(out(sh, 'Get-ChildItem Documents'), '\n\n    Directory: C:\\Users\\avery\\Documents\n\n\nMode                 LastWriteTime         Length Name\n----                 -------------         ------ ----\nd-----         10/9/2026   9:12 AM                Old\n-a----         10/9/2026   8:00 AM             12 notes.txt\n-a----         10/8/2026   4:31 PM          12288 report.docx\n-ar---         10/9/2026   9:12 AM              1 ro.txt\n');
  assert.match(out(sh, 'gci Documents -Force'), /-a-h--         10\/9\/2026   9:12 AM              1 hidden\.ini/);
  assert.match(out(sh, 'dir Documents -Recurse'), /Directory: C:\\Users\\avery\\Documents\\Old/);
  assert.equal(out(sh, 'ls Documents -Filter *.txt -Name'), 'notes.txt\nro.txt');
  assert.equal(out(sh, 'gci -Rec -Filter *.txt -N Documents'), 'notes.txt\nro.txt\nOld\\keep.txt');
  assert.match(out(sh, 'Get-ChildItem -F x'), /Parameter cannot be processed because the parameter name 'F' is ambiguous\. Possible matches include: -Filter -Force -File\./);
  assert.match(out(sh, 'Get-ChildItem C:\\nope'), /^Get-ChildItem : Cannot find path 'C:\\nope' because it does not exist\.\nAt line:1 char:1\n\+ Get-ChildItem C:\\nope\n\+ ~{21}\n    \+ CategoryInfo          : ObjectNotFound: \(C:\\nope:String\) \[Get-ChildItem\], ItemNotFoundException\n    \+ FullyQualifiedErrorId : PathNotFound,Microsoft\.PowerShell\.Commands\.GetChildItemCommand$/);
  assert.equal(out(sh, 'Get-Content Documents\\notes.txt -TotalCount 1'), 'hello');
  assert.equal(out(sh, 'cat Documents\\notes.txt -Tail 1'), 'world');
  run(sh, 'Copy-Item -Path Documents\\notes.txt -Destination copy.txt');
  assert.ok(sh.fs['C:\\Users\\avery\\copy.txt']);
  run(sh, 'Copy-Item Documents C:\\Docs2');
  assert.deepEqual(Object.keys(sh.fs).filter((k) => k.startsWith('C:\\Docs2')), ['C:\\Docs2'], 'a folder without -Recurse copies empty');
  run(sh, 'Copy-Item Documents C:\\Docs3 -Recurse');
  assert.ok(sh.fs['C:\\Docs3\\Old\\keep.txt']);
  run(sh, 'Move-Item copy.txt Documents\\moved.txt');
  assert.ok(sh.fs['C:\\Users\\avery\\Documents\\moved.txt'] && !sh.fs['C:\\Users\\avery\\copy.txt']);
  assert.match(out(sh, 'Remove-Item Documents\\ro.txt'), /You do not have sufficient access rights to perform this operation\./);
  run(sh, 'Remove-Item Documents\\ro.txt -Force');
  assert.ok(!sh.fs['C:\\Users\\avery\\Documents\\ro.txt']);
  assert.match(out(sh, 'Remove-Item C:\\Docs3'), /has children and the Recurse parameter was not specified/);
  assert.match(sh.prompt(), /^\[Y\] Yes  \[A\] Yes to All  \[N\] No/);
  run(sh, 'N');
  assert.ok(sh.fs['C:\\Docs3']);
  run(sh, 'rm C:\\Docs3 -Recurse');
  assert.ok(!sh.fs['C:\\Docs3']);
  assert.match(out(sh, 'New-Item -Path C:\\Reports -ItemType Directory'), /d-----         10\/9\/2026   9:12 AM                Reports/);
  assert.match(out(sh, 'mkdir C:\\Reports'), /An item with the specified name C:\\Reports already exists\./);
  assert.equal(out(sh, 'Get-Location'), '\nPath\n----\nC:\\Users\\avery\n');
  run(sh, 'cd C:\\Reports');
  assert.equal(sh.prompt(), 'PS C:\\Reports> ');
  run(sh, 'D:');
  assert.equal(sh.cwd, 'D:\\');
  assert.match(out(sh, 'cd Q:'), /Cannot find drive\. A drive with the name 'Q' does not exist\./);
});

test('PowerShell services, processes, network cmdlets and native tools', () => {
  const sh = createShell(winCase('powershell'));
  assert.equal(out(sh, 'Get-Service'), '\nStatus   Name               DisplayName\n------   ----               -----------\nStopped  RemoteRegistry     Remote Registry\nRunning  Spooler            Print Spooler\nStopped  wuauserv           Windows Update\n');
  assert.equal(out(sh, 'Get-Service -DisplayName "Print*"').split('\n').length, 5);
  assert.match(out(sh, 'gsv nope'), /^Get-Service : Cannot find any service with service name 'nope'\./);
  assert.match(out(sh, 'Stop-Service Spooler'), /^Stop-Service : Service 'Print Spooler \(Spooler\)' cannot be stopped due to the following error: Cannot open Spooler service on computer '\.'\./);
  assert.match(out(sh, 'Start-Process powershell -Verb RunAs'), /User Account Control/);
  assert.equal(sh.admin, true);
  run(sh, 'Stop-Service -Name Spooler');
  assert.equal(sh.state.services.Spooler.status, 'Stopped');
  run(sh, 'Start-Service Spooler');
  run(sh, 'Restart-Service Spooler');
  assert.equal(sh.state.services.Spooler.status, 'Running');
  assert.match(out(sh, 'Start-Service RemoteRegistry'), /cannot be started due to the following error: Cannot start service RemoteRegistry on computer '\.'\./);
  const procs = out(sh, 'Get-Process').split('\n');
  assert.equal(procs[1], 'Handles  NPM(K)    PM(K)      WS(K)     CPU(s)     Id  SI ProcessName');
  assert.match(procs[4], /^    245      15     6004      18012       0\.31   4120   1 notepad$/);
  assert.match(out(sh, 'Get-Process -Name nope'), /Cannot find a process with the name "nope"\. Verify the process name and call the cmdlet again\./);
  assert.match(out(sh, 'Get-Process -Id 4120'), /notepad$/m);
  run(sh, 'Stop-Process -Name notepad');
  assert.equal(sh.state.processes[4120], undefined);
  assert.match(out(sh, 'Stop-Process -Id 999'), /Cannot find a process with the process identifier 999\./);
  assert.equal(out(sh, 'kill 5200 -Force'), '');
  assert.equal(sh.state.processes[5200], undefined);
  assert.match(out(sh, 'Get-NetIPConfiguration'), /^\nInterfaceAlias       : Ethernet\nInterfaceIndex       : 12\nInterfaceDescription : Ethernet Adapter\nNetProfile\.Name      : Unidentified network\nIPv4Address          : 169\.254\.73\.18\n/);
  assert.match(out(sh, 'ipconfig /renew'), /IPv4 Address/);
  run(sh, 'ipconfig /flushdns');
  assert.equal(out(sh, 'Test-NetConnection intranet.corp.example'), '\nComputerName           : intranet.corp.example\nRemoteAddress          : 192.168.10.90\nInterfaceAlias         : Ethernet\nSourceAddress          : 192.168.10.44\nPingSucceeded          : True\nPingReplyDetails (RTT) : 3 ms\n');
  assert.equal(out(sh, 'Test-NetConnection intranet.corp.example -Port 443'), '\nComputerName     : intranet.corp.example\nRemoteAddress    : 192.168.10.90\nRemotePort       : 443\nInterfaceAlias   : Ethernet\nSourceAddress    : 192.168.10.44\nTcpTestSucceeded : True\n');
  assert.match(out(sh, 'Test-NetConnection old.corp.example -Port 3389'), /^WARNING: TCP connect to \(192\.168\.10\.80 : 3389\) failed\nWARNING: Ping to 192\.168\.10\.80 failed with status: TimedOut\n/);
  assert.match(out(sh, 'Test-NetConnection nope.example'), /^WARNING: Name resolution of nope\.example failed/);
  assert.match(out(sh, 'sfc /scannow'), /unable to fix some of them/);
  assert.match(out(sh, 'Get-Service -?'), /^\nNAME\n    Get-Service\n\nSYNOPSIS\n/);
  assert.match(out(sh, 'help'), /Cmdlets available in this session:/);
  assert.equal(sh.run('cls').clear, true);
});

// ---------------- scripted responses ----------------
test('scripted responses override built-ins, match by state and can set state', () => {
  const sh = createShell(winCase('windows-cmd', {
    responses: {
      'ping printer01': [{ when: { key: 'printer.on', op: 'truthy' }, out: 'Reply from printer01' }, { out: 'Request timed out.', exit: 1 }],
      'curl https://intranet.corp.example': 'HTTP/1.1 200 OK',
      'Start-Printer': { out: 'Printer powered on.', set: { 'printer.on': true } },
    },
  }));
  const down = run(sh, 'PING   Printer01');
  assert.deepEqual([down.out, down.exit], ['Request timed out.', 1]);
  assert.equal(out(sh, 'curl https://intranet.corp.example'), 'HTTP/1.1 200 OK');
  assert.equal(out(sh, 'start-printer'), 'Printer powered on.');
  assert.equal(out(sh, 'ping printer01'), 'Reply from printer01');
  const lx = createShell(linuxCase({ responses: { 'journalctl -u appd': 'Oct 09 09:01:00 web01 appd[812]: cannot open config' } }));
  assert.match(out(lx, 'journalctl -u appd'), /cannot open config/);
  assert.equal(out(lx, 'Journalctl -u appd'), 'Journalctl: command not found', 'Linux scripted lines are case-sensitive');
});

// ---------------- goals, traps, scoring, history ----------------
test('goals and traps over fs, state and ran, with scoring and change reports', () => {
  const caseDef = linuxCase({
    goals: [
      { id: 'exec', check: { path: '/home/jordan/run.sh', field: 'mode', op: 'hasBits', value: '100' } },
      { id: 'listed', check: { ran: '^ls -l', ok: true } },
      { id: 'svc', check: { all: [{ key: 'services.nginx.active', op: 'eq', value: 'active' }, { not: { key: 'services.nginx.enabled', op: 'falsy' } }] } },
      { id: 'gone', check: { path: '/home/jordan/Docs/a.log', op: 'falsy' } },
    ],
    traps: [
      { id: 'world', critical: true, check: { path: '/home/jordan/run.sh', field: 'mode', op: 'hasBits', value: '002' } },
      { id: 'sudo-rm', check: { ran: '^sudo rm -rf', ok: false } },
    ],
  });
  const sh = createShell(caseDef);
  assert.equal(sh.check().score, 0);
  assert.deepEqual(run(sh, 'ls -l nope').goalsChanged, [], 'failed ls does not count with ok: true');
  assert.deepEqual(run(sh, 'ls -l').goalsChanged, ['listed']);
  assert.deepEqual(run(sh, 'chmod 777 run.sh'), { out: '', exit: 0, goalsChanged: ['exec'], trapsHit: ['world'] });
  assert.equal(sh.check().score, 25, 'two goals minus one trap = 25, capped at 60');
  run(sh, 'chmod 750 run.sh');
  assert.equal(sh.check().traps.find((t) => t.id === 'world').hit, false, 'state traps clear when the state is fixed');
  run(sh, 'sudo systemctl enable --now nginx');
  assert.deepEqual(run(sh, 'rm Docs/a.log').goalsChanged, ['gone']);
  assert.equal(sh.check().score, 100);
  assert.deepEqual(run(sh, 'sudo rm -rf /tmp/nothing').trapsHit, ['sudo-rm']);
  assert.equal(sh.check().score, 75);
  const result = sh.check();
  assert.deepEqual(Object.keys(result.goals[0]).sort(), ['expect', 'id', 'pass', 'text', 'why']);
  assert.deepEqual(result.traps[0], { id: 'world', hit: false, message: undefined, why: undefined, critical: true });
  const win = createShell(winCase('windows-cmd', { goals: [{ id: 'g', check: { ran: 'SFC /SCANNOW' } }, { id: 'admin', check: { key: 'session.admin' } }] }));
  run(win, 'sfc /scannow');
  assert.equal(win.check().goals[0].pass, true, 'Windows ran patterns are case-insensitive');
  assert.deepEqual(win.elevate().goalsChanged, ['admin']);
  assert.equal(createShell(linuxCase()).elevate().exit, 1);
});

test('ranSequence requires distinct successful commands in order and accepts gaps', () => {
  const sh = createShell(linuxCase({ goals: [
    { id: 'ordered', check: { ranSequence: ['^ls -l$', '^chmod 700 run\\.sh$'] } },
    { id: 'reversed', check: { ranSequence: ['^chmod 700 run\\.sh$', '^ls -l$'] } },
    { id: 'twice', check: { ranSequence: ['^ls -l$', '^ls -l$'], flags: 'g' } },
    { id: 'bad-pattern', check: { ranSequence: ['['] } },
    { id: 'empty', check: { ranSequence: [] } },
  ] }));
  const pass = (id) => sh.check().goals.find((goal) => goal.id === id).pass;
  run(sh, 'ls -l nope');
  run(sh, 'chmod 700 run.sh');
  assert.equal(pass('ordered'), false, 'failed first command does not count');
  run(sh, 'ls -l');
  assert.equal(pass('ordered'), false, 'earlier chmod does not satisfy a later sequence');
  assert.equal(pass('reversed'), true);
  assert.equal(pass('twice'), false, 'one history entry cannot match two patterns');
  run(sh, 'pwd');
  run(sh, 'ls -l');
  run(sh, 'chmod 700 run.sh');
  assert.equal(pass('ordered'), true);
  assert.equal(pass('twice'), true, 'global regex state resets for each history entry');
  assert.equal(pass('bad-pattern'), false);
  assert.equal(pass('empty'), false);
});

test('ranSequence can scope matches to diskpart and uses Windows case folding', () => {
  const sh = createShell(winCase('windows-cmd', { goals: [
    { id: 'scoped', check: { ranSequence: ['^LIST DISK$', '^SELECT DISK 1$'], within: 'diskpart' } },
    { id: 'wrong-scope', check: { ranSequence: ['^DISKPART$', '^LIST DISK$'], within: 'diskpart' } },
  ] }));
  sh.elevate();
  run(sh, 'diskpart');
  run(sh, 'list disk');
  run(sh, 'select disk 1');
  assert.equal(sh.check().goals[0].pass, true);
  assert.equal(sh.check().goals[1].pass, false, 'diskpart launcher ran outside diskpart mode');
});

test('shell-08 rejects clean before list disk and accepts both safe paths', () => {
  const c = shellCases.find((item) => item.id === 'shell-08');
  const replay = (steps) => {
    const sh = createShell(c);
    sh.elevate();
    for (const line of steps) run(sh, line);
    return sh.check();
  };
  const finish = ['create partition primary', 'format fs=fat32 quick', 'assign'];
  const unsafe = replay(['diskpart', 'select disk 2', 'clean', ...finish, 'list disk']);
  assert.ok(unsafe.score < 80, `unsafe score ${unsafe.score}`);
  assert.equal(unsafe.goals.find((goal) => goal.id === 'clean-usb').pass, false);
  const trap = unsafe.traps.find((item) => item.id === 'cleaned-without-listing');
  assert.equal(trap.hit, true);
  assert.match(trap.message, /verify the asterisk with list disk or use detail disk before clean/i);

  const reference = createShell(c);
  for (const step of c.solution) applyStep(reference, step);
  assert.equal(reference.check().score, 100);
  assert.equal(reference.check().traps.some((item) => item.hit), false);

  const withDetail = replay(['diskpart', 'list disk', 'select disk 2', 'detail disk', 'clean', ...finish]);
  assert.equal(withDetail.score, 100);
  assert.equal(withDetail.traps.some((item) => item.hit), false);

  const unsafeRuns = {
    'select then clean without confirming focus': ['diskpart', 'list disk', 'select disk 2', 'clean', ...finish],
    'confirmed a different selection': ['diskpart', 'list disk', 'select disk 2', 'select disk 1', 'list disk', 'select disk 2', 'clean', ...finish],
    're-selected after confirming': ['diskpart', 'list disk', 'select disk 2', 'list disk', 'select disk 2', 'clean', ...finish],
  };
  for (const [name, steps] of Object.entries(unsafeRuns)) {
    const result = replay(steps);
    assert.ok(result.score < 80, `${name}: score ${result.score}`);
    assert.equal(result.traps.find((item) => item.id === 'cleaned-without-listing').hit, true, name);
  }
  const safeRuns = {
    'abbreviated sel and det': ['diskpart', 'list disk', 'sel disk 2', 'det disk', 'clean', ...finish],
    'wrong selection corrected and confirmed': ['diskpart', 'list disk', 'select disk 1', 'select disk 2', 'list disk', 'clean', ...finish],
    'clean repeated after confirming': ['diskpart', 'list disk', 'select disk 2', 'list disk', 'clean', 'clean', ...finish],
  };
  for (const [name, steps] of Object.entries(safeRuns)) assert.equal(replay(steps).score, 100, name);

  const demo = createShell(c);
  const steps = c.trapDemo;
  const tail = steps.slice(steps.findLastIndex((step) => step.do === 'diskpart'));
  assert.deepEqual(tail.map((step) => step.do), ['diskpart', 'list disk', 'select disk 2', 'clean'], 'trapDemo ends with select then clean without a focus check');
  for (const step of steps) applyStep(demo, step);
  assert.ok(demo.check().score < 80);
});

test('diskpart detail disk shows the disk with focus and its volumes', () => {
  const sh = createShell(shellCases.find((item) => item.id === 'shell-08'));
  sh.elevate();
  run(sh, 'diskpart');
  const none = run(sh, 'detail disk');
  assert.equal(none.exit, 1);
  assert.match(none.out, /There is no disk selected/);
  run(sh, 'select disk 2');
  const usb = run(sh, 'detail disk');
  assert.equal(usb.exit, 0);
  assert.match(usb.out, /Type\s+: USB/);
  assert.match(usb.out, /Boot Disk\s+: No/);
  assert.match(usb.out, /Volume \d+\s+E\s+USB\s+exFAT\s+Removable/);
  assert.doesNotMatch(usb.out, /Backups|Windows/);
  run(sh, 'clean');
  assert.match(out(sh, 'det disk'), /There are no volumes\./);
  assert.equal(run(sh, 'detail').exit, 1);
});

test('ran records the working directory and lists binds a long listing to one file', () => {
  const sh = createShell(linuxCase({ goals: [
    { id: 'in-home', check: { ran: '^ls -l$', cwd: '/home/jordan', ok: true } },
    { id: 'in-docs', check: { ran: '^ls -l$', cwd: '/home/jordan/Docs', ok: true } },
    { id: 'lists-run', check: { ran: '^ls', lists: '/home/jordan/run.sh', ok: true } },
  ] }));
  const pass = (id) => sh.check().goals.find((goal) => goal.id === id).pass;
  run(sh, 'cd Docs');
  run(sh, 'ls -l');
  assert.equal(pass('in-docs'), true);
  assert.equal(pass('in-home'), false, 'cwd is the directory when the command ran, not now');
  assert.equal(pass('lists-run'), false, 'bare ls -l in Docs does not show run.sh');
  run(sh, 'cd ..');
  assert.equal(pass('in-home'), false, 'changing directory later does not rewrite history');
  for (const line of ['ls run.sh', 'ls -ld /home', 'ls -l /h*', 'ls -l / | cat run.sh', 'ls -l nope run.sh']) {
    run(sh, line);
    assert.equal(pass('lists-run'), false, line);
  }
  run(sh, 'ls -l');
  assert.equal(pass('in-home'), true);
  assert.equal(pass('lists-run'), true, 'bare ls -l in the file directory shows it');

  const accepts = (lines, cwd = '/home/jordan') => {
    const s = createShell(linuxCase({ cwd, goals: [{ id: 'g', check: { ran: '^(sudo\\s+)?ls', lists: '/home/jordan/run.sh', ok: true } }] }));
    for (const line of lines) run(s, line);
    return s.check().goals[0].pass;
  };
  for (const line of ['ls -l run.sh', 'ls run.sh -l', 'ls -la ~', 'ls -l ./run.sh', 'ls -l *.sh', 'ls -lh /home/jordan/', 'ls -ld run.sh', 'sudo ls -l run.sh', 'ls -l /home/jor*']) {
    assert.equal(accepts([line]), true, line);
  }
  assert.equal(accepts(['ls -l ..'], '/home/jordan/Docs'), true, 'relative operands resolve from the recorded cwd');
  assert.equal(accepts(['ls -l'], '/tmp'), false);
  assert.equal(accepts(['ls -l run.sh'], '/home/jordan/Docs'), false, 'a failed listing does not count');
  assert.deepEqual(createShell(linuxCase()).history, []);
  const win = createShell(winCase('windows-cmd', { goals: [{ id: 'g', check: { ran: '^dir$', lists: 'C:\\Users\\avery' } }] }));
  run(win, 'dir');
  assert.equal(win.check().goals[0].pass, false, 'lists is Linux ls only');
});

test('ranSequence resetOn, resetTo and every', () => {
  const seq = (extra) => ({ ranSequence: ['^pwd$', '^cd Docs$', '^ls -l$', '^chmod 700 \\.\\./run\\.sh$'], resetOn: '^cd\\b', every: '^chmod\\b', ...extra });
  const replay = (lines) => {
    const sh = createShell(linuxCase({ goals: [{ id: 'to0', check: seq({}) }, { id: 'to1', check: seq({ resetTo: 1 }) }] }));
    for (const line of lines) run(sh, line);
    const [to0, to1] = sh.check().goals.map((goal) => goal.pass);
    return { to0, to1 };
  };
  assert.deepEqual(replay(['pwd', 'cd Docs', 'ls -l', 'chmod 700 ../run.sh']), { to0: true, to1: true });
  assert.deepEqual(replay(['pwd', 'cd Docs', 'chmod 700 ../run.sh']), { to0: false, to1: false }, 'every line must complete the sequence');
  assert.deepEqual(replay(['pwd', 'cd Docs', 'cd ..', 'cd Docs', 'ls -l', 'chmod 700 ../run.sh']), { to0: false, to1: true }, 'resetTo keeps earlier steps and retries the reset line');
  assert.deepEqual(replay(['pwd', 'cd Docs', 'ls -l', 'cd .', 'chmod 700 ../run.sh']), { to0: false, to1: false }, 'a reset after the check needs the check again');
  assert.deepEqual(replay(['pwd', 'cd Docs', 'ls -l', 'chmod 700 ../run.sh', 'chmod 700 ../run.sh']), { to0: true, to1: true }, 'the last step may repeat until a reset');
  assert.deepEqual(replay(['pwd', 'cd Docs', 'ls -l', 'chmod 700 ../run.sh', 'cd .', 'chmod 700 ../run.sh']), { to0: false, to1: false });
  assert.deepEqual(replay(['pwd', 'cd Docs', 'ls -l']), { to0: false, to1: false }, 'every needs at least one completed match');
  assert.deepEqual(replay(['pwd', 'cd Docs', 'ls -l', 'chmod 999 ../run.sh', 'chmod 700 ../run.sh']), { to0: true, to1: true }, 'failed commands are ignored');
});

test('snapshot, restore and reset', () => {
  const sh = createShell(linuxCase({ goals: [{ id: 'x', check: { path: '/home/jordan/run.sh', field: 'mode', op: 'eq', value: '700' } }] }));
  run(sh, 'chmod 700 run.sh');
  run(sh, 'cd Docs');
  const snap = JSON.parse(JSON.stringify(sh.snapshot()));
  run(sh, 'chmod 600 ../run.sh');
  assert.deepEqual(sh.reset(), { ok: true, msg: 'Reset to the start of the case.', goalsChanged: [], trapsHit: [] });
  assert.equal(sh.cwd, '/home/jordan');
  assert.equal(sh.fs['/home/jordan/run.sh'].mode, '644');
  assert.deepEqual(sh.history, []);
  const restored = sh.restore(snap);
  assert.deepEqual([restored.ok, restored.goalsChanged], [true, ['x']]);
  assert.equal(sh.cwd, '/home/jordan/Docs');
  assert.deepEqual(sh.snapshot(), snap);
  assert.equal(sh.restore({}).ok, false);
  assert.equal(sh.restore(null).ok, false);
  run(sh, 'sudo -i');
  const mid = sh.snapshot();
  run(sh, 'exit');
  sh.restore(mid);
  assert.equal(sh.user, 'root');
});

// ---------------- Tab completion ----------------
test('Tab completion of commands and paths', () => {
  const lx = createShell(linuxCase());
  assert.deepEqual(lx.complete('chm'), { line: 'chmod ', matches: ['chmod'] });
  assert.deepEqual(lx.complete('ch'), { line: 'ch', matches: ['chgrp', 'chmod', 'chown'] });
  assert.deepEqual(lx.complete('sys'), { line: 'systemctl ', matches: ['systemctl'] });
  assert.deepEqual(lx.complete('cat no'), { line: 'cat notes.txt ', matches: ['notes.txt'] });
  assert.deepEqual(lx.complete('cd D'), { line: 'cd Docs/', matches: ['Docs/'] });
  assert.deepEqual(lx.complete('cat Docs/'), { line: 'cat Docs/a.log ', matches: ['Docs/a.log'] });
  assert.deepEqual(lx.complete('cat .h'), { line: 'cat .hidden ', matches: ['.hidden'] });
  assert.deepEqual(lx.complete('ls /var/l'), { line: 'ls /var/log/', matches: ['/var/log/'] });
  assert.deepEqual(lx.complete('ls d'), { line: 'ls d', matches: [] }, 'Linux completion is case-sensitive');
  assert.deepEqual(lx.complete('ls /srv/private/'), { line: 'ls /srv/private/', matches: [] });
  assert.deepEqual(lx.complete('ls ~/r'), { line: 'ls ~/run.sh ', matches: ['~/run.sh'] });
  const cmd = createShell(winCase());
  assert.deepEqual(cmd.complete('ipc'), { line: 'ipconfig ', matches: ['ipconfig'] });
  assert.deepEqual(cmd.complete('cd doc'), { line: 'cd Documents\\', matches: ['Documents\\'] });
  assert.deepEqual(cmd.complete('type documents\\N'), { line: 'type documents\\notes.txt ', matches: ['documents\\notes.txt'] });
  assert.deepEqual(cmd.complete('cd C:\\Program'), { line: 'cd "C:\\Program Files\\"', matches: ['"C:\\Program Files\\"'] });
  const ps = createShell(winCase('powershell'));
  assert.deepEqual(ps.complete('get-se'), { line: 'Get-Service ', matches: ['Get-Service'] });
  assert.deepEqual(ps.complete('Get-'), { line: 'Get-', matches: ['Get-ChildItem', 'Get-Content', 'Get-Location', 'Get-NetIPConfiguration', 'Get-Process', 'Get-Service'] });
  run(lx, 'sudo apt remove tree');
  assert.deepEqual(lx.complete('x'), { line: 'x', matches: [] });
});

// ---------------- seed content ----------------
test('seed cases: start below 80, solution reaches 100, traps reachable', () => {
  assert.ok(shellCases.length >= 2);
  for (const caseDef of shellCases) {
    const sh = createShell(caseDef);
    assert.ok(sh.check().score < 80, `${caseDef.id} starts below pass`);
    for (const step of caseDef.solution) {
      const r = applyStep(sh, step);
      assert.doesNotMatch(r.out, /command not found|is not recognized/, `${caseDef.id}: ${JSON.stringify(step.do)}`);
      assert.equal(typeof step.explain, 'string');
    }
    const end = sh.check();
    assert.equal(end.score, 100, `${caseDef.id} solution scores 100`);
    assert.ok(end.goals.every((g) => g.pass));
    for (const trap of caseDef.traps) {
      const demo = createShell(caseDef);
      for (const step of caseDef.trapDemo) applyStep(demo, step);
      assert.ok(demo.check().traps.find((t) => t.id === trap.id).hit, `${caseDef.id} trap ${trap.id} reachable`);
    }
    for (const goal of caseDef.goals) {
      assert.equal(goal.hints.length, 3);
      for (const key of goal.src) assert.ok(sources[key], `${caseDef.id} source ${key}`);
    }
  }
  assert.throws(() => applyStep(createShell(shellCases[0]), { do: 42 }), TypeError);
});

test('seed case details: shell-01 trap, shell-05 needs elevation', () => {
  const s01 = shellCases.find((c) => c.id === 'shell-01');
  const sh = createShell(s01);
  assert.equal(run(sh, './backup.sh').out, 'bash: ./backup.sh: Permission denied');
  assert.equal(out(sh, 'ls -l backup.sh'), '-rw-r--r-- 1 jordan jordan 175 Oct  8 17:42 backup.sh');
  assert.deepEqual(run(sh, 'chmod 777 backup.sh').trapsHit, ['world-writable']);
  run(sh, './backup.sh');
  assert.equal(sh.check().score, 60, 'critical trap caps a full run at 60');
  run(sh, 'chmod 750 backup.sh');
  assert.equal(sh.check().score, 100);
  const s05 = shellCases.find((c) => c.id === 'shell-05');
  const win = createShell(s05);
  for (const line of ['sfc /scannow', 'DISM /Online /Cleanup-Image /RestoreHealth']) run(win, line);
  assert.equal(win.check().score, 0, 'nothing happens without elevation');
  win.elevate();
  run(win, 'DISM /Online /Cleanup-Image /RestoreHealth');
  run(win, 'sfc /scannow');
  assert.equal(win.check().score, 100, 'DISM first, then SFC, also solves it');
  for (const text of JSON.stringify(shellCases).match(/[\u2013\u2014]/g) ?? []) assert.fail(`dash found: ${text}`);
  assert.ok(Object.values(sources).every(([title, url]) => title && /^https:\/\//.test(url)));
  assert.ok(primer.sections.length >= 2 && primer.src.every((k) => sources[k]));
  assert.ok(Object.keys(terms).length >= 3);
});

if (failures.length) {
  console.error(`pro-aplus-shell: ${failures.length} failed, ${count} passed`);
  process.exit(1);
}
console.log(`pro-aplus-shell: ${count} tests passed`);

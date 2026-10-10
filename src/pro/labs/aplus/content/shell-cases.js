// Command Line Fixer (engine: shell.js). Eight cases: shell-01 to shell-04 are Linux bash (Ubuntu 24.04),
// shell-05 to shell-08 are the Windows 11 Command Prompt. The exported array is ordered by level.
// Solution and trapDemo steps: `do` is a command line, or { action: 'elevate' } for "Run as administrator"
// (replay with applyStep from shell.js). trapDemo is one step list per case that hits every trap of the case.
// Primer section `body`: a string, or an array of paragraph strings and tables
// (a table is an array of rows of cell strings; first row = header).

export const sources = {
  chmod: ['chmod(1), Linux manual page, man7.org', 'https://man7.org/linux/man-pages/man1/chmod.1.html'],
  ls: ['ls(1), Linux manual page, man7.org', 'https://man7.org/linux/man-pages/man1/ls.1.html'],
  sfcSupport: ['Use the System File Checker tool to repair missing or corrupted system files, Microsoft Support', 'https://support.microsoft.com/en-us/topic/use-the-system-file-checker-tool-to-repair-missing-or-corrupted-system-files-79aa86cb-ca52-166a-92a3-966e85d4094e'],
  sfcRef: ['Description of System File Checker (Sfc.exe), Microsoft Learn', 'https://learn.microsoft.com/en-us/troubleshoot/windows-server/installing-updates-features-roles/system-file-checker'],
  dismRepair: ['Repair a Windows Image, Microsoft Learn', 'https://learn.microsoft.com/en-us/windows-hardware/manufacture/desktop/repair-a-windows-image'],
  df: ['df(1), Linux manual page, man7.org', 'https://man7.org/linux/man-pages/man1/df.1.html'],
  du: ['du(1), Linux manual page, man7.org', 'https://man7.org/linux/man-pages/man1/du.1.html'],
  rm: ['rm(1), Linux manual page, man7.org', 'https://man7.org/linux/man-pages/man1/rm.1.html'],
  truncate: ['truncate(1), Linux manual page, man7.org', 'https://man7.org/linux/man-pages/man1/truncate.1.html'],
  unlink: ['unlink(2), Linux manual page, man7.org', 'https://man7.org/linux/man-pages/man2/unlink.2.html'],
  errno: ['errno(3), Linux manual page, man7.org', 'https://man7.org/linux/man-pages/man3/errno.3.html'],
  logrotate: ['logrotate(8), Ubuntu 24.04 manual page', 'https://manpages.ubuntu.com/manpages/noble/man8/logrotate.8.html'],
  apt: ['apt(8), Ubuntu 24.04 manual page', 'https://manpages.ubuntu.com/manpages/noble/man8/apt.8.html'],
  sudo: ['sudo(8), Ubuntu 24.04 manual page', 'https://manpages.ubuntu.com/manpages/noble/man8/sudo.8.html'],
  nginxUbuntu: ['How to install nginx, Ubuntu Server documentation', 'https://ubuntu.com/server/docs/how-to/web-services/install-nginx/'],
  systemctl: ['systemctl(1), Linux manual page, man7.org', 'https://man7.org/linux/man-pages/man1/systemctl.1.html'],
  chown: ['chown(1), Linux manual page, man7.org', 'https://man7.org/linux/man-pages/man1/chown.1.html'],
  chown2: ['chown(2), Linux manual page, man7.org', 'https://man7.org/linux/man-pages/man2/chown.2.html'],
  grep: ['grep(1), Linux manual page, man7.org', 'https://man7.org/linux/man-pages/man1/grep.1.html'],
  ipconfig: ['ipconfig, Windows Commands, Microsoft Learn', 'https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/ipconfig'],
  nslookup: ['nslookup, Windows Commands, Microsoft Learn', 'https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup'],
  apipa: ['How to use automatic TCP/IP addressing without a DHCP server, Microsoft Learn', 'https://learn.microsoft.com/en-us/windows-server/troubleshoot/how-to-use-automatic-tcpip-addressing-without-a-dh'],
  netUse: ['Net use, Microsoft Learn (Windows Server command reference)', 'https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2012-r2-and-2012/gg651155(v=ws.11)'],
  robocopy: ['robocopy, Windows Commands, Microsoft Learn', 'https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/robocopy'],
  diskpart: ['diskpart, Windows Commands, Microsoft Learn', 'https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/diskpart'],
  dpClean: ['clean (diskpart), Windows Commands, Microsoft Learn', 'https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/clean'],
  dpCreate: ['create partition primary (diskpart), Windows Commands, Microsoft Learn', 'https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/create-partition-primary'],
  dpFormat: ['diskpart, Windows Commands, Microsoft Learn', 'https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/diskpart'],
  dpAssign: ['assign (diskpart), Windows Commands, Microsoft Learn', 'https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/assign'],
  vdsClean: ['IVdsAdvancedDisk::Clean method, Microsoft Learn', 'https://learn.microsoft.com/en-us/windows/win32/api/vds/nf-vds-ivdsadvanceddisk-clean'],
  uefiFat: ['UEFI Specification 2.10, 13.3 File System Format, UEFI Forum', 'https://uefi.org/specs/UEFI/2.10/13_Protocols_Media_Access.html'],
};

export const primer = {
  title: 'Command line refresher',
  sections: [
    { h: 'Reading ls -l on Linux', body: [
      'ls -l prints one line per file. The first 10 characters are the file type (- for a file, d for a directory) and three groups of three permission letters: owner (u), group (g), others (o). r is read, w is write, x is execute (for a directory, x means you may enter it).',
      [['Permission string', 'Owner', 'Group', 'Others'],
        ['-rw-r--r--', 'read, write', 'read', 'read'],
        ['-rwxr--r--', 'read, write, run', 'read', 'read'],
        ['-rwxr-x---', 'read, write, run', 'read, run', 'nothing']],
      'bash: ./script.sh: Permission denied usually means the x bit is missing for you. Check with ls -l before changing anything.',
    ] },
    { h: 'chmod: symbolic and octal', body: [
      'Symbolic mode changes only what you name: chmod u+x file adds execute for the owner; chmod go-w file removes write from group and others. Octal mode sets all three triads at once: each digit is read (4) + write (2) + execute (1).',
      [['Octal', 'String', 'Typical use'],
        ['644', 'rw-r--r--', 'Ordinary file'],
        ['640', 'rw-r-----', 'Config file a service group must read'],
        ['750', 'rwxr-x---', 'Script for the owner and one team'],
        ['755', 'rwxr-xr-x', 'Program or directory everyone may use'],
        ['777', 'rwxrwxrwx', 'Never on a server: anyone may change it']],
      'Only the owner of a file (or root) may change its mode. Give the least permission that solves the problem.',
    ] },
    { h: 'Owner, group and the 640 pattern', body: [
      'Every Linux file has an owner and a group. A service usually runs as its own account, so it reads a file through the owner triad, the group triad or the others triad, in that order: the first triad that matches the account is the only one that counts.',
      [['Command', 'What it does', 'Who may run it'],
        ['chown root:appgrp file', 'Owner root, group appgrp', 'root (use sudo)'],
        ['chown :appgrp file', 'Changes only the group (like chgrp)', 'root, or the owner if the owner is in appgrp'],
        ['chmod 640 file', 'Owner rw, group r, others nothing', 'The owner or root'],
        ['ls -l file', 'Shows mode, owner and group', 'Anyone who can reach the directory']],
      'For a config file that holds a password: keep root as the owner (only an admin can change it), put the service group on it, and use 640 so the service can read it and nobody else can. chmod 644 shows the password to every account; chmod 777 also lets every account rewrite it.',
    ] },
    { h: 'When a Linux disk is full', body: [
      'Programs report "No space left on device" (the ENOSPC error) when a file system has no free blocks. df -h shows each mounted file system with Size, Used, Avail and Use%; du -sh DIR adds up the space used under a directory, so you can walk down from the full mount point to the culprit.',
      [['Command', 'Answers'],
        ['df -h', 'Which file system is full?'],
        ['du -h /var/log', 'Which directory under /var/log is big? (one line per directory)'],
        ['du -sh /var/log/*', 'One total for each item in /var/log'],
        ['ls -lh /var/log/app', 'Which file in that directory is big?'],
        ['sudo rm /var/log/app/app.log.1', 'Deletes an old rotated log'],
        ['sudo truncate -s 0 /var/log/app/app.log', 'Empties a log a program still has open, without deleting it']],
      'With rename-and-create rotation, logrotate renames app.log to app.log.1 and creates a new app.log. The program must reopen its log to switch to the new file; otherwise it may keep writing to app.log.1. Check that a rotated copy is no longer open and that retention rules allow deletion before removing it. An unlinked open file keeps its disk space until the last handle closes. For a live log that must be emptied in place, use truncate -s 0 after checking the application\'s logging requirements.',
      'Never delete whole system directories such as /var/log to make room. Other services expect them and fail when they are gone.',
    ] },
    { h: 'Packages and services on Ubuntu', body: [
      'apt update downloads the package lists from every configured source; apt install then installs a package and its dependencies. Both change the system, so they run with sudo. On a freshly deployed server the lists can be empty, and apt install answers "Unable to locate package" until you run apt update.',
      [['Command', 'Effect'],
        ['sudo apt update', 'Refresh the list of available packages'],
        ['sudo apt install -y nginx', 'Install nginx and its dependencies without asking'],
        ['systemctl status nginx', 'Show Loaded (enabled or disabled at boot) and Active (running or not)'],
        ['systemctl is-enabled nginx', 'Print enabled or disabled'],
        ['sudo systemctl enable --now nginx', 'Start at every boot and start now'],
        ['sudo systemctl restart nginx', 'Stop and start it again, for example after a config change']],
      'On Ubuntu, installing a service package such as nginx also starts it and enables it at boot. systemctl enable on its own does not start a unit; add --now, or run start as well. Always finish with systemctl status: "enabled" in the Loaded line means it starts at boot, "active (running)" in the Active line means it runs now.',
    ] },
    { h: 'Repairing Windows system files', body: [
      'sfc /scannow checks every protected Windows file and replaces bad copies from the component store. DISM /Online /Cleanup-Image /RestoreHealth repairs the component store itself, using Windows Update or a /Source you give it. Both need an elevated Command Prompt (Run as administrator).',
      [['SFC result', 'What to do next'],
        ['did not find any integrity violations', 'System files are fine; look elsewhere'],
        ['found corrupt files and successfully repaired them', 'Restart and confirm the symptom is gone'],
        ['found corrupt files but was unable to fix some of them', 'Run DISM RestoreHealth, then run sfc /scannow again'],
        ['could not perform the requested operation', 'Run SFC again from Safe Mode']],
      'Microsoft documents running DISM RestoreHealth and then sfc /scannow. If SFC already ran and could not repair, DISM followed by a second SFC finishes the job.',
    ] },
    { h: 'ipconfig: addresses, leases and the DNS cache', body: [
      [['Command', 'Use it to'],
        ['ipconfig', 'See each adapter\'s IPv4 address, subnet mask and default gateway'],
        ['ipconfig /all', 'Add DHCP Enabled, DHCP Server, lease times and DNS Servers'],
        ['ipconfig /release', 'Give back the DHCP address of the adapters'],
        ['ipconfig /renew', 'Ask the DHCP server for an address again'],
        ['ipconfig /displaydns', 'Show the DNS client resolver cache'],
        ['ipconfig /flushdns', 'Empty the DNS client resolver cache']],
      'An address from 169.254.0.0 to 169.254.255.255 with mask 255.255.0.0 is APIPA: Windows gave itself that address because no DHCP server answered, for example while the DHCP server was down for maintenance. APIPA only reaches the local link, so there is no gateway and no internet. Once the DHCP server is back, ipconfig /release and ipconfig /renew in an elevated prompt get a real lease right away.',
      'Windows answers names from its DNS client resolver cache before it asks a DNS server. When a server moves to a new IP address, a PC can keep the old answer until the record\'s time to live runs out. ipconfig /flushdns empties the cache; nslookup NAME asks the DNS server shown in its Server line directly, so you can compare what the server says with what the PC uses.',
    ] },
    { h: 'Copying with robocopy', body: [
      'Syntax: robocopy SOURCE DESTINATION [files] [options]. The order matters: the first path is read, the second is written. Map a share to a drive letter first with net use Z: \\\\server\\share, or use the UNC path directly.',
      [['Option', 'Meaning', 'Risk'],
        ['/S', 'Copy subdirectories, skip empty ones', 'Low'],
        ['/E', 'Copy subdirectories, including empty ones', 'Low: never deletes'],
        ['/PURGE', 'Delete destination files that are not in the source', 'High'],
        ['/MIR', 'Mirror: /E plus /PURGE', 'High: deletes in the destination'],
        ['/MOV', 'Move files: delete them from the source after copying', 'High: deletes in the source']],
      [['Exit code', 'Meaning'],
        ['0', 'Nothing copied, nothing failed: already up to date'],
        ['1', 'Files copied successfully'],
        ['2', 'Extra files in the destination, nothing copied'],
        ['3', 'Files copied and extra files present, no failure'],
        ['8 or more', 'At least one failure']],
      'For a backup to a folder that also holds older copies, use /E: it adds and updates files and never deletes. /MIR is for an exact mirror you have checked first, and run in the wrong direction it overwrites the source with the old backup and deletes everything newer.',
    ] },
    { h: 'Preparing a drive with diskpart', body: [
      'diskpart acts on the object with focus, so the order is always: list, select, check, then act. It needs an elevated prompt (Run as administrator).',
      [['Step', 'Command', 'Why'],
        ['1', 'list disk', 'Find the disk by its size; removable drives are the small ones'],
        ['2', 'select disk N', 'Give that disk focus'],
        ['3', 'list disk', 'The asterisk at the far left of a disk row marks focus; an asterisk under Gpt only marks GPT partition style.'],
        ['4', 'clean', 'Erase the partition table of the selected disk'],
        ['5', 'create partition primary', 'One partition over the whole disk; focus moves to it'],
        ['6', 'format fs=fat32 quick label=NAME', 'File system the target device can read'],
        ['7', 'assign', 'Give it the next free drive letter'],
        ['8', 'exit', 'Leave diskpart']],
      'clean has no undo and no confirmation. Windows refuses to clean the disk that holds the running system, but it will clean any data disk you select, so the size check in step 1 and the asterisk check in step 3 are the safety net. UEFI firmware must read FAT12, FAT16 and FAT32, which is why firmware update sticks use FAT32.',
    ] },
  ],
  src: ['ls', 'chmod', 'chown', 'df', 'du', 'unlink', 'logrotate', 'apt', 'systemctl', 'nginxUbuntu', 'sfcSupport', 'sfcRef', 'dismRepair', 'ipconfig', 'apipa', 'nslookup', 'robocopy', 'netUse', 'diskpart', 'dpClean', 'vdsClean', 'uefiFat'],
};

export const terms = {
  'execute bit': 'The x permission. Without it for your user, the system will not run a file as a program.',
  'Permission denied': 'The Linux error when your user lacks the read, write or execute permission an action needs.',
  chmod: 'Linux command that changes a file mode (its permissions), in symbolic form (u+x) or octal form (750).',
  'protected system files': 'Windows files that Windows Resource Protection guards; sfc checks and restores them.',
  'component store': 'The WinSxS store Windows uses to install and repair components; DISM repairs it.',
  elevated: 'Running with administrator rights after a User Account Control prompt (Run as administrator).',
  'rotated log': 'An older log copy made during rotation, such as app.log.1. A process may still write to it until it reopens its log.',
  'No space left on device': 'The Linux error (ENOSPC) a program gets when it writes to a file system that has no free space.',
  'package lists': 'The index of available packages that apt update downloads. apt install can only find packages that are in it.',
  'enabled (systemd)': 'A unit that systemd starts automatically at boot. Enabled says nothing about whether it runs right now; that is the Active line.',
  'service account': 'A Linux account that exists only to run one program. It reads files through their owner, group or others permissions like any user.',
  APIPA: 'Automatic Private IP Addressing: a 169.254.x.x address with mask 255.255.0.0 that Windows gives itself when no DHCP server answers. It reaches only the local link.',
  'DNS resolver cache': 'The list of recent name-to-address answers Windows keeps and uses before asking a DNS server. ipconfig /displaydns shows it, ipconfig /flushdns empties it.',
  'mapped drive': 'A drive letter that points to a network share, created with net use Z: \\\\server\\share or File Explorer.',
  '/MIR': 'robocopy mirror option: copies subdirectories like /E and deletes destination files that are not in the source (/PURGE).',
  diskpart: 'The Windows command interpreter for disks, partitions and volumes. Commands act on the object selected with select disk, partition or volume.',
  FAT32: 'A file system that UEFI firmware must be able to read, which is why firmware update drives use it.',
};

const shell01 = {
  id: 'shell-01', title: 'Fix a script that will not run', level: 1, minutes: 5,
  scenario: 'Jordan, the part-time admin at Larkspur Bakery, saved a nightly backup script as ~/scripts/backup.sh on the server web01. Running ./backup.sh fails with "bash: ./backup.sh: Permission denied". Find out why and let Jordan run it without opening it up to every account on the server.',
  examObjs: { 'aplus-1202': ['1.9'] }, objs: [],
  os: 'linux', host: 'web01', user: 'jordan', cwd: '/home/jordan/scripts',
  fs: {
    '/home/jordan/scripts/backup.sh': {
      type: 'file', owner: 'jordan', group: 'jordan', mode: '644', mtime: '2026-10-08T17:42',
      content: '#!/bin/bash\n# Nightly copy of the order export\ntar -czf /srv/backup/orders-$(date +%F).tar.gz /srv/orders/export\necho "Backup complete: /srv/backup/orders-$(date +%F).tar.gz"\n',
      exec: { out: 'Backup complete: /srv/backup/orders-2026-10-09.tar.gz' },
    },
    '/home/jordan/scripts/README.txt': { type: 'file', owner: 'jordan', group: 'jordan', mode: '644', mtime: '2026-10-08T17:40', content: 'Run ./backup.sh after the shop closes.\n' },
    '/srv/backup': { type: 'dir', owner: 'jordan', group: 'jordan', mode: '750' },
  },
  goals: [
    {
      id: 'inspect', text: 'Check the script permissions with a long listing',
      check: { any: [
        { ran: '^(?:sudo\\s+)?ls(?:\\s+\\S+)+\\s*$', lists: '/home/jordan/scripts/backup.sh', ok: true },
        { ran: '^(?:sudo\\s+)?ls(?:\\s+-[a-zA-Z]+)+\\s*$', cwd: '/home/jordan/scripts', lists: '/home/jordan/scripts/backup.sh', ok: true },
      ] },
      why: 'Permission denied on a script almost always means a missing x bit. ls -l shows the permission string, so you fix what is actually wrong instead of guessing.',
      expect: 'You ran ls -l (or ls -la) in ~/scripts and read the permission string of backup.sh (-rw-r--r--: no x anywhere).',
      hints: ['A long listing shows who may read, write and execute each file.', 'Run ls with the -l option in ~/scripts and read the first column for backup.sh.', 'Type: ls -l backup.sh'],
      src: ['ls'],
    },
    {
      id: 'owner-exec', text: 'Give the owner permission to run backup.sh',
      check: { path: '/home/jordan/scripts/backup.sh', field: 'mode', op: 'hasBits', value: '100' },
      why: 'The kernel runs a file only if the execute bit is set for the user running it. chmod u+x adds execute for the owner alone; chmod 750 gives the owner rwx, the group r-x and others nothing.',
      expect: 'backup.sh shows an x in the owner triad, for example -rwxr--r-- after chmod u+x, or -rwxr-x--- after chmod 750.',
      hints: ['The owner triad of -rw-r--r-- is missing one letter.', 'Use chmod to add execute permission for the user who owns the file.', 'Type: chmod u+x backup.sh   (chmod 750 backup.sh also works)'],
      src: ['chmod'],
    },
    {
      id: 'runs', text: 'Run the script again and confirm it works',
      check: { ran: '(^|/)backup\\.sh$', ok: true },
      why: 'Always retest the original failure. The ./ prefix tells bash to run the file from the current directory, because ~/scripts is not in the PATH.',
      expect: './backup.sh runs and prints "Backup complete".',
      hints: ['After changing the permissions, repeat the command that failed.', 'Run the script by its path from the scripts directory.', 'Type: ./backup.sh'],
      src: ['chmod'],
    },
  ],
  traps: [
    {
      id: 'world-writable', critical: true,
      check: { path: '/home/jordan/scripts/backup.sh', field: 'mode', op: 'hasBits', value: '002' },
      message: 'chmod 777 (or o+w) lets every account on web01 edit backup.sh. Anyone could add a command to it, and that command would run with Jordan\'s rights the next time the backup runs. Remove it with chmod 750 backup.sh.',
      why: 'Grant the least permission that fixes the problem: the error needed execute for the owner, never write for others.',
      src: ['chmod'],
    },
    {
      id: 'world-executable', critical: true,
      // Others can execute. A plain chmod 777 is reported once, by world-writable above; this trap also
      // fires when others can write if an earlier chmod granted others execute without write (chmod 755, a+x).
      check: { all: [
        { path: '/home/jordan/scripts/backup.sh', field: 'mode', op: 'hasBits', value: '001' },
        { any: [
          { path: '/home/jordan/scripts/backup.sh', field: 'mode', op: 'lacksBits', value: '002' },
          { ran: '^chmod\\s+(?:-\\S+\\s+)*(?:[0-7]?[0-7][0-7][15]|(?:[ug]*o[ug]*|a)?[+=][rxX]*x[rxX]*)\\s', ok: true },
        ] },
      ] },
      message: 'Other accounts can now run backup.sh. Jordan only needed owner execute permission. Remove others execute with chmod o-x backup.sh; chmod u+x from the original mode is enough.',
      why: 'Give execute permission only to accounts that need to run the script.',
      src: ['chmod'],
    },
  ],
  trapDemo: [{ do: 'chmod 755 backup.sh' }, { do: 'chmod 777 backup.sh' }],
  solution: [
    { do: 'ls -l backup.sh', explain: 'The permission string -rw-r--r-- has no x, so nobody may execute the file. That is the cause of Permission denied.' },
    { do: 'chmod u+x backup.sh', explain: 'Adds execute for the owner (jordan) only. The mode becomes -rwxr--r--; group and others are unchanged.' },
    { do: './backup.sh', explain: 'Retest the original command. The script now runs and reports the backup it made.' },
  ],
  src: ['ls', 'chmod'],
};

const shell05 = {
  id: 'shell-05', title: 'Repair corrupted system files', level: 1, minutes: 8,
  scenario: 'After an interrupted update, the front desk PC FD-PC-03 at Harborview Dental crashes when staff open Settings. The ticket asks you to check and repair the protected Windows system files. A Command Prompt is open as the user avery, but it is not elevated; you have administrator approval for this PC.',
  examObjs: { 'aplus-1202': ['1.5', '3.1'] }, objs: [],
  os: 'windows-cmd', host: 'FD-PC-03', user: 'avery', cwd: 'C:\\Users\\avery',
  fs: {
    'C:\\Users\\avery\\Documents\\front-desk-schedule.xlsx': { type: 'file', size: 48230, mtime: '2026-10-08T16:05' },
    'C:\\Windows\\Logs\\CBS\\CBS.log': { type: 'file', size: 5242880, mtime: '2026-10-09T08:55' },
  },
  state: { windows: { systemFiles: 'corrupt', componentStore: 'repairable' } },
  goals: [
    {
      id: 'scan', text: 'Run System File Checker from an elevated prompt',
      check: { key: 'windows.lastSfc', op: 'truthy' },
      why: 'sfc /scannow checks every protected system file. It changes Windows itself, so it only runs with administrator rights; from a normal prompt it refuses.',
      expect: 'sfc /scannow completed in a Command Prompt opened with Run as administrator.',
      hints: ['The tool that checks protected Windows files needs administrator rights.', 'Open Command Prompt with Run as administrator, then run System File Checker with its scan-now switch.', 'Select Run as administrator for Command Prompt, approve UAC, then type: sfc /scannow'],
      src: ['sfcSupport', 'sfcRef'],
    },
    {
      id: 'store', text: 'Repair the component store that SFC repairs from',
      check: { key: 'windows.componentStore', op: 'eq', value: 'healthy' },
      why: 'SFC could not repair every protected file. DISM RestoreHealth repairs the component store that SFC uses as a repair source; rerun SFC afterward. The SFC result alone does not identify why repair failed.',
      expect: 'DISM /Online /Cleanup-Image /RestoreHealth reports "The restore operation completed successfully."',
      hints: ['When SFC cannot fix files, repair the source it copies them from.', 'Use DISM on the running (online) image with the cleanup-image restore option.', 'Type: DISM /Online /Cleanup-Image /RestoreHealth'],
      src: ['dismRepair', 'sfcSupport'],
    },
    {
      id: 'repaired', text: 'Leave the protected system files repaired',
      check: { key: 'windows.systemFiles', op: 'eq', value: 'ok' },
      why: 'Repairing the store does not fix the damaged files by itself. Running sfc /scannow again copies good versions back, and its result line tells you the job is done.',
      expect: 'A second sfc /scannow reports "Windows Resource Protection found corrupt files and successfully repaired them."',
      hints: ['After the store is healthy, the first tool can finish its work.', 'Run System File Checker one more time in the elevated prompt.', 'Type: sfc /scannow'],
      src: ['sfcSupport'],
    },
  ],
  traps: [],
  trapDemo: [],
  solution: [
    { do: { action: 'elevate' }, explain: 'Open Command Prompt with Run as administrator and approve UAC. sfc and DISM refuse to run without it.' },
    { do: 'sfc /scannow', explain: 'SFC finds corrupt files but cannot repair them all. Repair the component store with DISM, then repeat SFC.' },
    { do: 'DISM /Online /Cleanup-Image /RestoreHealth', explain: 'DISM repairs the component store, using Windows Update as the repair source.' },
    { do: 'sfc /scannow', explain: 'With a healthy store, SFC now repairs the protected files. Restart the PC afterwards and retest Settings.' },
  ],
  src: ['sfcSupport', 'sfcRef', 'dismRepair'],
};

const ORDERS_LOG = '/var/log/orders/orders.log';
const ORDERS_OLD = '/var/log/orders/orders.log.1';

const shell02 = {
  id: 'shell-02', title: 'Free space on a full disk', level: 2, minutes: 10,
  scenario: 'Since 08:58 the order app on web02 at Copperline Print Shop fails to save orders and its log says "No space left on device". Yesterday a developer left debug logging on. Find what filled the disk and free the space without breaking the app or the system logs. You are signed in as dana, who may use sudo.',
  examObjs: { 'aplus-1202': ['1.9'] }, objs: [],
  os: 'linux', host: 'web02', user: 'dana', cwd: '/home/dana',
  fs: {
    '/var/log': { type: 'dir', owner: 'root', group: 'syslog', mode: '775' },
    '/var/log/syslog': { owner: 'syslog', group: 'adm', mode: '640', size: 2411724, mtime: '2026-10-09T09:11',
      content: 'Oct  9 08:58:03 web02 orders[1187]: write failed: No space left on device\nOct  9 09:05:41 web02 orders[1187]: write failed: No space left on device\n' },
    '/var/log/auth.log': { owner: 'syslog', group: 'adm', mode: '640', size: 48211, mtime: '2026-10-09T09:02' },
    '/var/log/dpkg.log': { owner: 'root', group: 'root', mode: '644', size: 31744, mtime: '2026-10-02T06:40' },
    '/var/log/apt/history.log': { owner: 'root', group: 'root', mode: '644', size: 24576, mtime: '2026-10-02T06:40' },
    '/var/log/apt/term.log': { owner: 'root', group: 'adm', mode: '640', size: 98304, mtime: '2026-10-02T06:40' },
    '/var/log/journal': { type: 'dir', owner: 'root', group: 'systemd-journal', mode: '2755' },
    '/var/log/journal/system.journal': { owner: 'root', group: 'systemd-journal', mode: '640', size: 134217728, mtime: '2026-10-09T09:11' },
    '/var/log/orders': { type: 'dir', owner: 'root', group: 'root', mode: '755' },
    [ORDERS_LOG]: { owner: 'orders', group: 'adm', mode: '640', size: 47185920, mtime: '2026-10-09T09:05',
      content: '2026-10-09 08:57:41 INFO order 88213 saved\n2026-10-09 08:58:03 ERROR write failed: No space left on device\n2026-10-09 08:58:03 ERROR order 88214 not saved: No space left on device\n2026-10-09 09:05:41 ERROR order 88215 not saved: No space left on device\n' },
    [ORDERS_OLD]: { owner: 'orders', group: 'adm', mode: '640', size: 19327352832, mtime: '2026-10-09T00:00',
      content: '2026-10-08 23:59:58 DEBUG payment check: retry 4410293\n2026-10-08 23:59:59 DEBUG payment check: retry 4410294\n' },
    '/var/log/orders/orders.log.2.gz': { owner: 'orders', group: 'adm', mode: '640', size: 6291456, mtime: '2026-10-08T00:00' },
  },
  state: {
    filesystems: {
      '/run': { source: 'tmpfs', sizeK: 401348, usedK: 1104, availK: 400244 },
      '/': { source: '/dev/sda2', sizeK: 40581564, usedK: 38552484, availK: 0 },
      '/boot/efi': { source: '/dev/sda1', sizeK: 1098632, usedK: 6284, availK: 1092348 },
    },
    users: { dana: { uid: 1000, groups: ['dana', 'adm', 'sudo'] }, orders: { uid: 998, groups: ['orders'] } },
  },
  goals: [
    {
      id: 'find-full', text: 'Find the file system that is full',
      check: { ran: '^(sudo\\s+)?df(\\s|$)', ok: true },
      why: '"No space left on device" names a symptom, not a place. df reports every mounted file system with its size, used and available space, so you know which one is full before you go looking for files.',
      expect: 'You ran df -h and saw / (on /dev/sda2) at 100% with 0 available.',
      hints: ['Start with the command that reports free space per file system.', 'Run df with the human-readable option and read the Use% column.', 'Type: df -h'],
      src: ['df', 'errno'],
    },
    {
      id: 'find-culprit', text: 'Find what is using the space under /var/log',
      check: { ran: '^(sudo\\s+)?du\\s', ok: true },
      why: 'df tells you which file system is full; du adds up the space under a directory. Walking down from the full mount point with du finds the real culprit instead of deleting things at random.',
      expect: 'du shows /var/log/orders at about 19G, and ls -lh in that directory shows orders.log.1 as the huge file.',
      hints: ['Logs are the usual suspect on a server. Measure the directories under /var/log.', 'Run du with human-readable sizes on /var/log (one line per directory), or with -s for one total per item.', 'Type: du -sh /var/log/*   then: ls -lh /var/log/orders'],
      src: ['du', 'ls'],
    },
    {
      id: 'free-space', text: 'Free at least 10 GB on / without touching the live log',
      check: { all: [{ key: 'filesystems./.availK', op: 'gte', value: 10485760 }, { path: ORDERS_LOG }] },
      why: 'orders.log.1 is a rotated log: logrotate renamed it and the app now writes to orders.log, so deleting the old copy frees its 18 GB at once. The live orders.log stays; a file a program still has open is only freed when the program closes it, so if it ever needs emptying, use truncate -s 0, not rm.',
      expect: 'orders.log.1 is deleted (or emptied with truncate -s 0), orders.log still exists, and df -h shows about 18G available on /.',
      hints: ['Remove the old rotated copy, not the file the app is writing to. The directory belongs to root.', 'Use sudo rm on /var/log/orders/orders.log.1, then check df -h again.', 'Type: sudo rm /var/log/orders/orders.log.1   then: df -h'],
      src: ['rm', 'logrotate', 'unlink', 'truncate', 'df'],
    },
  ],
  traps: [
    {
      id: 'deleted-var-log', critical: true,
      check: { not: { path: '/var/log' } },
      message: 'rm -rf /var/log deleted every system log and the directories that services write to. Programs that log there fail or lose their logs, and the evidence of what happened is gone. Free space by removing the one file that is too big, never a whole system directory.',
      why: 'Measure first (df, du), then delete the smallest thing that fixes the problem.',
      src: ['rm', 'du'],
    },
    {
      id: 'deleted-live-log',
      check: { not: { path: ORDERS_LOG } },
      message: 'orders.log is the file the running app writes to. Deleting it removes only the name: the app keeps writing into the deleted file, the space is not returned until the app closes it, and new log lines can no longer be read. To empty a live log, use sudo truncate -s 0 on it.',
      why: 'A deleted file stays on disk until the last program that has it open closes it.',
      src: ['unlink', 'truncate'],
    },
  ],
  trapDemo: [{ do: 'sudo rm -rf /var/log' }],
  solution: [
    { do: 'df -h', explain: 'The / file system on /dev/sda2 shows Use% 100% and Avail 0: that is the disk the app cannot write to.' },
    { do: 'du -sh /var/log/*', explain: 'One total per item in /var/log. /var/log/orders uses about 19G; everything else is small.' },
    { do: 'ls -lh /var/log/orders', explain: 'orders.log.1 is about 18G: yesterday\'s debug log that logrotate moved aside at midnight. The live file is orders.log.' },
    { do: 'sudo rm /var/log/orders/orders.log.1', explain: 'The directory belongs to root, so sudo is needed. The rotated copy is no longer written to, so deleting it frees its space at once.' },
    { do: 'df -h', explain: 'Retest: / now has about 18G available and is about half full. The app can save orders again.' },
  ],
  src: ['df', 'du', 'rm', 'truncate', 'unlink', 'logrotate', 'errno'],
};

const shell03 = {
  id: 'shell-03', title: 'Install a web server and confirm it runs', level: 2, minutes: 8,
  scenario: 'Juniper Lane Bakery has a freshly deployed Ubuntu 24.04 server, web03, for its new order page. The ticket: install the nginx web server, make sure it is running now and will start after every reboot, and show the proof. You are signed in as kai, who may use sudo.',
  examObjs: { 'aplus-1202': ['1.9'] }, objs: [],
  os: 'linux', distro: 'ubuntu', host: 'web03', user: 'kai', cwd: '/home/kai',
  fs: {
    '/home/kai/ticket.txt': { owner: 'kai', group: 'kai', mode: '644', mtime: '2026-10-09T08:40', content: 'Install nginx on web03. It must run now and after a reboot. Paste the systemctl status line into the ticket.\n' },
  },
  state: {
    packages: {
      upgradable: 12,
      available: {
        nginx: { version: '1.24.0-2ubuntu7.18', repo: 'noble-updates/main', needsUpdate: true, depends: ['nginx-common'], downloadKB: 512, installedKB: 1323,
          description: 'A high performance web server and a reverse proxy server', service: { name: 'nginx', state: { docs: 'man:nginx(8)', pid: 2841, process: 'nginx' } } },
        'nginx-common': { version: '1.24.0-2ubuntu7.18', arch: 'all', repo: 'noble-updates/main', needsUpdate: true, downloadKB: 44, installedKB: 241 },
      },
      installed: { 'openssh-server': '1:9.6p1-3ubuntu13.14' },
    },
    services: { ssh: { description: 'OpenBSD Secure Shell server', active: 'active', enabled: true, docs: 'man:sshd(8)', pid: 912, process: 'sshd', since: '2026-10-09T08:31:07' } },
  },
  goals: [
    {
      id: 'refresh', text: 'Refresh the package lists',
      check: { key: 'packages.updated', op: 'truthy' },
      why: 'apt install can only find packages that are in the local package lists. On a new server they are empty or old, so apt answers "Unable to locate package" until apt update downloads fresh lists. It changes system files, so it needs sudo.',
      expect: 'sudo apt update finished with "Reading package lists... Done" and reported 12 packages can be upgraded.',
      hints: ['apt needs an up-to-date list of what it can install.', 'Run apt with the update command, as root.', 'Type: sudo apt update'],
      src: ['apt', 'sudo'],
    },
    {
      id: 'install', text: 'Install the nginx package',
      check: { key: 'packages.installed.nginx', op: 'truthy' },
      why: 'apt install pulls the package and every dependency it needs (here nginx-common). Installing software changes the system, so it runs with sudo; -y answers the "Do you want to continue?" question in advance.',
      expect: 'apt installed nginx and nginx-common ("Setting up nginx (1.24.0-2ubuntu7.18) ...").',
      hints: ['After the lists are fresh, use the same tool to install the web server.', 'Run apt install for the nginx package with sudo.', 'Type: sudo apt install -y nginx'],
      src: ['apt', 'nginxUbuntu'],
    },
    {
      id: 'running', text: 'nginx is running now and enabled at boot',
      check: { all: [{ key: 'services.nginx.active', op: 'eq', value: 'active' }, { key: 'services.nginx.enabled', op: 'eq', value: true }] },
      why: 'Running now and starting at boot are two separate settings. On Ubuntu the nginx package turns both on during install. Where a service is not enabled, systemctl enable --now sets both in one command; enable alone does not start it.',
      expect: 'nginx.service is active (running) and enabled. If it were not, sudo systemctl enable --now nginx would fix both.',
      hints: ['systemd controls whether a service runs now and whether it starts at boot.', 'Check nginx with systemctl; if it is not active or not enabled, enable it with the option that also starts it.', 'Type: systemctl is-enabled nginx   (if it says disabled: sudo systemctl enable --now nginx)'],
      src: ['systemctl', 'nginxUbuntu'],
    },
    {
      id: 'verify', text: 'Show the proof with systemctl status',
      check: { ran: '^(sudo\\s+)?systemctl\\s+status\\s+nginx(\\.service)?\\s*$', ok: true },
      why: 'Never close a ticket on "it installed". systemctl status shows both facts the ticket asks for: "enabled" in the Loaded line (starts at boot) and "active (running)" in the Active line (runs now). It exits with 0 only when the unit is active.',
      expect: 'systemctl status nginx shows "Loaded: loaded (/usr/lib/systemd/system/nginx.service; enabled; preset: enabled)" and "Active: active (running)".',
      hints: ['One systemd command shows both the boot setting and the current state.', 'Run systemctl status for the nginx unit and read the Loaded and Active lines.', 'Type: systemctl status nginx'],
      src: ['systemctl', 'nginxUbuntu'],
    },
  ],
  traps: [],
  trapDemo: [],
  solution: [
    { do: 'sudo apt update', explain: 'Downloads fresh package lists. Without this, apt install nginx fails with "Unable to locate package nginx" on this new server.' },
    { do: 'sudo apt install -y nginx', explain: 'Installs nginx and its dependency nginx-common. On Ubuntu the package also starts nginx and enables it at boot (the "Created symlink" line).' },
    { do: 'systemctl is-enabled nginx', explain: 'Prints enabled: nginx will start after a reboot. If it printed disabled, sudo systemctl enable --now nginx would enable and start it in one step.' },
    { do: 'systemctl status nginx', explain: 'The proof for the ticket: Loaded ... enabled (starts at boot) and Active: active (running) (runs now).' },
  ],
  src: ['apt', 'systemctl', 'nginxUbuntu', 'sudo'],
};

const CONF = '/etc/booking/booking.conf';

const shell04 = {
  id: 'shell-04', title: 'Let a service read its config, and nobody else', level: 3, minutes: 12,
  scenario: 'Tidewater Tutoring\'s booking web app (service bookingd, running as the account booking) stopped after a contractor replaced its config file last night. The file holds the database password. Find out why the app cannot start, fix the file so the service can read it and other accounts cannot, and bring the app back. You are riley on app01, with sudo.',
  examObjs: { 'aplus-1202': ['1.9'] }, objs: [],
  os: 'linux', host: 'app01', user: 'riley', cwd: '/home/riley',
  fs: {
    '/etc/booking': { type: 'dir', owner: 'root', group: 'root', mode: '755' },
    [CONF]: { owner: 'root', group: 'root', mode: '600', mtime: '2026-10-08T22:47',
      content: '# Booking web app settings\nlisten = 127.0.0.1:8080\ndb_host = 10.0.4.20\ndb_user = booking\ndb_password = tide-example-pass\n' },
    '/var/log/booking': { type: 'dir', owner: 'booking', group: 'adm', mode: '750' },
    '/var/log/booking/error.log': { owner: 'booking', group: 'adm', mode: '640', mtime: '2026-10-09T07:58',
      content: '2026-10-08 18:00:02 [info] bookingd: started, listening on 127.0.0.1:8080\n2026-10-08 22:48:10 [info] bookingd: stopping for restart\n2026-10-09 07:58:12 [error] bookingd: cannot open /etc/booking/booking.conf: Permission denied\n2026-10-09 07:58:12 [error] bookingd: startup aborted\n' },
  },
  state: {
    users: { riley: { uid: 1000, groups: ['riley', 'adm', 'sudo'] }, booking: { uid: 998, groups: ['booking'] } },
    services: {
      bookingd: {
        description: 'Tidewater booking web app', active: 'failed', enabled: true, preset: 'enabled', since: '2026-10-09T07:58:12', pid: 2214, process: 'bookingd',
        startWhen: { any: [
          { all: [{ path: CONF, field: 'owner', op: 'eq', value: 'booking' }, { path: CONF, field: 'mode', op: 'hasBits', value: '400' }] },
          { all: [{ path: CONF, field: 'owner', op: 'ne', value: 'booking' }, { path: CONF, field: 'group', op: 'eq', value: 'booking' }, { path: CONF, field: 'mode', op: 'hasBits', value: '040' }] },
          { all: [{ path: CONF, field: 'owner', op: 'ne', value: 'booking' }, { path: CONF, field: 'group', op: 'ne', value: 'booking' }, { path: CONF, field: 'mode', op: 'hasBits', value: '004' }] },
        ] },
        log: ['Oct 09 07:58:12 app01 bookingd[1532]: cannot open /etc/booking/booking.conf: Permission denied', 'Oct 09 07:58:12 app01 systemd[1]: bookingd.service: Main process exited, code=exited, status=1/FAILURE', "Oct 09 07:58:12 app01 systemd[1]: bookingd.service: Failed with result 'exit-code'."],
      },
    },
  },
  goals: [
    {
      id: 'inspect', text: 'Read the config file\'s owner, group and mode',
      check: { ran: '^(sudo\\s+)?ls(?=(?:\\s+\\S+)*\\s+-[a-zA-Z]*l)(?=(?:\\s+\\S+)*\\s+(?:/etc/booking/?|/etc/booking/booking\\.conf|/etc/booking/\\*|booking\\.conf)(?:\\s|$))(?:\\s+(?:-[a-zA-Z]+|/etc/booking/?|/etc/booking/booking\\.conf|/etc/booking/\\*|booking\\.conf))+\\s*$', ok: true },
      why: 'ls -l shows the three facts that decide access: the mode string, the owner and the group. -rw------- root root means only root can read the file, and the service runs as booking.',
      expect: 'ls -l /etc/booking/booking.conf shows -rw------- 1 root root: no read for anyone but root.',
      hints: ['A long listing shows who may read a file.', 'Run ls with -l on the config file in /etc/booking.', 'Type: ls -l /etc/booking/booking.conf'],
      src: ['ls'],
    },
    {
      id: 'log', text: 'Find the error in the app log',
      check: { ran: '(^|\\|)\\s*(sudo\\s+)?grep\\s', ok: true },
      why: 'The log names the exact failure, so you fix the cause instead of guessing. grep -i finds a phrase regardless of upper or lower case.',
      expect: 'grep finds "cannot open /etc/booking/booking.conf: Permission denied" in /var/log/booking/error.log.',
      hints: ['The app writes its errors under /var/log/booking.', 'Search error.log for the word error (or for "permission") with grep, ignoring case.', 'Type: grep -i error /var/log/booking/error.log'],
      src: ['grep'],
    },
    {
      id: 'ownership', text: 'Owner root, group booking',
      check: { all: [{ path: CONF, field: 'owner', op: 'eq', value: 'root' }, { path: CONF, field: 'group', op: 'eq', value: 'booking' }] },
      why: 'The service only needs to read its config. Keeping root as the owner means only an admin can change the file; giving it the booking group lets the service in through the group triad. Changing ownership needs root.',
      expect: 'ls -l shows the file as owned by root with group booking.',
      hints: ['Give the service\'s group to the file, keep root as the owner.', 'Use chown with OWNER:GROUP and sudo.', 'Type: sudo chown root:booking /etc/booking/booking.conf'],
      src: ['chown', 'chown2'],
    },
    {
      id: 'mode', text: 'Mode 640: owner read and write, group read, others nothing',
      check: { path: CONF, field: 'mode', op: 'in', value: ['640', '440'] },
      why: 'With the group set to booking, the group triad needs r. 640 gives the owner rw, the group r and others nothing, so the database password stays private.',
      expect: 'ls -l shows -rw-r----- 1 root booking.',
      hints: ['The group triad of -rw------- needs one letter.', 'Use chmod with the octal mode for rw-r-----, with sudo.', 'Type: sudo chmod 640 /etc/booking/booking.conf'],
      src: ['chmod'],
    },
    {
      id: 'running', text: 'Restart bookingd and confirm it is active',
      check: { all: [{ key: 'services.bookingd.active', op: 'eq', value: 'active' }, { ran: '^(sudo\\s+)?systemctl(\\s+-\\S+)*\\s+(status|is-active)(\\s+-\\S+)*\\s+bookingd(\\.service)?(\\s+-\\S+)*\\s*$', ok: true }] },
      why: 'Fixing the file does not restart a failed service. Restart it, then check status after the restart: "active (running)" proves the fix, while another failure would point to a different cause. systemctl status exits with 0 only when the unit is active, so the status you ran before the fix does not count.',
      expect: 'sudo systemctl restart bookingd succeeds and systemctl status bookingd shows Active: active (running).',
      hints: ['A failed service stays failed until you start it again.', 'Restart the unit with systemctl and sudo, then look at its status.', 'Type: sudo systemctl restart bookingd   then: systemctl status bookingd'],
      src: ['systemctl'],
    },
  ],
  traps: [
    {
      id: 'world-writable', critical: true,
      check: { path: CONF, field: 'mode', op: 'hasBits', value: '002' },
      message: 'chmod 777 (or o+w) lets every account on app01 read the database password and rewrite the config, for example to point the app at another database. Set it back with sudo chmod 640 and keep the group fix.',
      why: 'Never fix "Permission denied" by opening a file to everyone. Find which account needs which permission and grant only that.',
      src: ['chmod'],
    },
    {
      id: 'world-readable',
      check: { path: CONF, field: 'mode', op: 'hasBits', value: '004' },
      message: 'chmod 644 makes the app start, but now every account on app01 can read the database password with cat. Use the group: chown root:booking and chmod 640.',
      why: 'A file that holds a secret gets no permissions for others. Give the service access through its owner or group instead.',
      src: ['chmod', 'chown'],
    },
  ],
  trapDemo: [{ do: 'sudo chmod 777 /etc/booking/booking.conf' }],
  solution: [
    { do: 'systemctl status bookingd', explain: 'The service failed at 07:58, and the journal lines show "cannot open /etc/booking/booking.conf: Permission denied".' },
    { do: 'grep -i error /var/log/booking/error.log', explain: 'The app log confirms the cause: the account booking cannot open its config file.' },
    { do: 'ls -l /etc/booking/booking.conf', explain: '-rw------- root root: only root can read it. The contractor\'s new file lost the booking group.' },
    { do: 'sudo chown root:booking /etc/booking/booking.conf', explain: 'Root stays the owner, so only an admin can change the file; the group becomes booking.' },
    { do: 'sudo chmod 640 /etc/booking/booking.conf', explain: 'rw for root, r for the booking group, nothing for anyone else.' },
    { do: 'ls -l /etc/booking/booking.conf', explain: 'Check the result: -rw-r----- 1 root booking.' },
    { do: 'sudo systemctl restart bookingd', explain: 'Start the failed service again; it can read its config now.' },
    { do: 'systemctl status bookingd', explain: 'Active: active (running). The app is back and the password is still private.' },
  ],
  src: ['ls', 'grep', 'chown', 'chmod', 'systemctl'],
};

const shell06 = {
  id: 'shell-06', title: 'APIPA address and a stale DNS answer', level: 2, minutes: 10,
  scenario: 'At Ridgeline Veterinary Clinic the router that hands out addresses (DHCP) was restarted for maintenance at 08:00, and last night the online records portal portal.ridgeline.example moved to a new server IP. Casey\'s laptop LT-07 shows "No internet", and Casey says the portal "still went to the old page" yesterday evening. The router is back up. Fix the laptop from the Command Prompt; you may run it as administrator.',
  examObjs: { 'aplus-1202': ['1.5'], 'aplus-1201': ['2.6', '5.5'] }, objs: [],
  os: 'windows-cmd', host: 'LT-07', user: 'casey', cwd: 'C:\\Users\\casey',
  fs: {
    'C:\\Users\\casey\\Documents\\vaccine-schedule.xlsx': { size: 38912, mtime: '2026-10-08T17:20' },
  },
  state: {
    network: {
      adapters: {
        'Wi-Fi': {
          kind: 'Wireless LAN', description: 'Wi-Fi 6E Wireless Adapter', mac: '5C-E4-2A-81-3D-90', index: 17, ipv6: 'fe80::9a3c:7e21:5b0d:44e1',
          ipv4: '169.254.48.211', mask: '255.255.0.0', gateway: '', dns: ['192.168.20.1'],
          dhcpOffer: { ipv4: '192.168.20.57', mask: '255.255.255.0', gateway: '192.168.20.1', dns: ['192.168.20.1'], dhcpServer: '192.168.20.1', leaseExpires: '2026-10-10T09:12:00' },
        },
      },
      dnsCache: { 'portal.ridgeline.example': { ip: '203.0.113.10', ttl: 79214 } },
      hosts: {
        'portal.ridgeline.example': { ip: '203.0.113.45', ms: 18, ports: [443] },
        '203.0.113.10': { reachable: false },
      },
    },
  },
  goals: [
    {
      id: 'diagnose', text: 'Read the laptop\'s IP configuration',
      check: { ran: '^ipconfig(\\s+/all)?\\s*$', ok: true },
      why: 'ipconfig shows where the problem is before you change anything. An Autoconfiguration IPv4 Address in 169.254.x.x with mask 255.255.0.0 and no default gateway means DHCP did not answer and Windows assigned itself an APIPA address.',
      expect: 'ipconfig shows "Autoconfiguration IPv4 Address. . : 169.254.48.211", Subnet Mask 255.255.0.0 and an empty Default Gateway under "Wireless LAN adapter Wi-Fi".',
      hints: ['First look at the address the Wi-Fi adapter has.', 'Run ipconfig (or ipconfig /all) and read the IPv4 lines for Wi-Fi.', 'Type: ipconfig'],
      src: ['ipconfig', 'apipa'],
    },
    {
      id: 'lease', text: 'Get a real DHCP address from the router',
      check: { key: 'network.adapters.Wi-Fi.ipv4', op: 'eq', value: '192.168.20.57' },
      why: 'An APIPA address only reaches the local link, so there is no gateway and no internet. Now that the DHCP server is back, releasing the self-assigned address and renewing asks the router for a real lease immediately.',
      expect: 'After ipconfig /release and ipconfig /renew in an elevated prompt, Wi-Fi shows IPv4 Address 192.168.20.57, mask 255.255.255.0 and gateway 192.168.20.1.',
      hints: ['The DHCP server is up again; ask it for a lease instead of waiting.', 'In a Command Prompt opened with Run as administrator, release and then renew the DHCP address.', 'Run as administrator, then type: ipconfig /release   then: ipconfig /renew'],
      src: ['ipconfig', 'apipa'],
    },
    {
      id: 'flush', text: 'Clear the stale DNS answer from the cache',
      check: { ran: '^ipconfig\\s+/flushdns\\s*$', ok: true },
      why: 'Windows answers names from its DNS client resolver cache before it asks the DNS server. The cache still holds the portal\'s old address and would keep it until the record\'s time to live runs out. Flushing makes the next lookup ask the server.',
      expect: 'The DNS resolver cache is cleared.',
      hints: ['ping portal.ridgeline.example still goes to 203.0.113.10: Windows remembers old answers.', 'Use the ipconfig option that empties the DNS resolver cache (ipconfig /displaydns shows it first).', 'Type: ipconfig /flushdns'],
      src: ['ipconfig'],
    },
    {
      id: 'dns-check', text: 'Ask the DNS server for the portal\'s current address',
      check: { ran: '^nslookup\\s+portal\\.ridgeline\\.example\\.?(\\s+\\S+)?\\s*$', ok: true },
      why: 'nslookup sends the query to the DNS server named in its Server line and prints that server\'s answer, so you can confirm the record really changed before you blame the PC.',
      expect: 'nslookup portal.ridgeline.example shows Address: 203.0.113.45 from server 192.168.20.1.',
      hints: ['Check what the DNS server now says about the portal name.', 'Run nslookup with the portal\'s name.', 'Type: nslookup portal.ridgeline.example'],
      src: ['nslookup'],
    },
    {
      id: 'reach', text: 'Confirm the portal name resolves to the new address and the host replies to ping',
      check: { ran: '^ping\\s+(\\S+\\s+)*portal\\.ridgeline\\.example\\s*$', ok: true },
      why: 'Ping shows which address Windows resolves and whether the host answers ICMP. After this command-line check, open the portal to confirm the web application itself works.',
      expect: 'ping resolves portal.ridgeline.example to 203.0.113.45 and receives four replies.',
      hints: ['Test the portal by name now.', 'Ping the portal\'s name and check the address in brackets.', 'Type: ping portal.ridgeline.example'],
      src: ['ipconfig', 'nslookup'],
    },
  ],
  traps: [],
  trapDemo: [],
  solution: [
    { do: 'ipconfig', explain: 'Wi-Fi has Autoconfiguration IPv4 Address 169.254.48.211, mask 255.255.0.0, no gateway: APIPA, because DHCP was down when the laptop connected.' },
    { do: { action: 'elevate' }, explain: 'Open Command Prompt with Run as administrator: releasing and renewing an address changes the adapter configuration.' },
    { do: 'ipconfig /release', explain: 'Drops the self-assigned address on the Wi-Fi adapter.' },
    { do: 'ipconfig /renew', explain: 'The router answers this time: IPv4 Address 192.168.20.57, gateway 192.168.20.1.' },
    { do: 'ipconfig /displaydns', explain: 'The cache still says portal.ridgeline.example is 203.0.113.10, the old server.' },
    { do: 'ipconfig /flushdns', explain: 'Empties the DNS resolver cache so the next lookup asks the DNS server.' },
    { do: 'nslookup portal.ridgeline.example', explain: 'The DNS server (192.168.20.1) answers 203.0.113.45: the new address.' },
    { do: 'ping portal.ridgeline.example', explain: 'The name resolves to 203.0.113.45 and the host replies. Open the portal afterward to confirm HTTPS and the page work.' },
  ],
  src: ['ipconfig', 'apipa', 'nslookup'],
};

const DOCS = 'C:\\Users\\morgan\\Documents';
const SHARE = '\\\\fs01\\backups\\morgan';

const shell07 = {
  id: 'shell-07', title: 'Back up Documents to a network share', level: 2, minutes: 10,
  scenario: 'Morgan, an agent at Oakhurst Realty, needs her Documents folder copied to her backup folder on the file server before her laptop goes in for repair. The backup share is \\\\fs01\\backups and her folder there is morgan. Last month Morgan deleted her Taxes folder by mistake, and the copy on the share is now the only one. Map the share and copy everything, including empty folders, without deleting anything on either side.',
  examObjs: { 'aplus-1202': ['1.5'] }, objs: [],
  os: 'windows-cmd', host: 'OAK-LT-14', user: 'morgan', cwd: 'C:\\Users\\morgan',
  fs: {
    [`${DOCS}\\Q4-budget.xlsx`]: { size: 58368, mtime: '2026-10-08T16:12' },
    [`${DOCS}\\letterhead.docx`]: { size: 24576, mtime: '2026-06-02T10:05' },
    [`${DOCS}\\Clients\\HarborView\\listing-agreement.pdf`]: { size: 412160, mtime: '2026-10-06T11:30' },
    [`${DOCS}\\Clients\\HarborView\\showing-notes.docx`]: { size: 19456, mtime: '2026-10-07T15:48' },
    [`${DOCS}\\Scans`]: { type: 'dir', mtime: '2026-09-30T09:00' },
    [`${SHARE}\\letterhead.docx`]: { size: 24576, mtime: '2026-06-02T10:05' },
    [`${SHARE}\\Taxes\\2025-receipts.pdf`]: { size: 1835008, mtime: '2026-04-11T19:22' },
    '\\\\fs01\\backups\\jamie\\contacts.xlsx': { size: 30720, mtime: '2026-10-01T08:10' },
  },
  goals: [
    {
      id: 'map', text: 'Map \\\\fs01\\backups to a drive letter',
      check: { ran: '^net\\s+use\\s+[a-z]:\\s+\\\\\\\\fs01\\\\backups\\\\?(\\s+/persistent:(yes|no))?\\s*$', ok: true },
      why: 'net use gives a share a drive letter, so commands and people can use Z:\\morgan instead of the full UNC path. Running net use with no arguments lists the mappings.',
      expect: 'The backup share is mapped to drive Z:.',
      hints: ['Connect a drive letter to the server\'s backups share.', 'Use net use with a free letter and the UNC path \\\\fs01\\backups.', 'Type: net use Z: \\\\fs01\\backups'],
      src: ['netUse'],
    },
    {
      id: 'copied', text: 'Copy every file from Documents, subfolders included',
      check: { all: [{ path: `${SHARE}\\Q4-budget.xlsx` }, { path: `${SHARE}\\Clients\\HarborView\\listing-agreement.pdf` }, { path: `${SHARE}\\Clients\\HarborView\\showing-notes.docx` }] },
      why: 'robocopy SOURCE DESTINATION copies from the first path to the second. Without /S or /E it copies only the top folder\'s files; the client folders would be left behind.',
      expect: 'Q4-budget.xlsx and Clients\\HarborView with both files are in \\\\fs01\\backups\\morgan.',
      hints: ['Source first, destination second, and include subfolders.', 'Run robocopy from C:\\Users\\morgan\\Documents to Z:\\morgan with the switch that copies subdirectories.', 'Type: robocopy C:\\Users\\morgan\\Documents Z:\\morgan /E'],
      src: ['robocopy'],
    },
    {
      id: 'empty-folders', text: 'Keep empty folders such as Scans',
      check: { path: `${SHARE}\\Scans`, field: 'type', op: 'eq', value: 'dir' },
      why: '/S skips empty directories; /E copies subdirectories including empty ones, so the backup keeps the same folder layout Morgan expects after the repair.',
      expect: 'The empty Scans folder exists in \\\\fs01\\backups\\morgan.',
      hints: ['One subdirectory switch skips empty folders, the other keeps them.', 'Use /E rather than /S.', 'Type: robocopy C:\\Users\\morgan\\Documents Z:\\morgan /E'],
      src: ['robocopy'],
    },
  ],
  traps: [
    {
      id: 'mirror-wrong-way', critical: true,
      check: { any: [{ not: { path: `${DOCS}\\Q4-budget.xlsx` } }, { ran: '^robocopy\\s+\\S+\\s+"?c:\\\\users\\\\morgan\\\\documents\\\\?"?(\\s.*)?\\s/(mir|purge)\\b', flags: 'i' }] },
      message: 'A file disappeared from Documents, or a destructive robocopy ran toward Documents. /MOV and /MOVE delete copied source files; /MIR and /PURGE can delete files in the destination. Restore missing Documents files from the backup, then copy Documents to the backup with /E.',
      why: 'Check both path order and switches. /E copies subfolders without deleting files from either side.',
      src: ['robocopy'],
    },
    {
      id: 'purged-backup', critical: true,
      check: { not: { path: `${SHARE}\\Taxes\\2025-receipts.pdf` } },
      message: '/MIR (or /PURGE) deleted the Taxes folder from the share because it is no longer in Documents. That was the only copy of Morgan\'s receipts. For a backup into a folder that keeps older files, use /E, which never deletes.',
      why: '/MIR equals /E plus /PURGE: anything in the destination that is missing from the source is deleted.',
      src: ['robocopy'],
    },
  ],
  trapDemo: [
    { do: 'net use Z: \\\\fs01\\backups' },
    { do: 'robocopy C:\\Users\\morgan\\Documents Z:\\morgan /MIR' },
    { do: 'robocopy Z:\\morgan C:\\Users\\morgan\\Documents /MIR' },
  ],
  solution: [
    { do: 'net use Z: \\\\fs01\\backups', explain: 'Maps drive Z: to the backups share. Z:\\morgan is Morgan\'s folder on the server.' },
    { do: 'robocopy C:\\Users\\morgan\\Documents Z:\\morgan /E', explain: 'Copies Documents with every subfolder, including the empty Scans folder. letterhead.docx is skipped because the same file is already there, and the Taxes folder is listed as *EXTRA but kept. Exit code 3 means files were copied and extras exist, with no failure.' },
  ],
  src: ['netUse', 'robocopy'],
};

// Every successful clean must follow: list disk (identify by size), then select disk 2, then a focus
// check (list disk or detail disk) with no other disk or volume selection in between. Re-selecting
// after the first list disk only needs select disk 2 and a new focus check.
const VERIFIED_CLEAN = {
  ranSequence: ['^list\\s+disk\\s*$', '^sel(?:ect)?\\s+disk\\s+2\\s*$', '^(?:list\\s+disk|det(?:ail)?\\s+disk)\\s*$', '^clean\\s*$'],
  within: 'diskpart', resetOn: '^sel(?:ect)?\\s+(?:disk|vol(?:ume)?)\\b', resetTo: 1, every: '^clean\\s*$',
};

const shell08 = {
  id: 'shell-08', title: 'Prepare a firmware USB drive with diskpart', level: 3, minutes: 12,
  scenario: 'A customer\'s desktop at Northgate Tech Repair needs a UEFI firmware update from a USB drive. On the bench PC (BENCH-01) the 16 GB USB stick is plugged in next to the internal 1 TB disk that holds customer backups. Prepare the stick with one FAT32 partition and a drive letter, using diskpart. You are signed in as alex, an administrator.',
  examObjs: { 'aplus-1202': ['1.5'] }, objs: [],
  os: 'windows-cmd', host: 'BENCH-01', user: 'alex', cwd: 'C:\\Users\\alex',
  fs: {
    'D:\\Backups\\ticket-4471\\photos.zip': { size: 7516192768, mtime: '2026-10-07T14:02' },
    'D:\\Backups\\ticket-4480\\documents.zip': { size: 2147483648, mtime: '2026-10-08T16:45' },
    'E:\\old-slides.pptx': { size: 5242880, mtime: '2026-05-14T09:30' },
  },
  state: {
    disks: {
      0: { sizeGB: 476, system: true, gpt: true, partitions: [{ sizeGB: 476, fs: 'NTFS', letter: 'C', label: 'Windows' }] },
      1: { sizeGB: 931, gpt: true, partitions: [{ sizeGB: 931, fs: 'NTFS', letter: 'D', label: 'Backups' }] },
      2: { sizeGB: 14.9, removable: true, partitions: [{ sizeGB: 14.9, fs: 'exFAT', letter: 'E', label: 'USB' }] },
    },
  },
  goals: [
    {
      id: 'identify', text: 'List the disks and identify the USB drive',
      check: { ran: '^list\\s+disk\\s*$', ok: true },
      why: 'diskpart acts on whatever has focus, and disk numbers depend on the hardware. List the disks and identify the stick by size (a 16 GB stick shows a little under 16 GB) before you select anything.',
      expect: 'list disk shows Disk 0 (476 GB), Disk 1 (931 GB) and Disk 2 (15 GB): the USB drive is Disk 2.',
      hints: ['Open the disk tool as administrator and look at every disk before choosing one.', 'Start diskpart and list the disks; compare the sizes.', 'Run as administrator, type: diskpart   then: list disk'],
      src: ['diskpart'],
    },
    {
      id: 'clean-usb', text: 'Clean the USB drive (Disk 2) and nothing else',
      check: { all: [
        { key: 'disks.2.cleaned', op: 'truthy' },
        VERIFIED_CLEAN,
      ] },
      why: 'clean removes the partition table of the disk with focus, with no undo and no confirmation. Select the disk you identified by size, list disk again to see the asterisk on it, then clean.',
      expect: 'After select disk 2, list disk shows an asterisk at the far left of Disk 2\'s row. Only then run clean on Disk 2.',
      hints: ['Give focus to the 15 GB disk and check the asterisk before erasing.', 'select disk 2, list disk again, then clean.', 'Type: select disk 2   then: list disk   then: clean'],
      src: ['diskpart', 'dpClean'],
    },
    {
      id: 'fat32', text: 'One primary partition formatted FAT32',
      check: { key: 'disks.2.partitions.0.fs', op: 'eq', value: 'FAT32' },
      why: 'UEFI firmware must be able to read FAT12, FAT16 and FAT32 on removable media; NTFS and exFAT are not required, so a firmware stick uses FAT32. create partition primary uses all free space and moves the focus to the new partition, so format acts on it.',
      expect: 'The new primary partition is formatted FAT32.',
      hints: ['After clean the disk has no partition. Create one, then format it with the file system firmware reads.', 'create partition primary, then format with fs=fat32 and the quick option.', 'Type: create partition primary   then: format fs=fat32 quick label=FIRMWARE'],
      src: ['dpCreate', 'dpFormat', 'uefiFat'],
    },
    {
      id: 'letter', text: 'Give the new volume a drive letter',
      check: { all: [{ key: 'disks.2.cleaned', op: 'truthy' }, { key: 'disks.2.partitions.0.letter', op: 'truthy' }] },
      why: 'Without a drive letter the volume does not appear in File Explorer, so you cannot copy the firmware file to it. assign with no letter= takes the next available letter.',
      expect: 'list volume shows the FAT32 volume with a drive letter.',
      hints: ['The new volume still needs a letter.', 'Use assign on the volume with focus.', 'Type: assign   then: exit'],
      src: ['dpAssign'],
    },
  ],
  traps: [
    {
      id: 'wiped-data-disk', critical: true,
      check: { key: 'disks.1.cleaned', op: 'truthy' },
      message: 'clean ran on Disk 1, the 931 GB internal disk with the customer backups. diskpart does not ask for confirmation and Windows only protects the disk it is running from, so every partition on that disk is gone. Always list disk, compare sizes, select, and list disk again to check the asterisk before clean.',
      why: 'clean acts on the disk with focus, whatever it is. Identify the target by size and removable type first.',
      src: ['dpClean', 'diskpart'],
    },
    {
      id: 'tried-system-disk',
      check: { key: 'disks.0.cleanAttempted', op: 'truthy' },
      message: 'You selected Disk 0 and ran clean. Windows refused only because Disk 0 holds the running system; booted from other media, or with the disks numbered differently, the same habit erases a drive. Never assume the USB drive is a particular number: list disk and check the size first.',
      why: 'Disk numbers are not fixed. Check list disk every time before select and clean.',
      src: ['vdsClean', 'diskpart'],
    },
    {
      id: 'cleaned-without-listing', critical: true,
      check: { all: [
        { key: 'disks.2.cleaned', op: 'truthy' },
        { not: VERIFIED_CLEAN },
      ] },
      message: 'You cleaned Disk 2 without listing the disks and confirming focus first. Check the size before selecting, then verify the asterisk with list disk or use detail disk before clean.',
      why: 'Check the current disk list and confirm focus before a destructive command.',
      src: ['diskpart', 'dpClean'],
    },
  ],
  trapDemo: [
    { do: { action: 'elevate' } },
    { do: 'diskpart' },
    { do: 'select disk 0' },
    { do: 'clean' },
    { do: 'select disk 1' },
    { do: 'clean' },
    { do: 'select disk 2' },
    { do: 'clean' },
    { do: 'exit' },
    { do: 'diskpart' },
    { do: 'list disk' },
    { do: 'select disk 2' },
    { do: 'clean' },
  ],
  solution: [
    { do: { action: 'elevate' }, explain: 'diskpart needs an elevated Command Prompt (Run as administrator).' },
    { do: 'diskpart', explain: 'Starts the DiskPart command interpreter; the prompt changes to DISKPART>.' },
    { do: 'list disk', explain: 'Disk 0 is 476 GB (Windows), Disk 1 is 931 GB (backups), Disk 2 is 15 GB: the 16 GB USB stick.' },
    { do: 'select disk 2', explain: 'Gives Disk 2 the focus.' },
    { do: 'list disk', explain: 'The far-left asterisk is on Disk 2; asterisks under Gpt are partition-style markers. Check the selected row before clean.' },
    { do: 'clean', explain: 'Removes the partition table of the USB drive only.' },
    { do: 'create partition primary', explain: 'One partition over the whole stick; focus moves to it.' },
    { do: 'format fs=fat32 quick label=FIRMWARE', explain: 'FAT32, which UEFI firmware reads. quick skips the sector scan on a drive known to be good.' },
    { do: 'assign', explain: 'Gives the volume the next free letter so you can copy the firmware file to it.' },
    { do: 'list volume', explain: 'The FIRMWARE volume shows FAT32, Removable, with its letter. The Backups volume on Disk 1 is untouched.' },
    { do: 'exit', explain: 'Leaves DiskPart. Copy the firmware file to the stick next.' },
  ],
  src: ['diskpart', 'dpClean', 'dpCreate', 'dpFormat', 'dpAssign', 'uefiFat'],
};

// Ordered by level (SPEC 1: non-decreasing in file order); ids stay as shipped.
const cases = [shell01, shell05, shell02, shell03, shell06, shell07, shell04, shell08];

export default cases;

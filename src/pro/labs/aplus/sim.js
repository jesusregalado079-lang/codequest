// Declarative UI-state simulator for the windows, router, phone and printer skins (SPEC 3.2).
// Pure and deterministic; every piece of state is JSON-serializable.
//
// createSim(caseDef) -> sim
//   sim.launch(query)                  Start search / Run (windows skin only)
//   sim.open(screenId)                 navigate (windows: only within an app already launched)
//   sim.set(controlId, value)          toggle / select / text / password / number
//   sim.act(controlId, rowId?, actionId?)  button, link, or a list row action
//   Each of the above, plus restore() and reset(), returns { ok, msg, goalsChanged, trapsHit }:
//   goalsChanged = goals that became passing, trapsHit = traps that became hit. A Run fallback reply
//   (below) also carries info: true, because it is ok but nothing opened.
//   sim.view()     current screen with resolved values, visible and enabled flags (null on the desktop)
//   sim.check()    { goals: [{ id, pass, text, why, expect, weight? }], traps: [{ id, hit, message, why, critical? }], score }
//   sim.snapshot() / sim.restore(snapshot) / sim.reset()
//   sim.state, sim.used, sim.actions, sim.screenId (read-only copies)
//
// Case extensions beyond SPEC 3.2 (all optional):
//   app.launch entries may be { q, screen } to deep-link (e.g. 'ms-settings:windowsupdate');
//   an action may carry open: screenId (e.g. a row's Properties); list rows may carry visibleIf;
//   action.copy maps target keys to source keys; action.copyPrefix copies every matching key
//   from one prefix to another. Sources are read before any action writes; set takes precedence.
//   action.refuse: message rejects the action ({ ok: false, msg }) with no state change, e.g. form
//   validation on a Save button whose visibleIf matches invalid input.
//   A predicate { key, op: 'eqKey', value: otherKey } compares two state values
//   (state[key] === state[otherKey]); combine it with not for "must differ".
//   Name checks fold both sides to lowercase letters and digits (spaces and punctuation dropped):
//   { key, op: 'hasText', value: 'Harbor Dental' | [names] } is true when state[key] contains a name;
//   { key, op: 'hasKey', value: otherKey } is true when state[key] contains state[otherKey] (only when
//   the folded state[otherKey] has 4 or more characters, so a one-letter name matches nothing);
//   { key, op: 'nearKey', value: otherKey, max } is true when the two folded values are both non-empty
//   and differ by at most max single-character edits (Levenshtein, default 3).
//   { key, op: 'repeatedFold' } is true when a value is made of a 2-31 character chunk repeated
//   end to end, ignoring case (e.g. winter2026Winter2026). Other predicates keep their own case rules.
//   Windows Run fallback: a query that matches no app of the case but names a real Windows 11 tool
//   (WINDOWS_TOOLS, e.g. ncpa.cpl) returns ok and info: true with a message saying what the tool is and
//   that this case is practiced another way (cli: true entries say it is a command-line tool to run in a shell).
//   Nothing opens, nothing is logged, and no state changes.
//   Run names without an extension resolve the way Windows does, through PATHEXT (runNames below):
//   devmgmt finds devmgmt.msc and regedit finds regedit.exe, in the case's aliases and then the catalog.
//   number controls may carry min / max; non-windows skins start on caseDef.home or the first screen
//   and their one implicit app has the id of the skin (so { used: 'app:router' } works).
import { scoreFrom } from './coach.js';

const SETTABLE = ['toggle', 'select', 'text', 'password', 'number'];
const copy = (value) => structuredClone(value);
const result = (ok, msg, goalsChanged = [], trapsHit = []) => ({ ok, msg, goalsChanged, trapsHit });
const fold = (text) => String(text ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
const optionValue = (option) => typeof option === 'object' && option !== null ? option.value : option;
const runError = (query) => `Windows cannot find '${String(query ?? '').trim()}'. Make sure you typed the name correctly, and then try again.`;
const squash = (text) => String(text ?? '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

// Real Windows 11 Run names (Microsoft Learn: MMC snap-ins, Control Panel items, ms-settings: and
// windowsdefender: URIs, built-in programs). Used only when the case has no app for the query.
// exe: the name also runs with .exe appended; prefix: any query starting with q (a URI scheme).
export const WINDOWS_TOOLS = [
  { q: 'compmgmt.msc', name: 'Computer Management', what: 'the console that groups Task Scheduler, Event Viewer, Shared Folders, Local Users and Groups, Device Manager, Disk Management and Services' },
  { q: 'devmgmt.msc', name: 'Device Manager', what: 'the list of hardware devices and their drivers' },
  { q: 'diskmgmt.msc', name: 'Disk Management', what: 'the tool that initializes disks and creates, formats and letters volumes' },
  { q: 'eventvwr.msc', name: 'Event Viewer', what: 'the Windows and application event logs' },
  { q: 'services.msc', name: 'Services', what: 'the console that starts, stops and sets the startup type of Windows services' },
  { q: 'taskschd.msc', name: 'Task Scheduler', what: 'the console for tasks that run on a schedule or trigger' },
  { q: 'lusrmgr.msc', name: 'Local Users and Groups', what: 'the console for local accounts and group membership (Pro and higher editions)' },
  { q: 'certmgr.msc', name: 'Certificates - Current User', what: 'the certificate store of the signed-in user' },
  { q: 'gpedit.msc', name: 'Local Group Policy Editor', what: 'the editor for local policy settings (Pro and higher editions)' },
  { q: 'perfmon.msc', name: 'Performance Monitor', what: 'live and logged performance counters' },
  { q: 'ncpa.cpl', name: 'Network Connections', what: 'the Control Panel list of network adapters and their properties' },
  { q: 'appwiz.cpl', name: 'Programs and Features', what: 'the Control Panel list of installed programs' },
  { q: 'sysdm.cpl', name: 'System Properties', what: 'computer name, hardware, advanced, system protection and remote settings' },
  { q: 'firewall.cpl', name: 'Windows Defender Firewall', what: 'the Control Panel firewall settings' },
  { q: 'control', exe: true, name: 'Control Panel', what: 'the classic settings window' },
  { q: 'msinfo32', exe: true, name: 'System Information', what: 'a read-only summary of hardware, components and software' },
  { q: 'msconfig', exe: true, name: 'System Configuration', what: 'boot options and the services that load at startup' },
  { q: 'regedit', exe: true, name: 'Registry Editor', what: 'the editor for the Windows registry' },
  { q: 'taskmgr', exe: true, name: 'Task Manager', what: 'running processes, performance and startup apps' },
  { q: 'cmd', exe: true, name: 'Command Prompt', what: 'the Windows command-line shell' },
  { q: 'powershell', exe: true, name: 'Windows PowerShell', what: 'the PowerShell command-line shell' },
  { q: 'resmon', exe: true, name: 'Resource Monitor', what: 'live CPU, memory, disk and network use per process' },
  { q: 'mstsc', exe: true, name: 'Remote Desktop Connection', what: 'the client that connects to another PC with Remote Desktop' },
  { q: 'perfmon /rel', name: 'Reliability Monitor', what: 'the history of app crashes, failures and updates' },
  // A+ 220-1202 objective 1.4 tools and other Run names a technician types (Microsoft Learn: windows-commands
  // cleanmgr and mmc; Windows IoT Enterprise package Microsoft-Windows-Defrag-UI lists %windir%\system32\dfrgui.exe;
  // Windows Firewall tools (wf.msc); Administer security policy settings (Secpol.msc); Features on Demand (Notepad);
  // Shell Launcher overview (Explorer.exe is the default shell); DirectX Diagnostics API (DxDiag);
  // "What version of Windows am I running?" (winver); Microsoft Q&A on netplwiz (User Accounts).
  { q: 'wf.msc', name: 'Windows Defender Firewall with Advanced Security', what: 'the MMC snap-in for advanced firewall configuration, including the rules for inbound and outbound traffic' },
  { q: 'secpol.msc', name: 'Local Security Policy', what: 'the MMC snap-in for local security settings: account policies (password and lockout) and local policies' },
  { q: 'mmc', exe: true, name: 'Microsoft Management Console', what: 'the framework that hosts snap-ins; run with no console file it opens a new, empty console you add snap-ins to' },
  { q: 'cleanmgr', exe: true, name: 'Disk Cleanup', what: 'the tool that clears unnecessary files from a drive, such as temporary files, downloaded files and the Recycle Bin' },
  { q: 'dfrgui', exe: true, name: 'Defragment and Optimize Drives', what: 'the tool that analyzes and optimizes drives (defragments hard disks, retrims SSDs) and sets the scheduled optimization' },
  { q: 'dxdiag', exe: true, name: 'DirectX Diagnostic Tool', what: 'information about the system and its DirectX components, with tests that check they work' },
  { q: 'winver', exe: true, name: 'About Windows', what: 'the Windows version and OS build of this PC' },
  { q: 'netplwiz', exe: true, name: 'User Accounts', what: 'the classic dialog that lists local accounts, their groups, and whether users must enter a user name and password' },
  { q: 'notepad', exe: true, name: 'Notepad', what: 'the built-in plain-text editor' },
  { q: 'explorer', exe: true, name: 'File Explorer', what: 'the Windows shell (Explorer.exe): the desktop, the taskbar and the windows you browse files and folders in' },
  // A+ 220-1202 objective 1.5 command-line tools that are programs (cd, dir, md and rmdir are built into cmd.exe, so
  // Run cannot find them, as on a real PC). One-line descriptions from each Microsoft Learn windows-commands page.
  { q: 'ipconfig', exe: true, cli: true, name: 'ipconfig', what: 'shows the TCP/IP configuration of every adapter and refreshes DHCP and DNS settings' },
  { q: 'ping', exe: true, cli: true, name: 'ping', what: 'verifies IP-level connectivity to another computer with ICMP echo requests' },
  { q: 'netstat', exe: true, cli: true, name: 'netstat', what: 'shows active TCP connections, listening ports, Ethernet statistics and the routing table' },
  { q: 'nslookup', exe: true, cli: true, name: 'nslookup', what: 'queries DNS to diagnose name resolution' },
  { q: 'tracert', exe: true, cli: true, name: 'tracert', what: 'shows the path to a destination hop by hop, using ICMP with increasing TTL values' },
  { q: 'pathping', exe: true, cli: true, name: 'pathping', what: 'measures latency and packet loss at each hop between this computer and a destination' },
  { q: 'chkdsk', exe: true, cli: true, name: 'chkdsk', what: 'checks the file system and metadata of a volume for logical and physical errors' },
  { q: 'format', exe: true, cli: true, name: 'format', what: 'formats a drive to accept Windows files' },
  { q: 'diskpart', exe: true, cli: true, name: 'diskpart', what: 'manages disks, partitions and volumes from its own command interpreter' },
  { q: 'robocopy', exe: true, cli: true, name: 'robocopy', what: 'copies file data from one location to another' },
  { q: 'hostname', exe: true, cli: true, name: 'hostname', what: 'shows the host name part of the computer\'s full name' },
  { q: 'whoami', exe: true, cli: true, name: 'whoami', what: 'shows the user, groups and privileges of the signed-in user' },
  { q: 'gpupdate', exe: true, cli: true, name: 'gpupdate', what: 'updates Group Policy settings' },
  { q: 'gpresult', exe: true, cli: true, name: 'gpresult', what: 'shows the Resultant Set of Policy (RSoP) for a user and computer' },
  { q: 'sfc', exe: true, cli: true, name: 'sfc', what: 'scans protected system files and replaces incorrect versions with correct ones' },
  { q: 'net use', cli: true, name: 'net use', what: 'connects to or disconnects from a shared resource, or lists network connections' },
  { q: 'net user', cli: true, name: 'net user', what: 'adds, changes or deletes user accounts, or shows account details' },
  { q: 'perfmon', exe: true, name: 'Performance Monitor', what: 'live and logged performance counters' },
  { q: 'ms-settings:', prefix: true, name: 'a page of the Settings app', what: 'every ms-settings: link opens one Settings page' },
  { q: 'windowsdefender:', prefix: true, name: 'Windows Security', what: 'the app for virus and threat protection, firewall and device security' },
];

// PATHEXT: a command typed without an extension is looked up with each of these extensions, in order.
// Microsoft Learn, "start" (Windows Commands), Remarks: "If you run a command that uses a first token that
// isn't a command or the file path to an existing file with an extension, Cmd.exe uses the value of the
// PATHEXT environment variable to determine which extensions to look for and in what order. The default
// value for the PATHEXT variable is .COM;.EXE;.BAT;.CMD;.VBS;.VBE;.JS;.JSE;.WSF;.WSH;.MSC"
// https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/start
// .CPL is not in the list, so ncpa alone is not found (Run needs ncpa.cpl), as on a real PC.
export const PATHEXT = ['.com', '.exe', '.bat', '.cmd', '.vbs', '.vbe', '.js', '.jse', '.wsf', '.wsh', '.msc'];

// The names one Run query can resolve to: itself, then (only for one bare name with no extension, path,
// URI scheme or arguments) the name with each PATHEXT extension.
export function runNames(query) {
  const wanted = fold(query);
  if (!wanted) return [];
  if (!/^[^\s.:\\/]+$/.test(wanted)) return [wanted];
  return [wanted, ...PATHEXT.map((ext) => wanted + ext)];
}

export function windowsTool(query) {
  for (const name of runNames(query)) {
    const tool = WINDOWS_TOOLS.find((item) => item.prefix
      ? name.startsWith(item.q) && !/\s/.test(name)
      : name === item.q || (item.exe && name === `${item.q}.exe`));
    if (tool) return tool;
  }
  return null;
}

const toolNote = (query, tool) => (tool.cli
  ? `${String(query).trim()} is a command-line tool: it ${tool.what}. Run it in Command Prompt or PowerShell to read its output.`
  : `${String(query).trim()} opens ${tool.name}: ${tool.what}.`) + ' This case is practiced through another path, so nothing was opened here.';

// Single-character edit distance, stopping early once it passes max.
function editDistance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i += 1) {
    const row = [i];
    for (let j = 1; j <= b.length; j += 1) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    if (Math.min(...row) > max) return max + 1;
    prev = row;
  }
  return prev[b.length];
}

function compare(op, actual, expected) {
  switch (op) {
    case 'eq': return actual === expected;
    case 'ne': return actual !== expected;
    case 'in': return Array.isArray(expected) && expected.includes(actual);
    case 'notin': return Array.isArray(expected) && !expected.includes(actual);
    case 'gte': return typeof actual === 'number' && actual >= expected;
    case 'lte': return typeof actual === 'number' && actual <= expected;
    case 'truthy': return !!actual;
    case 'falsy': return !actual;
    case 'matches':
      try { return new RegExp(expected).test(String(actual ?? '')); } catch { return false; }
    default: return false;
  }
}

export function createSim(caseDef) {
  const windows = caseDef.skin === 'windows';
  const screens = new Map((caseDef.screens || []).map((screen) => [screen.id, screen]));
  const apps = caseDef.apps || [];
  const home = windows ? null : caseDef.home || caseDef.screens?.[0]?.id || null;
  const fresh = () => ({
    state: copy(caseDef.state || {}),
    screenId: home,
    used: { apps: windows ? [] : [caseDef.skin], screens: home ? [home] : [] },
    actions: [],
  });
  let { state, screenId, used, actions } = fresh();

  function test(predicate) {
    if (predicate === undefined || predicate === null) return true;
    if (typeof predicate === 'boolean') return predicate;
    if (predicate.all) return predicate.all.every(test);
    if (predicate.any) return predicate.any.some(test);
    if (predicate.not) return !test(predicate.not);
    if (predicate.used) {
      const [kind, id] = predicate.used.split(':');
      if (kind === 'app') return used.apps.includes(id);
      if (kind === 'screen') return used.screens.includes(id);
      if (kind === 'action') return actions.some((action) => action.id === id);
      return false;
    }
    if (predicate.op === 'eqKey') return state[predicate.key] === state[predicate.value];
    if (predicate.op === 'hasText') {
      const text = squash(state[predicate.key]);
      return [].concat(predicate.value).some((name) => squash(name) !== '' && text.includes(squash(name)));
    }
    if (predicate.op === 'hasKey') {
      const other = squash(state[predicate.value]);
      return other.length >= 4 && squash(state[predicate.key]).includes(other);
    }
    if (predicate.op === 'nearKey') {
      const a = squash(state[predicate.key]);
      const b = squash(state[predicate.value]);
      const max = Number.isInteger(predicate.max) && predicate.max >= 0 ? predicate.max : 3;
      return a !== '' && b !== '' && editDistance(a, b, max) <= max;
    }
    if (predicate.op === 'repeatedFold') {
      const value = String(state[predicate.key] ?? '').toLowerCase();
      return /^(.{2,31})\1+$/.test(value);
    }
    return compare(predicate.op, state[predicate.key], predicate.value);
  }
  const shown = (item) => test(item.visibleIf);
  const usable = (item) => shown(item) && !(item.disabledIf !== undefined && test(item.disabledIf));

  function check() {
    const goals = (caseDef.goals || []).map((goal) => ({
      id: goal.id, pass: test(goal.check), text: goal.text, why: goal.why, expect: goal.expect,
      ...(goal.weight === undefined ? {} : { weight: goal.weight }),
    }));
    const traps = (caseDef.traps || []).map((trap) => ({
      id: trap.id, hit: test(trap.check), message: trap.message, why: trap.why,
      ...(trap.critical ? { critical: true } : {}),
    }));
    return { goals, traps, score: scoreFrom(goals, traps) };
  }

  function mutate(change) {
    const before = check();
    const outcome = change();
    if (!outcome.ok) return result(false, outcome.msg);
    const after = check();
    const changed = result(true, outcome.msg,
      after.goals.filter((goal, i) => goal.pass && !before.goals[i].pass).map((goal) => goal.id),
      after.traps.filter((trap, i) => trap.hit && !before.traps[i].hit).map((trap) => trap.id));
    return outcome.info ? { ...changed, info: true } : changed;
  }

  function interpolate(value) {
    if (typeof value === 'string') return value.replace(/\{\{([^}]+)\}\}/g, (_, key) => String(state[key.trim()] ?? ''));
    if (Array.isArray(value)) return value.map(interpolate);
    return value;
  }

  function enter(id) {
    const screen = screens.get(id);
    if (!screen) return result(false, `There is no screen named ${id}.`);
    screenId = id;
    if (!used.screens.includes(id)) used.screens.push(id);
    if (screen.app && !used.apps.includes(screen.app)) used.apps.push(screen.app);
    return result(true, interpolate(screen.title));
  }

  // The case's own names win: the query as typed, then its PATHEXT forms (devmgmt -> devmgmt.msc).
  function findLaunch(query) {
    for (const wanted of runNames(query)) {
      for (const app of apps) {
        for (const entry of [app.name, ...(app.launch || [])]) {
          const q = typeof entry === 'object' && entry !== null ? entry.q : entry;
          if (fold(q) === wanted) return { app, screen: entry.screen || app.home };
        }
      }
    }
    return null;
  }

  function currentControl(id) {
    const control = screens.get(screenId)?.controls?.find((item) => item.id === id);
    return control && usable(control) ? control : null;
  }

  function validValue(control, value) {
    if (control.type === 'toggle') return typeof value === 'boolean';
    if (control.type === 'select') return (control.options || []).some((option) => optionValue(option) === value);
    if (control.type === 'number') {
      return typeof value === 'number' && Number.isFinite(value)
        && !(control.min !== undefined && value < control.min) && !(control.max !== undefined && value > control.max);
    }
    return typeof value === 'string';
  }

  function run(action, record) {
    if (action.refuse !== undefined) return result(false, interpolate(String(action.refuse)));
    if (action.open && !screens.has(action.open)) return result(false, `There is no screen named ${action.open}.`);
    const copied = {};
    if (action.copyPrefix) {
      const { from, to } = action.copyPrefix;
      if (typeof from !== 'string' || !from || typeof to !== 'string' || !to) return result(false, 'That copy prefix is not valid.');
      for (const key of Object.keys(state)) {
        if (key.startsWith(from)) copied[to + key.slice(from.length)] = copy(state[key]);
      }
    }
    if (action.copy) {
      if (typeof action.copy !== 'object' || Array.isArray(action.copy)) return result(false, 'That copy map is not valid.');
      for (const [target, source] of Object.entries(action.copy)) {
        if (typeof source !== 'string' || !Object.hasOwn(state, source)) return result(false, `There is no state value named ${source}.`);
        copied[target] = copy(state[source]);
      }
    }
    Object.assign(state, copied, copy(action.set || {}));
    actions.push({ ...record, ...(action.log ? { log: action.log } : {}) });
    const opened = action.open ? enter(action.open).msg : 'Done.';
    return result(true, action.msg ? interpolate(action.msg) : opened);
  }

  function resolveRow(row) {
    return {
      ...row, visible: shown(row), cells: interpolate(row.cells || []), status: interpolate(row.status),
      actions: (row.actions || []).map((action) => ({ ...action, visible: shown(action), enabled: usable(action) })),
    };
  }

  function resolve(control) {
    return {
      ...control, visible: shown(control), enabled: usable(control),
      ...(control.key ? { value: state[control.key] } : {}),
      ...(control.text !== undefined ? { text: interpolate(control.text) } : {}),
      ...(control.values ? { values: control.values.map(interpolate) } : {}),
      ...(control.rows ? { rows: control.rows.map(resolveRow) } : {}),
    };
  }

  function load(saved) {
    ({ state, screenId, used, actions } = copy(saved));
  }

  function validSnapshot(saved) {
    return saved && typeof saved === 'object' && saved.state && typeof saved.state === 'object'
      && (saved.screenId === null || screens.has(saved.screenId))
      && Array.isArray(saved.used?.apps) && Array.isArray(saved.used?.screens) && Array.isArray(saved.actions);
  }

  return {
    get state() { return copy(state); },
    get used() { return copy(used); },
    get actions() { return copy(actions); },
    get screenId() { return screenId; },
    launch(query) {
      return mutate(() => {
        if (!windows) return result(false, 'This device has no Start search or Run box.');
        const found = findLaunch(query);
        if (!found) {
          const tool = windowsTool(query);
          return tool ? { ...result(true, toolNote(query, tool)), info: true } : result(false, runError(query));
        }
        if (!used.apps.includes(found.app.id)) used.apps.push(found.app.id);
        actions.push({ id: `launch:${found.app.id}`, type: 'launch', query: String(query) });
        return enter(found.screen);
      });
    },
    open(id) {
      return mutate(() => {
        const screen = screens.get(id);
        if (!screen) return result(false, `There is no screen named ${id}.`);
        if (windows && !used.apps.includes(screen.app)) return result(false, 'Open that app first from Start search or Run.');
        actions.push({ id: `open:${id}`, type: 'open' });
        return enter(id);
      });
    },
    set(controlId, value) {
      return mutate(() => {
        const control = currentControl(controlId);
        if (!control) return result(false, `${controlId} is not available on this screen.`);
        if (!SETTABLE.includes(control.type) || !control.key) return result(false, `${control.label || controlId} cannot be changed.`);
        if (!validValue(control, value)) return result(false, `${control.label || controlId} does not accept that value.`);
        state[control.key] = value;
        actions.push({ id: controlId, type: 'set', value });
        return result(true, `${control.label || controlId} changed.`);
      });
    },
    act(controlId, rowId, actionId) {
      return mutate(() => {
        const control = currentControl(controlId);
        if (!control) return result(false, `${controlId} is not available on this screen.`);
        if (control.type === 'link') {
          actions.push({ id: controlId, type: 'link' });
          return enter(control.screen);
        }
        if (control.type === 'button') return run(control.action || {}, { id: controlId, type: 'act' });
        if (control.type !== 'list') return result(false, `${control.label || controlId} cannot be clicked.`);
        const row = (control.rows || []).find((item) => item.id === rowId && shown(item));
        const choice = row?.actions?.find((item) => item.id === actionId);
        if (!choice || !usable(choice)) return result(false, `That action is not available for ${rowId}.`);
        return run(choice.action || {}, { id: actionId, type: 'act', controlId, rowId });
      });
    },
    view() {
      const screen = screens.get(screenId);
      return screen ? { ...screen, title: interpolate(screen.title), crumbs: interpolate(screen.crumbs || []), controls: (screen.controls || []).map(resolve) } : null;
    },
    check,
    snapshot() { return copy({ state, screenId, used, actions }); },
    restore(saved) {
      if (!validSnapshot(saved)) return result(false, 'That saved state is not valid.');
      return mutate(() => { load(saved); return result(true, 'State restored.'); });
    },
    reset() {
      return mutate(() => { load(fresh()); return result(true, 'Back to the start state.'); });
    },
  };
}

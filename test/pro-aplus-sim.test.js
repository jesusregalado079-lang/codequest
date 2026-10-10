import assert from 'node:assert/strict';
import { createCoach, createNextAttemptAssistance, createPendingAssistStore, PENDING_ASSIST_KEY, scoreFrom, MODES, CRITICAL_CAP } from '../src/pro/labs/aplus/coach.js';
import { createSim, windowsTool, runNames, PATHEXT, WINDOWS_TOOLS } from '../src/pro/labs/aplus/sim.js';
import winCases from '../src/pro/labs/aplus/content/win-cases.js';
import routerCases from '../src/pro/labs/aplus/content/router-cases.js';
import mobprintCases from '../src/pro/labs/aplus/content/mobprint-cases.js';
import * as L from '../src/pro/labs/lab-logic.js';

const shape = (outcome) => {
  // info: true only on a Run fallback reply (ok, nothing opened)
  const keys = Object.keys(outcome).sort();
  assert.deepEqual(keys.filter((key) => key !== 'info'), ['goalsChanged', 'msg', 'ok', 'trapsHit']);
  if (keys.includes('info')) assert.equal(outcome.info, true);
  assert.equal(typeof outcome.ok, 'boolean');
  assert.equal(typeof outcome.msg, 'string');
  assert.ok(Array.isArray(outcome.goalsChanged) && Array.isArray(outcome.trapsHit));
  return outcome;
};
const ok = (outcome) => { assert.equal(shape(outcome).ok, true, outcome.msg); return outcome; };
const no = (outcome) => { assert.equal(shape(outcome).ok, false); assert.deepEqual([outcome.goalsChanged, outcome.trapsHit], [[], []]); return outcome; };
const play = (sim, { do: step }) => {
  if (step.type === 'launch') return sim.launch(step.query);
  if (step.type === 'open') return sim.open(step.screenId);
  if (step.type === 'set') return sim.set(step.controlId, step.value);
  return sim.act(step.controlId, step.rowId, step.actionId);
};
const control = (sim, id) => sim.view().controls.find((item) => item.id === id);

// scoreFrom: SPEC 2.4.
assert.equal(scoreFrom([], []), 0);
assert.equal(scoreFrom(null, null), 0);
assert.equal(scoreFrom([{ pass: true }, { pass: false }], []), 50);
assert.equal(scoreFrom([{ pass: true }, { pass: true }, { pass: true }], []), 100);
assert.equal(scoreFrom([{ pass: true }, { pass: true }, { pass: false }], []), 67);
assert.equal(scoreFrom([{ pass: true }, { pass: true }], [{ hit: true }]), 50, 'a trap removes one goal worth');
assert.equal(scoreFrom([{ pass: true }, { pass: true }], [{ hit: false, critical: true }]), 100, 'traps not hit cost nothing');
assert.equal(scoreFrom(Array(5).fill({ pass: true }), [{ hit: true, critical: true }]), CRITICAL_CAP, 'critical caps at 60');
assert.equal(scoreFrom([{ pass: true }, { pass: true }], [{ hit: true, critical: true }]), 50, 'cap only lowers');
assert.equal(scoreFrom([{ pass: false }], [{ hit: true }, { hit: true }]), 0, 'floor 0');
assert.equal(scoreFrom([{ pass: true, weight: 3 }, { pass: false, weight: 1 }], []), 75, 'weights');
assert.equal(scoreFrom([{ pass: true, weight: 3 }, { pass: true, weight: 1 }], [{ hit: true }]), 50, 'trap = average goal worth');
assert.equal(scoreFrom([{ pass: true, weight: 0 }, { pass: false }], []), 50, 'invalid weight counts as 1');

// The three seed cases: start below pass, solution reaches 100, trapDemo hits every trap, snapshot/reset/restore.
for (const caseDef of [winCases[0], routerCases[0], mobprintCases[0]]) {
  const sim = createSim(caseDef);
  const start = sim.check();
  assert.ok(start.score < 80, `${caseDef.id} starts below pass (${start.score})`);
  assert.deepEqual(start.goals.map((goal) => goal.id), caseDef.goals.map((goal) => goal.id));
  for (const goal of start.goals) assert.ok(goal.text && goal.why && goal.expect, `${caseDef.id}/${goal.id} result fields`);
  const changed = [];
  for (const step of caseDef.solution) changed.push(...ok(play(sim, step)).goalsChanged);
  const done = sim.check();
  assert.equal(done.score, 100, `${caseDef.id} solution scores 100`);
  assert.ok(done.goals.every((goal) => goal.pass) && done.traps.every((trap) => !trap.hit));
  assert.deepEqual([...changed].sort(), start.goals.filter((goal) => !goal.pass).map((goal) => goal.id).sort(), `${caseDef.id} goalsChanged reports each newly passed goal`);
  const saved = JSON.parse(JSON.stringify(sim.snapshot()));
  assert.ok(ok(sim.reset()).goalsChanged.length === 0);
  assert.equal(sim.check().score, start.score);
  assert.deepEqual(sim.snapshot().state, caseDef.state);
  assert.deepEqual(ok(sim.restore(saved)).goalsChanged.sort(), [...changed].sort());
  assert.equal(sim.check().score, 100);
  assert.deepEqual(sim.snapshot(), saved);
  no(sim.restore({}));
  no(sim.restore({ ...saved, screenId: 'missing' }));
  no(sim.restore(null));

  const demo = createSim(caseDef);
  const hit = new Set(demo.check().traps.filter((trap) => trap.hit).map((trap) => trap.id));
  for (const step of caseDef.trapDemo) ok(play(demo, step)).trapsHit.forEach((id) => hit.add(id));
  assert.deepEqual([...hit].sort(), caseDef.traps.map((trap) => trap.id).sort(), `${caseDef.id} trapDemo reaches every trap`);
  assert.ok(demo.check().score < 80);
}

// Windows skin: launch aliases, desktop start, app gating, list row actions, confirm metadata, interpolation.
{
  const win = createSim(winCases[0]);
  assert.equal(win.screenId, null);
  assert.equal(win.view(), null, 'Windows starts on the desktop');
  assert.deepEqual(win.used, { apps: [], screens: [] });
  no(win.open('devices'));
  const missing = no(win.launch('devmgmtt'));
  assert.equal(missing.msg, "Windows cannot find 'devmgmtt'. Make sure you typed the name correctly, and then try again.");
  const opened = ok(win.launch('  DEVICE   Manager '));
  assert.deepEqual(opened.goalsChanged, ['open-devmgmt']);
  assert.equal(win.screenId, 'devices');
  assert.deepEqual(win.used.apps, ['devmgmt']);
  assert.equal(opened.info, undefined, 'a launch that opens an app is not an info reply');
  ok(win.launch('DEVMGMT.MSC'));
  assert.deepEqual(ok(win.launch('devmgmt.msc')).goalsChanged, [], 'goals only report newly passed');
  ok(win.launch('ms-settings:'));
  assert.equal(win.screenId, 'settings-home');
  ok(win.launch('MS-Settings:WindowsUpdate'));
  assert.equal(win.screenId, 'windows-update', 'ms-settings deep link opens its own page');
  assert.equal(control(win, 'update-status').text, "You're up to date");
  ok(win.open('devices'));
  assert.equal(win.view().title, 'Device Manager');
  const list = control(win, 'devices');
  const serial = list.rows.find((row) => row.id === 'serial');
  assert.deepEqual(serial.cells, ['Other devices', 'USB-Serial Controller']);
  assert.equal(serial.status, 'The drivers for this device are not installed. (Code 28)');
  const hub = list.rows.find((row) => row.id === 'hub');
  assert.deepEqual(hub.actions.map((action) => [action.id, action.visible, action.enabled]), [['disable', true, true], ['enable', false, false]]);
  assert.match(hub.actions[0].action.confirm, /Do you really want to disable it\?/);
  no(win.act('devices', 'hub', 'enable'));
  no(win.act('devices', 'serial', 'bogus'));
  no(win.act('devices', 'ghost', 'properties'));
  const trap = ok(win.act('devices', 'hub', 'disable'));
  assert.deepEqual(trap.trapsHit, ['hub-disabled']);
  assert.equal(control(win, 'devices').rows.find((row) => row.id === 'hub').status, 'This device is disabled. (Code 22)');
  assert.deepEqual(ok(win.act('devices', 'hub', 'enable')).trapsHit, []);
  assert.equal(win.check().traps[0].hit, false);
  ok(win.act('devices', 'serial', 'uninstall'));
  assert.equal(control(win, 'devices').rows.find((row) => row.id === 'serial').visible, false, 'row visibleIf');
  no(win.act('devices', 'serial', 'properties'));
  ok(win.act('scan'));
  const props = ok(win.act('devices', 'serial', 'properties'));
  assert.deepEqual(props.goalsChanged, ['read-status']);
  assert.equal(props.msg, 'USB-Serial Controller Properties', 'action.open reports the interpolated title');
  assert.deepEqual(win.view().crumbs, ['DESK-07', 'USB-Serial Controller']);
  assert.deepEqual(control(win, 'general').values[3], ['Device status', 'The drivers for this device are not installed. (Code 28)']);
  ok(win.act('props-update'));
  assert.equal(ok(win.act('auto')).msg, 'Automatic search did not find a compatible driver. Browse to the extracted manufacturer package.');
  ok(win.act('browse'));
  assert.equal(control(win, 'next').visible, false);
  assert.equal(ok(win.act('next-none')).goalsChanged.length, 0);
  no(win.act('next'));
  ok(win.set('path', 'C:\\Drivers'));
  ok(win.set('subfolders', false));
  assert.equal(control(win, 'next').visible, false, 'parent folder needs Include subfolders');
  ok(win.set('subfolders', true));
  assert.equal(control(win, 'next').visible, true);
  const installed = ok(win.act('next'));
  assert.deepEqual(installed.goalsChanged, ['install-driver']);
  assert.equal(win.screenId, 'devices');
  assert.deepEqual(control(win, 'devices').rows.find((row) => row.id === 'serial').cells, ['Ports (COM & LPT)', 'USB Serial Port (COM3)']);
  assert.equal(win.check().score, 100);
  const kinds = win.actions.map((action) => action.type);
  for (const kind of ['launch', 'open', 'act', 'set', 'link']) assert.ok(kinds.includes(kind), `actions log records ${kind}`);
  assert.equal(JSON.stringify(win.snapshot()), JSON.stringify(JSON.parse(JSON.stringify(win.snapshot()))), 'snapshot is plain JSON');
}

// Every control type, visibleIf/disabledIf, predicates, implicit app on a non-windows skin.
const fixture = {
  id: 'fixture', skin: 'printer',
  state: { flag: false, choice: 'a', name: '', secret: '', count: 0, fixed: false, tags: 'x' },
  screens: [
    { id: 'home', title: 'Home {{name}}', controls: [
      { id: 'flag', type: 'toggle', label: 'Flag', key: 'flag' },
      { id: 'choice', type: 'select', key: 'choice', options: ['a', { value: 'b', label: 'B' }] },
      { id: 'name', type: 'text', key: 'name' },
      { id: 'secret', type: 'password', key: 'secret' },
      { id: 'count', type: 'number', key: 'count', min: 0, max: 10 },
      { id: 'fix', type: 'button', action: { set: { fixed: true }, msg: 'Fixed for {{name}}', log: 'fixed' } },
      { id: 'rows', type: 'list', rows: [{ id: 'one', cells: ['{{name}}', 'static'], status: '{{count}}', actions: [
        { id: 'clear', label: 'Clear', action: { set: { fixed: false } } },
        { id: 'locked', label: 'Locked', disabledIf: { key: 'flag', op: 'falsy' }, action: { set: { tags: 'y' } } },
      ] }] },
      { id: 'info', type: 'info', text: 'Name: {{name}} / {{missing}}' },
      { id: 'hidden', type: 'text', key: 'name', visibleIf: { key: 'flag', op: 'truthy' } },
      { id: 'disabled', type: 'button', disabledIf: { key: 'flag', op: 'falsy' }, action: { set: { tags: 'z' } } },
      { id: 'bad-link', type: 'button', action: { open: 'nowhere', set: { fixed: true } } },
      { id: 'next', type: 'link', label: 'Other', screen: 'other' },
    ] },
    { id: 'other', title: 'Other', controls: [] },
  ],
  goals: [
    { id: 'all', text: 'all', check: { all: [{ key: 'flag', op: 'eq', value: true }, { key: 'choice', op: 'in', value: ['b'] }] } },
    { id: 'any', text: 'any', check: { any: [{ key: 'name', op: 'matches', value: '^A' }, { key: 'count', op: 'gte', value: 5 }] } },
    { id: 'not', text: 'not', check: { not: { key: 'fixed', op: 'truthy' } } },
    { id: 'used', text: 'used', check: { all: [{ used: 'screen:other' }, { used: 'app:printer' }, { used: 'action:fix' }] } },
    { id: 'less', text: 'less', check: { all: [{ key: 'count', op: 'lte', value: 3 }, { key: 'choice', op: 'notin', value: ['a'] }, { key: 'secret', op: 'ne', value: '' }] } },
  ],
  traps: [
    { id: 'fixed', message: 'fixed', check: { key: 'fixed', op: 'eq', value: true } },
    { id: 'bad-regex', message: 'never', check: { key: 'name', op: 'matches', value: '(' } },
    { id: 'bad-op', message: 'never', check: { key: 'name', op: 'nope', value: 1 } },
    { id: 'bad-used', message: 'never', check: { used: 'widget:x' } },
  ],
};
{
  const sim = createSim(fixture);
  assert.equal(sim.screenId, 'home', 'non-windows skins start on their first screen');
  assert.deepEqual(sim.used, { apps: ['printer'], screens: ['home'] });
  no(sim.launch('anything'));
  assert.deepEqual(sim.check().goals.filter((goal) => goal.pass).map((goal) => goal.id), ['not']);
  assert.equal(control(sim, 'hidden').visible, false);
  assert.equal(control(sim, 'disabled').enabled, false);
  assert.equal(control(sim, 'rows').rows[0].actions[1].enabled, false);
  no(sim.set('hidden', 'x'));
  no(sim.act('disabled'));
  no(sim.act('rows', 'one', 'locked'));
  no(sim.set('nope', 1));
  no(sim.set('flag', 'yes'));
  no(sim.set('choice', 'c'));
  no(sim.set('name', 3));
  no(sim.set('secret', null));
  no(sim.set('count', '2'));
  no(sim.set('count', 11));
  no(sim.set('count', -1));
  no(sim.set('count', NaN));
  no(sim.set('info', 'x'));
  no(sim.set('fix', true));
  no(sim.act('flag'));
  no(sim.act('info'));
  const badLink = no(sim.act('bad-link'));
  assert.match(badLink.msg, /nowhere/);
  assert.equal(sim.state.fixed, false, 'a failed action changes nothing');
  assert.equal(ok(sim.set('flag', true)).msg, 'Flag changed.');
  assert.equal(control(sim, 'hidden').visible, true);
  assert.equal(control(sim, 'disabled').enabled, true);
  assert.deepEqual(ok(sim.set('choice', 'b')).goalsChanged, ['all']);
  ok(sim.set('hidden', 'Alice'));
  assert.equal(sim.state.name, 'Alice');
  assert.equal(sim.view().title, 'Home Alice');
  assert.equal(control(sim, 'name').value, 'Alice');
  assert.equal(control(sim, 'info').text, 'Name: Alice / ');
  assert.deepEqual(ok(sim.set('secret', 'private')).goalsChanged, ['less']);
  assert.deepEqual(ok(sim.set('count', 2)).goalsChanged, []);
  assert.deepEqual(control(sim, 'rows').rows[0].cells, ['Alice', 'static']);
  assert.equal(control(sim, 'rows').rows[0].status, '2');
  const fixed = ok(sim.act('fix'));
  assert.deepEqual(fixed.trapsHit, ['fixed']);
  assert.equal(fixed.msg, 'Fixed for Alice');
  assert.equal(sim.actions.find((action) => action.id === 'fix').log, 'fixed');
  assert.deepEqual(ok(sim.act('fix')).trapsHit, [], 'a trap already hit is not reported again');
  ok(sim.act('rows', 'one', 'locked'));
  assert.equal(sim.state.tags, 'y');
  assert.deepEqual(ok(sim.act('rows', 'one', 'clear')).goalsChanged, ['not']);
  ok(sim.act('next'));
  assert.equal(sim.screenId, 'other');
  ok(sim.open('home'));
  ok(sim.set('count', 5));
  assert.deepEqual(sim.check().goals.map((goal) => [goal.id, goal.pass]), [['all', true], ['any', true], ['not', true], ['used', true], ['less', false]]);
  assert.deepEqual(sim.check().traps.map((trap) => trap.hit), [false, false, false, false]);
  no(sim.open('missing'));
  const state = sim.state;
  state.flag = false;
  assert.equal(sim.state.flag, true, 'state getter returns a copy');
}

// eqKey compares one state key to another state key, and works inside not.
{
  const sim = createSim({
    skin: 'router', state: { a: 'same-value', b: 'other-value', c: 'same-value' },
    screens: [{ id: 'home', controls: [{ id: 'b', type: 'password', label: 'B', key: 'b' }] }],
    goals: [
      { id: 'differ', check: { not: { key: 'a', op: 'eqKey', value: 'b' } } },
      { id: 'equal', check: { key: 'a', op: 'eqKey', value: 'c' } },
      { id: 'missing', check: { key: 'a', op: 'eqKey', value: 'absent' } },
    ],
    traps: [{ id: 'reuse', check: { key: 'a', op: 'eqKey', value: 'b' } }],
  });
  assert.deepEqual(sim.check().goals.map((goal) => goal.pass), [true, true, false]);
  assert.equal(sim.check().traps[0].hit, false);
  const changed = ok(sim.set('b', 'same-value'));
  assert.deepEqual(changed.trapsHit, ['reuse']);
  assert.deepEqual(sim.check().goals.map((goal) => goal.pass), [false, true, false]);
  assert.equal(sim.check().traps[0].hit, true);
  ok(sim.set('b', 'Same-Value'));
  assert.equal(sim.check().goals[0].pass, true, 'eqKey is case-sensitive, like eq');
}

// action.refuse rejects with its (interpolated) message and changes nothing.
{
  const sim = createSim({
    skin: 'printer', state: { name: 'bad value', saved: false },
    screens: [{ id: 'home', controls: [
      { id: 'save', type: 'button', action: { refuse: 'Cannot save {{name}}.', set: { saved: true }, open: 'home' } },
    ] }],
  });
  const before = sim.snapshot();
  assert.equal(no(sim.act('save')).msg, 'Cannot save bad value.');
  assert.deepEqual(sim.snapshot(), before);
}

// win-07 Manual IPv4 Save refuses blank or malformed fields, field by field, and leaves applied values alone.
{
  const sim = createSim(winCases.find((caseDef) => caseDef.id === 'win-07'));
  const saveButton = () => sim.view().controls.filter((item) => item.id.startsWith('eth-save') && item.visible);
  ok(sim.launch('ms-settings:network-ethernet'));
  ok(sim.act('eth-edit'));
  ok(sim.set('eth-mode', 'Manual'));
  ok(sim.set('eth-v4', true));
  const tries = [
    [null, null, 'eth-save-invalid-ip', /Enter an IP address/],
    ['eth-ip', '192.168.40.256', 'eth-save-invalid-ip-format', /192\.168\.40\.256 is not a valid IPv4 address/],
    ['eth-ip', '192.168.40.25', 'eth-save-invalid-mask', /Enter a subnet mask/],
    ['eth-mask', '255.0.255.0', 'eth-save-invalid-mask-format', /subnet mask 255\.0\.255\.0 is not valid/],
    ['eth-mask', '0.0.0.0', 'eth-save-invalid-mask-format', /subnet mask 0\.0\.0\.0 is not valid/],
    ['eth-mask', '255.255.255.0', null, null],
    ['eth-gw', '192.168.40', 'eth-save-invalid-gw-format', /gateway 192\.168\.40 is not a valid/],
    ['eth-gw', '192.168.40.1', null, null],
    ['eth-dns1', 'dns.example', 'eth-save-invalid-dns1-format', /preferred DNS server dns\.example/],
    ['eth-dns1', '192.168.40.10', null, null],
    ['eth-dns2', '192.168.40.11.5', 'eth-save-invalid-dns2-format', /alternate DNS server 192\.168\.40\.11\.5/],
  ];
  for (const [field, value, refuseId, pattern] of tries) {
    if (field) ok(sim.set(field, value));
    if (!refuseId) continue;
    assert.deepEqual(saveButton().map((item) => item.id), [refuseId], `one Save for ${field}=${value}`);
    const before = sim.snapshot();
    assert.match(no(sim.act(refuseId)).msg, pattern);
    assert.deepEqual(sim.snapshot(), before, `${refuseId} changes nothing`);
    assert.equal(sim.state['eth.saved'], false);
    assert.equal(sim.state['eth.ap.mode'], 'Automatic (DHCP)');
  }
  ok(sim.set('eth-dns2', ''));
  assert.deepEqual(saveButton().map((item) => item.id), ['eth-save-addr-gwok-dnsother'], 'blank alternate DNS is savable');
  ok(sim.set('eth-dns2', '192.168.40.11'));
  ok(sim.set('eth-ip', '192.168.40.26'));
  assert.deepEqual(saveButton().map((item) => item.id), ['eth-save-noaddr-gwok-dnsok'], 'well-formed wrong address stays savable');
  ok(sim.set('eth-ip', ' 192.168.40.25 '));
  ok(sim.act('eth-save'));
  assert.equal(sim.check().score, 100);
}

// Action copy reads a single pre-action state, supports prefixes, and rejects missing sources atomically.
{
  const sim = createSim({
    skin: 'printer', state: { a: 'A', b: 'B', 'form.ip': '10.0.0.1', 'form.gw': '10.0.0.254', 'saved.ip': 'old', 'saved.gw': 'old' },
    screens: [{ id: 'home', controls: [
      { id: 'swap', type: 'button', action: { copy: { a: 'b', b: 'a' } } },
      { id: 'save', type: 'button', action: { copyPrefix: { from: 'form.', to: 'saved.' } } },
      { id: 'restore', type: 'button', action: { copy: { 'form.ip': 'saved.ip', a: 'b' }, set: { a: 'set wins' } } },
      { id: 'missing', type: 'button', action: { copy: { a: 'b', b: 'absent' } } },
    ] }],
  });
  ok(sim.act('swap'));
  assert.deepEqual([sim.state.a, sim.state.b], ['B', 'A']);
  ok(sim.act('save'));
  assert.equal(sim.state['saved.ip'], '10.0.0.1');
  assert.equal(sim.state['saved.gw'], '10.0.0.254');
  ok(sim.act('restore'));
  assert.deepEqual([sim.state['form.ip'], sim.state.a], ['10.0.0.1', 'set wins']);
  const before = sim.snapshot();
  no(sim.act('missing'));
  assert.deepEqual(sim.snapshot(), before);
}

// Ethernet always displays committed settings, including after a wrong Save and abandoned edits.
{
  const sim = createSim(winCases.find((caseDef) => caseDef.id === 'win-07'));
  ok(sim.launch('ms-settings:network-ethernet'));
  ok(sim.act('eth-edit'));
  ok(sim.set('eth-mode', 'Manual'));
  ok(sim.set('eth-v4', true));
  ok(sim.set('eth-ip', '192.168.40.25'));
  ok(sim.set('eth-mask', '255.255.255.0'));
  ok(sim.set('eth-gw', '10.0.0.1'));
  ok(sim.set('eth-dns1', '192.168.40.10'));
  ok(sim.set('eth-dns2', '192.168.40.11'));
  ok(sim.act('eth-save-addr-gwoff-dnsok'));
  assert.equal(control(sim, 'eth-manual-info').values[3][1], '10.0.0.1');
  ok(sim.act('eth-edit'));
  ok(sim.set('eth-gw', '192.168.40.1'));
  ok(sim.act('eth-cancel-other'));
  assert.equal(control(sim, 'eth-manual-info').values[3][1], '10.0.0.1');
  assert.equal(sim.state['eth.gw'], '10.0.0.1');
  assert.ok(sim.check().score < 80);
  ok(sim.act('eth-edit'));
  ok(sim.set('eth-gw', '192.168.40.1'));
  ok(sim.open('eth'));
  assert.equal(control(sim, 'eth-manual-info').values[3][1], '10.0.0.1');
  ok(sim.act('eth-edit'));
  assert.equal(control(sim, 'eth-gw').value, '10.0.0.1');
  ok(sim.set('eth-gw', '192.168.40.1'));
  ok(sim.act('eth-save'));
  assert.equal(control(sim, 'eth-manual-info').values[3][1], '192.168.40.1');
  assert.equal(sim.check().score, 100);
}

// Select Users accepts both local accounts in either group dialog.
{
  const sim = createSim(winCases.find((caseDef) => caseDef.id === 'win-06'));
  ok(sim.launch('lusrmgr.msc'));
  ok(sim.act('nav-groups'));
  ok(sim.act('groups', 'rdu', 'properties'));
  ok(sim.act('rdu-add'));
  ok(sim.set('names', 'DRAFT-11\\cedaradmin'));
  assert.equal(control(sim, 'select-ok-none').visible, false);
  ok(sim.act('select-ok-cedaradmin'));
  assert.equal(sim.state['rdu.cedaradmin'], true);
  assert.equal(control(sim, 'rdu-members').rows.find((row) => row.id === 'cedaradmin').visible, true);
}

// Run fallback: real Windows 11 tools the case does not model answer truthfully, open nothing,
// change nothing and are not wrong actions; the case's own aliases always win.
{
  const caseDef = winCases[0];
  const sim = createSim(caseDef);
  const before = JSON.stringify(sim.snapshot());
  for (const [query, name] of [['ncpa.cpl', 'Network Connections'], ['compmgmt.msc', 'Computer Management'], ['  WindowsDefender://threat ', 'Windows Security'],
    ['ms-settings:network-wifi', 'Settings'], ['regedit.exe', 'Registry Editor'], ['perfmon /rel', 'Reliability Monitor'], ['perfmon', 'Performance Monitor'],
    ['appwiz.cpl', 'Programs and Features'], ['services.msc', 'Services'], ['mstsc', 'Remote Desktop Connection']]) {
    const reply = ok(sim.launch(query));
    assert.ok(reply.msg.startsWith(`${query.trim()} opens `) && reply.msg.includes(name), `${query}: ${reply.msg}`);
    assert.match(reply.msg, /practiced through another path, so nothing was opened here\.$/);
    assert.deepEqual([reply.goalsChanged, reply.trapsHit], [[], []]);
    assert.doesNotMatch(reply.msg, /cannot find/);
  }
  assert.equal(JSON.stringify(sim.snapshot()), before, 'a catalog reply opens nothing, logs nothing and changes no state');
  assert.equal(sim.screenId, null);
  assert.equal(no(sim.launch('ncpa')).msg, "Windows cannot find 'ncpa'. Make sure you typed the name correctly, and then try again.");
  no(sim.launch('ms-settings: network'));
  no(sim.launch('notepad++.msc'));
  assert.equal(ok(sim.launch('devmgmt.msc')).msg, 'Device Manager', 'the case alias wins over the catalog');
  assert.equal(sim.screenId, 'devices');
  ok(sim.launch('ms-settings:windowsupdate'));
  assert.equal(sim.screenId, 'windows-update', 'case deep links win over the ms-settings: catalog entry');
  assert.equal(windowsTool('CMD.EXE').name, 'Command Prompt');
  assert.equal(windowsTool('cmd.msc'), null, 'only listed launch names match');
  assert.equal(windowsTool(''), null);
  assert.ok(WINDOWS_TOOLS.every((tool) => tool.q && tool.name && tool.what));

  const coach = createCoach(caseDef);
  const fresh = createSim(caseDef);
  const seen = coach.observe(fresh.launch('ncpa.cpl'));
  assert.equal(seen.wrongActions, 0, 'a catalog reply is not a wrong action');
  assert.deepEqual(seen.messages, []);
  assert.equal(coach.observe(fresh.launch('nonsense')).wrongActions, 1, 'an unknown name still is');

  const win06 = createSim(winCases.find((item) => item.id === 'win-06'));
  const opened = ok(win06.launch('compmgmt.msc'));
  assert.equal(win06.screenId, 'lusr-users', 'win-06: Computer Management > System Tools > Local Users and Groups');
  assert.equal(opened.msg, 'Users');
  assert.deepEqual(win06.used.apps, ['lusrmgr']);
  no(createSim(routerCases[0]).launch('ncpa.cpl'));
}

// Run resolves a bare name through PATHEXT (Microsoft Learn, start: .COM;.EXE;...;.MSC), case aliases first,
// then the catalog; .cpl is not in PATHEXT, and nonsense still gets the real Windows error.
{
  assert.deepEqual(PATHEXT.slice(-1), ['.msc']);
  assert.ok(!PATHEXT.includes('.cpl'));
  assert.deepEqual(runNames(' DevMgmt ').slice(0, 3), ['devmgmt', 'devmgmt.com', 'devmgmt.exe']);
  assert.equal(runNames('devmgmt').at(-1), 'devmgmt.msc');
  for (const q of ['devmgmt.msc', 'ms-settings:windowsupdate', 'perfmon /rel', 'device manager', 'c:\\windows']) assert.deepEqual(runNames(q), [q], q);
  assert.deepEqual(runNames('   '), []);

  // case alias, with and without the extension
  for (const query of ['devmgmt', 'DEVMGMT', 'devmgmt.msc']) {
    const sim = createSim(winCases[0]);
    const reply = ok(sim.launch(query));
    assert.equal(sim.screenId, 'devices', query);
    assert.deepEqual(sim.used.apps, ['devmgmt'], query);
    assert.deepEqual(reply.goalsChanged, ['open-devmgmt'], query);
    assert.equal(reply.info, undefined, query);
    assert.equal(sim.actions[0].query, query, 'the launch logs what was typed');
  }
  const win06 = createSim(winCases.find((item) => item.id === 'win-06'));
  ok(win06.launch('lusrmgr'));
  assert.deepEqual(win06.used.apps, ['lusrmgr'], 'lusrmgr resolves to the case alias lusrmgr.msc');

  // catalog fallback, with and without the extension: same tool, info reply, nothing changes
  const sim = createSim(winCases[0]);
  const before = JSON.stringify(sim.snapshot());
  for (const [bare, full, name] of [['services', 'services.msc', 'Services'], ['eventvwr', 'eventvwr.msc', 'Event Viewer'],
    ['diskmgmt', 'diskmgmt.msc', 'Disk Management'], ['compmgmt', 'compmgmt.msc', 'Computer Management'], ['regedit', 'regedit.exe', 'Registry Editor'],
    ['taskschd', 'taskschd.msc', 'Task Scheduler']]) {
    for (const query of [bare, full]) {
      const reply = ok(sim.launch(query));
      assert.equal(reply.info, true, query);
      assert.ok(reply.msg.startsWith(`${query} opens ${name}`), `${query}: ${reply.msg}`);
      assert.deepEqual([reply.goalsChanged, reply.trapsHit], [[], []]);
    }
    assert.equal(windowsTool(bare), windowsTool(full), bare);
  }
  assert.equal(windowsTool('perfmon').q, 'perfmon', 'perfmon runs perfmon.exe: .EXE comes before .MSC in PATHEXT');
  assert.equal(JSON.stringify(sim.snapshot()), before, 'PATHEXT catalog replies open nothing and change nothing');

  // nonsense and non-PATHEXT names still fail with the real text
  for (const query of ['flibbertigibbet', 'ncpa', 'appwiz', 'devmgmt.cpl', 'services.exe.msc']) {
    const reply = no(sim.launch(query));
    assert.equal(reply.msg, `Windows cannot find '${query}'. Make sure you typed the name correctly, and then try again.`);
    assert.equal(reply.info, undefined);
  }
  assert.equal(windowsTool('flibbertigibbet'), null);
  no(createSim(routerCases[0]).launch('devmgmt'));
}

// The catalog covers the A+ 220-1202 objective 1.4 tools and the 1.5 command-line programs (Microsoft Learn).
{
  const sim = createSim(winCases[0]);
  const before = JSON.stringify(sim.snapshot());
  for (const [queries, name] of [[['cleanmgr', 'cleanmgr.exe'], 'Disk Cleanup'], [['dfrgui', 'DFRGUI.EXE'], 'Defragment and Optimize Drives'],
    [['wf.msc', 'wf'], 'Windows Defender Firewall with Advanced Security'], [['secpol.msc', 'secpol'], 'Local Security Policy'],
    [['mmc', 'mmc.exe'], 'Microsoft Management Console'], [['notepad', 'notepad.exe'], 'Notepad'], [['explorer', 'explorer.exe'], 'File Explorer'],
    [['dxdiag', 'dxdiag.exe'], 'DirectX Diagnostic Tool'], [['winver', 'winver.exe'], 'About Windows'], [['netplwiz', 'netplwiz.exe'], 'User Accounts']]) {
    for (const query of queries) {
      const reply = ok(sim.launch(query));
      assert.equal(reply.info, true, query);
      assert.equal(reply.msg.startsWith(`${query} opens ${name}: `), true, `${query}: ${reply.msg}`);
      assert.match(reply.msg, /practiced through another path, so nothing was opened here\.$/);
    }
  }
  const cli = ['ipconfig', 'ping', 'netstat', 'nslookup', 'tracert', 'pathping', 'chkdsk', 'format', 'diskpart', 'robocopy', 'hostname',
    'whoami', 'gpupdate', 'gpresult', 'sfc', 'net use', 'net user'];
  for (const query of [...cli, 'ipconfig.exe', 'IPCONFIG']) {
    const reply = ok(sim.launch(query));
    assert.equal(reply.info, true, query);
    assert.equal(reply.msg.startsWith(`${query} is a command-line tool: it `), true, `${query}: ${reply.msg}`);
    assert.match(reply.msg, /Run it in Command Prompt or PowerShell to read its output\. This case is practiced through another path, so nothing was opened here\.$/);
  }
  assert.equal(JSON.stringify(sim.snapshot()), before, 'catalog replies open nothing and change nothing');
  // cmd.exe built-ins are not programs: Run cannot find them, as on a real PC; .cpl/.msc forms of programs are not tools.
  for (const query of ['dir', 'cd', 'md', 'rmdir', 'notepad.msc', 'wf.exe', 'ipconfig /all', 'net']) {
    assert.equal(no(sim.launch(query)).msg, `Windows cannot find '${query}'. Make sure you typed the name correctly, and then try again.`, query);
  }
  const names = WINDOWS_TOOLS.map((tool) => tool.q);
  assert.equal(new Set(names).size, names.length, 'no duplicate launch names');
  assert.ok(WINDOWS_TOOLS.filter((tool) => tool.cli).every((tool) => !/^(the|a|an) /i.test(tool.what)), 'command-line descriptions read as verbs');
  assert.equal(windowsTool('perfmon').name, 'Performance Monitor', 'the additions do not shadow earlier names');
}

// Name predicates: hasText, hasKey and nearKey fold case, spaces and punctuation.
{
  const sim = createSim({
    skin: 'router', screens: [{ id: 'p', title: 'P', controls: [
      { id: 'a', type: 'text', key: 'a' }, { id: 'b', type: 'text', key: 'b' }, { id: 'n', type: 'text', key: 'n' },
    ] }],
    state: { a: 'My-Harbor.dental 2025', b: '', n: 'HarborDental' },
    goals: [
      { id: 'text', check: { key: 'a', op: 'hasText', value: ['Nope', 'Harbor Dental'] } },
      { id: 'key', check: { key: 'a', op: 'hasKey', value: 'n' } },
      { id: 'near', check: { key: 'a', op: 'nearKey', value: 'b', max: 2 } },
    ],
  });
  const pass = () => sim.check().goals.map((goal) => goal.pass);
  assert.deepEqual(pass(), [true, true, false], 'empty values are never near');
  ok(sim.set('b', 'myharbordental2025!!'));
  assert.deepEqual(pass(), [true, true, true], 'punctuation and case are ignored');
  ok(sim.set('b', 'myharbordental2099'));
  assert.equal(pass()[2], true, 'two edits apart');
  ok(sim.set('b', 'myharbordental3099'));
  assert.equal(pass()[2], false, 'three edits apart is more than max 2');
  ok(sim.set('n', 'Ha'));
  assert.equal(pass()[1], false, 'a name under 4 characters matches nothing');
  ok(sim.set('a', 'Quiet pylon ferns'));
  assert.deepEqual(pass(), [false, false, false]);
}

// Repeated password chunks are rejected even when the repeated half changes case.
{
  const sim = createSim({
    skin: 'router', state: { password: 'winter2026Winter2026' },
    screens: [{ id: 'home', controls: [{ id: 'password', type: 'password', key: 'password' }] }],
    goals: [{ id: 'unique', check: { not: { key: 'password', op: 'repeatedFold' } } }],
  });
  assert.equal(sim.check().goals[0].pass, false, 'case-varied repetition fails');
  for (const variant of ['Winter2026!Winter2026', 'winter2026Winter2026!', 'Winter2026 Winter2026', 'Winter2026Winter2027']) {
    ok(sim.set('password', variant));
    assert.equal(sim.check().goals[0].pass, false, `near repetition fails: ${variant}`);
  }
  ok(sim.set('password', 'quiet-pylon-ferns-sail-9'));
  assert.equal(sim.check().goals[0].pass, true, 'normal passphrase passes');
}

// router-01: passwords built from the business or network name, or near copies of each other, are weak.
{
  const caseDef = routerCases.find((item) => item.id === 'router-01');
  const grade = (admin, wifi) => {
    const sim = createSim(caseDef);
    ok(sim.open('administration')); ok(sim.set('admin-password', admin));
    ok(sim.open('wireless')); ok(sim.set('security', 'WPA2/WPA3 Transitional')); ok(sim.set('wifi-password', wifi));
    ok(sim.open('wps')); ok(sim.set('wps', 'Disabled'));
    const result = sim.check();
    return { score: result.score, traps: result.traps.filter((trap) => trap.hit).map((trap) => trap.id) };
  };
  for (const [admin, wifi] of [['HarborDental2025', 'HarborDental2025!'], ['Harbor-Dental-Mops-Kite', 'quiet-pylon-ferns-sail-9'],
    ['Copper-Lantern-Tide-47', 'harbor.dental.wifi.2025'], ['Copper-Lantern-Tide-47', 'Copper-Lantern-Tide-48'], ['Copper-Lantern-Tide-47', 'copper lantern tide 47!!']]) {
    const { score, traps } = grade(admin, wifi);
    assert.ok(score < 80, `${admin} / ${wifi}: ${score}`);
    assert.ok(traps.includes('weak-password'), `${admin} / ${wifi}: ${traps}`);
  }
  assert.deepEqual(grade('Copper-Lantern-Tide-47', 'Copper-Lantern-Tide-47').traps, ['equal-password'], 'identical passwords stay the equal-password trap');
  for (const [admin, wifi] of [['Copper-Lantern-Tide-47', 'quiet-pylon-ferns-sail-9'], ['Granite-Orbit-Velvet-Moss-82', 'tundra fable crisp walnut 7'], ['Gx7#pQ2!vL9@wR4$', 'Mz3%kT8^bN1&yH6*']]) {
    assert.deepEqual(grade(admin, wifi), { score: 100, traps: [] }, `${admin} / ${wifi}`);
  }
}

// router-02 (staff + guest) and router-06 (staff + IoT): the business name, any SSID of the case, and near copies
// of the other Wi-Fi password are weak; strong unrelated passphrases still score 100.
{
  const grade02 = (staff, guest) => {
    const sim = createSim(routerCases.find((item) => item.id === 'router-02'));
    ok(sim.open('wireless')); ok(sim.set('wifi-password', staff));
    ok(sim.open('guest')); ok(sim.set('guest-security', 'WPA2/WPA3 Transitional')); ok(sim.set('guest-password', guest));
    ok(sim.set('guest-lan', false)); ok(sim.set('guest-enable', true));
    const result = sim.check();
    return { score: result.score, traps: result.traps.filter((trap) => trap.hit).map((trap) => trap.id) };
  };
  const grade06 = (staff, iot) => {
    const sim = createSim(routerCases.find((item) => item.id === 'router-06'));
    ok(sim.open('wireless')); ok(sim.set('security', 'WPA3 Personal'));
    if (staff !== null) ok(sim.set('wifi-password', staff));
    ok(sim.open('iot')); ok(sim.set('iot-security', 'WPA2 Personal (AES)')); ok(sim.set('iot-password', iot));
    ok(sim.set('iot-lan', false)); ok(sim.set('iot-enable', true));
    ok(sim.open('lan')); ok(sim.set('dhcp-start', 50));
    const result = sim.check();
    return { score: result.score, traps: result.traps.filter((trap) => trap.hit).map((trap) => trap.id) };
  };
  const STRONG = 'Tulip-Lantern-Basalt-Quartz-64';
  for (const [staff, guest] of [[STRONG, 'Maple-Street-Bakery-Guests'], [STRONG, 'mapleSTREET guest wifi 2025'], ['MapleStreet-Staff-Ovens-77', 'warm-gravel-comet-dawn-41'],
    [STRONG, 'mapleStreet_guest-Comet-Dawn'], ['Comet-Dawn-mapleStreet-Staff9', 'warm-gravel-comet-dawn-41'], [STRONG, 'Tulip-Lantern-Basalt-Quartz-65'], [STRONG, 'tulip lantern basalt quartz 64!']]) {
    const { score, traps } = grade02(staff, guest);
    assert.ok(score < 100, `router-02 ${staff} / ${guest}: ${score}`);
    assert.ok(traps.includes('weak-password'), `router-02 ${staff} / ${guest}: ${traps}`);
  }
  assert.deepEqual(grade02(STRONG, STRONG).traps, ['equal-password'], 'router-02: identical passwords stay the equal-password trap');
  for (const [staff, guest] of [[STRONG, 'warm-gravel-comet-dawn-41'], ['Granite-Orbit-Velvet-Moss-82', 'tundra fable crisp walnut 7'], ['Gx7#pQ2!vL9@wR4$', 'Mz3%kT8^bN1&yH6*']]) {
    assert.deepEqual(grade02(staff, guest), { score: 100, traps: [] }, `router-02 ${staff} / ${guest}`);
  }
  for (const [staff, iot] of [[null, 'Larkspur-Studio-Thermostat-Door'], [null, 'lds-devices-Fern-Copper-Signal'], [null, 'Fern-Copper-LDS_Staff-Signal'], [null, 'Graphite-Meadow-Fold-Ink-59'],
    ['Fern-Copper-Signal-Lake-74', 'Fern-Copper-Signal-Lake-73'], ['larkspur design studio staff 1', 'Fern-Copper-Signal-Lake-73'], ['Quartz-Ember-LDS-Devices-Hill', 'Fern-Copper-Signal-Lake-73']]) {
    const { traps } = grade06(staff, iot);
    assert.ok(traps.includes('weak-password'), `router-06 ${staff} / ${iot}: ${traps}`);
  }
  assert.ok(grade06(null, 'Larkspur-Studio-Thermostat-Door').score < 100, 'router-06: a name-based IoT password fails the goal');
  assert.deepEqual(grade06(null, 'Graphite-Meadow-Fold-Ink-58').traps, ['equal-password'], 'router-06: identical passwords stay the equal-password trap');
  for (const [staff, iot] of [[null, 'Fern-Copper-Signal-Lake-73'], ['Granite-Orbit-Velvet-Moss-82', 'tundra fable crisp walnut 7'], ['Gx7#pQ2!vL9@wR4$', 'Mz3%kT8^bN1&yH6*']]) {
    assert.deepEqual(grade06(staff, iot), { score: 100, traps: [] }, `router-06 ${staff} / ${iot}`);
  }
}

// router-04: hiding the SSID is a real setting, not a trap; win-04: Automatic (Delayed Start) survives a restart.
{
  const router04 = routerCases.find((item) => item.id === 'router-04');
  const sim = createSim(router04);
  for (const step of router04.solution) ok(play(sim, step));
  assert.equal(sim.screenId, 'wireless');
  assert.deepEqual(ok(sim.set('broadcast', false)).trapsHit, []);
  assert.equal(sim.check().score, 100);
  assert.ok(!router04.traps.some((trap) => trap.id === 'hidden-ssid'));

  const win04 = winCases.find((item) => item.id === 'win-04');
  const svc = createSim(win04);
  for (const step of win04.solution) {
    if (step.do.controlId === 'startup-type') ok(svc.set('startup-type', 'Automatic (Delayed Start)'));
    else if (step.do.controlId === 'apply-automatic') ok(svc.act('apply-automatic-delayed-start'));
    else ok(play(svc, step));
  }
  assert.equal(svc.state['spool.start'], 'Automatic (Delayed Start)');
  assert.equal(svc.check().score, 100);
}

// Coach: hint tiers, show me, assisted marking, guided messages, wrong actions, finishRun.
{
  const caseDef = winCases[0];
  const [first, second] = caseDef.goals;
  assert.deepEqual(MODES, ['guided', 'practice', 'exam']);
  assert.throws(() => createCoach(caseDef, 'cheat'), RangeError);
  const coach = createCoach(caseDef);
  assert.equal(coach.mode, 'guided');
  assert.deepEqual(coach.hint(first.id), { goalId: first.id, tier: 1, text: first.hints[0], assisted: false });
  assert.deepEqual(coach.hint(first.id), { goalId: first.id, tier: 2, text: first.hints[1], assisted: false });
  assert.equal(coach.assisted, false);
  assert.deepEqual(coach.hint(first.id), { goalId: first.id, tier: 3, text: first.hints[2], assisted: true });
  assert.equal(coach.assisted, true);
  assert.equal(coach.hint(first.id).tier, 3, 'tier 3 repeats');
  assert.deepEqual(coach.assistedGoals, [first.id]);
  assert.deepEqual(coach.tiers, { [first.id]: 3 });
  assert.equal(coach.hint('missing'), null);

  const sim = createSim(caseDef);
  const progress = coach.observe(sim.launch('devmgmt.msc'));
  assert.deepEqual(progress, { wrongActions: 0, messages: [{ kind: 'done', text: `Done: ${first.text}` }], offerHint: false });
  assert.deepEqual(coach.observe(sim.open('devices')).messages, [], 'navigation is neither progress nor wrong');
  assert.equal(coach.observe(sim.open('devices')).wrongActions, 0);
  const wrong = coach.observe(sim.act('devices', 'hub', 'disable'));
  assert.deepEqual(wrong.messages, [{ kind: 'trap', text: caseDef.traps[0].message }]);
  assert.equal(wrong.offerHint, false);
  const twice = coach.observe(sim.launch('nonsense'));
  assert.equal(twice.wrongActions, 2);
  assert.equal(twice.messages[0].kind, 'error');
  assert.equal(twice.offerHint, true, 'two wrong actions offer a hint');
  assert.equal(coach.observe(sim.act('devices', 'serial', 'properties')).wrongActions, 0, 'progress resets the count');
  assert.equal(coach.offerHint(59), false);
  assert.equal(coach.offerHint(60), true, '60 s without progress offers a hint');
  assert.deepEqual(coach.finishRun({ score: 100 }, 12.9), { score: 100, secs: 12, mode: 'guided', assisted: true });
  assert.equal(coach.finishRun({ score: 100 }, -5).secs, 0);
  assert.equal(coach.finishRun({ score: 100 }, 1e9).secs, 86400);
  assert.equal(coach.finishRun({ score: 100 }, NaN).secs, 0);

  const practice = createCoach(caseDef, 'practice');
  assert.equal(practice.hint(second.id).tier, 1, 'practice hints on request');
  assert.deepEqual(practice.observe({ ok: true, msg: '', goalsChanged: [second.id], trapsHit: [] }).messages, [], 'no proactive coaching in practice');
  assert.equal(practice.offerHint(600), false);
  assert.equal(practice.finishRun({ score: 90 }, 5).assisted, false);
  practice.viewSolution();
  assert.deepEqual(practice.finishRun({ score: 90 }, 5), { score: 90, secs: 5, mode: 'practice', assisted: true });

  const exam = createCoach(caseDef, 'exam');
  assert.equal(exam.hint(first.id), null, 'no hints in exam mode');
  assert.equal(exam.assisted, false);
  assert.deepEqual(exam.finishRun({ score: 80 }, 10), { score: 80, secs: 10, mode: 'exam', assisted: false });
  assert.deepEqual(exam.showMe(second.id), { goalId: second.id, tier: 3, text: second.hints[2], assisted: true }, 'Show me after Check works in any mode');
  assert.equal(exam.finishRun({ score: 80 }, 10).assisted, true);
}

// Opening a walkthrough after Check leaves that result intact and assists one following attempt.
{
  const queue = createNextAttemptAssistance();
  const checked = createCoach(winCases[0], 'exam');
  const graded = checked.finishRun({ score: 100 }, 10);
  queue.viewSolution();
  assert.equal(checked.assisted, false, 'the already graded attempt stays unassisted');
  assert.equal(graded.assisted, false);
  const retry = createCoach(winCases[0], 'exam');
  queue.startAttempt(retry);
  assert.equal(retry.finishRun({ score: 100 }, 3).assisted, true, 'Try again or Restart consumes queued assistance');
  assert.equal(L.isMastered(L.recordRun({}, 'win/win-01', { t: 1, ...retry.finishRun({ score: 100 }, 3) }), 'win/win-01'), false);
  const later = createCoach(winCases[0], 'exam');
  queue.startAttempt(later);
  assert.equal(later.assisted, false, 'the assistance applies to one next attempt');
}

// Try again carries the state, so it carries the help: only Restart (fresh state) starts unassisted (SPEC 2.3/2.4).
{
  const caseDef = routerCases[0];
  const id = `router/${caseDef.id}`;
  const queue = createNextAttemptAssistance();
  // The verifier's sequence: Exam, Check, Show solution, Try again, solve, Check, Try again, Check with no new work.
  const first = createCoach(caseDef, 'exam');
  queue.startAttempt(first);
  assert.equal(first.finishRun({ score: 40 }, 5).assisted, false);
  queue.viewSolution();
  const second = createCoach(caseDef, 'exam', { continuesFrom: first });
  queue.startAttempt(second);
  let labs = L.recordRun({}, id, { t: 1, ...second.finishRun({ score: 100 }, 9) });
  assert.equal(labs[id][0].assisted, true, 'the attempt after the walkthrough is assisted');
  const third = createCoach(caseDef, 'exam', { continuesFrom: second });
  queue.startAttempt(third);
  assert.equal(third.assisted, true, 'assisted -> Try again stays assisted');
  labs = L.recordRun(labs, id, { t: 2, ...third.finishRun({ score: 100 }, 1) });
  assert.deepEqual(labs[id][1], { t: 2, score: 100, secs: 1, mode: 'exam', assisted: true }, 'Check with no new work saves assisted');
  assert.equal(L.isMastered(labs, id), false);
  assert.equal(L.isPassed(labs, id), false);
  const fourth = createCoach(caseDef, 'exam', { continuesFrom: third });
  assert.equal(fourth.finishRun({ score: 100 }, 1).assisted, true, 'the help carries through every Try again');

  // Show me on every goal, then Try again and Check: still assisted.
  const shown = createCoach(caseDef, 'practice');
  caseDef.goals.forEach((goal) => shown.showMe(goal.id));
  assert.equal(shown.finishRun({ score: 100 }, 3).assisted, true);
  const retried = createCoach(caseDef, 'practice', { continuesFrom: shown });
  assert.deepEqual(retried.tiers, {}, 'a new attempt starts with fresh hint tiers');
  assert.equal(retried.finishRun({ score: 100 }, 1).assisted, true, 'Show me on all goals -> Try again -> Check stays assisted');

  // An unassisted attempt continued with Try again stays unassisted.
  const clean = createCoach(caseDef, 'exam');
  assert.equal(createCoach(caseDef, 'exam', { continuesFrom: clean }).assisted, false);

  // Restart after an assisted attempt (no walkthrough viewed since) is a fresh, unassisted attempt that can master.
  const restart = createCoach(caseDef, 'exam');
  queue.startAttempt(restart);
  const run = restart.finishRun({ score: 100 }, 20);
  assert.equal(run.assisted, false, 'Restart starts unassisted');
  labs = L.recordRun(labs, id, { t: 3, ...run });
  assert.equal(L.isMastered(labs, id), true, 'the Restart attempt can master');

  // Restart right after viewing the walkthrough is still assisted.
  queue.viewSolution();
  const afterWalk = createCoach(caseDef, 'exam');
  queue.startAttempt(afterWalk);
  assert.equal(afterWalk.assisted, true);
}

// The queued walkthrough survives a re-render, navigation away and back, and a reload in the same tab (per item id).
{
  const fakeStorage = () => {
    const m = new Map();
    return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m };
  };
  const caseDef = routerCases[0];
  const id = `router/${caseDef.id}`;
  const other = 'router/other';
  const memory = new Map();
  const storage = fakeStorage();
  const store = createPendingAssistStore(memory, storage);

  // Exam, Check, Show solution on the first render of the case page.
  const page1 = createNextAttemptAssistance(store, id);
  const first = createCoach(caseDef, 'exam');
  page1.startAttempt(first);
  assert.equal(first.finishRun({ score: 40 }, 5).assisted, false);
  page1.viewSolution();
  assert.deepEqual(JSON.parse(storage.getItem(PENDING_ASSIST_KEY)), [id], 'the flag is written to sessionStorage');
  assert.equal(createNextAttemptAssistance(store, other).pending, false, 'the flag is per case');

  // "← lab" back link, then the same case again: a new render, same Map and storage.
  const page2 = createNextAttemptAssistance(store, id);
  assert.equal(page2.pending, true, 'the flag survives a re-render of the case page');
  const back = createCoach(caseDef, 'exam');
  page2.startAttempt(back);
  let labs = L.recordRun({}, id, { t: 1, ...back.finishRun({ score: 100 }, 9) });
  assert.equal(labs[id][0].assisted, true, 'navigate away and back: the next attempt is assisted');
  assert.equal(L.isMastered(labs, id), false);
  assert.equal(page2.pending, false, 'consumed once');
  assert.equal(storage.getItem(PENDING_ASSIST_KEY), null, 'consumed in sessionStorage too');
  const restart = createCoach(caseDef, 'exam');
  page2.startAttempt(restart);
  labs = L.recordRun(labs, id, { t: 2, ...restart.finishRun({ score: 100 }, 9) });
  assert.equal(L.isMastered(labs, id), true, 'a fresh Restart after that attempt can master');
  assert.equal(createNextAttemptAssistance(store, id).pending, false, 'a later render is not assisted');

  // Reload: a new Map (the module loads again), same sessionStorage.
  createNextAttemptAssistance(store, id).viewSolution();
  const reloaded = createNextAttemptAssistance(createPendingAssistStore(new Map(), storage), id);
  assert.equal(reloaded.pending, true, 'the flag survives a reload in the same tab');
  const afterReload = createCoach(caseDef, 'exam');
  reloaded.startAttempt(afterReload);
  assert.equal(afterReload.assisted, true, 'reload: the next attempt is assisted');
  const later = createCoach(caseDef, 'exam');
  reloaded.startAttempt(later);
  assert.equal(later.assisted, false, 'and only that one');

  // Two cases queued at once are independent.
  const both = createPendingAssistStore(new Map(), fakeStorage());
  both.set(id, true); both.set(other, true); both.set(id, false);
  assert.equal(both.has(id), false);
  assert.equal(both.has(other), true);

  // Blocked or broken storage: the Map still carries the flag; a failed remove never brings it back on this page.
  const throwing = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); }, removeItem() { throw new Error('blocked'); } };
  const blocked = createPendingAssistStore(new Map(), throwing);
  blocked.set(id, true);
  assert.equal(blocked.has(id), true, 'blocked storage keeps the in-memory flag');
  blocked.set(id, false);
  assert.equal(blocked.has(id), false);
  const stuck = fakeStorage();
  stuck.setItem(PENDING_ASSIST_KEY, JSON.stringify([id]));
  stuck.removeItem = () => { throw new Error('blocked'); };
  stuck.setItem = () => { throw new Error('blocked'); };
  const stuckStore = createPendingAssistStore(new Map(), stuck);
  assert.equal(stuckStore.has(id), true);
  stuckStore.set(id, false);
  assert.equal(stuckStore.has(id), false, 'memory wins once it has an entry for the id');
  const garbage = fakeStorage();
  garbage.setItem(PENDING_ASSIST_KEY, '{not json');
  assert.equal(createPendingAssistStore(new Map(), garbage).has(id), false, 'bad stored JSON reads as no flag');
  assert.equal(createPendingAssistStore(new Map(), null).has(id), false, 'no storage at all');
}

// lab-logic: optional mode/assisted on runs (SPEC 2.4), old runs unchanged.
{
  const old = { 'fw/ok': [{ t: 1, score: 90, secs: 3 }] };
  assert.deepEqual(L.normalizeLabs(old), old, 'old runs keep their exact shape');
  assert.equal(L.isPassed(old, 'fw/ok'), true, 'old runs count as unassisted');
  const coach = createCoach(winCases[0], 'exam');
  let labs = L.recordRun({}, 'win/win-01', { t: 5, ...coach.finishRun({ score: 100 }, 30) });
  assert.deepEqual(labs, { 'win/win-01': [{ t: 5, score: 100, secs: 30, mode: 'exam' }] }, 'assisted false is not stored');
  labs = L.recordRun(labs, 'win/win-01', { t: 6, score: 100, secs: 9, mode: 'guided', assisted: true });
  assert.deepEqual(labs['win/win-01'][1], { t: 6, score: 100, secs: 9, mode: 'guided', assisted: true });
  assert.deepEqual(L.normalizeLabs(JSON.parse(JSON.stringify(labs))), labs, 'normalize keeps mode and assisted');
  const assistedOnly = L.recordRun({}, 'win/win-02', { t: 1, score: 100, secs: 1, mode: 'practice', assisted: true });
  assert.equal(L.isPassed(assistedOnly, 'win/win-02'), false, 'assisted runs never pass');
  assert.equal(L.bestScore(assistedOnly, 'win/win-02'), 100);
  for (const bad of [{ mode: 'cheat' }, { mode: 3 }, { assisted: 'yes' }, { assisted: 1 }]) {
    assert.deepEqual(L.recordRun({}, 'win/win-01', { t: 1, score: 90, secs: 1, ...bad }), {}, JSON.stringify(bad));
  }
  assert.deepEqual(L.normalizeLabs({ 'win/x': [{ t: 1, score: 9, secs: 1, extra: 1, assisted: false, mode: 'exam' }] }), { 'win/x': [{ t: 1, score: 9, secs: 1, mode: 'exam' }] });
  const merged = L.mergeLabs(labs, { 'win/win-01': [{ t: 7, score: 70, secs: 2, mode: 'practice' }], 'win/win-02': assistedOnly['win/win-02'] });
  assert.deepEqual(merged['win/win-01'].map((run) => [run.t, run.mode, run.assisted]), [[5, 'exam', undefined], [6, 'guided', true], [7, 'practice', undefined]]);
  assert.equal(merged['win/win-02'][0].assisted, true, 'merge keeps assisted');
  const summary = L.labSummary(merged, [{ id: 'win', name: 'Windows', icon: 'w', cases: [{ id: 'win-01' }, { id: 'win-02' }] }]);
  assert.equal(summary.passed, 1, 'labSummary ignores assisted passes');
  assert.equal(summary.perLab[0].nextCaseId, 'win-02');

  // capRuns keeps the best unassisted run, not an assisted 100.
  const runs = [{ t: 1, score: 85, secs: 1, mode: 'exam' }, { t: 2, score: 100, secs: 1, assisted: true },
    ...Array.from({ length: 10 }, (_, i) => ({ t: i + 3, score: 40, secs: 1 }))];
  let capped = {};
  for (const run of runs) capped = L.recordRun(capped, 'win/win-01', run);
  assert.equal(capped['win/win-01'].length, L.RUNS_CAP);
  assert.deepEqual(capped['win/win-01'][0], { t: 1, score: 85, secs: 1, mode: 'exam' });
  assert.equal(capped['win/win-01'].some((run) => run.assisted), false);
  assert.equal(L.isPassed(capped, 'win/win-01'), true);
  const allAssisted = runs.map((run) => ({ ...run, assisted: true }));
  assert.equal(L.normalizeLabs({ 'win/y': allAssisted })['win/y'][0].score, 100, 'all assisted: keeps the best run');
}

console.log('ok - A+ sim engine, coach, run records, and the win/router/mobprint seed cases');

import { findPart } from './parts.js';
import { scoreFrom } from './coach.js';

export const SLOTS = ['cpu', 'board', 'memory', 'storage', 'gpu', 'psu', 'case', 'cooler'];
const CATEGORY = { cpu: 'cpus', board: 'boards', memory: 'memory', storage: 'storage', gpu: 'gpus', psu: 'psus', case: 'cases', cooler: 'coolers' };
const MULTI = new Set(['memory', 'storage']);

// Source keys per rule; every key must exist in build-cases.js `sources`.
export const RULE_SOURCES = {
  socket: ['amdAm5', 'amdAm4', 'intel1851'],
  memoryType: ['dellMemory', 'ddr5Notch'],
  memoryForm: ['dellMemory'],
  memorySlots: ['dellMemory'],
  memoryCapacity: ['dellMemory'],
  boardFit: ['boardSizes'],
  gpuSlot: ['atxGuide'],
  gpuFit: ['gpuCaseFit'],
  psuFit: ['atxGuide'],
  psuWattage: ['psuSizing', 'atxGuide'],
  gpuPower: ['atxGuide', 'asusGpuPower'],
  m2Slot: ['dellM2'],
  sataPorts: ['amdAm5'],
  driveBays: ['boardSizes'],
  coolerSocket: ['intelBuild'],
  coolerTdp: ['intelBuild'],
  coolerHeight: ['coolerFit'],
  noVideo: ['intelF'],
  pcieSpeed: ['amdAm5'],
  incomplete: ['intelBuild'],
};

// PSU estimate (taught in the primer): CPU rated TDP + GPU board power + 75 W
// for board, memory, drives and fans, times 1.3 for headroom, rounded up to the
// next common PSU size. XPG's sizing guide keeps estimated draw under 80% of
// the rating (25% over for high-end GPUs); 1.3 sits just above both.
export const OTHER_PARTS_W = 75;
export const HEADROOM = 1.3;
export const COMMON_PSU_W = [300, 350, 400, 450, 500, 550, 650, 750, 850, 1000, 1200, 1300, 1500, 1600];

export function estimatePsuWatts(cpu, gpu = null) {
  const totalW = (cpu?.tdp ?? 0) + (gpu?.boardPowerW ?? 0) + OTHER_PARTS_W;
  const target = Math.ceil(totalW * HEADROOM);
  return { totalW, recommendedW: COMMON_PSU_W.find((watts) => watts >= target) ?? Math.ceil(target / 100) * 100 };
}

const asList = (value) => (Array.isArray(value) ? value : value ? [value] : []);

export function startPicks(caseDef) {
  const picks = caseDef?.picks ?? {};
  return Object.fromEntries(SLOTS.map((slot) => [slot, MULTI.has(slot) ? [...asList(picks[slot])] : picks[slot] ?? null]));
}

export function editableSlots(caseDef) {
  return caseDef?.slots ?? SLOTS;
}

// Solution/trapDemo step forms: { slot, part } (part null clears; on memory or
// storage it replaces the list), { slot, parts: [] }, { slot, add }, { slot, remove }.
export function applyStep(caseDef, picks, step) {
  const { slot } = step ?? {};
  if (!SLOTS.includes(slot)) return { ok: false, msg: `Unknown slot: ${slot}`, picks };
  if (!editableSlots(caseDef).includes(slot)) return { ok: false, msg: `The ${slot} is fixed in this scenario.`, picks };
  const ids = [step.part, step.add, ...(step.parts ?? [])].filter((id) => id != null);
  const unknown = ids.find((id) => !findPart(CATEGORY[slot], id));
  if (unknown) return { ok: false, msg: `No ${slot} part with id ${unknown}.`, picks };
  const next = { ...picks, memory: [...picks.memory], storage: [...picks.storage] };
  if (!MULTI.has(slot)) next[slot] = step.part ?? null;
  else if ('parts' in step) next[slot] = [...step.parts];
  else if ('add' in step) next[slot].push(step.add);
  else if ('remove' in step) {
    const at = next[slot].indexOf(step.remove);
    if (at < 0) return { ok: false, msg: `${step.remove} is not installed.`, picks };
    next[slot].splice(at, 1);
  } else next[slot] = asList(step.part);
  return { ok: true, msg: `Updated ${slot}.`, picks: next };
}

function resolveBuild(picks) {
  const one = (slot) => findPart(CATEGORY[slot], picks?.[slot]);
  const many = (slot) => asList(picks?.[slot]).map((id) => findPart(CATEGORY[slot], id)).filter(Boolean);
  return { cpu: one('cpu'), board: one('board'), gpu: one('gpu'), psu: one('psu'), chassis: one('case'), cooler: one('cooler'), memory: many('memory'), storage: many('storage') };
}

const ids = (...list) => list.flat().filter(Boolean).map((part) => part.id);
const issue = (rule, parts, message, why) => ({ rule, parts, message, why, src: RULE_SOURCES[rule] });

function platformRules({ cpu, board, memory }) {
  const out = [];
  if (cpu && board && cpu.socket !== board.socket) {
    out.push(issue('socket', ids(cpu, board), `The ${cpu.socket} CPU cannot go in the ${board.socket} board socket.`, 'A CPU only fits a motherboard with the same socket. Check the socket name on both spec sheets before anything else.'));
  }
  if (!board) return out;
  const modules = memory.reduce((sum, kit) => sum + kit.count, 0);
  const totalGB = memory.reduce((sum, kit) => sum + kit.count * kit.moduleGB, 0);
  for (const kit of memory) {
    if (kit.type !== board.memoryType) out.push(issue('memoryType', ids(kit, board), `${kit.type} memory does not fit this ${board.memoryType} board.`, 'A board supports one DDR generation. DDR4 and DDR5 have different pin layouts and notch positions, so they are not interchangeable.'));
    if (kit.form !== board.memoryForm) out.push(issue('memoryForm', ids(kit, board), `${kit.form} modules do not fit the ${board.memoryForm} slots on this board.`, 'Desktops take full-size DIMMs and laptops take smaller SO-DIMMs. Match the module shape as well as the DDR generation.'));
  }
  if (modules > board.dimmSlots) out.push(issue('memorySlots', ids(memory, board), `${modules} memory modules need more than the ${board.dimmSlots} slots on this board.`, 'Each module needs its own slot. Count modules in the kit, not kits.'));
  if (totalGB > board.maxMemoryGB) out.push(issue('memoryCapacity', ids(memory, board), `${totalGB} GB is more than this board's ${board.maxMemoryGB} GB maximum.`, 'Every board has a maximum supported memory capacity. Check it before buying larger kits.'));
  return out;
}

function caseRules({ board, gpu, psu, chassis, cooler, cpu }) {
  const out = [];
  if (gpu && board && board.x16Slots < 1) out.push(issue('gpuSlot', ids(gpu, board), 'This board has no PCIe x16 slot for a graphics card.', 'A desktop graphics card installs in a PCIe x16 slot. Check the board has one free.'));
  if (!chassis) return out;
  if (board && !chassis.boardFormFactors.includes(board.formFactor)) out.push(issue('boardFit', ids(board, chassis), `A ${board.formFactor} board does not fit the ${chassis.name}.`, 'Bigger cases take smaller boards, never the reverse. ATX is 305 x 244 mm, Micro-ATX 244 x 244 mm, Mini-ITX 170 x 170 mm.'));
  if (gpu && gpu.lengthMM > chassis.maxGpuLengthMM) out.push(issue('gpuFit', ids(gpu, chassis), `The ${gpu.lengthMM} mm card is longer than the case's ${chassis.maxGpuLengthMM} mm limit.`, 'Compare the card length with the case maximum GPU length before buying.'));
  if (gpu && gpu.slotWidth > chassis.maxGpuSlots) out.push(issue('gpuFit', ids(gpu, chassis), `The ${gpu.slotWidth}-slot card is thicker than the ${chassis.maxGpuSlots} slots the case allows.`, 'Card thickness counts expansion slots. Small cases often take only 2-slot cards.'));
  if (psu && !chassis.psuFormFactors.includes(psu.formFactor)) out.push(issue('psuFit', ids(psu, chassis), `An ${psu.formFactor} power supply does not fit this case (it takes ${chassis.psuFormFactors.join(' or ')}).`, 'ATX and SFX power supplies are different sizes. Small cases usually need SFX.'));
  if (cooler && cooler.heightMM > chassis.maxCoolerHeightMM) out.push(issue('coolerHeight', ids(cooler, chassis), `The ${cooler.heightMM} mm cooler is taller than the case's ${chassis.maxCoolerHeightMM} mm clearance.`, 'The side panel limits air cooler height. Slim cases need low-profile coolers.'));
  if (cpu && cooler && !cooler.sockets.includes(cpu.socket)) out.push(issue('coolerSocket', ids(cooler, cpu), `This cooler has no mounting kit for ${cpu.socket}.`, 'A cooler must list the CPU socket in its supported sockets.'));
  if (cpu && cooler && cooler.tdpRatingW < cpu.tdp) out.push(issue('coolerTdp', ids(cooler, cpu), `The ${cooler.tdpRatingW} W cooler is rated below the ${cpu.tdp} W CPU.`, 'A cooler must be rated for at least the CPU heat load or the CPU throttles under load.'));
  return out;
}

function powerRules({ cpu, gpu, psu }, load) {
  const out = [];
  if (psu && cpu && psu.watts < load.recommendedW) {
    out.push(issue('psuWattage', ids(cpu, gpu, psu), `The ${psu.watts} W power supply is below the ${load.recommendedW} W estimate (${load.totalW} W load x 1.3, rounded up).`, 'Add CPU TDP, GPU board power and 75 W for the rest, multiply by 1.3 for headroom, then round up to a common PSU size.'));
  }
  if (!gpu || !psu) return out;
  const eightPins = gpu.power.filter((plug) => plug === '8-pin').length;
  const needs12v2x6 = gpu.power.includes('12V-2x6');
  const viaAdapter = needs12v2x6 && !psu.native12v2x6 && gpu.adapter && psu.pcie8pin >= gpu.adapter.eightPin;
  if (eightPins > psu.pcie8pin) {
    out.push(issue('gpuPower', ids(gpu, psu), `The card needs ${eightPins} PCIe 8-pin leads; this power supply has ${psu.pcie8pin}.`, 'Check the card\'s power connectors against the PSU\'s separate PCIe leads. Each 8-pin PCIe connector carries up to 150 W. Missing or loose power can prevent display or trigger a warning LED.'));
  } else if (needs12v2x6 && !psu.native12v2x6 && !viaAdapter) {
    out.push(issue('gpuPower', ids(gpu, psu), 'The card needs a 12V-2x6 connection: this power supply has no native 12V-2x6 lead and not enough 8-pin leads for the included adapter.', 'Check the PSU specifications for a native 12V-2x6 lead with the power rating the card needs; it is the clean option, but ATX 3.1 alone does not guarantee one. Otherwise, use the card\'s included adapter with the required separate 8-pin leads. Seat every plug fully.'));
  }
  return out;
}

const slotAccepts = (slot, drive) => slot.sizes.includes(drive.size)
  && drive.key.split('+').includes(slot.key)
  && (drive.kind === 'nvme' ? slot.nvme : slot.sata);

function assignM2(drives, slots, used = new Set(), index = 0) {
  if (index === drives.length) return true;
  return slots.some((slot, at) => {
    if (used.has(at) || !slotAccepts(slot, drives[index])) return false;
    used.add(at);
    if (assignM2(drives, slots, used, index + 1)) return true;
    used.delete(at);
    return false;
  });
}

function storageRules({ board, chassis, storage }) {
  const out = [];
  const warnings = [];
  if (!board) return { out, warnings };
  const m2Drives = storage.filter((drive) => drive.kind === 'nvme' || drive.kind === 'm2-sata');
  if (!assignM2(m2Drives, board.m2Slots)) {
    out.push(issue('m2Slot', ids(m2Drives, board), 'Not every M.2 drive has a free M.2 slot that supports it.', 'An M.2 drive needs a slot with the right key and length that also carries its protocol: NVMe needs a PCIe/NVMe slot, a SATA M.2 drive needs a slot that supports SATA.'));
  }
  const sataDrives = storage.filter((drive) => drive.kind.startsWith('sata-'));
  if (sataDrives.length > board.sataPorts) out.push(issue('sataPorts', ids(sataDrives, board), `${sataDrives.length} SATA drives need more than the ${board.sataPorts} SATA ports on this board.`, 'Each 2.5in or 3.5in SATA drive needs its own SATA data port.'));
  for (const [kind, bays, label] of chassis ? [['sata-2.5', chassis.bays25, '2.5in'], ['sata-3.5', chassis.bays35, '3.5in']] : []) {
    const count = sataDrives.filter((drive) => drive.kind === kind).length;
    if (count > bays) out.push(issue('driveBays', ids(sataDrives.filter((drive) => drive.kind === kind), chassis), `${count} ${label} drives need more than the ${bays} ${label} bays in this case.`, 'Every drive needs a bay of its size as well as a data port.'));
  }
  const fastest = Math.max(0, ...board.m2Slots.filter((slot) => slot.nvme).map((slot) => slot.pcieGen));
  for (const drive of m2Drives.filter((item) => item.kind === 'nvme' && item.pcieGen > fastest)) {
    warnings.push(issue('pcieSpeed', ids(drive, board), `The PCIe ${drive.pcieGen}.0 drive will run at PCIe ${fastest}.0 speed on this board.`, 'PCIe is backward compatible: the link runs at the speed both ends support.'));
  }
  return { out, warnings };
}

function videoRules({ cpu, gpu }) {
  if (!cpu || cpu.integratedGraphics || gpu) return [];
  return [issue('noVideo', ids(cpu), 'No video output: this CPU has no integrated graphics and there is no graphics card.', 'The motherboard video ports only work with a CPU that has integrated graphics. A CPU without graphics (for example an Intel "F" model) needs a dedicated graphics card, and the monitor plugs into the card.')];
}

function completenessWarnings(caseDef, picks) {
  const missing = editableSlots(caseDef).filter((slot) => slot !== 'gpu' && asList(picks?.[slot]).length === 0);
  return missing.length ? [issue('incomplete', [], `Still to choose: ${missing.join(', ')}.`, 'A working PC needs every core part installed.')] : [];
}

function factsOf(build, errors, load, picks, caseDef) {
  const facts = { video: !!(build.cpu?.integratedGraphics || build.gpu), errors: errors.length, 'psu.recommendedW': load.recommendedW, 'load.totalW': load.totalW };
  for (const [slot, part] of [['cpu', build.cpu], ['board', build.board], ['gpu', build.gpu], ['psu', build.psu], ['case', build.chassis], ['cooler', build.cooler]]) {
    facts[slot] = part?.id ?? null;
    for (const [key, value] of Object.entries(part ?? {})) if (typeof value !== 'object') facts[`${slot}.${key}`] = value;
  }
  const kinds = build.memory.map((kit) => kit.type);
  facts['memory.totalGB'] = build.memory.reduce((sum, kit) => sum + kit.count * kit.moduleGB, 0);
  facts['memory.modules'] = build.memory.reduce((sum, kit) => sum + kit.count, 0);
  facts['memory.type'] = new Set(kinds).size === 1 ? kinds[0] : kinds.length ? 'mixed' : null;
  const count = (kind) => build.storage.filter((drive) => drive.kind === kind).length;
  Object.assign(facts, {
    'storage.count': build.storage.length, 'storage.totalGB': build.storage.reduce((sum, drive) => sum + drive.capacityGB, 0),
    'storage.nvme': count('nvme'), 'storage.m2Sata': count('m2-sata'), 'storage.sata25': count('sata-2.5'), 'storage.hdd35': count('sata-3.5'),
  });
  facts.complete = completenessWarnings(caseDef, picks).length === 0;
  return facts;
}

// Goal/trap checks: { key, op, value } over the facts above (ops as in sim.js),
// { rule: 'noVideo' } (that rule fails), { ok: true } (no rule fails),
// { complete: true }, and the combinators { all }, { any }, { not }.
function test(check, facts, errors) {
  if (check == null) return true;
  if (check.all) return check.all.every((item) => test(item, facts, errors));
  if (check.any) return check.any.some((item) => test(item, facts, errors));
  if (check.not) return !test(check.not, facts, errors);
  if (check.rule) return errors.some((error) => error.rule === check.rule);
  if ('ok' in check) return (errors.length === 0) === check.ok;
  if ('complete' in check) return facts.complete === check.complete;
  const actual = facts[check.key];
  switch (check.op) {
    case 'eq': return actual === check.value;
    case 'ne': return actual !== check.value;
    case 'in': return Array.isArray(check.value) && check.value.includes(actual);
    case 'notin': return Array.isArray(check.value) && !check.value.includes(actual);
    case 'gte': return typeof actual === 'number' && actual >= check.value;
    case 'lte': return typeof actual === 'number' && actual <= check.value;
    case 'truthy': return !!actual;
    case 'falsy': return !actual;
    default: return false;
  }
}

export function evaluateBuild(caseDef, picks) {
  const build = resolveBuild(picks);
  const load = { cpuW: build.cpu?.tdp ?? 0, gpuW: build.gpu?.boardPowerW ?? 0, otherW: OTHER_PARTS_W, ...estimatePsuWatts(build.cpu, build.gpu), psuW: build.psu?.watts ?? 0 };
  const storage = storageRules(build);
  const errors = [...platformRules(build), ...caseRules(build), ...powerRules(build, load), ...storage.out, ...videoRules(build)];
  const warnings = [...storage.warnings, ...completenessWarnings(caseDef, picks)];
  const facts = factsOf(build, errors, load, picks, caseDef);
  const goals = (caseDef?.goals ?? []).map((goal) => ({
    id: goal.id, pass: test(goal.check, facts, errors), text: goal.text, why: goal.why, expect: goal.expect,
    ...(goal.weight === undefined ? {} : { weight: goal.weight }),
  }));
  const traps = (caseDef?.traps ?? []).map((trap) => ({
    id: trap.id, hit: test(trap.check, facts, errors), message: trap.message, why: trap.why, src: trap.src,
    ...(trap.critical ? { critical: true } : {}),
  }));
  return { errors, warnings, goals, traps, score: scoreFrom(goals, traps), load, facts };
}

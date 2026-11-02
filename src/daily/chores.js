// Pure, immutable chore rules. Callers supply IDs, dates, and timestamps.
import { isValidDay, isValidIso } from '../cq/iso.js';
import { jarAmounts } from '../payday/logic.js';
import { CHORE_CATALOG } from './chores-catalog.js';

const MAX_CENTS = 100000;
const MAX_ENTRIES = 5000;
const MAX_CUSTOM = 100;
const blocked = new Set(['__proto__', 'constructor', 'prototype']);
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const object = (value) => value && typeof value === 'object' && !Array.isArray(value)
  && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null) ? value : {};
const safeId = (value) => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value) && !blocked.has(value);
const cleanText = (value) => typeof value === 'string'
  ? value.replace(/[\u0000-\u001f\u007f-\u009f]/g, '').trim().slice(0, 80) : '';
const priceOk = (value) => Number.isInteger(value) && value >= 0 && value <= MAX_CENTS;
const error = (message) => ({ error: message });
const validMonday = (value) => isIso(value) && weekMonday(value) === value;
const validStamp = (value) => isValidIso(value);
const stamp = (value, date) => validStamp(value) ? value : `${date}T00:00:00Z`;
const replaceEntry = (chores, id, entry) => ({ ...chores, entries: { ...chores.entries, [id]: entry } });
const isPaid = (chores, date) => own(chores.paid, weekMonday(date));
const checked = (entry, status, nowIso) => ({ ...entry, status, checkedAt: status === 'waiting' ? null : nowIso });

export function emptyChores() {
  return { jobs: { overrides: {}, custom: [] }, entries: {}, paid: {} };
}

export function isIso(value) { return isValidDay(value); }
export function weekMonday(iso) {
  if (!isIso(iso)) return null;
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const offset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - offset);
  return date.toISOString().slice(0, 10);
}
export function weekDates(mondayIso) {
  if (!validMonday(mondayIso)) return [];
  const [year, month, day] = mondayIso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return Array.from({ length: 7 }, (_, i) => {
    const next = new Date(date.getTime() + i * 86400000);
    return next.toISOString().slice(0, 10);
  });
}
export function monthKey(iso) { return isIso(iso) ? iso.slice(0, 7) : null; }

export function normalizeChores(value) {
  const source = object(value);
  const result = emptyChores();
  const jobs = object(source.jobs);
  for (const id of Object.keys(object(jobs.overrides))) {
    if (!safeId(id) || ![...CHORE_CATALOG.guided, ...CHORE_CATALOG.standard].some((j) => j.id === id)) continue;
    const raw = object(jobs.overrides[id]);
    const override = {};
    if (priceOk(raw.cents)) override.cents = raw.cents;
    if (typeof raw.active === 'boolean') override.active = raw.active;
    if (Object.keys(override).length) result.jobs.overrides[id] = override;
  }
  const used = new Set([...CHORE_CATALOG.guided, ...CHORE_CATALOG.standard].map((j) => j.id));
  used.add('other');
  for (const rawJob of (Array.isArray(jobs.custom) ? jobs.custom : []).slice(0, MAX_CUSTOM)) {
    const j = object(rawJob);
    const name = cleanText(j.name);
    if (!safeId(j.id) || used.has(j.id) || !name || !priceOk(j.cents)) continue;
    used.add(j.id);
    result.jobs.custom.push({ id: j.id, icon: cleanText(j.icon), name, es: cleanText(j.es), cents: j.cents, active: j.active !== false });
  }
  for (const id of Object.keys(object(source.entries)).slice(0, MAX_ENTRIES)) {
    if (!safeId(id)) continue;
    const e = object(source.entries[id]);
    if (!isIso(e.date) || !safeId(e.jobId) || !['waiting', 'confirmed', 'declined'].includes(e.status)
      || !['kid', 'parent'].includes(e.by) || !(e.cents === null || priceOk(e.cents))) continue;
    const name = cleanText(e.name);
    if (!name || (e.status === 'confirmed' && e.cents === null)) continue;
    const addedAt = stamp(e.addedAt, e.date);
    result.entries[id] = {
      id, date: e.date, jobId: e.jobId, name, es: cleanText(e.es), icon: cleanText(e.icon),
      cents: e.cents, status: e.status, by: e.by, addedAt,
      checkedAt: e.status === 'waiting' ? null : stamp(e.checkedAt, e.date),
    };
  }
  for (const monday of Object.keys(object(source.paid))) {
    if (!validMonday(monday)) continue;
    const p = object(source.paid[monday]);
    if (!Array.isArray(p.entryIds) || !validStamp(p.paidAt)
      || !Number.isSafeInteger(p.cents) || p.cents < 0 || p.cents > MAX_ENTRIES * MAX_CENTS) continue;
    const ids = p.entryIds;
    if (!ids.length || ids.length > MAX_ENTRIES || new Set(ids).size !== ids.length
      || ids.some((id) => !safeId(id) || !own(result.entries, id) || result.entries[id].status !== 'confirmed'
        || weekMonday(result.entries[id].date) !== monday)) continue;
    const cents = ids.reduce((sum, id) => sum + result.entries[id].cents, 0);
    if (cents !== p.cents) continue;
    result.paid[monday] = { cents, paidAt: p.paidAt, entryIds: [...ids] };
    if (validStamp(p.helperUsedAt)) result.paid[monday].helperUsedAt = p.helperUsedAt;
  }
  for (const id of Object.keys(result.entries)) {
    // Paying needs every job checked, and a paid week takes no new jobs, so a waiting job here is bad data that could never be removed.
    if (result.entries[id].status === 'waiting' && result.paid[weekMonday(result.entries[id].date)]) delete result.entries[id];
  }
  return result;
}

export function catalogFor(track, chores) {
  const built = CHORE_CATALOG[track] || [];
  const overrides = object(object(chores?.jobs).overrides);
  const custom = Array.isArray(chores?.jobs?.custom) ? chores.jobs.custom : [];
  return [
    ...built.map((job) => ({ ...job, ...object(overrides[job.id]), active: object(overrides[job.id]).active !== false, custom: false })),
    ...custom.map((job) => ({ ...job, custom: true })),
  ];
}
export function activeJobs(track, chores) { return catalogFor(track, chores).filter((job) => job.active); }

export function addEntry(chores, { track, date, todayIso, jobId, otherName, by, nowIso, id }) {
  if (!isIso(date) || !validStamp(nowIso) || !safeId(id) || !safeId(jobId) || !['kid', 'parent'].includes(by)) return error('Invalid entry');
  if (own(chores.entries, id)) return error('Entry ID already exists');
  if (isPaid(chores, date)) return error('Week is paid');
  if (by === 'kid' && (date !== todayIso || !isIso(todayIso))) return error('Kids may log today only');
  let job;
  if (jobId === 'other') {
    const name = cleanText(otherName);
    if (!name) return error('Other job needs a name');
    job = { id: 'other', name, es: '', icon: '✨', cents: null };
  } else {
    job = activeJobs(track, chores).find((item) => item.id === jobId);
    if (!job) return error('Unknown or inactive job');
  }
  const entry = { id, date, jobId, name: job.name, es: job.es, icon: job.icon,
    cents: job.cents, status: 'waiting', by, addedAt: nowIso, checkedAt: null };
  return { chores: replaceEntry(chores, id, entry), entry };
}
export function removeEntry(chores, id, { by, todayIso } = {}) {
  const entry = own(chores.entries, id) ? chores.entries[id] : null;
  if (!entry) return error('Entry not found');
  if (isPaid(chores, entry.date)) return error('Week is paid');
  if (by !== 'parent' && !(by === 'kid' && entry.by === 'kid' && entry.status === 'waiting' && entry.date === todayIso && isIso(todayIso))) return error('Cannot remove entry');
  const entries = { ...chores.entries };
  delete entries[id];
  return { chores: { ...chores, entries } };
}
export function setEntryStatus(chores, id, status, nowIso) {
  const entry = own(chores.entries, id) ? chores.entries[id] : null;
  if (!entry || !['waiting', 'confirmed', 'declined'].includes(status) || !validStamp(nowIso)) return error('Invalid status change');
  if (isPaid(chores, entry.date)) return error('Week is paid');
  if (status === 'confirmed' && entry.cents === null) return error('Set a price first');
  return { chores: replaceEntry(chores, id, checked(entry, status, nowIso)) };
}
export function setEntryPrice(chores, id, cents) {
  const entry = own(chores.entries, id) ? chores.entries[id] : null;
  if (!entry) return error('Entry not found');
  if (isPaid(chores, entry.date)) return error('Week is paid');
  if (!priceOk(cents)) return error('Invalid price');
  return { chores: replaceEntry(chores, id, { ...entry, cents }) };
}
export function setEntryDate(chores, id, date) {
  const entry = own(chores.entries, id) ? chores.entries[id] : null;
  if (!entry || !isIso(date)) return error('Invalid date');
  if (isPaid(chores, entry.date) || isPaid(chores, date)) return error('Week is paid');
  return { chores: replaceEntry(chores, id, { ...entry, date }) };
}
function confirmEntries(chores, entries, nowIso) {
  if (!validStamp(nowIso)) return error('Invalid timestamp');
  let confirmed = 0;
  let skipped = 0;
  const updated = { ...chores.entries };
  for (const entry of entries) {
    if (entry.status !== 'waiting') continue;
    if (entry.cents === null) { skipped++; continue; }
    updated[entry.id] = checked(entry, 'confirmed', nowIso);
    confirmed++;
  }
  return { chores: confirmed ? { ...chores, entries: updated } : chores, confirmed, skipped };
}
export function confirmDay(chores, date, nowIso) {
  if (!isIso(date)) return error('Invalid date');
  if (isPaid(chores, date)) return error('Week is paid');
  return confirmEntries(chores, dayEntries(chores, date), nowIso);
}
export function confirmWeek(chores, mondayIso, nowIso) {
  if (!validMonday(mondayIso)) return error('Invalid week');
  if (own(chores.paid, mondayIso)) return error('Week is paid');
  return confirmEntries(chores, weekEntries(chores, mondayIso), nowIso);
}
const sorted = (entries) => entries.sort((a, b) => a.addedAt.localeCompare(b.addedAt) || a.id.localeCompare(b.id));
export function dayEntries(chores, date) {
  return isIso(date) ? sorted(Object.values(chores.entries).filter((e) => e.date === date)) : [];
}
export function weekEntries(chores, mondayIso) {
  return validMonday(mondayIso) ? sorted(Object.values(chores.entries).filter((e) => weekMonday(e.date) === mondayIso)) : [];
}
export function summarize(entries) {
  const total = { confirmedCents: 0, waitingCents: 0, declinedCents: 0, confirmedJobs: 0, waitingJobs: 0, declinedJobs: 0, unpriced: 0 };
  for (const entry of entries) {
    const prefix = entry.status;
    if (!['confirmed', 'waiting', 'declined'].includes(prefix)) continue;
    total[`${prefix}Jobs`]++;
    if (entry.cents === null) total.unpriced++;
    else total[`${prefix}Cents`] += entry.cents;
  }
  return total;
}
export function groupByJob(entries) {
  const groups = new Map();
  for (const entry of entries) {
    const key = JSON.stringify([entry.date, entry.jobId, entry.name, entry.status, entry.cents]);
    if (!groups.has(key)) groups.set(key, { jobId: entry.jobId, name: entry.name, es: entry.es, icon: entry.icon,
      date: entry.date, status: entry.status, cents: entry.cents, count: 0, entries: [] });
    const group = groups.get(key);
    group.count++;
    group.entries.push(entry);
  }
  return [...groups.values()];
}
export function monthTotals(chores, month) {
  return summarize(/^\d{4}-(0[1-9]|1[0-2])$/.test(month)
    ? Object.values(chores.entries).filter((e) => monthKey(e.date) === month) : []);
}
export function weekTotals(chores, mondayIso) { return summarize(weekEntries(chores, mondayIso)); }
export function splitCents(cents) {
  if (!priceOk(cents)) throw new RangeError('Invalid cents');
  return jarAmounts(cents);
}
export function payWeek(chores, mondayIso, nowIso) {
  if (!validMonday(mondayIso) || !validStamp(nowIso)) return error('Invalid payment');
  if (own(chores.paid, mondayIso)) return error('Week already paid');
  const entries = weekEntries(chores, mondayIso);
  if (entries.some((e) => e.status === 'waiting')) return error('Waiting entries remain');
  const confirmed = entries.filter((e) => e.status === 'confirmed');
  if (!confirmed.length) return error('Nothing confirmed');
  const cents = confirmed.reduce((sum, e) => sum + e.cents, 0);
  const paid = { cents, paidAt: nowIso, entryIds: confirmed.map((e) => e.id) };
  return { chores: { ...chores, paid: { ...chores.paid, [mondayIso]: paid } } };
}
export function reopenWeek(chores, mondayIso) {
  if (!validMonday(mondayIso)) return error('Invalid week');
  const paid = { ...chores.paid };
  delete paid[mondayIso];
  return { chores: { ...chores, paid } };
}
export function markPaidUsed(chores, mondayIso, nowIso) {
  if (!validMonday(mondayIso) || !validStamp(nowIso) || !own(chores.paid, mondayIso)) return error('Week is not paid');
  if (chores.paid[mondayIso].helperUsedAt) return error('This week was already used');
  return { chores: { ...chores, paid: { ...chores.paid,
    [mondayIso]: { ...chores.paid[mondayIso], helperUsedAt: nowIso } } } };
}
export function latestUnusedPaidWeek(chores) {
  const mondayIso = Object.keys(chores.paid).filter((monday) => !chores.paid[monday].helperUsedAt).sort().slice(-1)[0];
  if (!mondayIso) return null;
  const paid = chores.paid[mondayIso];
  return { mondayIso, cents: paid.cents, jobs: paid.entryIds.length, paidAt: paid.paidAt };
}

export function exportChores(store, nowIso) {
  if (!validStamp(nowIso) || !['guided', 'standard'].includes(store?.track)) return error('Cannot make a backup');
  return { format: 'codequest-chores', version: 1, exportedAt: nowIso,
    track: store.track, chores: normalizeChores(store.chores) };
}

export function importChores(chores, backup, mode, track) {
  const source = object(backup);
  if (source.format !== 'codequest-chores' || source.version !== 1 || !validStamp(source.exportedAt)
    || !['guided', 'standard'].includes(source.track) || !['merge', 'replace'].includes(mode)) return error('This is not a chore backup file');
  if (source.track !== track) return error(`This backup is from the ${source.track === 'guided' ? 'younger' : 'older'} son's iPad`);
  const raw = object(source.chores);
  if (!own(source, 'chores') || object(source.chores) !== source.chores || !Object.keys(raw).length
    || (own(raw, 'entries') && object(raw.entries) !== raw.entries)
    || (own(raw, 'jobs') && object(raw.jobs) !== raw.jobs)
    || (own(raw, 'paid') && object(raw.paid) !== raw.paid)
    || Object.keys(object(raw.entries)).length > MAX_ENTRIES
    || (Array.isArray(object(raw.jobs).custom) && raw.jobs.custom.length > MAX_CUSTOM)
    || Object.keys(object(raw.paid)).length > MAX_ENTRIES) return error('This backup has too many records or missing chores');
  const incoming = normalizeChores(raw);
  const current = normalizeChores(chores);
  if (mode === 'replace') return { chores: incoming,
    added: Object.keys(incoming.entries).length, skipped: 0 };
  const merged = { jobs: { overrides: { ...current.jobs.overrides }, custom: [...current.jobs.custom] },
    entries: { ...current.entries }, paid: { ...current.paid } };
  let added = 0;
  let skipped = 0;
  for (const [id, value] of Object.entries(incoming.jobs.overrides)) {
    if (own(merged.jobs.overrides, id)) skipped++;
    else { merged.jobs.overrides[id] = value; added++; }
  }
  const jobIds = new Set(merged.jobs.custom.map((job) => job.id));
  for (const job of incoming.jobs.custom) {
    if (jobIds.has(job.id) || merged.jobs.custom.length >= MAX_CUSTOM) skipped++;
    else { merged.jobs.custom.push(job); jobIds.add(job.id); added++; }
  }
  for (const [id, entry] of Object.entries(incoming.entries)) {
    if (own(merged.entries, id) || own(current.paid, weekMonday(entry.date))
      || Object.keys(merged.entries).length >= MAX_ENTRIES) skipped++;
    else { merged.entries[id] = entry; added++; }
  }
  for (const [monday, paid] of Object.entries(incoming.paid)) {
    if (own(merged.paid, monday) || paid.entryIds.some((id) => !own(merged.entries, id)
      || merged.entries[id].status !== 'confirmed' || weekMonday(merged.entries[id].date) !== monday
      || merged.entries[id].cents !== incoming.entries[id]?.cents)
      || Object.values(merged.entries).some((entry) => weekMonday(entry.date) === monday
        && (entry.status === 'waiting' || (entry.status === 'confirmed' && !paid.entryIds.includes(entry.id))))) skipped++;
    else { merged.paid[monday] = paid; added++; }
  }
  return { chores: normalizeChores(merged), added, skipped };
}
export function setJobPrice(chores, jobId, cents) {
  if (!priceOk(cents)) return error('Invalid price');
  const customIndex = chores.jobs.custom.findIndex((j) => j.id === jobId);
  if (customIndex >= 0) return { chores: { ...chores, jobs: { ...chores.jobs, custom: chores.jobs.custom.map((j, i) => i === customIndex ? { ...j, cents } : j) } } };
  if (![...CHORE_CATALOG.guided, ...CHORE_CATALOG.standard].some((j) => j.id === jobId)) return error('Unknown job');
  return { chores: { ...chores, jobs: { ...chores.jobs, overrides: { ...chores.jobs.overrides,
    [jobId]: { ...chores.jobs.overrides[jobId], cents } } } } };
}
export function setJobActive(chores, jobId, active) {
  if (typeof active !== 'boolean') return error('Invalid active value');
  const customIndex = chores.jobs.custom.findIndex((j) => j.id === jobId);
  if (customIndex >= 0) return { chores: { ...chores, jobs: { ...chores.jobs, custom: chores.jobs.custom.map((j, i) => i === customIndex ? { ...j, active } : j) } } };
  if (![...CHORE_CATALOG.guided, ...CHORE_CATALOG.standard].some((j) => j.id === jobId)) return error('Unknown job');
  return { chores: { ...chores, jobs: { ...chores.jobs, overrides: { ...chores.jobs.overrides,
    [jobId]: { ...chores.jobs.overrides[jobId], active } } } } };
}
export function addCustomJob(chores, { id, name, es, icon, cents }) {
  const cleanId = typeof id === 'string' ? id.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) : '';
  if (blocked.has(id) || !safeId(cleanId) || blocked.has(cleanId) || !cleanText(name) || !priceOk(cents) || chores.jobs.custom.length >= MAX_CUSTOM
    || [...CHORE_CATALOG.guided, ...CHORE_CATALOG.standard, ...chores.jobs.custom].some((j) => j.id === cleanId)) return error('Invalid or duplicate custom job');
  const custom = { id: cleanId, name: cleanText(name), es: cleanText(es), icon: cleanText(icon), cents, active: true };
  return { chores: { ...chores, jobs: { ...chores.jobs, custom: [...chores.jobs.custom, custom] } }, job: custom };
}
export function removeCustomJob(chores, id) {
  if (!chores.jobs.custom.some((j) => j.id === id)) return error('Unknown custom job');
  return { chores: { ...chores, jobs: { ...chores.jobs, custom: chores.jobs.custom.filter((j) => j.id !== id) } } };
}

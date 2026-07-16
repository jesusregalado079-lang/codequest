// Profiles + progress in localStorage. One key, plain JSON, export/import.
const KEY = 'codequest-v1';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? { profiles: [], active: null };
  } catch {
    return { profiles: [], active: null };
  }
}

function save(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local

export function getProfiles() {
  return load().profiles;
}

export function getActiveProfile() {
  const s = load();
  return s.profiles.find((p) => p.id === s.active) ?? null;
}

export function setActiveProfile(id) {
  const s = load();
  s.active = id;
  save(s);
}

export function createProfile(name, avatar, mode) {
  const s = load();
  const p = {
    id: crypto.randomUUID(),
    name,
    avatar,
    mode, // 'sprout' (5-7) or 'explorer' (8-10)
    stars: {}, // levelId -> 1..3
    streak: { count: 0, last: null },
  };
  s.profiles.push(p);
  s.active = p.id;
  save(s);
  return p;
}

export function deleteProfile(id) {
  const s = load();
  s.profiles = s.profiles.filter((p) => p.id !== id);
  if (s.active === id) s.active = s.profiles[0]?.id ?? null;
  save(s);
}

export function completeLevel(levelId, stars) {
  const s = load();
  const p = s.profiles.find((x) => x.id === s.active);
  if (!p) return;
  p.stars[levelId] = Math.max(p.stars[levelId] ?? 0, stars);
  const t = today();
  if (p.streak.last !== t) {
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA');
    p.streak.count = p.streak.last === yesterday ? p.streak.count + 1 : 1;
    p.streak.last = t;
  }
  save(s);
}

export function streakToday(p) {
  return p.streak.last === today();
}

export function exportData() {
  return localStorage.getItem(KEY) ?? '{"profiles":[],"active":null}';
}

export function importData(json) {
  const parsed = JSON.parse(json); // throws on garbage — caller shows message
  if (!Array.isArray(parsed.profiles)) throw new Error('not a CodeQuest backup');
  // normalize every field — backup files are user-supplied and untrusted
  const profiles = parsed.profiles.map((p) => ({
    id: typeof p?.id === 'string' ? p.id : crypto.randomUUID(),
    name: String(p?.name ?? 'Explorer').slice(0, 14),
    avatar: String(p?.avatar ?? '🦊').slice(0, 4),
    mode: p?.mode === 'sprout' ? 'sprout' : 'explorer',
    stars: Object.fromEntries(
      Object.entries(p?.stars ?? {}).filter(
        ([, v]) => Number.isInteger(v) && v >= 1 && v <= 3
      )
    ),
    streak: {
      count: Number.isInteger(p?.streak?.count) ? p.streak.count : 0,
      last: typeof p?.streak?.last === 'string' ? p.streak.last : null,
    },
  }));
  const active = profiles.some((p) => p.id === parsed.active)
    ? parsed.active
    : profiles[0]?.id ?? null;
  save({ profiles, active });
}

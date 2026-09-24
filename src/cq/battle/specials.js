// Computer Quest horde battle: the power meter and each lesson's special move. Pure data + helpers,
// no DOM, no drawing, no clock. The engine (engine.js) applies the effects.
//
// How it plays: defeating monsters fills the hero's power meter (POWER_GAIN each); when it is full
// (SPECIAL_MAX) the F key casts the spell for the lesson he just passed, spending the whole meter.
// The spell is tied to the LESSON, not to gear: a battle happens before that lesson's chest opens, so
// gear-based spells would arrive one battle too late. Both tracks get one spell per lesson at the same
// tier of power (equal loot, no "easy" track); the names echo real Windows skills, but the game only
// ever listens for the plain F key (never Ctrl / Alt / Windows-key combos).

export const SPECIAL_MAX = 12;

// Meter points per defeated monster. Bosses give a little more; the two slimes a Mega Slime splits
// into add their own points when they are defeated.
export const POWER_GAIN = {
  slime: 2, goblin: 2, mimic: 3, 'mega-slime': 3, 'big-glitch': 4,
};

// kind decides the effect (see engine.js castSpecial). All distances are in tiles, times in seconds.
export const SPECIALS = {
  guided: [
    { id: 'start-burst', name: 'Start Burst', skill: 'the Start button', kind: 'burst', radius: 3.6, dmg: 2, knock: 1.6, stun: 0.6 },
    { id: 'window-dash', name: 'Window Dash', skill: 'switching windows', kind: 'dash', distance: 5, width: 0.9, dmg: 2, stun: 0.4, invuln: 0.6 },
    { id: 'folder-fort', name: 'Folder Fort', skill: 'folders', kind: 'fort', duration: 3, radius: 2.4, push: 9, dmg: 1 },
    { id: 'mass-rename', name: 'Mass Rename', skill: 'renaming', kind: 'rename', duration: 4, bossStun: 1 },
    { id: 'stop', name: 'STOP!', skill: 'the STOP rule', kind: 'freeze', duration: 3, bossDuration: 1.5 },
  ],
  standard: [
    { id: 'alt-tab-dash', name: 'Alt-Tab Dash', skill: 'Alt+Tab', kind: 'dash', distance: 6, width: 1, dmg: 2, stun: 0.4, invuln: 0.7 },
    { id: 'quick-save', name: 'Quick Save', skill: 'saving your work', kind: 'save', heal: 2, invuln: 2, radius: 2.6, knock: 1.2, stun: 0.4 },
    { id: 'copy-paste-volley', name: 'Copy-Paste Volley', skill: 'copy and paste', kind: 'volley', dirs: 8, dmg: 2, range: 7, pasteDelay: 0.3 },
    { id: 'select-all', name: 'Select All', skill: 'selecting everything', kind: 'blast', dmg: 3, stun: 0.6 },
    { id: 'popup-blocker', name: 'Pop-up Blocker', skill: 'spotting pop-ups', kind: 'clear', bossDmg: 4 },
  ],
};

const clampLesson = (lessonNumber) => {
  const n = Math.floor(Number(lessonNumber));
  return Number.isFinite(n) ? Math.max(1, Math.min(5, n)) : 1;
};

// The spell cast in the battle after lesson `lessonNumber` (1..5) on `track`. A fresh plain-data copy,
// so a battle state never shares objects with this module.
export function specialFor(track, lessonNumber) {
  const list = SPECIALS[track === 'guided' ? 'guided' : 'standard'];
  return { ...list[clampLesson(lessonNumber) - 1] };
}

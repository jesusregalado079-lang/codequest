# Computer Quest — Horde Battle (Phase 4 contract)

Status: lead design · 2026-09-16.
**The battle is the celebration after a passed lesson, never a gate.** It can't be failed in a way that costs anything. It always ends with the chest.
Gear effects come from `character-and-loot.md` §2, with the numbers in `items.js` `battle`. Everything here is original art and naming.

## 1. Where it lives in the lesson
- **Key screen:** "🗝️ You earned a key!" → primary button **"⚔️ Defend the chest!"** → battle → results → chest.
- **Skipping:** there is also a small secondary link **"Skip to the chest"** for low-time days.
- **First battle:** the key screen offers "Defend the chest!". Once a battle has been recorded, its primary button opens the chest; a secondary button lets the kid play the battle again.
- **Leaving or reloading mid-battle:** it counts as not played. The key screen offers the battle again.
- **Retries (2026-09-23):** the earlier "no replays" rule is superseded. A kid can try again from results or the key screen, or start over from the pause card. Each attempt starts at wave 1 with full hearts, empty POWER, and a fresh seed. `tries` counts completed retries, capped at 99. The stored result upgrades only when a retry ranks higher: `skipped < fell < time < victory`; a weaker or equal result leaves the stored outcome, time, poofs, and playedAt unchanged. Gems are paid once: the first real attempt earns `battleGems(poofs)`, including when it follows an initial skip; every later attempt pays zero. Leaving or reloading during a retry saves nothing. Skipping from a retry pause menu saves nothing new. Battles remain tied to passed lessons.

## 2. Round structure (cap: ~5 minutes)

> **Amended 2026-09-16 (length):** a real full-gear playtest cleared 3 waves in 34 s, well short of Jesse's "3-5 min horde round". Changes:
> - **Waves:** the round is now **5 waves**. Wave 3 ends with a **mid-boss Mega Slime**, for all lessons. Wave 5 ends with the **final mini-boss** (Mega Slime for n ≤ 3, Big Glitch for n ≥ 4).
> - **Enemies per wave (standard):** w1 2+n · w2 3+n · w3 3+n (+ mid-boss) · w4 3+n · w5 4+n (+ final mini-boss).
> - **Guided track:** 1 fewer enemy per wave, minimum 2.
> - **Mimic placement (n = 5):** standard has 1 mimic in w2, 1 in w4, 1 in w5. Guided has 1 mimic in w2 only.
> - **Timer:** starts at **5:00**.
> - **HUD:** "Wave N / 5".
> - **Balance targets unchanged.**
> - **Outcome 'victory':** all 5 waves cleared.
> - This supersedes the 3-wave table below wherever they conflict.
>
> **Length round 2 (after balance check):** bare-handed lesson 1 dropped to ~30% wins, with most falls at the second Mega Slime. Fixes:
> - **Wave-clear bonus:** at the start of waves 2–5 the hero heals +1 heart (capped), with a `heal` event and a "Wave cleared! +❤️" banner.
> - **Boss hits:** a melee hit knocks a boss back 0.5 and stuns it 0.15 s.
> - **Early Mega Slimes:** Mega Slime HP is 4 when lesson n ≤ 2 (6 otherwise).
> - **Balance targets unchanged.**
>
> **Beginner safety net (2026-09-16, after the lead's browser playtest):** an unaimed beginner fell in about 20 s with 0 poofs. Changes:
> - **Second Wind (lessons n ≤ 2):** the hero gets one automatic revive to FULL hearts, with 1.5 s of invulnerability, in place and without teleporting. It fires when hearts reach 0. It happens after the Save Stone revive if both are available: the stone first, then Second Wind. It emits a `revive` event with source 'second-wind' and shows the banner "Second Wind! Keep going!".
> - **How-to card tip:** "Tip: face a monster, then press Space."
> - **Record on end:** the result is recorded the moment the battle ends. The 1.3 s end banner is only visual.
- **3 waves.** A wave spawns from the arena edges over ~4 s; the next wave starts 2.5 s after the last enemy of the current wave poofs.
- **Wave 3 ends with a mini-boss.**
- **Timer:** starts at 4:00 and counts down, shown in the HUD. At 0:00 the round ends as **"Time! The chest is safe."** with no loss.
- **Win:** all 3 waves cleared → **"Victory!"**.
- **Hero falls** (0 hearts, no revive left) → **"The monsters ran off! Your chest is still safe."** Results are still recorded, and gems still count.
- **Pause:** Esc, the visible Pause button, or the tab being hidden → controls and **Resume**, **Start over**, **Skip to the chest**. Start over requires a second in-card choice.

**Difficulty by lesson number n (1–5) and track** (the 9yo guided track gets 1 fewer enemy per wave; it's his reward, not a test):

| Wave | Enemies (standard) | Guided |
|---|---|---|
| 1 | 2 + n | 1 + n (min 2) |
| 2 | 3 + n | 2 + n |
| 3 | 3 + n, then the mini-boss | 2 + n, then the mini-boss |

(Amended 2026-09-16 after balance probing. The first battle happens bare-handed, before the first chest, and a simple bot won only ~40% at the original counts. **Acceptance target:** a "face the nearest enemy and swing" bot wins ≥ 70% of lesson-1 battles bare-handed on both tracks, and ≥ 85% of lesson-5 battles wearing that track's full set. Mega Slime HP is lowered to 6.)

(Amended again 2026-09-16, round 2, after the first tuning pass fell short. These are design changes, not just knob tuning:
- **Melee hits bonk:** the enemy is knocked back 0.9 tiles (was 0.3) and stunned 0.25 s. A stunned enemy doesn't move or deal contact damage.
- **Mimic bite:** damage is 1 (was 2).
- **Guided track, lesson 5:** has exactly 1 mimic (in wave 2); the standard track keeps 3.
- **Heart drops:** each regular (non-boss) enemy poof drops a heart pickup with probability 1/8 (via rng). Touching it heals +1 heart (capped). It despawns after 8 s and is drawn as a small pixel heart.
- **Tuned knobs stay:** slime hop 0.28/0.42, goblin speed 2.4, hero invulnerability 1.3 s, contact distance 0.5 for small enemies.
- **The acceptance bot** also slides around blocks the same way enemies do.
- **Revised targets:** lesson 1 bare-handed ≥ 70% guided and ≥ 60% standard; lesson 5 with the full track set ≥ 80% on both tracks.)

**Enemy mix per lesson:**
- n = 1–2: Glitch Slimes only.
- n = 3–4: slimes plus Clutter Goblins, 1 goblin in 3.
- n = 5: slimes, goblins, plus 2 Pop-up Mimics placed in wave 2 and 1 in wave 3.

**Mini-boss:** Mega Slime for n ≤ 3; Big Glitch for n ≥ 4.

## 3. Arena and camera
- **Arena:** a single screen, top-down, **20 × 12 tiles**.
- **Tiles:** checker grass with a stone border wall 1 tile thick, plus 4 fixed 1×1 stone blocks placed symmetrically as cover. All units are in tiles; the renderer picks the pixel size to fit the canvas (the canvas keeps a 5:3 aspect ratio).
- **Movement and collision:** walls and blocks stop movement. Enemies and the hero collide with walls, not with each other (overlaps allowed).
- **Hero spawn:** the center.
- **The chest:** a decorative pixel chest drawn at the center-bottom. Enemies don't target it; it's flavor only.

## 4. Hero
- **Look:** the kid's real hero via `drawCharacter` (look + equipped + worn), 1 tile wide. Facing follows the last move direction.
- **Hearts:** `maxHearts(cq)` (5, or 6 with the set bonus).
- **Invulnerability:** 1.0 s after taking a hit (the sprite blinks). Also a knockback of 0.6 tiles away from the source.
- **Speed:** 4.5 tiles/s × (1 + `taskbar-boots` moveSpeed) × (0.5 while blocking).
- **Attack (Space):** uses the mainHand melee stats (`BARE_HANDS` when empty).
  - A hitbox arc in front of the hero: reach tiles, 90° arc, or 120° for the Switch Sword's wide stance.
  - Lasts 0.15 s, and each enemy can be hit once per swing.
  - Respects cooldown.
  - Drives `drawCharacter`'s `attack` 0..1.
- **Gear abilities** (only if equipped; a key with no matching item does nothing):
  - **Switch Sword (Q):** toggles quick/wide. The HUD shows the stance.
  - **Stop Sign Shield (hold Shift):** blocks all damage from sources within ±60° of the facing direction. It shows raised (`blocking: true`).
    - A blocked hit knocks the ENEMY back 0.8 tiles and gives the hero 0.4 s of block grace (further blocked hits in that window don't re-push).
    - The hero is not pushed.
    - A source at ~zero distance counts as frontal.
  - **Rename Rune (E):** the nearest non-boss enemy within 4 tiles becomes a Chicken for 3 s. A chicken wanders randomly, deals no damage and takes damage normally. Cooldown 8 s, with a HUD cooldown ring. If no target is in range, nothing happens and the cooldown isn't consumed.
  - **Copy Crystal Staff (E):** fires a bolt in the facing direction (speed 10 tiles/s, range 6, dmg 1). A twin bolt runs parallel, offset 0.35 tiles, also dmg 1. If the offset side is inside a solid, the twin goes on the other side. Cooldown 0.5 s. Bolts stop at walls and blocks.
  - **If both a rune and a staff are somehow equipped** (can't happen within one track): E uses the staff.
  - **Folder Backpack (1):** eats the apple: +2 hearts (capped at max). Once per battle; the HUD shows 🍎 or an empty slot.
  - **Save Stone:** placed at the hero spawn when the battle starts. Key **2** moves it to the hero's position (cooldown 1 s). When hearts reach 0 for the first time, the hero revives at the stone with 3 hearts and 1.5 s of invulnerability. Once per battle.
  - **Undo Amulet (R):** once per battle, restores the hero's position and hearts from 3.0 s ago. It keeps a 3 s history ring sampled at every update and uses the oldest sample. It doesn't undo enemy state.
  - **Scam-Spotter Helmet:** Pop-up Mimics are revealed from spawn (red outline and a "!" above them). Incoming damage is −1 (minimum 1), at most once every 5 s.
  - **Taskbar Boots:** speed, as above.
  - **Set bonus:** a gold aura shimmer on the hero, and the +1 heart is already included in `maxHearts`.
- **Trail cosmetic** (`worn.trail`): small particles behind the hero while moving. Leaf is green squares; Sparkle is white/yellow twinkles.

## 5. Enemies (blocky cartoon; **defeated enemies poof** into a puff of 6–10 pixel squares plus a tiny "poof" sound. No blood, no gore, no death animation)
| id | Name | HP | Speed (tiles/s) | Damage | Behavior | Look |
|---|---|---|---|---|---|---|
| `slime` | Glitch Slime | 2 | 1.6 (hops: move 0.35 s, pause 0.35 s) | 1 on contact | chases the hero | teal jelly cube with 2 pixel eyes and a "glitch" offset stripe that flickers |
| `goblin` | Clutter Goblin | 3 | 2.8 | 1 on contact | chases; every 3 s it drops a harmless paper-scrap particle (flavor) | small green goblin with a messy paper stack on its head |
| `mimic` | Pop-up Mimic | 4 | 0 idle / 6 lunge | 1 on bite | looks like a small chest until the hero is within 2.5 tiles, then lunges for 0.4 s toward the hero and rests 1.2 s. Revealed by the helmet. | chest with teeth when open, a "CLICK ME!" pixel tag when closed |
| `mega-slime` | Mega Slime | 6 | 1.2 | 1 | chases; on poof it splits into 2 regular slimes | 2×2-tile slime with a crown pixel |
| `big-glitch` | Big Glitch | 12 | 1.5 | 2 | chases; every 4 s it teleports 3 tiles toward the hero with a flicker warning 0.5 s before | 2×2-tile purple/black static cube |

- Enemies flash white for 0.1 s when hit and get knocked back 0.3 tiles.
- **Spacing:** enemies stop chasing at their contact distance. They never overlap the hero's center.
- **Obstacles:** when a straight chase is blocked by a solid, the enemy slides along the free axis.
- **Clutter Goblin:** emits a `scrap` event every 3 s (flavor particle).
- **Reach bonus vs 2×2 bosses:** melee reach +0.5 tiles; bolt hit radius 1.0.
- A Chicken (Rename Rune) is a white pixel chicken sprite for its duration.
- The mini-boss has a HUD health bar.

## 6. HUD and feel
- **Top bar:** hearts (pixel hearts), the wave label "Wave 2 / 3", timer, poof counter.
- **Bottom bar:** ability slots actually equipped, each with a key label and cooldown ring:
  - [Space] weapon icon
  - [Q] stance (sword only)
  - [Shift] shield
  - [E] rune or staff
  - [R] amulet (used or ready)
  - [1] apple
  - [2] stone
- **First battle of all time only:** interactive training replaces the timed how-to card. The card remains as a fallback after "Skip training" so the kid sees the keys once. The first battle happens after his first lesson, before he owns any gear.
- **Sounds:** WebAudio tones only, defined in the battle module (don't edit `src/ui/sounds.js`): swing, hit, poof, hero hurt, pickup/heal, wave start, victory.
- **Motion:** respects `prefers-reduced-motion`. No screen shake; puffs are shorter.
- **Keyboard:** `preventDefault` for the game's keys while the battle has focus (arrows, WASD, Space, Shift, E, Q, R, 1, 2, F, Esc). Ctrl, Alt, Meta, and F-keys are not bound. Tab moves focus normally during play; within the pause dialog it cycles among the dialog buttons.
- **No keyboard** (touch-only device detected via `matchMedia('(pointer: coarse)')` and no key pressed within 3 s): show "This battle needs a keyboard" with a **Skip to the chest** button.

## 7. Results and storage
- **Results screen:** Victory / Time / "ran off" headline, poofs, time played, hearts left, gems for this attempt ("Already earned" on an unpaid retry), a primary "Open your chest ▶", a retry button, and "Learn the controls".
- **`LessonState.battle`:** `{ playedAt: ISO, ms: number, poofs: number, outcome: 'victory' | 'time' | 'fell' | 'skipped', gems: number, tries: number }`, or null. `normalizeLessons` validates it:
  - outcome in the set
  - numbers clamped: ms 0..600000, poofs 0..500, gems 0..10, tries 1..99 (old saves default to 1)
  - battle is only kept if `passedAt` is set
  - **Decision 2026-09-16:** wrong TYPES (a non-ISO playedAt, an unknown outcome, non-finite or non-number counts) drop the whole record. Out-of-range or non-integer finite numbers are CLAMPED/floored and the record is kept, so a tampered record can't be dropped to replay a battle for gems.
- **`recordBattle(cq, lesson, result, nowIso)`** (lesson-logic):
  - requires phase 'key' and `passedAt`, and throws if `battle` is already set
  - stores the record and adds `battleGems(poofs)` gems (or 0 for 'skipped')
  - returns `{ cq, gems }`
- **`recordBattleRetry(cq, lesson, result, nowIso)`** requires a passed lesson at the key phase with an existing battle record. It increments `tries`, upgrades the stored result only by the ranking in §1, and returns `{ cq, gems }` where `gems` is zero except for the first real play after a stored skip.
- **"Skip to the chest" before playing** → `recordBattle` with outcome 'skipped', poofs 0, ms 0. The chest screen opens immediately, while saved phase stays at `key` until the first chest answer; leaving before that answer returns to the key screen with a replay button. A later first real retry is still eligible for its one gem award.
- **Report:** `Time: lesson X min · battle Y min`, where Y = round(ms/60000), with a minimum of "<1" when 0 < ms < 60000. It shows "skipped" for skipped and "—" for null, followed by `, N tries` when N > 1.

## 8. Engine architecture (testable)
- `src/cq/battle/content.js`: enemy defs, the wave plan builder `wavePlan(lessonNumber, track, rng)`, the arena layout.
- `src/cq/battle/engine.js`: **pure deterministic simulation**, with no DOM or canvas.
  - `createBattle({ cq, lesson, rng })` → state.
  - `step(state, input, dt)` → new state + `events[]`. It runs a fixed dt of 1/60, using an accumulator in the UI.
  - `input` is `{ up, down, left, right, attack, block, ability, stance, undo, apple, stone, pause }` as held/pressed booleans with edge detection done by the engine.
  - Events: `swing`, `hit`, `poof`, `hurt`, `heal`, `wave`, `revive`, `undo`, `chicken`, `bolt`, `end`.
  - `resultOf(state)` → `{ outcome, ms, poofs }`.
  - No `Math.random` inside; all randomness goes through the injected rng.
- `src/cq/battle/render.js`: canvas drawing of the arena, enemies, bolts, puffs, trail, HUD. It uses `drawCharacter` / `drawIcon`.
- `src/cq/battle/battle-ui.js`: mounts inside the lesson screen. It handles keyboard mapping, the rAF loop with a fixed-step accumulator, pause/visibility, training, the how-to card, and handing the result to the lesson UI. The lesson UI records completed attempts. The mount cleans up listeners and rAF on exit.


## 8a. Specials: the power meter and a spell per lesson (added 2026-09-23)
Jesse asked for "magic moves or a special move" in the waves. Decisions: a shared **power meter** plus **one spell per lesson**, **big and dramatic**, for **both boys** with names that echo real Windows skills.
- **Meter:** `hero.power`, 0..`SPECIAL_MAX` (12). A poof adds `POWER_GAIN` (slime 2, goblin 2, mimic 3, Mega Slime 3, Big Glitch 4; the two slimes a Mega Slime splits into add their own). Being hurt never drains it. Poofs caused by a special (including its own bolts) add nothing, so a screen-clearing spell can't refill itself. A `power` event with `ready: true` fires once when it fills. Measured with the acceptance bot: about 3 casts per battle in lessons 1-2 and 5-6 in lesson 5.
- **Cast:** the **F** key (edge-triggered; holding casts once) spends the whole meter and casts `state.special`. A not-full press only emits a soft `special-wait` event. The game never listens for Ctrl/Alt/Windows-key combos: the shortcut names (Alt-Tab, Save, Copy-Paste, Select All) only echo the skill.
- **Which spell:** the spell of the lesson just passed (`specialFor(track, lessonNumber)`), NOT of a gear item. The chest opens after the battle, so gear-based spells would arrive one battle too late. Equal tier by lesson across the tracks.
- **The ten** (data in `specials.js`, effects in `engine.js castSpecial`; every one also emits a `special` event with `{id, name, skill, kind, x, y, fromX, fromY, facing, radius|width|duration}`):

| Lesson | Guided | Standard |
|---|---|---|
| 1 | Start Burst: ring blast (radius 3.6, 2 dmg, knockback, stun) | Alt-Tab Dash: blink 6 tiles along facing, 2 dmg to everything crossed, invulnerable 0.7 s |
| 2 | Window Dash: dash 5 tiles, 2 dmg, invulnerable 0.6 s | Quick Save: +2 hearts, 2 s shield, light shove and stun around him |
| 3 | Folder Fort: 3 s invulnerable ring (radius 2.4) that shoves monsters out, 1 dmg on cast | Copy-Paste Volley: 8 bolts in a ring (2 dmg, range 7) then a pasted copy 0.3 s later |
| 4 | Mass Rename: every regular monster becomes a chicken for 4 s, bosses stunned 1 s | Select All: every monster takes 3 dmg and is stunned 0.6 s |
| 5 | STOP!: every monster frozen 3 s (bosses 1.5 s; a Big Glitch's teleport is postponed) | Pop-up Blocker: every regular monster (mimics included) poofs, bosses take 4 |
- **Bosses** get about half of any shove or stun. Spells are wall-safe (dash stops at walls, pushes respect solids).
- **UI:** the HUD shows a POWER bar with the F key and, once full, the spell name; casting shows the name as the banner and plays a cast tone. The first-battle how-to card gains an F line. Dev only: `?power=full` starts with a full meter and `?power=always` refills it after each cast (removed from the production build).
- **Tests:** `test/cq-battle-specials.test.js` (meter, F key, each spell, determinism, key mapping, how-to line) and a second balance loop in `test/cq-battle.test.js` where the bot casts when full.

## 9. Pause, retry and training (2026-09-23)

- **Pause card:** the top HUD has a visible, touch-sized "⏸ Pause" button; Esc and hidden-tab auto-pause still work. The dialog repeats the movement, attack, equipped gear, and F spell controls plus the facing tip. Resume gets focus. The HUD and arena behind the dialog are inert. "Start over" first shows "Start over? The monsters come back." with "Yes, start over" and "No, keep playing". Confirming creates a fresh battle. "Skip to the chest" on a retry records nothing.
- **Training entry:** the first battle for a profile starts with training. "🎓 Learn the controls" on the key and results screens opens it on demand. Training never changes lesson state, poofs, or gems. Skipping any step marks the how-to as seen; on the first-ever automatic training, the passive controls card appears once before the real battle. On-demand training returns to its source screen when skipped and starts a real battle when "Start the battle ▶" is pressed.
- **Training steps:** walk to a glowing star using arrows or WASD; face and poof a still, harmless slime with Space; try any equipped Q, Shift, E, R, 1, or 2 key (or tap "Got it"), omitted when no such gear is equipped; cast the lesson spell with F using a filled POWER meter and three harmless slimes; then choose "Start the battle ▶" or "Practice more". Every step has "Skip training". Completion uses the real engine state and events. The pure transition function lives in `battle/tutorial.js`; the battle UI creates quiet engine states and positions the DOM card and star over the rendered arena.

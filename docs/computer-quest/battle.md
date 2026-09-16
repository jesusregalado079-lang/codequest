# Computer Quest — Horde Battle (Phase 4 contract)

Status: lead design · 2026-09-16.
**The battle is the celebration after a passed lesson, never a gate.** It can't be failed in a way that costs anything. It always ends with the chest.
Gear effects come from `character-and-loot.md` §2, with the numbers in `items.js` `battle`. Everything here is original art and naming.

## 1. Where it lives in the lesson
- **Key screen:** "🗝️ You earned a key!" → primary button **"⚔️ Defend the chest!"** → battle → results → chest.
- **Skipping:** there is also a small secondary link **"Skip to the chest"** for low-time days.
- **One battle per lesson:** only the FIRST time the key screen is reached. After `battle.playedAt` is set, the key screen's primary button goes straight to the chest ("Open your chest ▶").
- **Leaving or reloading mid-battle:** it counts as not played. The key screen offers the battle again.
- **Replays:** no battle replays, and no battle outside lessons. That's anti-grind.

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
- **Pause:** Esc or the tab being hidden → pause overlay: **Resume** / **Skip to the chest** (ends the round as played).

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
- **First battle of all time only:** a 5 s dismissable "How to play" card: arrows/WASD move · Space attack · plus only the keys for his equipped gear. The first battle happens after his first lesson, before he owns any gear.
- **Sounds:** WebAudio tones only, defined in the battle module (don't edit `src/ui/sounds.js`): swing, hit, poof, hero hurt, pickup/heal, wave start, victory.
- **Motion:** respects `prefers-reduced-motion`. No screen shake; puffs are shorter.
- **Keyboard:** `preventDefault` only for the game's keys while the battle has focus (arrows, WASD, Space, Shift, E, Q, R, 1, 2, Esc). **Never** bind or block Ctrl, Alt, Meta, Tab or F-keys.
- **No keyboard** (touch-only device detected via `matchMedia('(pointer: coarse)')` and no key pressed within 3 s): show "This battle needs a keyboard" with a **Skip to the chest** button.

## 7. Results and storage
- **Results screen:** Victory / Time / "ran off" headline, poofs, time played, hearts left, **+N 💎** where N = `battleGems(poofs)` (max 10), and a primary button "Open your chest ▶".
- **`LessonState.battle`:** `{ playedAt: ISO, ms: number, poofs: number, outcome: 'victory' | 'time' | 'fell' | 'skipped', gems: number }`, or null. `normalizeLessons` validates it:
  - outcome in the set
  - numbers clamped: ms 0..600000, poofs 0..500, gems 0..10
  - battle is only kept if `passedAt` is set
  - **Decision 2026-09-16:** wrong TYPES (a non-ISO playedAt, an unknown outcome, non-finite or non-number counts) drop the whole record. Out-of-range or non-integer finite numbers are CLAMPED/floored and the record is kept, so a tampered record can't be dropped to replay a battle for gems.
- **`recordBattle(cq, lesson, result, nowIso)`** (lesson-logic):
  - requires phase 'key' and `passedAt`, and throws if `battle` is already set
  - stores the record and adds `battleGems(poofs)` gems (or 0 for 'skipped')
  - returns `{ cq, gems }`
- **"Skip to the chest" before playing** → `recordBattle` with outcome 'skipped', poofs 0, ms 0. So "one battle per lesson" also covers skips.
- **Report:** `Time: lesson X min · battle Y min`, where Y = round(ms/60000), with a minimum of "<1" when 0 < ms < 60000. It shows "skipped" for skipped and "—" for null.

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
- `src/cq/battle/battle-ui.js`: mounts inside the lesson screen. It handles keyboard mapping, the rAF loop with a fixed-step accumulator, pause/visibility, the how-to card, results, and calling `recordBattle`. It cleans up all listeners and rAF on exit.

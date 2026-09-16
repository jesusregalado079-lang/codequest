# Computer Quest — Character, Gear & Loot Design (Phase 2 contract)

Status: lead design · 2026-09-16 · source of truth for the P2 build tickets and for P4 battle tuning.
The repo is public, so everything here is an **original design**. It's blocky and voxel-style in the Minecraft tradition, but it uses no Minecraft names, skins, mobs, or textures.

## Design goals (why it's shaped this way)
1. **Learning drives every reward.**
   - Gear comes only from passed lessons.
   - Gems come from lessons, Practice Missions, battles, and typing.
   - There's no way to grind a battle for loot, because battles only happen after a passed lesson.
2. **Every item echoes the skill that earned it.** Switch Sword ↔ Alt+Tab, Undo Amulet ↔ Ctrl+Z. The game quietly re-teaches the lesson.
3. **Visible progression.**
   - Locked gear shows as a silhouette with its name and "Pass Lesson G3 to unlock". The boy always sees his next goal.
   - His Hero Rank climbs per lesson.
4. **Fair between brothers.**
   - Same number of items per lesson, same rarity, same power budget.
   - Different names and looks.
   - No sibling leaderboard, no comparisons shown.
5. **Agency.**
   - Full free customization of the look from the start.
   - He picks which unlocked gear to wear.
   - At pack completion he **chooses** his legendary reward.
6. **Dignified, not babyish.** Clean pixel art, real-sounding item names, rarity colors like the games they know.

---

## 1. The character (look, free and changeable anytime)

The body is a blocky voxel figure on a **16 × 32 unit grid**, front view:
- head 8×8 at (4,0)
- body 8×12 at (4,8)
- arms 4×12 at (0,8) and (12,8)
- legs 4×12 at (4,20) and (8,20)

Four facings: `down` (front), `up` (back), `left`, `right` (side profile: head 8 wide, body/arm/leg 4 wide).

| Option | Ids → hex |
|---|---|
| `skin` (6) | `s1 #f6d7c3` · `s2 #eebc98` · `s3 #d9a07a` · `s4 #b97a56` · `s5 #8d5a3b` · `s6 #5e3a24` |
| `hairStyle` (7) | `buzz` · `short` · `spiky` · `curly` · `long` · `swoop` · `none` |
| `hairColor` (8) | `black #1c1714` · `darkbrown #3b2417` · `brown #6b4226` · `blonde #e0b85a` · `red #a8432a` · `white #e8e8e8` · `blue #3c6fd6` · `green #3aa45c` |
| `eyeColor` (5) | `brown #5b3a1e` · `blue #3a7bd5` · `green #3a9a5b` · `gray #6d7680` · `hazel #8a6b2f` |
| `shirtStyle` (4) | `tee` · `hoodie` (hood outline + pocket) · `striped` (2-unit horizontal stripes, darker shade) · `jacket` (open front, white undershirt strip) |
| `shirtColor` (10) | `red #d64545` · `orange #e8833a` · `yellow #e8c33a` · `green #4caf50` · `teal #2bb3a6` · `blue #3f7fd9` · `purple #8a5cd6` · `pink #e06aa8` · `black #2a2a2e` · `white #f0f0f0` |
| `pantsColor` (6) | `denim #3b5b8c` · `black #26262b` · `khaki #b59a6a` · `gray #6b7078` · `olive #4a6b3a` · `brown #6b4a2e` |
| `shoesColor` (6) | `white #eeeeee` · `black #222222` · `red #c83c3c` · `blue #3a66c8` · `brown #6b4226` · `gray #7a7a7a` |

`DEFAULT_LOOK = { skin:'s2', hairStyle:'swoop', hairColor:'black', eyeColor:'brown', shirtStyle:'hoodie', shirtColor:'orange', pantsColor:'black', shoesColor:'red' }`
(Amended 2026-09-16: the first default, brown short hair + blue tee + denim, read too close to a famous block-game default character. The default must look clearly original. Faces are eyes + a small smile, with no beard/goatee shading. They're kids.)

**The creator:**
- Live preview with rotate buttons (front/side/back) and a **🎲 Randomize** button.
- One row of swatches or chips per option.
- **Save**.
- He can change his look later from the hub's **Wardrobe**, for free.

---

## 2. Gear (earned only by passing lessons)

**Gear slots** (8): `head` · `body` · `feet` · `mainHand` · `offHand` · `back` · `magic1` · `magic2`
- `body` has no Pack 1 item. Show it as a locked slot: "Coming in a future quest".
- Items of type `trinket` or `spell` can go in **either** magic slot, never both at once.
- **Rarity colors:** common `#9aa4ad` · rare `#4a9df0` · epic `#a66bf0` · legendary `#f2b631`.
- All lesson items are **rare**.

### 9yo track (lessons `g1`–`g5`)
| id | Name | Lesson | Slot | Type | Flavor | Battle effect (P4) |
|---|---|---|---|---|---|---|
| `start-blade` | Start Blade | g1 | mainHand | weapon | A wooden sword with a glowing four-square pommel. Every hero starts somewhere. | melee, dmg 2, reach 1.2, cooldown 0.4s |
| `taskbar-boots` | Taskbar Boots | g2 | feet | armor | Light boots that let you zip from place to place, just like zipping between apps. | move speed +25% |
| `folder-backpack` | Folder Backpack | g3 | back | tool | A sturdy pack with neat little pockets. Holds one healing apple. | 1 apple per battle: press **1** to heal 2 hearts |
| `rename-rune` | Rename Rune | g4 | magic | spell | Rename a monster "Chicken" and, poof, it's a harmless chicken for 3 seconds. | press **E**: nearest enemy in range 4 → chicken 3s (can't attack), cooldown 8s |
| `stop-sign-shield` | Stop Sign Shield | g5 | offHand | armor | Raise it and tricks bounce right off. | hold **Shift**: block frontal hits, move −50% while blocking |

### 10yo track (lessons `s1`–`s5`)
| id | Name | Lesson | Slot | Type | Flavor | Battle effect (P4) |
|---|---|---|---|---|---|---|
| `switch-sword` | Switch Sword | s1 | mainHand | weapon | A blade that flips between a quick stance and a wide stance, the way Alt+Tab flips between windows. | melee, press **Q** to swap: quick (dmg 2, cooldown 0.3s, reach 1.1) / wide (dmg 2, cooldown 0.6s, 120° arc, reach 1.5) |
| `save-stone` | Save Stone | s2 | magic | trinket | Once per battle, if you fall, you pop back up right where you last touched the stone. | auto-revive once at 3 hearts at the stone's placed spot; press **2** to move the stone to where you stand |
| `undo-amulet` | Undo Amulet | s3 | magic | trinket | Once per battle, rewind 3 seconds and undo a hit. | press **R** once per battle: restore position and hearts from 3s ago |
| `copy-crystal-staff` | Copy Crystal Staff | s4 | offHand | weapon | Every bolt it fires comes with a twin, a perfect copy. | held in the off-hand; press **E**: bolt dmg 1 + twin bolt dmg 1, cooldown 0.5s, range 6 (works alongside the Switch Sword) |
| `scam-spotter-helmet` | Scam-Spotter Helmet | s5 | head | armor | See through disguises. Pop-up Mimics, the fake chests that bite, glow red. | Mimics revealed from spawn; incoming dmg −1 (min 1) once every 5s |

**Parity:** both boys get 5 rare items, one weapon at lesson 1, and a mix of armor, tool, and magic. By pack end both can fight, defend or survive, and use a special ability.
- **Every track's 5 items fit in distinct slots at once**, so both sets can be completed.
  - 9yo: mainHand, feet, back, magic, offHand.
  - 10yo: mainHand, magic, magic, offHand, head.
- This is why the staff is an off-hand weapon (amended 2026-09-16 after review found the Commander Set was impossible with two mainHand weapons).

**Bare hands** (no mainHand): dmg 1, reach 1.0, cooldown 0.45s. The first battle before his first chest is bare-handed.

**Set bonus:** wearing all 5 of his track's items at once.
- 9yo: **Pathfinder Set**. 10yo: **Commander Set**.
- Effect: gold outline glow plus **+1 max heart** in battle. Base hearts: 5.

---

## 3. Cosmetics (chest drops and the Trader; looks only, zero battle power)

**Cosmetic layers** (separate from gear): `hat` (hidden while a `head` gear item is worn) · `cape` (drawn behind; a backpack draws over it) · `face` · `hairFx` (overrides hair color) · `trail` (battle only, P4) · `title` (text under the name).

| id | Name | Layer | Rarity | Source |
|---|---|---|---|---|
| `cap-red` | Red Cap | hat | common | chest / Trader |
| `beanie-gray` | Gray Beanie | hat | common | chest / Trader |
| `bandana-blue` | Blue Bandana | hat | common | chest / Trader |
| `headphones` | Gamer Headphones | hat | rare | chest / Trader |
| `wizard-hat` | Wizard Hat | hat | epic | chest / Trader |
| `pixel-crown` | Pixel Crown | hat | legendary | pack-complete choice only |
| `cape-red` | Red Cape | cape | common | chest / Trader |
| `cape-blue` | Blue Cape | cape | common | chest / Trader |
| `cape-night` | Night Cape (star dots) | cape | rare | chest / Trader |
| `cape-flame` | Flame Cape (orange→yellow) | cape | epic | chest / Trader |
| `cape-rainbow` | Rainbow Cape | cape | legendary | pack-complete choice only |
| `pixel-wings` | Pixel Wings | cape | legendary | pack-complete choice only |
| `face-stripes` | Battle Stripes | face | common | chest / Trader |
| `sunglasses` | Cool Shades | face | rare | chest / Trader |
| `hair-gold` | Gold Hair | hairFx | rare | chest / Trader |
| `hair-galaxy` | Galaxy Hair (purple→pink) | hairFx | epic | chest / Trader |
| `trail-leaf` | Leaf Trail | trail | common | chest / Trader |
| `trail-sparkle` | Sparkle Trail | trail | rare | chest / Trader |
| `title-folder-finder` | "Folder Finder" | title | rare | lesson award (see below) |
| `title-shortcut-ninja` | "Shortcut Ninja" | title | rare | lesson award |
| `title-scam-spotter` | "Scam Spotter" | title | rare | lesson award |
| `title-champion` | "Pack 1 Champion" | title | legendary | pack complete |

**Title awards per lesson** (`LESSON_AWARDS`). Both boys end Pack 1 with 3 skill titles plus Champion:
- 9yo: `g4` → Folder Finder · `g5` → Scam Spotter **and** Shortcut Ninja (g5 teaches the special keys)
- 10yo: `s2` → Folder Finder · `s4` → Shortcut Ninja · `s5` → Scam Spotter
- Titles are never in the chest pool or the Trader.

---

## 4. Gems 💎, the Trader, and the chest roll

**Earning** (all capped so it can't be farmed):

| Source | Gems | Cap |
|---|---|---|
| Lesson chest opened | +20 | once per lesson (first pass only) |
| Chest questions, **all** first-try correct | +10 | once per lesson |
| Chest questions, at least half first-try correct (but not all) | +5 | once per lesson |
| Practice Mission completed | +10 | once per lesson per calendar day |
| Battle | +1 per 5 enemies poofed | max +10 per battle |
| Typing game new personal best (P5) | +5 | once per calendar day |
| Duplicate cosmetic from a chest roll | +15 | — |

- **Trader prices:** common 40 · rare 80 · epic 160. Legendary is never sold.
- The Trader lists every chest/Trader cosmetic he doesn't own.

**Chest roll** (after the guaranteed lesson item), `rollChest(cq, rng)`:
1. Rarity: common 60% · rare 30% · epic 10%.
2. Pick uniformly among **unowned** chest-pool cosmetics of that rarity.
3. If none are left at that rarity, try the other rarities in order epic → rare → common. If everything is owned, award +15 gems instead.
4. `rng` is injectable (default `Math.random`) so tests are deterministic.

**Pack complete** (all 5 lessons of his track passed):
- He **chooses one** of Pixel Crown / Rainbow Cape / Pixel Wings.
- He also gets the Pack 1 Champion title.
- The other two legendaries stay locked, reserved for future packs.

---

## 5. Hero Rank (by lessons passed)
| Lessons passed | Rank | Badge color |
|---|---|---|
| 0 | Rookie | common |
| 1 | Apprentice | common |
| 2 | Scout | rare |
| 3 | Adventurer | rare |
| 4 | Knight | epic |
| 5 | Champion | legendary |

---

## 6. Stored data (profile `cq`, extends Phase 1)
```
cq: {
  track: 'guided' | 'standard' | null,
  look: Look | null,              // null → creator on first visit
  owned: string[],                // gear item ids
  equipped: { head, body, feet, mainHand, offHand, back, magic1, magic2 },  // item id | null
  cosmetics: string[],            // owned cosmetic ids
  worn: { hat, cape, face, hairFx, trail, title },                         // cosmetic id | null
  gems: number,                   // integer ≥ 0
  lessonsPassed: string[],        // lesson ids from BOTH tracks, canonical order g1..g5, s1..s5 — never erased by a track change;
                                  // rank / pack / quests read only the current track's ids (passedForTrack)
  legendaryChoice: string | null  // P4 writes it
}
```
All of it is normalized from untrusted input:
- unknown ids dropped
- equipped items must be owned and slot-legal
- worn cosmetics must be owned and layer-legal
- gems clamped to integer 0..99999

---

## 7. Hub screens (Phase 2 UI, page `computer.html`)
1. **Guard.** No active profile unlocked in this tab → redirect to `index.html`. No `cq.track` → a friendly "Ask a grown-up to start Computer Quest for you" with a back link.
2. **First visit** (`look === null`): the character creator.
3. **Hub:**
   - big animated character (idle bob, slow turn on tap)
   - nickname + title + Hero Rank badge
   - 💎 gems
   - tabs: **Gear** · **Wardrobe** · **Trader** · **Quests**
   - Quests shows his track's 5 lessons as cards with lock icons and "Coming soon". Phase 3 fills them in.
4. **Gear:**
   - 8 slot tiles around the character
   - inventory grid of owned items (tap → item card with rarity border, flavor, effect in kid words, Equip/Unequip)
   - **locked items of his track shown as dark silhouettes** with name + "Pass Lesson X: <title> to unlock"
   - set-bonus progress "Pathfinder Set 2/5"
5. **Wardrobe:** the look editor (same as the creator) plus the cosmetics he owns per layer, with Wear/Take off. Unowned cosmetics are hidden here; the Trader shows them.
6. **Trader:** unowned chest-pool cosmetics with price and preview, Buy is disabled when he can't afford it, and a confirm step: "Spend 40 💎 on Red Cap?"
7. **Dev-only preview** (`import.meta.env.DEV` and `?dev=all`): grants everything in memory without saving, so the art can be checked. It never exists in production builds.

## 8. Controls reserved for the battle (P4)
WASD/arrows move · **Space** attack · **Shift** block · **E** spell / staff · **Q** stance swap · **R** undo · **1** apple · **2** move Save Stone.
Never bind Ctrl, Alt, the Windows key, Tab, or F-keys.

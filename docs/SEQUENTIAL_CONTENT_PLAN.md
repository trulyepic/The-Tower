# Sequential Content Plan

Status: Active source of truth for playable content order.

Use this file to keep story, side quests, board quests, items, weapons, titles, sigils, and floor progression aligned.
When there is a conflict between future lore scaffolding and current playable scope, follow this file.

Related system reference:
- `docs/MONSTER_REMNANTS_SYSTEM.md`
- `docs/FLOOR_PROGRESSION.md`

## Core Rule

Build the game in this order:

1. `Current playable floor and its support loop`
2. `Immediate side-quest consequences tied to that floor`
3. `Board quests needed to farm that floor's supplies`
4. `Rewards unlocked from that floor`
5. `Next floor`

This means:
- we should not jump deep into Floors 10+ main-story implementation before Floors 1-3 are fully coherent,
- future factions and NPCs can be documented early, but should enter gameplay only when the story reaches them.

## Current Truth Check

### What is truly playable now
- Floor 1 exists and is the real main-story floor.
- Lyra Ashstep is the first true conditional story NPC inside the Tower.
- Aldric exists as an early guild-side story request.
- General board quests exist as the farming loop.
- Store, inventory, weapons, sigils, titles, rank trial baseline, and tower loop all exist in usable form.

### What is only scaffolded for later
- Floors 2-10 data exists, but story/content polish should not be treated as canon-complete.
- Apostolic Veil, Set A NPCs, and higher-floor faction politics are currently lore scaffolding, not active sequential gameplay.
- Many future drops/titles/sigils/weapons already exist in data but should be treated as reserve content until their floors/quests are built.
- Guild-sold floor intelligence can canonically exist through `Floor 55`, because that is the highest documented ascent band in the world record.

## Tower Knowledge Rule

- The playable main story still runs `Floor 1 -> Floor 50`.
- World knowledge, purchased guild dossiers, and adventurer records can extend through `Floor 55`.
- Only two climbers in history are confirmed to have reached `Floor 55`.
- Most `S` and `SS` adventurers stabilize between `Floors 40-50`.
- Early floor intel should stay affordable, and later intel should become meaningfully more expensive.
- Early-floor intel can come from multiple channels:
  - Bran's guild ledger sales
  - board-work documentation rewards
  - trusted adventurer favors and copied field notes

## Lyra Status

Lyra is **not finished** in the main timeline.

### Implemented
- First contact only happens through Floor 1 poison-triggered in-tower encounter.
- Accepting her help unlocks:
  - Lyra NPC record in guild
  - `Lyra's Ember Map Recovery`
- Declining her help affects relationship state and blocks immediate quest unlock.
- Relationship/disposition system now reflects Lyra interaction state.

### Still missing
- true reconciliation path after early refusal
- follow-up branch choices beyond the first quest hook
- faction/personal-agenda reveal
- ending-variable impact
- later tower-route interference/support from Lyra

Conclusion:
- Lyra is the current active story NPC thread and should be finished before we push major later-faction story into gameplay.

## Item Taxonomy Rule

We need a clean distinction between similar item names.

### 1) Supplies
- Purpose: committed for quests/tower preparation or consumed during runs.
- Examples:
  - `Rope`
  - `Torch`
  - `Ward Charm`
  - `Antitoxin Vial`
  - `Guard Tonic`
  - `Grounding Tonic`
- Rule:
  - these are **one-time use / committed-use** items, not equipables.

### 2) Sigils
- Purpose: equipped in sigil slots, activated manually, timed duration.
- Examples:
  - `Embershard Sigil`
  - `Gale Feather`
  - `Arcane Sigil`
  - `Royal Crest`
- Rule:
  - these are **equipable timed effects**, not single-use committed supplies.

### 2a) Seals
- Purpose: modular inserts equipped inside Sigils.
- Rule:
  - Seals are not equipped directly on the player.
  - A Seal is equipped into a Sigil.
  - Seals can be equipped and unequipped freely.
  - Their main job is to affect battle mechanics, counters, resistances, and tactical triggers.
- Growth rule:
  - player Sigil slot count increases gradually with level and rank
  - each Sigil can later carry one or more Seal slots depending on its grade/design

### 2b) Engravings
- Purpose: permanent weapon-bound enhancement layer.
- Rule:
  - Engravings are applied to a specific weapon.
  - Unlike Seals, they are not intended to be swapped around in ordinary play.
  - They should define long-term weapon identity, specialization, and future legendary weapon progression.

### 3) Weapons
- Purpose: equipable core combat gear.
- Rule:
  - weapon tiers and unlocks should advance with floor/rank progression.

### 4) Titles
- Purpose: earned, equipable identity bonuses.
- Rule:
  - titles should come from meaningful quest/floor/milestone play, not random clutter.

## Naming Clarification

Current plan:

- `Ward Charm`
  - category: `material/supply`
  - role: one-time committed protective supply for quests/tower
  - not equipable

- `Embershard Sigil`
  - category: `sigil`
  - role: equipable timed sigil
  - activated manually by player

This distinction is intentional:
- `Charm` refers to a supply item
- `Sigil` refers to an equipable timed system item

### Follow-up cleanup
- [ ] Rename sigil items so they consistently read as Sigils
- [ ] Review whether `Ward Charm` should keep its current supply name long-term

## Sequential Build Plan

## Phase 1: Finish Floor 1 Loop

Goal: make the first complete game loop feel polished and intentional.

### Main-story
- [x] Add Main Quest tracker system
  - [x] dedicated Main Quest tab
  - [x] persistent chapter/objective tracker based on actual story flags
  - [x] story update dialog hooked into tracker progression
- [x] Finish Lyra branch v1
  - [x] refusal -> later reappearance path
  - [x] acceptance -> cleaner quest follow-up integration
  - [x] first visible consequence on future Floor 1/2 prep or intel
  - [x] dual first-contact routing:
    - [x] rescue contact if poor prep lets poison land
    - [x] stronger respect contact if the player counters Floor 1 cleanly
    - [x] rescue path now leaves a lighter future trust penalty (`ash debt`)

### Side-story
- [ ] Finish Aldric early-state flow
  - [ ] make his acceptance/refusal consequences clearer
  - [ ] keep Floor 10 payoff documented, but do not build it yet beyond placeholders

### General board quests
- [x] Audit current board quests for Floor 1 farming relevance
- [x] Ensure early board quests clearly support Floor 1 supplies:
  - [x] rope
  - [x] torch
  - [x] healing herb
  - [x] ward-related supply
  - [x] antitoxin / guard / grounding prep paths where appropriate
- [ ] Add at least 2 more grounded F-rank quests if needed:
  - one gathering-focused
  - one danger-focused

Current board-quest audit notes:
- [x] existing early quests already cover rope, torch, healing herb, antitoxin vial, and guard tonic paths
- [x] added `Restore Shrine Wards` as a new F-rank early support quest
  - strengthens `Ward Charm` access
  - gives an early `Grounding Tonic` farming path
- [x] early board visibility is now tightened to the player's current adventurer rank
- [ ] review whether `Lockpick` needs one more low-rank quest source or if store/tower coverage is enough

### Rewards
- [x] Audit Floor 1 drops so they teach the intended economy:
  - [x] recovery items
  - [x] basic tower supplies
  - [x] starter monster parts
  - [x] low-rate class weapon drops
- [ ] Convert Floor 1 `monster parts` into proper `Remnants` with actual uses
  - [x] sell value
  - [ ] sale value scaling
  - [ ] first crafting value
  - [ ] future legendary weaponline compatibility
- [ ] Define first-pass `Seals` system
  - [ ] initial Seal effects
  - [ ] how Sigils gain Seal slots
  - [ ] how players unlock more Sigil slots
  - [ ] source mix: floor drops / quests / crafting / NPC rewards
- [ ] Define first-pass `Engravings` system
  - [ ] which weapon grades can receive engravings
  - [ ] first engraving material loop
  - [ ] permanence / reset rules
  - [ ] tie-in to legendary personal weaponline

Current reward audit notes:
- [x] Floor 1 now leans harder into early-loop teaching:
  - stronger recovery presence (`Healing Herb`, `Health Potion`)
  - clearer counter-supply reinforcement (`Antitoxin`, `Guard`, `Grounding`)
  - low but visible `Lockpick` access
  - common material floor identity through `Iron Ore`
- [x] late-game style chase clutter removed from Floor 1 drop table:
  - `Nova Dust`
  - `Tower Crest Fragment`

### Lyra v1 completion target
- [x] first in-tower contact
- [x] first acceptance unlock path
- [x] first refusal now has reconciliation unlock after continued questing
- [x] branch choice inside `Lyra's Ember Map Recovery`
- [x] first visible gameplay payoff from siding with Lyra

## Phase 2: Lock Down Floors 1-3 Progression

Goal: establish the first real arc before expanding factions.

### Floor 2
- [x] Define its real story purpose
- [x] Define its enemies, mechanics, and required/recommended farm loop
- [x] Add one new item family needed for Floor 2
- [x] Add one new per-class reward tier or upgrade target
- [ ] Make sure Floor 2 remnants follow the same `Remnants` design rules and future legendary weaponline support

Current Floor 2 definition:
- `Floor 2: Thorn Corridor (The First Snare)`
- Story purpose:
  - teach that later floors win through control and attrition, not only burst damage
  - push the player toward rank-up and more deliberate prep before deeper ascent
- Intended gate:
  - `Rank E`
  - `Level 5`
- Core lesson:
  - Floor 1 says "survive"
  - Floor 2 says "survive while trapped"
- New item family:
  - `Briar Resin`
  - `Thorn Salve`
- Floor 2 support loop:
  - `Harvest Briar Resin`
  - `Cut Down Thorn Nest`
  - existing E-rank board quests remain supplementary
- Reward step:
  - rare early class weapon targets
    - `Briarcleaver`
    - `Thornline Spear`
    - `Rootglass Staff`
  - first non-novice sigil step:
    - `Embershard Sigil`

Supporting reference:
- [FLOOR_2_THORN_CORRIDOR.md](/Users/kin/web-rpg/docs/FLOOR_2_THORN_CORRIDOR.md)

### Floor 3
- [ ] Repeat the same structure
- [ ] Start introducing stronger identity between classes and route decisions

### Shared progression for Floors 1-3
- [ ] Weapon progression by rarity and level:
  - [ ] common starter
  - [ ] rare early reward
  - [ ] epic teaser reward, if appropriate
- [ ] Title progression:
  - [ ] one quest-earned title
  - [ ] one floor-earned title
  - [ ] one class-leaning title by early milestone
- [ ] Sigil progression:
  - [ ] common entry sigil
  - [ ] one or two floor-drop timed sigils

## Phase 3: Formalize Quest Structure

Goal: split quest content into clear categories.

### A) Main Story Quests
- tied directly to tower progress and major NPC arcs

### B) Side Quests
- tied to named NPCs
- should influence later trust, faction exposure, titles, or unique rewards

### C) Board Quests
- repeatable and practical
- mainly for:
  - gold
  - supplies
  - crafting/progression parts
  - stamina-efficient farming

### Rule
- every floor should be supported by at least:
  - 1 main-story beat
  - 1 named side-quest beat
  - 2-4 board quests that support supply farming

## Phase 4: Progression Content Matrix

We should build new rewards in a planned matrix, not ad hoc.

### Weapons
- [ ] create a progression grid by class:
  - Floor 1-3
  - Floor 4-6
  - Floor 7-10
- [ ] define expected rarity unlock pacing

### Titles
- [ ] define early title cadence:
  - first quest title
  - first floor title
  - first class-specific title
  - first rank title

### Sigils
- [ ] define which sigils are:
  - store baseline sigils
  - floor drop sigils
  - side-quest reward sigils

### Materials / Supplies
- [ ] define which are:
  - common farm items
  - floor-specific counters
  - rank-trial prep items
  - later relic-class items

## Immediate Next Build Order

This is the actual order we should follow from here:

1. `Use the Main Quest tracker as the active spine for Floor 1 story beats`
2. `Define and build Floor 2 properly`
3. `Define Floor 2 rewards: items, one weapon step, one title/sigil step`
4. `Then move to Floor 3`

## Update Rule

Whenever we complete or change something:
- update this file first,
- then update `ROADMAP.md` only if the change affects broader project planning,
- and update `TOWER_BATTLE_PHASES.md` only if the change affects tower combat flow.

# Sequential Content Plan

Status: Active source of truth for playable content order.

Use this file to keep story, side quests, floor-local work, items, weapons, titles, sigils, and floor progression aligned.
When there is a conflict between future lore scaffolding and current playable scope, follow this file.

Related system reference:
- `docs/MONSTER_REMNANTS_SYSTEM.md`
- `docs/FLOOR_PROGRESSION.md`
- `docs/FLOOR_LOCAL_WORLD_REWORK.md`
- `docs/FLOOR_HUB_UI_TODO.md`
- `docs/QUEST_SYSTEM_REWORK.md`
- `docs/QUEST_BATTLE_REWORK.md`
- `docs/QUEST_PLACEHOLDER_COMBAT_CONTRACTS.md`
- `docs/RANK_PROGRESSION_REWORK.md`
- `docs/ADVENTURER_DUEL_PARITY_PLAN.md`
- `docs/COMBAT_INTERACTION_EXPANSION.md`
- `docs/HIGH_RANK_RAID_SYSTEM.md`

## Core Rule

Build the game in this order:

1. `Current playable floor and its support loop`
2. `Immediate side-quest consequences tied to that floor`
3. `Floor-local work needed to farm that floor's supplies`
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
- General board quests still exist as the current farming loop, but they should migrate into floor-local work.
- Store, inventory, weapons, sigils, titles, rank trial baseline, and tower loop all exist in usable form.
- Rank progression is mechanically usable:
  - `F -> E` uses live combat
  - `E -> D` uses a sanctioned guild duel against Riven Hale with a second-phase health-color shift
  - `D -> C` now uses `Execution Record`, a field-audit trial where the target must be beaten cleanly enough to satisfy the guild ledger
  - `A -> S` and `S -> SS` still need redesign away from generic item requirements and toward the proof-based raid model in `docs/HIGH_RANK_RAID_SYSTEM.md`
- Riven Hale should be treated as a recurring hall duelist, with Nyra Sol continuing to reference the duel result after the promotion resolves.
- Live combat now uses a shared runtime across tower, live quest, and rank encounters, and further expansion is tracked in `docs/COMBAT_INTERACTION_EXPANSION.md`.
- A first reaction-prompt prototype was removed because it did not feel cohesive. Future expansion should favor stronger monster telegraphs, counters, and boss identity before reintroducing extra interaction UI.
- A selective pressure-meter implementation is part of the current combat standard when it is tied to a standout enemy and placed directly under enemy HP rather than added as a separate combat widget.

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
- Purpose: packed into the combat pouch or otherwise consumed during play.
- Examples:
  - `Healing Herb`
  - `Health Potion`
  - `Ward Charm`
  - `Antitoxin Vial`
  - `Guard Tonic`
  - `Grounding Tonic`
- Rule:
  - these are **one-time use consumables**, not equipables.
  - in live combat they should flow through the shared `Combat Pouch`
  - they are only spent if actually used

### 2) Sigils
- Purpose: equipped defensive gear with passive armor and visual identity.
- Examples:
  - `Embershard Sigil`
  - `Gale Feather`
  - `Arcane Sigil`
  - `Royal Crest`
- Rule:
  - sigils are primarily equipable defensive gear, not single-use supplies
  - higher rarity sigils may add quest or small attack bonuses according to the current sigil rules

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
  - The inserted thing is a `Forge Mark`; `engraving` is the action.
  - Unlike Seals, they are not intended to be swapped around in ordinary play.
  - They should define long-term weapon identity, specialization, and future legendary weapon progression.
  - Grade access follows [WEAPON_ENGRAVINGS_SYSTEM.md](/Users/kin/web-rpg/docs/WEAPON_ENGRAVINGS_SYSTEM.md):
    - `rare`: named exceptions only
    - `epic`: normally `1-2`, special cases up to `3`
    - `legendary`: normally `1-4`, special cases up to `6`

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
  - role: one-time protective combat-pouch supply for quests/tower
  - not equipable

- `Embershard Sigil`
  - category: `sigil`
  - role: equipable defensive sigil with passive armor and visual identity
  - may later carry bonus behavior according to current sigil rules

This distinction is intentional:
- `Charm` refers to a supply item
- `Sigil` refers to an equipable defensive system item

### Follow-up cleanup
- [ ] Rename sigil items so they consistently read as Sigils
- [ ] Review whether `Ward Charm` should keep its current supply name long-term

## Sequential Build Plan

## Phase 1: Finish Floor 1 Loop

Goal: make the first complete game loop feel polished and intentional.

Floor 1 presentation should now be treated as the first implementation target for the vertical floor-hub model in:
- [FLOOR_HUB_UI_TODO.md](/Users/kin/web-rpg/docs/FLOOR_HUB_UI_TODO.md)

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

### Questline Docs
- [x] Create dedicated recurring NPC questline docs
- [x] Track active questlines in [NPC_QUESTLINE_TRACKER.md](/Users/kin/web-rpg/docs/NPC_QUESTLINE_TRACKER.md)
- [x] Mark Tamsin as complete for now until her next phase starts
- [x] Lock Aldric's full branch canon in a dedicated doc

### Side-story
- [ ] Finish Aldric early-state flow
  - [x] make his acceptance/refusal consequences clearer
  - [x] add first branch persistence for:
    - refused
    - too late
    - saved
  - [ ] add stronger urgency presentation to the board/journal UI
  - [ ] add first post-quest breadcrumb for dark-path recurrence
  - [ ] keep Floor 10 payoff documented, but do not build it yet beyond placeholders

### Quest System
- [ ] Start quest-system rework from `docs/QUEST_SYSTEM_REWORK.md`
  - [ ] Slice 1: Quest Board structure cleanup
  - [ ] Slice 2: shared quest state cleanup
  - [ ] Slice 3: journal rewrite
  - [ ] Slice 4: reusable time-sensitive runtime
- [ ] Start quest battle rework from `docs/QUEST_BATTLE_REWORK.md`
  - [ ] keep `gather` quests on the light resolve model
  - [ ] move combat `adventure` quests onto live turn-based combat
  - [ ] move `dungeon` quests onto multi-step live combat later
  - [ ] define first real `hunt` combat contract
  - [ ] define first real `wanted` combat contract

### Early Floor 1 work migration
- [x] Audit current early quests for Floor 1 farming relevance
- [x] Ensure early work clearly supports Floor 1 supplies:
  - [x] rope
  - [x] torch
  - [x] healing herb
  - [x] ward-related supply
  - [x] antitoxin / guard / grounding prep paths where appropriate
- [ ] Re-home current Floor 1 jobs into the future Floor 1 local-work surface
- [ ] Add at least 2 more grounded F-rank jobs if needed:
  - one gathering-focused
  - one danger-focused

Current early-work audit notes:
- [x] existing early quests already cover rope, torch, healing herb, antitoxin vial, and guard tonic paths
- [x] existing early quests already cover rope, healing herb, antitoxin vial, and guard tonic paths
- [x] added `Restore Shrine Wards` as a new F-rank early support quest
  - strengthens `Ward Charm` access
  - gives an early `Grounding Tonic` farming path
- [x] early board visibility is now tightened to the player's current adventurer rank

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

### Live Combat Expansion
- [ ] Follow the sequential combat interaction track from `docs/COMBAT_INTERACTION_EXPANSION.md`
  - [ ] Slice 1: revisit only if a more cohesive replacement for the removed reaction-prompt baseline is designed
  - [ ] Slice 2: enemy interrupt framework
  - [ ] Slice 3: earned finisher follow-ups
  - [ ] Slice 4: boss interaction identity
  - [ ] Slice 5: battlefield interactions
  - [ ] Slice 6: optional momentum layer

Current reward audit notes:
- [x] Floor 1 now leans harder into early-loop teaching:
  - stronger recovery presence (`Healing Herb`, `Health Potion`)
  - clearer counter-supply reinforcement (`Antitoxin`, `Guard`, `Grounding`)
  - common material floor identity through `Iron Ore`
- [x] late-game style chase clutter removed from Floor 1 drop table:
  - `Nova Dust`
  - `Tower Crest Fragment`

### High-Rank Promotion Foundation
- [ ] Define the high-rank raid system in playable terms before treating `A -> S` and `S -> SS` as final
  - [ ] define raid notices and sanction flow
  - [ ] define fixed proof rewards
  - [ ] define the first `A -> S` proof set
  - [ ] tie the first real raid-class hunt into the guild promotion loop
  - [ ] bring `Ashen Gate Tyrant` and `Bell Warden of the Hollow Choir` up to Leviathor's current live-raid standard

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
- [x] Add a post-Floor-2-clear guild/NPC aftermath so the chapter lands before Floor 3
- [ ] Build the Floor 3 merchant branch consequence from the NPC choice documented in `FLOOR_3_MERCHANT_BRANCH.md`

Current Floor 2 definition:
- `Floor 2: Thorn Corridor (The First Snare)`
- Story purpose:
  - teach that later floors win through control and attrition, not only burst damage
  - push the player toward rank-up and more deliberate prep before deeper ascent
- Intended gate:
  - `Soft recommendation: Rank E`
  - `Soft recommendation: Level 5`
- Core lesson:
  - Floor 1 says "survive"
  - Floor 2 says "survive while trapped"
- New item family:
  - `Briar Resin`
  - `Thorn Salve`
- Floor 2 support loop:
  - `Harvest Briar Resin`
  - `Cut Down Thorn Nest`
  - existing E-rank board quests remain temporary supplementary scaffolding until Floor 2 local work replaces them
- Reward step:
  - rare early class weapon targets
    - `Briarcleaver`
    - `Thornline Spear`
    - `Rootglass Staff`
  - first non-novice sigil step:
    - `Embershard Sigil`

Supporting reference:
- [FLOOR_2_THORN_CORRIDOR.md](/Users/kin/web-rpg/docs/FLOOR_2_THORN_CORRIDOR.md)

Future floor roster note:
- normal enemies may reuse status families or pressure archetypes in moderation
- sub-bosses and main bosses should stay unique to the floor
- later bosses should increasingly use biblical or biblical-adjacent fantasy inspiration rather than generic creature escalation

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
  - [ ] one or two floor-drop sigils

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

### Rank Trial Ladder After `E -> D`

Keep these in order after the current duel ladder step is stable:

1. `D -> C` - `Execution Record`
   - cleaner results, less waste, more scrutiny
   - live field audit under Thorne Veld with one named assessment target
   - same-opponent redline escalation with an audit-pressure meter
   - winning is not enough; the ledger also checks whether the execution stayed clean enough to certify
2. `C -> B` - `Field Command`
   - field-unit command test under Virel Dawn
   - multiple threats, pace control, stronger battlefield pressure
   - support lines can feed pressure into the captain if mishandled
3. `B -> A` - `High Ascent Charter`
   - elite responsibility carried through one long witness run
   - same named A-rank marshal across escalating phases
   - charter faults matter as much as the eventual win

Duel-parity note:
- the next gameplay target is a true single-opponent phased duel, not two sequential enemy units
- keep `E -> D` and any later named duel in sync with [ADVENTURER_DUEL_PARITY_PLAN.md](/Users/kin/web-rpg/docs/ADVENTURER_DUEL_PARITY_PLAN.md)
- phase-colored HP presentation and enemy pouch/sigil parity should be documented before implementation expands

## Immediate Next Build Order

This is the actual order we should follow from here:

1. `Use the Main Quest tracker as the active spine for Floor 1 story beats`
2. `Define and build Floor 2 properly`
3. `Define Floor 2 rewards: items, one weapon step, one title/sigil step`
4. `Later: extend floor-clear style ceremonial result presentation to major story/special quest completions`
5. `Then move to Floor 3`

## Update Rule

Whenever we complete or change something:
- update this file first,
- then update `ROADMAP.md` only if the change affects broader project planning,
- and update `TOWER_BATTLE_PHASES.md` only if the change affects tower combat flow.
- live tower combat changes should also update:
  - [LIVE_BATTLE_SYSTEM.md](/Users/kin/web-rpg/docs/LIVE_BATTLE_SYSTEM.md)

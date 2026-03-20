# Web RPG Roadmap

This is the master implementation tracker for the project.  
Use this file for non-tower planning, and use `docs/TOWER_BATTLE_PHASES.md` for tower combat-phase details.
For actual playable content order, use `docs/SEQUENTIAL_CONTENT_PLAN.md`.
For floor-by-floor build intent, use `docs/FLOOR_PROGRESSION.md`.

## Current Direction

- Main goal: players climb and conquer a multi-floor tower.
- Canon main story selected: `docs/MAIN_STORY_TOWER_OF_SEVEN_HEAVENS.md` (Floors 1-50, 3 endings).
- Guild remains core support loop:
  - Quest Board for farming items and progression resources
  - Store for buying key supplies and weapons (tab + Bran interaction)
  - Tower tab for floor advancement
  - NPC Hall for rank administration and guild services
- Class identity matters (current classes + future advanced jobs and additional classes).

## Game UI Guardrail

- Build every new feature as a game interface first, not a text document.
- Default visual language for gameplay surfaces:
  - Icons for system identity and actions
  - Color-coded states (good/risk/locked/active)
  - Meters/bars for resources and progression
  - Compact chips/pills for status effects and outcomes

## What Is Implemented

- [x] Character creation with class selection and avatar options
- [x] Camp screen with core character overview
- [x] Guild navigation baseline: NPC, Quest Board, Store, Tower
- [x] Main Quest tracker:
  - [x] dedicated tab
  - [x] objective journal
  - [x] story update dialog integration
- [x] Inventory with equip flow
- [x] Weapon level requirements + proficiency penalty (25% under required level)
- [x] Initial tower system with 10 floors and sequential progression
- [x] Local persistence of game state
- [x] Affinity system baseline:
  - Neutral start
  - Camp meter UI
  - Three-state fantasy framing (Abyssworn / Veilwalker / Aetherbound)
- [x] Affinity choice-lock v1:
  - [x] shared extreme-threshold rule
  - [x] current narrative choices hidden when affinity forbids them
  - [x] dev controls for good / neutral / evil testing
- [x] Guild NPC Hall baseline:
  - Guild Master card
  - Receptionist card
  - Quartermaster card
  - Rank Examiner card (mapped by adventurer rank)
  - Revival specialist mage card
  - NPC conversation modal pattern (Bran + Examiner), reusable for future NPC interactions

## Gameplay Systems

- [x] Quest system v1 spec + baseline implementation (`docs/QUEST_SYSTEM_SPEC.md`)
- [ ] Quest system rework spine (`docs/QUEST_SYSTEM_REWORK.md`)
  - [ ] board structure cleanup
  - [ ] shared quest state cleanup
  - [ ] journal rewrite
  - [ ] reusable time-sensitive quest runtime
  - [ ] future Hunt / Wanted hooks
- [ ] Quest battle rework (`docs/QUEST_BATTLE_REWORK.md`)
  - [ ] keep `gather` quests on the light resolve model
  - [ ] move combat `adventure` quests onto live turn-based combat
  - [ ] move `dungeon` quests onto tighter multi-wave live combat
  - [ ] move future `hunt` contracts onto named-target live combat
  - [ ] move future `wanted` contracts onto named-target live combat
- [x] Placeholder future combat contracts documented (`docs/QUEST_PLACEHOLDER_COMBAT_CONTRACTS.md`)
- [x] Sigil system v1: equip/unequip, timed effects, tower activation flow, active indicators
- [x] Sigil control v1.1: manual deactivate/resume with saved remaining timer, visible sigil effects in Camp/Combat/Tower
- [ ] Seals system:
  - [ ] inserts equipped into Sigils
  - [ ] seal-slot progression tied to Sigils/player growth
  - [ ] battle-mechanic-focused effects and counters
- [ ] Engravings system:
  - [ ] permanent weapon-bound enhancement layer
  - [ ] engraving rules by weapon grade
  - [ ] engraving material + forge pipeline
- [ ] Monster Remnants system (`docs/MONSTER_REMNANTS_SYSTEM.md`)
  - [x] basic Bran workshop crafting v1
  - [x] player-facing remnants naming
  - [x] Floor 1 remnant grades + sell values
  - [ ] sell/turn-in/crafting baseline
  - [x] floor-by-floor remnant families
  - [ ] legendary weaponline ingredient support
- [ ] Tower battle phase flow UI and logic (see tower phases doc)
  - [x] Floor 1 live-response battle layer (`docs/LIVE_BATTLE_SYSTEM.md`)
  - [ ] extend live-response combat to later floors
- [ ] Guild floor-intel system through Floor 55
  - [x] store intel ledger baseline
  - [x] tower UI hide/reveal pass for weakness notes, optional drops, and support aids
  - [x] alternate intel rewards from quests and NPC favors
  - [ ] scaling intel price bands by floor tier
- [ ] Floor failure consequences tuning (stamina, rewards, retries)
- [x] Rank progression baseline implemented (F -> SS trial chain + access gates + outcomes)
- [ ] Mage-rank system: formalize guild healer ranks (ex: 10th-level mage service), unlock rules, costs, and narrative role
- [ ] Advanced jobs unlock system by class
- [ ] Class-specific passives affecting quests/tower outcomes
- [ ] Affinity impact hooks for quests/NPC/tower decisions
- [ ] Aldric staged implementation
  - [x] branch persistence for refused / too late / saved
  - [ ] stronger urgency presentation for the time-sensitive rescue
  - [ ] first recurring dark-path breadcrumb after failure/refusal
  - [ ] later sabotage phase implementation
  - [ ] Floor 30 confrontation implementation
- [ ] Higher Being favor/wrath system:
  - [ ] per-being favor and wrath tracks
  - [ ] seed first 3 beings (Seraphel, Vael-Tor, Nyxara)
  - [ ] covenant quest rewards/penalties
  - [ ] NPC patron conflict consequences
  - [ ] tower modifier hooks from divine anger/favor
- [ ] Faction conflict system:
  - [ ] `Aureate Spire` standing and aid/hostility tiers
  - [ ] `Ashen Oathbreak` standing and aid/hostility tiers
  - [ ] `Apostolic Veil` standing and aid/hostility tiers
  - [ ] Apostolic Veil internal wings: reformer / preservationist / inquisitor
  - [ ] NPC-member introduction chain and reveal progression
  - [ ] faction interference hooks on quests/tower floors
- [ ] Nephari lineage system:
  - [ ] lineage flags on selected NPCs and story events
  - [ ] reveal triggers tied to floors/quests
  - [ ] lineage impact on favor/wrath and faction response
- [ ] Named NPC Set A system:
  - [ ] seed first 3 NPCs (Lys Marrowind, Cael Vorn, Mireth Ashvale)
  - [ ] relationship + interference tier progression
  - [ ] NPC-specific quest and tower event hooks
- [ ] Apostolic Veil Set B system:
  - [ ] seed first 3 NPCs (Matthieu Valecourt, Caliste Verenne, Severin Thorne)
  - [ ] relationship + Apostolic Veil standing progression
  - [ ] sanctuary / archive / sanction runtime hooks
  - [ ] quest chains for chapel records, sealed folios, and inquisitorial purge
- [ ] Biblical great-figure track
  - [ ] mythic redesign pass for selected biblical individuals
  - [ ] naming pass using fantasy-rooted variants
  - [ ] define floor-band entry rules so they do not appear too early
  - [ ] tie each figure to either a higher being, archive route, faction axis, or ending pressure path
- [ ] Lyra Ashstep branch implementation:
  - [x] restricted to conditional in-tower trigger, not pre-entry encounter
  - [x] relationship state + repeat-contact tracking
  - [x] first side-quest hook added (`Lyra's Ember Map Recovery`)
  - [x] refusal reconciliation path after continued questing
  - [x] first branch-choice quest resolution
  - [ ] faction reveal and personal-agenda branch
  - [ ] side-quest chain with ending-variable consequences
- [ ] Economy balancing pass (gold, stamina spend/recovery, item drop rates)

## Rank Progression Baseline (Agreed)

- Canonical rank-by-level map:
  - `F`: 1-4
  - `E`: 5-9
  - `D`: 10-14
  - `C`: 15-24
  - `B`: 25-39
  - `A`: 40-59
  - `S`: 60-79
  - `SS`: 80+

## Rank Progression TODO Reminders

- [x] Align all rank-up level gates in code/data to the canonical map above.
- [x] Ensure no overlapping boundaries in requirements (inclusive/exclusive checks).
- [x] Add rank-up trial rules for every transition:
  - [x] F -> E
  - [x] E -> D
  - [x] D -> C
  - [x] C -> B
  - [x] B -> A
  - [x] A -> S
  - [x] S -> SS
- [ ] Define per-rank trial "special quest" identity (theme, enemies, mechanics, rewards).
- [ ] Add rank-up failure consequences and retry policy (cooldown/stamina/item loss).
- [x] Add UI explainers so players can see exact requirements before starting a trial.
- [x] Route rank-up through examiner NPC interactions (instead of standalone rank-tab flow).
- [ ] Add rank examiner challenge variants:
  - [ ] damage-check trials vs higher-rank adventurer NPCs
  - [ ] timed performance objectives
  - [ ] class-path specific assessment goals
- [ ] Tie rank-up unlocks to systems:
  - [ ] Sigil slot increases
  - [ ] Title slot increases
  - [ ] New quest visibility tiers
  - [ ] Tower access expectations
- [ ] Add tests for rank gate logic and rank transition integrity.

## Content Expansion

- [ ] Add more quest types and special quest chains
- [ ] Add special item categories for tower prep (consumables, relics, keys)
- [ ] Add more weapons per class and weapon progression path
- [ ] Add legendary customizable weapon questline
  - [ ] class-specific weaponline entry quests
  - [ ] remnant-based forging structure
  - [ ] customization rules for legendary personal weapons
- [ ] Add armor and accessory equipment slots
- [ ] Add tower floors 11+ with variant mechanics and multiple boss floors

## UI/UX

- [ ] Remove remaining inconsistent hardcoded colors and finish tokenized theme pass
- [ ] Improve tooltip UX consistency across all screens
- [ ] Add clearer combat/readiness indicators (requirements met, risk state, sigils)
- [ ] Improve responsive behavior across web and mobile breakpoints
- [ ] Add battle/event log panel for quest and tower outcomes

## Technical / Codebase

- [ ] Consolidate gameplay formulas into one balance module
- [ ] Add deterministic test utilities for success chance calculations
- [ ] Add state migration versioning for future save-data schema updates
- [ ] Add lightweight unit tests for game service and progression logic
- [ ] Add docs for data model conventions (`items`, `quests`, `floors`, `rewards`)

## Backlog (Future)

- [ ] Social/leaderboard concepts
- [ ] Daily/weekly tower challenge rotations
- [ ] Seasonal tower events
- [ ] Co-op or async companion systems

## Questline Documentation

- [x] Create questline tracker for recurring NPC arcs
- [x] Create dedicated Aldric questline doc
- [x] Create dedicated Tamsin questline doc
- [ ] Create dedicated Lyra questline doc
- [ ] Keep every new NPC questline documented as soon as it begins

## Current Sequential Focus

- `Floor 2: Thorn Corridor` is the active next chapter.
- Runtime and docs now treat it as the first true `E-rank` tower floor.
- Detailed reference:
  - [FLOOR_2_THORN_CORRIDOR.md](/Users/kin/web-rpg/docs/FLOOR_2_THORN_CORRIDOR.md)

- Quest Journal now structured for Main Quest, Side Quest, Hunt, and Wanted tracking.
- TODO:
  - add first real Hunt quest structure after the current Tamsin / side-quest work is settled
  - add first real Wanted system structure after Hunt is properly defined

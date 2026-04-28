# Web RPG Roadmap

This is the master implementation tracker for the project.  
Use this file for non-tower planning, and use `docs/TOWER_BATTLE_PHASES.md` for tower combat-phase details.
For actual playable content order, use `docs/SEQUENTIAL_CONTENT_PLAN.md`.
For floor-by-floor build intent, use `docs/FLOOR_PROGRESSION.md`.
For the floor-local world migration, use `docs/FLOOR_LOCAL_WORLD_REWORK.md`.
For the floor-hub UI build order, use `docs/FLOOR_HUB_UI_TODO.md`.
For title rarity consistency, use `docs/TITLE_RARITY_RULES.md`.
For rank advancement design, use `docs/RANK_PROGRESSION_REWORK.md`.
For adventurer-vs-adventurer duel parity, use `docs/ADVENTURER_DUEL_PARITY_PLAN.md`.
For live combat interaction expansion, use `docs/COMBAT_INTERACTION_EXPANSION.md`.
For top-end raid promotion design, use `docs/HIGH_RANK_RAID_SYSTEM.md`.
For parallel workstream ownership and review lanes, use `docs/WORKSTREAM_AGENT_MODEL.md`.

## Current Direction

- Main goal: players climb and conquer a multi-floor tower.
- Canon main story selected: `docs/MAIN_STORY_TOWER_OF_SEVEN_HEAVENS.md` (Floors 1-50, 3 endings).
- Guild remains core support loop, but it should be re-homed into `Floor 1` over time:
  - Floor 1 guild services for store, rank administration, revival, and black-ledger notices
  - floor-local work replacing the long-term role of the detached global Quest Board
  - tower progression still handled through per-floor advancement
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
- [x] Weapon level requirements + gradual proficiency scaling up to full effectiveness at the required level
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
- [x] NPC Hall ambient speech baseline:
  - live per-NPC speech bubbles in the hall
  - state-driven passing remarks tied to story progress and tower climb
  - this is an ongoing content layer and must be updated whenever major story, floor, NPC, or guild-state beats are added
  - future pass still needed for broader gossip, rumors, and hidden quest hooks

## Gameplay Systems

- [x] Quest system v1 spec + baseline implementation (`docs/QUEST_SYSTEM_SPEC.md`)
- [ ] Quest system rework spine (`docs/QUEST_SYSTEM_REWORK.md`)
  - [ ] board structure cleanup
  - [ ] floor-local work migration away from the detached global board
  - [ ] shared floor-hub UI shell (`docs/FLOOR_HUB_UI_TODO.md`)
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
- [x] Sigil system v1: equip/unequip, passive armor, avatar-shell identity, rarity-based bonus rules, active indicators
- [x] Sigil control v1.1: manual deactivate/resume with saved remaining timer, visible sigil effects in Camp/Combat/Tower
- [ ] Seals system:
  - [ ] inserts equipped into Sigils
  - [ ] seal-slot progression tied to Sigils/player growth
  - [ ] battle-mechanic-focused effects and counters
- [ ] Engravings system:
  - [ ] permanent weapon-bound enhancement layer
  - [x] engraving rules by weapon grade documented in [WEAPON_ENGRAVINGS_SYSTEM.md](/Users/kin/web-rpg/docs/WEAPON_ENGRAVINGS_SYSTEM.md)
  - [ ] engraving material + forge pipeline
- [ ] High-rank raid system (`docs/HIGH_RANK_RAID_SYSTEM.md`)
  - [ ] define raid notice / unlock flow
  - [ ] define fixed raid-proof rewards
  - [ ] define first 3 `A -> S` proof items
  - [ ] define first playable raid-class hunt encounter
  - [ ] define how `S -> SS` escalates beyond `A -> S`
  - [ ] bring `Ashen Gate Tyrant` and `Bell Warden of the Hollow Choir` up to Leviathor's current live-raid standard
- [ ] Monster Remnants system (`docs/MONSTER_REMNANTS_SYSTEM.md`)
  - [x] basic Bran workshop crafting v1
  - [x] player-facing remnants naming
  - [x] Floor 1 remnant grades + sell values
  - [ ] sell/turn-in/crafting baseline
  - [x] floor-by-floor remnant families
  - [ ] legendary weaponline ingredient support
- [ ] Tower battle phase flow UI and logic (see tower phases doc)
  - [x] Shared live combat runtime across tower / live quest / rank (`docs/LIVE_BATTLE_SYSTEM.md`)
  - [x] Shared combat core with source-specific aftermath for tower / live quest / rank
  - [ ] continue extending authored live-combat identity to later floors and standout enemies
  - [ ] add combat interaction expansion slices (`docs/COMBAT_INTERACTION_EXPANSION.md`)
    - [ ] reaction prompts, only if a future prototype feels more cohesive than the removed baseline
    - [ ] stronger telegraphs and enemy intent reads
    - [ ] selective pressure meters on standout enemies
    - [ ] enemy interrupt windows
    - [ ] earned finisher moments
    - [ ] stronger boss interaction identity
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
  - [x] Convert `F -> E` into a live combat threshold clash.
  - [x] Convert `E -> D` into a sanctioned guild duel against Riven Hale with a second phase.
  - [x] Convert `D -> C` into `Execution Record`, a field-audit assessment with a redline escalation and audit-pressure meter, where the target must be beaten cleanly enough to satisfy the office ledger.
  - [x] Convert `C -> B` into `Field Command`, a field-unit assessment with support threats feeding pressure into a named B-rank captain.
  - [x] Convert `B -> A` into `High Ascent Charter`, a sustained A-rank marshal assessment with one continuous elite opponent, multi-phase pressure, and a stricter charter review.
  - [ ] Redesign `A -> S` around fixed high-rank raid proofs instead of generic item requirements.
  - [ ] Redesign `S -> SS` around harsher high-rank raid proofs instead of generic item requirements.
  - [x] Make the `E -> D` duel's second phase read through a health-color shift rather than fracture framing.
- [ ] Keep named-duel wording explicitly sanctioned and nonlethal in all rank copy.
- [ ] Add reusable adventurer opponent license dossiers for rank trials.
  - [ ] use them for named duelists and named assessment targets
  - [ ] show `ID`, `Rank`, `Level`, `Weapon`, `Sigils`, `Title`, `Skill`, `Passive`, and `Pouch`
  - [ ] surface the dossier as a license-style duel card, not a flat stat dump
- [ ] Add named-duel follow-up beats so the opponent remains part of the guild hall story after the promotion.
  - [x] Track Riven Hale as a recurring hall duelist in docs.
  - [ ] Add Nyra Sol continuity lines that reference the duel result in later rank talk.
- [ ] Add rank-up failure consequences and retry policy (cooldown/stamina/item loss).
- [x] Add UI explainers so players can see exact requirements before starting a trial.
- [x] Route rank-up through examiner NPC interactions (instead of standalone rank-tab flow).
- [ ] Add rank examiner challenge variants:
  - [ ] damage-check trials vs higher-rank adventurer NPCs
  - [ ] timed performance objectives
  - [ ] class-path specific assessment goals
- [ ] Adventurer duel parity follow-up:
  - [ ] true single-opponent phased duel as the next target
  - [x] phase-led health presentation for named duelists
  - [ ] enemy pouch use parity
  - [ ] sigil parity
  - [ ] archetype-based duel AI
  - [ ] distinct second-phase escalation
  - [x] first selective special-attack pressure meter under enemy HP (`Riven Hale` phase two)
  - [x] extend the pressure-meter system to one live quest elite after Riven proves out
  - [ ] extend the pressure-meter system to one tower boss or sub-boss after the current rollout is verified in tower play
- [ ] Next concrete rank-trial slices after `E -> D`:
  - [x] `D -> C` - `Execution Record`
    - clean results over simple survival
    - one named assessment target with stricter discipline
  - [x] `C -> B` - `Field Command`
    - multiple active threats
    - lane control and pace control under pressure
  - [x] `B -> A` - `High Ascent Charter`
    - elite-grade responsibility
    - long-form single-witness assessment with stronger punishment for bad reads
- [ ] Tie rank-up unlocks to systems:
  - [ ] Sigil slot increases
  - [ ] Title slot increases
  - [ ] New quest visibility tiers
  - [ ] Tower access expectations
- [ ] Add tests for rank gate logic and rank transition integrity.
- [x] Create dedicated rank progression design spine in [RANK_PROGRESSION_REWORK.md](/Users/kin/web-rpg/docs/RANK_PROGRESSION_REWORK.md).
- [ ] Ongoing rule: whenever we add or revise a promotion, update its live combat encounter, examiner copy, and prep UI together.
- [ ] Ongoing rule: whenever we add or revise live combat, keep the shared combat pouch updated too.
- [ ] Ongoing rule: rank-duel changes should be routed through the duel-parity plan before code changes land.
- [ ] Ongoing rule: whenever we add or revise live combat, review whether that enemy or floor should also gain:
  - [ ] a clearer telegraph
  - [ ] a reaction/interrupt moment
  - [ ] a stronger positional puzzle
- [ ] Ongoing rule: named duelists and standout enemies should prefer icon-first build/effect presentation over text-heavy summaries.
- [ ] Add combat pouch progression:
  - [ ] level-based pouch size increases
  - [ ] NPC-based pouch upgrade path
  - [ ] clearer pouch management/readiness messaging across inventory and combat
- [ ] Parallel workstream model:
  - [ ] combat/rank lane
  - [ ] story/NPC lane
  - [ ] progression/economy lane
  - [ ] review lane A for gameplay consistency
  - [ ] review lane B for docs/roadmap sync
  - [ ] require two review passes on substantive combat changes

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
- Floor 2 now includes a post-clear Tamsin aftermath beat so the chapter closes before we step into Floor 3.
- Floor 3 merchant consequence is documented for later implementation in [FLOOR_3_MERCHANT_BRANCH.md](/Users/kin/web-rpg/docs/FLOOR_3_MERCHANT_BRANCH.md).
- Runtime and docs now treat it as the first true `E-rank` tower floor.
- Detailed reference:
  - [FLOOR_2_THORN_CORRIDOR.md](/Users/kin/web-rpg/docs/FLOOR_2_THORN_CORRIDOR.md)

- Quest Journal now structured for Main Quest, Side Quest, Hunt, and Wanted tracking.
- TODO:
  - add first real Hunt quest structure after the current Tamsin / side-quest work is settled
  - add first real Wanted system structure after Hunt is properly defined
  - give major story/special quest completions the same ceremonial result treatment now used for tower floor clears
  - add live reactive NPC hall bubbles and more granular per-NPC reaction text that updates off player story progress, tower clears, affinity, and known choices

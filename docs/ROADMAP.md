# Web RPG Roadmap

This is the master implementation tracker for the project.  
Use this file for non-tower planning, and use `docs/TOWER_BATTLE_PHASES.md` for tower combat-phase details.

## Current Direction

- Main goal: players climb and conquer a multi-floor tower.
- Canon main story selected: `docs/MAIN_STORY_TOWER_OF_SEVEN_HEAVENS.md` (Floors 1-50, 3 endings).
- Guild remains core support loop:
  - Quest Board for farming items and progression resources
  - Store for buying key supplies and weapons (tab + Bran interaction)
  - Tower tab for floor advancement
  - NPC Hall for rank administration and guild services
- Class identity matters (current classes + future advanced jobs and additional classes).

## What Is Implemented

- [x] Character creation with class selection and avatar options
- [x] Camp screen with core character overview
- [x] Guild navigation baseline: NPC, Quest Board, Store, Tower
- [x] Inventory with equip flow
- [x] Weapon level requirements + proficiency penalty (25% under required level)
- [x] Initial tower system with 10 floors and sequential progression
- [x] Local persistence of game state
- [x] Affinity system baseline:
  - Neutral start
  - Camp meter UI
  - Three-state fantasy framing (Abyssworn / Veilwalker / Aetherbound)
- [x] Guild NPC Hall baseline:
  - Guild Master card
  - Receptionist card
  - Quartermaster card
  - Rank Examiner card (mapped by adventurer rank)
  - Revival specialist mage card
  - NPC conversation modal pattern (Bran + Examiner), reusable for future NPC interactions

## Gameplay Systems

- [x] Quest system v1 spec + baseline implementation (`docs/QUEST_SYSTEM_SPEC.md`)
- [x] Buff system v1: equip/unequip, timed effects, tower activation flow, active indicators
- [x] Buff control v1.1: manual deactivate/resume with saved remaining timer, visible buff effects in Camp/Combat/Tower
- [ ] Tower battle phase flow UI and logic (see tower phases doc)
- [ ] Floor failure consequences tuning (stamina, rewards, retries)
- [x] Rank progression baseline implemented (F -> SS trial chain + access gates + outcomes)
- [ ] Mage-rank system: formalize guild healer ranks (ex: 10th-level mage service), unlock rules, costs, and narrative role
- [ ] Advanced jobs unlock system by class
- [ ] Class-specific passives affecting quests/tower outcomes
- [ ] Affinity impact hooks for quests/NPC/tower decisions
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
  - [ ] Buff slot increases
  - [ ] Title slot increases
  - [ ] New quest visibility tiers
  - [ ] Tower access expectations
- [ ] Add tests for rank gate logic and rank transition integrity.

## Content Expansion

- [ ] Add more quest types and special quest chains
- [ ] Add special item categories for tower prep (consumables, relics, keys)
- [ ] Add more weapons per class and weapon progression path
- [ ] Add armor and accessory equipment slots
- [ ] Add tower floors 11+ with variant mechanics and multiple boss floors

## UI/UX

- [ ] Remove remaining inconsistent hardcoded colors and finish tokenized theme pass
- [ ] Improve tooltip UX consistency across all screens
- [ ] Add clearer combat/readiness indicators (requirements met, risk state, buffs)
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

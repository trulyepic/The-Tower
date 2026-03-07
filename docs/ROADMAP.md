# Web RPG Roadmap

This is the master implementation tracker for the project.  
Use this file for non-tower planning, and use `docs/TOWER_BATTLE_PHASES.md` for tower combat-phase details.

## Current Direction

- Main goal: players climb and conquer a multi-floor tower.
- Guild remains core support loop:
  - Quest Board for farming items and progression resources
  - Store for buying key supplies and weapons
  - Tower tab for floor advancement
- Class identity matters (current classes + future advanced jobs and additional classes).

## What Is Implemented

- [x] Character creation with class selection and avatar options
- [x] Camp screen with core character overview
- [x] Guild tabs: Quest Board, Store, Tower
- [x] Inventory with equip flow
- [x] Weapon level requirements + proficiency penalty (25% under required level)
- [x] Initial tower system with 10 floors and sequential progression
- [x] Local persistence of game state

## Gameplay Systems

- [x] Quest system v1 spec + baseline implementation (`docs/QUEST_SYSTEM_SPEC.md`)
- [x] Buff system v1: equip/unequip, timed effects, tower activation flow, active indicators
- [x] Buff control v1.1: manual deactivate/resume with saved remaining timer, visible buff effects in Camp/Combat/Tower
- [ ] Tower battle phase flow UI and logic (see tower phases doc)
- [ ] Floor failure consequences tuning (stamina, rewards, retries)
- [ ] Rank progression system (F -> SS advancement rules)
- [ ] Advanced jobs unlock system by class
- [ ] Class-specific passives affecting quests/tower outcomes
- [ ] Economy balancing pass (gold, stamina spend/recovery, item drop rates)

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

# Tower Battle Phases (Roadmap)

This file tracks the phased battle system for tower floors.  
Guild Quest Board and Store remain active and are part of tower prep.

## Implemented Base

- [x] 10-floor tower data model
- [x] Sequential floor progression
- [x] Floor level requirements
- [x] Item readiness effect on floor success
- [x] Floor enemy lanes (normal, sub-boss, main boss) data
- [x] Weapon level requirement + 25% proficiency penalty when under-leveled
- [x] Buff loadout + manual buff activation for tower prep (timed buffs)
- [x] Tower tab in Guild

## Next: Floor Battle Phases

- [ ] Phase 1: Enter Floor
  - [ ] Show floor briefing modal (requirements, enemy lanes, rewards)
  - [ ] Confirm stamina spend before run starts

- [ ] Phase 2: Normal Enemy Wave
  - [ ] Resolve normal wave progress meter
  - [ ] Add optional minor drop roll during wave

- [ ] Phase 3: Sub-Boss Wave
  - [ ] Resolve one or more sub-bosses (for now single lane)
  - [ ] Add higher failure penalty than normal wave

- [ ] Phase 4: Main Boss
  - [ ] Resolve boss encounter
  - [ ] Apply floor clear rewards on success
  - [ ] Keep floor uncleared on failure

- [ ] Phase 5: Results
  - [ ] Show battle report with per-phase outcomes
  - [ ] Show loot summary and progression gains

## Future High-Floor Extensions

- [ ] Multiple main bosses on a single floor
- [ ] Boss mechanics by class/weapon type
- [ ] Floor modifiers (hazards, buffs, curses)
- [ ] Consumable loadout selection before run
- [ ] Team mode (optional far-future direction)
- [ ] Floor 10 story gate:
  - [ ] Resolve Aldric Vale rescue questline branch outcome before Floor 10 access.
  - [ ] If Aldric quest accepted/completed, enable his Floor 10 support interaction.
  - [ ] Implement Aldric support skill during Floor 10 main boss mechanics:
    - [ ] Trigger window in mechanic resolution timeline
    - [ ] Apply success-rate increase + mechanic mitigation effect
    - [ ] Visual combat log callout for ally intervention
  - [ ] If Aldric quest declined twice, apply alternate Floor 10 route with higher risk.

## Floor 1 Reward Baseline (Current)

Goal: make Floor 1 useful as an early farm lane while tightly coupling quest farming to tower prep.

- Guaranteed clear rewards:
  - `+45 XP`
  - `+24 Gold`
  - `+16 Mastery XP`
- Guaranteed monster-part drops:
  - `Ash Rat Tail x1`
  - `Dust Crawler Claw x1`
  - `Sentinel Core Shard x1`
  - `Warden Spark Core x1`
- Possible item drops:
  - `Iron Ore x2` at `66%`
  - `Healing Herb x1` at `55%`
  - `Rope x1` at `46%`
  - `Torch x1` at `40%`
  - `Focus Tonic x1` at `18%`
  - `Ward Charm x1` at `7%`
  - `Tower Crest Fragment x1` at `3%` (chase drop)
  - `Training Shortsword x1` at `4.5%`
  - `Scout Pike x1` at `4.5%`
  - `Novice Oakstaff x1` at `4.5%`

## Quest <-> Tower Coupling (Current Rules)

- Tower floors now use **committed recommended supplies** (`+ / -`) instead of passively reading inventory.
- Committed recommended supplies are **consumed on floor start** (success or failure).
- Counter-supplies now directly mitigate monster mechanics (poison/overcharge/sweep/shock effects).
- Tower panel now shows **quest source hints** for recommended supplies so players can farm those on Quest Board.
- Early floor recommended-supply targets were increased to encourage quest farming loops before climbing.

## Tower Death + NPC Revival (Current Rules)

- At `0 HP`, adventurer is **incapacitated** and cannot start quests or tower runs.
- Tower `Conquer Floor` action is locked while incapacitated.
- No auto-revive is applied in tower resolution.
- Guild now has an `NPC` tab with a **license-style NPC card** for revival interaction.
- Current revival NPC:
  - `Archmage Seraphine` (`10th Circle`)
  - Revive effect: `Full HP`
  - Cost: `Level -1`
- NPC UI is now modeled as a profile list so additional guild NPC licenses can be added with the same pattern.

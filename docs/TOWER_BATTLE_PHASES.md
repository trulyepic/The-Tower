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

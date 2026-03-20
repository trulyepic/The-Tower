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
- [x] Sigil loadout + manual sigil activation for tower prep (timed effects)
- [x] Tower tab in Guild

## Next: Floor Battle Phases

- [x] Phase 1: Enter Floor
  - [x] Staged run flow: `Entrance -> Lore Briefing -> Waves`
  - [x] Floor briefing modal with lore/story context before wave controls unlock
  - [x] Conquer button gated until floor entry + briefing are completed

- [x] Phase 2: Normal Enemy Wave (UI staging)
  - [x] Normal wave content now appears only after the floor-entry flow
  - [x] Wave sections now use locked progression buttons: `Normal -> Sub-Boss -> Main Boss`
  - [x] Each wave now has its own scoped mechanic preview, recommended supplies, and drop pool panel
  - [x] Conquering a wave now records a per-wave mechanic result report (countered vs triggered)
  - [x] Conquering a wave now applies immediate HP + stamina + committed-item consumption changes
  - [x] Enemy cards + drops shown in wave stage, not immediately on first view
  - [x] Floor 1 now supports a first live-response battle layer:
    - [x] telegraphed mechanics
    - [x] position choice
    - [x] enemy-specific position advantage / blocked-lane rules
    - [x] brace response
    - [x] committed item timing
    - [x] class-skill response hook

- [x] Phase 3-4 runtime change
  - [x] Floor rewards/progression now occur on explicit floor finalization after all wave sections are cleared
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
- [ ] Extend the live-response battle layer beyond Floor 1
- [ ] Add seal-driven live combat reactions
- [ ] Add engraving-driven live combat modifiers
- [ ] Floor modifiers (hazards, buffs, curses)
- [ ] Consumable loadout selection before run
- [ ] Team mode (optional far-future direction)
- [x] Recurring/conditional floor encounter events framework
  - [x] Floor 1 conditional in-run NPC interaction + temporary run bonus
  - [x] Conditional encounters can pause tower progression until resolved
- [x] Climber leaderboard trigger hooks (quest clear / floor clear / level-up)
- [ ] Floor 10 story gate:
  - [ ] Resolve Aldric Vale rescue questline branch outcome before Floor 10 access.
  - [ ] If Aldric quest accepted/completed, enable his Floor 10 support interaction.
  - [ ] Implement Aldric support skill during Floor 10 main boss mechanics:
    - [ ] Trigger window in mechanic resolution timeline
    - [ ] Apply success-rate increase + mechanic mitigation effect
    - [ ] Visual combat log callout for ally intervention
  - [ ] If Aldric quest declined twice, apply alternate Floor 10 route with higher risk.
- [ ] Lyra Ashstep early-floor branch:
  - [ ] Track repeated acceptance/decline of her ash-route help
  - [ ] Add follow-up side quest after enough contact
  - [ ] Tie her intel network to later floor hazard mitigation
  - [ ] Route her branch toward one of the main endings depending on player choices

## Floor 1 Reward Baseline (Current)

Goal: make Floor 1 useful as an early farm lane while tightly coupling quest farming to tower prep.

- Guaranteed clear rewards:
  - `+45 XP`
  - `+24 Gold`
  - `+16 Mastery XP`
- Guaranteed monster-part drops:
  - `Ash Rat Fang x1`
  - `Dust Crawler Shell x1`
  - `Sentinel Shard x1`
  - `Warden of Sparks Heart x1`
- Possible item drops:
  - `Iron Ore x2` at `68%`
  - `Healing Herb x2` at `58%`
  - `Health Potion x1` at `32%`
  - `Rope x1` at `45%`
  - `Torch x1` at `40%`
  - `Antitoxin Vial x1` at `28%`
  - `Guard Tonic x1` at `22%`
  - `Training Shortsword x1` at `4.5%`
  - `Scout Pike x1` at `4.5%`
  - `Novice Oakstaff x1` at `4.5%`

Reward teaching intent:
- Early clears should mostly reinforce the Floor 1 loop:
  - recovery (`Healing Herb`, `Health Potion`)
  - visible counters (`Antitoxin Vial`, `Guard Tonic`)
  - traversal/utilities (`Rope`, `Torch`)
  - basic crafting signal (`Iron Ore`)
  - exciting but low-rate starter weapon upgrades
  - one meaningful boss trophy (`Warden of Sparks Heart`)
- High-tier chase drops have been removed from Floor 1 so the reward table teaches fundamentals before late-game rarity fantasies.
- Floor 1 remnants should also introduce the future structure:
  - `Sigils` as the timed player layer
  - `Seals` as modular inserts placed into Sigils later
  - `Engravings` as permanent weapon-bound upgrades fed by stronger remnants

## Floor 2 Baseline (Current)

Goal: make the second floor teach restraint, anti-attrition preparation, and corridor-control mechanics.

- Floor:
  - `Floor 2: Thorn Corridor (The First Snare)`
  - `Soft recommendation: Rank E`
  - `Soft recommendation: Level 5`
  - intended as the first post-F-rank tower push, but not hard-locked
- Core lesson:
  - the Tower can slow-kill through snares, bleed pressure, and recovery suppression
- New supply family:
  - `Briar Resin`
  - `Thorn Salve`
- Recommended prep:
  - `Healing Herb x3`
  - `Rope x1`
  - `Torch x1`
  - `Thorn Salve x2`
  - `Guard Tonic x1`
- Enemy roster:
  - Normal:
    - `Thorn Viper`
    - `Needle Imp`
  - Sub-Boss:
    - `Scourge Seraph`
  - Main Boss:
    - `Briar Ophanim`
- Guaranteed monster-part drops:
  - `Thorn Viper Fang`
  - `Needle Imp Quill`
  - `Scourge Hook`
  - `Ophanim Core`
- Reward direction:
  - `Briar Resin`
  - `Thorn Salve`
  - recovery/counter restocks
  - `Embershard Sigil`
  - first future-facing `Seal` ingredient hooks through corridor remnants
  - rare class weapon chase drops:
    - `Briarcleaver`
    - `Thornline Spear`
    - `Rootglass Staff`

Reference:
- [FLOOR_2_THORN_CORRIDOR.md](/Users/kin/web-rpg/docs/FLOOR_2_THORN_CORRIDOR.md)
- [LIVE_BATTLE_SYSTEM.md](/Users/kin/web-rpg/docs/LIVE_BATTLE_SYSTEM.md)

## Quest <-> Tower Coupling (Current Rules)

- Tower floors now read from the player's **prepared tower supplies** instead of per-wave recommended supply commit cards.
- Counter-supplies now directly mitigate monster mechanics (poison/overcharge/sweep/shock effects).
- Floors should teach through lore, weakness notes, and intel rather than visible recommended-supplies panels.
- Enemy mechanics intel now has **discovery gating**:
  - First encounter with a monster records intel.
  - Subsequent encounters reveal the full enemy dossier (description + mechanics).

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

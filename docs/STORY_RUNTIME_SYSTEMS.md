# Story Runtime Systems (V1)

## Purpose
This document defines the first implementation slice of dynamic story runtime features tied to tower climbing.

## 1) Floor Event Encounters

### Goal
Inject interactive story moments inside tower progression so floor attempts feel alive, not static.

### Core Rules (V1)
- Floor events are tied to a specific floor number.
- A floor event can recur on later attempts of the same floor.
- Floor events can be one of two patterns:
  - `Pre-entry encounter`: shown before entering a floor.
  - `Conditional in-floor encounter`: triggered only after specific combat/mechanic conditions are met.
- Player choices are explicit:
  - `Accept` interaction: grants a temporary floor bonus for that attempt.
  - `Decline` interaction: no bonus.
- Encounter decisions are tracked per attempt.

### Data tracked
- Attempt count per floor.
- Encounter seen/accepted/declined counters.
- Active encounter bonus for the current attempt (if accepted).
- Per-enemy tower intel discovery (first encounter unlocks future dossier details).
- Purchased guild floor-intel ledgers by floor number.
- Alternate intel unlock flags from NPC favors, board quests, and adventurer reports.

### Initial implementation target
- Floor 1 conditional in-floor scout encounter.
- Main Quest tracker should always reflect the current playable story spine.
  - chapter changes should write to the tracker log
  - main-story notifications should open the tracker cleanly outside tower mode
- Trigger: only after poison pressure is suffered during the first wave.
- Result: NPC guidance can stabilize the run before deeper waves.

## 2) Climber Leaderboard (Living Tower)

### Goal
Make the world feel active by showing that other adventurers are also climbing.

### Core Rules (V1)
- The leaderboard includes rival climbers + the player.
- Rival climbers progress over time based on player checkpoint triggers.
- Trigger checkpoints:
  - Successful quest claim
  - Successful tower clear
  - Level up
- On each trigger:
  - Rival standings update.
  - Player standing is recomputed.
  - A story notification can announce movement or pressure.

### Data tracked
- Rival climber roster (name, class, level, floor, trend).
- Last known player rank on leaderboard.
- Latest update source trigger.

## 3) Narrative Integration Hooks

### For recurring floor NPCs
- Some recurring NPCs can become long-term allies.
- Some can branch to side quests, floor mechanics, or ending flags.

### For climber world-state
- Leaderboard state can feed:
  - Guild dialogue variants
  - Rival encounter events on specific floors
  - Ending condition modifiers (future)

### For Higher Beings (new canon hook)
- Add a runtime layer for divine patron tracking:
  - per-being `favor` and `wrath` values,
  - trigger sources from quests/floor decisions/NPC outcomes,
  - conflict model where one Being's favor can antagonize another.
- Initial active set:
  - `seraphel_lantern_of_oaths`
  - `vaeltor_crown_in_glass`
  - `nyxara_last_dusk`
- Runtime effects should be staged:
  - V1: notifications + flavor dialogue changes,
  - V2: mechanical effects on floor modifiers and encounter difficulty,
  - V3: ending route locks and final encounter variation.

### For Faction War Layer (new canon hook)
- Add runtime tracking for:
  - `Aureate Spire` standing (Tower-worship bloc),
  - `Ashen Oathbreak` standing (Tower-destruction bloc),
  - `Apostolic Veil` standing (shadow church containment bloc),
  - faction hostility tiers and response cooldowns.
- Faction contact path:
  - introduced via adventurer NPC members,
  - not directly via initial world-map reveal,
  - Apostolic Veil introduced through clergy, archivists, hospitalers, confessors, relic judges, and inquisitorial observers.
- Runtime response model:
  - favorable: aid events, special contracts, safer routes,
  - hostile: sabotage events, ambush checks, supply disruption.
  - Apostolic Veil special responses:
    - sanctuary access,
    - sealed archive access,
    - confessional intelligence,
    - relic confiscation,
    - doctrinal summons,
    - inquisitorial pursuit.

### For Nephari Lineages (new canon hook)
- Add hidden lineage flags for key NPCs and selected climbers:
  - human appearance with subtle supernatural/angelic marks,
  - lineage disclosure triggered by story thresholds.
- Runtime impact:
  - unlocks lineage-exclusive dialogue/quests,
  - modifies faction trust and higher-being reactions.

### For NPC Set A (new canon hook)
- Initial named NPC set:
  - `lys_marrowind`
  - `cael_vorn`
  - `mireth_ashvale`
- Runtime requirements:
  - relationship score per NPC,
  - interference tier per NPC (none / mild / active / hostile),
  - faction and higher-being influence adapters.
- Response model:
  - positive: assist events, route previews, emergency support,
  - negative: reroute pressure, denial of support, hostile interference checks.

### For Apostolic Veil Set B (new canon hook)
- Initial named NPC set:
  - `father_matthieu_valecourt`
  - `sister_caliste_verenne`
  - `inquisitor_severin_thorne`
- Runtime requirements:
  - personal relationship/disposition per NPC,
  - shared `apostolicVeil` standing,
  - internal wing exposure flags:
    - `reformer`
    - `preservationist`
    - `inquisitor`
- Response model:
  - Matthieu:
    - sanctuary, healing access, moral witness, burial-right protections
  - Caliste:
    - sealed archive access, relic appraisal, hidden dossier unlocks
  - Severin:
    - surveillance, confiscation, summons, hunts, conditional sanctioned aid

## 4) Current V1 Scope
- [x] Specification drafted.
- [x] Floor 1 event with interaction choice.
- [x] Recurrence behavior for floor events.
- [x] Rival climber leaderboard with trigger updates.
- [x] Story notification messages for leaderboard updates.
- [x] Guild leaderboard has dedicated tab.
- [x] Conditional in-floor encounter can pause progression until player responds.
- [x] Lyra Ashstep moved to conditional in-floor trigger only (no pre-entry duplication).
- [x] Lyra acceptance/decline now updates persistent story state and unlocks her NPC record.
- [x] Lyra's first follow-up quest hook (`Lyra's Ember Map Recovery`) is now gated by accepting her in-floor help.
- [x] Lyra refusal now has a reconciliation unlock path after the player proves reliability through continued questing.
- [x] Lyra first contact now has two runtime styles:
  - [x] `rescued` if poison pressure lands during Floor 1 normal wave
  - [x] `disciplined` if the player brings the right counters and still draws her attention
- [x] `rescued` route now seeds a future relationship penalty state (`lyraAshDebt`) instead of skipping the NPC entirely.
- [x] Staged floor entry flow (Entrance -> Lore Briefing -> Waves) before combat action.
- [x] Enemy detail reveal system tied to first encounter outcomes.

## 5) Future Expansion TODO
- [ ] Guild floor-intel system through `Floor 55`
  - [x] early store intel ledger baseline
  - [x] hide/reveal weakness notes, optional drops, and support aids by purchased intel or discovery
  - [x] early intel rewards through NPC favors and board-quest rewards
    - [x] `Restore Shrine Wards` -> Floor 1 intel
    - [x] `Harvest Briar Resin` -> Floor 2 intel
    - [x] Lyra favor route -> Floor 1 intel
  - [ ] add higher-floor pricing bands while keeping Floors 1-5 inexpensive
- [ ] Rival NPC direct encounters inside tower floors.
- [ ] Rival sabotage/help events tied to affinity and choices.
- [ ] Story chapter gating by leaderboard thresholds.
- [ ] Floor-specific event chains with persistence and branching.
- [ ] Add Lyra Ashstep relationship runtime state:
  - [ ] `lyraTrust`
  - [ ] `lyraFactionExposure`
  - [ ] `lyraQuestState`
- [ ] Add Lyra branch quest chain:
  - [x] first quest hook unlocked from Lyra trust
  - [x] refusal no longer hard-locks the branch permanently
  - [ ] investigate ash-vent survivor routes
  - [ ] choose whether to protect, expose, or betray her network
  - [ ] feed one or more main-story ending variables
- [ ] Ending-score inputs from leaderboard milestones.
- [ ] Higher Being favor/wrath runtime model (state + migration + UI exposure).
- [ ] Implement Set A being profiles (Seraphel / Vael-Tor / Nyxara) in data.
- [ ] Add per-being reaction log entries in quest and tower results.
- [ ] Covenant quest runtime events and NPC patron-tension outcomes.
- [ ] Aureate/Ashen faction standing + interference runtime hooks.
- [ ] Apostolic Veil standing + internal-branch hooks (reformer / preservationist / inquisitor).
- [ ] Nephari lineage reveal flags and branch events.
- [ ] Implement NPC Set A profiles (Lys / Cael / Mireth) in data.
- [ ] Add per-NPC relationship and interference tier runtime state.

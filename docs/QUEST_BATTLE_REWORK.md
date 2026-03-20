# Quest Battle Rework

Status: planned combat-system extension for guild quests.

Use this file as the source of truth for how board quests should resolve once quest gameplay moves onto the turn-based RPG battle system already established in Tower combat.

Related:
- `docs/QUEST_SYSTEM_REWORK.md`
- `docs/LIVE_BATTLE_SYSTEM.md`
- `docs/SEQUENTIAL_CONTENT_PLAN.md`
- `docs/ROADMAP.md`

## Why This Rework Exists

Right now the project has two different combat truths:
- Tower combat now has a real turn-based battle layer
- most quest-board battle contracts still resolve like passive timers with a summary at the end

That split makes the game feel less coherent than it should.

If a player takes a dangerous combat quest from the Guild, it should feel like actual combat:
- use skills
- use items
- react to enemy pressure
- see HP move in real time
- win or fail because of play and build decisions, not only because of a hidden percentage

Gathering quests do not need this heavier system.
Combat quests do.

## Core Rule

### Gathering quests

Keep the lighter current model:
- accept
- commit supplies
- timer / resolve
- summary

These are support-loop tasks, not the place for full combat.

### Combat quests

Use the same turn-based RPG battle model as Tower combat.

This includes:
- `adventure` quests that are really combat contracts
- `dungeon` quests
- future `wanted` contracts

## Resolution Model By Quest Type

### `gather`

Resolution style:
- current quest timer / resolve flow

Why:
- low-intensity support content
- better for farming and prep pacing

### `adventure`

Resolution style:
- single battle encounter by default
- turn-based RPG combat

Typical structure:
- one enemy group
- or one named combat target with adds

Examples:
- bandit patrol
- ash-lane ambush
- beast-control contract

### `dungeon`

Resolution style:
- multi-step or multi-wave combat contract
- turn-based RPG combat with stronger encounter identity

Typical structure:
- multiple groups
- sub-boss / boss possibility
- stronger item and status pressure

### `hunt`

Resolution style:
- target pursuit contract
- live turn-based combat

Typical structure:
- named monster or remnant beast target
- tracking/setup flavor before the encounter
- one focused combat encounter or a short two-step encounter

Important rule:
- `hunt` should feel like a creature contract
- more fieldwork than `wanted`
- less social/legal consequence weight than `wanted`

### `wanted`

Resolution style:
- named target hunt
- turn-based RPG combat
- stronger narrative consequences than standard jobs

Typical structure:
- one named outlaw / rogue adventurer / monster target
- often includes escorts, traps, or pursuit-phase setup
- outcome can affect later story, NPC perception, or future board state

Important rule:
- `wanted` should feel closer to a small boss contract than a normal repeatable quest

## Wanted Contracts

Wanted work should reuse the quest-state model from `docs/QUEST_SYSTEM_REWORK.md`, but the combat flow should feel closer to live Tower battle.

Wanted contracts should usually include:
- named target identity
- reason the target matters
- danger framing
- turn-based battle encounter
- visible aftermath/consequence reporting

Future Aldric tie-in:
- the Watchtrail bandit leader belongs to this lane
- that makes `Wanted` not just a future tab label, but a real combat contract structure we should support systemically

## Hunt Contracts

Hunt work should also reuse the quest-state model from `docs/QUEST_SYSTEM_REWORK.md`, but it should present a different fantasy from `Wanted`.

Hunt contracts should usually include:
- named monster or beast target
- habitat / territory framing
- recommended counters and supplies
- live turn-based battle encounter
- trophy / remnant / material-focused rewards

Difference from Wanted:
- `Hunt` is usually about bringing down a dangerous creature
- `Wanted` is usually about bringing down a named outlaw or consequence target

## Combat Design Rule

Quest battle contracts should **not** copy Tower combat 1:1 without adjustment.

Tower combat is about:
- climbing pressure
- floor preparation
- wave sequencing
- floor persistence

Quest combat should be:
- tighter
- more targeted
- more contract-specific

### Shared with Tower

Keep:
- turn-based action flow
- initiative tied to speed
- HP bars and damage in real time
- statuses that actually affect combat
- skill cooldown logic
- item use during combat
- battle log

### Different from Tower

Quest battles should usually have:
- fewer enemies
- shorter encounter length
- stronger named contract flavor
- cleaner start/end flow

Tower-specific systems should not be forced into every quest:
- no need for tower lane framing
- no need for floor-stage structure
- no need for conquer-stage presentation

## Board Quest Combat Flow

Recommended combat-quest flow:

1. player accepts contract
2. player commits prep items if needed
3. player starts contract
4. if quest is combat-based:
   - open live turn-based battle
5. battle resolves by actual HP defeat / player defeat
6. result modal explains:
   - contract success/failure
   - target state
   - reward / consequence
7. journal updates

## Failure Rules

Combat quest failure should read logically.

Do not fake:
- “quest failed” with no visible battle reason

Instead report things like:
- you were underprepared
- the contract target overpowered you
- you lost too much tempo under status pressure
- the target escaped
- the rescue window closed during resistance

## First Implementation Order

### Slice 1

Convert one ordinary combat `adventure` quest into a live turn-based contract.

Goal:
- prove the shared model outside the Tower

Best candidate:
- a simple bandit or ash-creature combat quest

### Slice 2

Normalize special combat quests into the same combat framework.

Goal:
- Aldric-style battle contracts should use the same underlying combat language instead of one-off presentation logic

### Slice 3

Add first true `wanted` contract structure.

Goal:
- establish `wanted` as:
  - named target
  - combat-forward
  - consequence-heavy

## System Rules To Preserve

When this is implemented:

- gathering quests remain lightweight
- battle quests use live turn-based combat
- wanted contracts use live turn-based combat
- tower combat remains the most persistent/attritional version
- quest combat remains the tighter contract version

## Current Recommendation

The next gameplay implementation after current quest-board/journal cleanup should be:

1. define which current `adventure` quests become live combat contracts first
2. convert one simple combat quest before touching all of them
3. then fold Aldric/special combat work into the same framework
4. then add the first real `hunt` contract
5. then add the first real `wanted` contract

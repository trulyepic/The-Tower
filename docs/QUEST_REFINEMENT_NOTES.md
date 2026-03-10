# Quest Refinement Notes

This file is the execution spec for the next quest-system pass.

## Status

- [x] Phase 1 core math/models implemented
- [x] Phase 2 quest start/claim integration implemented
- [ ] Phase 3 UI polish (full breakdown panel, danger meter tuning)

## V1 Objectives

- Make success chance transparent and deterministic.
- Make key items matter more on risky quests.
- Add quest risk via health loss (success can still hurt, failure hurts more).

## Scope (This Pass)

- In scope:
  - success breakdown formula and UI
  - health resource + quest health-loss resolution
  - quest result modal updates
- Out of scope (later):
  - full healing economy loop
  - advanced status effects (bleed/poison/etc.)
  - helper-item system (deferred)

## Success Formula (V1)

Final quest chance is deterministic with explicit parts.

`finalChance = clamp(base + level + key + optional + weapon + buff, 8, 96)`

### Breakdown Components

- `base`: `quest.baseSuccessChance`
- `level`:
  - `levelDelta = player.level - quest.minLevel`
  - `level = clamp(levelDelta * 3, -18, +20)`
- `key`:
  - `keyReadiness = sum(min(owned, needed)) / sum(needed)` (0..1, if no key items use 1)
  - `key = round((keyReadiness - 1) * 44)` (max penalty ~ -44 if all missing)
- `optional`:
  - `optionalReadiness = sum(min(owned, needed)) / sum(needed)` (0..1, if none use 0)
  - `optional = round(optionalReadiness * 10)` (small bonus only)
- `weapon`:
  - class-valid weapon rarity + proficiency contribution
  - proficiency behavior: 100% at required level, otherwise 25%
- `buff`:
  - active buff bonus to success

## Key Item Impact Rules

- `gather` quests: moderate key penalty.
- `adventure` quests: strong key penalty.
- `dungeon` quests: strongest key penalty.

Per-type multiplier on `key` penalty:
- gather: `0.75`
- adventure: `1.0`
- dungeon: `1.2`

## Health System (Quest Risk)

## Character Stats Additions

- `health: number`
- `healthCap: number`
- start values: `healthCap = 100`, `health = 100`

## Health Loss Resolution

After quest roll:

- `success`:
  - normal success: `0` damage
  - risky success: small damage chance
- `failure`:
  - guaranteed damage, scaled by difficulty/readiness

### Damage Inputs

- quest difficulty
- missing key items
- final success band

### Damage Model

- Base failure damage by difficulty:
  - D1 `4`, D2 `7`, D3 `10`, D4 `14`, D5 `18`
- Missing key penalty:
  - `missingKeyRatio = 1 - keyReadiness`
  - add `round(missingKeyRatio * 8)`
- Low-confidence penalty:
  - if `finalChance < 40`, add `+4`
  - if `finalChance < 25`, add additional `+4`
- On success:
  - if `finalChance < 45`, 35% chance to take `1..4` damage
- Clamp health at min `1` (no death in v1)

## UX Changes

- Quest card:
  - show `Danger` badge (Low/Medium/High/Extreme)
  - key item readiness value with icon color states
- Active quest:
  - cache and display chance snapshot
- Result modal:
  - show:
    - success chance breakdown
    - health change
    - rewards

## Data/State Changes

- `CharacterState`:
  - add `health`, `healthCap`
- `ActiveQuestState`:
  - add `chanceBreakdownSnapshot`
- `QuestOutcome`:
  - add `healthDelta`
  - add `chanceBreakdown`

## Implementation Plan

## Phase 1: Core Math + Models

- Add model fields for health and breakdown.
- Add pure quest breakdown calculator.
- Add damage resolution utility function.

## Phase 2: Quest Start/Claim Integration

- Resolve health damage and rewards on claim.
- Persist outcome breakdown.

## Phase 3: UI Pass

- Add danger badge and breakdown display.
- Update result modal with health and breakdown lines.

## Acceptance Criteria

- Same inputs always produce same chance and damage outputs.
- Missing key items clearly reduce chance (visible + measurable).
- Health can decrease from risky quests and failures.
- Result modal clearly explains what happened.

## Open Decisions

- Should health regenerate passively or only via consumables/rest?
- Should failure ever reduce rewards to zero at very low chance?

## Backlog (Deferred)

- Helper items that temporarily increase chance or reduce damage.
- Helper crafting and acquisition systems.

## Rank Trials (Implemented)

- Rank progression now uses Guild promotion trials.
- `F -> E` requirement:
  - player level `>= 5`
  - quest clears `>= 5`
  - required items: `Torch x1`, `Rope x1`
  - optional support: `Healing Herb x2`
  - challenge is administered by the assigned Rank Examiner NPC in Guild `NPC` Hall.
- Trial supports:
  - key items and optional supplies
  - success-chance meter
  - stamina cost and reward payout
  - failure/success resolution with health impact
- Later rank transitions (`E -> D -> C -> ... -> SS`) are pre-defined with higher level/clear/item demands.

## Rank Progression Tuning TODO

- [ ] Re-validate trial tuning after threshold updates already applied (success chance + resource costs).
- [ ] Add examiner-specific trial dialogue and challenge identity per rank transition.

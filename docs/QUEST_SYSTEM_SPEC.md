# Quest System Spec (Current + Next)

This document is the reference spec for how questing works in the Guild Quest Board.

## Core Loop

1. Player selects a quest from Quest Board.
2. Player sees live `Success Chance` preview before starting.
3. Starting a quest spends stamina and starts a duration timer.
4. Player resolves quest when timer completes.
5. Success grants full rewards and drop rolls.
6. Failure grants consolation rewards (reduced gold/XP) and no drop rolls.

## Quest Data Model

Each quest contains:

- `rank` and `minLevel` gate access.
- `requiredItems`: key readiness items (heavy success impact).
- `recommendedItems` (optional): bonus readiness items.
- `itemRewards`: chance-based drops with item grade (`common/rare/epic/legendary` on the item definition).
- `reward`: guaranteed `xp`, `gold`, `masteryXp` on success.

## Success Chance Formula

Current formula:

- Base: `quest.baseSuccessChance`
- Required readiness bonus: `requiredReadiness * 26`
- Optional readiness bonus: `recommendedReadiness * 14`
- Level modifier: `clamp((playerLevel - quest.minLevel) * 3, -18, 22)`
- Weapon bonus:
  - type bonus (`gather=3`, `adventure=6`, `dungeon=8`)
  - rarity bonus (`common=1`, `rare=2`, `epic=4`, `legendary=6`)
  - both scaled by proficiency (`100%` if level requirement met, else `25%`)
- Weapon attack contribution: `min(10, round(effectiveWeaponAttack / 4))`
- Final clamp: `8..98`

Where:

- `requiredReadiness = ownedRequired / totalRequired` (0..1)
- `recommendedReadiness = ownedRecommended / totalRecommended` (0..1)

## Reward Resolution

### Success

- Applies full `xp`, `gold`, `masteryXp`.
- Rolls each `itemRewards` entry independently by `chance`.
- Adds rolled items to inventory.

### Failure

- Applies consolation rewards:
  - XP: `35%` (min `6`)
  - Mastery XP: `35%` (min `3`)
  - Gold: `25%` (min `4`)
- No item drop rolls.

## Stamina System

Stamina comes from:

- Passive regen: `+1 every 5 minutes` (`300000ms`) until cap.
- Quest resolve recovery: `+1` on quest claim/resolve.

Implementation details:

- Character tracks `staminaLastTickAtMs`.
- Regen is applied:
  - on state hydration/load (offline progress catch-up),
  - every 30 seconds while playing,
  - right before quest/tower actions and success previews.
- If stamina is full, regen timer tracks current time and resumes after spending stamina.

## UI Contract (Quest Board)

- Action button is personal voice: `Take This Quest`.
- Quest card must show:
  - key item readiness,
  - optional supply readiness,
  - possible drop items with grade + drop chance.
- Success chance tooltip should mention all contributors (items, level, weapon).

## Planned Extensions

- Quest risk modes (`Safe`, `Standard`, `Rush`) with different stamina/time/success modifiers.
- Streak/pity system for rare drops.
- Multi-step quest chains with unlock conditions.

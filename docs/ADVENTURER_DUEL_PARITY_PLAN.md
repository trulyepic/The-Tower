# Adventurer Duel Parity Plan

Status: Active planning track for rank-duel combat parity.

Use this file when changing:
- rank duels
- named adventurer opponents
- duel AI behavior
- duel presentation
- enemy item/sigil parity

Related references:
- [/Users/kin/web-rpg/docs/RANK_PROGRESSION_REWORK.md](/Users/kin/web-rpg/docs/RANK_PROGRESSION_REWORK.md)
- [/Users/kin/web-rpg/docs/LIVE_BATTLE_SYSTEM.md](/Users/kin/web-rpg/docs/LIVE_BATTLE_SYSTEM.md)
- [/Users/kin/web-rpg/docs/ROADMAP.md](/Users/kin/web-rpg/docs/ROADMAP.md)
- [/Users/kin/web-rpg/docs/WORKSTREAM_AGENT_MODEL.md](/Users/kin/web-rpg/docs/WORKSTREAM_AGENT_MODEL.md)

## Purpose

Rank duels should feel like fighting another adventurer with a real build, not like a monster reskinned as a person.

The duel needs to communicate:
- the opponent has gear
- the opponent has a plan
- the opponent can spend resources
- the opponent can change phase under pressure

That is the baseline for adventurer-vs-adventurer parity.

## Current Baseline

`E -> D` now has the right structural shape:
- named duelist instead of random opponent
- guild hall integration
- visible loadout notes
- weapon / sigil / pouch identity
- second phase
- duel-specific result ceremony

Treat Riven as the first real loadout-based opponent baseline.

The remaining work is to make the duel feel mechanically and visually like a real mirror match without adding gimmicks that fight the turn-based language.

## Reusable Adventurer Opponent License

Rank trials and named adventurer duels should present opponents through a license-style dossier card.

This dossier should show:
- `ID`
- `Rank`
- `Level`
- `Weapon`
- `Sigils`
- `Title`
- `Skill`
- `Passive`
- `Pouch`

### What Each Field Means

- `ID`
  - the stable guild record identifier
  - this is the thing that keeps the opponent reusable across future references

- `Rank`
  - current adventurer rank for the duel
  - should be visible immediately in the license header

- `Level`
  - the opponent's current combat level
  - should be shown near rank, not buried in a detail panel

- `Weapon`
  - the exact weapon being carried into the duel
  - should communicate weapon identity first, stats second

- `Sigils`
  - equipped sigils and their defensive identity
  - should surface family shape, rarity, and any meaningful armor contribution

- `Title`
  - the opponent's earned identity or hall title
  - should help the player understand why this person matters in the guild

- `Skill`
  - the opponent's primary active skill or signature combat action
  - should be readable as a real battle move, not a generic AI label

- `Passive`
  - the opponent's core passive behavior or baseline trait
  - should explain what makes the duel feel like that specific build

- `Pouch`
  - the items the opponent can actually spend in battle
  - should show stack-based recovery, counters, or pressure support

### Dossier Surface Rule

The dossier should not be a flat list dump.

Use this layout:
- a strong portrait or license card header
- the identity line with `ID`, `Rank`, and `Level`
- a loadout strip for `Weapon`, `Sigils`, and `Title`
- a battle-kit strip for `Skill`, `Passive`, and `Pouch`
- a short note on phase behavior when the opponent has multiple phases

Keep the presentation:
- readable at a glance
- compact enough for rank-trial prep
- art-first rather than text-first

The dossier should make the player feel like they are reading a real guild license, not a debug record.

## Single-Opponent Phase Target

The next gameplay target is a true single-opponent phased duel.

That means:
- one named adventurer remains the same opponent through the entire trial
- phase 2 is a state change on that opponent, not a different enemy unit
- the transition should feel like the same duelist escalating, not a second fight stapled on afterward

Do not drift back toward:
- two sequential enemy units
- phase 2 being framed as a separate combatant
- a handoff that feels like the game swapped characters instead of advancing one duel

If the implementation needs a temporary split during development, the documentation should still treat the end state as one opponent with an internal phase shift.

## Visual Rule

The duel health presentation should be phase-led, not fracture-led.

Standing direction:
- the enemy HP color should begin in one readable phase color
- when the next phase starts, the HP color should shift to a new phase color
- do not imply a `Fractured` state unless the duel is actually using a fracture mechanic

That keeps the presentation honest:
- phase change reads as phase change
- low HP reads as low HP
- the bar is not pretending to be a separate status just to look dramatic

## Sequential Upgrade Order

Once the loadout-based opponent baseline is in place, follow this order:

### 1. Phase identity first

Make each duel phase visibly distinct through:
- HP bar color
- phase label
- stance or card accent
- opener text

This should be the first thing a duel communicates clearly.

### 2. Enemy pouch parity

Adventurer duelists should use consumables like players do.

Requirements:
- limited stack-based pouch items
- items only consume when actually used
- healing and protection items should have visible battle value
- log text should explain the item use in plain combat language

Do not:
- give duelists infinite recovery
- make item use feel random or scripted without cues

### 3. Sigil parity

Adventurer duelists should have sigils that matter in battle.

Requirements:
- sigils should contribute armor or other defense-facing value
- active sigil use should be visible in the duel log
- sigil activation should change tempo or defensive posture
- sigil visuals should match the equipped presentation language

### 4. AI archetype behavior

Duelists should behave like a build, not a generic script.

Each duel opponent should define:
- opener style
- pressure style
- recovery style
- phase transition trigger
- low-health response

Examples:
- defensive duelist
- burst duelist
- sigil-heavy duelist
- potion-heavy duelist

### 5. Phase escalation

The second phase should not just be more HP.

The second phase should meaningfully change:
- tempo
- color
- item timing
- sigil pressure
- line priority

The second phase should still belong to the same opponent identity.

### 6. Result ceremony

The duel already has result ceremony, and that should remain in place.

Keep:
- examiner response
- guild record summary
- promotion unlocks
- clear success/failure state

### 7. Later variants

Once the mirror-duel baseline works, future rank duels can vary by:
- class
- loadout
- objective
- pressure pattern

Do not start with these. Build the baseline first.

## Guardrails

Do not add:
- reaction-window gimmicks
- quick-time prompts
- random UI popups
- non-turn-based interruption layers
- abstract duel naming that hides the actual test

The duel should feel sharp because of the opponent's build and decisions, not because the interface is noisy.

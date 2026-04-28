# Combat Interaction Expansion

Status: Active combat-expansion reference. A first reaction-prompt prototype was tried in live combat and removed because it did not feel cohesive with the current battle language.

Use this file when changing:
- live tower battles
- live quest battles
- rank trial combat
- enemy telegraph and interrupt design
- combat event prompts and action moments

Current guardrail:
- do not reintroduce reaction-window UI directly into combat without a stronger art-first and system-cohesive prototype
- prefer improving telegraphs, enemy mechanics, positioning, pouch counters, selective pressure meters, and boss identity first
- selective pressure meters are now part of the accepted combat standard for standout enemies

Use this with:
- [/Users/kin/web-rpg/docs/LIVE_BATTLE_SYSTEM.md](/Users/kin/web-rpg/docs/LIVE_BATTLE_SYSTEM.md)
- [/Users/kin/web-rpg/docs/TOWER_BATTLE_PHASES.md](/Users/kin/web-rpg/docs/TOWER_BATTLE_PHASES.md)
- [/Users/kin/web-rpg/docs/RANK_PROGRESSION_REWORK.md](/Users/kin/web-rpg/docs/RANK_PROGRESSION_REWORK.md)

## Purpose

Live combat is in a much healthier place now, but it can still become too static if every turn collapses into:
- attack
- shift
- skill
- wait

The goal is to add occasional moments that make the player feel:
- alert
- involved
- rewarded for reading the field

without making combat feel:
- spammy
- noisy
- overdesigned
- dependent on constant quick-time gimmicks

## Core Rule

Combat interaction moments should be:
- occasional
- readable
- high-impact
- tied to enemy or floor identity

They should not be:
- every turn
- pure reflex checks with no tactical meaning
- detached from monsters, positioning, or battle state

## Standing Design Rule

Interactive combat moments should respect the existing battle spine:
- positioning still matters
- skill timing still matters
- pouch use still matters
- enemy mechanics still matter

These new interactions should deepen the current system, not replace it.

## Recommended Interaction Types

### 1. Telegraph And Pressure Upgrades

Strengthen the current combat spine before adding extra pop-up interaction.

Priority directions:
- clearer incoming-move telegraphs
- stronger named mechanics
- better counter-item/status readability
- selective pressure meters on standout enemies

### 1A. Special Attack Pressure Meters

Selected enemies can build toward a dangerous finishing move through a visible meter that sits directly under their HP bar.

Core rule:
- use this selectively
- not every enemy gets one
- bosses, sub-bosses, duelists, and standout monsters are the right first homes

Player decision:
- spend a turn to `Interrupt` and cut the meter down
- or keep using normal actions to race the enemy to zero

If the meter fills:
- the enemy's next turn becomes the named finisher
- it should hit hard
- armor, sigils, guard, level gap, and item prep should still mitigate it

UI rule:
- the pressure meter belongs directly under the enemy HP bar
- it should be thinner than the HP bar
- it should not live in a separate combat widget box

Current implementation slice:
- `Riven Hale` phase two
- trigger move: `Execution Rush`

Current rollout direction:
- extend this selectively to standout live quest and tower opponents
- do not make it universal enemy furniture

### 2. Mechanic Interrupt Windows

Some enemies should visibly begin a more dangerous action.
The player can then answer with:
- the correct lane
- the correct skill timing
- the correct pouch item
- or a dedicated interrupt prompt when appropriate

Examples:
- coiling before a strike
- locking a lane
- gathering sparks
- calling a field pulse

Possible outcomes:
- cancel the enemy move
- weaken the move
- break posture
- shift the enemy into a vulnerable state

Why this matters:
- makes monsters feel more alive
- gives bosses and sub-bosses stronger identity

### 3. Timed Strike Finishers

After the player creates an opening, a short optional follow-up can appear.

Examples:
- `Drive The Blade`
- `Break Guard`
- `Exploit Opening`

Possible outcomes:
- bonus damage
- stagger
- lane break
- combo pressure

Why this works:
- makes success feel more active
- rewards good setup instead of random luck

### 4. Battlefield Interactions

The environment occasionally gives the player a tactical option.

Examples:
- loose stone
- burning brazier
- hanging chain
- thorn snag

Possible outcomes:
- chip damage
- field control
- brief cover
- forced reposition

Why this should stay limited:
- good for variety
- but should not overshadow the monster itself

### 5. Momentum Actions

As the player plays well, they build toward a special once-in-a-while action.

Examples:
- `Surge`
- `Execution Step`
- `Second Wind`

Possible outcomes:
- stronger attack
- burst reposition
- emergency recovery
- temporary pressure swing

Why this is later:
- bigger system footprint
- should come after reactions and interrupts feel stable

## Recommended Implementation Order

### Slice 1: Stronger Telegraph Standard

- keep telegraphs locked to the incoming move until the enemy actually spends it
- improve move wording, counter clarity, and enemy intent readability

### Slice 2: Selective Pressure-Meter Rollout

- apply the pressure meter to standout live encounters only
- current first homes:
  - named duelists
  - tower bosses / sub-bosses
  - authored live quest elites

### Slice 3: Enemy Interrupt Framework

Add an enemy state that can enter a telegraphed action.

Player counter routes:
- correct lane
- correct pouch item
- correct skill timing

Start with:
- one Floor 2 or later standout enemy
- one rank trial or duelist enemy

### Slice 4: Finisher Follow-Ups

When the player creates a true opening, allow a short follow-up action.

Rules:
- should not trigger every round
- should be earned
- should be visually distinct

### Slice 5: Boss Position + Interaction Identity

Make sub-bosses and main bosses combine:
- lane denial
- lane weakness
- one interaction moment

Standing rule:
- normals may use this lightly
- sub-bosses should use it deliberately
- bosses should feel built around it

### Slice 6: Battlefield Events

Add floor-themed battlefield moments only after the core telegraph / pressure / interrupt framework is working.

### Slice 7: Momentum Layer

Only build this if combat still needs a stronger long-fight rhythm after the earlier slices land well.

## UX Rules

### Readability

Prompts must read instantly.

Prefer:
- one or two verbs
- short labels
- clear stakes

Avoid:
- long explanatory buttons
- cluttered prompt stacks
- multiple urgent prompts at once

### Frequency

Interaction moments should feel like highlights, not a constant tax.

Rule of thumb:
- normal enemies: occasional
- sub-bosses: deliberate
- bosses: signature part of the fight

### Outcome Clarity

If a player answers a prompt correctly, the battle log and screen should make that clear.

Examples:
- `You catch the rush and hold the line.`
- `You slip the strike and keep your footing.`
- `The coil breaks before it can close.`

If they fail or ignore it:
- the result should still be understandable

## Art-First Rule

If an interaction moment becomes important enough to pause attention, it should be visually framed like part of the battle scene, not like a plain text alert.

That means:
- strong icon
- clear state color
- minimal text
- art or enemy context still visible behind it

## Sequential TODO

1. Strengthen telegraph wording and counter readability on existing standout fights
2. Extend selective pressure meters only to standout enemies that truly benefit from them
3. Add enemy telegraph/interruption state support without reintroducing reaction-window UI
4. Convert one sub-boss mechanic into an interruptible move
5. Add earned finisher follow-up support
6. Apply one finisher case to a rank trial or Floor 2+ enemy
7. Add boss-facing position + interaction rules as the standard for future bosses
8. Add battlefield interactions only after the above feels stable

## Ongoing Rule

Whenever we add or revise a live combat enemy, especially a sub-boss or boss, review whether it should gain:
- a lane rule
- an interaction moment
- a better telegraph

Do not let higher-rank combat drift back into simple stat-check trading.

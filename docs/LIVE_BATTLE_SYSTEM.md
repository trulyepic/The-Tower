# Live Battle System

This file defines the current shared live turn-based combat standard.

## Purpose

Live combat should not feel like:
- click once
- wait
- read a summary

It should feel like:
- read the enemy
- answer the mechanic
- manage position
- use the right pouch item or skill at the right time
- then review the result

## Current Scope

The shared live combat runtime now applies to:
- tower battles
- live quest battles
- live rank trials

This is no longer a temporary response layer.
It is the current real-time turn-based combat runtime used by the implemented live battle surfaces in the game.

## Core Loop

1. Player enters a live clash.
2. The opponent telegraphs the incoming move.
3. The telegraph stays locked on that move until the opponent actually spends it.
4. The player takes one explicit turn:
   - attack
   - movement
   - guard
   - class skill
   - pouch item
   - interrupt, when a special pressure meter is present on a standout enemy
5. HP, status, and pressure update immediately during the turn flow.
6. Source-specific aftermath resolves after the live battle ends:
   - tower wave/floor outcome
   - live quest outcome
   - rank trial outcome

## Standing Rule

The live-combat standard going forward is:
- art-first enemy presentation
- telegraph-first turn readability
- combat pouch usage instead of pre-committing supplies
- icon-first status/effect language
- selective pressure meters on standout enemies
- stronger identity for named duelists, sub-bosses, and bosses

Do not treat extra interaction UI as the default answer.
If combat needs more excitement, prefer:
- better telegraphs
- stronger enemy identity
- clearer counters
- pressure meters on standout fights

Reference:
- [/Users/kin/web-rpg/docs/COMBAT_INTERACTION_EXPANSION.md](/Users/kin/web-rpg/docs/COMBAT_INTERACTION_EXPANSION.md)

## Player Actions

### Position

- `Front`
- `Mid`
- `Rear`

Position is a real battle choice, not just flavor.

Early intent:
- `Front`
  - better for holding rush/sweep pressure
- `Mid`
  - steadier against arc/shock control
- `Rear`
  - safer against bites, rush-ins, and ambush-style openings

Current rule:
- monsters may define:
  - `advantage positions`
    - attacking from those lanes deals bonus damage
    - this should be surfaced in enemy weakness intel
  - `blocked positions`
    - those movement options must be greyed out in battle
    - the enemy is explicitly preventing that shift, not merely discouraging it
- not every monster needs a positional weakness
- sub-bosses and bosses should use positioning more deliberately than filler enemies

### Guard

- `Guard` is the universal defensive action.
- It is especially useful against:
  - rush
  - sweep
  - heavy line pressure
- It should always log as a defensive choice, not as an attack on the enemy.

### Skills

Skills are self-activations in live battle.
They should not read like direct monster-targeted strikes unless a specific skill is designed that way later.

Loadout presentation rules:
- A selected class skill is not the same thing as an active effect.
- Before battle, do not show a class skill as active unless the effect is actually running.
- In battle, show the full unlocked active skill set that can be used in combat.
- Always-on passives and active sigils/buffs should still be visible in the battle HUD as ongoing combat context.

Current V1 starter skill identity:
- `Iron Will`
  - self-buff
  - starts its cooldown immediately
  - grants a guarded state and steadier turn control
- `Scout Path`
  - self-buff
  - starts its cooldown immediately
  - improves initiative pressure, movement flow, and evasive play
- `Arcane Surge`
  - self-buff
  - starts its cooldown immediately
  - powers up the player's later attacks with stronger damage and crit pressure

### Cooldowns

- Live tower battle uses cooldowns, not a live Focus resource bar.
- A skill on cooldown must show as unavailable in battle.
- If a skill is active, its icon should also appear in the player's status row.
- Starter skill durations currently match their listed cooldown windows so the player sees one clear timer rather than two conflicting ones.

### Pouch Items

Combat items now come from the shared `Combat Pouch`.

Rules:
- pouch items can be used in:
  - tower live combat
  - live quest combat
  - live rank trials
- pouch items are only spent if actually used
- they are not pre-burned at battle start

Examples:
- `Healing Herb`
- `Health Potion`
- `Antitoxin Vial`
- `Guard Tonic`
- `Grounding Tonic`
- `Ward Charm`

### Action Semantics

- `Attack`
  - primary direct damage action
- `Move`
  - changes lane position
  - should not read as direct damage unless a specific movement skill says otherwise
- `Guard`
  - defensive action
  - no direct damage
- `Skill`
  - starter skills are self-activations in V1
  - no direct damage on activation unless a later skill explicitly says it strikes
- `Item`
  - support items used on the player should log as self-use
  - they should not read like they were thrown at the monster unless that item is explicitly offensive

## Status And Effect Rules

- Statuses must show their actual effect in hover/tap text.
- The player should not have to guess what a status is doing.
- If a status stacks, the hover/tap text should reflect the stacked value.
- Status application, expiry, stacking, and clearing should all run through one shared rule layer.
  - do not hand-write separate poison/guard/item-clear logic in different turn branches
  - the same status should behave the same way no matter whether it was applied by:
    - enemy mechanic
    - player skill
    - player item

Current baseline examples:
- `Poisoned`
  - loses HP at the start of the player's turns
- `Shocked`
  - lowers outgoing attack effectiveness
- `Pressured`
  - reduces offensive output while the enemy has the tempo
- `Guarded`
  - reduces incoming damage
- `Iron Will`
  - stronger self-guard state with mitigation and steadier turn control
- `Scout Path`
  - speed/evasion state
- `Arcane Surge`
  - offensive buff for later attacks
- `Steel Rhythm`
  - speed and follow-up pressure buff
- `Bulwark Oath`
  - heavy mitigation and counter-window buff
- `Bloodrush`
  - offense/crit/tempo buff with weaker defense
- `Counter Ready`
  - empowers the next direct attack
- `Frenzied`
  - short Berserker follow-up state after taking damage

- Positive and negative statuses may stack where it makes sense.
- Statuses must carry through the current wave until they expire or are cleared.
- Opponent build effects should be shown as icon-first context where appropriate.
  - duelists and authored named opponents can show base sigil/title/passive effects plus temporary statuses in the live HUD
  - future standout enemies should follow the same icon-first rule instead of collapsing back to plain text summaries
- Warrior path passives are not just flat background bonuses.
  - `Combat Discipline` improves guard and steadiness
  - `Shield Doctrine` improves guard and counter punishment
  - `Frenzy Instinct` improves wounded-target pressure and momentum gain

## Floor 1 Mechanic Mapping

- `Poison Bite`
  - answer with `Antitoxin Vial`
  - or safer rear positioning
- `Pack Rush`
  - answer with `Guard`
  - or a Warrior response
- `Burrow Ambush`
  - answer with rear repositioning
  - or a clean intel read
- `Fortress Bulwark`
  - answer with repeated pressure or a Mage control response
- `Crushing Sweep`
  - answer with `Guard Tonic`
  - or `Guard`
- `Arc Overcharge`
  - answer with `Grounding Tonic`
  - or a Mage response
- `Spark Field`
  - answer with `Ward Charm`
  - or steadier mid-lane control

## Intel Rule

- The live battle screen should not tell the player the correct answer.
- If the player bought intel or learned the enemy elsewhere, that knowledge should come from:
  - the dossier
  - store intel
  - past encounters
- Wrong reads should carry consequences:
  - damage
  - status effects
  - reduced damage
  - enemy holding the lane longer

## Shared Core, Source-Specific Resolution

The live battle runtime is shared across:
- tower
- live quest
- rank trial

The aftermath is intentionally source-specific.

Standing rule:
- keep one shared combat core
- keep mode-specific result handling after combat ends

That means:
- tower owns wave and floor outcome logic
- live quests own quest outcome logic
- rank trials own promotion and examiner outcome logic

## Result Presentation Rules

- The live battle log should record both:
  - active actions
  - passive effects
- That includes:
  - skill activations
  - support item use
  - poison ticks
  - status gains
  - status clears
  - enemy mechanics landing

- The battle review should show:
  - player state
  - enemy state
  - which mechanics were answered cleanly
  - which enemies were left standing
- Do not keep a separate animated battle replay layer in the post-battle modal.
  - the live battle itself is the interaction layer
  - the result modal is for clean aftermath review
- On failure:
  - do not jump straight to `The Tower Casts You Out`
  - the player must first review the failed clash
  - then confirm before the cast-out message appears

## Carry-Over Rules

- Player status effects must carry through the rest of the current wave until they expire or are cleared.
- Those statuses are not cosmetic.
  - they must affect the player's real battle performance
  - example: poison should keep hurting, shock should disrupt, pressure should drag on damage or tempo
- When one enemy is defeated, do not instantly snap to the next target without acknowledgement.
  - show the defeated enemy as downed
  - log the kill
  - then let the player advance into the next enemy in the same wave

## Roadmap

### V1

- [x] Floor 1 live telegraph/response layer
- [x] Position, brace, skill, and counter-item response inputs
- [x] Existing tower resolver reads those responses
- [x] Starter skills reworked as self-buffs with cooldown handling

### V2

- [ ] Expand the live response layer to `Floor 2`
- [ ] Add richer timing windows and misplay penalties
- [ ] Show enemy cast bars more explicitly
- [ ] Add stronger class-specific response text

### V3

- [ ] Seals affect live battle windows and mechanic answers
- [ ] Engravings alter weapon-bound battle behavior
- [ ] Boss fights gain multi-step mechanic chains

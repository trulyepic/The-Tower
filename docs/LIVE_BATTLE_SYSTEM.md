# Live Battle System

This file defines the first interactive tower battle layer.

## Purpose

Tower combat should not feel like:
- click once
- wait
- read a summary

It should feel like:
- read the enemy
- answer the mechanic
- manage position
- commit the right item or skill at the right time
- then review the result

## V1 Scope

V1 applies to:
- `Floor 1`
- tower wave battles only

V1 does not replace the whole combat engine.
It adds an interactive response layer before the existing wave resolver finalizes the outcome.

## Core Loop

1. Player enters a live clash.
2. Enemy telegraphs a mechanic.
3. The player takes one explicit turn:
   - attack
   - movement
   - brace
   - class skill
   - committed item
   - let the mechanic through
4. HP and damage update immediately during the turn flow.
5. The resolver uses those answers when calculating:
   - counters
   - incoming damage
   - enemy pressure
6. The player reviews the battle result afterward.

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

### Brace

- `Brace` is the universal defensive action.
- It is especially useful against:
  - rush
  - sweep
  - heavy line pressure
- `Brace` is not a damage action.
- It should log as a defensive choice, not as an attack on the enemy.

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

### Items

Committed counter items can now be used as live mechanic answers.

Floor 1 examples:
- `Antitoxin Vial`
- `Torch`
- `Lockpick`
- `Guard Tonic`
- `Grounding Tonic`
- `Ward Charm`

### Action Semantics

- `Attack`
  - primary direct damage action
- `Move`
  - changes lane position
  - should not read as direct damage unless a specific movement skill says otherwise
- `Brace`
  - defensive action
  - no direct damage
- `Skill`
  - starter skills are self-activations in V1
  - no direct damage on activation unless a later skill explicitly says it strikes
- `Item`
  - support items used on the player should log as self-use
  - they should not read like they were thrown at the monster unless that item is explicitly offensive

## Status Rules

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
- Warrior path passives are not just flat background bonuses.
  - `Combat Discipline` improves guard and steadiness
  - `Shield Doctrine` improves guard and counter punishment
  - `Frenzy Instinct` improves wounded-target pressure and momentum gain

## Floor 1 Mechanic Mapping

- `Poison Bite`
  - answer with `Antitoxin Vial`
  - or safer rear positioning
- `Pack Rush`
  - answer with `Brace`
  - or a Warrior response
- `Burrow Ambush`
  - answer with `Torch`
  - or rear repositioning
- `Fortress Bulwark`
  - answer with `Lockpick`
  - or a Mage control response
- `Crushing Sweep`
  - answer with `Guard Tonic`
  - or `Brace`
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

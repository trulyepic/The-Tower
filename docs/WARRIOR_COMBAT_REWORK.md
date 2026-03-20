# Warrior Combat Rework

## Status

- Shared Warrior, Knight, and Berserker battle identities are now partially implemented.
- The live battle system now supports:
  - distinct Warrior/Knight/Berserker active-skill effects
  - distinct passive battle modifiers
  - counter-ready windows
  - wounded-target pressure
  - frenzy momentum on Berserker
- Path choice remains locked at Level 15.

## Implemented In This Pass

### Shared Warrior

- `Iron Will`
  - live mitigation buff
  - steadier turn control
  - status severity reduction
- `Combat Discipline`
  - passive guard bonus
  - passive attack consistency floor
  - passive pressure resistance
- `Steel Rhythm`
  - tempo/self-buff
  - speed gain
  - counter follow-up bonus

### Knight

- `Bulwark Oath`
  - heavy mitigation buff
  - stronger resistance to heavy mechanics
  - guarded enemy hits can create `Counter Ready`
- `Shield Doctrine`
  - passive guard improvement
  - passive counter damage bonus
  - passive status severity reduction

### Berserker

- `Bloodrush`
  - offensive self-buff
  - extra attack / crit / speed pressure
  - reduced safety while active
- `Frenzy Instinct`
  - extra damage against wounded targets
  - crits and kills feed tempo
  - taking damage can trigger a short `Frenzied` state

## Problem

The current Warrior path board mixes two different ideas:

- when a branch skill belongs in the progression roadmap
- when the player is actually allowed to choose that branch

That makes `Bulwark Oath` showing `Lv 8` feel misleading when the player cannot actually choose `Knight` until `Level 15`.

The current Warrior / Knight / Berserker combat kits also do not feel distinct enough in the turn-based battle system. Their identities need to be sharper.

## UI Direction

### Skill Tree Structure

The Warrior skill board should be split into two clear sections:

1. Shared Warrior Skills
2. Specialization Branches

### Shared Warrior Skills

This section should mean:

- these skills are available to every Warrior
- these unlock by level normally
- if not greyed out, the player can use them immediately

Current shared nodes:

- `Lv 1` `Iron Will`
- `Lv 4` `Combat Discipline`
- `Lv 12` `Steel Rhythm`

This shared section should explicitly include both:

- shared active skills
- shared passive abilities

### Specialization Branches

This section should mean:

- these are future branch rewards
- they remain greyed out until specialization is chosen at `Level 15`
- the player can inspect them early, but cannot use them yet

Branch layout:

- `Knight`
  - `Bulwark Oath`
  - `Shield Doctrine`
- `Berserker`
  - `Bloodrush`
  - `Frenzy Instinct`

This specialization section should explicitly include both:

- Knight-specific active and passive abilities
- Berserker-specific active and passive abilities

### What `Lv 8` Means On Branch Skills

`Lv 8` on a branch skill should no longer read like "you can take this now."

It should mean:

- this is the earliest tier of that branch's internal progression
- once the player chooses that branch at `Level 15`, this node is granted immediately if their level already satisfies it

So in practice:

- before `Level 15`, branch nodes are preview-only
- at `Level 15`, the player chooses `Knight` or `Berserker`
- after the choice:
  - the `Lv 8` branch skill unlocks immediately
  - the `Lv 12` branch passive unlocks immediately if the player is already 12+

### Tree Presentation Rules

- Put `Shared Warrior Skills` as a section header above the shared line
- Put `Knight Specialization` and `Berserker Specialization` as headers above the branch lanes
- Branch headers should sit outside the branch boxes
- Skill names should sit inside the boxes
- Locked specialization skills should be heavily greyed out before `Level 15`
- Locked specialization copy should be explicit:
  - `Specialization locked until Level 15`
- Shared skills should never look like preview-only content

## Combat Identity Goals

### Shared Warrior Identity

Shared Warrior should feel like:

- stable
- disciplined
- tempo-aware
- built around holding turns together under pressure

Shared Warrior is not yet fully tank or fully berserker.
It should teach the baseline Warrior loop:

- survive pressure
- guard correctly
- keep turn control
- strike when the line opens

### Knight Identity

Knight should feel like:

- anchored
- protective
- reactive
- punish-heavy after enemy commitment

Knight should excel at:

- guarding
- reducing heavy damage
- resisting control/status pressure
- counter windows
- boss mechanics

Knight should not feel like:

- burst damage
- reckless speed spam

### Berserker Identity

Berserker should feel like:

- violent
- tempo-breaking
- high-risk high-reward
- pressure-forward

Berserker should excel at:

- extra turns through momentum
- stronger crit pressure
- finishing low-health enemies
- turning damage taken into offensive advantage

Berserker should not feel like:

- safe defense
- reliable mitigation

## Proposed Reworked Kits

### Shared Warrior

#### Iron Will

Role:

- self-buff
- defense and turn stability

In the turn-based system:

- activate on self
- reduce incoming damage for a short duration
- reduce enemy stagger/control pressure
- slightly improve initiative stability

Player-facing feel:

- "I hold my ground and stop the fight from slipping away."

#### Combat Discipline

Role:

- passive baseline stability

In the turn-based system:

- small permanent boost to guard efficiency
- small boost to accuracy/consistency of normal attacks
- light resistance to pressure effects

Player-facing feel:

- "My fundamentals are better than most."

Passive category:

- shared passive

#### Steel Rhythm

Role:

- shared advanced Warrior tempo skill

In the turn-based system:

- self-buff
- increases initiative gain for a few turns
- improves follow-up after a successful guard or counter
- helps chain one extra player turn when momentum favors Warrior

Player-facing feel:

- "I control the pace of the exchange."

### Knight

#### Bulwark Oath

Role:

- signature Knight active skill

In the turn-based system:

- self-buff
- large mitigation increase
- strong resistance to heavy boss mechanics
- if the enemy attacks into Bulwark, the Knight gains a counter-ready state

Player-facing feel:

- "Hit me if you dare. I will survive it and answer."

#### Shield Doctrine

Role:

- Knight passive

In the turn-based system:

- improves guard value
- improves counter damage after successful guard
- lowers status severity from enemy mechanic hits

Player-facing feel:

- "Defense is now a weapon."

Passive category:

- Knight-specific passive

### Berserker

#### Bloodrush

Role:

- signature Berserker active skill

In the turn-based system:

- self-buff
- increases attack and crit pressure
- increases chance of gaining sequential turns
- slightly lowers defense while active

Player-facing feel:

- "I push the fight faster and riskier until something breaks."

#### Frenzy Instinct

Role:

- Berserker passive

In the turn-based system:

- increased damage against wounded enemies
- increased initiative gain after crits or kills
- may gain a short aggressive follow-up state after taking damage

Player-facing feel:

- "The closer the fight gets to the edge, the stronger I become."

Passive category:

- Berserker-specific passive

## Turn-Based Combat Rules To Support The Kits

### Shared Requirements

The battle system should support these distinctions directly:

- mitigation matters
- initiative matters
- status resistance matters
- follow-up states matter
- kill pressure matters

### Knight-Specific Support

Needed systems:

- successful guard state
- counter-ready state
- heavy mechanic resistance
- reduced status severity

### Berserker-Specific Support

Needed systems:

- sequential turn gain
- wounded-target bonus
- crit momentum
- risky self-buff tradeoff

## Proposed Status Vocabulary

Use clearer statuses tied to these kits:

### Shared Warrior

- `Iron Will`
- `Disciplined`
- `Rhythm`

### Knight

- `Bulwark`
- `Counter Ready`
- `Shield Doctrine`

### Berserker

- `Bloodrush`
- `Frenzied`
- `Execution Window`

These should all have hover text that explains exact gameplay impact.

## Recommended Next Implementation Order

1. Rework the Warrior path board UI
2. Rework shared Warrior active and passive abilities for the turn-based system
3. Rework Knight active and passive kit
4. Rework Berserker active and passive kit
5. Tune status names, icons, hover text, and passive summaries

## First UI Implementation Plan

When we start implementation, the first step should be:

1. split the current Warrior path board into:
   - `Shared Warrior Skills`
   - `Specialization Branches`
2. mark branch skills as:
   - `Preview`
   - `Specialization locked until Level 15`
3. visually distinguish passive nodes from active skill nodes in both sections
4. ensure the player can immediately tell which passive nodes are:
   - shared
   - Knight-only
   - Berserker-only
5. make it visually obvious that:
   - non-grey shared skills are usable now
   - grey branch skills are future content until specialization

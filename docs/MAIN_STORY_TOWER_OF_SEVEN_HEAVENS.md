# Main Story: Tower Of Seven Heavens

Status: Canon story direction selected.

Use this file as the narrative source of truth for main-story implementation (Floors 1-50), NPC arcs, side quests, and branching endings.

## Premise

The world is layered into Seven Heavens, each bound by one ancient seal.  
At the center stands the Axis Tower, a divine engine and prison that holds Azharel, a fallen star-god.

Every millennium the seals weaken. This cycle is worse: the tower is rewriting reality.  
Lost cities phase in and out, dead heroes return as echoes, and constellations fall as monsters.

The player bears the Star Wound, a mark that allows safe ascent.  
The climb is not only combat; each floor asks for a moral choice that reshapes the world.

## Main Story Goal

- Main story ends at Floor 50 (Astral Crown confrontation).
- Floors 51+ continue as post-main-story Ascendant content with higher difficulty and expanded systems.

## Branching Endings (3)

Story values are hidden and driven by quest decisions + NPC interactions:

- `Grace`: mercy, rescue, redemption
- `Dominion`: order, law, sacrifice-for-stability
- `Ruin`: forbidden power, freedom through destruction

Endings:

1. Radiant Rebirth (`Grace` dominant)
2. Crown of Chains (`Dominion` dominant)
3. Starfall Sovereign (`Ruin` dominant)

## Arc Map (Floor Bands)

### Arc I - Heaven Of Embers (Floors 1-10)

- Theme: survival, guild trust, first alliances.
- Story beat:
  - Tower awakening becomes undeniable.
  - First faction pressure appears.
  - Floor 10 introduces an almost-lethal boss mechanic and ally dependency.

### Arc II - Heaven Of Mirrors (Floors 11-20)

- Theme: truth vs illusion.
- Story beat:
  - NPC motives become uncertain.
  - Tower records reveal conflicting origin myths.
  - Player choices begin locking major relationship routes.

### Arc III - Heaven Of Ruin (Floors 21-30)

- Theme: fallen kingdoms, war relics, class identity pressure.
- Story beat:
  - Class-path ideology (Knight/Berserker etc.) influences major quest outcomes.
  - Companion loyalty checks begin.

### Arc IV - Heaven Of Thrones (Floors 31-40)

- Theme: power blocs and system control.
- Story beat:
  - Three macro factions push the player:
    - Choir of Law
    - Abyssal Court
    - Nameless Path
  - Key side-quest outcomes begin changing Floor 41-50 scenes.

### Arc V - Heaven Of Judgment (Floors 41-50)

- Theme: final cosmological choice.
- Story beat:
  - Origin truth of Azharel revealed.
  - Player decides whether to heal, seal, or claim the system.
  - Ending decided by value totals + critical NPC outcomes.

## Floor Progression Blueprint (1-50)

Use this as implementation pacing guidance. Each row represents one 5-floor block.

1. Floors 1-5: tutorial ascent, guild grounding, basic faction hints.
2. Floors 6-10: ally dependency introduced, first major boss trial.
3. Floors 11-15: mirror quests, identity/loyalty tension starts.
4. Floors 16-20: first major betrayal branch and trust consequence.
5. Floors 21-25: ruin-war content, relic economy starts mattering.
6. Floors 26-30: class-path conflict escalates, companion outcomes diverge.
7. Floors 31-35: throne politics, faction contracts and sanctions.
8. Floors 36-40: high-stakes civic choices, pre-ending alignment lock-in.
9. Floors 41-45: crown ascent, irreversible route commitments.
10. Floors 46-50: final judgment chain and one of 3 endings.

## Core NPC Story Threads

### Aldric Vale (priority existing thread)

- Role: early ally, emotionally grounded questline.
- Trigger: early NPC rescue chain already started in-game.
- Floor 10 critical mechanic:
  - Aldric ally skill: `Oathguard Intercession`
  - Effect: negates ~90% of one near-lethal main-boss strike on Floor 10.
  - If Aldric is unavailable, player can still survive using an ultra-rare substitute item.

Implementation notes:

- This is a major "ally value" tutorial for the full story.
- Make the intervention readable in battle log and post-fight summary.
- If consumed/triggered, show exactly what damage was prevented.

### Path Guide NPC (Level 15)

- Role: specialization narrative gate (Knight/Berserker final lock).
- Current status: placeholder NPC card exists; full questline pending.

### Future NPC Slots

- Add additional NPCs in same license-card pattern.
- Each new NPC should have:
  - relationship state,
  - side-quest chain,
  - one tower-mechanic influence (direct or indirect).

## Side Quest Framework (Epic + System-Relevant)

Each side quest should do at least one:
- affect hidden ending values (`Grace`/`Dominion`/`Ruin`),
- unlock/strengthen ally interventions,
- grant tower-counter tools or unique progression resources.

Planned side quest lines:

1. `Aldric: Ashbound Oath` (Floors 2-12)
  - Rescue arc, trust checks, Floor 10 intercession unlock.
2. `Seraphine: Tenth Circle Debt` (Floors 8-22)
  - Death/revival ethics, resource-for-life tradeoffs.
3. `The Mirror Orphan` (Floors 13-24)
  - Choice between truth exposure vs stability.
4. `The Silent Legion` (Floors 20-35)
  - War relic chain tied to class ideology.
5. `Crownless Choir` (Floors 32-45)
  - Faction allegiance line, strong impact on final scenes.

## Rare Substitute Item (Aldric Alternative)

Design note (intentional scarcity):

- Add one extremely rare item that can replace Aldric's Floor 10 save effect.
- It must not be easy to buy or farm.
- Recommended source model:
  - very low-rate tower drop and/or one-time high-risk side quest reward.

This keeps Aldric meaningful while preserving player agency.

## Decision Flags To Track In Code

Minimum story state keys to add over time:

- `storyValues.grace`
- `storyValues.dominion`
- `storyValues.ruin`
- `npcState.aldric.relation`
- `npcState.aldric.intercessionUnlocked`
- `npcState.pathGuide.specializationStarted`
- `endingLock.route` (set during Arc V)

## Implementation Tracker

### Story System

- [ ] Add persistent story value counters (`Grace`, `Dominion`, `Ruin`)
- [ ] Add story-value reward hooks to quests/NPC decisions
- [ ] Add ending lock evaluation helper (Floor 50)

### Aldric Priority

- [ ] Implement `Oathguard Intercession` Floor 10 trigger logic
- [ ] Show intervention in encounter log + summary
- [ ] Add ultra-rare substitute item and source path
- [ ] Tune damage prevention to ~90% of target lethal strike

### Main Story Content

- [ ] Write Floor 1-10 quest scenes and key dialogue beats
- [ ] Write Floor 11-20 scene pack
- [ ] Write Floor 21-30 scene pack
- [ ] Write Floor 31-40 scene pack
- [ ] Write Floor 41-50 ending scene pack

### Endings

- [ ] Implement Radiant Rebirth route checks
- [ ] Implement Crown of Chains route checks
- [ ] Implement Starfall Sovereign route checks
- [ ] Add post-ending state handoff to Floor 51+ mode


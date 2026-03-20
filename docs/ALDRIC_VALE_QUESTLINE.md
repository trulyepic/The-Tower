# Aldric Vale Questline

## Identity

- Name:
  - `Aldric Vale`
- Role:
  - early emotionally grounded side-story NPC
  - one of the player's most important long-range consequence relationships
- Core function:
  - teaches that refusing, delaying, or honoring a plea can reshape an entire life and echo across the climb

## Arc Summary

Aldric's story begins as a rescue plea, but it becomes a long-form consequence thread that can turn him into one of three things:
- one of the player's most loyal followers
- a damaged but conflicted anti-ally
- a long-range saboteur and future boss confrontation

This is one of the key questlines that should teach the player that early guild choices are not disposable.

## Core Trigger

- Aldric pleads with the player to help save his daughter from a bandit leader.
- The mission is time-sensitive.
- This time pressure should be visible and understandable to the player.
- The time-sensitive structure should become a template for future quests.
- accepting Aldric's plea starts the real rescue window immediately
- taking the quest from the board should then launch a short special rescue encounter rather than a normal long background quest timer

## Special Quest Structure

- `Accept Request`
  - starts the rescue deadline immediately
  - this is the real "too late" clock
- `Take This Quest`
  - starts a short special encounter that resolves in a few seconds
  - it should not behave like a normal passive quest timer
- encounter structure:
  - Wave 1: bandit lackeys
  - Wave 2: the bandit leader
- each bandit unit should have health and wave presentation similar to the tower combat format
- the result should be reported through:
  - the special quest encounter flow
  - the normal quest result reporting layer

## Branch Structure

### Branch A: Player Refuses Aldric's Plea

#### Immediate Outcome
- Aldric tries to save his daughter himself.
- He fails.
- His daughter is violated and murdered by the bandit leader.
- Aldric is badly wounded but survives.
- He can no longer remain a successful adventurer.

#### Aldric's Emotional State
- he blames the bandit leader
- he also blames the player
- he sees the player as someone who could have helped but refused

#### Long-Term Path
- Aldric swears vengeance against both the player and the bandit leader.
- He is consumed by grief and hatred.
- He is drawn into a dark faction.
- He studies forbidden arts.
- He acquires a terrible forbidden weapon.
- Throughout the player's climb, he appears at different points to sabotage the player and make the ascent more difficult.

#### Redemption Edge Case
- if the player later kills the bandit leader on their own, without having saved Aldric's daughter
- this does not erase Aldric's hatred
- however, it should open at least a limited redemption path during some of Aldric's later encounters
- in those moments, Aldric may give the player a chance to redeem themselves in his eyes
- this should not fully replace the weight of the refusal branch, but it should matter

#### Major Confrontation
- the player confronts Aldric on `Floor 30`
- this becomes a major battle
- the player determines Aldric's final fate
- that outcome affects the ending

### Branch B: Player Accepts, But Lets The Quest Time Out

#### Immediate Outcome
- the daughter still dies
- Aldric is devastated
- however, he is more understanding because the player at least accepted the plea

#### Long-Term Path
- Aldric still vows vengeance against the bandit leader
- he still descends into the dark path
- he still engages with forbidden power
- however, he does not become a pure anti-player saboteur

#### Relationship Effect
- he gives the player information about these dark groups
- he occasionally helps the player
- his presence remains tragic and unstable rather than purely hostile
- this route also affects the ending

### Branch C: Player Accepts And Saves The Daughter

#### Immediate Outcome
- Aldric's daughter lives
- Aldric's loyalty to the player becomes one of the strongest early relationship anchors in the game

#### Long-Term Path
- Aldric becomes one of the player's most loyal followers
- he helps the player through the climb
- he grows with the player over time
- he should remain relevant well beyond the rescue itself

#### Story Value
- this is the positive proof that compassion and follow-through can build enduring strength
- Aldric should feel like a major earned companion-tier relationship on this route

## Floor 30 Resolution

Floor 30 is the decisive Aldric confrontation point for the hostile route.
This meeting should carry the full accumulated weight of:
- the original plea
- whether the player refused or delayed
- how far Aldric fell
- how much the player's broader moral direction shaped the outcome

## Affinity Lock Rules

This is not only for Aldric. It should be part of the broader affinity system across the game.
Aldric is one of the first major places where the system becomes sharply visible.

### Extreme Evil Affinity
- if the player's affinity is `90% to 100% evil`
- the only choice at Aldric's final confrontation is:
  - `Kill Aldric`

### Extreme Good Affinity
- if the player's affinity is `90% to 100% good`
- the only choice at Aldric's final confrontation is:
  - `Let Aldric live`

### Mixed / Non-Extreme Affinity
- if the player is not at an extreme
- multiple choices remain available

## System Requirements

Aldric's full questline depends on these systems being tracked and respected:
- time-sensitive quest expiration
- long-range recurring NPC branch state
- hostile recurring encounter state
- allied recurring support state
- forbidden-faction association state
- forbidden-weapon progression state
- affinity-based choice restriction
- ending influence flags

## Runtime Flags To Track

Minimum long-form flags Aldric will likely need:
- `aldricQuestAccepted`
- `aldricQuestCompleted`
- `aldricQuestExpired`
- `aldricDaughterSaved`
- `aldricDaughterDead`
- `aldricHostilePath`
- `aldricDarkFactionJoined`
- `aldricForbiddenArtsStarted`
- `aldricForbiddenWeaponAcquired`
- `aldricOccasionalAidUnlocked`
- `aldricSabotageState`
- `aldricFloor30Resolved`
- `aldricFate`
- `aldricEndingWeight`

## Ending Weight

Aldric is a major ending-influence NPC.
His route should affect:
- what kind of person the player became to those who asked for help
- how many allies still stand with the player
- what grief, mercy, or violence the player normalized through the climb
- how the ending judges the player's path

## Implementation Status

### Current In-Game State
- Aldric exists as an early guild-side side quest thread.
- Early-state flow is now partially implemented with branch persistence:
  - accepted -> saved route tracked
  - accepted but failed / too late -> tragic route tracked
  - refused -> hostile path seed tracked
- Later recurring sabotage, dark-faction escalation, and Floor 30 confrontation remain future implementation work.

## Implementation Order

### Slice 1: Early-State Branch Persistence
- status:
  - `Done`
- includes:
  - accepted -> saved route tracked
  - accepted but failed / too late route tracked
  - refused route tracked
  - Guild NPC Hall and Side Quest journal reflect those states

### Slice 2: Urgency + First Dark Breadcrumb
- status:
  - `In Progress`
- includes:
  - stronger visual urgency for the time-sensitive rescue
  - clearer Side Quest language around the timer risk
  - first dark-path breadcrumb after refusal or too-late outcome
  - first Watchtrail Butcher placeholder on the Quest Board after daughter-loss routes

### Slice 3: Recurring Mid-Climb Consequences
- status:
  - `Later`
- includes:
  - first recurring sabotage/help encounter
  - dark-faction association reveal
  - forbidden-arts growth markers

### Slice 4: Floor 30 Confrontation
- status:
  - `Later`
- includes:
  - hostile-route battle
  - affinity-based final choice restriction
  - ending-weight resolution

### Current Canon Status
- the full branch structure above is now locked in as story direction
- future implementation should follow this doc as the source for Aldric's arc

## Design Notes

- Aldric should never feel like a disposable early NPC.
- His route is supposed to echo upward through the tower.
- His decline should be painful, avoid cartoon-villain writing, and preserve the fact that the player's early choice mattered.
- His loyal route should feel equally meaningful and should not collapse into a minor reward branch.

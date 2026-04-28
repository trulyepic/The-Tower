# Floor 2: Thorn Corridor

Status: Active implementation guide for the first post-F-rank tower chapter.

This file is the source of truth for how `Floor 2: Thorn Corridor (The First Snare)` should feel,
what it teaches, and how quests/rewards should support it.

Progression reference:
- `docs/FLOOR_PROGRESSION.md`

## Floor Identity

- Floor Number: `2`
- Floor Name: `Thorn Corridor`
- Subtitle: `The First Snare`
- Intended Gate:
  - `Soft recommendation: Adventurer Rank E`
  - `Soft recommendation: Level 5`

## Story Purpose

Floor 2 is where the Tower stops feeling like a dangerous ruin and starts feeling intelligent.
It teaches the player that some floors are built to control tempo, trap movement, and bleed a climber
out over time instead of simply crushing them with raw damage.

If Floor 1 says:
- `survive the threshold`

Then Floor 2 says:
- `survive while being pinned in place`

## Main Story Function

This floor should mark the transition from:
- novice guild survival

into:
- the first deliberate ascent that expects rank discipline, proper preparation, and adaptation

The player should feel that:
- the guild was right to make them earn E-rank before pushing deeper
- entering unprepared is possible, but foolish
- the Tower is now testing control, attrition, and recovery denial

## Core Gameplay Lesson

Thorn Corridor is about:
- bleed pressure
- snares and drag mechanics
- longer exchanges
- suppressed recovery windows

The floor should push the player to think in terms of:
- `countering specific mechanics`
- `bringing enough healing to survive extended pressure`
- `recognizing that one floor can demand a different kind of preparation than the last`

Roster rule for this floor and future floors:
- normal enemies may reuse status families or pressure patterns in moderation
- sub-bosses and main bosses should feel unique to the floor
- later floor bosses should increasingly draw from biblical or biblical-adjacent fantasy imagery rather than reading like generic corridor creatures

## Enemy Identity

### Normal Wave

#### Thorn Viper
- role: bind-first opener with poison support
- teaches:
  - poison can support a floor without defining the whole floor
  - movement control consequences
  - salve use under longer pressure

Mechanics:
- `Venom Thorn`
- `Coil Snare`

#### Needle Imp
- role: attrition harrier
- teaches:
  - chip damage matters
  - poor visibility makes repeated enemy pressure worse

Mechanics:
- `Needle Volley`
- `Flash Skitter`

### Sub-Boss

#### Scourge Seraph
- role: corridor executioner
- teaches:
  - single mistakes become serious when drag + bleed stack together
  - Floor 2 sub-bosses should feel more mythic than the normal roster

Mechanics:
- `Seven-Lash Penance`
- `Cincture Drag`

### Main Boss

#### Briar Ophanim
- role: floor identity boss
- teaches:
  - the floor itself can support the boss
  - recovery denial is as dangerous as direct damage
  - a main boss can feel like a tower myth, not just a larger plant creature

Mechanics:
- `Wheel of Briars`
- `Many-Eyed Verdict`

## Recommended Supplies

Floor 2 should reinforce the idea that the player chooses their approach, but the floor still strongly
suggests what works well.

Recommended baseline:
- `Healing Herb x3`
- `Rope x1`
- `Torch x1`
- `Thorn Salve x2`
- `Guard Tonic x1`

Reasoning:
- `Healing Herb`
  - attrition floor; players need visible recovery support
- `Rope`
  - answers snare / drag logic
- `Torch`
  - stabilizes visibility and imp pressure
- `Thorn Salve`
  - the defining floor counter supply
- `Guard Tonic`
  - helps blunt repeated chip or control pressure

## Support Loop

Floor 2 is supported by early E-rank board work.

### Board Quests

#### Harvest Briar Resin
- purpose:
  - introduce the new thorn material family
  - give a practical loop into `Thorn Salve`

#### Cut Down Thorn Nest
- purpose:
  - danger-focused support quest
  - teaches the player that Floor 2 prep itself is already more demanding than Floor 1 prep

### Floor 2 Story Contact

#### Tamsin Vale
- title:
  - `Thorn Runner`
- role:
  - corridor salvage scout
  - recovers snagged satchels, cut route-lines, and abandoned climb records from thorn lanes
- first function:
  - becomes available through the guild once the player has truly cleared Floor 1 and started living in Floor 2's shadow
  - posts a special Quest Board contract instead of interrupting the climb directly
  - first guild interaction asks what kind of runner you are before she fully trusts you with thorn-lane work
- tone:
  - practical
  - tired
  - unimpressed by bravado
  - respects preparation over speeches

#### First Tamsin Branch
- `I'll bring it back clean`
  - Tamsin reads the player as steady and professional
  - improves disposition
  - points back to the Quest Board as proper corridor work
- `Just mark the pay`
  - Tamsin still offers the contract
  - lowers disposition
  - establishes a colder read without hard-locking the thread

#### First Tamsin Quest
- `Tamsin's Snagline Recovery`
- purpose:
  - make Floor 2 feel connected to the living guild world
  - reinforce rope / torch / thorn-salve preparation
  - offer an alternate `Floor 2` intel unlock path through board work
- follow-up:
  - after the board clear, the player returns to Tamsin once in the NPC Hall
  - Tamsin reviews what the recovered satchel and broken snagline revealed about the lane
  - this closes the thread cleanly instead of leaving the NPC state inert

## Item Family

### Briar Resin
- role:
  - floor-specific material
  - signals the transition into environment-specific prep

### Thorn Salve
- role:
  - key Floor 2 counter supply
  - should remain relevant whenever bleed / thorn / bind mechanics return later

## Reward Direction

Floor 2 rewards should feel like:
- the first real step up from novice gearing
- a stronger statement of class identity

### Guaranteed Identity Drops
- `Thorn Viper Fang`
- `Needle Imp Quill`
- `Scourge Hook`
- `Ophanim Core`

### Bonus Reward Goals
- `Briar Resin`
- `Thorn Salve`
- recovery restocks
- one visible sigil step
- early Sealcraft ingredients
- one rare class weapon chase step

### Rare Weapon Targets
- Warrior: `Briarcleaver`
- Ranger: `Thornline Spear`
- Mage: `Rootglass Staff`

### Sigil Step
- `Thornward Seal`
- role:
  - first real Floor 2 sigil reward
  - low-rate drop, not common floor filler
  - defense-first and tied directly to Thorn Corridor identity
  - feels meaningfully better than pure novice supplies without turning early floors into a sigil shower

### Future System Hook
- Floor 2 should be the first place where remnants start clearly supporting:
  - `Seals` for Sigils
  - `Engravings` for weapons
- The floor does not need the full systems implemented yet, but its drops and board-quest support should already be planned with those layers in mind.

## UX Rule

Players should understand Floor 2 as:
- more dangerous than Floor 1
- more deliberate than Floor 1
- not a random spike, but a floor with a clear identity

That means the UI should keep reinforcing:
- this is `Floor 2`
- this floor recommends `Rank E`
- this floor specializes in thorn / bind / attrition pressure

## Current Implementation Checklist

- [x] Floor definition exists in runtime data
- [x] Enemy roster exists
- [x] Floor-specific material family exists
- [x] Support quests exist
- [x] Store support exists for `Thorn Salve`
- [x] Rare class weapon targets exist
- [x] Floor lore exists
- [x] Floor 2-specific main-quest chapter text now points back to Tamsin once the player has a real corridor report to file
- [x] Added one Floor 2-specific title reward step through first clear recognition
- [x] Added Floor 2-specific NPC/story interaction through Tamsin's first Thorn Corridor report
- [x] Added a later Floor 2 NPC/story warning through Tamsin after the sub-boss lane is broken
- [x] Added an in-tower Tamsin route-mark encounter after the Floor 2 sub-boss clear
- [x] Added a post-Floor-2-clear Tamsin aftermath step so Thorn Corridor closes as a real chapter in the guild world

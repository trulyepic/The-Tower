# Floor-Local World Rework

Status: active design spine for moving the game away from a global quest-board loop and toward floor-local progression.

Use this file when changing:
- tower floor flow
- guild placement and services
- quest sourcing and floor support loops
- NPC placement by floor
- the relationship between floor progression and resource farming

Use this with:
- [/Users/kin/web-rpg/docs/FLOOR_PROGRESSION.md](/Users/kin/web-rpg/docs/FLOOR_PROGRESSION.md)
- [/Users/kin/web-rpg/docs/TOWER_BATTLE_PHASES.md](/Users/kin/web-rpg/docs/TOWER_BATTLE_PHASES.md)
- [/Users/kin/web-rpg/docs/QUEST_SYSTEM_REWORK.md](/Users/kin/web-rpg/docs/QUEST_SYSTEM_REWORK.md)
- [/Users/kin/web-rpg/docs/FLOOR_HUB_UI_TODO.md](/Users/kin/web-rpg/docs/FLOOR_HUB_UI_TODO.md)
- [/Users/kin/web-rpg/docs/SEQUENTIAL_CONTENT_PLAN.md](/Users/kin/web-rpg/docs/SEQUENTIAL_CONTENT_PLAN.md)
- [/Users/kin/web-rpg/docs/ROADMAP.md](/Users/kin/web-rpg/docs/ROADMAP.md)

## Purpose

The current game still carries a split structure:
- the Tower is where advancement happens
- the Guild Quest Board is where much of the farming and support loop lives

That split was useful for getting systems playable, but it is not the right long-term shape.

The new direction is:
- the Guild lives on `Floor 1`
- every floor should feel like a place, not only a combat lane
- quests should belong to floors and local situations, not to one detached board screen
- advancing to the next floor still comes from conquering the floor's major battle

This turns the Tower from:
- `prep elsewhere, then clear a floor`

into:
- `arrive at a floor, learn its local loop, do as much or as little side work as you want, then challenge its gate battle`

## Core Rule

Each floor should function like a small world node with five things:

1. `Identity`
- a clear theme, mood, and sense of place

2. `Local work`
- optional floor-specific jobs, hunts, errands, or story contracts

3. `Local people`
- NPCs tied to that floor's problems, trade, rumors, or factions

4. `Resource loop`
- items, remnants, sigils, weapons, or materials that matter to that floor and the next one

5. `Gate battle`
- the current major floor battle that must be cleared to advance

If a floor only has enemies and a boss, it is incomplete.

## New World Structure

### Floor 1: Guild Floor

`Floor 1` becomes the anchor hub for the whole early game.

It should contain:
- Guild Hall
- Quartermaster / store
- Examiner offices
- revival services
- black-ledger / raid notices
- floor-intel access
- guild-side recurring NPCs
- Floor 1 local jobs

This means the Guild does not disappear.
It is simply no longer a detached top-level prep island.
It becomes the local civic center of the first floor.

### Floors 2+

Every later floor should have its own local support loop.

That does not mean every floor needs a full city.
It means each floor needs enough local identity to feel inhabited, worked, studied, scavenged, or survived.

Examples:
- `Floor 2: Thorn Corridor`
  - scout posts
  - salvage work
  - briar-remedy gathering
  - corridor warnings and field notes
- later floors might use:
  - shrine enclaves
  - ruined checkpoints
  - faction camps
  - survivor markets
  - sealed watch stations
  - temporary guild annexes

## What Changes

### Old model

- global `Quest Board`
- mixed quests from many contexts on one board
- tower progression as one separate lane
- floors mainly read as combat stages

### New model

- floor-local contract lists
- floor-local NPCs and support loops
- tower progression and floor content presented together
- floors read as places with optional work and a gate battle

## What Stays

This is not a blank-slate rewrite.

We should preserve and reuse:
- the shared quest state model
- the shared live combat runtime
- combat pouch usage
- tower wave/gate logic
- dossier / license / record UI patterns
- floor intel system
- rank trials
- black-ledger raids
- recurring NPC questline tracking

The rework is mainly about:
- presentation
- sourcing
- world structure
- flow

not about deleting the systems we already built.

## Current Systems We Can Reuse Directly

### 1. Live combat runtime

Already reusable for:
- floor gate battles
- local hunt contracts
- wanted-style named targets
- raid-class hunts

### 2. Quest definitions

Current quests can be migrated instead of thrown away.

They need new ownership fields such as:
- `sourceFloor`
- `sourceNpc`
- `sourceHub`
- `sourceType`

But their reward and combat structure can largely stay.

### 3. NPC hall / license presentation

This already gives us a strong pattern for:
- floor-specific locals
- guild officers on Floor 1
- temporary contacts on later floors

### 4. Floor intel

This should become more important, not less.

Instead of feeding a detached board loop, floor intel should support:
- local work
- local warnings
- hidden drops
- support contacts
- gate-battle preparation

### 5. Tower progression data

The current floor progression and gate-battle structure already gives us the spine.
What is missing is the local life around it.

## What Needs To Change

### 1. Quest sourcing

The current `Quest Board` should stop being the primary source of all routine work.

Going forward:
- `Jobs` should come from the current floor
- story contracts should come from floor-local NPCs or guild officers on Floor 1
- raids should remain special notices
- rank trials should remain examiner-driven

### 2. Floor screen structure

Each floor should eventually have a structure like:
- `Overview`
- `Work`
- `People`
- `Intel`
- `Advance`

Not every floor has to literally use those exact tab labels, but that is the right information architecture.

### 3. Guild role

The Guild should become:
- the Floor 1 administration and support center
- the home of rank, revival, store, and black-ledger functions
- not the permanent holder of all ordinary contracts in the game

### 4. Legacy board deprecation

The old global board should be treated as a temporary scaffolding surface.

Long-term:
- ordinary farming jobs should be absorbed into floor-local work
- only exceptional notices should remain central if they still need one home

## Design Benefits

If we do this right, the game becomes stronger in several ways.

### 1. Floors gain identity

A floor becomes:
- a place to spend time
- a place to learn
- a place to prepare
- not only a place to fight through

### 2. Quests make more sense

A player will understand:
- why this job exists here
- why this resource matters here
- why this NPC is asking for it here

That is much better than a generic board mixing everything together.

### 3. Progression feels less synthetic

Instead of:
- board -> store -> tower -> repeat

we get:
- arrive at a floor
- work its local loop if you want
- improve readiness and rewards
- challenge the gate battle
- move upward

### 4. Optional play becomes cleaner

The player can:
- rush the floor gate
- farm the floor first
- do side contracts
- talk to locals
- skip optional work entirely

That is a better kind of agency than making the board the default answer to every need.

## Risks

### 1. Scope bloat

If every floor becomes a full town immediately, we will overbuild.

Rule:
- each floor only needs enough local life to support its identity and loop
- not every floor needs a full civilization layer

### 2. Content fragmentation

If each floor invents its own UI from scratch, the game will feel messy.

Rule:
- keep one shared floor-hub structure
- change content, not the whole interaction pattern

### 3. Breaking current playable content

If we delete the board before floor-local work exists, we create a hole.

Rule:
- migrate floor by floor
- do not remove the current board until Floor 1 and Floor 2 local work loops are playable

## Migration Plan

### Slice 0: Documentation and rules

- lock this direction in the docs
- mark the global board as legacy scaffolding
- define what a floor-local work loop must include

### Slice 1: Floor 1 as the Guild Floor

- reinterpret the current guild as `Floor 1`
- move the current guild services into the Floor 1 frame cleanly
- keep rank trials and black-ledger notices tied to the guild offices here
- start renaming `Quest Board` language toward `Floor Work` or `Guild Jobs` where appropriate

### Slice 2: Floor 1 local jobs

- convert current early board jobs into `Floor 1` jobs
- present them as work tied to:
  - the threshold
  - guild needs
  - nearby salvage
  - first-floor dangers
- do not expand new systems yet; re-home the existing jobs first

### Slice 3: Floor 2 local loop

- give `Floor 2` its own work page
- move Floor 2-supporting jobs there
- tie Tamsin, briar remedies, and corridor salvage into that local loop
- make Floor 2 the first true proof that this structure works beyond the guild floor

### Slice 4: Exceptional notices split out

Once floors 1 and 2 work locally:
- keep `Black Ledger` as a special notice path
- keep `Rank Administration` as a guild office path
- remove ordinary mixed farming contracts from the old global board

### Slice 5: Standardize floor-hub template

For every new floor, require:
- one floor overview
- one local work loop
- one or more local contacts
- one local reward family
- one gate battle

## Floor Build Template Going Forward

Every future floor doc should answer:

1. `What kind of place is this floor?`
2. `Why would anyone stay or work here at all?`
3. `What optional work lives here?`
4. `What local resources or rewards matter here?`
5. `What is the gate battle to advance?`
6. `What does this floor teach that the next one builds on?`

## Current Recommended Priority

1. Lock the documentation for the floor-local direction
2. Keep Leviathor as the raid anchor
3. Bring `Ashen Gate Tyrant` and `Bell Warden of the Hollow Choir` up to Leviathor's current live-raid standard
4. Reframe `Floor 1` as the Guild Floor in UI and content language
5. Migrate early jobs into the Floor 1 local loop
6. Make `Floor 2` the first fully local non-guild floor loop

## UI Build Rule

The chosen presentation model is:
- `Option A: Vertical Floor Hub`

Implementation order and card rules live in:
- [/Users/kin/web-rpg/docs/FLOOR_HUB_UI_TODO.md](/Users/kin/web-rpg/docs/FLOOR_HUB_UI_TODO.md)

## Explicit TODO

The other black-ledger raids still need to be raised to the current Leviathor standard.

That means `Ashen Gate Tyrant` and `Bell Warden of the Hollow Choir` still need:
- true live multi-phase raid flow
- catastrophe pressure
- escalating self-buff identity
- raid-specific suggested supplies
- dossier and aftermath polish equal to Leviathor

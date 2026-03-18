# Monster Remnants System

Status: Phase 1 In Progress  
Purpose: Define what monster parts and floor drops are used for across the tower, quests, crafting, economy, and future legendary weaponlines.

## Core Naming

Player-facing term:
- `Remnants`

Internal data can still use material-style categories, but the world-facing presentation should prefer:
- `Floor Remnants`
- `Beast Remnants`
- `Boss Remnants`

This fits the Tower better than the generic phrase `monster parts`.

## Design Goals

Monster remnants must remain useful across the entire game.
They should not become vendor trash after one floor.

Every remnant should support at least one of these roles:

1. `Crafting`
2. `Tower Preparation`
3. `Guild Sale`
4. `Quest / NPC / Title Progression`
5. `Legendary Weaponline Support`

Every remnant must also have a visible grade.
Grades are crucial because they signal:
- sell value
- crafting weight
- sale importance
- long-term legendary weapon relevance

## Core System Roles

### 1. Crafting Materials

Remnants should be used to create:
- recovery items
- counter-supplies
- sigils
- seals
- engravings
- enhancement materials
- special quest tools

Examples:
- `Ash Rat Fang` + `Healing Herb` -> `Antitoxin Vial`
- `Dust Crawler Shell` + `Iron Ore` -> defensive utility item
- `Warden of Sparks Heart` + `Ward Charm` -> shock ward supply

### Basic Workshop v1

The first visible crafting layer lives in Bran's guild store workshop.

Initial recipes:
- `Ash Rat Fang` + `Healing Herb` -> `Antitoxin Vial`
- `Dust Crawler Shell` + `Iron Ore` -> `Guard Tonic`
- `Sentinel Shard` + `Guard Tonic` + `Iron Ore` -> `Ward Charm`
- `Sentinel Shard` + `Health Potion` + `Healing Herb` -> `Grounding Tonic`
- `Briar Resin` + `Healing Herb` -> `Thorn Salve`

Rules:
- standard materials and remnants can be crafted directly
- sealed/special remnants remain appraisal-gated
- this is the starter layer only; seals and engravings come later
- recipes can unlock by level, rank, and floor clear progression

Workshop TODO:
- [x] add 3-ingredient recipes for early rare prep outputs
- [ ] add 4-ingredient recipes for higher-grade outputs and boss-adjacent prep

Future structure:
- early remnants can feed into Seal crafting
- stronger remnants can feed into Engraving work

### 2. Tower Preparation Materials

Floor drops should feed future floor prep.

Rule:
- Floor N remnants help the player prepare for Floor N+1 or rank-related content.

This keeps floors and quests tightly coupled.

### 3. Guild Sale

Players should always have a fallback use for extra remnants.

Sale gives players:
- gold
- a clear fallback for surplus drops
- an immediate reason to care about remnant grade

Only sealed or special remnants should require appraisal.
Standard remnants should move straight to sale and other future uses without extra steps.

### 4. Narrative / Progression Hooks

Remnants should also be used for:
- title progress
- NPC requests
- side quests
- hidden or branching story tasks
- future faction investigations

This gives remnants narrative value, not only numeric value.

### 5. Legendary Weaponline Support

This is critical.

Future custom legendary weapon quests should use remnants as long-term progression ingredients.
That means remnants must be designed in a way that supports both:
- immediate floor usefulness
- long-term weaponline contribution

## Remnant Tiers

### Common Remnants

Use for:
- basic crafting
- prep items
- low-rank sale
- simple quest objectives

Examples:
- `Ash Rat Fang`
- `Ash Rat Hide`
- `Dust Crawler Shell`

### Refined Remnants

Use for:
- better supplies
- sigil components
- rank-related crafting
- higher-value sale

Examples:
- `Sentinel Shard`
- `Warden of Sparks Heart`
- `Briar Resin`

### Boss Remnants

Use for:
- floor identity progression
- titles
- elite crafting
- future legendary weaponline milestones
- faction and NPC story gates

Examples:
- `Warden of Sparks Heart`
- `Heartseed Core`
- future floor cores / seals / relic shards

## Floor 1 Remnant Intent

Floor 1 should teach the player that remnants matter immediately.

### Proposed Floor 1 Remnants

- `Ash Rat Fang`
  - poison/counter crafting
  - future venom-based weaponline ingredient
  - grade: `Common`

- `Ash Rat Hide`
  - low-rank salves / stabilizers
  - future grip/wrap/lining ingredient
  - grade: `Common`

- `Dust Crawler Shell`
  - guard / armor utility crafting
  - future plating / reinforcement ingredient
  - grade: `Common`

- `Sentinel Shard`
  - lock, gate, ward, or seal utility
  - future sealcraft ingredient
  - grade: `Common`

- `Warden of Sparks Heart`
  - shock or arcane prep
  - future energy core ingredient for engravings and high-tier weapon work
  - grade: `Rare`

## Legendary Weaponline Framework

Future legendary weapon quests should not be one-off reward chains.
They should feel like a personal weapon ascent built over many floors.

### High-Level Concept

Each player eventually earns the right to forge a single customizable legendary weapon path tied to their class.

Examples later:
- Warrior: greatblade / sword / knight-weapon line
- Ranger: spear / bow / hybrid line
- Mage: staff / focus / conduit line

### Required Inputs

Legendary weapon creation should eventually require:

1. `Common Floor Remnants`
2. `Boss Remnants`
3. `Quest-specific special materials`
4. `NPC forge/trial cooperation`
5. `Class-path decisions`
6. `Engravings`
7. optional `Seals` synergy through chosen Sigils

### System Rule

Do not make early remnants worthless later.

Instead:
- early remnants become foundational ingredients
- later remnants become refinement ingredients
- boss remnants become catalytic ingredients

### Example Material Structure

- `Base Frame Materials`
  - lower-floor remnants

- `Temper / Binding Materials`
  - mid-floor remnants

- `Catalyst Core`
  - boss remnants

- `Personalization Components`
  - quest/NPC/faction-dependent pieces

- `Weapon Engravings`
  - permanent weapon specialization layer

- `Seal Synergy`
  - modular tactical layer tied to chosen Sigils

This allows the legendary weaponline to feel earned over time.

## Progression Loop

The intended loop should become:

1. run board quests for supplies
2. enter tower floors
3. collect remnants
4. use remnants for:
   - immediate prep
   - crafting
   - sale
   - story tasks
   - long-term legendary weapon progression

This prevents remnants from becoming dead inventory clutter.

## Sell System Rule

All non-quest-locked remnants should be sellable.

Why:
- gives the player a clean fallback if inventory floods
- supports low-gold recovery situations
- keeps poor drop luck from feeling useless

But:
- boss remnants should sell poorly compared to their true progression value
- this discourages accidental long-term progression loss

## Implementation Order

### Phase 1

- add player-facing `Remnants` wording
- add sell values for floor remnants
- add first remnant turn-in style rewards

Current implementation:
- Floor 1 remnants exist in live data
- each Floor 1 remnant has a visible grade
- each Floor 1 remnant has a sell value
- Bran can appraise and buy owned remnants through the guild store

### Phase 2

- add simple remnant recipes for Floor 1 and Floor 2
- tie specific remnants to board quests and NPC requests

### Phase 3

- add title and side-quest progress requirements using remnants

### Phase 4

- add legendary weaponline foundations:
  - remnant families
  - core ingredient slots
  - class-specific weaponline scaffolding

## Open Design Rules For Later

- exact crafting UI
- whether forging is done by guild smith, special NPC, or class quest forge
- how many legendary weapon branches each class gets
- how much player customization affects stat identity vs visual identity

## Immediate Follow-up Tasks

- decide first 2-3 remnant crafting recipes
- decide first remnant turn-in quest
- make sure Floor 2 remnants also fit legendary weaponline planning

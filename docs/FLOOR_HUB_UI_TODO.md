# Floor Hub UI TODO

Status: active step-by-step build checklist for the vertical floor-hub direction.

Use this file when implementing the new floor presentation model described in:
- [/Users/kin/web-rpg/docs/FLOOR_LOCAL_WORLD_REWORK.md](/Users/kin/web-rpg/docs/FLOOR_LOCAL_WORLD_REWORK.md)

This file is intentionally implementation-oriented.
It answers:
- what we build first
- what stays visible
- what gets tucked behind interaction
- what the shared standard is for every floor

## Chosen Direction

We are using `Option A: Vertical Floor Hub`.

That means:
- one art-led floor page
- one vertically scrolling hub
- large section cards instead of dense tab bars
- compact front-facing information
- deeper details shown only after interaction

Do not build the floor system as a dense multi-tab admin screen unless we explicitly redesign it later.

## Standing Visual Rule

Every floor should read like a place first.

That means:
- lead with floor art
- use section cards that feel like districts, offices, or local records
- keep copy short on the front surface
- avoid walls of text
- avoid restoring giant generic quest lists as the main presentation

## Shared Floor Hub Structure

Every floor hub should eventually use this order:

1. `Floor Hero`
2. `Local Hub Card`
3. `Local Work Card`
4. `People Card`
5. `Intel Card`
6. `Advance Card`

Optional supporting cards may appear below those, such as:
- `Recent Finds`
- `Local Rewards`
- `Special Notice`

But those six are the core shell.

## Front-Surface Information Rule

On the floor hub itself, only show:
- image/art
- title/subtitle
- 1 short summary line
- 2-5 key chips
- the primary action

Do not put on the front surface:
- long lore paragraphs
- full quest journaling text
- full enemy dossier text
- giant stat dumps
- multiple stacked text panels repeating the same information

If more detail is needed, show it after interaction.

## Step-By-Step TODO

### Step 1: Define the shared Floor Hero

Build the top hero block that every floor will use.

Must include:
- floor name
- floor subtitle/theme
- wide floor art
- floor state chips
- primary floor action

Front-facing chips should be limited to the most important things, for example:
- rank recommendation
- level recommendation
- floor state
- gate state

Do not show every support detail in the hero.

Done when:
- the player can identify the floor at a glance
- the floor feels like a location, not a menu
- the hero does not waste space on large empty columns

### Step 2: Define the shared section-card model

Create one consistent section-card language for all floor cards.

Each card should support:
- icon or image
- title
- short summary
- small chip row
- primary action
- optional expand/open state

Cards should feel related, but not identical clones.
Use visual accents by purpose:
- `Guild Hall` / local hub: administrative or civic
- `Work`: notice / contract style
- `People`: license / roster style
- `Intel`: dossier / ledger style
- `Advance`: sanctioned gate record style

Done when:
- we can reuse the same card shell across floors
- the page feels unified without being repetitive

### Step 3: Reframe Floor 1 as the Guild Floor

Turn the current guild-facing experience into the `Floor 1` local hub.

Floor 1 should contain:
- Guild Hall
- store access
- rank administration
- revival services
- black-ledger notices
- guild-side recurring NPCs
- Floor 1 local jobs

This is a presentation and navigation re-home first.
Do not invent new systems here yet.

Done when:
- the player understands that the guild belongs to Floor 1
- the guild no longer feels like a detached top-level island

### Step 4: Build the Floor 1 card order

Floor 1 should use this initial order:

1. `Floor Hero`
2. `Guild Hall`
3. `Local Work`
4. `People`
5. `Intel`
6. `Advance`

Optional later card:
- `Recent Finds`

Why this order:
- the guild should feel like the civic center of the first floor
- work and people should come before the gate challenge
- the player should see the floor as inhabited before they see it as only a fight

Done when:
- the page scroll reads naturally from place -> services -> work -> people -> preparation -> challenge

### Step 5: Map current Guild screens into Floor 1

Map existing surfaces into the new Floor 1 cards:

- current `Guild` / store functions -> `Guild Hall`
- current ordinary `Quest Board` work -> `Local Work`
- current `NPC Hall` -> `People`
- current floor intel / store intel -> `Intel`
- current tower floor battle entry -> `Advance`

Do not rebuild their deep systems yet.
First just re-home them into the Floor 1 shell.

Done when:
- Floor 1 can act as the true first local world node using mostly existing systems

### Step 6: Clean the Local Work front surface

Do not show giant quest rows.

On the `Local Work` card, show only:
- job name
- small icon/art
- 1 short hook line
- reward/resource chips
- action button

Full details should open only after click/tap.

The `Local Work` front surface should feel like:
- posted floor work
- not a spreadsheet

Done when:
- work is scannable at a glance
- the player can tell what matters without reading paragraphs

### Step 7: Clean the People front surface

Use the license-style NPC direction already established.

On the `People` card, show only:
- portrait
- name
- role
- one short current-state line
- one action

Do not dump full combat or loadout information here unless the NPC is part of an encounter surface.

Done when:
- the player can quickly see who matters on the floor
- the page does not become a dossier wall

### Step 8: Clean the Intel front surface

The `Intel` card should show only:
- floor notes summary
- discovered threats count
- discovered drops count
- current warnings or hidden aids if unlocked

Do not front-load the full intel record.
That should open deeper only after interaction.

Done when:
- the player understands whether they know enough about the floor
- the card invites preparation without becoming a text dump

### Step 9: Clean the Advance front surface

The `Advance` card should contain:
- gate battle identity
- current progress state
- one concise challenge summary
- primary advance button

It should feel like:
- a sanctioned climb record
- not a generic combat launch panel

Done when:
- the gate battle reads like the next major step
- not just another button hidden inside a menu

### Step 10: Define interaction depth rules

For every floor card, decide what opens deeper and what stays visible.

#### Visible by default
- title
- short summary
- small chips
- current state
- primary action

#### Opens deeper
- long lore
- reward breakdowns
- full quest details
- full NPC dialogue trees
- full intel dossiers
- battle preparation detail

Done when:
- the floor hub remains visually clean
- detail is available without taking over the main page

### Step 11: Make Floor 2 the first non-guild proof

After Floor 1 is re-homed successfully, use `Floor 2` as the first real test of the model beyond the guild.

Floor 2 should show:
- a different local identity
- different local work
- different local people/contact(s)
- the same shared floor-hub shell

This is the point where we prove the model is not only a renamed guild screen.

Done when:
- Floor 2 feels like a true place of its own
- while still using the same structural language as Floor 1

### Step 12: Deprecate the legacy global board gradually

Do not remove the current board immediately.

Deprecation order:
1. re-home Floor 1 jobs
2. re-home Floor 2 jobs
3. keep only exceptional central notices if needed
4. remove ordinary mixed farming work from the detached board

Exceptional notices that may remain centralized:
- black-ledger raids
- rank trial administration
- rare guild emergency postings

Done when:
- the player no longer relies on a generic global board for ordinary progression
- floor-local work has fully taken over that role

## Immediate Build Order

This is the recommended order for implementation:

1. shared Floor Hero
2. shared section-card shell
3. Floor 1 page shell
4. re-home Guild Hall into Floor 1
5. re-home Local Work into Floor 1
6. re-home People into Floor 1
7. re-home Intel into Floor 1
8. re-home Advance into Floor 1
9. polish Floor 1 readability
10. build Floor 2 as the first non-guild proof

## Guardrails

Do not:
- rebuild the floor hub as a text-heavy dashboard
- use giant tab bars as the first answer
- keep long quest rows as the main floor-work presentation
- let lore paragraphs dominate the front surface
- invent a different floor-shell layout for every floor

Do:
- lead with art
- keep front-facing information compact
- make cards scannable
- make the floor feel inhabited
- use one strong shared structure and vary the content

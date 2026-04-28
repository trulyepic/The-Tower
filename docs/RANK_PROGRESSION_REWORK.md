# Rank Progression Rework

Status: Active design spine for adventurer rank advancement.

Use this file when changing:
- rank promotion trials
- examiner NPC interactions
- rank-related unlocks
- rank-related failure consequences
- guild-facing progression language

Use this with:
- [/Users/kin/web-rpg/docs/ROADMAP.md](/Users/kin/web-rpg/docs/ROADMAP.md)
- [/Users/kin/web-rpg/docs/SEQUENTIAL_CONTENT_PLAN.md](/Users/kin/web-rpg/docs/SEQUENTIAL_CONTENT_PLAN.md)
- [/Users/kin/web-rpg/docs/HIGH_RANK_RAID_SYSTEM.md](/Users/kin/web-rpg/docs/HIGH_RANK_RAID_SYSTEM.md)
- [/Users/kin/web-rpg/apps/mobile/src/data/rankProgression.ts](/Users/kin/web-rpg/apps/mobile/src/data/rankProgression.ts)
- [/Users/kin/web-rpg/apps/mobile/src/data/rankTrials.ts](/Users/kin/web-rpg/apps/mobile/src/data/rankTrials.ts)

## Purpose

Rank progression should not feel like:
- a hidden level gate
- a percentage check at an office desk
- a generic admin screen with item tax

It should feel like:
- the guild formally measuring what kind of adventurer you have become
- each promotion proving a different kind of competence
- your standing in the guild changing in visible ways

## Core Direction

Rank is not just power.
Rank is guild recognition.

Levels answer:
- how far your body and class have grown

Rank answers:
- what the guild believes you can be trusted with

That means rank progression should change:
- how NPCs speak to you
- what contracts are offered to you first
- what sigil/title systems open up
- how the guild frames your tower climb

## Canonical Rank Map

- `F`: 1-4
- `E`: 5-9
- `D`: 10-14
- `C`: 15-24
- `B`: 25-39
- `A`: 40-59
- `S`: 60-79
- `SS`: 80+

This level map stays.

## No Hard-Lock Rule

The game’s broader direction is now:
- do not hard-lock core player freedom behind rank where avoidable

So rank should be used mainly for:
- guild trust
- formal promotion
- examiner access
- board surfacing priority
- narrative weight
- unlock pacing for some systems

Not for:
- hard-denying a player from attempting most of the tower

## What Each Rank Means

### `F`

The guild sees you as:
- newly licensed
- unproven
- fragile

Player fantasy:
- you are surviving beginner work
- nobody important trusts your judgment yet

### `E`

The guild sees you as:
- reliable enough for real corridor work
- no longer a pure novice

Player fantasy:
- you can be sent into the first dangerous floor bands without it looking like paperwork negligence

### `D`

The guild sees you as:
- operational
- trustworthy under pressure

Player fantasy:
- you are no longer just surviving work, you are expected to execute it cleanly

### `C`

The guild sees you as:
- a real field adventurer
- someone who can be judged on quality, not just survival

Player fantasy:
- this is where your style, build, and discipline start to matter to the institution

### `B`

The guild sees you as:
- dependable in serious climbs
- fit for more public responsibility

Player fantasy:
- your name has weight outside your immediate board history

### `A`

The guild sees you as:
- elite
- strategically relevant

Player fantasy:
- your climb is now part of guild expectations, politics, and resource planning

### `S`

The guild sees you as:
- exceptional
- one of the few climbers whose movement changes how others plan

Player fantasy:
- your progress is a matter of record, not rumor

### `SS`

The guild sees you as:
- beyond normal promotion culture
- a benchmark, anomaly, or institutional threat depending on context

Player fantasy:
- rank no longer validates you; the guild struggles to explain you

## Trial Identity Rule

Each promotion trial must prove one clear competency.

Do not let all trials collapse into:
- same UI
- same success meter
- same item checklist

Each trial should have:
- a title
- a guild purpose
- a central test
- one or more signature mechanics
- a reward that feels like the rank actually changed

### Naming Rule

Use clear, concrete titles.

Prefer:
- readable field language
- plain action or role words
- titles a player understands instantly

Avoid:
- abstract internal-sounding names
- poetic phrases that do not explain the test
- guild jargon unless it is extremely readable on first contact

## Combat-First Rule

All promotion trials should be settled in live RPG turn-based combat.

That means:
- the desk can show prep, readiness, and requirements
- the examiner can frame the trial
- but the actual promotion result should come from a live sanctioned clash

Standing direction:
- `F -> E` is now the first live combat threshold test
- future promotions should keep using combat, with stronger mechanics and more identity as the ranks rise

Do not regress back into:
- office-only percentage rolls
- promotions that resolve without the player actually fighting

## Ceremony-By-Default Rule

Promotion trials should always end with a real aftermath presentation.

Do not treat ceremony as optional polish to add later.

When a rank trial is implemented or updated, it should ship with:
- a result modal that opens immediately after the live combat ends
- a trial-specific visual identity
- examiner success and failure lines
- a clear guild record summary
- promotion unlocks on success
- a closing guild-notice stinger when the player accepts the result

Standing direction:
- `F -> E` and `E -> D` should set the quality bar
- higher promotions should become more visually distinct, not less

If a future trial exists without this layer, treat that as incomplete implementation.

## Art-First Presentation Rule

Rank trial result screens should be built around art first, not walls of text.

That means:
- examiner or guild-facing character art should lead the scene
- the trial state and promotion state should be readable quickly
- supporting text should be concise and non-redundant
- if the result needs more copy, it must scroll instead of clipping

Avoid:
- result screens that open mid-paragraph with no clear visual anchor
- repeating the same outcome across multiple text panels
- layouts where text overwhelms the promotion moment

## Combat Pouch Rule

Live combat trials now use the shared adventurer combat pouch.

That means:
- the trial board can explain what kinds of support help
- but it should not ask the player to pre-burn a separate trial supply list
- packed consumables stay in inventory unless they are actually used during combat

Standing direction:
- tower live battles
- live quest battles
- rank trials

should all read from the same pouch model.

Future progression:
- pouch capacity can grow later through level milestones or NPC upgrades
- when that happens, update the docs and Inventory together

## Trial Themes

### `F -> E`
Title:
- `First Field Trial`

What it proves:
- you can prepare properly and survive a real first push

Core test:
- readiness
- basic judgment
- not panicking into waste

Signature feel:
- first formal guild assessment
- not glamorous, but serious

### `E -> D`
Title:
- `Earn The D-Mark`

What it proves:
- you can beat another trained adventurer under guild watch instead of only surviving scripted monster pressure

Core test:
- duel control against a thinking opponent
- reading weapon pressure, sigils, and pouch-item recovery
- staying composed through a second phase

Signature feel:
- a sanctioned guild duel, not a death-match or corridor clean-up
- the first promotion where another adventurer is the actual exam
- named challenger integration into the guild hall and rank-office story
- the second phase should be communicated through a clear health-color shift on Riven's HP presentation
- the examiner should say plainly that the bout is a guild assessment and both fighters are expected to walk away

Opponent dossier rule:
- use the reusable adventurer license dossier spec from `ADVENTURER_DUEL_PARITY_PLAN.md`
- the dossier should show `ID`, `Rank`, `Level`, `Weapon`, `Sigils`, `Title`, `Skill`, `Passive`, and `Pouch`
- do not collapse named-duelist trials into a generic stat card
- the player should feel like they are reading a real guild license before the duel starts

Follow-up beats:
- the duel opponent should remain a named hall duelist after the trial resolves
- the duel should always be described in follow-up copy as a sanctioned assessment, not a lethal grudge match
- Nyra Sol should acknowledge whether the player beat Riven cleanly or struggled
- Nyra's follow-up text should reinforce that the result is recorded for rank-readiness, not treated as a death toll
- Riven should be reusable later as a hall-side benchmark, sparring contact, or rank-office callback
- the guild should treat the duel as the start of a recurring promotion relationship, not a one-time boss fight

Single-opponent rule:
- the duel should resolve as one named opponent with an internal phase shift, not as two sequential enemy units
- if a temporary split exists in code while the duel is being built, the intended end state is still a single phased opponent

### `D -> C`
Title:
- `Execution Record`

What it proves:
- you can produce clean results, not just survive
- you can finish under office scrutiny without wasting the field

Core test:
- efficient clears
- measured aggression
- tactical adaptation
- clean enough execution to satisfy the guild ledger

Signature feel:
- first promotion where your style of play should matter more visibly
- less duel theater, more professional field audit

### `C -> B`
Title:
- `Field Command`

What it proves:
- you can handle layered battlefield pressure and make strong reads

Core test:
- multi-step threat management
- stronger positional expectations

Signature feel:
- less apprentice exam, more serious field evaluation

### `B -> A`
Title:
- `High Ascent Charter`

What it proves:
- you can carry elite-grade responsibility without collapsing your run

Core test:
- sustained pressure
- stricter punishment for bad reads
- heavier mechanical complexity

Current implemented shape:
- `High Ascent Charter`
- one named A-rank marshal (`Serin Vael`) carries the whole assessment across escalating phases
- the player is judged on both the win and the charter review that follows it
- charter faults now matter as part of whether the guild can trust the climb with A-rank authority

### `A -> S`
Title:
- `Recorded Ascent`

What it proves:
- your climb belongs in formal guild record

Core test:
- successful completion of named raid-class hunts
- returning with fixed proof of extraordinary ascent

Current direction:
- `A -> S` should no longer be treated as another conventional live duel
- it should require a set of named raid proofs from sanctioned high-rank monsters
- the player should present those proofs to the examiner for formal recognition
- reference: [/Users/kin/web-rpg/docs/HIGH_RANK_RAID_SYSTEM.md](/Users/kin/web-rpg/docs/HIGH_RANK_RAID_SYSTEM.md)

### `S -> SS`
Title:
- `Uncommon Measure`

What it proves:
- the guild can still measure you at all

Core test:
- deliberately severe raid-class proof requirements
- prestige, scarcity, and danger

Current direction:
- `S -> SS` should build on the same proof-based raid structure as `A -> S`
- it should require rarer and more exceptional raid proofs, not just more generic items
- it should remain ceremonial at the examiner stage even though the proof is earned in the field
- reference: [/Users/kin/web-rpg/docs/HIGH_RANK_RAID_SYSTEM.md](/Users/kin/web-rpg/docs/HIGH_RANK_RAID_SYSTEM.md)

## Trial Format Direction

Short term:
- keep the examiner desk and trial-prep interface
- use it to explain the trial and stage prep
- then launch a live combat assessment

Mid term:
- expand the live assessment structure into stronger custom trial encounters
- especially from `E -> D` upward

Recommended structure by band:
- `F -> E`
  - should be a simple, readable live threshold clash
- `E -> D`
  - should become a simple live assessment
- `D -> C` and above
  - should increasingly feel like special guild challenge contracts

## Duel Parity Follow-Up

For `E -> D` and later rank duels, the next realistic improvements should focus on mirror-match readability instead of extra spectacle.

Sequence:
1. phase-led health presentation
2. enemy pouch use parity
3. sigil parity
4. AI archetype behavior
5. phase escalation
6. result ceremony continuity

Presentation rule:
- use health color changes to signal duel phase changes instead of fracture framing
- do not use `Fractured` framing unless the duel actually applies a fracture mechanic

Reference:
- [/Users/kin/web-rpg/docs/ADVENTURER_DUEL_PARITY_PLAN.md](/Users/kin/web-rpg/docs/ADVENTURER_DUEL_PARITY_PLAN.md)

## Failure Rules

Rank failure should hurt enough to matter but should not feel like save corruption.

Recommended baseline:
- always consume stamina
- consume committed trial items
- apply moderate health loss
- do not reduce rank
- do not permanently block retry

Future additions:
- optional retry cooldown by higher rank
- examiner commentary that changes after repeated failures
- heavier prestige friction at high ranks

Do not:
- make failure so punitive that players avoid the system entirely

## Rank Unlock Rules

Promotion should unlock visible things.

### Recommended unlock direction

- `F -> E`
  - first true guild trust bump
  - stronger quest board visibility
  - first floor-2-facing support presentation

- `E -> D`
  - more serious board contracts surface first
  - one system slot bump is acceptable here

- `D -> C`
  - stronger title/sigil growth threshold
  - first “professional adventurer” feeling

- `C -> B` and above
  - more visible guild recognition
  - stronger access to rare stock, special contracts, and institutional NPCs

### Standing rule

Whenever we add:
- a sigil slot increase
- a title slot increase
- a store inventory tier
- an examiner behavior shift
- a guild NPC reaction shift

we should check whether rank should be part of that unlock.

## Examiner Direction

The examiner should not feel like:
- a generic clerk

The examiner should feel like:
- the guild’s official judgment of your record

Per-rank examiner behavior should differ in:
- tone
- tolerance
- respect
- impatience
- what they believe the next rank means

Future content rule:
- every examiner should get at least:
  - readiness line
  - failure line
  - success line
  - one ambient speech pool tied to promotion state

Rank-duel continuity rule:
- if a promotion uses a named guild opponent, the examiner should keep that opponent alive in the hall story after the fight
- the examiner should reference the opponent again when the player's rank changes
- the opponent should be documented as a recurring face, not a one-off encounter
- the duel should always be framed as a sanctioned guild assessment rather than a duel to the death

## UI Direction

Rank UI should communicate:
- what this promotion means
- what it requires
- what it unlocks
- what you lose on failure

Not just:
- success chance
- item list

Recommended trial screen blocks:
- trial title
- what the guild is testing
- exact requirements
- likely unlocks
- failure consequences
- examiner note

## Current Gaps To Close

The current implementation still needs:
- per-rank special trial identity
- better failure consequence presentation
- clearer unlock presentation
- examiner-specific trial flavor
- stronger runtime differences between early and late promotions

## Ongoing Rule

Rank progression is now a living system.

Whenever we add:
- a new floor chapter
- a new guild service
- a new quest tier
- a new sigil/title/equipment growth breakpoint
- a new major NPC reaction layer

we should ask:
- does rank progression need to react to this?
- does this change what the current rank means?

## Trial Adventurer Rule

Named rank-trial adventurers should feel like different guild people, not the same template with new art.

- vary weapon choice when possible
- vary sigil count and sigil family
- vary title count
- give each one a bio tied to guild role and office use
- avoid repeating the same loadout silhouette unless that sameness is intentional to the rank office

## Slot Source Of Truth

Trial adventurers must obey the same slot-growth rules as the player.

- sigil slots:
  - source of truth: `apps/mobile/src/lib/buffs.ts`
  - based on adventurer rank
- title slots:
  - source of truth: `apps/mobile/src/lib/titles.ts`
  - based on character level

Do not hand-author separate trial-only slot limits that can drift from the player rules.

## Next Rank-Trial Slices

Use these as the concrete promotion targets from `D -> C` upward.

### 1) `D -> C` - `Execution Record` (Implemented)

What this slice should prove:
- the player can finish cleanly even after the job turns hostile and the file starts working against them

Trial shape:
- a live guild-sanctioned field audit
- one named assessment target under Thorne Veld's scrutiny
- same-opponent escalation into a harsher redline pass
- a live audit-pressure meter that can be interrupted or allowed to cash out into a finishing sequence
- promotion depends on both winning and meeting the execution standard
- emphasis on clean reads, controlled tempo, low waste, disciplined pouch use, and surviving the redline without losing the file

What should feel different from `E -> D`:
- less about beating a thinking opponent in a duel
- more about proving you can keep a field audit under control after it stops being orderly and starts turning punitive

### 2) `C -> B` - `Field Command`

What this slice should prove:
- the player can handle layered battlefield pressure and keep a whole field from cohering against them

Trial shape:
- a live combat assessment built around a named field captain and support lines
- support threats can feed pressure forward into the captain if mishandled
- success depends on both winning and keeping field breaches under control
- should feel more like a field evaluation than a one-opponent exam

What should feel different from `D -> C`:
- less about clean execution alone
- more about whether the player can control the pace of a larger, messier fight after several threats have had a chance to interact

### 3) `B -> A` - `High Ascent Charter`

What this slice should prove:
- the player can carry elite-grade responsibility without collapsing the run

Trial shape:
- a longer-form, high-pressure guild assessment
- one continuous A-rank witness instead of another field-unit swarm
- stronger punishment for bad reads
- a clearer sense that the guild is deciding whether this adventurer belongs in the elite tier

What should feel different from `C -> B`:
- less about routine field control
- more about prestige, endurance, and institutional trust at the top end of normal guild standing
- the player should feel the weight of one long elite witness run rather than a wider battlefield puzzle

## Rank Trial Ownership Rule

When a rank trial slice is added or changed, update all three of these together:
- the rank-trial entry in this file
- the rank section in `ROADMAP.md`
- the active progression order in `SEQUENTIAL_CONTENT_PLAN.md`

Do not let a new trial live in only one doc.

## Suggested Implementation Order

1. Presentation pass on current rank desk
   - explain trial identity
   - explain failure consequences
   - explain unlocks

2. `F -> E` live combat conversion
   - make `First Field Trial` a real sanctioned clash
   - use the shared turn-based battle system
   - make readiness affect prep, not replace combat

3. Examiner flavor pass
   - readiness/failure/success dialogue
   - more distinct examiner voice by rank

4. `E -> D` conversion
   - named guild duel against Riven Hale
   - second-phase adventurer fight with weapon, sigil, and pouch-item identity
   - post-duel hall continuity for Riven and Nyra Sol

5. Higher-rank trial variants
   - more positional tests
   - more mechanic-specific assessments
   - more class-aware expectations

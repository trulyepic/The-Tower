# High-Rank Raid System

Status: Active design spine for top-end raid encounters and proof-based rank promotion.

Use this file when changing:
- raid-class hunt encounters
- raid-proof rewards
- `A -> S` promotion design
- `S -> SS` promotion design
- high-rank guild notice structure

Use this with:
- [/Users/kin/web-rpg/docs/RANK_PROGRESSION_REWORK.md](/Users/kin/web-rpg/docs/RANK_PROGRESSION_REWORK.md)
- [/Users/kin/web-rpg/docs/ROADMAP.md](/Users/kin/web-rpg/docs/ROADMAP.md)
- [/Users/kin/web-rpg/docs/SEQUENTIAL_CONTENT_PLAN.md](/Users/kin/web-rpg/docs/SEQUENTIAL_CONTENT_PLAN.md)
- [/Users/kin/web-rpg/docs/QUEST_PLACEHOLDER_COMBAT_CONTRACTS.md](/Users/kin/web-rpg/docs/QUEST_PLACEHOLDER_COMBAT_CONTRACTS.md)
- [/Users/kin/web-rpg/docs/TOWER_BATTLE_PHASES.md](/Users/kin/web-rpg/docs/TOWER_BATTLE_PHASES.md)

## Purpose

High-rank raids exist so the top end of guild promotion does not collapse into:
- another duel
- another generic boss
- a random material checklist

Raids should prove that the player can bring back a result that ordinary high-rank adventurers cannot.

That means raids are the right foundation for:
- `A -> S`
- `S -> SS`

## Core Rule

Top-end rank promotion should use **raid proofs**, not random loot.

Do:
- tie promotion to named raid-class monsters
- grant fixed proof items on meaningful clear
- require the player to present those proofs to the guild examiner

Do not:
- ask for random low-drop materials
- ask for high item counts like a crafting turn-in
- turn `A -> S` into generic farming

The promotion should feel like:
- the guild is forced to acknowledge the record
- not like the player assembled a shopping list

## What A Raid Means Here

`Raid` does not currently mean multiplayer.

For this game, a raid is:
- a named high-rank monster encounter
- longer and more dangerous than normal bosses
- built around multiple phases, catastrophe pressure, and heavy prep
- something the guild records as a major hunt, not a routine contract

The important distinction is encounter weight, not party size.

## Raid Identity Rule

A raid should feel different from ordinary live combat in at least four ways:

1. `Named threat identity`
- the monster should feel famous, feared, or black-ledger worthy

2. `Long-form encounter`
- multiple phases
- visible escalation
- real attrition

3. `Catastrophe pressure`
- the player should feel a larger threat building over time
- this can use the current pressure-meter language where it fits

4. `Proof reward`
- the player does not just get loot
- the player gets documented evidence that the raid was completed

## Proof Rule

Proof items are not ordinary materials.

A proof should be:
- fixed
- named
- tied to one raid target
- awarded for meaningful success, not random chance

Good proof examples:
- a sealed fang
- a black-ledger scale
- a marshal-confirmed eye core
- a relic shard cut from the raid body

Bad proof examples:
- `10 scales`
- `5 claws`
- random low-chance scraps

## Reward Structure Rule

A raid can still drop normal rewards, but those are secondary.

Primary raid reward:
- the proof item

Secondary raid rewards:
- remnant-grade boss materials
- rare sigils, seals, or forge-mark inputs
- guild prestige rewards
- top-end weaponline ingredients

## Promotion Rule

### `A -> S`

`A -> S` should no longer be treated as a conventional duel or desk-check promotion.

Instead:
- the guild names a high-rank raid record requirement
- the player must bring back a set of specific raid proofs
- once those proofs are verified, the examiner promotes the player to `S`

This keeps the promotion:
- prestigious
- visible
- world-connected
- different from the lower-rank trials

### `S -> SS`

`S -> SS` should follow the same structure, but at a more severe level.

It should require:
- rarer proofs
- stronger targets
- or one proof from an encounter the guild barely believes can be survived at all

The difference from `A -> S` should be:
- not just more items
- but rarer witnesses, harsher encounters, and more exceptional records

## Promotion Ceremony Rule

Even though the promotion is proof-based, it still needs ceremony.

That means:
- the player turns the proofs in to the examiner
- the examiner confirms the record
- the guild promotion result is presented formally

Do not reduce the promotion to:
- inventory check only
- silent hand-in
- pure transaction

The feeling should be:
- the record is undeniable
- the guild has to acknowledge what was done

## Unlock Rule

Raids should not become open-ended chores.

Recommended unlock path:
- rank threshold met
- level threshold met
- one or more guild notices or black-ledger entries unlocked
- perhaps one examiner or quartermaster conversation to formally sanction the raid

This makes raids feel like:
- extraordinary guild work
- not just optional farming

## First Build Direction

The first playable high-rank raid system should answer these questions:

1. How does a raid notice appear?
2. How is a raid prepared differently from a normal live contract?
3. How is catastrophe pressure presented?
4. What does a proof item look like in UI and inventory?
5. How many proofs does `A -> S` require?
6. How does the examiner verify those proofs?

## First Promotion Direction

Recommended initial shape for `A -> S`:
- require `3` named raid proofs
- each from a different sanctioned raid-class target
- all guaranteed on meaningful clear

This gives the promotion:
- variety
- legitimacy
- anti-grind protection

Recommended initial shape for `S -> SS`:
- require either:
  - `3` rarer proofs from upper-band raid targets
  - or `2` exceptional proofs plus `1` world-record grade proof

## Current A -> S Proof Set

The first live scaffold for `A -> S` now uses:
- `Leviathor Scale Seal`
- `Gate Tyrant Heartplate`
- `Hollow Bell Core`

These come from:
- `Raid Hunt: Leviathor of the Coiling Deep`
- `Raid Hunt: Ashen Gate Tyrant`
- `Raid Hunt: Bell Warden of the Hollow Choir`

Current intent:
- these proofs are fixed and guaranteed on meaningful clear
- they replace the older generic `ancient-core` / `tower-crest-fragment` stand-in requirements
- the broader raid combat model still needs deeper encounter implementation later
- Orin Crest now serves as the first notice gate and posts these hunts to the board for `A -> S`

## Candidate First Raid Thread

The current best first seeded candidate is:
- `Raid Hunt: Leviathor of the Coiling Deep`

Reason:
- already documented as a raid-class placeholder
- already feels worthy of black-ledger treatment
- already points toward proof-worthy monster identity rather than normal floor trash

This should be treated as:
- a design anchor
- not yet final implementation

## Current Build Order

1. Lock the raid system rules
2. Define the first 3 proof items for `A -> S`
3. Bind `A -> S` to those proofs
4. Deepen the first actual raid encounter slice
5. Rewrite `S -> SS` around harsher raid proofs

## Immediate Follow-Up

Leviathor is the current live anchor.

Next raid TODO:
- bring `Ashen Gate Tyrant` up to Leviathor's current standard
- bring `Bell Warden of the Hollow Choir` up to Leviathor's current standard

That means both still need:
- true live multi-phase raid flow
- catastrophe pressure
- raid-specific suggested supplies
- escalating self-buff identity
- dossier and aftermath polish equal to Leviathor

## Guardrails

Do not:
- make proofs random drops
- flatten raids into ordinary boss fights
- make `A -> S` feel easier to understand but less special than `B -> A`
- let the proof hand-in replace the formal promotion aftermath

Do:
- make raids feel famous
- make proofs feel undeniable
- make the promotion feel institutional and ceremonial

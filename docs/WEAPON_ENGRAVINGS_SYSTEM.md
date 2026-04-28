# Weapon Engravings System

Use this file when designing or reviewing weapon engravings.

## Naming Rule

`Engraving` is the action.

The thing placed into a weapon socket should be referred to as a `Forge Mark`.

- player gets or earns a `Forge Mark`
- forge service engraves that mark into a weapon socket
- some rare weapons may already come with one or more sockets pre-marked

## Core Rule

Engravings are a weapon-bound enhancement layer.

- an engraving belongs to a specific weapon
- it is not a free-floating insert that moves between weapons at no cost
- it should deepen that weapon's identity, not turn into a generic socket system

## Permanence Rule

Engravings should feel committed, but not destructive.

- engravings are not freely swappable during ordinary play
- changing or removing an engraving should go through a guild forge/rework service later
- forge rework should cost materials, gold, or both
- players should not be punished with fully irreversible permanent mistakes for reasonable experimentation

So the intended feel is:
- `Seals` = flexible and tactical
- `Engravings` = committed and weapon-specific

## Grade Access Rule

Baseline engraving access:

- `common`
  - no engravings
- `rare`
  - no engravings by default
  - special named exceptions may have `1`
- `epic`
  - normally `1-2` engravings
  - very special exceptions may reach `3`
- `legendary`
  - normally `1-4` engravings
  - very special exceptions may reach `6`

Do not flatten all weapons into the same engraving count.
The count should support weapon identity and rarity fantasy.

## Weapon Proficiency Rule

Weapon proficiency scaling is a global weapon rule.

- it applies to all weapons
- it is not special-cased for dev weapons, legendary weapons, or named weapons
- if the wielder is below the weapon's required level, the weapon still works, but its effective stats scale up gradually with the wielder's level
- it reaches full effectiveness at the required level
- combat math and weapon preview surfaces should use the same shared proficiency rule

## Visual Rule

Engravings should read as part of the weapon, not a second UI box.

Preferred presentation:
- a slim socket row on the weapon card
- filled sockets should show the applied Forge Mark
- empty sockets should remain visibly empty
- subtle etched/rune treatment near the weapon art or frame
- clickable for detail and lore

Avoid:
- huge separate engraving panels on first presentation
- making engravings visually louder than the weapon itself

## Content Rule

Engraving names should sound like guild records, forge marks, oath cuts, ward records, or war names.

Good engraving naming:
- tied to a deed, office, ward, or recorded feat
- sounds like something a guild forge or captain would actually call it

Weak engraving naming:
- generic MMO gem names
- abstract magic labels with no world tie

## Prototype Rule

Before the full engraving system exists:
- it is acceptable to prototype engravings on notable NPC weapons
- use those prototypes to establish:
  - visual treatment
  - naming tone
  - rarity expectations
  - weapon identity feel

Current prototype:
- `High-Ward Centerbreaker`
  - epic weapon
  - `2` sockets
  - `Standfast` as a filled Forge Mark
  - effect: `+2 ARM for 2 turns the first time the bearer drops below half health in battle`
  - `1` empty socket
  - used on `Sable Renn` to establish the first visible weapon-socket treatment

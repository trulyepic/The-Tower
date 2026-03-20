# Floor 3 Merchant Branch

## Purpose

This document records a planned Floor 3 consequence branch so we do not lose it while finishing Floor 2.

The branch is tied to a player-facing NPC choice.

## Core Rule

On Floor 3, the player will face an NPC choice that affects when and how a hidden merchant enters the guild ecosystem.

### Favorable Choice

If the player makes the favorable choice:
- they gain access to the merchant early
- the merchant appears before the usual unlock point
- the merchant sells unusually strong weapons and sigils for this stage of the game
- prices are the merchant's normal premium, not punitive

### Unfavorable Or Alternate Choice

If the player makes the alternate choice:
- the merchant still appears later
- the merchant does not properly open until `Level 8`
- the same inventory is available later
- prices are significantly more expensive
- the player is not locked out of the merchant forever, only delayed and penalized

## Design Intent

This branch should reinforce the game's larger rule:
- choices matter
- the world reacts
- but the player is not hard-locked out of progress

The favorable path rewards trust, judgment, or restraint.
The alternate path preserves freedom, but makes the consequence tangible through timing and cost.

## Merchant Identity

Planned merchant fantasy:
- not a normal guild quartermaster
- rare stock
- strange sigils
- weapons with more personality than standard board/store gear
- someone who feels like a contact you earn rather than a default menu vendor

## Inventory Direction

The merchant should specialize in:
- visually distinctive weapons
- rare sigils
- unusual combat-shaping purchases
- gear that feels like a step toward the deeper climb rather than generic stat filler

## Implementation Rule

When this is built:
- document the exact NPC choice that controls the branch
- add a dev tool to preview both outcomes immediately
- make the merchant consequence visible in both:
  - guild NPC/world state
  - merchant pricing / unlock timing

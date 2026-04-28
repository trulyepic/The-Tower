# Sigil Visual Armor System

Status: Active system rule.

Use this file when changing:
- sigil item definitions
- player avatar rendering
- equipped sigil visuals
- armor/defense from sigils
- sigil-related UI in Home, Class, Inventory, and live combat

## Core Rule

Sigils are no longer just invisible buff math.

They should do two things at the same time:
- change the player's visual avatar shell
- grant passive armor while equipped

This is separate from any timed active-sigil bonus behavior.

## Baseline Portrait Rule

Player portraits should use a shared baseline look:
- default portrait shell is a square frame
- if no sigil is equipped, the player stays in the default square shell

Do not hardcode one-off portrait frames per screen for the player avatar.

## Sigil Frame Rule

Equipping a sigil should change the avatar shell.

The shell should communicate:
- that a sigil is equipped
- what kind of sigil visual identity is active
- how much armor the equipped sigils are granting

Standing direction:
- the dominant equipped sigil controls the shell style and accent color
- total equipped sigil armor controls how many armor accents appear on the portrait
- the sigil shell replaces the default portrait frame instead of sitting inside it
- when multiple sigils are equipped, up to three should stack as layered shells so the portrait reads reinforced rather than cluttered
- each sigil family should also carry a subtle motif beyond outline shape
  - diamond families can use etched linework
  - crest families can use inset plates or heraldic nodes
  - hex families can use faint rune lines or corner anchors
- sigil colors should respect rarity language
  - common: muted bronze / iron / worn lacquer tones
  - rare: cooler blue family tones
  - epic: violet / arcane tones
  - legendary: gold / royal tones

## Armor Accent Rule

Armor should be visible on the portrait itself.

Use accent pips or markers around the avatar shell:
- 1 armor = 1 accent
- 4 armor = 4 accents
- cap the visible accents if needed for layout, but keep the visual count tied to armor

The accents do not need to be gold.
Their color should come from the dominant sigil visual profile.

Small portraits should not be buried under text.

Standing direction:
- large portraits can show a fuller armor badge
- small portraits should use compact armor markers or compact corner badges instead of wide text labels

## Combat Rule

Equipped sigils grant passive armor even when their timed bonus is not active.

That means:
- timed sigil activation can still control temporary offensive / tempo / utility effects
- armor stays on while the sigil is equipped

Standing direction:
- armor should reduce incoming damage in live turn-based combat
- Home / Class / live combat stats should surface armor as a real stat
- sigils are primarily defensive gear, not mini-weapons
- only legendary sigils may grant a small attack edge
- quest-success bonuses should be limited to epic and legendary sigils

## Shared Component Rule

Use one shared player portrait component for sigil visuals.

Do not duplicate the logic separately in:
- Home
- Class
- Inventory
- Quests / live combat

If the player portrait changes in one place, it should change everywhere the shared component is used.

Sigil item icons and avatar shells should follow the same family standard.

If the icon language is updated, the equipped avatar shell should be updated to match rather than drifting into a separate design.

## Slot Interaction Rule

Empty sigil slots must not be dead UI.

Standing direction:
- tapping an empty sigil slot should open a real equip flow
- current implementation should route directly to the Inventory `Sigils` tab

## Appearance Preference Rule

Players should be able to separate sigil visuals from sigil stats.

Standing direction:
- players can keep the dynamic sigil shell look
- or switch to the default portrait frame while still showing armor markers
- players can also pin one owned sigil as their cosmetic appearance shell regardless of which sigils are equipped for stats

## Inventory Rule

Equippable inventory items should be equippable from `All Items`, not only from their dedicated tabs.

Dedicated tabs can remain for cleaner browsing, but `All Items` should still act like a complete bag surface.

## Dev Testing Rule

Whenever the sigil visual system changes:
- add or keep dev sigils in the Guild Store
- make them cheap or free for fast testing
- give them clearly different shell identities and armor values

## Current Direction

Minimum implementation bar:
- default square portrait with no sigil
- sigil-equipped portrait shell
- armor accents tied to armor value
- passive armor in combat math
- free dev sigils in the store

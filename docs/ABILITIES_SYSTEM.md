# Abilities System (V1)

## Goal

Add class-specific active abilities that provide tactical bonuses for the next quest/tower attempt.

## Core Rules

- Each class has 1 core ability in V1.
- Ability activation costs `Focus`.
- Ability enters cooldown after it is consumed by an action.
- Activated ability is stored as `pendingAbilityId` and applies to the **next** quest or tower run only.
- If player starts a quest/tower without activating, no ability bonus is applied.

## Resource: Focus

- `focusCap = 12`
- Start with `focus = 12`
- Regen: `+1` every 3 minutes (passive)
- Focus is separate from stamina.

## Ability Data

Per ability:

- `id`
- `classId`
- `name`
- `description`
- `icon`
- `focusCost`
- `cooldownSeconds`
- `bonuses`:
  - `questSuccessFlat`
  - `towerSuccessFlat`
  - `damageFlat`
  - `critFlat`
  - `speedFlat`

## V1 Abilities

- Warrior: `Guard Break`
  - +7 quest success, +7 tower success, +5 damage
- Ranger: `Scout Path`
  - +8 quest success, +6 tower success, +4 speed, +2 crit
- Mage: `Arcane Surge`
  - +9 quest success, +8 tower success, +4 crit, +3 damage

## Calculation Integration

### Quest

`finalChance += pendingAbility.bonuses.questSuccessFlat`

### Tower

`finalChance += pendingAbility.bonuses.towerSuccessFlat`

### Combat Profile display

Damage/Crit/Speed should include pending ability bonuses in source breakdown line.

## Consumption Flow

1. Player activates class ability.
2. Focus reduced by `focusCost`.
3. `pendingAbilityId` set.
4. On quest start or tower challenge:
   - apply pending bonuses
   - clear `pendingAbilityId`
   - set cooldown timestamp

## UI (V1)

### Camp

- Show ability card with:
  - name, description
  - focus cost
  - cooldown remaining
  - pending/ready state
  - activate button

### Class

- Show class ability summary and bonuses.

### Guild (Quest/Tower)

- Show `Pending Ability` chip when active.
- Success chance preview reflects pending ability.

## Persistence

Character fields:

- `focus`
- `focusCap`
- `focusLastTickAtMs`
- `pendingAbilityId`
- `abilityCooldownsUntilMs`

Migration defaults for existing saves:

- `focus = 12`
- `focusCap = 12`
- `focusLastTickAtMs = now`
- `pendingAbilityId = null`
- `abilityCooldownsUntilMs = {}`

## Next (V2)

- Ability loadouts (more than 1 per class)
- Ability levels and upgrade paths
- Tower phase-level ability timing windows
- Ability interactions with titles and weapon archetypes

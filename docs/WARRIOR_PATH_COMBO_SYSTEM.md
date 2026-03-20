# Warrior Path Combo System

## Goal

Build a path-locked Warrior progression where players:
- see the full Knight/Berserker roadmap before committing,
- train through shared Warrior progression first, then choose one branch at Level 15,
- equip active skill + passive loadout,
- gain major power when chosen passives synergize with the active skill.

## Skill vs Ability

- Skill: Active class action (focus cost + cooldown + primed effect).
- Ability: Passive effect (always on when equipped).

## Branch Rules

- Level 1-7: Shared Warrior progression only.
- Level 8-14: branch skills are visible in the tree as future specialization rewards, but remain locked.
- Level 15: player receives an NPC guidance notice and then chooses one branch:
  - Knight
  - Berserker
- Branch choice becomes locked after the Level 15 specialization choice.
- Non-chosen branch remains visible in UI as unavailable so the player still understands full progression.

## Unlock Timeline (Warrior)

- Lv 1 (Shared Skill): Iron Will
- Lv 4 (Shared Passive): Combat Discipline
- Lv 8 (Path Training Skill):
  - Knight: Bulwark Oath
  - Berserker: Bloodrush
- Lv 12 (Shared Skill): Steel Rhythm
- Lv 12 (Branch Passive):
  - Knight: Shield Doctrine
  - Berserker: Frenzy Instinct

## Combo Tags

Each skill/ability has tags. Example:

- Knight lane tags: `guard`, `counter`, `resolve`
- Berserker lane tags: `rage`, `execution`, `bleed`
- Shared tags: `discipline`, `guard`, `resolve`

### Combo Resolution

- Active skill checks overlap with equipped passive tags.
- Each overlapping passive grants 1 synergy stack.
- Synergy stack bonuses:
  - +2 Damage
  - +1 Crit
  - +1 Speed
  - +2% Quest Success
  - +2% Tower Success

This keeps build quality meaningful: random passive choices are weaker than intentional combos.

## Loadout Rules

- Active Skill: 1 equipped at a time (for this phase).
- Passive Abilities: up to 2 equipped (for this phase).
- Skill prime still consumes focus and obeys cooldown.
- Passives and combo bonuses are always applied while equipped.

## UI Requirements

### Class Path Screen

- Show full path tree:
  - Shared lane
  - Knight lane
  - Berserker lane
- Each node shows:
  - unlock level,
  - type (Skill/Passive),
  - combo tags,
  - current state:
    - Unlocked
    - Locked by level
    - Locked by branch

### Level 15 Specialization UX

- At Level 15, show NPC-guidance notification for final specialization.
- Before Level 15, show both lanes as future branch progression.
- After specialization, lock and mark opposite lane as unavailable.

### Loadout UX

- Select active skill from unlocked skills.
- Toggle equipped passives from unlocked passives.
- Display current synergy stacks and resulting bonuses.

## Integration Notes

- Passives affect combat profile and success calculations.
- Primed skill bonuses are applied in next quest/tower resolution.
- Combo bonuses apply to both passive baseline and primed skill snapshot.

## Deferred

- Multi-active-skill slots at higher levels.
- Lv 16/Lv 20 nodes + promotion trial coupling.
- Respec token system.

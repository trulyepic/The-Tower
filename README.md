# The Tower

Mobile-first RPG where players build an adventurer, run quests, gear up through the guild, activate buffs, and climb a multi-floor tower.

## Current Scope

- Character creation with class and avatar selection
- Camp, Inventory, Guild (Quest Board / Store / Tower), and Class tabs
- Weapons with rarity, level requirement, and proficiency scaling
- Buff system with equip, activate, deactivate/resume, and saved timer
- Quest rewards (gold/xp/mastery/items) and tower floor progression

## Tech

- Expo + React Native + TypeScript
- Local persistence for dev iteration
- Shared monorepo-style workspace (`apps/`, `packages/`, `docs/`)

## Run Locally

```bash
npm install
cd apps/mobile
npx expo start
```

Then choose:
- `w` for web preview
- `i` for iOS simulator

## Project Docs

- [Roadmap](/Users/kin/web-rpg/docs/ROADMAP.md)
- [Tower Battle Phases](/Users/kin/web-rpg/docs/TOWER_BATTLE_PHASES.md)
- [Quest System Spec](/Users/kin/web-rpg/docs/QUEST_SYSTEM_SPEC.md)

## Structure

```text
web-rpg/
  apps/
    mobile/
  packages/
    shared/
  docs/
  weapons-assets/
```

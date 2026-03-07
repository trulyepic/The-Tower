# PROJECT BLUEPRINT (Living Document)

Last updated: 2026-03-05
Owner: Product + Engineering
Status: Active planning baseline

## 1. Vision

Build a mobile-first RPG where players grow an adventurer through quests and daily activities, progressing from base classes into advanced classes/jobs over time.

Core player fantasy:
- "I have a character identity."
- "I make meaningful long-term progression every day."
- "Unlocking new classes/jobs changes how I play."

## 2. Product Pillars

- **Identity & Buildcraft**: class choices, class fantasy, stat identity.
- **Daily Progression**: quick async actions that still feel meaningful.
- **Long-Term Mastery**: class advancement paths and job specializations.
- **Live Expandability**: easy addition of new classes/jobs/quests after launch.

## 3. Core Gameplay Loop (MVP)

1. Choose/maintain a class build.
2. Spend stamina to start an activity (quest/training/gathering).
3. Wait for timer or complete session activity.
4. Claim server-validated rewards.
5. Allocate gains (level, gear, skill unlocks).
6. Repeat with daily/weekly objectives.

## 4. Class System (Now + Future)

### 4.1 Base Classes (Launch Target)

Example launch set:
- Warrior
- Ranger
- Mage

Each class has:
- Stat bias (e.g., STR/AGI/INT)
- Passive trait
- Skill starter kit
- Content tags (which quests/activities get bonuses)

### 4.2 Advanced Classes / Jobs

At progression milestones (example: level 20 + class quest completion), players can branch into advanced paths.

Examples:
- Warrior -> Knight / Berserker
- Ranger -> Assassin / Beastmaster
- Mage -> Sorcerer / Cleric

Each job should:
- Preserve core identity of base class.
- Add a unique mechanic (combo, summon, shield, crit loop, etc.).
- Unlock new skill trees and quest modifiers.

### 4.3 Adding New Classes Over Time

Design for data-driven expansion:
- New class metadata in database/config tables.
- Skill trees and unlock requirements as content data.
- Minimal hardcoded logic in frontend.
- Backend validation references class/job IDs and rule tables.

## 5. Progression Model

- Character level + class mastery level.
- XP curves per phase (early/mid/endgame).
- Stat growth and equipment scaling.
- Job unlock gates:
  - Level threshold
  - Prerequisite quests
  - Optional resource/token cost

## 6. Activities & Content Types

- **Quests (async)**: timed missions, primary XP source.
- **Training (async)**: class mastery/stat-focused growth.
- **Gathering (async)**: resource farming for crafting/upgrades.
- **Daily Objectives**: rotating goals to drive retention.
- **Class Trials**: unlock/advance jobs.

## 7. Mobile-First Requirements

- One-handed primary flows (bottom nav, thumb zones).
- Quick sessions (30 seconds to 3 minutes for common actions).
- Large tap targets, low friction claim/start loops.
- Offline-tolerant reads and resilient retry patterns.
- Push notifications for completion, stamina cap, daily reset.
- Performance budget for low/mid-tier devices.

## 8. Technical Architecture (Recommended)

### Frontend
- React Native + Expo + Expo Router
- State/query layer for cache and optimistic updates
- Shared contracts imported from `packages/shared`

### Backend
- Supabase (Postgres/Auth/RLS/Edge Functions/Realtime)
- Server-authoritative reward and progression calculations
- Event tables for auditability and balancing analysis

### Shared Package
- TypeScript domain models
- Formula modules (XP, stamina, drop weights)
- API request/response DTOs

## 9. Why Both Frontend + Backend

Needed for:
- Anti-cheat and economic integrity
- Secure reward validation
- Consistent timers and resets
- Live content updates and balancing
- Analytics and live ops

## 10. Milestone Plan

### Milestone 0: Foundation (Week 1)
- Repo scaffolding and standards
- Shared domain contracts
- Initial DB schema and auth
- CI/lint/test baseline

### Milestone 1: Vertical Slice (Weeks 2-3)
- Character creation + base class selection
- Quest board + start/claim loop
- Reward/XP flow with backend validation
- Inventory + level-up feedback

Current status:
- Local mobile mock of class selection and quest start/claim loop is implemented.
- Progression (level + mastery) and daily task progress are wired in client state.
- Next step is replacing local state transitions with backend-backed API calls.

### Milestone 2: Retention Layer (Weeks 4-5)
- Daily objectives + streaks
- Push notifications
- Basic balancing/admin knobs
- Early telemetry dashboards (D1/D7 funnel)

### Milestone 3: Class Advancement (Weeks 6-8)
- Job unlock questline
- Advanced class branching
- New skill tree UI
- Class-specific content modifiers

## 11. Engineering Standards (Long-Term Maintainability)

- Monorepo with clear app/package boundaries.
- Domain-first modules with explicit interfaces.
- Database migrations versioned and reviewed.
- Feature flags for content rollout.
- Every gameplay formula covered by unit tests.
- API contracts versioned and validated.
- Observability baseline: logs, errors, key business events.

## 12. Initial Backlog (Priority Order)

1. Confirm launch base classes and stat identities.
2. Define level and mastery XP curves (v1 sheet).
3. Finalize quest reward formula (gold/xp/loot ranges).
4. Design first 15 quest templates with class tags.
5. Implement character + class domain models.
6. Implement server quest start/claim APIs.
7. Build mobile home/quest/inventory screens.

## 13. Open Decisions

- Exact number of launch base classes (3 vs 4).
- Level gate for first job unlock (example: 20 or 25).
- Session combat in MVP or post-MVP.
- PvP timing (not in MVP recommended).

## 14. Update Protocol

Whenever scope or mechanics change:
1. Update this blueprint first.
2. Add/adjust backlog items.
3. Record date and short "Change note" below.

### Change Notes

- 2026-03-04: Initial blueprint created with class and advanced job progression path.
- 2026-03-05: Added first mobile vertical slice implementation (class selection + quest loop mock state).
- 2026-03-05: Added mobile tab shell (Home/Quests/Inventory/Class), local state persistence, and service-layer abstraction for backend swap.
- 2026-03-05: Redesigned questing around solo adventurer runs with item-based success chance, gather quests, and timer/success meters.

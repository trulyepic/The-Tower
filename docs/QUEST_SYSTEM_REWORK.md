# Quest System Rework

Status: planned design spine for the next major gameplay rework.

Use this file as the implementation source of truth for quest-board flow, journal behavior, quest-state rules, and NPC/board integration.
When this file conflicts with older quest notes, follow this file for future implementation slices.

Related:
- `docs/QUEST_SYSTEM_SPEC.md`
- `docs/QUEST_REFINEMENT_NOTES.md`
- `docs/QUEST_BATTLE_REWORK.md`
- `docs/NPC_QUESTLINE_TRACKER.md`
- `docs/SEQUENTIAL_CONTENT_PLAN.md`
- `docs/ROADMAP.md`

## Why This Rework Exists

The current quest system works, but it is still too split across:
- generic board quests
- NPC side-story requests
- time-sensitive narrative quests
- journal summaries
- one-off special handling in state/UI

That causes a few recurring problems:
- player-facing quest states are not always clear
- time-sensitive quests feel custom instead of systemic
- board flow and journal flow do not always communicate the same truth
- NPC questlines can outgrow the current board/journal model

The goal of this rework is not to throw away the current system.
The goal is to turn the current working pieces into one consistent game-facing quest structure.

## Rework Goals

1. Make the Quest Board easier to understand at a glance
2. Make the Quest Journal better at answering:
   - what did I do
   - what is pending
   - when do I return
3. Make time-sensitive quests reusable instead of one-off logic
4. Make NPC questlines and board quests feed the same state model
5. Keep future `Hunt` and `Wanted` content compatible without forcing them in too early

## Player-Facing Structure

### 1. Quest Board

The board should separate work into clear groups instead of mixing everything together.

Planned board groups:
- `Jobs`
  - repeatable or grounded guild work
  - resource farming
  - floor support preparation
- `Story Contracts`
  - named NPC or narrative-linked quest work
  - may still be taken from the board, but should feel more important
- `Urgent`
  - time-sensitive contracts
  - visible countdowns
  - permanent consequence warnings
- `Special`
  - rank trials
  - rescue operations
  - story event contracts that do not behave like normal jobs
- `Future Tabs`
  - `Hunt`
  - `Wanted`
  - remain scaffolded until their real implementation phase

### 2. Quest Journal

The journal should behave like a memory log, not a quest spreadsheet.

Each tracked thread should primarily show:
- short summary
- `Done`
- `Pending`
- status

If timing is known:
- show the next expected action clearly

If timing is intentionally unknown:
- show `??`

This is especially important for recurring NPC threads:
- Aldric after failure/refusal
- future Lyra returns
- later long-gap questline callbacks

## Core Quest State Model

Every quest/thread should map into a shared state language.

Planned shared states:
- `discovered`
- `available`
- `accepted`
- `active`
- `paused`
- `follow_up`
- `timed_out`
- `failed`
- `refused`
- `completed`
- `archived`

### Meaning

- `discovered`
  - player has heard of it, but cannot take it yet
- `available`
  - player can take it now
- `accepted`
  - player committed, but has not entered the actual action phase yet
- `active`
  - currently running
- `paused`
  - intentionally suspended by system or player flow
- `follow_up`
  - main action is done, return/report step remains
- `timed_out`
  - quest deadline expired
- `failed`
  - action resolved unsuccessfully
- `refused`
  - player explicitly declined it
- `completed`
  - thread segment is done cleanly
- `archived`
  - journal keeps it as history, but it is no longer part of active tracking

## Time-Sensitive Quest Rules

Time-sensitive quests need to become a reusable system, not a custom Aldric exception.

### Shared rules

1. Accepting the quest starts the real deadline
2. The board must show the countdown clearly
3. The journal must reflect the urgency clearly
4. If time expires:
   - the quest does not just silently fail
   - the state changes to `timed_out`
   - a consequence event/log should explain what happened

### Journal rule

For urgent quests:
- if still actionable, `Pending` should be specific
- if the urgent thread moves offscreen into later consequences, `Pending` can become `??`

### Aldric as the model case

Aldric is the first real test case for this system:
- accept -> timer begins
- ignore deadline -> tragic consequence path
- refusal -> different branch consequence path
- success -> allied branch path

Future NPC quests can reuse the same deadline model with different outcomes.

## NPC Questline Integration

NPC quests should not feel detached from the board.

Planned rule:
- an NPC thread may begin in dialogue
- but if the action becomes formal guild work, it should appear in the board/journal system consistently

### Example flow

1. NPC request
2. player accepts or refuses
3. if accepted, board contract appears or activates
4. journal thread updates
5. return/report step becomes `follow_up`
6. long-gap future consequences remain journal-tracked

This is already partly true for:
- Tamsin
- Aldric
- Lyra

The rework should make that structure explicit and reusable.

## Content Categories

### Jobs

Purpose:
- low-drama guild work
- farming
- floor prep

Traits:
- lower narrative weight
- often repeatable or replacable
- should support economy and progression

### Story Contracts

Purpose:
- NPC-linked or narrative-heavy contracts

Traits:
- stronger identity
- clearer consequences
- often tracked in the side-quest journal even when boarded

### Urgent

Purpose:
- visible pressure
- permanent branch consequences

Traits:
- countdown
- stronger warning language
- special failure/timed-out reporting

### Special

Purpose:
- non-standard encounters
- rank trials
- rescue missions
- limited scripted battle structures

Traits:
- may use custom battle flow
- should still resolve through the quest/journal state system

## Quest Combat Rule

Quest structure and quest combat are separate concerns.

Board / journal / state rules live in this document.
Combat resolution rules for battle-heavy contracts live in `docs/QUEST_BATTLE_REWORK.md`.

High-level rule:
- `gather` quests can keep the lighter resolve model
- combat-facing `adventure`, `dungeon`, and future `hunt` / `wanted` quests should move onto the live turn-based battle system

## Journal Display Rules

### Completed or stable threads

Show:
- short summary
- what was done
- `Pending: complete`

### Follow-up threads

Show:
- what main action completed
- exact return/report instruction

### Unknown-return threads

Show:
- what happened
- `Pending: ??`

Do not invent a fake next instruction if the story intentionally has a gap.

## Future Compatibility

### Hunt

Not a priority for immediate implementation, but the rework should leave room for:
- target tracking
- contract-style monster pursuit
- repeatable or semi-repeatable encounters

### Wanted

Also not immediate, but the system should support:
- named outlaw targets
- world consequence targets
- board notices that connect to later narrative returns

This matters because Aldric already points toward a future `Wanted`-style board rhythm.

## Immediate Implementation Order

### Slice 1: Board Structure Cleanup

Goal:
- make current board categories clearer without rebuilding everything at once

Targets:
- current jobs
- urgent contract presentation
- special quest presentation

### Slice 2: Shared Quest State Cleanup

Goal:
- formalize accepted / active / follow_up / timed_out / refused / completed

Targets:
- Aldric
- Tamsin
- Lyra

Current implementation note:
- this slice now starts with a player-facing journal normalization pass
- Aldric, Lyra, and Tamsin map into one shared state language in the Side Quest Ledger
- deeper runtime quest flags remain partially quest-specific for now and will be normalized later

### Slice 3: Journal Rewrite

Goal:
- unify `Done` / `Pending` / status rules across tracked side threads

### Slice 4: Reusable Time-Sensitive Runtime

Goal:
- make Aldric-style deadline logic reusable for future NPC quests

### Slice 5: Future Hunt/Wanted Hooks

Goal:
- leave clean placeholders in system/data without prematurely building the full content

## Current Recommendation

The first implementation slice after this doc should be:

1. `Quest Board Structure Cleanup`

Reason:
- it is the most visible player-facing improvement
- it sets up urgent/special/story presentation before deeper state rewiring
- it avoids jumping straight into low-level state changes without first fixing the surface structure

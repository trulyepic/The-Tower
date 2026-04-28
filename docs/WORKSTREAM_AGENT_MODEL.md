# Workstream Agent Model

Status: Planning policy for parallel game-dev work.

Use this file when the project needs multiple concurrent owners plus explicit review lanes.

## Purpose

The game is large enough that one person should not hold every todo in their head at once.

We need:
- a few focused build lanes
- at least two review lanes
- a shared sync rule so docs and implementation stay aligned

This is a process document, not a gameplay system.

## Build Lanes

### Combat / Rank Lane

Owns:
- rank trials
- live combat
- duel parity
- combat pouch behavior
- combat presentation rules

Typical outputs:
- duel mechanics updates
- rank-trial docs
- battle UI coherence notes

### Story / NPC Lane

Owns:
- guild hall reactions
- examiner continuity
- NPC questline updates
- story handoffs tied to gameplay unlocks

Typical outputs:
- NPC arc docs
- story consequence notes
- hall reaction sync notes

### Progression / Economy Lane

Owns:
- rank progression
- floor progression
- sigil/title slot growth
- store economy and item pacing

Typical outputs:
- progression docs
- unlock-rule notes
- pacing warnings

## Review Lanes

### Review Lane A

Purpose:
- check gameplay consistency
- check mechanical coherence
- flag systems that fight the game's language

Typical questions:
- does this fit the battle model?
- does this look like an actual game rule or a stray gimmick?
- does the UI read the same way in all relevant screens?

### Review Lane B

Purpose:
- check doc sync
- check roadmap sync
- check TODO drift
- catch cases where a new feature is added but the planning docs are stale

Typical questions:
- did the change get recorded in the right planning doc?
- did the sequential plan still reflect reality?
- are there duplicate or conflicting TODOs?

## Operating Rules

1. One owner per lane for active work.
2. Do not have two lanes edit the same file set without coordination.
3. Every substantive combat change gets a build pass plus two review passes.
4. If implementation and docs disagree, update the docs immediately.
5. If a new idea fights the established game language, push back before writing code.
6. Keep the workstream names stable so future TODOs can be assigned cleanly.

## Suggested Default Split

- Lane 1: combat/rank implementation
- Lane 2: story/NPC integration
- Lane 3: progression/economy sync
- Review A: gameplay consistency
- Review B: docs/roadmap sync

## Escalation Rule

If a lane uncovers a conflicting design direction:
- stop
- write the conflict into the planning docs
- resolve the design before broad implementation continues


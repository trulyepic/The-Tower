# NPC Questline Tracker

Use this file to track the state of every major recurring NPC questline.
Each dedicated questline document should capture the full arc, branch outcomes, floor return points, ending impact, and implementation status.

## Current Rule

- Every NPC questline we begin should get its own dedicated doc.
- This tracker is the quick-reference index.
- The dedicated doc is the canon source for the actual arc.

## Active Questlines

### Tamsin Vale
- dedicated doc:
  - [TAMSIN_VALE_QUESTLINE.md](/Users/kin/web-rpg/docs/TAMSIN_VALE_QUESTLINE.md)
- current status:
  - `Phase I complete`
- current implementation status:
  - `Implemented in-game`
- current player-facing arc:
  - first guild contact
  - first branch read
  - `Tamsin's Snagline Recovery`
  - thorn-notes follow-up
- next return point:
  - `Later Floor 2 / early mid-floor corridor content`
- notes:
  - Tamsin is considered complete for now and should resume when the next thorn-lane phase starts.

### Aldric Vale
- dedicated doc:
  - [ALDRIC_VALE_QUESTLINE.md](/Users/kin/web-rpg/docs/ALDRIC_VALE_QUESTLINE.md)
- current status:
  - `Core branch canon defined`
- current implementation status:
  - `Early-state + branch persistence`
- current player-facing arc:
  - initial plea for help
  - time-sensitive rescue setup
  - first branch persistence:
    - refused
    - too late
    - saved
- next return point:
  - `Aldric v1.1: urgency + first dark-path breadcrumb`
- notes:
  - Aldric is one of the most important long-running consequence NPCs in the story.
  - His route now has early branch persistence and should continue in explicit staged slices.
  - The current breadcrumb slice now includes the Watchtrail Butcher placeholder on the Quest Board for daughter-loss routes.
  - If the player kills the bandit leader later before Aldric's final route resolves, Aldric should gain limited redemption-choice moments rather than staying purely fixed.
  - Aldric's rescue is now defined as a special two-stage flow:
    - plea acceptance starts the rescue deadline
    - board launch starts the short bandit encounter

### Lyra Ashstep
- dedicated doc:
  - `TODO`
- current status:
  - `Phase I active`
- current implementation status:
  - `Partially implemented`
- current player-facing arc:
  - first in-floor contact
  - trust / refusal split
  - `Lyra's Ember Map Recovery`
- next return point:
  - `Next Lyra phase after current Floor 2 work settles`
- notes:
  - Lyra also needs a dedicated questline doc, but Aldric takes priority right now.

## Planned Future Questlines

- future follower questlines
- future faction-linked clergy and apostolic-veiled NPC arcs
- future hunt-target and wanted-adventurer arcs when those systems go live

## Shared Systems These Questlines Depend On

- affinity-driven choice restriction
- time-sensitive quest expiration
- recurring NPC reappearances across multiple floors
- ending-state influence
- ally / saboteur / neutral recurring role tracking

# NPC Questline Tracker

Use this file to track the state of every major recurring NPC questline.
Each dedicated questline document should capture the full arc, branch outcomes, floor return points, ending impact, and implementation status.

## Current Rule

- Every NPC questline we begin should get its own dedicated doc.
- This tracker is the quick-reference index.
- The dedicated doc is the canon source for the actual arc.
- Every story NPC must support:
  - the intended path
  - a late path if the player reaches later progress first
  - an ignored or alternate path if the player skips the NPC's early help
- NPCs must react to what the player actually accomplished, even when the player did not
  follow the ideal introduction order.

## Active Questlines

### Tamsin Vale
- dedicated doc:
  - [TAMSIN_VALE_QUESTLINE.md](/Users/kin/web-rpg/docs/TAMSIN_VALE_QUESTLINE.md)
- current status:
  - `Phase III active`
- current implementation status:
  - `Implemented in-game`
- current player-facing arc:
  - first guild contact
  - first branch read
  - `Tamsin's Snagline Recovery`
  - thorn-notes follow-up
  - first Thorn Corridor report
  - deeper corridor warning after the Floor 2 sub-boss push
- next return point:
  - `Later Floor 2 / early Floor 3 corridor pressure`
- notes:
  - Tamsin's first corridor-report phase is now live.
  - Her deeper-corridor warning phase is now live after the Floor 2 sub-boss push.
  - Her next return should wait for the next real route-pressure complication instead of reopening her immediately again.

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

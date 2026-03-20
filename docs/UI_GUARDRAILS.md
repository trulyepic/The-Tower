# UI Guardrails

These are resolved UI decisions that should not regress during later refactors.

## Tower HUD

- When the player is inside an entered tower run, the combat HUD must include:
  - player health meter
  - player focus meter
  - active status/effect icon row
  - hover/tap readout text for those status/effect icons
- Live battle skill buttons must respect real battle availability:
  - enough `Focus`
  - cooldown finished
- Battle status hints must stay inside the battle UI.
  - do not reuse the broader page-level hover hint path for battle-only statuses.
- On tower failure, do not jump straight to `The Tower Casts You Out`.
  - First show the full wave/battle review.
  - Let the player inspect their status and the enemy state.
  - Only after the player confirms should the cast-out message appear.
- Do not restore older mechanic-preview text like:
  - `counter missing`
  - `counter ready`
- Entered tower wave cards should use the newer scout-card visual language unless explicitly redesigned.

## Enemy Info

- If the player's level is lower than the enemy's level, enemy HP should remain hidden as `???/???`.
- Enemy dossier/dialog content must be scrollable without clipping the bottom of the modal.
- Do not reveal hidden enemy HP elsewhere in the same battle card after masking it in the meter.

## Visual Direction

- Prefer larger creature/weapon art over extra framing.
- Avoid adding extra borders or nested bordered boxes unless specifically needed.

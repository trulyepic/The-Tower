# AGENTS.md

## Asset Workflow

All new or replacement game assets must follow this workflow.

1. Update the correct local asset under `apps/mobile/assets/...`
2. Upload the same asset to S3
3. Wire the app to the correct asset key/path
4. Verify the asset renders in the game

Do not stop after only updating a local asset.
Do not stop after only uploading to S3.
Both local and S3 must be updated unless the user explicitly says otherwise.

## S3 Configuration

- AWS profile: `tower-assets`
- AWS region: `us-west-1`
- S3 bucket: `the-tower-game-assets-v01`
- Asset prefix: `mobile-assets`
- Public asset base URL:
  - `https://the-tower-game-assets-v01.s3.us-west-1.amazonaws.com/mobile-assets`

## S3 Usage Rules

- Expo/Metro bundled image `require(...)` paths must point to files inside `apps/mobile/assets/...`
- Do not rely on root-level image files directly in app code
- If the user adds an asset in the repo root, move or copy it into the correct `apps/mobile/assets/...` location before wiring it into the app
- Prefer cache-safe versioned filenames like `item-name-v2.png`, `monster-name-v3.png` when replacing existing art

## Verification

After updating an asset:

1. Confirm the local asset exists in `apps/mobile/assets/...`
2. Confirm the S3 upload succeeded
3. Confirm the app points to the intended asset path
4. Run:
   - `cd /Users/kin/web-rpg/apps/mobile && npx tsc --noEmit`

## Reference

See:
- [docs/ASSET_WORKFLOW.md](/Users/kin/web-rpg/docs/ASSET_WORKFLOW.md)

## UI Guardrails

Before changing an already-reviewed UI flow, check:
- `docs/UI_GUARDRAILS.md`

If a UI behavior has already been resolved with the user, preserve it unless the user explicitly asks to redesign it.

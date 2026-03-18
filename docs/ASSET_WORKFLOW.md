# Asset Workflow

This project uses a dual asset workflow:

1. local bundled asset for Expo/Metro fallback
2. hosted S3 asset for the primary runtime path

This is required for consistency across sessions, devices, and future agents.

## Required Rule

Every new or replacement game asset must be:

1. added to the correct local asset path under `apps/mobile/assets/...`
2. uploaded to S3 under the matching `mobile-assets/...` key
3. wired in the app using the correct asset path

Do not leave assets only local.
Do not leave assets only on S3.

## S3 Configuration

- AWS profile: `tower-assets`
- AWS region: `us-west-1`
- Bucket: `the-tower-game-assets-v01`
- Prefix: `mobile-assets`
- Public base URL:
  - `https://the-tower-game-assets-v01.s3.us-west-1.amazonaws.com/mobile-assets`

## Common Commands

### Verify AWS session

```bash
AWS_PROFILE=tower-assets AWS_REGION=us-west-1 aws sts get-caller-identity
```

### Upload one asset

```bash
AWS_PROFILE=tower-assets AWS_REGION=us-west-1 aws s3 cp \
  /Users/kin/web-rpg/path/to/local-file.png \
  s3://the-tower-game-assets-v01/mobile-assets/path/in/mobile-assets/file.png
```

### List uploaded assets

```bash
AWS_PROFILE=tower-assets AWS_REGION=us-west-1 aws s3 ls \
  s3://the-tower-game-assets-v01/mobile-assets/ --recursive | head
```

## Wiring Pattern

### Preferred app pattern

Use `s3AssetWithFallback(...)` when the asset is fully uploaded and available on S3:

```ts
image: s3AssetWithFallback(
  "game/materials/common/example-v2.png",
  require("../../assets/game/materials/common/example-v2.png"),
)
```

### Important Expo rule

Bundled image `require(...)` paths must point inside:

- `apps/mobile/assets/...`

Do not reference root-level asset files directly from app code with `require(...)`.
Expo/Metro does not reliably support that pattern.

If a user provides a file in the repo root:

1. place it into the correct `apps/mobile/assets/...` folder
2. upload that asset to S3
3. wire the app to the local bundled path plus S3 key

## Filename Strategy

When replacing existing art, prefer versioned filenames to avoid cache confusion:

- `ash-rat-v3.png`
- `gate-sentinel-v2.png`
- `healing-herb-v2.png`

This is strongly preferred over reusing the same filename.

## Asset Update Checklist

For every asset update:

1. Confirm the asset file is in the correct local folder
2. Upload the asset to S3
3. Update the app code to the correct filename/key
4. Run type check:

```bash
cd /Users/kin/web-rpg/apps/mobile && npx tsc --noEmit
```

5. Verify the asset renders in the actual game screen

## Current Known S3 Setup

- Profile `tower-assets` has been used successfully
- Region is `us-west-1`
- Bucket region matches `us-west-1`

## If Upload Fails

If `aws s3 cp` fails:

1. verify the AWS profile:

```bash
aws configure list-profiles
```

2. verify the configured values:

```bash
AWS_PROFILE=tower-assets AWS_REGION=us-west-1 aws configure list
```

3. verify network/session:

```bash
AWS_PROFILE=tower-assets AWS_REGION=us-west-1 aws sts get-caller-identity
```

If credentials are missing or the network is sandboxed, resolve that first, then complete the upload before considering the asset update done.


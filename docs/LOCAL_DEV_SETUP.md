# Local Dev Setup (Mac)

Last updated: 2026-03-04

This project uses Expo. You can run both iOS Simulator and web from a single dev server.

## 1) Prerequisites

- macOS with Xcode installed
- Node.js and npm
- Homebrew

Recommended install command:

```bash
brew install watchman cocoapods ripgrep
```

## 2) Xcode / Simulator Setup

1. Open Xcode at least once.
2. Install iOS platform support in Xcode components.
3. Verify simulator devices exist:

```bash
xcrun simctl list devices available | head -n 40
```

Expected: at least one iPhone simulator listed.

## 3) Install Project Dependencies

From repository root:

```bash
cd /Users/kin/web-rpg
npm install
```

If web dependencies are missing in the mobile app:

```bash
cd /Users/kin/web-rpg/apps/mobile
npx expo install react-dom react-native-web
```

## 4) Start Development Server (single process)

```bash
cd /Users/kin/web-rpg/apps/mobile
npx expo start
```

Use Expo terminal shortcuts:
- `i` -> open iOS Simulator
- `w` -> open web preview

This is the preferred workflow. Do not run `expo start` and `expo start --web` in separate terminals.

## 5) Common Recovery Steps

If simulator opens but app does not render:
1. Press `i` again in Expo terminal.
2. In Simulator app: `Device > Erase All Content and Settings`.
3. Press `i` again.

If needed, run native iOS build path:

```bash
cd /Users/kin/web-rpg/apps/mobile
npx expo run:ios
```


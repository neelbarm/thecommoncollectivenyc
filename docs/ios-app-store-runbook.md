# The Common Collective iOS App Store Runbook

This branch includes a Capacitor iOS wrapper for The Common Collective. It is the fastest App Store-ready path: a native iOS shell that loads the production member platform at `https://www.thecommoncollective.space`.

## What is included

- Capacitor config: `capacitor.config.ts`
- Native iOS project: `ios/App/App.xcodeproj`
- Production web URL target: `https://www.thecommoncollective.space`
- Native bundle id: `space.thecommoncollective.app`
- Native display name: `The Common Collective`
- iOS app icon and launch splash assets
- Local fallback shell in `public/native-shell`
- **Native plugins** (registered via `npm run ios:sync`): Splash Screen, Status Bar, Keyboard, App lifecycle, Haptics. The Next.js app includes `CapacitorNativeBridge` so the shell configures the status bar, keyboard resize mode, fades out the launch splash after the first paint, and dispatches a `cc-capacitor-resume` document event when returning from background (useful later for refreshing unread counts).

## Seven-day hybrid roadmap (this codebase)

You still ship one React/Next.js product; the “native” work is layering **real iOS behaviors** on top of it:

1. **Ship this branch** — full-screen safe areas, haptics on tab changes, splash handoff, keyboard behavior, resume hooks.
2. **Offline / resilience** — service worker or targeted caching for shell assets; graceful offline banner in the member shell.
3. **Deep links** — Associated Domains + `App` URL open handling so links open inside the app.
4. **Push** — APNs (Capacitor Push Notifications or a provider) plus server-side device token storage; wire to announcements/chat.
5. **Optional true-native screens** — only if required: SwiftUI host for tabs + WKWebView per tab, or a gradual React Native port; same APIs.

Steps 2–5 are substantial; step 1 is what this repo encodes today so the WebView build feels closer to a polished native app during review.

## Before archiving

Make sure the production web app is updated first:

1. Merge this branch into `main`.
2. Let the production web deployment finish.
3. Open `https://www.thecommoncollective.space` on Safari.
4. Confirm login, member dashboard, announcements, chat, events, and next-event tab work.

The iOS app loads that production URL, so the website must be live and healthy before App Store upload.

## Required Apple setup

In Apple Developer:

1. Create an App ID for bundle id:
   - `space.thecommoncollective.app`
2. Enable Associated Domains only if you later configure Universal Links.
3. Create a new App Store Connect app:
   - Name: `The Common Collective`
   - Bundle ID: `space.thecommoncollective.app`
   - SKU: `common-collective-ios`

## Build locally

From the repo root:

```bash
npm install
npm run ios:sync
npm run ios:open
```

This opens Xcode.

## Xcode checklist

In Xcode:

1. Select the `App` project.
2. Select the `App` target.
3. Signing & Capabilities:
   - Team: choose your Apple Developer Team.
   - Bundle Identifier: `space.thecommoncollective.app`
   - Signing: automatic is fine.
4. General:
   - Display Name: `The Common Collective`
   - Version: `1.0`
   - Build: increment if re-uploading.
   - Deployment target: iOS 15.0 or newer.
5. Select a real device or `Any iOS Device`.
6. Product > Archive.
7. Distribute App > App Store Connect > Upload.

## App Store review notes

Because this is a web-backed member app, include clear reviewer notes:

```text
The Common Collective is a private NYC members club app for cohorts, announcements, events, and member coordination.

Demo member login:
Email: ari@example.com
Password: CommonClub123

Demo admin login if needed:
Email: admin@commoncollective.nyc
Password: CommonClub123

The app requires network access because member data, cohort chat, announcements, and events are served from the production web platform.
```

For this current build, also note:

```text
Native behaviors included in this submission:
- iOS status bar + safe-area handling
- Native splash handoff
- Keyboard resize/style alignment for forms
- Haptics on navigation taps
- Deep-link URL handling from native app URL open events
- Background resume + online refresh hooks for chat and announcements
```

Only include demo credentials after the production database has been seeded or after you create equivalent reviewer accounts.

## Privacy / compliance checklist

Before submission, make sure these exist publicly:

- Privacy Policy URL
- Support URL
- Terms or membership rules URL if applicable
- Account deletion/support process

If you do not have account deletion in-app yet, provide a support email or support page explaining how members request deletion. Apple may ask for this.

## Important limitations of this first iOS build

- The UI is still rendered with web technologies inside a native `WKWebView`; you are not maintaining a separate SwiftUI copy of every screen unless you choose that longer-term path above.
- Push notifications are not native/APNs yet.
- Offline mode is not supported.
- App Store approval is not guaranteed; Apple sometimes scrutinizes wrapper apps. The best mitigation is making the production app feel clearly app-like, logged-in, useful, and member-specific.

## Release smoke test before archive

Run this quick pass on a physical iPhone build:

1. Open app from cold start: splash fades into member dashboard cleanly.
2. Navigate all bottom tabs; verify no dead buttons and haptic pulse on tab taps.
3. Open announcements/chat, background app for 10+ seconds, return, verify feed refresh.
4. Toggle airplane mode while in announcements/chat and confirm offline banner appears.
5. Re-enable network and confirm banners clear and data refreshes.
6. Open a deep link (once Associated Domains/custom scheme are configured) and verify app routes correctly.
7. Submit one chat message and mark one announcement as read.

## Common commands

Sync native project after web/native config changes:

```bash
npm run ios:sync
```

Open in Xcode:

```bash
npm run ios:open
```

Verify web app before archive:

```bash
npm run lint
npm run build
```

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

Only include demo credentials after the production database has been seeded or after you create equivalent reviewer accounts.

## Privacy / compliance checklist

Before submission, make sure these exist publicly:

- Privacy Policy URL
- Support URL
- Terms or membership rules URL if applicable
- Account deletion/support process

If you do not have account deletion in-app yet, provide a support email or support page explaining how members request deletion. Apple may ask for this.

## Important limitations of this first iOS build

- This is a native WebView shell around the production app.
- Push notifications are not native/APNs yet.
- Offline mode is not supported.
- App Store approval is not guaranteed; Apple sometimes scrutinizes wrapper apps. The best mitigation is making the production app feel clearly app-like, logged-in, useful, and member-specific.

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

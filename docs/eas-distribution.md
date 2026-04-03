# EAS Build & Distribution for Pilots

## One-Time Setup

1. **Log in to Expo**
   ```bash
   npx eas login
   ```

2. **Register the project** (generates the EAS project ID)
   ```bash
   cd packages/native
   npx eas init
   ```
   This updates `app.json` with the real `projectId` under `expo.extra.eas` and replaces the placeholder URL in `updates.url`.

3. **Configure Apple credentials** (iOS only)
   ```bash
   npx eas credentials
   ```
   EAS can manage certificates and provisioning profiles automatically — choose "Let EAS handle this."

---

## Distributing a Build to Pilots

Pilots install the app via a link — no App Store review needed.

```bash
cd packages/native

# Build for iOS (real device)
npx eas build --platform ios --profile preview

# Build for Android
npx eas build --platform android --profile preview
```

EAS sends an email when the build is ready. Share the install link from the Expo dashboard or the URL printed in the terminal.

---

## Pushing a JS-Only Fix (OTA Update)

When you change only JavaScript/TypeScript (no native code), skip rebuilding entirely:

```bash
cd packages/native
npx eas update --channel preview --message "Fix: <brief description>"
```

Installed apps on the `preview` channel download the update on next launch.

**OTA updates do NOT work for changes to:**
- Native modules (adding/removing packages with native code)
- `app.json` fields that affect native config
- iOS/Android native files

In those cases, do a full `eas build`.

---

## Metro Dev Server (Fallback)

The existing Metro tunnel approach is still available for local development and debugging:

```bash
cd packages/native
./metro-start.sh
```

Use this when you need fast iteration with hot reload on a device connected to the same network (or via the proxy).

---

## Build Profiles Summary

| Profile | Use case | Distribution |
|---------|----------|--------------|
| `development` | Local dev with dev client | Internal (simulator or device) |
| `preview` | Pilot testing | Internal link (no App Store) |
| `production` | App Store release | App Store / Play Store |

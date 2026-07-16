# JOKER Android release checklist

Status: release configuration prepared; no APK or AAB was built during operation 6.

## Immutable identity

- Application ID: `com.valievcompany.joker`
- App name: `Joker`
- First release: `versionCode 1`, `versionName 1.0.0`
- Publishing artifact: signed Android App Bundle (`.aab`)
- Never change the application ID after the first Play Store publication.

## Native release contract

- Landscape orientation remains `sensorLandscape`.
- Generated target SDK must be API 35 or newer; re-check the current Google Play requirement immediately before upload.
- Release WebView debugging is disabled.
- Cleartext HTTP is disabled.
- Android backup is disabled because the match snapshot is local gameplay state, not cloud data.
- Only `android.permission.INTERNET` is allowed. No storage, location, contacts, camera, microphone, notification, phone or advertising-ID permission is allowed.
- Launcher assets include legacy, adaptive and Android 13 monochrome variants.

## Signing

1. Enrol the app in Google Play App Signing.
2. Create a dedicated upload keystore outside the repository.
3. Store the keystore and passwords in a password manager and an offline backup.
4. Never commit `.jks`, `.keystore`, passwords, service-account JSON or base64 secrets.
5. Build the signed AAB only after an explicit release command.

## Store listing

- Category: Game / Card.
- State clearly that the game has no real-money gambling, betting or prizes.
- Prepare phone screenshots in landscape orientation and a feature graphic.
- Use the generated Joker launcher icon or replace it only through the canonical release configurator.
- Provide the public privacy-policy URL: `/privacy.html` on the production GitHub Pages site.

## Data safety declaration for the current offline build

Current source contract:

- no account system;
- no ads;
- no analytics or tracking SDK;
- no payments;
- no enabled online multiplayer service;
- player name and match checkpoint remain on the device;
- no personal data is transmitted to Valiev Company or third parties.

Re-audit and update both the Data safety form and privacy policy before enabling online multiplayer, analytics, crash reporting, ads, login or payments.

## Pre-release verification

- Run both configurator self-tests.
- Generate a clean Capacitor Android project.
- Run `npx cap sync android`.
- Apply wrapper and release configurators.
- Verify the merged release manifest and permission list.
- Run release Java compilation and Android resource processing without packaging.
- Install a separately requested test APK on at least one real phone.
- Test a full 20-game match, background/foreground, process restart, both Joker modes and final score sheet.
- Then build and upload the signed AAB to an internal Play testing track first.

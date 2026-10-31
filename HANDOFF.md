# Handoff: HydroHype revival

The hackathon app has been refactored so the pieces actually connect, and the planned features are built. Everything below was verified locally. **Nothing has been deployed to Firebase, and nothing has been run on a phone yet.**

The project stays on the free **Spark** plan. Nothing here needs Blaze.

Setup and architecture: [HydroHomies/SETUP.md](./HydroHomies/SETUP.md). Code map: [HydroHomies/README.md](./HydroHomies/README.md).

## What changed

- **One data model.** The pet lives in `pets/{uid}` with separate `species` and `experience` fields. Old pets at `users/{uid}.pet` are migrated on sign-in. All Firestore access goes through `app/services/firebase/database.ts`.
- **Auth.** `AuthContext` subscribes live to the profile and the pet. The navigator routes on state (signed out → Login, no stats → Onboarding, no pet → PetSelect, otherwise Home). The sign-up race that could wipe stats is fixed, and logout was added.
- **Scan flow.** You take a before photo and an after photo, and the app logs the difference. Every value can be edited. Logging writes the entry, the pet XP/health and the daily summary in one transaction.
- **AI estimate.** With `EXPO_PUBLIC_OPENROUTER_API_KEY` in `HydroHomies/.env`, the app calls OpenRouter directly. That works on Spark. The optional `estimateBottle` Cloud Function in `HydroHomies/functions/` is only used when that variable is unset. There is no `.env` on this machine yet; copy `HydroHomies/.env.example`.
- **On-device model.** The Keras 3 export couldn't load in tfjs. `scripts/patch-keras3-model.js` fixes it, and `npm run model:verify` confirms it loads and predicts.
- **Friends.** Each user has a 6-character friend code (Friends screen, with a Share button). Entering a code adds you to each other's lists. The rules check that the code belongs to the other user.
- **Leaderboard.** Friends and Everyone tabs, built from `dailySummaries`, live. Avatars now show each pet's current health (fade when thirsty).
- **Stats.** Last 7 days as a bar chart against the goal, weekly total and average, days on goal, best day, current and best streak.
- **Achievements.** 12 achievements on the Stats screen (first drink, goal, 3/7/30-day streaks, 10 L and 100 L lifetime, pet level 5/15/30, 1 and 5 friends), with progress bars. Computed on the device; nothing stored.
- **Reminders.** Local notifications every 1-4 hours within a chosen time window, titled with the pet's name. Today's remaining reminders are dropped once the goal is reached. Cleared on logout.
- **Drink photo gallery.** Before/after thumbnails of each drink show on your profile (Home → My profile) for you and your friends only, so friends can call out faked drinks. Optional per drink, deletable. Stored in Firestore because Cloud Storage needs Blaze.
- **Local testing.** `npm run emulators` plus `EXPO_PUBLIC_USE_FIREBASE_EMULATORS=1` runs the whole app against local emulators (see SETUP.md).
- **Rules tests.** `npm run test:rules` runs the real `databaseService` against the Firestore emulator: 38 tests over profiles, pets, migration, drinks, friends, drink photos, history and both leaderboards.

## Verified in the browser (Expo web against the emulators)

Two accounts, Alice and Bob: sign-up → pet → log drinks (gallery photos, manual amounts) → Home totals and XP → Stats (chart, numbers, First Sip unlocked) → own profile gallery → Bob adds Alice by code → Bob sees Alice's photos and the Friends/Everyone leaderboards → Bob removes Alice → Alice's photos are then hidden from Bob → deleting your own photos → logout. Found and fixed along the way: confirm dialogs and alerts did nothing on web (`Alert.alert` is a no-op there), and Stats showed 150 ml as "0.1 L".

Not verifiable on web: reminders (web shows a "phones only" message), the on-device model, and the native camera. Those still need a phone.

## Current state (all passing)

Run these from `HydroHomies/`:

| Check | Result |
| --- | --- |
| `npm run compile` | 0 errors |
| `npm run lint:check` | clean |
| `npm test` | 7 suites, 32 tests pass |
| `npm run test:rules` | 38 tests pass in the emulator |
| `npx expo export --platform android` | bundles |

`npm run test:rules` needs **Java 21+**. The system Java is 11, so a portable Java 21 runtime is at `%LOCALAPPDATA%\Programs\temurin-21\`. Put its `jdk-21.0.13+9-jre\bin` folder on `PATH` in that terminal first.

## Next steps

1. **Add the OpenRouter key.** Copy `HydroHomies/.env.example` to `HydroHomies/.env` and set `EXPO_PUBLIC_OPENROUTER_API_KEY`. Set a monthly spending limit on the key in OpenRouter, because it's in the app bundle and there's no per-user rate limit without the Cloud Function.
2. **Deploy rules and indexes** (works on Spark): `npm run deploy:firestore`. The new rules (friends, friend codes, drink photos) and the new history and photo indexes are needed by this version. Stats and the photo gallery fail until the indexes finish building.
3. **Rebuild the dev build and test on a device** (`npm run android`). `expo-notifications` is a new native module. Check: sign-up → pet → scan → leaderboard, adding a friend from a second account, the Stats screen, a reminder arriving, the camera, legacy-pet migration, and whether `bundleResourceIO` loads the model on device.
4. **Run Maestro.** `npm run test:maestro -- -e TEST_EMAIL=... -e TEST_PASSWORD=...` against a test account that has stats and a pet.

## Known gaps

- Day boundaries use the device's local date (`utils/dateKey.ts`), so "today" matches each user's own calendar. Users in different time zones can appear on each other's leaderboard a few hours early or late. That's on purpose; using UTC would make "today's goal" reset mid-day for most people.
- The on-device model has no "empty" class, so it's only used for the *before* photo. Retraining needs a dataset of empty and low-level bottle photos, which isn't in the repo (see `ml_training/`).
- Streaks count the last 60 days only. Lifetime litres are estimated from pet XP (10 XP per 100 ml), so migrated hackathon pets start with whatever XP they had.
- Anyone who has your friend code can add you. There's no accept step and no way to change your code yet.
- Hackathon-era `hydrationEntries` have no `dateKey`, so they don't appear in "Today's Drinks". That's harmless.

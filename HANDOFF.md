# Handoff: HydroHype revival

The hackathon app has been refactored so the pieces actually connect. Everything below was verified locally. **Nothing has been deployed to Firebase, and nothing has been run on a phone yet.**

Setup and architecture: [HydroHomies/SETUP.md](./HydroHomies/SETUP.md). Code map: [HydroHomies/README.md](./HydroHomies/README.md).

## What changed

- **One data model.** The pet lives in `pets/{uid}` with separate `species` and `experience` fields. Old pets at `users/{uid}.pet` are migrated on sign-in. All Firestore access goes through `app/services/firebase/database.ts`.
- **Auth.** `AuthContext` subscribes live to the profile and the pet. The navigator routes on state (signed out → Login, no stats → Onboarding, no pet → PetSelect, otherwise Home). The sign-up race that could wipe stats is fixed, and logout was added.
- **Scan flow.** You take a before photo and an after photo, and the app logs the difference. Every value can be edited. Logging writes the entry, the pet XP/health and the daily summary in one transaction. The random "simulated" detection was removed.
- **AI estimate.** The `estimateBottle` Cloud Function in `HydroHomies/functions/` keeps the OpenRouter key server-side and rate-limits each user to 60 calls per day. There's a dev-only direct-call fallback.
- **On-device model.** The Keras 3 export couldn't load in tfjs. `scripts/patch-keras3-model.js` fixes it, and `npm run model:verify` confirms it loads and predicts.
- **Leaderboard.** It's now real, built from `dailySummaries`, and updates live. The mock users are gone. FriendPet reads public data only.
- **Cleanup.** Removed the Ignite demo leftovers, the unused API service, stale docs and dead i18n keys. Fixed the missing theme colors. Untracked the root `node_modules/` and `.expo/`, about 7.8k files that had been committed by accident.

## Current state (all passing)

Run these from `HydroHomies/`:

| Check | Result |
| --- | --- |
| `npm run compile` | 0 errors (was 53) |
| `npx tsc -p functions` | 0 errors |
| `npm run lint:check` | clean |
| `npm test` | 7 suites, 32 tests pass (was 2 suites failing) |
| `npm run model:verify` | loads, outputs 3 probabilities |
| `npx expo export --platform android` | bundles |

## Next steps, in order

1. **Rotate keys.** `HydroHomies/.env` (gitignored) has `EXPO_PUBLIC_OPENROUTER_API_KEY` and `EXPO_PUBLIC_GEMINI_API_KEY`. Hackathon builds embedded these in the app bundle, so treat them as leaked. Create a new OpenRouter key and don't put it back in `.env` as `EXPO_PUBLIC_*` except for local dev.
2. **Test the Firestore rules in the emulator** before deploying. I couldn't do this because the local Java is 1.8 and the emulator needs 11+. Paths to cover: sign-up `saveProfile`, `adoptPet`, `migrateLegacyPet`, `logHydration` (first drink of the day *and* later drinks), and leaderboard reads. A reviewer found a bug in the first-drink path and it was fixed, but the fix hasn't been tested against the emulator.
3. **Deploy.** The project needs the Blaze plan for Functions.
   ```bash
   npx firebase-tools functions:secrets:set OPENROUTER_API_KEY --project hydrohype-9fa73
   npm run deploy:firestore
   npm run deploy:functions
   ```
4. **Test on a device** with a dev build (`npm run android`). Expo Go works too, but it can't run the on-device model. Things to check: the full sign-up → pet → scan → leaderboard flow, the camera, legacy-pet migration with an old account, and whether `bundleResourceIO` loads the model on device. So far it has only been verified in Node.
5. **Run Maestro.** `npm run test:maestro -- -e TEST_EMAIL=... -e TEST_PASSWORD=...` against a test account that has stats and a pet.

## Known gaps and ideas

- There's no friends list, so the leaderboard shows everyone who logged water today. Friends would be a `friends` subcollection plus a `where("userId", "in", ...)` query.
- Day boundaries use the device's local date (`utils/dateKey.ts`). Users in different time zones roll over at different times.
- The on-device model has no "empty" class, so it's only used for the *before* photo. Retraining with empty and low-level images would let it handle both photos (see `ml_training/`).
- Hackathon-era `hydrationEntries` have no `dateKey`, so they don't appear in "Today's Drinks". That's harmless.
- `HydroHomies/HydroHomies/.git` is a stray one-commit Ignite repo nested inside the real one. It's safe to delete, but I left it alone.
- Health decay is computed on read (`currentHealth`), so leaderboard avatars don't show friends' current health.
- Not built: reminders, weekly stats, achievements.

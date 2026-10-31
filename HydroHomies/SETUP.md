# HydroHype setup

All commands run from `HydroHomies/HydroHomies/` unless noted.

## 1. Install

Requires Node 20+.

```bash
npm install
npm --prefix functions install
```

## 2. Firebase

The app is wired to the `hydrohype-9fa73` project (see `.firebaserc`). To use your own:

1. Create a project at https://console.firebase.google.com and add a **Web app**.
2. Enable **Authentication → Email/Password** and create a **Firestore** database.
3. Put the web config in `.env` (these values aren't secret; the rules below control access):

   ```bash
   EXPO_PUBLIC_FIREBASE_API_KEY=...
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   EXPO_PUBLIC_FIREBASE_APP_ID=...
   ```

4. Update `.firebaserc` and the `--project` flag in the `deploy:*` scripts in `package.json`.
5. Deploy the security rules and the leaderboard index:

   ```bash
   npm run deploy:firestore
   ```

### Data model

| Collection | Doc id | Who can read | Contents |
| --- | --- | --- | --- |
| `users` | `{uid}` | owner | email, username, body stats, daily goal |
| `pets` | `{uid}` | any signed-in user | name, species, experience, health, lastFed |
| `hydrationEntries` | auto | owner | one logged drink: amount, before/after volume, source |
| `dailySummaries` | `{uid}_{YYYY-MM-DD}` | any signed-in user | day total, goal, display name, pet summary incl. health (drives the leaderboard and stats) |
| `friendCodes` | 6-character code | signed-in users, by exact code only | the code's owner and display name |
| `users/{uid}/friends` | friend's uid | owner | friend's display name. Adding a friend writes both users' lists |
| `drinkPhotos` | the drink's entry id | owner and their friends | before/after JPEG thumbnails (data URIs, ~30-60 KB per pair) |
| `drinkPhotos/{id}/reactions` | reactor's uid | owner and their friends | one emoji per friend: 💧 🔥 🤡 🧢 |
| `aiUsage` | `{uid}_{YYYY-MM-DD}` | nobody (Functions only) | AI estimate counter for rate limiting (only used by the Cloud Function) |

Logging a drink writes the entry, the pet update and the daily summary in one transaction (`databaseService.logHydration`). Deleting one (Home → Today's Drinks → Delete, allowed for 24 hours) reverses all three and removes its photos (`databaseService.deleteDrink`). The rules let a daily total or pet XP move by at most one drink's worth per write, up or down.

**Friends.** Each user gets a friend code the first time they open Friends. Entering someone's code adds you to each other's lists. The rules only allow that write if the code really belongs to the other user, so nobody can add themselves without the code. Either friend can remove the friendship. The leaderboard has a Friends tab (you plus your friends) and an Everyone tab.

**Drink photos.** When "Share photos with friends" is on (the default, remembered per device), logging a drink also saves small thumbnails of the before and after photos. They show on your profile (Home → My profile) and on the profile your friends see, so they can call you out if the bottle didn't really go down. You can delete any pair. Photos live in Firestore rather than Cloud Storage, because Storage needs the Blaze plan. The free Firestore quota is 1 GiB, which is roughly 20,000 drinks with photos.

**Stats and achievements** are computed on the device from the last 60 days of `dailySummaries` and the pet's XP. Nothing extra is stored. The history query needs the `(userId, dateKey)` index in `firestore.indexes.json`, so run `npm run deploy:firestore` after pulling this.

**Reminders** are local notifications (`expo-notifications`); no server is involved. They're scheduled for the next 3 days and refreshed whenever Home opens. Once today's goal is reached, the rest of today's reminders are dropped. Settings are stored on the device.

Accounts created by the hackathon build stored the pet at `users/{uid}.pet`. It's moved to `pets/{uid}` automatically the next time that user signs in.

### Testing the rules

`test/rules/firestore.rules.test.ts` runs the real `databaseService` against the Firestore emulator with `firestore.rules` loaded. It covers sign-up, adopting a pet, legacy-pet migration, logging drinks (first and later drinks of the day), friends and friend codes, history and both leaderboards. Run it before every rules deploy:

```bash
npm run test:rules
```

The emulator needs **Java 21+** on `PATH`. `npm test` skips these tests because they need the emulator.

### Trying the app without touching the real project

`npm run emulators` starts local Auth and Firestore emulators (project `demo-hydrohype`). Start the app with `EXPO_PUBLIC_USE_FIREBASE_EMULATORS=1` and it signs up, logs drinks and adds friends against those instead of the real database:

```powershell
npm run emulators                                         # terminal 1 (Java 21+)
$env:EXPO_PUBLIC_USE_FIREBASE_EMULATORS="1"; npm run web  # terminal 2
```

For a phone or Android emulator, also set `EXPO_PUBLIC_FIREBASE_EMULATOR_HOST` to your PC's LAN IP (or `10.0.2.2` for the Android emulator). Data disappears when the emulators stop.

## 3. AI bottle estimate

The scan screen sends each photo to a vision model on [OpenRouter](https://openrouter.ai), which returns the bottle size, the water volume and a confidence score. There are two ways to connect it.

**Direct (default, works on the free Spark plan).** Copy `.env.example` to `.env` and set `EXPO_PUBLIC_OPENROUTER_API_KEY`. The app calls OpenRouter itself. The key is embedded in the app bundle and there's no per-user rate limit, so set a monthly spending limit on the key in OpenRouter. Restart `npm start` after editing `.env`. To change the model, set `EXPO_PUBLIC_OPENROUTER_MODEL` (default `google/gemini-2.5-flash`).

**Cloud Function (needs the Blaze plan).** Leave `EXPO_PUBLIC_OPENROUTER_API_KEY` unset and deploy `functions/`. The `estimateBottle` function keeps the key on the server and allows each user 60 calls per day (each scan uses two).

```bash
npx firebase-tools functions:secrets:set OPENROUTER_API_KEY --project hydrohype-9fa73
npm run deploy:functions
```

If neither is set up, the scan screen falls back to the on-device model or to manual entry. Logging still works.

## 4. Run

```bash
npm start            # Expo dev server (Expo Go works, minus the on-device model)
npm run android      # dev build on a device/emulator (enables the on-device model)
npm run ios
```

Camera scanning needs a physical device. On an emulator, use **Gallery**. `expo-notifications` (reminders) is a native module, so rebuild the dev build once after pulling (`npm run android`).

## 5. On-device model (optional)

`assets/models/water-level-classifier/` contains a MobileNetV2 classifier with three classes: `half`, `full` and `overflowing`. It reached about 80% validation accuracy on 356 Kaggle images. It runs only in dev or production builds (TF.js React Native needs native modules), and only for the *before* photo, because the dataset has no "empty" class. The AI estimate takes priority when it's available.

The model was exported from Keras 3, and tfjs 4.x can't read that format directly. `scripts/patch-keras3-model.js` rewrites it: Keras 2 style input shapes and inbound nodes, the nested MobileNet graph flattened, and depthwise weight names fixed.

```bash
npm run model:verify   # loads the bundled model with tfjs in Node and runs one prediction
```

To retrain, see `../ml_training/README.md`, then run `bash ../ml_training/setup_model_for_app.sh`. That script copies the model, patches it and verifies it.

## 6. Checks

```bash
npm run compile      # TypeScript
npm run lint:check   # ESLint + Prettier
npm test             # Jest: goal formula, pet rules, estimate parsing, storage, i18n keys
npm run test:rules   # Firestore rules against the emulator (needs Java 21+)
npm run model:verify
npm run test:maestro # E2E; needs a dev build and -e TEST_EMAIL=... -e TEST_PASSWORD=...
```

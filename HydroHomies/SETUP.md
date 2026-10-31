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
| `dailySummaries` | `{uid}_{YYYY-MM-DD}` | any signed-in user | day total, goal, display name, pet summary (drives the leaderboard) |
| `aiUsage` | `{uid}_{YYYY-MM-DD}` | nobody (Functions only) | AI estimate counter for rate limiting |

Logging a drink writes the entry, the pet update and the daily summary in one transaction (`databaseService.logHydration`).

Accounts created by the hackathon build stored the pet at `users/{uid}.pet`. It's moved to `pets/{uid}` automatically the next time that user signs in.

### Testing the rules

`test/rules/firestore.rules.test.ts` runs the real `databaseService` against the Firestore emulator with `firestore.rules` loaded. It covers sign-up, adopting a pet, legacy-pet migration, logging drinks (first and later drinks of the day) and the leaderboard. Run it before every rules deploy:

```bash
npm run test:rules
```

The emulator needs **Java 21+** on `PATH`. `npm test` skips these tests because they need the emulator.

## 3. AI bottle estimate (Cloud Function)

`functions/` holds a callable function, `estimateBottle`. It sends the photo to a vision model on [OpenRouter](https://openrouter.ai) and returns the bottle size, the water volume and a confidence score. The API key stays on the server. Each user gets 60 calls per day, and each scan uses two.

Cloud Functions require the Blaze (pay-as-you-go) plan.

```bash
npx firebase-tools functions:secrets:set OPENROUTER_API_KEY --project hydrohype-9fa73
npm run deploy:functions
```

The default model is `google/gemini-2.5-flash`. To change it, set `OPENROUTER_MODEL` in `functions/.env`.

**Local development without deploying.** If you set `EXPO_PUBLIC_OPENROUTER_API_KEY` in `.env`, **dev builds** call OpenRouter directly whenever the function call fails. `EXPO_PUBLIC_*` values are embedded in the app bundle, so never set this for a release build. The code ignores it outside `__DEV__`.

If neither path is available, the scan screen falls back to the on-device model or to manual entry. Logging still works.

## 4. Run

```bash
npm start            # Expo dev server (Expo Go works, minus the on-device model)
npm run android      # dev build on a device/emulator (enables the on-device model)
npm run ios
```

Camera scanning needs a physical device. On an emulator, use **Gallery**.

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
npm run model:verify
npm run test:maestro # E2E; needs a dev build and -e TEST_EMAIL=... -e TEST_PASSWORD=...
```

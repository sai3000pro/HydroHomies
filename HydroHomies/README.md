# HydroHype app

An Expo (React Native) app for HydroHype. Setup, Firebase and model details are in [SETUP.md](./SETUP.md).

```bash
npm install
npm start
```

## Layout

```
app/
  app.tsx                 entry: fonts, i18n, providers
  context/AuthContext.tsx live auth user, profile and pet (Firestore snapshots)
  navigators/             stack switches on auth/profile/pet state
  screens/                Login, SignUp, Onboarding, PetSelect, Home, ScanBottle, Leaderboard, FriendPet
  components/             Pet, StatsFields, plus Ignite UI components (Button, Text, Screen, ...)
  services/firebase/      config, auth, database (every Firestore read and write)
  services/vision/        AI estimate client, estimate parsing, analyzeBottle fallback chain
  services/ml/            on-device TF.js water-level classifier
  utils/                  water goal formula, pet growth rules, date keys
functions/                estimateBottle Cloud Function (OpenRouter vision, key kept server-side)
scripts/                  patch + verify the TF.js model
firestore.rules           security rules
firestore.indexes.json    leaderboard index
```

The project started from the [Ignite](https://github.com/infinitered/ignite) boilerplate. `ignite generate` templates still work.

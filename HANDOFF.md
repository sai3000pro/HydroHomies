# Handoff: HydroHype revival

The hackathon app is now a working app: the pieces connect, the planned features are built, and a full audit's worth of bugs and gaps are fixed. Everything below was verified locally: unit tests, 57 Firestore rules tests against the emulator, and click-through testing in Expo web against local emulators. **Nothing has been deployed to Firebase, and nothing has been run on a phone yet.**

The project stays on the free **Spark** plan. Nothing here needs Blaze.

Setup and architecture: [HydroHomies/SETUP.md](./HydroHomies/SETUP.md). Code map: [HydroHomies/README.md](./HydroHomies/README.md).

## Features

- **Sign-up and accounts.** Email and password sign-up with body stats, which set the daily water goal. Log in, log out, **forgot password** (emails a reset link), and **delete account** (Settings; asks for the password, then deletes the profile, pet, drinks, photos, reactions, friendships and friend code, then the sign-in account). If a deletion is interrupted, the app offers to finish it on the next sign-in.
- **Pet.** Pick one of three species and name it. It gains 10 XP per 100 ml, levels up every 100 XP, grows through five stages, and gets thirsty when you don't drink. You can rename it in Settings.
- **Logging a drink.** Take a before and an after photo; the app estimates both and logs the difference. Every value can be edited. The "Logged!" message announces level-ups and new stages. The drink, pet and daily total update in one transaction.
- **AI estimate.** With `EXPO_PUBLIC_OPENROUTER_API_KEY` in `HydroHomies/.env`, the app calls OpenRouter directly (works on Spark). Without a key it falls back straight to the on-device model or manual entry; it no longer waits on a Cloud Function that can't exist on Spark. There is no `.env` on this machine yet; copy `HydroHomies/.env.example`.
- **Undo and history.** Delete a drink within 24 hours from Home or from the new **Drinks** history (Home → "See all drinks"), which lists your last 30 by day. Undo takes back the ml, the XP and the health boost, and removes the drink's photos.
- **Friends.** Each user has a 6-character friend code (share or copy it). Entering a code adds you to each other's lists. **Get a new code** retires the old one if it got out. Removing a friend works from either side.
- **Drink photo gallery and reactions.** Before/after thumbnails of each drink show on your profile, for you and your friends only, so they can call out fakes with 💧 🔥 🤡 🧢. Photo sharing is optional per drink, and photos are deletable.
- **Leaderboard.** Friends and Everyone tabs, live. Shows each pet's current health. Tells you if you're outside the top 50.
- **Stats and achievements.** Last 7 days against your goal, totals, best day, current and best streak, and 12 achievements. Achievements are now saved, so they never lock again.
- **Reminders.** Local notifications every 1-4 hours in a time window, named after your pet, scheduled a week ahead (within iOS's 64-notification limit). Today's remaining reminders stop once you hit your goal. Settings are per user, and the app tells you if notifications are turned off in the phone's settings.
- **Settings.** Username and body stats (the goal updates live), pet name, theme (Auto/Light/Dark), log out, delete account. A new username also updates your friend code, your friends' lists and today's leaderboard row.

## Fixed in the last round (from a full audit and an independent review)

- **Midnight.** "Today" now rolls over at midnight and when the app returns to the foreground. Before, a phone left open overnight kept showing yesterday's total, and drinks logged after midnight didn't appear.
- **Cheating.** The Firestore rules now only let a pet's XP and a day's total change together with a real drink written in the same request, by exactly that drink's amount. Health can only rise by what the drink earns, and decay can't be paused. Leaderboard fields are validated, drinks must carry the server time and a date within a day of today, and a pet can't be deleted and re-created with XP.
- **Load errors.** A failed or offline profile load used to send existing users to Onboarding or PetSelect, where saving could overwrite their data. It now shows "Couldn't load your account" with Try again.
- **Undo.** Undo now gives back the health boost too, and a refused undo no longer deletes the photos.
- **Logging.** A fast double tap on Log no longer logs twice.
- **Reminders.** Duplicate reminders and reminders scheduled after logout are fixed, and reminder settings carry over from older versions.
- **Smaller fixes:** the camera permission prompt is asked once, the photo picker reports errors, the friends leaderboard no longer spins forever on an error, two people adding each other at the same moment no longer shows an error, and the crash screen shows a real message (in all 7 languages) instead of developer boilerplate.

## Current state (all passing)

Run these from `HydroHomies/`:

| Check | Result |
| --- | --- |
| `npm run compile` | 0 errors |
| `npm run lint:check` | clean |
| `npm test` | 7 suites, 32 tests pass |
| `npm run test:rules` | 57 tests pass in the emulator |
| `npx expo export --platform android` | bundles |

`npm run test:rules` needs **Java 21+**. The system Java is 11, so a portable Java 21 runtime is at `%LOCALAPPDATA%\Programs\temurin-21\`. Put its `jdk-21.0.13+9-jre\bin` folder on `PATH` in that terminal first.

**Try the whole app without touching the real project:** `npm run emulators`, then start the app with `EXPO_PUBLIC_USE_FIREBASE_EMULATORS=1` (see SETUP.md). Everything above was click-tested this way in Expo web.

## Next steps

1. **Add the OpenRouter key.** Copy `HydroHomies/.env.example` to `HydroHomies/.env` and set `EXPO_PUBLIC_OPENROUTER_API_KEY`. Set a monthly spending limit on the key in OpenRouter: it's in the app bundle and there's no per-user rate limit without the Cloud Function.
2. **Deploy rules and indexes** (works on Spark): `npm run deploy:firestore`. This version needs the new rules and indexes (history, photos, recent drinks, reactions). Stats, History and the gallery fail until the indexes finish building (a few minutes).
3. **Turn on password reset emails.** Firebase console → Authentication → Templates: check the sender name for the password reset email.
4. **Rebuild the dev build and test on a phone** (`npm run android`). `expo-notifications` is a native module. Check: sign-up → pet → scan with the real camera → leaderboard, a second account adding you, a reminder arriving, and whether `bundleResourceIO` loads the on-device model.
5. **Run Maestro.** `npm run test:maestro -- -e TEST_EMAIL=... -e TEST_PASSWORD=...` against a test account that has stats and a pet.

## Known gaps

- **Logging is honor-system plus photos.** The rules stop editing totals directly, but a determined user can still log made-up drinks through the normal flow. The photo gallery and 🧢 reactions are the check on that; real verification would need a server (Cloud Functions, Blaze).
- **Time zones.** Day boundaries use each device's local date, so users in different time zones roll over at different times. That's on purpose; UTC would reset "today" mid-day for most people.
- **On-device model.** It has no "empty" class, so it's only used for the *before* photo. Retraining needs empty and low-level bottle photos, which aren't in the repo (see `ml_training/`).
- **Friend codes.** Anyone with your code can add you without an accept step. Get a new code if it leaks.
- **Old usernames.** After a rename, past days' leaderboard rows and reactions you left earlier keep the old name.
- **Translations.** Most screens are English only; the other 6 languages cover the login and error screens.

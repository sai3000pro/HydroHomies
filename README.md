# HydroHype 💧

HydroHype turns drinking water into a game. You photograph your bottle before and after you drink, and the app estimates how much you had. That amount feeds a virtual pet and puts you on a daily leaderboard with your friends.

## How it works

- **Personal goal.** At sign-up you enter sex, age, height, weight and activity level. The app turns these into a daily water goal with a water-balance model (body surface area plus energy expenditure). A 70 kg, 175 cm, moderately active 25-year-old gets about 2.6 L.
- **Two-photo logging.** You take a photo before drinking and another after. A vision model, called through a Firebase Cloud Function, estimates the bottle size and the water level in each photo. The app logs the difference. You can adjust every number before saving.
- **Pet.** You adopt a Hydrophant, Agualien or Sphele. Every 100 ml you drink gives your pet 10 XP, and each level takes 100 XP. Its health drops by 3 per hour and recovers when you drink. Below 40 health the pet looks thirsty.
- **Leaderboard.** Today's totals for all users update live. You can tap anyone to see their pet. A 😏 marks users who are past 150% of their goal.

## Repo

```
HydroHomies/   Expo app, Cloud Function, Firestore rules (see HydroHomies/SETUP.md)
ml_training/   MobileNetV2 water-level classifier: training script, Keras checkpoints, TF.js export
```

## Quick start

```bash
cd HydroHomies
npm install
npm start
```

To deploy the Firestore rules, the leaderboard index and the AI estimate function, follow [HydroHomies/SETUP.md](./HydroHomies/SETUP.md).

## Status and limits

- Volume estimates from a single photo are approximate. Always check the numbers on the review screen.
- The on-device model only knows `half`, `full` and `overflowing`, from 356 training images. It is a fallback for the *before* photo when the AI estimate is unavailable.
- There is no friends list yet. The leaderboard shows everyone who logged water today.
- Not built yet: push reminders, weekly stats, achievements.

## Tech

Expo SDK 54 / React Native 0.81, React Navigation, Firebase (Auth, Firestore, Cloud Functions), OpenRouter vision models, TensorFlow.js.

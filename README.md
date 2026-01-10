# HydroHype (AquaGotchi) 💧🌱

**Gamifying Hydration with Computer Vision & Social Pressure**

HydroHype is a mobile application that turns drinking water into a competitive game. Instead of manually typing "500ml", users use Computer Vision to verify their intake.

## 🎯 Core Concept

HydroHype attacks the problem of dehydration from three angles:
- **Biological**: Calculates personalized needs based on user stats (Height, Weight, Age, Activity Level)
- **Social**: A leaderboard to compete with friends
- **Nurturing**: A "Tamagotchi-style" virtual pet that grows (or withers) based on your hydration

## ✨ Features

### Phase 1: Onboarding
- User inputs: Height, Weight, Age, Activity Level
- Automatic calculation of Daily Water Goal
- Receive and name your hydration avatar (pet)

### Phase 2: The "Drink" Loop
- **Scan**: Point camera at water bottle
  - Label/Bottle Detection via Computer Vision
  - Water level classification (Full, Half, Low, Empty)
  - Volume estimation
- **Verify**: Take second photo of empty bottle (prevents cheating)
  - Can be disabled if no time
  - Overdrinking warnings with 😏 emoji on leaderboard

### Phase 3: Gamification
- **Leaderboard**: Live-updating ranking showing most hydrated users
- **Virtual Pet**: Grows and evolves as you log water
  - Starts as a seed, evolves to plant, flower, droplet, or fish
  - Withers if you miss your goal
  - Visit friends' pets to see their status

## 🛠️ Technology Stack

- **Frontend**: React Native (Expo) - Cross-platform (iOS & Android)
- **Backend**: Firebase
  - Authentication: Email/Password
  - Firestore: Real-time database for leaderboard and pet state
- **Camera**: expo-camera for bottle scanning
- **ML Model**: Placeholder structure for water level classification
  - Dataset: [Water Bottle Dataset](https://www.kaggle.com/datasets/chethuhn/water-bottle-dataset)
  - Framework: TensorFlow Lite / ONNX (to be integrated)

## 📱 Getting Started

See [SETUP.md](./HydroHomies/SETUP.md) for detailed installation and setup instructions.

### Quick Start

```bash
# Install dependencies
cd HydroHomies/HydroHomies
npm install
npm install firebase expo-camera expo-image-picker expo-image-manipulator expo-media-library

# Configure Firebase (see SETUP.md)
# Update app/services/firebase/config.ts with your Firebase credentials

# Run the app
npm start
```

## 📂 Project Structure

```
HydroHomies/
├── HydroHomies/
│   ├── app/
│   │   ├── components/      # Reusable components
│   │   │   └── Pet.tsx      # Virtual pet component
│   │   ├── context/         # React Context providers
│   │   │   └── AuthContext.tsx
│   │   ├── screens/         # Screen components
│   │   │   ├── OnboardingScreen.tsx
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── ScanBottleScreen.tsx
│   │   │   ├── LeaderboardScreen.tsx
│   │   │   └── FriendPetScreen.tsx
│   │   ├── services/
│   │   │   ├── firebase/    # Firebase config & services
│   │   │   └── ml/         # ML model integration (placeholder)
│   │   └── utils/          # Utility functions
│   │       ├── waterGoalCalculator.ts
│   │       └── petEvolution.ts
│   └── SETUP.md            # Detailed setup instructions
└── README.md               # This file
```

## 🎮 User Flow

1. **Sign Up/Login**: Firebase authentication
2. **Onboarding**: Enter stats → Calculate goal → Name pet
3. **Home Screen**: View pet, hydration progress, quick actions
4. **Scan Bottle**: Camera → Detect bottle → Estimate volume
5. **Verify**: Photo of empty bottle (optional but recommended)
6. **Reward**: Pet gains XP, evolves; Leaderboard updates
7. **Social**: View leaderboard, visit friends' pets

## 🤖 ML Model Integration (Future Work)

The app currently uses placeholder functions for bottle detection. To integrate the actual ML model:

1. Download the dataset: `kagglehub.dataset_download("chethuhn/water-bottle-dataset")`
2. Train model (TensorFlow, PyTorch, or ML Kit)
3. Convert to mobile format (.tflite or ONNX)
4. Update `/app/services/ml/waterLevelClassifier.ts`
5. Integrate with camera screen

See [SETUP.md](./HydroHomies/SETUP.md) for detailed ML integration steps.

## 🔒 Security & Privacy

- Firebase Authentication for secure user login
- Firestore security rules to protect user data
- Camera permissions handled via Expo permissions API
- No personal data stored outside Firebase

## 🚧 Roadmap

- [x] Basic app structure and navigation
- [x] Firebase authentication and database setup
- [x] Onboarding flow with water goal calculation
- [x] Camera integration for bottle scanning
- [x] Two-step verification (full → empty bottle)
- [x] Virtual pet system with evolution
- [x] Leaderboard with real-time updates
- [x] Friend pet viewing
- [ ] Actual ML model integration
- [ ] OCR for label reading
- [ ] Web search for bottle database
- [ ] Push notifications
- [ ] Weekly/monthly statistics
- [ ] Achievements system
- [ ] Social sharing

## 📝 License

[Your License Here]

## 👥 Contributors

[Your Name/Team]

---

**Made with 💧 and ❤️ for better hydration habits**

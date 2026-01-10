# HydroHype (AquaGotchi) - Setup Guide

## 🎯 Project Overview

HydroHype is a mobile application that gamifies hydration by combining:

- **Computer Vision**: Automatic water bottle detection and level classification
- **Social Competition**: Real-time leaderboards
- **Virtual Pet**: Tamagotchi-style pet that grows with hydration

## 📋 Prerequisites

- Node.js >= 20.0.0
- npm or yarn
- Expo CLI (installed globally: `npm install -g expo-cli`)
- Firebase account and project
- iOS Simulator / Android Emulator or physical device with Expo Go

## 🚀 Installation Steps

### 1. Install Dependencies

```bash
cd HydroHomies/HydroHomies
npm install

# Install additional required packages
npm install firebase expo-camera expo-image-picker expo-image-manipulator expo-media-library
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password authentication
4. Create a Firestore Database:
   - Go to Firestore Database
   - Create database in test mode (or production with rules)
   - Set up security rules (see below)
5. Get your Firebase configuration:
   - Go to Project Settings > General
   - Scroll to "Your apps" and add a web app (or use existing)
   - Copy the config values

### 3. Configure Firebase

Update `/app/services/firebase/config.ts` with your Firebase credentials:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id",
}
```

**Or use environment variables (recommended for production):**

Create a `.env` file in the root directory:

```
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 4. Firestore Security Rules

Set up these security rules in Firebase Console > Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Users can create hydration entries, read their own
    match /hydrationEntries/{entryId} {
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow read: if request.auth != null && (resource.data.userId == request.auth.uid || request.query.limit <= 10);
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }

    // Users can read/write their own pet
    match /pets/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 5. Run the App

```bash
# Start Expo development server
npm start

# Or for specific platforms
npm run ios      # iOS Simulator
npm run android  # Android Emulator
```

Scan the QR code with Expo Go app on your device, or press `i` for iOS simulator, `a` for Android emulator.

## 🤖 ML Model Integration (Future Work)

The app currently uses placeholder functions for bottle detection and water level classification. To integrate the actual ML model:

1. **Download the Dataset:**

   ```python
   import kagglehub
   path = kagglehub.dataset_download("chethuhn/water-bottle-dataset")
   print("Path to dataset files:", path)
   ```

2. **Train the Model:**
   - Use TensorFlow, PyTorch, or ML Kit
   - Train on the water bottle dataset
   - Convert to TensorFlow Lite (.tflite) or ONNX format

3. **Integrate with React Native:**
   - Use `@tensorflow/tfjs-react-native` or `react-native-ml-kit`
   - Update `/app/services/ml/waterLevelClassifier.ts`
   - Update `/app/screens/ScanBottleScreen.tsx` to use actual model inference

4. **Update the Camera Screen:**
   - Replace placeholder `detectBottleTypeSimulated()` with actual detection
   - Replace placeholder `detectWaterLevelSimulated()` with ML model classification
   - Implement `estimateVolumeSimulated()` with actual volume estimation

## 📱 App Flow

1. **Onboarding**: User enters height, weight, age, activity level
   - App calculates daily water goal
   - User names their pet
   - Pet is initialized

2. **Scan Bottle**:
   - User points camera at water bottle
   - App detects bottle type and water level (using ML model)
   - User confirms or retakes photo

3. **Verification**:
   - User must scan empty bottle to verify they drank the water
   - Can be skipped (with warning)

4. **Rewards**:
   - Pet gains experience and evolves
   - Hydration logged and displayed on home screen
   - Leaderboard updates in real-time

5. **Social Features**:
   - View leaderboard of friends
   - Visit friends' pets to see their status

## 🗂️ Project Structure

```
app/
├── components/          # Reusable components (Pet, Button, etc.)
├── context/            # React Context (AuthContext)
├── navigators/         # Navigation setup
├── screens/            # Screen components
│   ├── OnboardingScreen.tsx
│   ├── HomeScreen.tsx
│   ├── ScanBottleScreen.tsx
│   ├── LeaderboardScreen.tsx
│   └── FriendPetScreen.tsx
├── services/
│   ├── firebase/       # Firebase configuration and services
│   └── ml/            # ML model integration (placeholder)
└── utils/             # Utility functions
    ├── waterGoalCalculator.ts
    └── petEvolution.ts
```

## 🔧 Troubleshooting

### Camera Permission Issues

- iOS: Check Info.plist has `NSCameraUsageDescription`
- Android: Check AndroidManifest.xml has camera permission
- Both are configured in `app.json`

### Firebase Connection Issues

- Verify Firebase config values are correct
- Check Firebase project is active
- Ensure Authentication is enabled
- Verify Firestore database is created

### Build Errors

- Clear cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be >= 20.0.0)

## 📝 Environment Variables

For production, use environment variables instead of hardcoding Firebase config:

1. Install `expo-constants` if not already installed
2. Create `.env` file (already gitignored)
3. Prefix variables with `EXPO_PUBLIC_` to make them available in the app
4. Access via `process.env.EXPO_PUBLIC_FIREBASE_API_KEY`

## 🎨 Customization

- **Pet Types**: Edit `/app/components/Pet.tsx` to add new pet types
- **Activity Levels**: Modify `/app/utils/waterGoalCalculator.ts` for different calculation formulas
- **Pet Evolution**: Update thresholds in `/app/utils/petEvolution.ts`

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Navigation](https://reactnavigation.org/)
- [Expo Camera](https://docs.expo.dev/versions/latest/sdk/camera/)
- [Water Bottle Dataset](https://www.kaggle.com/datasets/chethuhn/water-bottle-dataset)

## 🚧 Future Enhancements

- [ ] Implement actual ML model for bottle detection
- [ ] Add OCR for label reading
- [ ] Web search integration for bottle database
- [ ] Friend system (add/remove friends)
- [ ] Push notifications for hydration reminders
- [ ] Weekly/monthly statistics
- [ ] Social sharing features
- [ ] Custom pet themes/styles
- [ ] Achievements/badges system

## 📄 License

[Your License Here]

## 👥 Contributors

[Your Name/Team]

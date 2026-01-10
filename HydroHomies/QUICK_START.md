# 🚀 Quick Start Guide - Running HydroHype

## Prerequisites Check

Before running, ensure you have:
- ✅ Node.js >= 20.0.0 (`node --version`)
- ✅ npm or yarn installed
- ✅ Firebase project set up (see Step 2 below)
- ✅ iOS Simulator (for Mac) OR Android Emulator OR Physical device with Expo Go

## Step-by-Step Instructions

### 1. Navigate to Project Directory

```bash
cd /Users/re/Desktop/HydroHomies/HydroHomies
```

### 2. Configure Firebase (Required!)

**You MUST configure Firebase before the app will work!**

1. Open `/app/services/firebase/config.ts`
2. Replace the placeholder values with your Firebase project credentials:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "123456789",
  appId: "YOUR_APP_ID",
}
```

**To get your Firebase credentials:**
- Go to [Firebase Console](https://console.firebase.google.com/)
- Create a new project (or select existing)
- Go to Project Settings > General
- Scroll to "Your apps" and add a web app
- Copy the config values

**Enable Firebase services:**
- Authentication: Go to Authentication > Sign-in method > Enable Email/Password
- Firestore: Go to Firestore Database > Create database (start in test mode)

### 3. Install Dependencies (if not already done)

```bash
npm install
```

Dependencies should already be installed based on package-lock.json, but if you see errors, run this.

### 4. Start the Development Server

Choose one of these methods:

#### Option A: Using Expo Dev Client (Recommended)

```bash
npm start
```

Then:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator  
- Scan QR code with Expo Go app on your phone
- Press `w` for web browser

#### Option B: Platform-Specific Commands

**iOS (Mac only):**
```bash
npm run ios
```
This will automatically open the iOS Simulator.

**Android:**
```bash
npm run android
```
This will automatically open the Android Emulator (if running) or prompt you to start one.

**Web:**
```bash
npm run web
```
Opens the app in your default browser (limited functionality - camera won't work).

### 5. First Run Setup

When the app starts:
1. **Login Screen**: Create an account by entering email and password (it will auto-create if user doesn't exist)
2. **Onboarding**: Enter your stats (Height, Weight, Age, Activity Level)
3. **Home Screen**: You'll see your pet and hydration dashboard

## Troubleshooting

### "Firebase: Error (auth/invalid-api-key)"
- Make sure you've configured Firebase credentials in `app/services/firebase/config.ts`
- Verify your Firebase project is active

### "Camera permission denied"
- iOS: Settings > Privacy & Security > Camera > Allow HydroHype
- Android: App Info > Permissions > Camera > Allow

### "Network request failed" or Firebase connection errors
- Check your internet connection
- Verify Firebase project is active in Firebase Console
- Check Firestore security rules (they should allow authenticated users)

### Metro bundler won't start
```bash
# Clear cache and restart
npm start -- --clear
```

### Dependencies issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors
```bash
# Check for type errors
npm run compile
```

## Development Workflow

### Hot Reload
- The app automatically reloads when you save files
- Shake your device/simulator to open developer menu

### Debugging
- Chrome DevTools: `Cmd+D` (iOS) or `Cmd+M` (Android) > "Debug"
- Reactotron: Available in dev mode (see console for connection)
- Logs: Check terminal where `npm start` is running

### Building for Production

**iOS:**
```bash
npm run build:ios:prod
```

**Android:**
```bash
npm run build:android:prod
```

## Quick Commands Reference

```bash
npm start              # Start Expo dev server
npm run ios            # Run on iOS Simulator
npm run android        # Run on Android Emulator
npm run web            # Run in web browser
npm run compile        # Check TypeScript errors
npm run lint           # Fix linting errors
npm run lint:check     # Check linting errors
npm test               # Run tests
npm start -- --clear   # Clear cache and start
```

## Environment Variables (Optional but Recommended)

For production, use environment variables instead of hardcoding Firebase config:

1. Install `expo-constants` (already installed)
2. Create `.env` file in project root:
```
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```
3. Update `app/services/firebase/config.ts` to use `process.env.EXPO_PUBLIC_*`

## Testing the App Flow

1. ✅ Sign up with email/password
2. ✅ Complete onboarding (height, weight, age, activity level)
3. ✅ Name your pet
4. ✅ View home screen with pet and hydration progress
5. ✅ Tap "Log Water" to scan bottle (camera will open)
6. ✅ Take photo of bottle (uses placeholder detection)
7. ✅ Verify with empty bottle photo
8. ✅ See pet gain XP and evolve
9. ✅ View leaderboard
10. ✅ Tap on leaderboard user to see their pet

## Need Help?

- Check [SETUP.md](./SETUP.md) for detailed setup instructions
- Check [README.md](../README.md) for project overview
- Firebase errors: Check Firebase Console for service status
- Expo errors: Check [Expo Docs](https://docs.expo.dev/)

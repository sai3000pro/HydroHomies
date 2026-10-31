import { Platform } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { getApp, getApps, initializeApp } from "firebase/app"
import {
  Auth,
  connectAuthEmulator,
  getAuth,
  initializeAuth,
  // @ts-expect-error -- only exported by the React Native build of @firebase/auth, which Metro resolves
  getReactNativePersistence,
} from "firebase/auth"
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore"
import { connectFunctionsEmulator, getFunctions } from "firebase/functions"

/**
 * Local testing: EXPO_PUBLIC_USE_FIREBASE_EMULATORS=1 points Auth and Firestore at
 * `npm run emulators` instead of the real project. Use EXPO_PUBLIC_FIREBASE_EMULATOR_HOST
 * for a phone or Android emulator (e.g. 10.0.2.2 or your PC's LAN IP).
 */
const useEmulators = process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS === "1"
const emulatorHost = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST || "localhost"

// Firebase web config. These values identify the project and are not secrets;
// access is controlled by firestore.rules. Override them with EXPO_PUBLIC_FIREBASE_* in .env.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyASVhkeR4SIlgTpQUfDUeTkEeRBwvM4awc",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "hydrohype-9fa73.firebaseapp.com",
  projectId: useEmulators
    ? "demo-hydrohype"
    : process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "hydrohype-9fa73",
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "hydrohype-9fa73.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1035226290940",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:1035226290940:web:7db3946b1d05691f471579",
}

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.apiKey !== "your-api-key",
)

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

function createAuth(): Auth {
  if (Platform.OS === "web") return getAuth(app)
  try {
    // Persist the session across app restarts
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
  } catch (error: any) {
    // Fast refresh re-runs this module after auth already exists
    if (error?.code !== "auth/already-initialized") {
      console.warn("Auth persistence unavailable, falling back to in-memory auth:", error?.message)
    }
    return getAuth(app)
  }
}

export const auth = createAuth()
export const db = getFirestore(app)
export const functions = getFunctions(
  app,
  process.env.EXPO_PUBLIC_FIREBASE_FUNCTIONS_REGION || "us-central1",
)

// Fast refresh re-runs this module; connecting twice throws, so only connect once
const globalFlags = globalThis as { __hydroEmulatorsConnected?: boolean }
if (useEmulators && !globalFlags.__hydroEmulatorsConnected) {
  globalFlags.__hydroEmulatorsConnected = true
  connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true })
  connectFirestoreEmulator(db, emulatorHost, 8080)
  // Keeps photos on this machine; the call fails unless the Functions emulator is running too
  connectFunctionsEmulator(functions, emulatorHost, 5001)
}

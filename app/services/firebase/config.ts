import { initializeApp, getApps, FirebaseApp } from "firebase/app"
import { getAuth, initializeAuth, getReactNativePersistence, Auth } from "firebase/auth"
import { getFirestore, Firestore } from "firebase/firestore"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Platform } from "react-native"

// Firebase configuration
// Values from Firebase Console -> Project Settings -> General -> Your apps
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyASVhkeR4SIlgTpQUfDUeTkEeRBwvM4awc",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "hydrohype-9fa73.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "hydrohype-9fa73",
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "hydrohype-9fa73.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1035226290940",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:1035226290940:web:7db3946b1d05691f471579",
}

// Check if Firebase is configured (not using placeholder values)
const isFirebaseConfigured =
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== "your-api-key" &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== "your-project-id" &&
  firebaseConfig.authDomain &&
  firebaseConfig.authDomain !== "your-project.firebaseapp.com"

if (!isFirebaseConfigured && __DEV__) {
  console.warn(
    "⚠️ Firebase is not configured!\n" +
      "Please update app/services/firebase/config.ts with your Firebase credentials.\n" +
      "Get them from: https://console.firebase.google.com/ -> Project Settings -> General",
  )
}

let app: FirebaseApp
let auth: Auth
let db: Firestore

// Firebase initializeApp won't throw on invalid config, it only fails when you try to use it
// So we can safely initialize even with placeholder values
if (getApps().length === 0) {
  console.log("Initializing Firebase app...")
  try {
    app = initializeApp(firebaseConfig)
    console.log("Firebase app initialized successfully")
  } catch (error: any) {
    console.error("Firebase initialization error:", error)
    // If initialization fails, try to continue anyway - errors will show when using auth/db
    throw error
  }
} else {
  app = getApps()[0]
  console.log("Using existing Firebase app")
}

// Initialize Firebase Auth with AsyncStorage persistence for React Native
// IMPORTANT: initializeAuth must be called BEFORE getAuth to configure persistence
// getAuth() will auto-initialize auth if it doesn't exist, preventing us from configuring persistence
// So we MUST try initializeAuth first, then fall back to getAuth if it's already initialized

if (Platform.OS !== "web") {
  // For React Native (iOS/Android), try initializeAuth with AsyncStorage persistence first
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    })
    console.log("✅ Firebase auth initialized with AsyncStorage persistence")
  } catch (initError: any) {
    // If initializeAuth fails, auth is likely already initialized
    // Check error code to see if it's "already-initialized"
    if (initError.code === "auth/already-initialized" || initError.message?.includes("already initialized")) {
      console.warn("⚠️  Firebase auth already initialized - using existing instance")
      console.warn("    (Persistence may not be configured. Clear app data to re-initialize with persistence)")
      auth = getAuth(app)
    } else {
      // Other error - try getAuth as fallback
      console.warn("⚠️  Error initializing auth with persistence, falling back to getAuth:", initError.message)
      auth = getAuth(app)
    }
  }
} else {
  // For web, use default getAuth (handles persistence automatically via localStorage)
  auth = getAuth(app)
  console.log("✅ Firebase auth initialized for web (uses localStorage)")
}

try {
  db = getFirestore(app)
  console.log("✅ Firebase auth and firestore initialized successfully")
} catch (error: any) {
  console.error("❌ Error initializing firestore:", error)
  throw error
}

export { app, auth, db, isFirebaseConfigured }

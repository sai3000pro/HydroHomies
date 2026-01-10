import { initializeApp, getApps, FirebaseApp } from "firebase/app"
import { getAuth, Auth } from "firebase/auth"
import { getFirestore, Firestore } from "firebase/firestore"

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

try {
  auth = getAuth(app)
  db = getFirestore(app)
  console.log("Firebase auth and firestore initialized")
} catch (error: any) {
  console.error("Error getting auth/firestore:", error)
  // This shouldn't happen, but if it does, throw it
  throw error
}

export { app, auth, db, isFirebaseConfigured }

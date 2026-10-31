import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  User,
} from "firebase/auth"

import { auth } from "./config"

export const authService = {
  async signUp(email: string, password: string, displayName?: string): Promise<User> {
    const { user } = await createUserWithEmailAndPassword(auth, email, password)
    if (displayName) await updateProfile(user, { displayName })
    return user
  },

  async signIn(email: string, password: string): Promise<User> {
    const { user } = await signInWithEmailAndPassword(auth, email, password)
    return user
  },

  async signOut(): Promise<void> {
    await firebaseSignOut(auth)
  },

  getCurrentUser(): User | null {
    return auth.currentUser
  },
}

/** Turns a Firebase auth error into a message for the user */
export function describeAuthError(error: any): string {
  switch (error?.code) {
    case "auth/email-already-in-use":
      return "That email is already in use."
    case "auth/invalid-email":
      return "Invalid email address."
    case "auth/weak-password":
      return "Password is too weak. Use at least 6 characters."
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Email or password is incorrect."
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again."
    case "auth/too-many-requests":
      return "Too many attempts. Try again later."
    case "auth/invalid-api-key":
      return "Firebase is not configured. See SETUP.md."
    default:
      return error?.message || "Something went wrong. Please try again."
  }
}

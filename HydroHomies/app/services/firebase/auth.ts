import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
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

  /** Emails a reset link. Succeeds even for unknown emails, so it can't be used to probe accounts. */
  async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (e: any) {
      if (e?.code !== "auth/user-not-found") throw e
    }
  },

  /** Confirms the password; Firebase requires a recent sign-in before deleting an account */
  async reauthenticate(password: string): Promise<void> {
    const user = auth.currentUser
    if (!user?.email) throw new Error("Not signed in.")
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password))
  },

  /** Deletes the sign-in account itself. Delete the user's data first. */
  async deleteCurrentUser(): Promise<void> {
    const user = auth.currentUser
    if (!user) throw new Error("Not signed in.")
    await deleteUser(user)
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
    case "auth/requires-recent-login":
      return "For security, enter your password again."
    case "auth/missing-email":
      return "Enter your email address first."
    case "permission-denied":
      return "You don't have permission to do that."
    case "unavailable":
      return "Can't reach the server. Check your connection and try again."
    default:
      return error?.message || "Something went wrong. Please try again."
  }
}

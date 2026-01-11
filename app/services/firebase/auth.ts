import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User,
  updateProfile,
} from "firebase/auth"
import { auth } from "./config"

export interface UserProfile {
  email: string
  displayName?: string
  uid: string
}

export const authService = {
  async signUp(email: string, password: string, displayName?: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    if (displayName && user) {
      await updateProfile(user, { displayName })
    }

    return user
  },

  async signIn(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  },

  async signOut(): Promise<void> {
    await firebaseSignOut(auth)
  },

  getCurrentUser(): User | null {
    return auth.currentUser
  },
}

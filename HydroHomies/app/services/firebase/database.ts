import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  where,
  Timestamp,
  increment,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "./config"

export interface UserStats {
  height: number // in cm
  weight: number // in kg
  age: number
  activityLevel: "low" | "moderate" | "high" | "very_high"
  dailyWaterGoal: number // in ml
}

export interface UserProfile {
  uid: string
  email: string
  displayName?: string
  stats?: UserStats
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface HydrationEntry {
  id: string
  userId: string
  amount: number // in ml
  timestamp: Timestamp
  bottleType?: string
  beforeImageUri?: string
  afterImageUri?: string
  verified: boolean
}

export interface PetState {
  userId: string
  level: number // 0-100
  health: number // 0-100
  experience: number
  lastFed: Timestamp
  name: string
  type: "seed" | "sprout" | "plant" | "flower" | "droplet" | "fish"
  updatedAt: Timestamp
}

export interface LeaderboardEntry {
  userId: string
  displayName: string
  totalHydration: number // ml today
  percentageOfGoal: number
  petHealth: number
}

export const databaseService = {
  // User Profile
  async createUserProfile(uid: string, email: string, displayName?: string): Promise<void> {
    const userRef = doc(db, "users", uid)
    await setDoc(userRef, {
      uid,
      email,
      displayName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  },

  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const userRef = doc(db, "users", uid)
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  },

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const userRef = doc(db, "users", uid)
    const userSnap = await getDoc(userRef)
    return userSnap.exists() ? (userSnap.data() as UserProfile) : null
  },

  // Hydration Entries
  async addHydrationEntry(entry: Omit<HydrationEntry, "id" | "timestamp">): Promise<string> {
    const entriesRef = collection(db, "hydrationEntries")
    const newEntryRef = doc(entriesRef)
    await setDoc(newEntryRef, {
      ...entry,
      id: newEntryRef.id,
      timestamp: serverTimestamp(),
    })

    // Update user's total for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStart = Timestamp.fromDate(today)

    const userEntriesQuery = query(
      collection(db, "hydrationEntries"),
      where("userId", "==", entry.userId),
      where("timestamp", ">=", todayStart),
    )

    // Calculate total for today (this could be optimized with a daily summary document)
    return newEntryRef.id
  },

  async getUserHydrationToday(userId: string): Promise<number> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStart = Timestamp.fromDate(today)

    // Query today's hydration entries
    const entriesQuery = query(
      collection(db, "hydrationEntries"),
      where("userId", "==", userId),
      where("timestamp", ">=", todayStart),
    )

    const snapshot = await getDocs(entriesQuery)
    const entries = snapshot.docs.map((doc) => doc.data() as HydrationEntry)
    const total = entries.reduce((sum, entry) => sum + (entry.amount || 0), 0)

    return total
  },

  // Pet State
  async initializePet(userId: string, name: string): Promise<void> {
    const petRef = doc(db, "pets", userId)
    await setDoc(petRef, {
      userId,
      level: 0,
      health: 100,
      experience: 0,
      lastFed: serverTimestamp(),
      name,
      type: "seed",
      updatedAt: serverTimestamp(),
    })
  },

  async updatePet(userId: string, updates: Partial<PetState>): Promise<void> {
    const petRef = doc(db, "pets", userId)
    await updateDoc(petRef, {
      ...updates,
      // If health is reset to 100 (after hydration), update lastFed timestamp
      // This happens when updatePetAfterHydration is called
      ...(updates.health !== undefined && updates.health === 100
        ? { lastFed: serverTimestamp() }
        : {}),
      updatedAt: serverTimestamp(),
    })
  },

  async getPet(userId: string): Promise<PetState | null> {
    const petRef = doc(db, "pets", userId)
    const petSnap = await getDoc(petRef)
    return petSnap.exists() ? (petSnap.data() as PetState) : null
  },

  // Leaderboard
  subscribeToLeaderboard(
    callback: (entries: LeaderboardEntry[]) => void,
    limitCount: number = 10,
  ): () => void {
    // This is a simplified version - in production, you'd maintain a daily summary collection
    // For now, we'll calculate leaderboard from entries (which can be expensive)
    // Consider creating a "dailySummaries" collection that gets updated when entries are added

    const q = query(collection(db, "users"), orderBy("updatedAt", "desc"), limit(limitCount))

    return onSnapshot(q, (snapshot) => {
      // Transform to leaderboard entries
      // In a real implementation, you'd join with hydration data
      const entries: LeaderboardEntry[] = snapshot.docs.map((doc) => {
        const data = doc.data() as UserProfile
        return {
          userId: data.uid,
          displayName: data.displayName || data.email,
          totalHydration: 0, // Would be calculated from daily summary
          percentageOfGoal: 0, // Would be calculated
          petHealth: 100, // Would be fetched from pet document
        }
      })

      callback(entries)
    })
  },

  // Friend's Pet View
  async getFriendPet(userId: string): Promise<PetState | null> {
    return this.getPet(userId)
  },
}

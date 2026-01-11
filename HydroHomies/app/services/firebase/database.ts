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
import { getAuth } from "firebase/auth"
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
    // Remove undefined values - Firestore doesn't allow undefined
    const profileData: Partial<UserProfile> = {
      uid,
      email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    // Only include displayName if it's provided (not undefined)
    if (displayName) {
      profileData.displayName = displayName
    }
    await setDoc(userRef, profileData)
  },

  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const userRef = doc(db, "users", uid)
    
    // Check if document exists first
    const userSnap = await getDoc(userRef)
    
    if (!userSnap.exists()) {
      // Document doesn't exist - create it with setDoc
      // Get email from auth user if not provided in updates
      let email = updates.email || ""
      if (!email) {
        try {
          const auth = getAuth()
          const currentUser = auth.currentUser
          if (currentUser && currentUser.uid === uid) {
            email = currentUser.email || ""
          }
        } catch (error) {
          console.warn("Could not get email from auth user:", error)
        }
      }
      
      // Create the document with all required fields
      // Remove undefined values - Firestore doesn't allow undefined
      const profileData: Record<string, any> = {
        uid,
        email: email || "", // Email is required for user profile
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
      
      // Only include fields from updates that are not undefined
      // This ensures we don't set undefined values in Firestore
      if (updates.stats !== undefined) {
        profileData.stats = updates.stats
      }
      if (updates.displayName !== undefined && updates.displayName !== null) {
        profileData.displayName = updates.displayName
      }
      if (updates.email !== undefined) {
        profileData.email = updates.email
      }
      
      await setDoc(userRef, profileData, { merge: false }) // Use merge: false to ensure all fields are set when creating
    } else {
      // Document exists - update it with updateDoc (more efficient)
      // Only update fields that are provided (not undefined)
      const updateData: Partial<UserProfile> = {
        ...updates,
        updatedAt: serverTimestamp(),
      }
      // Remove undefined values to avoid overwriting existing data
      Object.keys(updateData).forEach((key) => {
        if (updateData[key as keyof UserProfile] === undefined) {
          delete updateData[key as keyof UserProfile]
        }
      })
      await updateDoc(userRef, updateData)
    }
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

    try {
      // Query today's hydration entries
      // Note: This requires a Firestore composite index (userId + timestamp)
      // If the index doesn't exist, Firestore will provide a URL to create it
      const entriesQuery = query(
        collection(db, "hydrationEntries"),
        where("userId", "==", userId),
        where("timestamp", ">=", todayStart),
      )

      const snapshot = await getDocs(entriesQuery)
      const entries = snapshot.docs.map((doc) => doc.data() as HydrationEntry)
      const total = entries.reduce((sum, entry) => sum + (entry.amount || 0), 0)

      return total
    } catch (error: any) {
      // Handle Firestore index errors gracefully
      if (error.code === "failed-precondition" && error.message?.includes("index")) {
        console.warn(
          "⚠️  Firestore index required for hydration query. " +
            "Creating the index will enable efficient queries. " +
            "Using fallback query (may be slower)."
        )
        
        // Fallback: Query all entries for user and filter in-memory
        // This works without an index but is less efficient
        const fallbackQuery = query(
          collection(db, "hydrationEntries"),
          where("userId", "==", userId),
        )
        
        const snapshot = await getDocs(fallbackQuery)
        const allEntries = snapshot.docs.map((doc) => doc.data() as HydrationEntry)
        
        // Filter for today's entries in-memory
        const todayEntries = allEntries.filter((entry) => {
          if (!entry.timestamp) return false
          const entryDate = entry.timestamp.toDate()
          return entryDate >= todayStart.toDate()
        })
        
        const total = todayEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0)
        return total
      }
      
      // Re-throw other errors
      throw error
    }
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

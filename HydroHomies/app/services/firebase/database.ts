/**
 * Firestore data model and all reads/writes.
 *
 * users/{uid}            private profile and body stats (owner-only)
 * pets/{uid}             the user's pet (public to signed-in users)
 * hydrationEntries/{id}  one logged drink (owner-only)
 * dailySummaries/{uid}_{YYYY-MM-DD}  per-day total + display info (public, feeds the leaderboard)
 */
import {
  collection,
  deleteField,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore"

import { dailySummaryId, toDateKey } from "@/utils/dateKey"
import { feedPet, isPetSpecies, type PetSpecies } from "@/utils/petEvolution"
import { calculateDailyWaterGoal, type UserStats } from "@/utils/waterGoalCalculator"

import { db } from "./config"

export interface StoredUserStats extends UserStats {
  dailyWaterGoal: number // ml
}

export interface UserProfile {
  uid: string
  email: string
  username: string
  stats?: StoredUserStats
}

export interface PetState {
  userId: string
  ownerName: string
  name: string
  species: PetSpecies
  experience: number
  health: number // 0-100 at lastFed; decays over time (see petEvolution.currentHealth)
  lastFed: Date | null
}

export type EstimateSource = "ai" | "on-device" | "manual"

export interface HydrationEntry {
  id: string
  userId: string
  dateKey: string
  amount: number // ml consumed
  beforeVolume: number
  afterVolume: number
  bottleVolume: number | null
  source: EstimateSource
  timestamp: Date | null
}

export interface DailySummary {
  userId: string
  dateKey: string
  displayName: string
  totalMl: number
  goalMl: number
  entryCount: number
  petName: string | null
  petSpecies: PetSpecies | null
  petExperience: number
}

/** Largest single drink we accept, in ml. Mirrors firestore.rules. */
export const MAX_ENTRY_ML = 3000

const toDate = (v: unknown): Date | null => (v instanceof Timestamp ? v.toDate() : null)
const num = (v: unknown, fallback = 0) =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback

export function parseUserProfile(uid: string, data: DocumentData): UserProfile {
  const s = data.stats
  let stats: StoredUserStats | undefined
  if (s && typeof s === "object") {
    const base = {
      height: num(s.height),
      weight: num(s.weight),
      age: num(s.age),
      sex: s.sex ?? "other",
      activityLevel: s.activityLevel ?? "moderate",
    } as UserStats
    stats = { ...base, dailyWaterGoal: num(s.dailyWaterGoal) || calculateDailyWaterGoal(base) }
  }
  return {
    uid,
    email: typeof data.email === "string" ? data.email : "",
    username: typeof data.username === "string" ? data.username : (data.displayName ?? ""),
    stats,
  }
}

/**
 * Reads both the current pet format and the hackathon format that was stored
 * inside users/{uid}.pet ({ type, currentXp, ... }).
 */
export function parsePet(userId: string, data: DocumentData): PetState {
  const species = isPetSpecies(data.species)
    ? data.species
    : isPetSpecies(data.type)
      ? data.type
      : "elephant"
  return {
    userId,
    ownerName: typeof data.ownerName === "string" ? data.ownerName : "",
    name: typeof data.name === "string" && data.name ? data.name : "Buddy",
    species,
    experience: num(data.experience, num(data.currentXp)),
    health: num(data.health, 100),
    lastFed: toDate(data.lastFed),
  }
}

function parseEntry(id: string, data: DocumentData): HydrationEntry {
  return {
    id,
    userId: data.userId,
    dateKey: data.dateKey ?? "",
    amount: num(data.amount),
    beforeVolume: num(data.beforeVolume),
    afterVolume: num(data.afterVolume),
    bottleVolume: typeof data.bottleVolume === "number" ? data.bottleVolume : null,
    source: data.source ?? "manual",
    timestamp: toDate(data.timestamp),
  }
}

function parseSummary(data: DocumentData): DailySummary {
  return {
    userId: data.userId,
    dateKey: data.dateKey,
    displayName: data.displayName || "Anonymous",
    totalMl: num(data.totalMl),
    goalMl: num(data.goalMl, 2500),
    entryCount: num(data.entryCount),
    petName: data.petName ?? null,
    petSpecies: isPetSpecies(data.petSpecies) ? data.petSpecies : null,
    petExperience: num(data.petExperience),
  }
}

export const databaseService = {
  // ---------- Profile ----------

  /** Creates or completes the private profile. Merges, so it never wipes other fields. */
  async saveProfile(uid: string, profile: { email: string; username: string; stats: UserStats }) {
    await setDoc(
      doc(db, "users", uid),
      {
        uid,
        email: profile.email,
        username: profile.username,
        stats: { ...profile.stats, dailyWaterGoal: calculateDailyWaterGoal(profile.stats) },
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  },

  subscribeToProfile(
    uid: string,
    cb: (p: UserProfile | null) => void,
    onError?: (e: Error) => void,
  ) {
    return onSnapshot(
      doc(db, "users", uid),
      (snap) => cb(snap.exists() ? parseUserProfile(uid, snap.data()) : null),
      onError,
    )
  },

  // ---------- Pet ----------

  async adoptPet(userId: string, ownerName: string, species: PetSpecies, name: string) {
    await setDoc(doc(db, "pets", userId), {
      userId,
      ownerName,
      name,
      species,
      experience: 0,
      health: 100,
      lastFed: serverTimestamp(),
      adoptedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  },

  subscribeToPet(userId: string, cb: (p: PetState | null) => void, onError?: (e: Error) => void) {
    return onSnapshot(
      doc(db, "pets", userId),
      (snap) => cb(snap.exists() ? parsePet(userId, snap.data()) : null),
      onError,
    )
  },

  async getPet(userId: string): Promise<PetState | null> {
    const snap = await getDoc(doc(db, "pets", userId))
    return snap.exists() ? parsePet(userId, snap.data()) : null
  },

  /**
   * One-time move of a hackathon-era pet from users/{uid}.pet into pets/{uid}.
   * Returns true if a pet was migrated.
   */
  async migrateLegacyPet(uid: string, ownerName: string): Promise<boolean> {
    return runTransaction(db, async (tx) => {
      const userRef = doc(db, "users", uid)
      const petRef = doc(db, "pets", uid)
      const [userSnap, petSnap] = [await tx.get(userRef), await tx.get(petRef)]
      const legacy = userSnap.data()?.pet
      if (!legacy || typeof legacy !== "object") return false
      if (!petSnap.exists()) {
        const pet = parsePet(uid, legacy)
        tx.set(petRef, {
          userId: uid,
          ownerName,
          name: pet.name,
          species: pet.species,
          experience: Math.min(1000, Math.max(0, Math.round(pet.experience))),
          health: Math.round(pet.health),
          lastFed: serverTimestamp(),
          adoptedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }
      tx.update(userRef, { pet: deleteField() })
      return true
    })
  },

  // ---------- Hydration ----------

  /**
   * Logs a drink in one transaction: the entry, the pet's XP/health, and the
   * daily summary used by the leaderboard all change together.
   */
  async logHydration(params: {
    profile: UserProfile
    amount: number
    beforeVolume: number
    afterVolume: number
    bottleVolume: number | null
    source: EstimateSource
  }): Promise<{ entryId: string; totalToday: number }> {
    const { profile } = params
    // Stored as whole ml, so validate the rounded value (the rules reject 0)
    const amount = Math.round(params.amount)
    if (!Number.isFinite(amount) || amount < 1 || amount > MAX_ENTRY_ML) {
      throw new Error(`Amount must be between 1 and ${MAX_ENTRY_ML} ml`)
    }
    const uid = profile.uid
    const dateKey = toDateKey()
    const goalMl = profile.stats?.dailyWaterGoal ?? 2500
    const entryRef = doc(collection(db, "hydrationEntries"))
    const petRef = doc(db, "pets", uid)
    const summaryRef = doc(db, "dailySummaries", dailySummaryId(uid, dateKey))

    return runTransaction(db, async (tx) => {
      const petSnap = await tx.get(petRef)
      const summarySnap = await tx.get(summaryRef)
      const pet = petSnap.exists() ? parsePet(uid, petSnap.data()) : null
      const prev = summarySnap.exists() ? parseSummary(summarySnap.data()) : null

      tx.set(entryRef, {
        userId: uid,
        dateKey,
        amount: Math.round(amount),
        beforeVolume: Math.round(params.beforeVolume),
        afterVolume: Math.round(params.afterVolume),
        bottleVolume: params.bottleVolume,
        source: params.source,
        verified: true,
        timestamp: serverTimestamp(),
      })

      let petExperience = 0
      if (pet) {
        const fed = feedPet(pet, amount, goalMl)
        petExperience = fed.experience
        tx.update(petRef, {
          experience: fed.experience,
          health: fed.health,
          lastFed: serverTimestamp(),
          ownerName: profile.username,
          updatedAt: serverTimestamp(),
        })
      }

      const totalMl = (prev?.totalMl ?? 0) + Math.round(amount)
      tx.set(summaryRef, {
        userId: uid,
        dateKey,
        displayName: profile.username || "Anonymous",
        totalMl,
        goalMl,
        entryCount: (prev?.entryCount ?? 0) + 1,
        petName: pet?.name ?? null,
        petSpecies: pet?.species ?? null,
        petExperience,
        updatedAt: serverTimestamp(),
      })

      return { entryId: entryRef.id, totalToday: totalMl }
    })
  },

  subscribeToTodayEntries(
    userId: string,
    cb: (entries: HydrationEntry[]) => void,
    onError?: (e: Error) => void,
  ): Unsubscribe {
    // Two equality filters need no composite index; sort client-side.
    const q = query(
      collection(db, "hydrationEntries"),
      where("userId", "==", userId),
      where("dateKey", "==", toDateKey()),
    )
    return onSnapshot(
      q,
      (snap) => {
        const entries = snap.docs.map((d) => parseEntry(d.id, d.data()))
        entries.sort(
          (a, b) => (b.timestamp?.getTime() ?? Infinity) - (a.timestamp?.getTime() ?? Infinity),
        )
        cb(entries)
      },
      onError,
    )
  },

  subscribeToDailySummary(
    userId: string,
    cb: (s: DailySummary | null) => void,
    onError?: (e: Error) => void,
  ): Unsubscribe {
    return onSnapshot(
      doc(db, "dailySummaries", dailySummaryId(userId)),
      (snap) => cb(snap.exists() ? parseSummary(snap.data()) : null),
      onError,
    )
  },

  // ---------- Leaderboard ----------

  /** Today's top drinkers. Requires the (dateKey ASC, totalMl DESC) index in firestore.indexes.json. */
  subscribeToLeaderboard(
    cb: (rows: DailySummary[]) => void,
    onError?: (e: Error) => void,
    limitCount = 50,
  ): Unsubscribe {
    const q = query(
      collection(db, "dailySummaries"),
      where("dateKey", "==", toDateKey()),
      orderBy("totalMl", "desc"),
      limit(limitCount),
    )
    return onSnapshot(q, (snap) => cb(snap.docs.map((d) => parseSummary(d.data()))), onError)
  },
}

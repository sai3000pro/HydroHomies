/**
 * Firestore data model and all reads/writes.
 *
 * users/{uid}            private profile and body stats (owner-only)
 * pets/{uid}             the user's pet (public to signed-in users)
 * hydrationEntries/{id}  one logged drink (owner-only)
 * dailySummaries/{uid}_{YYYY-MM-DD}  per-day total + display info (public, feeds the leaderboard)
 * friendCodes/{CODE}     short code -> user, used to add friends (get-only)
 * users/{uid}/friends/{friendId}  mutual friend list (owner-only)
 */
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  writeBatch,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore"

import { dailySummaryId, shiftDateKey, toDateKey } from "@/utils/dateKey"
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
  /** Code other users enter to add this user as a friend. Created on first visit to Friends. */
  friendCode?: string
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
  /** Pet health right after this day's latest drink. Pair with updatedAt for current health. */
  petHealth: number
  updatedAt: Date | null
}

export interface Friend {
  friendId: string
  displayName: string
  addedAt: Date | null
}

/** Before/after thumbnails of one drink. Readable by the owner and their friends. */
export interface DrinkPhotos {
  entryId: string
  userId: string
  amount: number
  dateKey: string
  before: string // data:image/jpeg;base64,...
  after: string
  createdAt: Date | null
}

/** Letters and digits that can't be confused with each other (no O/0, I/1) */
const FRIEND_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
export const FRIEND_CODE_LENGTH = 6
/** Firestore allows at most 30 values in an `in` filter */
const IN_QUERY_LIMIT = 30

export function normalizeFriendCode(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
}

function randomFriendCode(): string {
  let code = ""
  for (let i = 0; i < FRIEND_CODE_LENGTH; i++) {
    code += FRIEND_CODE_ALPHABET[Math.floor(Math.random() * FRIEND_CODE_ALPHABET.length)]
  }
  return code
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
    friendCode: typeof data.friendCode === "string" ? data.friendCode : undefined,
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
    petHealth: num(data.petHealth, 100),
    updatedAt: toDate(data.updatedAt),
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
  }): Promise<{ entryId: string; totalToday: number; dateKey: string }> {
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
      let petHealth = 100
      if (pet) {
        const fed = feedPet(pet, amount, goalMl)
        petExperience = fed.experience
        petHealth = fed.health
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
        petHealth,
        updatedAt: serverTimestamp(),
      })

      return { entryId: entryRef.id, totalToday: totalMl, dateKey }
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

  /**
   * Today's totals for a set of users (you plus your friends), highest first.
   * Splits into several queries because `in` accepts at most 30 values.
   */
  subscribeToGroupLeaderboard(
    userIds: string[],
    cb: (rows: DailySummary[]) => void,
    onError?: (e: Error) => void,
  ): Unsubscribe {
    const ids = [...new Set(userIds)]
    if (ids.length === 0) {
      cb([])
      return () => {}
    }
    const dateKey = toDateKey()
    const chunks: string[][] = []
    for (let i = 0; i < ids.length; i += IN_QUERY_LIMIT)
      chunks.push(ids.slice(i, i + IN_QUERY_LIMIT))
    const results: (DailySummary[] | undefined)[] = chunks.map(() => undefined)
    const unsubs = chunks.map((chunk, i) =>
      onSnapshot(
        query(
          collection(db, "dailySummaries"),
          where("dateKey", "==", dateKey),
          where("userId", "in", chunk),
        ),
        (snap) => {
          results[i] = snap.docs.map((d) => parseSummary(d.data()))
          // Wait until every chunk has answered once, so the list doesn't flicker
          if (results.every((r) => r !== undefined)) {
            cb(results.flatMap((r) => r ?? []).sort((a, b) => b.totalMl - a.totalMl))
          }
        },
        onError,
      ),
    )
    return () => unsubs.forEach((u) => u())
  },

  // ---------- History ----------

  /**
   * The user's daily summaries for the last `days` days (including today), oldest first.
   * Requires the (userId ASC, dateKey ASC) index in firestore.indexes.json.
   */
  async getSummaryHistory(userId: string, days: number): Promise<DailySummary[]> {
    const from = shiftDateKey(toDateKey(), -(days - 1))
    const snap = await getDocs(
      query(
        collection(db, "dailySummaries"),
        where("userId", "==", userId),
        where("dateKey", ">=", from),
        orderBy("dateKey", "asc"),
      ),
    )
    return snap.docs.map((d) => parseSummary(d.data()))
  },

  // ---------- Drink photos ----------

  /** Saves the thumbnails for a drink that was just logged with logHydration. */
  async saveDrinkPhotos(p: {
    userId: string
    entryId: string
    amount: number
    dateKey: string
    before: string
    after: string
  }) {
    await setDoc(doc(db, "drinkPhotos", p.entryId), {
      userId: p.userId,
      amount: Math.round(p.amount),
      dateKey: p.dateKey,
      before: p.before,
      after: p.after,
      createdAt: serverTimestamp(),
    })
  },

  async deleteDrinkPhotos(entryId: string) {
    await deleteDoc(doc(db, "drinkPhotos", entryId))
  },

  /**
   * A user's latest drink photos, newest first. Fails with permission-denied
   * unless you are that user or their friend.
   * Requires the (userId ASC, createdAt DESC) index in firestore.indexes.json.
   */
  subscribeToDrinkPhotos(
    userId: string,
    cb: (photos: DrinkPhotos[]) => void,
    onError?: (e: Error & { code?: string }) => void,
    limitCount = 20,
  ): Unsubscribe {
    return onSnapshot(
      query(
        collection(db, "drinkPhotos"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(limitCount),
      ),
      (snap) =>
        cb(
          snap.docs.map((d) => {
            const data = d.data()
            return {
              entryId: d.id,
              userId: data.userId,
              amount: num(data.amount),
              dateKey: data.dateKey ?? "",
              before: data.before,
              after: data.after,
              createdAt: toDate(data.createdAt),
            }
          }),
        ),
      onError,
    )
  },

  // ---------- Friends ----------

  /** Returns the user's friend code, creating one the first time. */
  async ensureFriendCode(profile: UserProfile): Promise<string> {
    if (profile.friendCode) return profile.friendCode
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = randomFriendCode()
      const ref = doc(db, "friendCodes", code)
      try {
        await runTransaction(db, async (tx) => {
          if ((await tx.get(ref)).exists()) throw new Error("taken")
          tx.set(ref, {
            userId: profile.uid,
            displayName: profile.username.slice(0, 24),
            createdAt: serverTimestamp(),
          })
        })
      } catch (e: any) {
        if (e?.message === "taken") continue
        throw e
      }
      await setDoc(doc(db, "users", profile.uid), { friendCode: code }, { merge: true })
      return code
    }
    throw new Error("Couldn't create a friend code. Try again.")
  },

  /** Adds the owner of `rawCode` as a friend, on both users' lists. Returns their name. */
  async addFriendByCode(profile: UserProfile, rawCode: string): Promise<string> {
    const code = normalizeFriendCode(rawCode)
    if (code.length !== FRIEND_CODE_LENGTH) {
      throw new Error(`Friend codes are ${FRIEND_CODE_LENGTH} letters and numbers.`)
    }
    const codeSnap = await getDoc(doc(db, "friendCodes", code))
    if (!codeSnap.exists()) throw new Error("No one has that friend code.")
    const { userId: friendId, displayName } = codeSnap.data() as {
      userId: string
      displayName: string
    }
    if (friendId === profile.uid) throw new Error("That's your own code.")

    const mine = doc(db, "users", profile.uid, "friends", friendId)
    if ((await getDoc(mine)).exists()) throw new Error(`${displayName} is already your friend.`)

    const batch = writeBatch(db)
    batch.set(mine, { friendId, displayName, code, addedAt: serverTimestamp() })
    batch.set(doc(db, "users", friendId, "friends", profile.uid), {
      friendId: profile.uid,
      displayName: (profile.username || "Anonymous").slice(0, 24),
      code,
      addedAt: serverTimestamp(),
    })
    await batch.commit()
    return displayName
  },

  /** Ends the friendship on both sides */
  async removeFriend(userId: string, friendId: string) {
    const batch = writeBatch(db)
    batch.delete(doc(db, "users", userId, "friends", friendId))
    batch.delete(doc(db, "users", friendId, "friends", userId))
    await batch.commit()
  },

  subscribeToFriends(
    userId: string,
    cb: (friends: Friend[]) => void,
    onError?: (e: Error) => void,
  ): Unsubscribe {
    return onSnapshot(
      collection(db, "users", userId, "friends"),
      (snap) =>
        cb(
          snap.docs
            .map((d) => ({
              friendId: d.id,
              displayName: d.data().displayName || "Anonymous",
              addedAt: toDate(d.data().addedAt),
            }))
            .sort((a, b) => a.displayName.localeCompare(b.displayName)),
        ),
      onError,
    )
  },
}

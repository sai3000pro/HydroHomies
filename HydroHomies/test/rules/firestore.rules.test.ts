/**
 * Runs the real databaseService against the Firestore emulator with firestore.rules loaded.
 * Start it with `npm run test:rules`.
 */
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  type Firestore,
} from "firebase/firestore"
import { readFileSync } from "fs"
import { resolve } from "path"

import { databaseService, type DailySummary, type UserProfile } from "@/services/firebase/database"
import { dailySummaryId, toDateKey } from "@/utils/dateKey"

// databaseService reads `db` from ./config on every call, so point it at whichever test user is acting
let mockDb: Firestore | undefined
jest.mock("../../app/services/firebase/config", () => ({
  get db() {
    return mockDb
  },
}))

let env: RulesTestEnvironment

const stats = { height: 175, weight: 70, age: 25, sex: "male", activityLevel: "moderate" } as const

function actAs(uid: string | null): Firestore {
  const ctx = uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()
  mockDb = ctx.firestore() as unknown as Firestore
  return mockDb
}

/** Writes data with rules turned off, for test setup */
async function seed(path: string, data: Record<string, unknown>) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore() as unknown as Firestore, path), data)
  })
}

async function read(path: string) {
  let data: Record<string, unknown> | undefined
  await env.withSecurityRulesDisabled(async (ctx) => {
    data = (await getDoc(doc(ctx.firestore() as unknown as Firestore, path))).data()
  })
  return data
}

function profileFor(uid: string, username = uid): UserProfile {
  return { uid, email: `${uid}@test.dev`, username, stats: { ...stats, dailyWaterGoal: 2500 } }
}

function logDrink(uid: string, amount: number) {
  return databaseService.logHydration({
    profile: profileFor(uid),
    amount,
    beforeVolume: amount + 100,
    afterVolume: 100,
    bottleVolume: 1000,
    source: "manual",
  })
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-hydrohype",
    firestore: { rules: readFileSync(resolve(__dirname, "../../firestore.rules"), "utf8") },
  })
})

afterEach(() => env.clearFirestore())
afterAll(() => env.cleanup())

describe("profile (users/{uid})", () => {
  it("lets a user save their own profile at sign-up", async () => {
    actAs("alice")
    await assertSucceeds(
      databaseService.saveProfile("alice", { email: "a@x.dev", username: "alice", stats }),
    )
    expect(await read("users/alice")).toMatchObject({ username: "alice" })
  })

  it("merges, so saving again keeps other fields", async () => {
    await seed("users/alice", { username: "alice", email: "a@x.dev", extra: 1 })
    actAs("alice")
    await assertSucceeds(
      databaseService.saveProfile("alice", { email: "a@x.dev", username: "alice2", stats }),
    )
    expect(await read("users/alice")).toMatchObject({ username: "alice2", extra: 1 })
  })

  it("blocks writing someone else's profile", async () => {
    actAs("mallory")
    await assertFails(
      databaseService.saveProfile("alice", { email: "a@x.dev", username: "alice", stats }),
    )
  })

  it("blocks usernames over 24 characters", async () => {
    actAs("alice")
    await assertFails(
      databaseService.saveProfile("alice", { email: "a@x.dev", username: "x".repeat(25), stats }),
    )
  })

  it("keeps profiles private", async () => {
    await seed("users/alice", { username: "alice", email: "a@x.dev" })
    await assertSucceeds(getDoc(doc(actAs("alice"), "users/alice")))
    await assertFails(getDoc(doc(actAs("bob"), "users/alice")))
  })
})

describe("adoptPet (pets/{uid})", () => {
  it("lets a user adopt their own pet", async () => {
    actAs("alice")
    await assertSucceeds(databaseService.adoptPet("alice", "alice", "alien", "Zap"))
    expect(await read("pets/alice")).toMatchObject({ species: "alien", experience: 0 })
  })

  it("blocks adopting a pet for someone else", async () => {
    actAs("mallory")
    await assertFails(databaseService.adoptPet("alice", "alice", "alien", "Zap"))
  })

  it("blocks unknown species and bad names", async () => {
    actAs("alice")
    await assertFails(databaseService.adoptPet("alice", "alice", "dragon" as any, "Zap"))
    await assertFails(databaseService.adoptPet("alice", "alice", "alien", ""))
    await assertFails(databaseService.adoptPet("alice", "alice", "alien", "x".repeat(21)))
  })

  it("blocks creating a pet with lots of XP", async () => {
    const db = actAs("alice")
    await assertFails(
      setDoc(doc(db, "pets/alice"), {
        userId: "alice",
        species: "alien",
        name: "Zap",
        experience: 5000,
        health: 100,
      }),
    )
  })

  it("lets any signed-in user read pets, but not signed-out users", async () => {
    await seed("pets/alice", { userId: "alice", species: "alien", name: "Zap", experience: 0 })
    await assertSucceeds(getDoc(doc(actAs("bob"), "pets/alice")))
    await assertFails(getDoc(doc(actAs(null), "pets/alice")))
  })

  it("blocks big XP jumps and species changes", async () => {
    await seed("pets/alice", {
      userId: "alice",
      species: "alien",
      name: "Zap",
      experience: 100,
      health: 50,
    })
    const db = actAs("alice")
    await assertFails(updateDoc(doc(db, "pets/alice"), { experience: 401 }))
    await assertFails(updateDoc(doc(db, "pets/alice"), { experience: 50 }))
    await assertFails(updateDoc(doc(db, "pets/alice"), { species: "elephant" }))
    await assertSucceeds(updateDoc(doc(db, "pets/alice"), { experience: 400 }))
  })
})

describe("migrateLegacyPet", () => {
  it("moves a hackathon pet into pets/{uid} and removes users/{uid}.pet", async () => {
    await seed("users/alice", {
      username: "alice",
      pet: { type: "sphele", name: "Old", currentXp: 42, health: 80 },
    })
    actAs("alice")
    await expect(databaseService.migrateLegacyPet("alice", "alice")).resolves.toBe(true)
    expect(await read("pets/alice")).toMatchObject({
      userId: "alice",
      species: "sphele",
      name: "Old",
      experience: 42,
      health: 80,
    })
    expect((await read("users/alice"))?.pet).toBeUndefined()
  })

  it("caps legacy XP at 1000 so the create rule accepts it", async () => {
    await seed("users/alice", { username: "alice", pet: { type: "alien", currentXp: 9999 } })
    actAs("alice")
    await expect(databaseService.migrateLegacyPet("alice", "alice")).resolves.toBe(true)
    expect((await read("pets/alice"))?.experience).toBe(1000)
  })

  it("keeps an existing new-format pet and only clears the legacy field", async () => {
    await seed("users/alice", { username: "alice", pet: { type: "alien", currentXp: 5 } })
    await seed("pets/alice", { userId: "alice", species: "elephant", name: "New", experience: 7 })
    actAs("alice")
    await expect(databaseService.migrateLegacyPet("alice", "alice")).resolves.toBe(true)
    expect(await read("pets/alice")).toMatchObject({ species: "elephant", experience: 7 })
    expect((await read("users/alice"))?.pet).toBeUndefined()
  })

  it("does nothing when there is no legacy pet", async () => {
    await seed("users/alice", { username: "alice" })
    actAs("alice")
    await expect(databaseService.migrateLegacyPet("alice", "alice")).resolves.toBe(false)
  })
})

describe("logHydration", () => {
  const today = () => dailySummaryId("alice", toDateKey())

  beforeEach(async () => {
    await seed("users/alice", { username: "alice" })
  })

  it("logs the first drink of the day (no summary yet)", async () => {
    actAs("alice")
    await databaseService.adoptPet("alice", "alice", "alien", "Zap")
    const result = await assertSucceeds(logDrink("alice", 500))
    expect(result.totalToday).toBe(500)
    expect(await read(`dailySummaries/${today()}`)).toMatchObject({
      totalMl: 500,
      entryCount: 1,
      petName: "Zap",
      petExperience: 50,
    })
    expect((await read("pets/alice"))?.experience).toBe(50)
    expect(await read(`hydrationEntries/${result.entryId}`)).toMatchObject({ amount: 500 })
  })

  it("adds later drinks to the same summary", async () => {
    actAs("alice")
    await databaseService.adoptPet("alice", "alice", "alien", "Zap")
    await logDrink("alice", 500)
    const second = await assertSucceeds(logDrink("alice", 3000))
    expect(second.totalToday).toBe(3500)
    expect(await read(`dailySummaries/${today()}`)).toMatchObject({
      totalMl: 3500,
      entryCount: 2,
    })
    expect((await read("pets/alice"))?.experience).toBe(350)
  })

  it("works for a user without a pet", async () => {
    actAs("alice")
    await assertSucceeds(logDrink("alice", 250))
    expect(await read(`dailySummaries/${today()}`)).toMatchObject({
      totalMl: 250,
      petName: null,
    })
  })

  it("rejects amounts outside 1-3000 ml before writing", async () => {
    actAs("alice")
    await expect(logDrink("alice", 3001)).rejects.toThrow()
    await expect(logDrink("alice", 0)).rejects.toThrow()
    await expect(logDrink("alice", 0.4)).rejects.toThrow()
  })

  it("blocks writing another user's summary or entry", async () => {
    const db = actAs("mallory")
    const dateKey = toDateKey()
    await assertFails(
      setDoc(doc(db, "dailySummaries", dailySummaryId("alice", dateKey)), {
        userId: "alice",
        dateKey,
        totalMl: 100,
      }),
    )
    await assertFails(
      setDoc(doc(db, "dailySummaries", dailySummaryId("mallory", dateKey)), {
        userId: "alice",
        dateKey,
        totalMl: 100,
      }),
    )
    await assertFails(
      setDoc(doc(collection(db, "hydrationEntries")), {
        userId: "alice",
        dateKey,
        amount: 100,
      }),
    )
  })

  it("blocks inflating the daily total by more than one drink", async () => {
    const db = actAs("alice")
    const dateKey = toDateKey()
    const ref = doc(db, "dailySummaries", dailySummaryId("alice", dateKey))
    await assertFails(setDoc(ref, { userId: "alice", dateKey, totalMl: 3001 }))
    await assertSucceeds(setDoc(ref, { userId: "alice", dateKey, totalMl: 3000 }))
    await assertFails(setDoc(ref, { userId: "alice", dateKey, totalMl: 6001 }))
    await assertFails(setDoc(ref, { userId: "alice", dateKey, totalMl: 10 }))
  })

  it("keeps drinks private to their owner", async () => {
    actAs("alice")
    await logDrink("alice", 500)
    const mine = query(
      collection(actAs("alice"), "hydrationEntries"),
      where("userId", "==", "alice"),
      where("dateKey", "==", toDateKey()),
    )
    expect((await assertSucceeds(getDocs(mine))).size).toBe(1)
    const theirs = query(
      collection(actAs("bob"), "hydrationEntries"),
      where("userId", "==", "alice"),
    )
    await assertFails(getDocs(theirs))
  })
})

describe("leaderboard", () => {
  function firstSnapshot(): Promise<DailySummary[]> {
    return new Promise((res, rej) => {
      const unsub = databaseService.subscribeToLeaderboard(
        (rows) => {
          unsub()
          res(rows)
        },
        (e) => {
          unsub()
          rej(e)
        },
      )
    })
  }

  it("shows everyone's totals for today, highest first", async () => {
    await seed("users/alice", { username: "alice" })
    await seed("users/bob", { username: "bob" })
    actAs("alice")
    await logDrink("alice", 500)
    actAs("bob")
    await logDrink("bob", 1200)

    actAs("carol")
    const rows = await firstSnapshot()
    expect(rows.map((r) => [r.userId, r.totalMl])).toEqual([
      ["bob", 1200],
      ["alice", 500],
    ])
  })

  it("is not readable when signed out", async () => {
    actAs(null)
    await expect(firstSnapshot()).rejects.toMatchObject({ code: "permission-denied" })
  })
})

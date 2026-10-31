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
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
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
  return {
    uid,
    email: `${uid}@test.dev`,
    username,
    stats: { ...stats, dailyWaterGoal: 2500 },
    achievements: [],
  }
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
    // Separate from the demo-hydrohype project `npm run emulators` uses, so clearing test data
    // never wipes a manual testing session running against the same emulator
    projectId: "demo-hydrohype-rules",
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

  it("blocks XP changes that don't come with a drink, but allows renaming", async () => {
    await seed("pets/alice", {
      userId: "alice",
      species: "alien",
      name: "Zap",
      experience: 100,
      health: 50,
    })
    const db = actAs("alice")
    // No drink logged in the same write, so any XP change is refused
    await assertFails(updateDoc(doc(db, "pets/alice"), { experience: 101 }))
    await assertFails(updateDoc(doc(db, "pets/alice"), { experience: 400 }))
    await assertFails(updateDoc(doc(db, "pets/alice"), { experience: 0 }))
    await assertFails(updateDoc(doc(db, "pets/alice"), { health: 100 }))
    await assertFails(updateDoc(doc(db, "pets/alice"), { species: "elephant" }))
    await assertFails(updateDoc(doc(db, "pets/alice"), { name: "" }))
    // Claiming a drink that doesn't exist doesn't help either
    await assertFails(updateDoc(doc(db, "pets/alice"), { experience: 400, lastEntryId: "made-up" }))
    await assertSucceeds(databaseService.renamePet("alice", "Splash"))
    expect(await read("pets/alice")).toMatchObject({ name: "Splash", experience: 100 })
  })

  it("lets XP grow by exactly what a logged drink earns", async () => {
    await seed("users/alice", { username: "alice" })
    actAs("alice")
    await databaseService.adoptPet("alice", "alice", "alien", "Zap")
    await assertSucceeds(logDrink("alice", 1234))
    expect((await read("pets/alice"))?.experience).toBe(123)
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

  it("blocks changing the daily total without a matching drink", async () => {
    await seed("users/alice", { username: "alice" })
    const db = actAs("alice")
    const dateKey = toDateKey()
    const ref = doc(db, "dailySummaries", dailySummaryId("alice", dateKey))
    const row = (totalMl: number, extra: Record<string, unknown> = {}) => ({
      userId: "alice",
      dateKey,
      displayName: "alice",
      totalMl,
      goalMl: 2500,
      entryCount: 1,
      petName: null,
      petSpecies: null,
      petExperience: 0,
      petHealth: 100,
      ...extra,
    })
    // Writing a total directly, with no drink in the same write, is refused
    await assertFails(setDoc(ref, row(500)))
    await assertFails(setDoc(ref, row(500, { lastEntryId: "made-up" })))

    // A real drink works, and the total must match it exactly
    await logDrink("alice", 500)
    expect((await read(dailySummaryPath("alice")))?.totalMl).toBe(500)
    await assertFails(setDoc(ref, row(9999)))
    await assertFails(updateDoc(ref, { petExperience: 5000 }))
    await assertFails(updateDoc(ref, { goalMl: 100 }))
    // Display fields alone can change (e.g. after a rename)
    await assertSucceeds(updateDoc(ref, { displayName: "alice2" }))
    await assertFails(updateDoc(ref, { displayName: "x".repeat(25) }))
  })

  it("rejects drinks dated far from today or with a fake timestamp", async () => {
    const db = actAs("alice")
    await assertFails(
      setDoc(doc(collection(db, "hydrationEntries")), {
        userId: "alice",
        dateKey: "2000-01-01",
        amount: 100,
        timestamp: serverTimestamp(),
      }),
    )
    await assertFails(
      setDoc(doc(collection(db, "hydrationEntries")), {
        userId: "alice",
        dateKey: toDateKey(),
        amount: 100,
        timestamp: Timestamp.fromMillis(Date.now() + 86_400_000),
      }),
    )
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

describe("friends", () => {
  async function withCode(uid: string): Promise<string> {
    await seed(`users/${uid}`, { username: uid })
    actAs(uid)
    return databaseService.ensureFriendCode(profileFor(uid))
  }

  it("creates a friend code once and stores it on the profile", async () => {
    const code = await withCode("alice")
    expect(code).toMatch(/^[A-Z0-9]{6}$/)
    expect(await read(`friendCodes/${code}`)).toMatchObject({ userId: "alice" })
    expect((await read("users/alice"))?.friendCode).toBe(code)
  })

  it("adds a friend on both lists", async () => {
    const bobCode = await withCode("bob")
    await seed("users/alice", { username: "alice" })
    actAs("alice")
    await expect(
      databaseService.addFriendByCode(profileFor("alice"), bobCode.toLowerCase()),
    ).resolves.toBe("bob")
    expect(await read("users/alice/friends/bob")).toMatchObject({ friendId: "bob" })
    expect(await read("users/bob/friends/alice")).toMatchObject({
      friendId: "alice",
      displayName: "alice",
    })
  })

  it("rejects unknown codes, your own code and duplicates", async () => {
    const bobCode = await withCode("bob")
    const aliceCode = await withCode("alice")
    actAs("alice")
    await expect(databaseService.addFriendByCode(profileFor("alice"), "ZZZZZZ")).rejects.toThrow(
      /No one/,
    )
    await expect(databaseService.addFriendByCode(profileFor("alice"), aliceCode)).rejects.toThrow(
      /own code/,
    )
    await databaseService.addFriendByCode(profileFor("alice"), bobCode)
    await expect(databaseService.addFriendByCode(profileFor("alice"), bobCode)).rejects.toThrow(
      /already/,
    )
  })

  it("blocks adding yourself to someone's list without their code", async () => {
    await withCode("bob")
    const malloryCode = await withCode("mallory")
    const db = actAs("mallory")
    // Mallory's own code doesn't prove she knows Bob's
    await assertFails(
      setDoc(doc(db, "users/bob/friends/mallory"), {
        friendId: "mallory",
        displayName: "mallory",
        code: malloryCode,
      }),
    )
    await assertFails(
      setDoc(doc(db, "users/mallory/friends/bob"), {
        friendId: "bob",
        displayName: "bob",
        code: malloryCode,
      }),
    )
  })

  it("blocks taking over someone else's friend code", async () => {
    const bobCode = await withCode("bob")
    const db = actAs("mallory")
    await assertFails(
      setDoc(doc(db, "friendCodes", bobCode), { userId: "mallory", displayName: "m" }),
    )
    await assertFails(setDoc(doc(db, "friendCodes", "MALLRY"), { userId: "bob", displayName: "b" }))
  })

  it("doesn't let anyone list friend codes or read others' friend lists", async () => {
    const bobCode = await withCode("bob")
    await withCode("alice")
    actAs("alice")
    await databaseService.addFriendByCode(profileFor("alice"), bobCode)
    const db = actAs("mallory")
    await assertFails(getDocs(collection(db, "friendCodes")))
    await assertFails(getDocs(collection(db, "users/alice/friends")))
    await assertSucceeds(getDocs(collection(actAs("alice"), "users/alice/friends")))
  })

  it("lets either friend remove the friendship on both sides", async () => {
    const bobCode = await withCode("bob")
    await withCode("alice")
    actAs("alice")
    await databaseService.addFriendByCode(profileFor("alice"), bobCode)
    actAs("bob")
    await assertSucceeds(databaseService.removeFriend("bob", "alice"))
    expect(await read("users/alice/friends/bob")).toBeUndefined()
    expect(await read("users/bob/friends/alice")).toBeUndefined()
  })

  it("blocks a stranger from deleting a friendship", async () => {
    const bobCode = await withCode("bob")
    await withCode("alice")
    actAs("alice")
    await databaseService.addFriendByCode(profileFor("alice"), bobCode)
    actAs("mallory")
    await assertFails(databaseService.removeFriend("alice", "bob"))
  })

  it("shows a friends-only leaderboard", async () => {
    for (const uid of ["alice", "bob", "carol"]) await seed(`users/${uid}`, { username: uid })
    actAs("alice")
    await logDrink("alice", 400)
    actAs("bob")
    await logDrink("bob", 900)
    actAs("carol")
    await logDrink("carol", 2000)

    actAs("alice")
    const rows = await new Promise<DailySummary[]>((res, rej) => {
      const unsub = databaseService.subscribeToGroupLeaderboard(
        ["alice", "bob"],
        (r) => {
          unsub()
          res(r)
        },
        rej,
      )
    })
    expect(rows.map((r) => r.userId)).toEqual(["bob", "alice"])
  })
})

describe("history and pet health on summaries", () => {
  it("loads your recent daily summaries", async () => {
    await seed("users/alice", { username: "alice" })
    const today = toDateKey()
    await seed(`dailySummaries/alice_2000-01-01`, {
      userId: "alice",
      dateKey: "2000-01-01",
      totalMl: 1,
    })
    actAs("alice")
    await logDrink("alice", 700)
    const history = await databaseService.getSummaryHistory("alice", 7)
    expect(history.map((h) => [h.dateKey, h.totalMl])).toEqual([[today, 700]])
  })

  it("stores the pet's health after the drink", async () => {
    await seed("users/alice", { username: "alice" })
    await seed("pets/alice", {
      userId: "alice",
      species: "alien",
      name: "Zap",
      experience: 0,
      health: 20,
    })
    actAs("alice")
    await logDrink("alice", 1250) // half of a 2500 ml goal restores 50 health
    const summary = await read(dailySummaryPath("alice"))
    expect(summary).toMatchObject({ petHealth: 70 })
  })
})

function dailySummaryPath(uid: string) {
  return `dailySummaries/${dailySummaryId(uid, toDateKey())}`
}

describe("drink photos", () => {
  const thumb = "data:image/jpeg;base64,/9j/AAAA"

  async function aliceLogsWithPhotos() {
    await seed("users/alice", { username: "alice" })
    actAs("alice")
    const logged = await logDrink("alice", 300)
    await databaseService.saveDrinkPhotos({
      userId: "alice",
      entryId: logged.entryId,
      amount: 300,
      dateKey: logged.dateKey,
      before: thumb,
      after: thumb,
    })
    return logged.entryId
  }

  function firstPhotos(userId: string) {
    return new Promise<unknown[]>((res, rej) => {
      const unsub = databaseService.subscribeToDrinkPhotos(
        userId,
        (p) => {
          unsub()
          res(p)
        },
        (e) => {
          unsub()
          rej(e)
        },
      )
    })
  }

  it("lets the owner and their friends see photos, but not strangers", async () => {
    await aliceLogsWithPhotos()
    await seed("users/alice/friends/bob", { friendId: "bob", displayName: "bob" })

    actAs("alice")
    expect(await firstPhotos("alice")).toHaveLength(1)
    actAs("bob")
    expect(await firstPhotos("alice")).toHaveLength(1)
    actAs("mallory")
    await expect(firstPhotos("alice")).rejects.toMatchObject({ code: "permission-denied" })
  })

  it("only allows photos for your own logged drinks", async () => {
    const entryId = await aliceLogsWithPhotos()
    const db = actAs("mallory")
    // Not Mallory's drink
    await assertFails(
      setDoc(doc(db, "drinkPhotos", "other-" + entryId), {
        userId: "mallory",
        amount: 300,
        dateKey: toDateKey(),
        before: thumb,
        after: thumb,
      }),
    )
    // No such drink
    await assertFails(
      setDoc(doc(db, "drinkPhotos", "nope"), {
        userId: "mallory",
        amount: 300,
        dateKey: toDateKey(),
        before: thumb,
        after: thumb,
      }),
    )
  })

  it("rejects non-JPEG data and edits, and lets only the owner delete", async () => {
    const entryId = await aliceLogsWithPhotos()
    const db = actAs("alice")
    await assertFails(updateDoc(doc(db, "drinkPhotos", entryId), { before: thumb + "A" }))
    const second = await logDrink("alice", 200)
    await assertFails(
      setDoc(doc(db, "drinkPhotos", second.entryId), {
        userId: "alice",
        amount: 200,
        dateKey: second.dateKey,
        before: "data:text/html;base64,PHNjcmlwdD4=",
        after: thumb,
      }),
    )
    actAs("mallory")
    await assertFails(databaseService.deleteDrinkPhotos(entryId))
    actAs("alice")
    await assertSucceeds(databaseService.deleteDrinkPhotos(entryId))
  })
})

describe("undoing a drink", () => {
  it("removes the entry, its photos, the daily total and the XP it earned", async () => {
    await seed("users/alice", { username: "alice" })
    actAs("alice")
    await databaseService.adoptPet("alice", "alice", "alien", "Zap")
    await logDrink("alice", 500)
    const second = await logDrink("alice", 1000)
    await databaseService.saveDrinkPhotos({
      userId: "alice",
      entryId: second.entryId,
      amount: 1000,
      dateKey: second.dateKey,
      before: "data:image/jpeg;base64,/9j/AAAA",
      after: "data:image/jpeg;base64,/9j/AAAA",
    })
    await seed("users/alice/friends/bob", { friendId: "bob", displayName: "bob" })
    actAs("bob")
    await databaseService.setReaction(second.entryId, profileFor("bob"), "🧢")

    actAs("alice")
    await assertSucceeds(databaseService.deleteDrink(profileFor("alice"), second.entryId))
    expect(await read(`hydrationEntries/${second.entryId}`)).toBeUndefined()
    expect(await read(`drinkPhotos/${second.entryId}`)).toBeUndefined()
    expect(await read(`drinkPhotos/${second.entryId}/reactions/bob`)).toBeUndefined()
    expect(await read(dailySummaryPath("alice"))).toMatchObject({ totalMl: 500, entryCount: 1 })
    expect((await read("pets/alice"))?.experience).toBe(50)
  })

  it("blocks deleting someone else's drink, or a drink without taking it off the totals", async () => {
    await seed("users/alice", { username: "alice" })
    actAs("alice")
    await databaseService.adoptPet("alice", "alice", "alien", "Zap")
    const logged = await logDrink("alice", 300)
    await assertFails(deleteDoc(doc(actAs("mallory"), "hydrationEntries", logged.entryId)))
    // Deleting just the entry would keep the ml and XP it earned
    await assertFails(deleteDoc(doc(actAs("alice"), "hydrationEntries", logged.entryId)))
  })

  it("refuses to undo a drink older than 24 hours, and keeps its photos", async () => {
    await seed("users/alice", { username: "alice" })
    await seed("hydrationEntries/old", {
      userId: "alice",
      dateKey: "2000-01-01",
      amount: 300,
      timestamp: Timestamp.fromMillis(Date.now() - 25 * 60 * 60 * 1000),
    })
    await seed("drinkPhotos/old", {
      userId: "alice",
      amount: 300,
      dateKey: "2000-01-01",
      before: "data:image/jpeg;base64,/9j/AAAA",
      after: "data:image/jpeg;base64,/9j/AAAA",
    })
    actAs("alice")
    await expect(databaseService.deleteDrink(profileFor("alice"), "old")).rejects.toThrow(
      /24 hours/,
    )
    expect(await read("hydrationEntries/old")).toBeDefined()
    expect(await read("drinkPhotos/old")).toBeDefined()
  })

  it("takes back the health a drink gave", async () => {
    await seed("users/alice", { username: "alice" })
    await seed("pets/alice", {
      userId: "alice",
      species: "alien",
      name: "Zap",
      experience: 0,
      health: 20,
    })
    actAs("alice")
    const logged = await logDrink("alice", 1250) // +50 health on a 2500 ml goal
    expect((await read("pets/alice"))?.health).toBe(70)
    await databaseService.deleteDrink(profileFor("alice"), logged.entryId)
    expect(await read("pets/alice")).toMatchObject({ health: 20, experience: 0 })
    expect(await read(dailySummaryPath("alice"))).toMatchObject({ petHealth: 20, totalMl: 0 })
  })
})

describe("reactions on drink photos", () => {
  async function alicePhotos() {
    await seed("users/alice", { username: "alice" })
    actAs("alice")
    const logged = await logDrink("alice", 300)
    await databaseService.saveDrinkPhotos({
      userId: "alice",
      entryId: logged.entryId,
      amount: 300,
      dateKey: logged.dateKey,
      before: "data:image/jpeg;base64,/9j/AAAA",
      after: "data:image/jpeg;base64,/9j/AAAA",
    })
    await seed("users/alice/friends/bob", { friendId: "bob", displayName: "bob" })
    return logged.entryId
  }

  it("lets friends react, change and remove their reaction", async () => {
    const entryId = await alicePhotos()
    actAs("bob")
    await assertSucceeds(databaseService.setReaction(entryId, profileFor("bob"), "🤡"))
    await assertSucceeds(databaseService.setReaction(entryId, profileFor("bob"), "🔥"))
    expect((await read(`drinkPhotos/${entryId}/reactions/bob`))?.emoji).toBe("🔥")
    await assertSucceeds(databaseService.setReaction(entryId, profileFor("bob"), null))
    expect(await read(`drinkPhotos/${entryId}/reactions/bob`)).toBeUndefined()
  })

  it("blocks strangers, other emojis and reacting as someone else", async () => {
    const entryId = await alicePhotos()
    actAs("mallory")
    await assertFails(databaseService.setReaction(entryId, profileFor("mallory"), "🤡"))
    const db = actAs("bob")
    await assertFails(
      setDoc(doc(db, "drinkPhotos", entryId, "reactions", "bob"), {
        userId: "bob",
        emoji: "💩",
        displayName: "bob",
      }),
    )
    await assertFails(
      setDoc(doc(db, "drinkPhotos", entryId, "reactions", "carol"), {
        userId: "bob",
        emoji: "🤡",
        displayName: "bob",
      }),
    )
  })
})

describe("account deletion", () => {
  it("deletes everything a user owns, and their friends keep working", async () => {
    await seed("users/bob", { username: "bob" })
    actAs("bob")
    const bobCode = await databaseService.ensureFriendCode(profileFor("bob"))

    await seed("users/alice", { username: "alice" })
    actAs("alice")
    const aliceCode = await databaseService.ensureFriendCode(profileFor("alice"))
    await databaseService.adoptPet("alice", "alice", "alien", "Zap")
    await databaseService.addFriendByCode(profileFor("alice"), bobCode)
    const logged = await logDrink("alice", 400)
    await databaseService.saveDrinkPhotos({
      userId: "alice",
      entryId: logged.entryId,
      amount: 400,
      dateKey: logged.dateKey,
      before: "data:image/jpeg;base64,/9j/AAAA",
      after: "data:image/jpeg;base64,/9j/AAAA",
    })

    // Bob logs a drink with photos, and Alice reacts to it
    actAs("bob")
    const bobDrink = await logDrink("bob", 200)
    await databaseService.saveDrinkPhotos({
      userId: "bob",
      entryId: bobDrink.entryId,
      amount: 200,
      dateKey: bobDrink.dateKey,
      before: "data:image/jpeg;base64,/9j/AAAA",
      after: "data:image/jpeg;base64,/9j/AAAA",
    })
    actAs("alice")
    await databaseService.setReaction(bobDrink.entryId, profileFor("alice"), "🔥")

    const alice = { ...profileFor("alice"), friendCode: aliceCode }
    await assertSucceeds(databaseService.deleteAllUserData(alice))

    for (const path of [
      "users/alice",
      "pets/alice",
      `hydrationEntries/${logged.entryId}`,
      `drinkPhotos/${logged.entryId}`,
      dailySummaryPath("alice"),
      `friendCodes/${aliceCode}`,
      "users/bob/friends/alice",
      `drinkPhotos/${bobDrink.entryId}/reactions/alice`,
    ]) {
      expect(await read(path)).toBeUndefined()
    }
    // Bob's own data is untouched
    expect(await read(`drinkPhotos/${bobDrink.entryId}`)).toBeDefined()
    expect(await read(dailySummaryPath("bob"))).toMatchObject({ totalMl: 200 })
  })

  it("doesn't let anyone delete another user's account data", async () => {
    await seed("users/alice", { username: "alice" })
    actAs("alice")
    await databaseService.adoptPet("alice", "alice", "alien", "Zap")
    await logDrink("alice", 300)
    const db = actAs("mallory")
    await assertFails(deleteDoc(doc(db, "users/alice")))
    await assertFails(deleteDoc(doc(db, "pets/alice")))
    await assertFails(deleteDoc(doc(db, dailySummaryPath("alice"))))
  })
})

describe("renaming", () => {
  it("carries a new username to the friend code, friends' lists and today's row", async () => {
    await seed("users/bob", { username: "bob" })
    actAs("bob")
    const bobCode = await databaseService.ensureFriendCode(profileFor("bob"))
    await seed("users/alice", { username: "alice" })
    actAs("alice")
    const aliceCode = await databaseService.ensureFriendCode(profileFor("alice"))
    await databaseService.addFriendByCode(profileFor("alice"), bobCode)
    await logDrink("alice", 300)

    const alice = { ...profileFor("alice"), friendCode: aliceCode }
    await databaseService.propagateDisplayName(alice, "Alicia", toDateKey())
    expect((await read(`friendCodes/${aliceCode}`))?.displayName).toBe("Alicia")
    expect((await read("users/bob/friends/alice"))?.displayName).toBe("Alicia")
    expect((await read(dailySummaryPath("alice")))?.displayName).toBe("Alicia")

    // Nobody else can rename you on their friends' lists
    const db = actAs("mallory")
    await assertFails(updateDoc(doc(db, "users/bob/friends/alice"), { displayName: "lol" }))
  })

  it("replaces the friend code; the old one stops working", async () => {
    await seed("users/alice", { username: "alice" })
    actAs("alice")
    const oldCode = await databaseService.ensureFriendCode(profileFor("alice"))
    const newCode = await databaseService.regenerateFriendCode({
      ...profileFor("alice"),
      friendCode: oldCode,
    })
    expect(newCode).not.toBe(oldCode)
    expect(await read(`friendCodes/${oldCode}`)).toBeUndefined()
    expect((await read("users/alice"))?.friendCode).toBe(newCode)

    await seed("users/bob", { username: "bob" })
    actAs("bob")
    await expect(databaseService.addFriendByCode(profileFor("bob"), oldCode)).rejects.toThrow(
      /No one/,
    )
    await expect(databaseService.addFriendByCode(profileFor("bob"), newCode)).resolves.toBe("alice")
  })
})

describe("loopholes found in review", () => {
  it("blocks deleting and re-creating a pet to get XP", async () => {
    await seed("users/alice", { username: "alice" })
    actAs("alice")
    await databaseService.adoptPet("alice", "alice", "alien", "Zap")
    const db = actAs("alice")
    await assertFails(deleteDoc(doc(db, "pets/alice")))
    await env.withSecurityRulesDisabled(async (ctx) => {
      await deleteDoc(doc(ctx.firestore() as unknown as Firestore, "pets/alice"))
    })
    await assertFails(
      setDoc(doc(db, "pets/alice"), {
        userId: "alice",
        species: "sphele",
        name: "X",
        experience: 1000,
        health: 100,
      }),
    )
  })

  it("blocks planting a fake legacy pet to migrate", async () => {
    await seed("users/alice", { username: "alice" })
    const db = actAs("alice")
    await assertFails(
      setDoc(doc(db, "users/alice"), { pet: { type: "alien", currentXp: 1000 } }, { merge: true }),
    )
  })

  it("blocks a tiny drink from fully healing the pet", async () => {
    await seed("users/alice", { username: "alice", stats: { ...stats, dailyWaterGoal: 2500 } })
    await seed("pets/alice", {
      userId: "alice",
      species: "alien",
      name: "Zap",
      experience: 0,
      health: 10,
    })
    const db = actAs("alice")
    const entry = doc(collection(db, "hydrationEntries"))
    const batch = writeBatch(db)
    batch.set(entry, {
      userId: "alice",
      dateKey: toDateKey(),
      amount: 10,
      timestamp: serverTimestamp(),
    })
    batch.update(doc(db, "pets/alice"), {
      experience: 1,
      health: 100,
      lastFed: serverTimestamp(),
      lastEntryId: entry.id,
    })
    await assertFails(batch.commit())
  })

  it("blocks pausing health decay or faking health without a drink", async () => {
    await seed("pets/alice", {
      userId: "alice",
      species: "alien",
      name: "Zap",
      experience: 100,
      health: 30,
      lastFed: Timestamp.fromMillis(Date.now() - 10 * 3_600_000),
    })
    const db = actAs("alice")
    await assertFails(updateDoc(doc(db, "pets/alice"), { lastFed: serverTimestamp() }))
    await assertFails(updateDoc(doc(db, "pets/alice"), { health: 100 }))
  })

  it("undoes a drink from yesterday against yesterday's total", async () => {
    await seed("users/alice", { username: "alice" })
    const yesterday = new Date(Date.now() - 86_400_000)
    const ymd = toDateKey(yesterday)
    // A drink logged late yesterday (seeded: the rules only accept new drinks dated near today)
    await seed("hydrationEntries/late", {
      userId: "alice",
      dateKey: ymd,
      amount: 400,
      timestamp: Timestamp.fromMillis(Date.now() - 60 * 60 * 1000),
    })
    await seed(`dailySummaries/alice_${ymd}`, {
      userId: "alice",
      dateKey: ymd,
      displayName: "alice",
      totalMl: 900,
      goalMl: 2500,
      entryCount: 2,
      petName: null,
      petSpecies: null,
      petExperience: 0,
      petHealth: 100,
    })
    actAs("alice")
    await assertSucceeds(databaseService.deleteDrink(profileFor("alice"), "late"))
    expect(await read(`dailySummaries/alice_${ymd}`)).toMatchObject({
      totalMl: 500,
      entryCount: 1,
    })
  })

  it("can still undo when the day's total is already below the drink", async () => {
    await seed("users/alice", { username: "alice" })
    actAs("alice")
    const logged = await logDrink("alice", 800)
    // Simulate inconsistent stored data
    await env.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore() as unknown as Firestore, dailySummaryPath("alice")), {
        totalMl: 300,
      })
    })
    actAs("alice")
    await assertSucceeds(databaseService.deleteDrink(profileFor("alice"), logged.entryId))
    expect((await read(dailySummaryPath("alice")))?.totalMl).toBe(0)
  })

  it("deletes an account with drinks spread over many days", async () => {
    await seed("users/alice", { username: "alice" })
    await seed("pets/alice", {
      userId: "alice",
      species: "alien",
      name: "Zap",
      experience: 500,
      health: 80,
    })
    await env.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore() as unknown as Firestore
      for (let d = 0; d < 30; d++) {
        const key = toDateKey(new Date(Date.now() - d * 86_400_000))
        await setDoc(doc(db, `hydrationEntries/old-${d}`), {
          userId: "alice",
          dateKey: key,
          amount: 100,
          timestamp: Timestamp.fromMillis(Date.now() - d * 86_400_000),
        })
        await setDoc(doc(db, `dailySummaries/alice_${key}`), {
          userId: "alice",
          dateKey: key,
          displayName: "alice",
          totalMl: 100,
          goalMl: 2500,
          entryCount: 1,
          petName: "Zap",
          petSpecies: "alien",
          petExperience: 500,
          petHealth: 80,
        })
      }
    })
    actAs("alice")
    await assertSucceeds(databaseService.deleteAllUserData(profileFor("alice")))
    expect(await read("users/alice")).toBeUndefined()
    expect(await read("pets/alice")).toBeUndefined()
    expect(await read("hydrationEntries/old-29")).toBeUndefined()
  })
})

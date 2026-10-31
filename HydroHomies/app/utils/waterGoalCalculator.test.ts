import {
  calculateDailyWaterGoal,
  calculateProgress,
  MAX_GOAL_ML,
  MIN_GOAL_ML,
  shouldFlagOverdrinking,
  validateStats,
} from "./waterGoalCalculator"

describe("calculateDailyWaterGoal", () => {
  const base = { height: 175, weight: 70, age: 25, sex: "male", activityLevel: "moderate" } as const

  it("gives a plausible goal for an average adult", () => {
    const goal = calculateDailyWaterGoal(base)
    expect(goal).toBeGreaterThan(2300)
    expect(goal).toBeLessThan(3000)
  })

  it("increases with activity", () => {
    expect(calculateDailyWaterGoal({ ...base, activityLevel: "very_high" })).toBeGreaterThan(
      calculateDailyWaterGoal({ ...base, activityLevel: "low" }),
    )
  })

  it("puts 'other' between male and female", () => {
    const male = calculateDailyWaterGoal(base)
    const female = calculateDailyWaterGoal({ ...base, sex: "female" })
    const other = calculateDailyWaterGoal({ ...base, sex: "other" })
    expect(other).toBeLessThanOrEqual(male)
    expect(other).toBeGreaterThanOrEqual(female)
  })

  it("clamps to sane bounds", () => {
    expect(
      calculateDailyWaterGoal({ ...base, height: 60, weight: 20, age: 5 }),
    ).toBeGreaterThanOrEqual(MIN_GOAL_ML)
    expect(
      calculateDailyWaterGoal({ ...base, height: 250, weight: 300, activityLevel: "very_high" }),
    ).toBeLessThanOrEqual(MAX_GOAL_ML)
  })
})

describe("validateStats", () => {
  it("accepts valid stats and rejects out-of-range ones", () => {
    const ok = { height: 170, weight: 70, age: 30, sex: "female", activityLevel: "low" }
    expect(validateStats(ok)).toBeNull()
    expect(validateStats({ ...ok, height: 20 })).toMatch(/height/)
    expect(validateStats({ ...ok, weight: Number.NaN })).toMatch(/weight/)
    expect(validateStats({ ...ok, sex: "x" })).toMatch(/sex/i)
    expect(validateStats({ ...ok, activityLevel: "extreme" })).toMatch(/activity/)
  })
})

describe("progress helpers", () => {
  it("caps progress at 100 and handles a zero goal", () => {
    expect(calculateProgress(1250, 2500)).toBe(50)
    expect(calculateProgress(9000, 2500)).toBe(100)
    expect(calculateProgress(100, 0)).toBe(0)
  })

  it("flags intake above 150% of goal", () => {
    expect(shouldFlagOverdrinking(3750, 2500)).toBe(false)
    expect(shouldFlagOverdrinking(3751, 2500)).toBe(true)
  })
})

import {
  currentHealth,
  feedPet,
  HEALTH_DECAY_PER_HOUR,
  isPetSpecies,
  levelForXp,
  levelProgress,
  stageForLevel,
  xpForWater,
} from "./petEvolution"

const HOUR = 3_600_000

describe("petEvolution", () => {
  it("gives 10 XP per 100 ml, rounding down", () => {
    expect(xpForWater(500)).toBe(50)
    expect(xpForWater(99)).toBe(9)
    expect(xpForWater(5)).toBe(0)
    expect(xpForWater(-100)).toBe(0)
  })

  it("starts at level 1 and levels every 100 XP", () => {
    expect(levelForXp(0)).toBe(1)
    expect(levelForXp(99)).toBe(1)
    expect(levelForXp(100)).toBe(2)
    expect(levelProgress(250)).toEqual({ current: 50, needed: 100 })
  })

  it("maps levels to stages", () => {
    expect(stageForLevel(1)).toBe("Baby")
    expect(stageForLevel(5)).toBe("Kid")
    expect(stageForLevel(15)).toBe("Teen")
    expect(stageForLevel(30)).toBe("Adult")
    expect(stageForLevel(50)).toBe("Legend")
  })

  it("decays health over time and never below 0", () => {
    const now = new Date("2026-01-02T12:00:00Z")
    expect(currentHealth(100, new Date(now.getTime() - 10 * HOUR), now)).toBe(
      100 - 10 * HEALTH_DECAY_PER_HOUR,
    )
    expect(currentHealth(100, new Date(now.getTime() - 1000 * HOUR), now)).toBe(0)
    expect(currentHealth(80, null, now)).toBe(80)
  })

  it("feeding adds XP and restores health in proportion to the goal", () => {
    const now = new Date()
    const fed = feedPet({ experience: 40, health: 50, lastFed: now }, 1250, 2500, now)
    expect(fed.experience).toBe(40 + 125)
    expect(fed.health).toBe(100) // 50 + 50% of goal
    expect(feedPet({ experience: 0, health: 90, lastFed: now }, 2500, 2500, now).health).toBe(100)
  })

  it("recognises the three species", () => {
    expect(isPetSpecies("alien")).toBe(true)
    expect(isPetSpecies("seed")).toBe(false)
  })
})

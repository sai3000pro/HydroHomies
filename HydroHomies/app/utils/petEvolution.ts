/**
 * Pet growth rules. Pure functions so they can be unit-tested and shared by
 * every screen that displays a pet.
 *
 * Stored on the pet document: experience, health, lastFed.
 * Derived here: level, stage, XP progress, and health after decay.
 */

export const PET_SPECIES = ["elephant", "alien", "sphele"] as const
export type PetSpecies = (typeof PET_SPECIES)[number]

export const SPECIES_DISPLAY_NAMES: Record<PetSpecies, string> = {
  elephant: "Hydrophant",
  alien: "Agualien",
  sphele: "Sphele",
}

export type PetStage = "Baby" | "Kid" | "Teen" | "Adult" | "Legend"

/** 10 XP per 100 ml, so a 2.5 L day is 250 XP */
export const XP_PER_100ML = 10
export const XP_PER_LEVEL = 100
/** Health lost per hour without water. A full pet becomes "thirsty" (<40) after ~20 hours. */
export const HEALTH_DECAY_PER_HOUR = 3
export const THIRSTY_HEALTH = 40

const STAGE_MIN_LEVEL: [PetStage, number][] = [
  ["Legend", 50],
  ["Adult", 30],
  ["Teen", 15],
  ["Kid", 5],
  ["Baby", 1],
]

export function isPetSpecies(value: unknown): value is PetSpecies {
  return typeof value === "string" && (PET_SPECIES as readonly string[]).includes(value)
}

export function xpForWater(waterMl: number): number {
  return Math.max(0, Math.floor((waterMl / 100) * XP_PER_100ML))
}

export function levelForXp(experience: number): number {
  return 1 + Math.floor(Math.max(0, experience) / XP_PER_LEVEL)
}

/** XP gained within the current level, and XP needed to reach the next one */
export function levelProgress(experience: number): { current: number; needed: number } {
  return { current: Math.max(0, experience) % XP_PER_LEVEL, needed: XP_PER_LEVEL }
}

export function stageForLevel(level: number): PetStage {
  for (const [stage, min] of STAGE_MIN_LEVEL) if (level >= min) return stage
  return "Baby"
}

/** Health after decay since the pet was last fed */
export function currentHealth(
  storedHealth: number,
  lastFed: Date | null,
  now: Date = new Date(),
): number {
  if (!lastFed) return clampHealth(storedHealth)
  const hours = Math.max(0, (now.getTime() - lastFed.getTime()) / 3_600_000)
  return clampHealth(Math.round(storedHealth - hours * HEALTH_DECAY_PER_HOUR))
}

/**
 * New stored values after the owner drinks `waterMl`.
 * Health recovers in proportion to the daily goal: drinking your whole goal
 * restores 100 health, half your goal restores 50.
 */
export function feedPet(
  pet: { experience: number; health: number; lastFed: Date | null },
  waterMl: number,
  dailyGoalMl: number,
  now: Date = new Date(),
): { experience: number; health: number } {
  const healthNow = currentHealth(pet.health, pet.lastFed, now)
  const goal = dailyGoalMl > 0 ? dailyGoalMl : 2500
  return {
    experience: Math.max(0, pet.experience) + xpForWater(waterMl),
    health: clampHealth(Math.round(healthNow + (waterMl / goal) * 100)),
  }
}

function clampHealth(h: number): number {
  if (!Number.isFinite(h)) return 0
  return Math.max(0, Math.min(100, h))
}

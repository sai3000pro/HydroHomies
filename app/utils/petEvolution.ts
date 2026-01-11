import { PetState } from "@/services/firebase/database"

/**
 * Calculates pet experience and evolution based on hydration progress
 */

export interface PetEvolution {
  type: PetState["type"]
  level: number
  experience: number
  health: number
  name: string
}

const EXPERIENCE_PER_100ML = 10
const HEALTH_DECAY_PER_HOUR = 1
const EXPERIENCE_THRESHOLDS = {
  seed: 0,
  sprout: 100,
  plant: 300,
  flower: 600,
  droplet: 1000,
  fish: 1500,
}

/**
 * Calculates pet type based on experience
 */
export function calculatePetType(experience: number): PetState["type"] {
  if (experience >= EXPERIENCE_THRESHOLDS.fish) return "fish"
  if (experience >= EXPERIENCE_THRESHOLDS.droplet) return "droplet"
  if (experience >= EXPERIENCE_THRESHOLDS.flower) return "flower"
  if (experience >= EXPERIENCE_THRESHOLDS.plant) return "plant"
  if (experience >= EXPERIENCE_THRESHOLDS.sprout) return "sprout"
  return "seed"
}

/**
 * Calculates pet level (0-100) based on experience
 */
export function calculatePetLevel(experience: number): number {
  const maxExperience = 2000 // Max experience for level 100
  return Math.min(100, Math.round((experience / maxExperience) * 100))
}

/**
 * Calculates health based on last fed time
 * Health decreases over time if not hydrated
 */
export function calculatePetHealth(lastFed: Date, currentHealth: number): number {
  const hoursSinceLastFed = (Date.now() - lastFed.getTime()) / (1000 * 60 * 60)
  const healthLoss = Math.floor(hoursSinceLastFed * HEALTH_DECAY_PER_HOUR)
  return Math.max(0, currentHealth - healthLoss)
}

/**
 * Adds experience to pet based on water intake
 */
export function addHydrationExperience(currentExperience: number, waterAmountMl: number): number {
  const experienceGain = Math.floor((waterAmountMl / 100) * EXPERIENCE_PER_100ML)
  return currentExperience + experienceGain
}

/**
 * Updates pet state after hydration
 * Note: lastFed should be set to serverTimestamp() when calling updatePet
 * This function returns a partial state that should be merged with serverTimestamp for lastFed
 */
export function updatePetAfterHydration(
  currentPet: PetState,
  waterAmountMl: number,
): Partial<Omit<PetState, "lastFed">> {
  const newExperience = addHydrationExperience(currentPet.experience, waterAmountMl)
  const newType = calculatePetType(newExperience)
  const newLevel = calculatePetLevel(newExperience)

  return {
    experience: newExperience,
    type: newType,
    level: newLevel,
    health: 100, // Reset health when fed
    // Note: lastFed should be set separately using serverTimestamp() in the service layer
  }
}

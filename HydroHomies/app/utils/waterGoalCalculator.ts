/**
 * Calculates daily water intake goal based on user statistics
 * Uses a simplified version of the common formula:
 * Base: Body weight (kg) × 30-35 ml + Activity factor
 */
export interface UserStats {
  height: number // in cm
  weight: number // in kg
  age: number
  activityLevel: "low" | "moderate" | "high" | "very_high"
}

export function calculateDailyWaterGoal(stats: UserStats): number {
  const { weight, activityLevel } = stats

  // Base calculation: weight in kg × 35 ml per kg
  let baseWater = weight * 35

  // Activity level multipliers
  const activityMultipliers = {
    low: 1.0,
    moderate: 1.2,
    high: 1.5,
    very_high: 1.8,
  }

  const multiplier = activityMultipliers[activityLevel]
  const dailyGoal = Math.round(baseWater * multiplier)

  // Minimum 1.5L, Maximum 5L (reasonable bounds)
  return Math.max(1500, Math.min(5000, dailyGoal))
}

/**
 * Calculates percentage of daily goal completed
 */
export function calculateProgress(currentIntake: number, dailyGoal: number): number {
  return Math.min(100, Math.round((currentIntake / dailyGoal) * 100))
}

/**
 * Determines if user should be flagged for overdrinking
 * Returns true if intake exceeds goal by more than 50%
 */
export function shouldFlagOverdrinking(currentIntake: number, dailyGoal: number): boolean {
  return currentIntake > dailyGoal * 1.5
}

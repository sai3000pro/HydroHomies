/**
 * Calculates daily water intake goal based on user statistics
 * Uses a simplified version of the common formula:
 * Base: Body weight (kg) × 30-35 ml + Activity factor
 */
export interface UserStats {
  height: number // in cm
  weight: number // in kg
  age: number
  sex: string
  activityLevel: "low" | "moderate" | "high" | "very_high"
}

export function calculateDailyWaterGoal(stats: UserStats): number {
  const { height, weight, age, sex, activityLevel } = stats

  // calculate body surface area (Du Bois formula)
  const bodySurfaceArea = 0.007184 * Math.pow(weight, 0.425) * Math.pow(height, 0.725)

  // basal metabolic rate
  const basalMetabolicRate = 10 * weight + 6.25 * height - 5 * age + (sex === "male" ? 5 : -161)

  // Activity level multipliers
  const activityMultipliers = {
    low: 1.2,
    moderate: 1.55,
    high: 1.725,
    very_high: 1.9,
  }

  // total daily energy expenditure
  const totalDailyEnergyExpenditure = basalMetabolicRate * activityMultipliers[activityLevel]

  const urine = 1500 // Set value
  const faeces = 150 // Set value
  const skinEvap = 400 * bodySurfaceArea // Loss via BSA
  const respiratory = totalDailyEnergyExpenditure * 0.13 // Loss via Calories
  const sweat = activityMultipliers[activityLevel] > 1.2 ? totalDailyEnergyExpenditure * 0.1 : 100 // Estimate: more activity = more sweat

  const metabolicGain = totalDailyEnergyExpenditure * 0.13 // Gain via Calories

  // Final Calculation
  const totalLoss = urine + faeces + skinEvap + respiratory + sweat
  const totalGain = metabolicGain

  const dailyGoal = Math.round(totalLoss - totalGain)

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

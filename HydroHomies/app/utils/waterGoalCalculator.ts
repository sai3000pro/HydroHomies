/**
 * Daily water goal from body stats, using a water-balance model:
 * fixed losses (urine, faeces) + skin evaporation (body surface area) +
 * respiratory and sweat losses (energy expenditure), minus metabolic water.
 */
export const ACTIVITY_LEVELS = ["low", "moderate", "high", "very_high"] as const
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number]

export const SEXES = ["male", "female", "other"] as const
export type Sex = (typeof SEXES)[number]

export interface UserStats {
  height: number // cm
  weight: number // kg
  age: number
  sex: Sex
  activityLevel: ActivityLevel
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  low: 1.2,
  moderate: 1.55,
  high: 1.725,
  very_high: 1.9,
}

export const MIN_GOAL_ML = 1500
export const MAX_GOAL_ML = 5000

export function calculateDailyWaterGoal(stats: UserStats): number {
  const { height, weight, age, sex, activityLevel } = stats

  // Body surface area (Du Bois), m²
  const bodySurfaceArea = 0.007184 * Math.pow(weight, 0.425) * Math.pow(height, 0.725)

  // Basal metabolic rate (Mifflin-St Jeor). "other" uses the midpoint of the sex constants.
  const sexConstant = sex === "male" ? 5 : sex === "female" ? -161 : -78
  const basalMetabolicRate = 10 * weight + 6.25 * height - 5 * age + sexConstant

  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel]
  const totalDailyEnergyExpenditure = basalMetabolicRate * multiplier

  const urine = 1500
  const faeces = 150
  const skinEvaporation = 400 * bodySurfaceArea
  const respiratory = totalDailyEnergyExpenditure * 0.13
  const sweat = multiplier > 1.2 ? totalDailyEnergyExpenditure * 0.1 : 100
  const metabolicGain = totalDailyEnergyExpenditure * 0.13

  const dailyGoal = Math.round(
    urine + faeces + skinEvaporation + respiratory + sweat - metabolicGain,
  )
  return Math.max(MIN_GOAL_ML, Math.min(MAX_GOAL_ML, dailyGoal))
}

/** Checks user-entered stats. Returns an error message, or null if valid. */
export function validateStats(stats: Partial<Record<keyof UserStats, unknown>>): string | null {
  const num = (v: unknown) => (typeof v === "number" ? v : Number(v))
  const height = num(stats.height)
  const weight = num(stats.weight)
  const age = num(stats.age)
  if (!Number.isFinite(height) || height < 50 || height > 250)
    return "Enter a height between 50 and 250 cm"
  if (!Number.isFinite(weight) || weight < 20 || weight > 300)
    return "Enter a weight between 20 and 300 kg"
  if (!Number.isFinite(age) || age < 5 || age > 120) return "Enter an age between 5 and 120"
  if (!(SEXES as readonly unknown[]).includes(stats.sex)) return "Select a sex"
  if (!(ACTIVITY_LEVELS as readonly unknown[]).includes(stats.activityLevel))
    return "Select an activity level"
  return null
}

/** Percentage of the daily goal, capped at 100 for progress bars */
export function calculateProgress(currentIntake: number, dailyGoal: number): number {
  if (dailyGoal <= 0) return 0
  return Math.min(100, Math.round((currentIntake / dailyGoal) * 100))
}

/** True when intake exceeds the goal by more than 50% */
export function shouldFlagOverdrinking(currentIntake: number, dailyGoal: number): boolean {
  return dailyGoal > 0 && currentIntake > dailyGoal * 1.5
}

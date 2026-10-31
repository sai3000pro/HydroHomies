/**
 * Weekly stats, streaks and achievements, all derived from daily summaries,
 * pet XP and the friend count. Nothing here is stored; it's recomputed on read.
 */
import { shiftDateKey } from "./dateKey"
import { levelForXp, XP_PER_100ML } from "./petEvolution"

export interface DayTotal {
  dateKey: string
  totalMl: number
  goalMl: number
}

export interface DayStat extends DayTotal {
  met: boolean
}

/** How many days of history the stats screen loads. Streaks longer than this are capped. */
export const HISTORY_DAYS = 60

/**
 * One entry per day for the `days` days ending on `todayKey`, oldest first.
 * Days without a summary count as 0 ml against `defaultGoalMl`.
 */
export function fillDays(
  history: DayTotal[],
  todayKey: string,
  days: number,
  defaultGoalMl: number,
): DayStat[] {
  const byKey = new Map(history.map((h) => [h.dateKey, h]))
  const out: DayStat[] = []
  for (let i = days - 1; i >= 0; i--) {
    const dateKey = shiftDateKey(todayKey, -i)
    const h = byKey.get(dateKey)
    const goalMl = h && h.goalMl > 0 ? h.goalMl : defaultGoalMl
    const totalMl = h?.totalMl ?? 0
    out.push({ dateKey, totalMl, goalMl, met: totalMl >= goalMl })
  }
  return out
}

/**
 * Consecutive goal days ending today. If today's goal isn't met yet, the
 * streak still counts up to yesterday, so it doesn't reset every morning.
 */
export function currentStreak(days: DayStat[]): number {
  let i = days.length - 1
  if (i >= 0 && !days[i].met) i--
  let streak = 0
  for (; i >= 0 && days[i].met; i--) streak++
  return streak
}

export function bestStreak(days: DayStat[]): number {
  let best = 0
  let run = 0
  for (const d of days) {
    run = d.met ? run + 1 : 0
    best = Math.max(best, run)
  }
  return best
}

export interface WeekSummary {
  days: DayStat[]
  totalMl: number
  averageMl: number
  daysMet: number
  bestDay: DayStat | null
}

export function summarizeWeek(days: DayStat[]): WeekSummary {
  const week = days.slice(-7)
  const totalMl = week.reduce((sum, d) => sum + d.totalMl, 0)
  const bestDay = week.reduce<DayStat | null>(
    (best, d) => (d.totalMl > 0 && (!best || d.totalMl > best.totalMl) ? d : best),
    null,
  )
  return {
    days: week,
    totalMl,
    averageMl: week.length ? Math.round(totalMl / week.length) : 0,
    daysMet: week.filter((d) => d.met).length,
    bestDay,
  }
}

/** Approximate lifetime water from pet XP (10 XP per 100 ml) */
export function lifetimeMlFromXp(experience: number): number {
  return Math.max(0, Math.round((experience / XP_PER_100ML) * 100))
}

export interface Achievement {
  id: string
  emoji: string
  title: string
  description: string
  unlocked: boolean
  /** 0-1 progress toward unlocking */
  progress: number
}

export interface AchievementInput {
  days: DayStat[]
  petExperience: number
  friendCount: number
}

export function computeAchievements({
  days,
  petExperience,
  friendCount,
}: AchievementInput): Achievement[] {
  const best = bestStreak(days)
  const anyDrink = petExperience > 0 || days.some((d) => d.totalMl > 0)
  const lifetimeMl = lifetimeMlFromXp(petExperience)
  const level = levelForXp(petExperience)

  const make = (
    id: string,
    emoji: string,
    title: string,
    description: string,
    value: number,
    target: number,
  ): Achievement => ({
    id,
    emoji,
    title,
    description,
    unlocked: value >= target,
    progress: Math.max(0, Math.min(1, value / target)),
  })

  return [
    make("first-sip", "💧", "First Sip", "Log your first drink", anyDrink ? 1 : 0, 1),
    make("goal-getter", "🎯", "Goal Getter", "Reach your daily goal", best >= 1 ? 1 : 0, 1),
    make("streak-3", "🔥", "On a Roll", "Reach your goal 3 days in a row", best, 3),
    make("streak-7", "📅", "Perfect Week", "Reach your goal 7 days in a row", best, 7),
    make("streak-30", "🏅", "Hydration Habit", "Reach your goal 30 days in a row", best, 30),
    make("liters-10", "🚰", "10 Litres", "Drink 10 L in total", lifetimeMl, 10_000),
    make("liters-100", "🌊", "100 Litres", "Drink 100 L in total", lifetimeMl, 100_000),
    make("level-5", "🐣", "Growing Up", "Get your pet to level 5", level, 5),
    make("level-15", "🦖", "Teenager", "Get your pet to level 15", level, 15),
    make("level-30", "👑", "All Grown Up", "Get your pet to level 30", level, 30),
    make("friend-1", "🤝", "Hydro Homie", "Add a friend", friendCount, 1),
    make("friend-5", "👥", "Squad Goals", "Have 5 friends", friendCount, 5),
  ]
}

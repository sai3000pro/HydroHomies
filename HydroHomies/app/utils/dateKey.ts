/** Local calendar day as "YYYY-MM-DD". Used to group entries and daily summaries. */
export function toDateKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Document id for a user's daily summary */
export function dailySummaryId(userId: string, dateKey: string = toDateKey()): string {
  return `${userId}_${dateKey}`
}

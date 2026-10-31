/** Local calendar day as "YYYY-MM-DD". Used to group entries and daily summaries. */
export function toDateKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Parses "YYYY-MM-DD" as local midnight */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number)
  return new Date(y, m - 1, d)
}

/** The date key `days` days after (or before, if negative) `key` */
export function shiftDateKey(key: string, days: number): string {
  const date = fromDateKey(key)
  date.setDate(date.getDate() + days)
  return toDateKey(date)
}

/** Document id for a user's daily summary */
export function dailySummaryId(userId: string, dateKey: string = toDateKey()): string {
  return `${userId}_${dateKey}`
}

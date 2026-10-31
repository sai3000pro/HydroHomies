import { useEffect, useState } from "react"
import { AppState } from "react-native"

import { toDateKey } from "./dateKey"

/**
 * Today's date key ("YYYY-MM-DD"), updated at local midnight and whenever the app
 * returns to the foreground. Pass it to "today" queries so they roll over to the
 * new day instead of showing yesterday's data until the screen remounts.
 */
export function useToday(): string {
  const [today, setToday] = useState(toDateKey)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const schedule = () => {
      const now = new Date()
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      // A second past midnight, so toDateKey() is definitely the new day
      timer = setTimeout(
        () => {
          setToday(toDateKey())
          schedule()
        },
        nextMidnight.getTime() - now.getTime() + 1000,
      )
    }
    schedule()

    // Timers don't run while the app is in the background
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") setToday(toDateKey())
    })
    return () => {
      clearTimeout(timer)
      sub.remove()
    }
  }, [])

  return today
}

import { useEffect, useState } from "react"

import { databaseService, type Friend } from "@/services/firebase/database"

/** Live friend list. `friends` is null until the first snapshot arrives. */
export function useFriends(userId: string) {
  const [friends, setFriends] = useState<Friend[] | null>(null)
  const [error, setError] = useState("")

  useEffect(
    () =>
      databaseService.subscribeToFriends(
        userId,
        (f) => {
          setFriends(f)
          setError("")
        },
        (e) => setError(e.message),
      ),
    [userId],
  )

  return { friends, error }
}

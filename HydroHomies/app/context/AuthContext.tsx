import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { onAuthStateChanged, User } from "firebase/auth"

import { authService } from "@/services/firebase/auth"
import { auth } from "@/services/firebase/config"
import { databaseService, type PetState, type UserProfile } from "@/services/firebase/database"
import { cancelReminders } from "@/services/reminders"

export type AuthContextType = {
  user: User | null
  isAuthenticated: boolean
  /** Live private profile. null means the document doesn't exist (yet). */
  profile: UserProfile | null
  /** Live pet. null means the user hasn't adopted one. */
  pet: PetState | null
  /** True until the first profile and pet snapshots arrive for the signed-in user */
  isUserDataLoading: boolean
  /** Set when the profile or pet couldn't be loaded (offline, permissions). Retry with retryUserData. */
  userDataError: string
  retryUserData: () => void
  /**
   * Set while SignUpScreen creates the auth account and profile, so the
   * navigator doesn't route to Onboarding before the profile write lands.
   */
  isSigningUp: boolean
  setIsSigningUp: (v: boolean) => void
  logout: () => Promise<void>
  /** True while deleteAccount runs */
  isDeletingAccount: boolean
  /** Re-checks the password, deletes all the user's data, then the sign-in account */
  deleteAccount: (password: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [pet, setPet] = useState<PetState | null>(null)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [petLoaded, setPetLoaded] = useState(false)
  const [userDataError, setUserDataError] = useState("")
  const [retryCount, setRetryCount] = useState(0)
  // Hold the navigator on a spinner while sign-up runs, and until the new
  // profile snapshot (with stats) arrives, so Onboarding never flashes.
  const [isSigningUp, setIsSigningUpState] = useState(false)
  const [awaitingProfile, setAwaitingProfile] = useState(false)
  const setIsSigningUp = useCallback((v: boolean) => {
    setIsSigningUpState(v)
    if (!v) setAwaitingProfile(true)
  }, [])
  useEffect(() => {
    if (awaitingProfile && (profile?.stats || !user)) setAwaitingProfile(false)
  }, [awaitingProfile, profile, user])
  // If the profile write failed, stop waiting after a few seconds (user lands on Onboarding)
  useEffect(() => {
    if (!awaitingProfile) return
    const t = setTimeout(() => setAwaitingProfile(false), 5000)
    return () => clearTimeout(t)
  }, [awaitingProfile])

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setIsAuthLoading(false)
    })
  }, [])

  // Live profile + pet for the signed-in user
  useEffect(() => {
    setProfile(null)
    setPet(null)
    setProfileLoaded(false)
    setPetLoaded(false)
    setUserDataError("")
    if (!user) return

    // A failed load must not look like "no profile" / "no pet": that would send an existing
    // user to Onboarding or PetSelect, where saving could overwrite their real data.
    const fail = (what: string) => (e: Error) => {
      console.warn(`${what} subscription failed:`, e.message)
      setUserDataError(e.message || `Couldn't load your ${what.toLowerCase()}.`)
    }
    const unsubProfile = databaseService.subscribeToProfile(
      user.uid,
      (p) => {
        setProfile(p)
        setProfileLoaded(true)
      },
      fail("Profile"),
    )
    const unsubPet = databaseService.subscribeToPet(
      user.uid,
      (p) => {
        setPet(p)
        setPetLoaded(true)
      },
      fail("Pet"),
    )

    // Hackathon builds stored the pet inside users/{uid}.pet; move it once.
    databaseService
      .migrateLegacyPet(user.uid, user.displayName ?? "")
      .catch((e) => console.warn("Legacy pet migration failed:", e.message))

    return () => {
      unsubProfile()
      unsubPet()
    }
  }, [user, retryCount])

  const retryUserData = useCallback(() => setRetryCount((n) => n + 1), [])

  const logout = useCallback(async () => {
    await cancelReminders().catch(() => {})
    await authService.signOut()
  }, [])

  // Holds the navigator on a spinner: deleting the pet and profile would otherwise route
  // to PetSelect / Onboarding mid-deletion and unmount the screen showing errors.
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const deleteAccount = useCallback(
    async (password: string) => {
      if (!profile) throw new Error("Not signed in.")
      setIsDeletingAccount(true)
      try {
        // Check the password first, so a typo doesn't start deleting anything
        await authService.reauthenticate(password)
        await cancelReminders().catch(() => {})
        await databaseService.deleteAllUserData(profile)
        // Signs out; the navigator returns to Login
        await authService.deleteCurrentUser()
      } finally {
        setIsDeletingAccount(false)
      }
    },
    [profile],
  )

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: !!user,
      profile,
      pet,
      isUserDataLoading: !!user && !userDataError && (!profileLoaded || !petLoaded),
      userDataError,
      retryUserData,
      isSigningUp: isSigningUp || awaitingProfile,
      setIsSigningUp,
      logout,
      isDeletingAccount,
      deleteAccount,
    }),
    [
      user,
      profile,
      pet,
      profileLoaded,
      petLoaded,
      userDataError,
      retryUserData,
      isSigningUp,
      awaitingProfile,
      setIsSigningUp,
      logout,
      isDeletingAccount,
      deleteAccount,
    ],
  )

  // Render nothing until Firebase restores (or rules out) a session
  if (isAuthLoading) return null

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}

/** For screens that only render when signed in with a complete profile */
export const useSignedInUser = () => {
  const { user, profile, pet } = useAuth()
  if (!user || !profile) throw new Error("useSignedInUser requires a signed-in user with a profile")
  return { user, profile, pet }
}

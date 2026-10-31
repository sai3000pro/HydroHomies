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

export type AuthContextType = {
  user: User | null
  isAuthenticated: boolean
  /** Live private profile. null means the document doesn't exist (yet). */
  profile: UserProfile | null
  /** Live pet. null means the user hasn't adopted one. */
  pet: PetState | null
  /** True until the first profile and pet snapshots arrive for the signed-in user */
  isUserDataLoading: boolean
  /**
   * Set while SignUpScreen creates the auth account and profile, so the
   * navigator doesn't route to Onboarding before the profile write lands.
   */
  isSigningUp: boolean
  setIsSigningUp: (v: boolean) => void
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [pet, setPet] = useState<PetState | null>(null)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [petLoaded, setPetLoaded] = useState(false)
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
    if (!user) return

    const unsubProfile = databaseService.subscribeToProfile(
      user.uid,
      (p) => {
        setProfile(p)
        setProfileLoaded(true)
      },
      (e) => {
        console.warn("Profile subscription failed:", e.message)
        setProfileLoaded(true)
      },
    )
    const unsubPet = databaseService.subscribeToPet(
      user.uid,
      (p) => {
        setPet(p)
        setPetLoaded(true)
      },
      (e) => {
        console.warn("Pet subscription failed:", e.message)
        setPetLoaded(true)
      },
    )

    // Hackathon builds stored the pet inside users/{uid}.pet; move it once.
    databaseService
      .migrateLegacyPet(user.uid, user.displayName ?? "")
      .catch((e) => console.warn("Legacy pet migration failed:", e.message))

    return () => {
      unsubProfile()
      unsubPet()
    }
  }, [user])

  const logout = useCallback(async () => {
    await authService.signOut()
  }, [])

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: !!user,
      profile,
      pet,
      isUserDataLoading: !!user && (!profileLoaded || !petLoaded),
      isSigningUp: isSigningUp || awaitingProfile,
      setIsSigningUp,
      logout,
    }),
    [
      user,
      profile,
      pet,
      profileLoaded,
      petLoaded,
      isSigningUp,
      awaitingProfile,
      setIsSigningUp,
      logout,
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

import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useEffect,
  useState,
} from "react"
import { User, onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"

import { authService } from "@/services/firebase/auth"
import { auth, db } from "@/services/firebase/config"
import { databaseService } from "@/services/firebase/database"

export type AuthContextType = {
  isAuthenticated: boolean
  user: User | null
  authEmail?: string
  setAuthEmail: (email: string) => void
  logout: () => Promise<void>
  validationError: string
  pet: object
  setPet: (any) => void
  userProfile: object
  setUserProfile: (any) => void
}

export const AuthContext = createContext<AuthContextType | null>(null)

export interface AuthProviderProps {}

export const AuthProvider: FC<PropsWithChildren<AuthProviderProps>> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState(null)
  const [pet, setPet] = useState(null)
  const [authEmail, setAuthEmail] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        setUser(firebaseUser)
        if (firebaseUser) {
          setAuthEmail(firebaseUser.email || "")

          // Ensure user profile exists
          try {
            const profile = await databaseService.getUserProfile(firebaseUser.uid)
            if (!profile) {
              await databaseService.createUserProfile(
                firebaseUser.uid,
                firebaseUser.email || "",
                firebaseUser.displayName || undefined,
              )
            }
          } catch (error) {
            console.error("Error checking/creating user profile:", error)
          }
        } else {
          setAuthEmail("")
        }
        setIsLoading(false)
      })

      return unsubscribe
    } catch (error) {
      console.error("Error setting up auth state listener:", error)
      setIsLoading(false)
      return () => {} // Return empty cleanup function
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.signOut()
      setUser(null)
      setAuthEmail("")
    } catch (error) {
      console.error("Error signing out:", error)
      throw error
    }
  }, [])

  const loadUserData = async () => {
    if (!user) {
      setUserProfile(null)
      setPet(null)
      return
    }

    try {
      // 1. Create a reference to the specific user's document
      const userDocRef = doc(db, "users", user.uid)

      // 2. Fetch the document
      const userDocSnap = await getDoc(userDocRef)

      if (userDocSnap.exists()) {
        const data = userDocSnap.data()

        // 3. Update Profile State
        // (You might need to cast 'data' to your UserProfile type if using TypeScript)
        setUserProfile(data as any)

        // 4. Update Pet State
        // Since we saved 'pet' as a field inside this same document, we just grab it here.
        if (data.pet) {
          setPet(data.pet)
        } else {
          setPet(null)
        }
      } else {
        console.log("No user document found!")
      }
    } catch (error) {
      console.error("Error getting user profile", error)
    }
  }

  useEffect(() => {
    loadUserData()
  }, [user])

  const validationError = useMemo(() => {
    if (!authEmail || authEmail.length === 0) return "can't be blank"
    if (authEmail.length < 6) return "must be at least 6 characters"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authEmail)) return "must be a valid email address"
    return ""
  }, [authEmail])

  const value = {
    isAuthenticated: !!user,
    user,
    userProfile,
    setUserProfile,
    pet,
    setPet,
    authEmail,
    setAuthEmail,
    logout,
    validationError,
  }

  // Don't render children until auth state is determined
  if (isLoading) {
    return null
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}

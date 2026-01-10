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
import { auth } from "@/services/firebase/config"
import { authService } from "@/services/firebase/auth"
import { databaseService } from "@/services/firebase/database"

export type AuthContextType = {
  isAuthenticated: boolean
  user: User | null
  authEmail?: string
  setAuthEmail: (email: string) => void
  logout: () => Promise<void>
  validationError: string
}

export const AuthContext = createContext<AuthContextType | null>(null)

export interface AuthProviderProps {}

export const AuthProvider: FC<PropsWithChildren<AuthProviderProps>> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
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

  const validationError = useMemo(() => {
    if (!authEmail || authEmail.length === 0) return "can't be blank"
    if (authEmail.length < 6) return "must be at least 6 characters"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authEmail)) return "must be a valid email address"
    return ""
  }, [authEmail])

  const value = {
    isAuthenticated: !!user,
    user,
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

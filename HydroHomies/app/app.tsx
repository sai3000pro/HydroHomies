/* eslint-disable import/first */
/**
 * App entry point: loads fonts and translations, then renders the navigator
 * inside the auth and theme providers. Screens live in ./screens and routing
 * rules in ./navigators/AppNavigator.tsx.
 */
if (__DEV__) {
  // Load Reactotron in development only.
  // Note that you must be using metro's `inlineRequires` for this to work.
  // If you turn it off in metro.config.js, you'll have to manually import it.
  require("./devtools/ReactotronConfig.ts")
}
import "./utils/gestureHandler"

import { useEffect, useState } from "react"
import { useFonts } from "expo-font"
import * as Linking from "expo-linking"
import { initialWindowMetrics, SafeAreaProvider } from "react-native-safe-area-context"

import { AuthProvider } from "./context/AuthContext"
import { initI18n } from "./i18n"
import { AppNavigator } from "./navigators/AppNavigator"
import { useNavigationPersistence } from "./navigators/navigationUtilities"
import { loadModel } from "./services/ml/waterLevelClassifier"
import { ThemeProvider } from "./theme/context"
import { customFontsToLoad } from "./theme/typography"
import { loadDateFnsLocale } from "./utils/formatDate"
import * as storage from "./utils/storage"

export const NAVIGATION_PERSISTENCE_KEY = "NAVIGATION_STATE"

// Deep links / web URLs. Screens that aren't in the current stack (e.g. Home
// while signed out) are ignored by React Navigation.
const prefix = Linking.createURL("/")
const config = {
  screens: {
    Login: "",
    SignUp: "signup",
    Home: "home",
    ScanBottle: "scan",
    Leaderboard: "leaderboard",
    FriendPet: "friend/:userId",
  },
}

export function App() {
  const {
    initialNavigationState,
    onNavigationStateChange,
    isRestored: isNavigationStateRestored,
  } = useNavigationPersistence(storage, NAVIGATION_PERSISTENCE_KEY)

  const [areFontsLoaded, fontLoadError] = useFonts(customFontsToLoad)
  const [isI18nInitialized, setIsI18nInitialized] = useState(false)

  useEffect(() => {
    initI18n()
      .then(() => setIsI18nInitialized(true))
      .then(() => loadDateFnsLocale())

    // Optional on-device model; resolves false in Expo Go or on web
    loadModel()
  }, [])

  // Render nothing (the native splash stays up) until fonts, i18n and
  // navigation state are ready.
  if (!isNavigationStateRestored || !isI18nInitialized || (!areFontsLoaded && !fontLoadError)) {
    return null
  }

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AuthProvider>
        <ThemeProvider>
          <AppNavigator
            linking={{ prefixes: [prefix], config }}
            initialState={initialNavigationState}
            onStateChange={onNavigationStateChange}
          />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}

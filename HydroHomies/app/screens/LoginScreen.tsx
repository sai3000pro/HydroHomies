import { ComponentType, FC, useEffect, useMemo, useRef, useState } from "react"
// eslint-disable-next-line no-restricted-imports
import { TextInput, TextStyle, ViewStyle, Alert, View } from "react-native"

import { Button } from "@/components/Button"
import { PressableIcon } from "@/components/Icon"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField, type TextFieldAccessoryProps } from "@/components/TextField"
import { useAuth } from "@/context/AuthContext"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { authService } from "@/services/firebase/auth"
import { isFirebaseConfigured } from "@/services/firebase/config"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface LoginScreenProps extends AppStackScreenProps<"Login"> {}

export const LoginScreen: FC<LoginScreenProps> = () => {
  const authPasswordInput = useRef<TextInput>(null)

  const [authPassword, setAuthPassword] = useState("")
  const [isAuthPasswordHidden, setIsAuthPasswordHidden] = useState(true)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [attemptsCount, setAttemptsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const { authEmail, setAuthEmail, validationError } = useAuth()

  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  useEffect(() => {
    // Pre-fill form for development (remove in production)
    // setAuthEmail("test@example.com")
    // setAuthPassword("password123")
  }, [setAuthEmail])

  const error = isSubmitted ? validationError : ""

  async function login() {
    console.log("Login button clicked!")
    console.log("Email:", authEmail)
    console.log("Password length:", authPassword.length)
    console.log("Validation error:", validationError)

    setIsSubmitted(true)
    setAttemptsCount(attemptsCount + 1)

    if (validationError) {
      console.log("Validation error - blocking login:", validationError)
      Alert.alert("Validation Error", validationError)
      setIsSubmitted(false)
      return
    }

    // Check Firebase configuration first
    console.log("Firebase configured?", isFirebaseConfigured)
    if (!isFirebaseConfigured) {
      console.warn("Firebase not configured!")
      Alert.alert(
        "Firebase Not Configured",
        "Please configure Firebase before using the app.\n\n" +
          "1. Go to Firebase Console: https://console.firebase.google.com/\n" +
          "2. Create/select a project\n" +
          "3. Enable Authentication (Email/Password)\n" +
          "4. Create Firestore Database\n" +
          "5. Copy your config to: app/services/firebase/config.ts\n\n" +
          "See SETUP.md for detailed instructions.",
      )
      setIsSubmitted(false)
      setIsLoading(false)
      return
    }

    if (!authEmail || authEmail.trim() === "") {
      Alert.alert("Error", "Please enter an email address")
      setIsSubmitted(false)
      return
    }

    if (!authPassword || authPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters")
      setIsSubmitted(false)
      return
    }

    console.log("Starting login process...")
    setIsLoading(true)

    try {
      // Try to sign in with Firebase
      await authService.signIn(authEmail, authPassword)
      // Auth state change will be handled by AuthContext
      // Navigation will happen automatically via isAuthenticated check
      console.log("Login successful!")
    } catch (error: any) {
      console.error("Login error:", error)
      let errorMessage = "Failed to sign in. Please try again."

      // Check if Firebase is configured
      if (error.code === "auth/invalid-api-key" || error.message?.includes("API key")) {
        errorMessage =
          "Firebase is not configured. Please check your Firebase config in app/services/firebase/config.ts"
        console.error(
          "Firebase Configuration Error: Please set your Firebase credentials in app/services/firebase/config.ts",
        )
        if (typeof window !== "undefined") {
          alert(errorMessage)
        } else {
          Alert.alert("Configuration Error", errorMessage)
        }
        setIsLoading(false)
        setIsSubmitted(false)
        return
      }

      // Handle different Firebase auth error codes
      if (error.code === "auth/user-not-found" || error.code === "auth/invalid-credential") {
        // User doesn't exist or invalid credentials - try to create account
        // Firebase returns auth/invalid-credential for both wrong password and non-existent user for security
        try {
          console.log("User not found or invalid credential, attempting to create account...")
          await authService.signUp(authEmail, authPassword)
          errorMessage = ""
          console.log("✅ Account created successfully! You are now logged in.")
          // Account created successfully - auth state will update automatically via AuthContext
          // Don't show error message, just return - user will be redirected to Home/Onboarding
          setIsLoading(false)
          setIsSubmitted(false)
          return
        } catch (signUpError: any) {
          console.error("Sign up error:", signUpError)
          if (signUpError.code === "auth/email-already-in-use") {
            // User exists but password was wrong
            errorMessage =
              "This email is already registered. The password you entered is incorrect. Please check your password or use 'Forgot Password' if needed."
          } else if (signUpError.code === "auth/operation-not-allowed") {
            errorMessage =
              "Email/Password authentication is not enabled in Firebase. Please enable it in Firebase Console > Authentication > Sign-in method > Email/Password."
          } else if (
            signUpError.code === "auth/invalid-api-key" ||
            signUpError.message?.includes("API key")
          ) {
            errorMessage = "Firebase is not configured. Please check your Firebase config."
          } else if (signUpError.code === "auth/weak-password") {
            errorMessage =
              "Password is too weak. Please use a stronger password (at least 6 characters)."
          } else if (signUpError.code === "auth/invalid-email") {
            errorMessage = "Invalid email address format. Please enter a valid email."
          } else {
            errorMessage = `Failed to create account: ${signUpError.message || signUpError.code || "Unknown error"}`
          }
        }
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password. Please try again or reset your password."
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address. Please check and try again."
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your internet connection and try again."
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed login attempts. Please try again later."
      } else {
        errorMessage = `Error: ${error.message || error.code || "Unknown error occurred"}`
        console.error("Unhandled Firebase error:", error)
      }

      if (errorMessage) {
        // Alert.alert works on web via react-native-web
        Alert.alert("Error", errorMessage)
      }
    } finally {
      setIsLoading(false)
      setIsSubmitted(false)
    }
  }

  const PasswordRightAccessory: ComponentType<TextFieldAccessoryProps> = useMemo(
    () =>
      function PasswordRightAccessory(props: TextFieldAccessoryProps) {
        return (
          <PressableIcon
            icon={isAuthPasswordHidden ? "view" : "hidden"}
            color={colors.palette.neutral800}
            containerStyle={props.style}
            size={20}
            onPress={() => setIsAuthPasswordHidden(!isAuthPasswordHidden)}
          />
        )
      },
    [isAuthPasswordHidden, colors.palette.neutral800],
  )

  return (
    <Screen
      preset="auto"
      contentContainerStyle={themed($screenContentContainer)}
      safeAreaEdges={["top", "bottom"]}
    >
      <Text testID="login-heading" tx="loginScreen:logIn" preset="heading" style={themed($logIn)} />
      <Text tx="loginScreen:enterDetails" preset="subheading" style={themed($enterDetails)} />

      {!isFirebaseConfigured && (
        <View style={themed($configWarning)}>
          <Text preset="bold" text="⚠️ Firebase Not Configured" style={themed($warningTitle)} />
          <Text
            size="sm"
            text="Please configure Firebase before using the app. See SETUP.md for instructions."
            style={themed($warningText)}
          />
        </View>
      )}

      {attemptsCount > 2 && (
        <Text tx="loginScreen:hint" size="sm" weight="light" style={themed($hint)} />
      )}

      <TextField
        value={authEmail}
        onChangeText={setAuthEmail}
        containerStyle={themed($textField)}
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        keyboardType="email-address"
        labelTx="loginScreen:emailFieldLabel"
        placeholderTx="loginScreen:emailFieldPlaceholder"
        helper={error}
        status={error ? "error" : undefined}
        onSubmitEditing={() => authPasswordInput.current?.focus()}
      />

      <TextField
        ref={authPasswordInput}
        value={authPassword}
        onChangeText={setAuthPassword}
        containerStyle={themed($textField)}
        autoCapitalize="none"
        autoComplete="password"
        autoCorrect={false}
        secureTextEntry={isAuthPasswordHidden}
        labelTx="loginScreen:passwordFieldLabel"
        placeholderTx="loginScreen:passwordFieldPlaceholder"
        onSubmitEditing={login}
        RightAccessory={PasswordRightAccessory}
      />

      <Button
        testID="login-button"
        tx="loginScreen:tapToLogIn"
        style={themed($tapButton)}
        preset="reversed"
        onPress={() => {
          console.log("Button onPress handler called!")
          login().catch((error) => {
            console.error("Login function error:", error)
            Alert.alert("Unexpected Error", `Login failed: ${error.message || error}`)
          })
        }}
        disabled={isLoading}
      />

      {/* Debug info - remove in production */}
      {__DEV__ && (
        <View style={themed($debugInfo)}>
          <Text size="xs" text={`Email: ${authEmail || "(empty)"}`} />
          <Text size="xs" text={`Password length: ${authPassword.length}`} />
          <Text size="xs" text={`Validation error: ${validationError || "none"}`} />
          <Text size="xs" text={`Firebase configured: ${isFirebaseConfigured ? "yes" : "no"}`} />
          <Text size="xs" text={`Is loading: ${isLoading}`} />
        </View>
      )}
    </Screen>
  )
}

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.xxl,
  paddingHorizontal: spacing.lg,
})

const $logIn: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})

const $enterDetails: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $hint: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.tint,
  marginBottom: spacing.md,
})

const $textField: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $tapButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
})

const $configWarning: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.warning100,
  borderLeftWidth: 4,
  borderLeftColor: colors.palette.warning500,
  padding: spacing.md,
  borderRadius: 8,
  marginBottom: spacing.md,
})

const $warningTitle: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.palette.warning900,
  marginBottom: spacing.xs,
})

const $warningText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.warning800,
})

const $debugInfo: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  marginTop: spacing.lg,
  padding: spacing.md,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 8,
  gap: spacing.xs,
})

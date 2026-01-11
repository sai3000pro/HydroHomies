import { ComponentType, FC, useMemo, useRef, useState } from "react"
// eslint-disable-next-line no-restricted-imports
import { TextInput, TextStyle, ViewStyle, Alert, View } from "react-native"
import { useNavigation } from "@react-navigation/native"

import { Button } from "@/components/Button"
import { Container } from "@/components/Container"
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
  const navigation = useNavigation()

  const authPasswordInput = useRef<TextInput>(null)

  const [authPassword, setAuthPassword] = useState("")
  const [isAuthPasswordHidden, setIsAuthPasswordHidden] = useState(true)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errorText, setErrorText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { authEmail, setAuthEmail, validationError } = useAuth()

  const {
    themed,
    theme: { colors },
  } = useAppTheme()

  const error = isSubmitted ? validationError : ""

  async function login() {
    setIsSubmitted(true)
    setErrorText("")

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
        errorMessage = "User not found or invalid credentials."
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
        Alert.alert("Error", errorMessage)
      }
      setErrorText(errorMessage)
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
            color="#000000"
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
      <Container headingImage={require("../../assets/images/login-header.png")}>
        <View style={themed($mainContainer)}>
          <View style={themed($formContainer)}>
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
              placeholderTextColor="#000000"
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
              placeholderTextColor="#000000"
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

            {errorText && <Text style={themed($error)}>{errorText}</Text>}
          </View>

          <Text style={themed($text)}>
            No account?{" "}
            <Text style={themed($signup)} onPress={() => navigation.navigate("SignUp")}>
              Sign-up
            </Text>
          </Text>
        </View>
      </Container>
    </Screen>
  )
}

const $screenContentContainer: ThemedStyle<ViewStyle> = () => ({
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#89DDF9",
})

const $mainContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: "100%",
  height: 400,
  padding: spacing.lg,
  borderRadius: 33,
  backgroundColor: "#C2F5FF",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "space-between",
})

const $formContainer: ThemedStyle<ViewStyle> = () => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
})

const $textField: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: "100%",
  marginBottom: spacing.lg,
})

const $tapButton: ThemedStyle<ViewStyle> = () => ({
  width: 100,
  borderRadius: 33,
  backgroundColor: "#D9D9D9",
})

const $error: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  marginTop: spacing.md,
  color: colors.error,
})

const $text: ThemedStyle<TextStyle> = () => ({
  color: "#000000",
})

const $signup: ThemedStyle<TextStyle> = () => ({
  color: "blue",
  fontWeight: "bold",
})

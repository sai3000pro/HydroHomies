import { ComponentType, FC, useMemo, useRef, useState } from "react"
// eslint-disable-next-line no-restricted-imports
import { TextInput, TextStyle, ViewStyle, Alert, View } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { doc, setDoc } from "firebase/firestore"

import { Button } from "@/components/Button"
import { Container } from "@/components/Container"
import { Dropdown } from "@/components/Dropdown"
import { PressableIcon } from "@/components/Icon"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField, type TextFieldAccessoryProps } from "@/components/TextField"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { authService } from "@/services/firebase/auth"
import { db } from "@/services/firebase/config"
import { isFirebaseConfigured } from "@/services/firebase/config"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { calculateDailyWaterGoal, UserStats } from "@/utils/waterGoalCalculator"

const sexOptions = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
]

const activityLevelOptions = [
  { label: "Low", value: "low" },
  { label: "Moderate", value: "moderate" },
  { label: "High", value: "high" },
  { label: "Very High", value: "very_high" },
]

interface SignUpScreenProps extends AppStackScreenProps<"SignUp"> {}

export const SignUpScreen: FC<SignUpScreenProps> = () => {
  const navigation = useNavigation()

  const authPasswordInput = useRef<TextInput>(null)

  const [errorText, setErrorText] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const [authEmail, setAuthEmail] = useState("")
  const [authUsername, setAuthUsername] = useState("")
  const [authPassword, setAuthPassword] = useState("")
  const [isAuthPasswordHidden, setIsAuthPasswordHidden] = useState(true)
  const [authPassword2, setAuthPassword2] = useState("")
  const [isAuthPassword2Hidden, setIsAuthPassword2Hidden] = useState(true)
  const [sex, setSex] = useState(sexOptions[0].value)
  const [age, setAge] = useState("25")
  const [height, setHeight] = useState("170")
  const [weight, setWeight] = useState("75")
  const [activityLevel, setActivityLevel] = useState(activityLevelOptions[0].value)

  const { themed } = useAppTheme()

  async function signup() {
    setErrorText("")

    // --- 1. CONFIG CHECK ---
    if (!isFirebaseConfigured) {
      Alert.alert("Configuration Error", "Firebase is not configured. See SETUP.md.")
      return
    }

    // --- 2. VALIDATION ---
    if (!authEmail || authEmail.trim() === "") {
      Alert.alert("Error", "Please enter an email address")
      return
    }

    if (!authPassword || authPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters")
      return
    }

    if (authPassword !== authPassword2) {
      Alert.alert("Error", "Passwords must match")
    }

    // Validate new fields
    if (!authUsername || authUsername.trim() === "") {
      Alert.alert("Error", "Please enter a username")
      return
    }

    // Ensure numbers are valid
    if (!age || isNaN(Number(age))) {
      Alert.alert("Error", "Please enter a valid age")
      return
    }

    if (!height || isNaN(Number(height))) {
      Alert.alert("Error", "Please enter a valid height")
      return
    }

    if (!weight || isNaN(Number(weight))) {
      Alert.alert("Error", "Please enter a valid weight")
      return
    }

    console.log("Starting signup process...")
    setIsLoading(true)

    try {
      // This creates the user in Firebase Authentication
      const user = await authService.signUp(authEmail, authPassword)

      if (!user) throw new Error("User creation failed")

      console.log("Auth account created. Creating database profile...")

      const stats: UserStats = {
        sex: sex,
        age: Number(age),
        height: Number(height),
        weight: Number(weight),
        activityLevel: activityLevel,
      }

      // This saves the extra details (Sex, Age, etc.) to Firestore
      await setDoc(doc(db, "users", user.uid), {
        username: authUsername.trim(),
        email: authEmail.trim(),
        stats: {
          ...stats,
          dailyWaterGoal: calculateDailyWaterGoal(stats),
        },
        createdAt: new Date().toISOString(),
      })

      console.log("✅ Signup and Profile Creation Successful!")
    } catch (error: any) {
      console.error("Signup error:", error)
      let errorMessage = "Failed to sign up."

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "That email is already in use."
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email format."
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak."
      } else {
        errorMessage = error.message || "An unexpected error occurred."
      }

      Alert.alert("Error", errorMessage)
      setErrorText(errorMessage)
    } finally {
      setIsLoading(false)
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
    [isAuthPasswordHidden],
  )

  const PasswordRightAccessory2: ComponentType<TextFieldAccessoryProps> = useMemo(
    () =>
      function PasswordRightAccessory(props: TextFieldAccessoryProps) {
        return (
          <PressableIcon
            icon={isAuthPassword2Hidden ? "view" : "hidden"}
            color="#000000"
            containerStyle={props.style}
            size={20}
            onPress={() => setIsAuthPassword2Hidden(!isAuthPassword2Hidden)}
          />
        )
      },
    [isAuthPassword2Hidden],
  )

  return (
    <Screen
      preset="auto"
      contentContainerStyle={themed($screenContentContainer)}
      safeAreaEdges={["top", "bottom"]}
    >
      <Container headingImage={require("../../assets/images/signup-header.png")}>
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
              labelTx="signUpScreen:emailFieldLabel"
              placeholderTx="signUpScreen:emailFieldPlaceholder"
              placeholderTextColor="#000000"
            />
            <TextField
              value={authUsername}
              onChangeText={setAuthUsername}
              containerStyle={themed($textField)}
              autoCapitalize="none"
              autoCorrect={false}
              labelTx="signUpScreen:usernameFieldLabel"
              placeholderTx="signUpScreen:usernameFieldPlaceholder"
              placeholderTextColor="#000000"
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
              onSubmitEditing={signup}
              RightAccessory={PasswordRightAccessory}
            />
            <TextField
              ref={authPasswordInput}
              value={authPassword2}
              onChangeText={setAuthPassword2}
              containerStyle={themed($textField)}
              autoCapitalize="none"
              autoComplete="password"
              autoCorrect={false}
              secureTextEntry={isAuthPassword2Hidden}
              labelTx="signUpScreen:passwordField2Label"
              placeholderTx="signUpScreen:passwordField2Placeholder"
              placeholderTextColor="#000000"
              onSubmitEditing={signup}
              RightAccessory={PasswordRightAccessory2}
            />
            <View style={themed($row)}>
              <Dropdown
                label="Sex"
                placeholder="Select..."
                options={sexOptions}
                value={sex}
                onSelect={setSex}
                containerStyle={themed($halfField)} // Takes up half space
              />
              <TextField
                value={age}
                onChangeText={setAge}
                containerStyle={themed($halfField)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="decimal-pad"
                labelTx="signUpScreen:ageFieldLabel"
                placeholderTx="signUpScreen:ageFieldPlaceholder"
                placeholderTextColor="#000000"
              />
            </View>
            <View style={themed($row)}>
              <TextField
                value={height}
                onChangeText={setHeight}
                containerStyle={themed($halfField)}
                autoCapitalize="none"
                keyboardType="decimal-pad"
                autoCorrect={false}
                labelTx="signUpScreen:heightFieldLabel"
                placeholderTx="signUpScreen:heightFieldPlaceholder"
                placeholderTextColor="#000000"
              />
              <TextField
                value={weight}
                onChangeText={setWeight}
                containerStyle={themed($halfField)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="decimal-pad"
                labelTx="signUpScreen:weightFieldLabel"
                placeholderTx="signUpScreen:weightFieldPlaceholder"
                placeholderTextColor="#000000"
              />
            </View>
            <Dropdown
              label="Activity Level"
              placeholder="Select..."
              options={activityLevelOptions}
              value={activityLevel}
              onSelect={setActivityLevel}
              containerStyle={themed($textField)}
            />
            <Button
              testID="signup-button"
              tx="signUpScreen:tapToSignUp"
              style={themed($tapButton)}
              preset="reversed"
              onPress={() => {
                console.log("Button onPress handler called!")
                signup().catch((error) => {
                  console.error("Signup function error:", error)
                  Alert.alert("Unexpected Error", `Signup failed: ${error.message || error}`)
                })
              }}
              disabled={isLoading}
            />
            {errorText && <Text style={themed($error)}>{errorText}</Text>}
          </View>
          <Text style={themed($text)}>
            Already have an account?{" "}
            <Text style={themed($signup)} onPress={() => navigation.navigate("Login")}>
              Login
            </Text>
          </Text>
        </View>
      </Container>
    </Screen>
  )
}

const $screenContentContainer: ThemedStyle<ViewStyle> = () => ({
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#89DDF9",
})

const $mainContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: "100%",
  height: 800,
  padding: spacing.lg,
  borderRadius: 33,
  backgroundColor: "#C2F5FF",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "space-between",
})

const $formContainer: ThemedStyle<ViewStyle> = () => ({
  width: "105%",
  display: "flex",
  alignItems: "center",
  flexDirection: "column",
})

const $textField: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: "100%",
  marginBottom: spacing.sm,
})

const $row: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: "100%",
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  marginBottom: spacing.sm,
  justifyContent: "space-between",
})

const $halfField: ThemedStyle<ViewStyle> = () => ({
  width: "48%",
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
  textAlign: "center",
})

const $signup: ThemedStyle<TextStyle> = () => ({
  color: "blue",
  fontWeight: "bold",
})

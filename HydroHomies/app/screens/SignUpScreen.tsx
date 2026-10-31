import { ComponentType, FC, useMemo, useState } from "react"
import { TextStyle, View, ViewStyle } from "react-native"

import { Button } from "@/components/Button"
import { Container } from "@/components/Container"
import { PressableIcon } from "@/components/Icon"
import { Screen } from "@/components/Screen"
import { DEFAULT_STATS_FORM, parseStatsForm, StatsFields } from "@/components/StatsFields"
import { Text } from "@/components/Text"
import { LABEL_ON_LIGHT, TextField, type TextFieldAccessoryProps } from "@/components/TextField"
import { useAuth } from "@/context/AuthContext"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { authService, describeAuthError } from "@/services/firebase/auth"
import { isFirebaseConfigured } from "@/services/firebase/config"
import { databaseService } from "@/services/firebase/database"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface SignUpScreenProps extends AppStackScreenProps<"SignUp"> {}

export const SignUpScreen: FC<SignUpScreenProps> = ({ navigation }) => {
  const { themed } = useAppTheme()
  const { setIsSigningUp } = useAuth()

  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [password2, setPassword2] = useState("")
  const [isPasswordHidden, setIsPasswordHidden] = useState(true)
  const [stats, setStats] = useState(DEFAULT_STATS_FORM)
  const [errorText, setErrorText] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  function validate(): string | null {
    if (!isFirebaseConfigured) return "Firebase is not configured. See SETUP.md."
    if (!EMAIL_RE.test(email.trim())) return "Enter a valid email address."
    if (!username.trim()) return "Enter a username."
    if (username.trim().length > 24) return "Username must be 24 characters or fewer."
    if (password.length < 6) return "Password must be at least 6 characters."
    if (password !== password2) return "Passwords must match."
    const parsed = parseStatsForm(stats)
    return "error" in parsed ? parsed.error : null
  }

  async function signup() {
    const error = validate()
    setErrorText(error ?? "")
    if (error) return

    const parsed = parseStatsForm(stats)
    if (!("stats" in parsed)) return

    setIsLoading(true)
    // Hold the navigator on a spinner until the profile exists, so it doesn't
    // flash the Onboarding screen between account creation and the profile write.
    setIsSigningUp(true)
    try {
      const name = username.trim()
      const user = await authService.signUp(email.trim(), password, name)
      // If this write fails, the user lands on Onboarding and can retry there.
      await databaseService.saveProfile(user.uid, {
        email: email.trim(),
        username: name,
        stats: parsed.stats,
      })
    } catch (e: any) {
      // Shown inline under the button
      setErrorText(describeAuthError(e))
    } finally {
      setIsSigningUp(false)
      setIsLoading(false)
    }
  }

  const PasswordRightAccessory: ComponentType<TextFieldAccessoryProps> = useMemo(
    () =>
      function PasswordRightAccessory(props: TextFieldAccessoryProps) {
        return (
          <PressableIcon
            icon={isPasswordHidden ? "view" : "hidden"}
            color="#000000"
            containerStyle={props.style}
            size={20}
            onPress={() => setIsPasswordHidden(!isPasswordHidden)}
          />
        )
      },
    [isPasswordHidden],
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
              LabelTextProps={LABEL_ON_LIGHT}
              value={email}
              onChangeText={setEmail}
              containerStyle={themed($textField)}
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              keyboardType="email-address"
              labelTx="signUpScreen:emailFieldLabel"
              placeholderTx="signUpScreen:emailFieldPlaceholder"
            />
            <TextField
              LabelTextProps={LABEL_ON_LIGHT}
              value={username}
              onChangeText={setUsername}
              containerStyle={themed($textField)}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={24}
              labelTx="signUpScreen:usernameFieldLabel"
              placeholderTx="signUpScreen:usernameFieldPlaceholder"
            />
            <TextField
              LabelTextProps={LABEL_ON_LIGHT}
              value={password}
              onChangeText={setPassword}
              containerStyle={themed($textField)}
              autoCapitalize="none"
              autoComplete="new-password"
              autoCorrect={false}
              secureTextEntry={isPasswordHidden}
              labelTx="signUpScreen:passwordFieldLabel"
              placeholderTx="signUpScreen:passwordFieldPlaceholder"
              RightAccessory={PasswordRightAccessory}
            />
            <TextField
              LabelTextProps={LABEL_ON_LIGHT}
              value={password2}
              onChangeText={setPassword2}
              containerStyle={themed($textField)}
              autoCapitalize="none"
              autoComplete="new-password"
              autoCorrect={false}
              secureTextEntry={isPasswordHidden}
              labelTx="signUpScreen:passwordField2Label"
              placeholderTx="signUpScreen:passwordField2Placeholder"
            />
            <StatsFields values={stats} onChange={setStats} onLight />
            <Button
              testID="signup-button"
              {...(isLoading
                ? { text: "Creating account…" }
                : { tx: "signUpScreen:tapToSignUp" as const })}
              style={themed($tapButton)}
              preset="reversed"
              onPress={signup}
              disabled={isLoading}
            />
            {!!errorText && <Text style={themed($error)} text={errorText} />}
          </View>
          <Text style={themed($text)}>
            Already have an account?{" "}
            <Text style={themed($link)} onPress={() => navigation.navigate("Login")} text="Login" />
          </Text>
        </View>
      </Container>
    </Screen>
  )
}

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: "100%",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.palette.water300,
})

const $mainContainer: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  width: "100%",
  padding: spacing.lg,
  borderRadius: 33,
  backgroundColor: colors.palette.water100,
  alignItems: "center",
  gap: spacing.lg,
})

const $formContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: "100%",
  alignItems: "center",
  gap: spacing.xs,
})

const $textField: ThemedStyle<ViewStyle> = () => ({ width: "100%" })

const $tapButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  minWidth: 120,
  marginTop: spacing.md,
  borderRadius: 33,
})

const $error: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  marginTop: spacing.sm,
  color: colors.error,
  textAlign: "center",
})

const $text: ThemedStyle<TextStyle> = () => ({ color: "#000000", textAlign: "center" })

const $link: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.water700,
  fontWeight: "bold",
})

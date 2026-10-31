import { ComponentType, FC, useMemo, useRef, useState } from "react"
// eslint-disable-next-line no-restricted-imports
import { TextInput, TextStyle, View, ViewStyle } from "react-native"

import { Button } from "@/components/Button"
import { Container } from "@/components/Container"
import { PressableIcon } from "@/components/Icon"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { LABEL_ON_LIGHT, TextField, type TextFieldAccessoryProps } from "@/components/TextField"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { authService, describeAuthError } from "@/services/firebase/auth"
import { isFirebaseConfigured } from "@/services/firebase/config"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface LoginScreenProps extends AppStackScreenProps<"Login"> {}

export const LoginScreen: FC<LoginScreenProps> = ({ navigation }) => {
  const { themed } = useAppTheme()
  const passwordInput = useRef<TextInput>(null)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isPasswordHidden, setIsPasswordHidden] = useState(true)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errorText, setErrorText] = useState("")
  const [infoText, setInfoText] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const emailError =
    isSubmitted && !EMAIL_RE.test(email.trim()) ? "Enter a valid email address" : ""

  async function login() {
    setIsSubmitted(true)
    setErrorText("")
    setInfoText("")
    if (!isFirebaseConfigured) {
      setErrorText("Firebase is not configured. See SETUP.md.")
      return
    }
    if (!EMAIL_RE.test(email.trim())) return
    if (password.length < 6) {
      setErrorText("Password must be at least 6 characters.")
      return
    }

    setIsLoading(true)
    try {
      // On success, AuthContext picks up the session and the navigator switches stacks
      await authService.signIn(email.trim(), password)
    } catch (e: any) {
      // Shown inline under the button
      setErrorText(describeAuthError(e))
    } finally {
      setIsLoading(false)
    }
  }

  async function resetPassword() {
    setIsSubmitted(true)
    setErrorText("")
    setInfoText("")
    if (!EMAIL_RE.test(email.trim())) {
      setErrorText("Enter your email above, then tap Forgot password.")
      return
    }
    try {
      await authService.sendPasswordReset(email.trim())
      setInfoText(`If ${email.trim()} has an account, a reset link is on its way.`)
    } catch (e: any) {
      setErrorText(describeAuthError(e))
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
      <Container headingImage={require("../../assets/images/login-header.png")}>
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
              labelTx="loginScreen:emailFieldLabel"
              placeholderTx="loginScreen:emailFieldPlaceholder"
              helper={emailError}
              status={emailError ? "error" : undefined}
              onSubmitEditing={() => passwordInput.current?.focus()}
            />

            <TextField
              LabelTextProps={LABEL_ON_LIGHT}
              ref={passwordInput}
              value={password}
              onChangeText={setPassword}
              containerStyle={themed($textField)}
              autoCapitalize="none"
              autoComplete="password"
              autoCorrect={false}
              secureTextEntry={isPasswordHidden}
              labelTx="loginScreen:passwordFieldLabel"
              placeholderTx="loginScreen:passwordFieldPlaceholder"
              onSubmitEditing={login}
              RightAccessory={PasswordRightAccessory}
            />

            <Button
              testID="login-button"
              {...(isLoading ? { text: "Logging in…" } : { tx: "loginScreen:tapToLogIn" as const })}
              style={themed($tapButton)}
              preset="reversed"
              onPress={login}
              disabled={isLoading}
            />

            {!!errorText && <Text style={themed($error)} text={errorText} />}
            {!!infoText && <Text style={themed($info)} text={infoText} />}
            <Text
              style={themed($forgot)}
              onPress={resetPassword}
              accessibilityRole="button"
              text="Forgot password?"
            />
          </View>

          <Text style={themed($text)}>
            No account?{" "}
            <Text
              style={themed($link)}
              onPress={() => navigation.navigate("SignUp")}
              text="Sign up"
            />
          </Text>
        </View>
      </Container>
    </Screen>
  )
}

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: "100%",
  height: "100%",
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
  gap: spacing.xl,
})

const $formContainer: ThemedStyle<ViewStyle> = () => ({ width: "100%", alignItems: "center" })

const $textField: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: "100%",
  marginBottom: spacing.lg,
})

const $tapButton: ThemedStyle<ViewStyle> = () => ({ minWidth: 120, borderRadius: 33 })

const $error: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  marginTop: spacing.md,
  color: colors.error,
  textAlign: "center",
})

const $text: ThemedStyle<TextStyle> = () => ({ color: "#000000" })

const $info: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
  color: "#1E6B3A",
  textAlign: "center",
})

const $forgot: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  marginTop: spacing.md,
  color: colors.palette.water700,
  textAlign: "center",
})

const $link: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.water700,
  fontWeight: "bold",
})

import { ComponentType, FC, useMemo, useRef, useState } from "react"
// eslint-disable-next-line no-restricted-imports
import { Alert, TextInput, TextStyle, View, ViewStyle } from "react-native"

import { Button } from "@/components/Button"
import { Container } from "@/components/Container"
import { PressableIcon } from "@/components/Icon"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField, type TextFieldAccessoryProps } from "@/components/TextField"
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
  const [isLoading, setIsLoading] = useState(false)

  const emailError =
    isSubmitted && !EMAIL_RE.test(email.trim()) ? "Enter a valid email address" : ""

  async function login() {
    setIsSubmitted(true)
    setErrorText("")
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
      const message = describeAuthError(e)
      setErrorText(message)
      Alert.alert("Login failed", message)
    } finally {
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
      <Container headingImage={require("../../assets/images/login-header.png")}>
        <View style={themed($mainContainer)}>
          <View style={themed($formContainer)}>
            <TextField
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
              tx="loginScreen:tapToLogIn"
              style={themed($tapButton)}
              preset="reversed"
              onPress={login}
              disabled={isLoading}
            />

            {!!errorText && <Text style={themed($error)} text={errorText} />}
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

const $link: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.water700,
  fontWeight: "bold",
})

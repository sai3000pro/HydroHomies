import { FC, useState } from "react"
import { TextStyle, View, ViewStyle } from "react-native"

import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import {
  DEFAULT_STATS_FORM,
  parseStatsForm,
  previewGoal,
  StatsFields,
} from "@/components/StatsFields"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { useAuth } from "@/context/AuthContext"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { databaseService } from "@/services/firebase/database"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface OnboardingScreenProps extends AppStackScreenProps<"Onboarding"> {}

/**
 * Shown when a signed-in account has no body stats, e.g. if the profile write
 * failed during sign-up or the account was created before stats existed.
 */
export const OnboardingScreen: FC<OnboardingScreenProps> = () => {
  const { themed } = useAppTheme()
  const { user, profile, logout } = useAuth()

  const [username, setUsername] = useState(profile?.username || user?.displayName || "")
  const [stats, setStats] = useState(DEFAULT_STATS_FORM)
  const [errorText, setErrorText] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const goal = previewGoal(stats)

  async function save() {
    if (!user) return
    if (!username.trim()) return setErrorText("Enter a username.")
    const parsed = parseStatsForm(stats)
    if ("error" in parsed) return setErrorText(parsed.error)

    setErrorText("")
    setIsLoading(true)
    try {
      // The navigator moves on once the profile snapshot includes stats
      await databaseService.saveProfile(user.uid, {
        email: user.email ?? "",
        username: username.trim(),
        stats: parsed.stats,
      })
    } catch (e: any) {
      setErrorText(e?.message ?? "Could not save your stats. Try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Screen
      preset="scroll"
      contentContainerStyle={themed($container)}
      safeAreaEdges={["top", "bottom"]}
    >
      <Text preset="heading" text="Let's set your goal 💧" />
      <Text
        text="We use these to estimate how much water you need each day."
        style={themed($dim)}
      />

      <TextField
        label="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        maxLength={24}
      />
      <StatsFields values={stats} onChange={setStats} />

      {goal !== null && (
        <View style={themed($goalBox)}>
          <Text size="sm" text="Your daily goal" />
          <Text preset="heading" text={`${(goal / 1000).toFixed(2)} L`} />
        </View>
      )}

      {!!errorText && <Text text={errorText} style={themed($error)} />}

      <Button text="Continue" preset="reversed" onPress={save} disabled={isLoading} />
      <Button text="Log out" onPress={logout} />
    </Screen>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.lg,
  gap: spacing.md,
})

const $dim: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.textDim })

const $goalBox: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  alignItems: "center",
  padding: spacing.md,
  borderRadius: 12,
  backgroundColor: colors.palette.water100,
})

const $error: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.error })

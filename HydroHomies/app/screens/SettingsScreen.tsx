import { FC, useState } from "react"
import { TextStyle, View, ViewStyle } from "react-native"

import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { ScreenHeader } from "@/components/ScreenHeader"
import {
  parseStatsForm,
  previewGoal,
  StatsFields,
  type StatsFormValues,
} from "@/components/StatsFields"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { useAuth, useSignedInUser } from "@/context/AuthContext"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { databaseService } from "@/services/firebase/database"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { confirmAction } from "@/utils/confirm"
import { loadString } from "@/utils/storage"

interface SettingsScreenProps extends AppStackScreenProps<"Settings"> {}

type ThemeChoice = "system" | "light" | "dark"

/** Where ThemeProvider (theme/context.tsx) saves the user's override */
const THEME_STORAGE_KEY = "ignite.themeScheme"

export const SettingsScreen: FC<SettingsScreenProps> = ({ navigation }) => {
  const { themed, theme, setThemeContextOverride } = useAppTheme()
  const { logout } = useAuth()
  const { profile, pet } = useSignedInUser()

  const s = profile.stats
  const [username, setUsername] = useState(profile.username)
  const [stats, setStats] = useState<StatsFormValues>({
    sex: s?.sex ?? "other",
    age: String(s?.age ?? 25),
    height: String(s?.height ?? 170),
    weight: String(s?.weight ?? 70),
    activityLevel: s?.activityLevel ?? "moderate",
  })
  const [petName, setPetName] = useState(pet?.name ?? "")
  const [status, setStatus] = useState<{ text: string; isError: boolean } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [themeChoice, setThemeChoice] = useState<ThemeChoice>(savedThemeChoice)

  const goal = previewGoal(stats)
  const currentGoal = s?.dailyWaterGoal ?? 0

  async function save() {
    setStatus(null)
    const name = username.trim()
    if (!name) return setStatus({ text: "Enter a username.", isError: true })
    const parsed = parseStatsForm(stats)
    if ("error" in parsed) return setStatus({ text: parsed.error, isError: true })
    if (pet && !petName.trim()) return setStatus({ text: "Your pet needs a name.", isError: true })

    setIsSaving(true)
    try {
      await databaseService.saveProfile(profile.uid, {
        email: profile.email,
        username: name,
        stats: parsed.stats,
      })
      if (pet && petName.trim() !== pet.name) await databaseService.renamePet(profile.uid, petName)
      setStatus({ text: "Saved ✓", isError: false })
    } catch (e: any) {
      setStatus({ text: e?.message ?? "Couldn't save. Try again.", isError: true })
    } finally {
      setIsSaving(false)
    }
  }

  function chooseTheme(choice: ThemeChoice) {
    setThemeChoice(choice)
    setThemeContextOverride(choice === "system" ? undefined : choice)
  }

  return (
    <Screen
      preset="scroll"
      contentContainerStyle={themed($container)}
      safeAreaEdges={["top", "bottom"]}
    >
      <ScreenHeader title="⚙️ Settings" onBack={() => navigation.goBack()} />

      <View style={themed($card)}>
        <Text preset="subheading" text="You" />
        <TextField label="Username" value={username} onChangeText={setUsername} maxLength={24} />
        <StatsFields values={stats} onChange={setStats} />
        {goal !== null && (
          <View style={themed($goalBox)}>
            <Text size="sm" style={$darkText} text="Daily goal" />
            <Text preset="heading" style={$darkText} text={`${(goal / 1000).toFixed(2)} L`} />
            {goal !== currentGoal && currentGoal > 0 && (
              <Text
                size="xs"
                style={$darkText}
                text={`Currently ${(currentGoal / 1000).toFixed(2)} L. Saving updates it.`}
              />
            )}
          </View>
        )}
      </View>

      {pet && (
        <View style={themed($card)}>
          <Text preset="subheading" text="Your pet" />
          <TextField label="Name" value={petName} onChangeText={setPetName} maxLength={20} />
        </View>
      )}

      <Button
        text={isSaving ? "Saving…" : "Save changes"}
        preset="reversed"
        onPress={save}
        disabled={isSaving}
      />
      {status && (
        <Text
          size="sm"
          text={status.text}
          style={{ color: status.isError ? theme.colors.error : theme.colors.palette.success500 }}
        />
      )}

      <View style={themed($card)}>
        <Text preset="subheading" text="Appearance" />
        <View style={themed($row)}>
          {(["system", "light", "dark"] as const).map((c) => (
            <Button
              key={c}
              text={c === "system" ? "Auto" : c === "light" ? "Light" : "Dark"}
              preset={themeChoice === c ? "reversed" : "default"}
              style={$flex}
              onPress={() => chooseTheme(c)}
              accessibilityState={{ selected: themeChoice === c }}
            />
          ))}
        </View>
      </View>

      <View style={themed($card)}>
        <Text preset="subheading" text="Account" />
        <Text size="sm" style={themed($dim)} text={profile.email} />
        <Button
          text="Log out"
          onPress={async () => {
            if (await confirmAction("Log out?", "You can log back in any time.", "Log out")) {
              logout()
            }
          }}
        />
      </View>
    </Screen>
  )
}

/** The saved theme override ("light" or "dark"), or "system" if the user never picked one */
function savedThemeChoice(): ThemeChoice {
  const stored = loadString(THEME_STORAGE_KEY)
  return stored === "light" || stored === "dark" ? stored : "system"
}

const $flex: ViewStyle = { flex: 1 }
// The goal box is light blue in both themes
const $darkText: TextStyle = { color: "#00439C", textAlign: "center" }

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.lg,
  gap: spacing.lg,
})

const $card: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  padding: spacing.lg,
  gap: spacing.sm,
})

const $goalBox: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  alignItems: "center",
  padding: spacing.md,
  borderRadius: 12,
  backgroundColor: colors.palette.water100,
  marginTop: spacing.xs,
})

const $row: ThemedStyle<ViewStyle> = ({ spacing }) => ({ flexDirection: "row", gap: spacing.sm })

const $dim: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.textDim })

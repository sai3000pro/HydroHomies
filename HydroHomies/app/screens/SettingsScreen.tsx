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
import { authService, describeAuthError } from "@/services/firebase/auth"
import { databaseService } from "@/services/firebase/database"
import { cancelReminders } from "@/services/reminders"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { confirmAction } from "@/utils/confirm"
import { toDateKey } from "@/utils/dateKey"
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
  const [showDelete, setShowDelete] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [deleteError, setDeleteError] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

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
      if (name !== profile.username) {
        await databaseService.propagateDisplayName(profile, name, toDateKey())
      }
      if (pet && petName.trim() !== pet.name) {
        await databaseService.renamePet(profile.uid, petName)
        await databaseService.propagatePetName(profile.uid, petName, toDateKey()).catch(() => {})
      }
      setStatus({ text: "Saved ✓", isError: false })
    } catch (e: any) {
      setStatus({ text: describeAuthError(e), isError: true })
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteAccount() {
    setDeleteError("")
    if (!deletePassword) return setDeleteError("Enter your password to confirm.")
    const ok = await confirmAction(
      "Delete your account?",
      "This permanently deletes your profile, pet, drinks, photos and friendships. It can't be undone.",
      "Delete forever",
    )
    if (!ok) return
    setIsDeleting(true)
    try {
      // Check the password first, so a typo doesn't leave the data half-deleted
      await authService.reauthenticate(deletePassword)
      await cancelReminders().catch(() => {})
      await databaseService.deleteAllUserData(profile)
      // Signs out automatically; the navigator returns to Login
      await authService.deleteCurrentUser()
    } catch (e: any) {
      setDeleteError(describeAuthError(e))
      setIsDeleting(false)
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
              logout().catch((e) => setStatus({ text: describeAuthError(e), isError: true }))
            }
          }}
        />
      </View>

      <View style={themed($card)}>
        <Text preset="subheading" text="Delete account" />
        {!showDelete ? (
          <Button
            text="Delete my account"
            textStyle={{ color: theme.colors.error }}
            onPress={() => setShowDelete(true)}
          />
        ) : (
          <>
            <Text
              size="sm"
              style={themed($dim)}
              text="Permanently deletes your profile, pet, drinks, photos, reactions and friendships."
            />
            <TextField
              label="Your password"
              value={deletePassword}
              onChangeText={setDeletePassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
            />
            <Button
              text={isDeleting ? "Deleting…" : "Delete forever"}
              onPress={deleteAccount}
              disabled={isDeleting}
              style={{ borderColor: theme.colors.error }}
              textStyle={{ color: theme.colors.error }}
            />
            <Button text="Cancel" onPress={() => setShowDelete(false)} disabled={isDeleting} />
            {!!deleteError && (
              <Text size="sm" style={{ color: theme.colors.error }} text={deleteError} />
            )}
          </>
        )}
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

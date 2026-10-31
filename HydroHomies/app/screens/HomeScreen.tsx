import { FC, useEffect, useState } from "react"
import { TextStyle, View, ViewStyle } from "react-native"

import { ActionTile } from "@/components/ActionTile"
import { Button } from "@/components/Button"
import { Pet } from "@/components/Pet"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useAuth, useSignedInUser } from "@/context/AuthContext"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import {
  databaseService,
  type DailySummary,
  type HydrationEntry,
} from "@/services/firebase/database"
import { syncReminders } from "@/services/reminders"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { confirmAction } from "@/utils/confirm"
import { calculateProgress, shouldFlagOverdrinking } from "@/utils/waterGoalCalculator"

interface HomeScreenProps extends AppStackScreenProps<"Home"> {}

const SOURCE_LABEL: Record<HydrationEntry["source"], string> = {
  "ai": "AI estimate",
  "on-device": "On-device model",
  "manual": "Entered by hand",
}

export const HomeScreen: FC<HomeScreenProps> = ({ navigation }) => {
  const { themed, theme } = useAppTheme()
  const { logout } = useAuth()
  const { profile, pet } = useSignedInUser()

  const [summary, setSummary] = useState<DailySummary | null>(null)
  const [summaryLoaded, setSummaryLoaded] = useState(false)
  const [entries, setEntries] = useState<HydrationEntry[]>([])
  const [loadError, setLoadError] = useState("")

  useEffect(() => {
    const onError = (e: Error) => setLoadError(e.message)
    const unsubSummary = databaseService.subscribeToDailySummary(
      profile.uid,
      (s) => {
        setSummary(s)
        setSummaryLoaded(true)
      },
      onError,
    )
    const unsubEntries = databaseService.subscribeToTodayEntries(profile.uid, setEntries, onError)
    return () => {
      unsubSummary()
      unsubEntries()
    }
  }, [profile.uid])

  const dailyGoal = profile.stats?.dailyWaterGoal ?? 2500
  const todayIntake = summary?.totalMl ?? 0
  const goalReached = todayIntake >= dailyGoal

  // Refresh scheduled reminders on open, and drop today's once the goal is reached
  useEffect(() => {
    if (!summaryLoaded) return
    syncReminders(pet?.name ?? "", goalReached).catch((e) =>
      console.warn("Couldn't schedule reminders:", e?.message),
    )
  }, [summaryLoaded, goalReached, pet?.name])
  const progress = calculateProgress(todayIntake, dailyGoal)
  const remaining = Math.max(0, dailyGoal - todayIntake)
  const { palette } = theme.colors

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      <View style={themed($header)}>
        <Text preset="heading" text="HydroHype 💧" style={$title} numberOfLines={1} />
        <Text style={themed($dim)} text={`Welcome back, ${profile.username || "friend"}!`} />
      </View>

      {pet && (
        <View style={themed($card)}>
          <Pet pet={pet} size="medium" />
        </View>
      )}

      <View style={themed($card)}>
        <Text preset="subheading" text="Today's Progress" style={themed($sectionTitle)} />

        {shouldFlagOverdrinking(todayIntake, dailyGoal) && (
          <View style={themed($warningBanner)}>
            <Text
              text="⚠️ That's over 150% of your goal. Too much water at once can be harmful."
              style={{ color: palette.warning900 }}
            />
          </View>
        )}

        <View style={$centered}>
          <Text preset="heading" text={`${(todayIntake / 1000).toFixed(2)} L`} />
          <Text size="sm" text={`of ${(dailyGoal / 1000).toFixed(2)} L goal`} />
        </View>
        <View
          style={themed($progressTrack)}
          accessible
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: progress }}
        >
          <View
            style={[
              $progressFill,
              {
                width: `${progress}%`,
                backgroundColor: progress >= 100 ? palette.success500 : palette.water500,
              },
            ]}
          />
        </View>
        <Text
          size="sm"
          text={remaining > 0 ? `${remaining} ml to go` : "Goal reached! 🎉"}
          style={themed($dimCentered)}
        />
        <Button
          text="💧 Log Water"
          preset="reversed"
          style={themed($logButton)}
          onPress={() => navigation.navigate("ScanBottle")}
        />
      </View>

      <View style={themed($tiles)}>
        <ActionTile
          emoji="🏆"
          label="Leaderboard"
          wide
          onPress={() => navigation.navigate("Leaderboard")}
        />
        <ActionTile emoji="👥" label="Friends" onPress={() => navigation.navigate("Friends")} />
        <ActionTile emoji="📊" label="Stats" onPress={() => navigation.navigate("Stats")} />
        <ActionTile
          emoji="📷"
          label="My profile"
          onPress={() =>
            navigation.navigate("FriendPet", {
              userId: profile.uid,
              displayName: profile.username,
            })
          }
        />
        <ActionTile emoji="⏰" label="Reminders" onPress={() => navigation.navigate("Reminders")} />
      </View>

      {!!loadError && (
        <Text size="sm" text={`Couldn't load today's data: ${loadError}`} style={themed($error)} />
      )}

      {entries.length > 0 && (
        <View style={themed($card)}>
          <Text preset="subheading" text="Today's Drinks" style={themed($sectionTitle)} />
          {entries.map((entry, i) => (
            <View key={entry.id} style={[themed($entryRow), i === entries.length - 1 && $lastRow]}>
              <View>
                <Text preset="bold" text={`${entry.amount} ml`} />
                <Text size="xs" text={SOURCE_LABEL[entry.source]} style={themed($dim)} />
              </View>
              <Text
                size="xs"
                text={
                  entry.timestamp
                    ? entry.timestamp.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
                    : "Saving…"
                }
                style={themed($dim)}
              />
            </View>
          ))}
        </View>
      )}

      <Button
        text="Log out"
        onPress={async () => {
          if (await confirmAction("Log out?", "You can log back in any time.", "Log out")) logout()
        }}
        style={themed($logout)}
        textStyle={themed($logoutText)}
      />
    </Screen>
  )
}

const $centered: ViewStyle = { alignItems: "center" }
const $title: TextStyle = { fontSize: 34, lineHeight: 42 }
const $lastRow: ViewStyle = { borderBottomWidth: 0 }

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.lg,
  gap: spacing.lg,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({ gap: spacing.xxs })

const $logout: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  minHeight: 44,
  borderWidth: 0,
  backgroundColor: "transparent",
  marginBottom: spacing.lg,
})

const $logoutText: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.textDim })

const $logButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({ marginTop: spacing.md })

const $tiles: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.md,
})

const $card: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  padding: spacing.lg,
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({ marginBottom: spacing.md })

const $warningBanner: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.warning100,
  padding: spacing.md,
  borderRadius: 8,
  marginBottom: spacing.md,
})

const $progressTrack: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  height: 24,
  backgroundColor: colors.palette.neutral300,
  borderRadius: 12,
  overflow: "hidden",
  marginVertical: spacing.sm,
})

const $progressFill: ViewStyle = { height: "100%", borderRadius: 12 }

const $dim: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.textDim })

const $dimCentered: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  textAlign: "center",
})

const $error: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.error })

const $entryRow: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: spacing.sm,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
})

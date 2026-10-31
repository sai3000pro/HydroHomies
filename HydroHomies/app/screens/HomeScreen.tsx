import { FC, useCallback, useEffect, useState } from "react"
import { TextStyle, View, ViewStyle } from "react-native"

import { ActionTile } from "@/components/ActionTile"
import { Button } from "@/components/Button"
import { DrinkRow } from "@/components/DrinkRow"
import { Pet } from "@/components/Pet"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useSignedInUser } from "@/context/AuthContext"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import {
  databaseService,
  type DailySummary,
  type HydrationEntry,
} from "@/services/firebase/database"
import { syncReminders } from "@/services/reminders"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { currentStreak, fillDays, HISTORY_DAYS } from "@/utils/hydrationStats"
import { useToday } from "@/utils/useToday"
import { calculateProgress, shouldFlagOverdrinking } from "@/utils/waterGoalCalculator"

interface HomeScreenProps extends AppStackScreenProps<"Home"> {}

export const HomeScreen: FC<HomeScreenProps> = ({ navigation }) => {
  const { themed, theme } = useAppTheme()
  const { profile, pet } = useSignedInUser()

  const [summary, setSummary] = useState<DailySummary | null>(null)
  const [summaryLoaded, setSummaryLoaded] = useState(false)
  const [entries, setEntries] = useState<HydrationEntry[]>([])
  const [loadError, setLoadError] = useState("")
  const today = useToday()

  // Resubscribes at midnight so "today" really is today
  useEffect(() => {
    setSummary(null)
    setSummaryLoaded(false)
    setEntries([])
    const onError = (e: Error) => setLoadError(e.message)
    const unsubSummary = databaseService.subscribeToDailySummary(
      profile.uid,
      (s) => {
        setSummary(s)
        setSummaryLoaded(true)
        setLoadError("")
      },
      onError,
      today,
    )
    const unsubEntries = databaseService.subscribeToTodayEntries(
      profile.uid,
      setEntries,
      onError,
      today,
    )
    return () => {
      unsubSummary()
      unsubEntries()
    }
  }, [profile.uid, today])

  const dailyGoal = profile.stats?.dailyWaterGoal ?? 2500
  const todayIntake = summary?.totalMl ?? 0
  const goalReached = todayIntake >= dailyGoal

  // Refresh scheduled reminders on open, and drop today's once the goal is reached
  useEffect(() => {
    if (!summaryLoaded) return
    syncReminders(profile.uid, pet?.name ?? "", goalReached).catch((e) =>
      console.warn("Couldn't schedule reminders:", e?.message),
    )
  }, [summaryLoaded, goalReached, pet?.name, profile.uid])
  const progress = calculateProgress(todayIntake, dailyGoal)
  const remaining = Math.max(0, dailyGoal - todayIntake)
  const { palette } = theme.colors

  // Streak: recomputed when today's total changes and whenever Home comes back into view
  const [streak, setStreak] = useState(0)
  const loadStreak = useCallback(() => {
    let cancelled = false
    databaseService
      .getSummaryHistory(profile.uid, HISTORY_DAYS, today)
      .then((h) => {
        if (!cancelled) setStreak(currentStreak(fillDays(h, today, HISTORY_DAYS, dailyGoal)))
      })
      .catch((e) => console.warn("Couldn't load streak:", e?.message))
    return () => {
      cancelled = true
    }
  }, [profile.uid, dailyGoal, today])
  useEffect(
    () =>
      navigation.addListener("focus", () => {
        loadStreak()
      }),
    [navigation, loadStreak],
  )
  useEffect(loadStreak, [loadStreak, todayIntake])

  return (
    <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
      <View style={themed($header)}>
        <Text preset="heading" text="HydroHype 💧" style={$title} numberOfLines={1} />
        <View style={themed($welcomeRow)}>
          <Text
            style={[themed($dim), $flexShrink]}
            numberOfLines={1}
            text={`Welcome back, ${profile.username || "friend"}!`}
          />
          {streak > 0 && (
            <View
              style={themed($streakChip)}
              accessible
              accessibilityLabel={`${streak} day streak`}
            >
              <Text size="xs" preset="bold" style={$streakText} text={`🔥 ${streak}-day streak`} />
            </View>
          )}
        </View>
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
        <ActionTile
          emoji="⚙️"
          label="Settings"
          wide
          onPress={() => navigation.navigate("Settings")}
        />
      </View>

      {!!loadError && (
        <Text size="sm" text={`Couldn't load today's data: ${loadError}`} style={themed($error)} />
      )}

      {entries.length > 0 && (
        <View style={themed($card)}>
          <Text preset="subheading" text="Today's Drinks" style={themed($sectionTitle)} />
          {entries.map((entry, i) => (
            <DrinkRow key={entry.id} entry={entry} isLast={i === entries.length - 1} />
          ))}
        </View>
      )}
      <Text
        style={themed($historyLink)}
        onPress={() => navigation.navigate("History")}
        accessibilityRole="button"
        text="See all drinks →"
      />
    </Screen>
  )
}

const $centered: ViewStyle = { alignItems: "center" }
const $title: TextStyle = { fontSize: 34, lineHeight: 42 }
const $flexShrink: ViewStyle = { flexShrink: 1 }
// The chip is light orange in both themes
const $streakText: TextStyle = { color: "#6B4A00" }

const $historyLink: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.water500,
  textAlign: "center",
})

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.lg,
  paddingBottom: spacing.xxl,
  gap: spacing.lg,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({ gap: spacing.xxs })

const $welcomeRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: spacing.sm,
})

const $streakChip: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.accent100,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xxxs,
  borderRadius: 12,
})

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

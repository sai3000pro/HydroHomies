import { FC, useCallback, useEffect, useState } from "react"
import { Pressable, TextStyle, View, ViewStyle } from "react-native"

import { ActionTile } from "@/components/ActionTile"
import { Button } from "@/components/Button"
import { Pet } from "@/components/Pet"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useSignedInUser } from "@/context/AuthContext"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import {
  databaseService,
  UNDO_WINDOW_MS,
  type DailySummary,
  type HydrationEntry,
} from "@/services/firebase/database"
import { syncReminders } from "@/services/reminders"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { confirmAction, notify } from "@/utils/confirm"
import { toDateKey } from "@/utils/dateKey"
import { currentStreak, fillDays, HISTORY_DAYS } from "@/utils/hydrationStats"
import { xpForWater } from "@/utils/petEvolution"
import { calculateProgress, shouldFlagOverdrinking } from "@/utils/waterGoalCalculator"

interface HomeScreenProps extends AppStackScreenProps<"Home"> {}

const SOURCE_LABEL: Record<HydrationEntry["source"], string> = {
  "ai": "AI",
  "on-device": "On-device",
  "manual": "By hand",
}

export const HomeScreen: FC<HomeScreenProps> = ({ navigation }) => {
  const { themed, theme } = useAppTheme()
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

  // Streak: recomputed when today's total changes and whenever Home comes back into view
  const [streak, setStreak] = useState(0)
  const loadStreak = useCallback(() => {
    databaseService
      .getSummaryHistory(profile.uid, HISTORY_DAYS)
      .then((h) => setStreak(currentStreak(fillDays(h, toDateKey(), HISTORY_DAYS, dailyGoal))))
      .catch(() => {})
  }, [profile.uid, dailyGoal])
  useEffect(() => navigation.addListener("focus", loadStreak), [navigation, loadStreak])
  useEffect(loadStreak, [loadStreak, todayIntake])

  async function undo(entry: HydrationEntry) {
    const ok = await confirmAction(
      `Delete this ${entry.amount} ml drink?`,
      pet
        ? `It comes off today's total and ${pet.name} loses the ${xpForWater(entry.amount)} XP it earned.`
        : "It comes off today's total.",
      "Delete",
    )
    if (!ok) return
    databaseService
      .deleteDrink(profile, entry.id)
      .catch((e) => notify("Couldn't delete", e?.message ?? String(e)))
  }

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
          {entries.map((entry, i) => {
            const canUndo =
              !!entry.timestamp && Date.now() - entry.timestamp.getTime() < UNDO_WINDOW_MS
            return (
              <View
                key={entry.id}
                style={[themed($entryRow), i === entries.length - 1 && $lastRow]}
              >
                <View style={$flexShrink}>
                  <Text preset="bold" text={`${entry.amount} ml`} />
                  <Text
                    size="xs"
                    style={themed($dim)}
                    text={`${
                      entry.timestamp
                        ? entry.timestamp.toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : "Saving…"
                    } · ${SOURCE_LABEL[entry.source]}`}
                    numberOfLines={1}
                  />
                </View>
                {canUndo && (
                  <Pressable
                    onPress={() => undo(entry)}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${entry.amount} millilitre drink`}
                    hitSlop={8}
                    style={({ pressed }) => [themed($undo), pressed && $pressed]}
                  >
                    <Text size="xs" text="Delete" style={themed($undoText)} />
                  </Pressable>
                )}
              </View>
            )
          })}
        </View>
      )}
    </Screen>
  )
}

const $centered: ViewStyle = { alignItems: "center" }
const $title: TextStyle = { fontSize: 34, lineHeight: 42 }
const $lastRow: ViewStyle = { borderBottomWidth: 0 }
const $flexShrink: ViewStyle = { flexShrink: 1 }
const $pressed: ViewStyle = { opacity: 0.6 }
// The chip is light orange in both themes
const $streakText: TextStyle = { color: "#6B4A00" }

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

const $undo: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xxs,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: colors.palette.neutral300,
})

const $undoText: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.error })

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

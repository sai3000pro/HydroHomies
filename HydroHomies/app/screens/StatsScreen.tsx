import { FC, useCallback, useEffect, useMemo, useState } from "react"
import { ActivityIndicator, TextStyle, View, ViewStyle } from "react-native"

import { Screen } from "@/components/Screen"
import { ScreenHeader } from "@/components/ScreenHeader"
import { Text } from "@/components/Text"
import { useSignedInUser } from "@/context/AuthContext"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { databaseService, type DailySummary } from "@/services/firebase/database"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { fromDateKey, toDateKey } from "@/utils/dateKey"
import {
  bestStreak,
  computeAchievements,
  currentStreak,
  fillDays,
  HISTORY_DAYS,
  summarizeWeek,
  type DayStat,
} from "@/utils/hydrationStats"
import { useFriends } from "@/utils/useFriends"

interface StatsScreenProps extends AppStackScreenProps<"Stats"> {}

const CHART_HEIGHT = 120

const litres = (ml: number) => `${(ml / 1000).toFixed(2)} L`
const weekday = (key: string) => fromDateKey(key).toLocaleDateString([], { weekday: "short" })

export const StatsScreen: FC<StatsScreenProps> = ({ navigation }) => {
  const { themed, theme } = useAppTheme()
  const { profile, pet } = useSignedInUser()
  const { friends } = useFriends(profile.uid)

  const [history, setHistory] = useState<DailySummary[] | null>(null)
  const [error, setError] = useState("")

  const loadHistory = useCallback(() => {
    databaseService
      .getSummaryHistory(profile.uid, HISTORY_DAYS)
      .then((h) => {
        setHistory(h)
        setError("")
      })
      .catch((e) => setError(e?.message ?? "Couldn't load your history."))
  }, [profile.uid])

  // Loads on first view and again whenever the screen comes back into view
  useEffect(() => navigation.addListener("focus", loadHistory), [navigation, loadHistory])

  const goalMl = profile.stats?.dailyWaterGoal ?? 2500
  const days = useMemo(
    () => (history ? fillDays(history, toDateKey(), HISTORY_DAYS, goalMl) : []),
    [history, goalMl],
  )
  const week = useMemo(() => summarizeWeek(days), [days])
  const achievements = useMemo(
    () =>
      computeAchievements({
        days,
        petExperience: pet?.experience ?? 0,
        friendCount: friends?.length ?? 0,
      }),
    [days, pet?.experience, friends?.length],
  )
  const unlocked = achievements.filter((a) => a.unlocked).length
  const chartMax = Math.max(goalMl, ...week.days.map((d) => d.totalMl), 1)
  const { palette } = theme.colors

  return (
    <Screen
      preset="scroll"
      contentContainerStyle={themed($container)}
      safeAreaEdges={["top", "bottom"]}
    >
      <ScreenHeader title="📊 Stats" onBack={() => navigation.goBack()} />

      {!!error && <Text style={{ color: theme.colors.error }} text={error} />}

      {history === null && !error ? (
        <ActivityIndicator size="large" color={theme.colors.tint} />
      ) : (
        <>
          <View style={themed($statsRow)}>
            <StatTile emoji="🔥" value={`${currentStreak(days)}`} label="day streak" />
            <StatTile emoji="🏆" value={`${bestStreak(days)}`} label="best streak" />
            <StatTile emoji="✅" value={`${week.daysMet}/7`} label="goals hit" />
          </View>

          <View style={themed($card)}>
            <Text preset="subheading" text="Last 7 days" />
            <View style={themed($chart)}>
              <View
                style={[themed($goalLine), { bottom: (goalMl / chartMax) * CHART_HEIGHT + 16 }]}
              />
              {week.days.map((d) => (
                <DayBar
                  key={d.dateKey}
                  day={d}
                  max={chartMax}
                  isToday={d.dateKey === toDateKey()}
                />
              ))}
            </View>
            <Text
              size="xs"
              style={themed($dim)}
              text={`Dashed line: your ${litres(goalMl)} goal`}
            />
            <View style={themed($weekNumbers)}>
              <Text text={`Total: ${litres(week.totalMl)}`} />
              <Text text={`Daily average: ${litres(week.averageMl)}`} />
              <Text
                text={
                  week.bestDay
                    ? `Best day: ${weekday(week.bestDay.dateKey)} (${litres(week.bestDay.totalMl)})`
                    : "Best day: none yet"
                }
              />
            </View>
          </View>

          <View style={themed($card)}>
            <Text preset="subheading" text={`Achievements (${unlocked}/${achievements.length})`} />
            {achievements.map((a) => (
              <View key={a.id} style={[themed($achievement), !a.unlocked && $locked]}>
                <Text text={a.emoji} style={$achievementEmoji} />
                <View style={$flex}>
                  <Text preset="bold" text={a.title} />
                  <Text size="xs" style={themed($dim)} text={a.description} />
                  {!a.unlocked && (
                    <View style={themed($progressTrack)}>
                      <View
                        style={[
                          $progressFill,
                          {
                            width: `${Math.round(a.progress * 100)}%`,
                            backgroundColor: palette.water500,
                          },
                        ]}
                      />
                    </View>
                  )}
                </View>
                {a.unlocked && <Text text="✓" style={{ color: palette.success500 }} />}
              </View>
            ))}
            <Text
              size="xs"
              style={themed($dim)}
              text={`Streaks count the last ${HISTORY_DAYS} days. Lifetime litres come from your pet's XP.`}
            />
          </View>
        </>
      )}
    </Screen>
  )
}

const StatTile: FC<{ emoji: string; value: string; label: string }> = ({ emoji, value, label }) => {
  const { themed } = useAppTheme()
  return (
    <View style={themed($tile)}>
      <Text text={emoji} />
      <Text preset="heading" text={value} />
      <Text size="xxs" style={themed($dimCentered)} text={label} numberOfLines={1} />
    </View>
  )
}

const DayBar: FC<{ day: DayStat; max: number; isToday: boolean }> = ({ day, max, isToday }) => {
  const { themed, theme } = useAppTheme()
  const { palette } = theme.colors
  // Empty days get no bar; any water gets at least a visible sliver
  const height = day.totalMl > 0 ? Math.max(4, (day.totalMl / max) * CHART_HEIGHT) : 0
  return (
    <View
      style={$barColumn}
      accessible
      accessibilityLabel={`${weekday(day.dateKey)}: ${day.totalMl} millilitres${day.met ? ", goal reached" : ""}`}
    >
      <View
        style={[$bar, { height, backgroundColor: day.met ? palette.success500 : palette.water500 }]}
      />
      <Text
        size="xxs"
        preset={isToday ? "bold" : "default"}
        style={themed($dim)}
        text={weekday(day.dateKey)}
      />
    </View>
  )
}

const $flex: ViewStyle = { flex: 1 }
const $locked: ViewStyle = { opacity: 0.6 }
const $achievementEmoji: TextStyle = {
  fontSize: 28,
  lineHeight: 36,
  width: 40,
  textAlign: "center",
}
const $barColumn: ViewStyle = { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 2 }
const $bar: ViewStyle = { width: "60%", borderRadius: 6 }
const $progressFill: ViewStyle = { height: "100%", borderRadius: 3 }

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

const $statsRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
})

const $tile: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flex: 1,
  alignItems: "center",
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.xs,
})

const $chart: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "flex-end",
  height: CHART_HEIGHT + 16,
  marginTop: spacing.sm,
})

const $goalLine: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: "absolute",
  left: 0,
  right: 0,
  borderTopWidth: 1,
  borderStyle: "dashed",
  borderColor: colors.textDim,
})

const $weekNumbers: ThemedStyle<ViewStyle> = ({ spacing }) => ({ gap: spacing.xxs })

const $achievement: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  paddingVertical: spacing.xs,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
})

const $progressTrack: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  height: 6,
  backgroundColor: colors.palette.neutral300,
  borderRadius: 3,
  overflow: "hidden",
  marginTop: spacing.xxs,
})

const $dim: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.textDim })

const $dimCentered: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.textDim,
  textAlign: "center",
})

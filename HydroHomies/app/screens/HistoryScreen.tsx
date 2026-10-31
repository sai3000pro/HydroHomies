import { FC, useEffect, useState } from "react"
import { ActivityIndicator, TextStyle, View, ViewStyle } from "react-native"

import { DrinkRow } from "@/components/DrinkRow"
import { Screen } from "@/components/Screen"
import { ScreenHeader } from "@/components/ScreenHeader"
import { Text } from "@/components/Text"
import { useSignedInUser } from "@/context/AuthContext"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { databaseService, type HydrationEntry } from "@/services/firebase/database"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { fromDateKey, shiftDateKey } from "@/utils/dateKey"
import { useToday } from "@/utils/useToday"

interface HistoryScreenProps extends AppStackScreenProps<"History"> {}

/** Your last 30 drinks, grouped by day. Drinks from the last 24 hours can be deleted here. */
export const HistoryScreen: FC<HistoryScreenProps> = ({ navigation }) => {
  const { themed, theme } = useAppTheme()
  const { profile } = useSignedInUser()
  const today = useToday()
  const [entries, setEntries] = useState<HydrationEntry[] | null>(null)
  const [error, setError] = useState("")

  useEffect(
    () =>
      databaseService.subscribeToRecentEntries(
        profile.uid,
        (e) => {
          setEntries(e)
          setError("")
        },
        (e) => setError(e.message),
      ),
    [profile.uid],
  )

  const days = groupByDay(entries ?? [])
  const dayLabel = (key: string) =>
    key === today
      ? "Today"
      : key === shiftDateKey(today, -1)
        ? "Yesterday"
        : key
          ? fromDateKey(key).toLocaleDateString([], {
              weekday: "long",
              month: "short",
              day: "numeric",
            })
          : "Older"

  return (
    <Screen
      preset="scroll"
      contentContainerStyle={themed($container)}
      safeAreaEdges={["top", "bottom"]}
    >
      <ScreenHeader
        title="🗒️ Drinks"
        subtitle="Your last 30. Drinks from the last 24 hours can be deleted."
        onBack={() => navigation.goBack()}
      />

      {!!error && <Text style={{ color: theme.colors.error }} text={error} />}

      {entries === null && !error ? (
        <ActivityIndicator size="large" color={theme.colors.tint} />
      ) : entries?.length === 0 ? (
        <Text style={themed($dim)} text="No drinks logged yet." />
      ) : (
        days.map(([key, list]) => (
          <View key={key || "older"} style={themed($card)}>
            <View style={$rowBetween}>
              <Text preset="subheading" text={dayLabel(key)} />
              <Text
                size="sm"
                style={themed($dim)}
                text={`${(list.reduce((s, e) => s + e.amount, 0) / 1000).toFixed(2)} L`}
              />
            </View>
            {list.map((e, i) => (
              <DrinkRow key={e.id} entry={e} isLast={i === list.length - 1} />
            ))}
          </View>
        ))
      )}
    </Screen>
  )
}

/** Keeps the newest-first order; hackathon-era entries without a date go under "Older" */
function groupByDay(entries: HydrationEntry[]): [string, HydrationEntry[]][] {
  const map = new Map<string, HydrationEntry[]>()
  for (const e of entries) {
    const list = map.get(e.dateKey) ?? []
    list.push(e)
    map.set(e.dateKey, list)
  }
  return [...map.entries()]
}

const $rowBetween: ViewStyle = {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.lg,
  gap: spacing.lg,
})

const $card: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  padding: spacing.lg,
  gap: spacing.xxs,
})

const $dim: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.textDim })

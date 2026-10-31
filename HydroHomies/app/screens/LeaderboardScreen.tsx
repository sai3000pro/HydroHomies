import { FC, useEffect, useState } from "react"
import { ActivityIndicator, FlatList, Pressable, TextStyle, View, ViewStyle } from "react-native"

import { Button } from "@/components/Button"
import { Pet } from "@/components/Pet"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useSignedInUser } from "@/context/AuthContext"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { databaseService, type DailySummary } from "@/services/firebase/database"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { levelForXp } from "@/utils/petEvolution"
import { shouldFlagOverdrinking } from "@/utils/waterGoalCalculator"

interface LeaderboardScreenProps extends AppStackScreenProps<"Leaderboard"> {}

const MEDALS = ["🥇", "🥈", "🥉"]

export const LeaderboardScreen: FC<LeaderboardScreenProps> = ({ navigation }) => {
  const { themed, theme } = useAppTheme()
  const { profile } = useSignedInUser()

  const [rows, setRows] = useState<DailySummary[] | null>(null)
  const [error, setError] = useState("")

  useEffect(
    () =>
      databaseService.subscribeToLeaderboard(
        (r) => {
          setRows(r)
          setError("")
        },
        (e) => setError(e.message),
      ),
    [],
  )

  const myRank = rows ? rows.findIndex((r) => r.userId === profile.uid) + 1 : 0

  const renderItem = ({ item, index }: { item: DailySummary; index: number }) => {
    const isMe = item.userId === profile.uid
    const pct = item.goalMl > 0 ? Math.round((item.totalMl / item.goalMl) * 100) : 0
    const overdrinking = shouldFlagOverdrinking(item.totalMl, item.goalMl)
    return (
      <Pressable
        style={[themed($row), isMe && { borderColor: theme.colors.palette.water500 }]}
        onPress={() =>
          isMe
            ? navigation.navigate("Home")
            : navigation.navigate("FriendPet", {
                userId: item.userId,
                displayName: item.displayName,
              })
        }
        accessibilityRole="button"
        accessibilityLabel={`Rank ${index + 1}, ${item.displayName}, ${item.totalMl} millilitres`}
      >
        <Text preset="bold" text={MEDALS[index] ?? `#${index + 1}`} style={$rank} />
        {item.petSpecies ? (
          <Pet
            size="small"
            pet={{
              name: item.petName ?? "",
              species: item.petSpecies,
              experience: item.petExperience,
              health: 100,
              lastFed: null,
            }}
          />
        ) : (
          <View style={$petPlaceholder} />
        )}
        <View style={$flex}>
          <Text
            preset={isMe ? "bold" : "default"}
            text={isMe ? `${item.displayName} (you)` : item.displayName}
          />
          <Text
            size="xs"
            style={themed($dim)}
            text={
              item.petName
                ? `${item.petName} · Lv ${levelForXp(item.petExperience)} · ${pct}% of goal`
                : `${pct}% of goal`
            }
          />
        </View>
        <Text
          preset="bold"
          text={`${(item.totalMl / 1000).toFixed(2)} L${overdrinking ? " 😏" : ""}`}
        />
      </Pressable>
    )
  }

  return (
    <Screen
      preset="fixed"
      contentContainerStyle={themed($container)}
      safeAreaEdges={["top", "bottom"]}
    >
      <View style={themed($header)}>
        <View style={$flex}>
          <Text preset="heading" text="🏆 Today" />
          <Text
            size="sm"
            style={themed($dim)}
            text={myRank > 0 ? `You're #${myRank}` : "Log a drink to get on the board"}
          />
        </View>
        <Button text="Close" onPress={() => navigation.goBack()} />
      </View>

      {!!error && (
        <Text size="sm" style={{ color: theme.colors.error }} text={`Couldn't load: ${error}`} />
      )}

      {rows === null && !error ? (
        <ActivityIndicator size="large" color={theme.colors.tint} />
      ) : (
        <FlatList
          data={rows ?? []}
          keyExtractor={(r) => r.userId}
          renderItem={renderItem}
          contentContainerStyle={themed($list)}
          ListEmptyComponent={<Text text="Nobody has logged water today. Be the first!" />}
          ListFooterComponent={
            <Text size="xs" style={themed($dim)} text="😏 = more than 150% of their goal today" />
          }
        />
      )}
    </Screen>
  )
}

const $flex: ViewStyle = { flex: 1 }
const $rank: TextStyle = { width: 36, textAlign: "center", fontSize: 18 }
const $petPlaceholder: ViewStyle = { width: 44, height: 44 }

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  padding: spacing.lg,
  gap: spacing.md,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
})

const $list: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.sm,
  paddingBottom: spacing.lg,
})

const $row: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  padding: spacing.sm,
  borderRadius: 12,
  borderWidth: 2,
  borderColor: "transparent",
  backgroundColor: colors.palette.neutral100,
})

const $dim: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.textDim })

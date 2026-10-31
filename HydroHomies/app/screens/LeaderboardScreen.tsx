import { FC, useEffect, useState } from "react"
import { ActivityIndicator, FlatList, Pressable, TextStyle, View, ViewStyle } from "react-native"

import { Button } from "@/components/Button"
import { Pet } from "@/components/Pet"
import { Screen } from "@/components/Screen"
import { ScreenHeader } from "@/components/ScreenHeader"
import { Text } from "@/components/Text"
import { useSignedInUser } from "@/context/AuthContext"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { databaseService, type DailySummary } from "@/services/firebase/database"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { levelForXp } from "@/utils/petEvolution"
import { useFriends } from "@/utils/useFriends"
import { shouldFlagOverdrinking } from "@/utils/waterGoalCalculator"

interface LeaderboardScreenProps extends AppStackScreenProps<"Leaderboard"> {}

const MEDALS = ["🥇", "🥈", "🥉"]

export const LeaderboardScreen: FC<LeaderboardScreenProps> = ({ navigation }) => {
  const { themed, theme } = useAppTheme()
  const { profile } = useSignedInUser()
  const { friends } = useFriends(profile.uid)

  const [scope, setScope] = useState<"friends" | "everyone">("friends")
  const [rows, setRows] = useState<DailySummary[] | null>(null)
  const [error, setError] = useState("")

  // Re-subscribe only when the set of friend ids changes, not on every snapshot
  const friendIdsKey = friends?.map((f) => f.friendId).join(",") ?? null

  useEffect(() => {
    setRows(null)
    const onRows = (r: DailySummary[]) => {
      setRows(r)
      setError("")
    }
    const onError = (e: Error) => setError(e.message)
    if (scope === "everyone") return databaseService.subscribeToLeaderboard(onRows, onError)
    if (friendIdsKey === null) return undefined
    const ids = [profile.uid, ...(friendIdsKey ? friendIdsKey.split(",") : [])]
    return databaseService.subscribeToGroupLeaderboard(ids, onRows, onError)
  }, [scope, friendIdsKey, profile.uid])

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
              health: item.petHealth,
              lastFed: item.updatedAt,
            }}
          />
        ) : (
          <View style={$petPlaceholder} />
        )}
        <View style={$flex}>
          <Text
            preset={isMe ? "bold" : "default"}
            numberOfLines={1}
            text={isMe ? `${item.displayName} (you)` : item.displayName}
          />
          <Text
            size="xs"
            style={themed($dim)}
            numberOfLines={1}
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
      <ScreenHeader
        title="🏆 Today"
        subtitle={myRank > 0 ? `You're #${myRank}` : "Log a drink to get on the board"}
        onBack={() => navigation.goBack()}
      />

      <View style={themed($tabs)}>
        {(["friends", "everyone"] as const).map((s) => (
          <Button
            key={s}
            text={s === "friends" ? "Friends" : "Everyone"}
            preset={scope === s ? "reversed" : "default"}
            style={$flex}
            onPress={() => setScope(s)}
            accessibilityState={{ selected: scope === s }}
          />
        ))}
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
          ListEmptyComponent={
            scope === "friends" && friends?.length === 0 ? (
              <View style={themed($empty)}>
                <Text text="Add friends to compete with them here." />
                <Button text="👥 Add friends" onPress={() => navigation.navigate("Friends")} />
              </View>
            ) : (
              <Text text="Nobody has logged water today. Be the first!" />
            )
          }
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

const $tabs: ThemedStyle<ViewStyle> = ({ spacing }) => ({ flexDirection: "row", gap: spacing.sm })

const $empty: ThemedStyle<ViewStyle> = ({ spacing }) => ({ gap: spacing.md })

const $dim: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.textDim })

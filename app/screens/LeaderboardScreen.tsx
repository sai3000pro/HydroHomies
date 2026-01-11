import { FC, useEffect, useState } from "react"
import { View, ViewStyle, TextStyle, FlatList, RefreshControl, Pressable } from "react-native"
import { collection, query, where, onSnapshot, Timestamp, getDocs } from "firebase/firestore"

import { Pet } from "@/components/Pet"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { authService } from "@/services/firebase/auth"
import { db } from "@/services/firebase/config"
import { databaseService, type LeaderboardEntry, type PetState } from "@/services/firebase/database"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface LeaderboardScreenProps extends AppStackScreenProps<"Leaderboard"> {}

interface LeaderboardItem extends LeaderboardEntry {
  rank: number
  pet?: PetState
}

export const LeaderboardScreen: FC<LeaderboardScreenProps> = ({ navigation }) => {
  const { themed, theme } = useAppTheme()
  const user = authService.getCurrentUser()

  const [entries, setEntries] = useState<LeaderboardItem[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null)

  useEffect(() => {
    loadLeaderboard()
    const unsubscribe = subscribeToLeaderboard()
    return unsubscribe
  }, [])

  const subscribeToLeaderboard = () => {
    // Subscribe to all users for leaderboard
    // In production, you'd maintain a daily summary collection for better performance
    const usersRef = collection(db, "users")

    return onSnapshot(usersRef, async (snapshot) => {
      const leaderboardItems: LeaderboardItem[] = []

      // Calculate leaderboard for each user
      for (const userDoc of snapshot.docs) {
        const userData = userDoc.data()
        const userId = userData.uid

        // Get today's hydration entries
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayStart = Timestamp.fromDate(today)

        const entriesQuery = query(
          collection(db, "hydrationEntries"),
          where("userId", "==", userId),
          where("timestamp", ">=", todayStart),
        )

        // Use getDocs for one-time fetch instead of subscription
        const entriesSnapshot = await getDocs(entriesQuery)

        const hydrationEntries = entriesSnapshot.docs.map((doc) => doc.data())
        const totalHydration = hydrationEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0)

        const dailyGoal = userData.stats?.dailyWaterGoal || 2500
        const percentageOfGoal = dailyGoal > 0 ? Math.round((totalHydration / dailyGoal) * 100) : 0

        // Get pet state
        let pet: PetState | null = null
        try {
          pet = await databaseService.getPet(userId)
        } catch (error) {
          console.error("Error fetching pet:", error)
        }

        leaderboardItems.push({
          userId,
          displayName: userData.displayName || userData.email || "Anonymous",
          totalHydration,
          percentageOfGoal,
          petHealth: pet?.health || 0,
          rank: 0, // Will be set after sorting
          pet: pet || undefined,
        })
      }

      // Sort by total hydration (descending)
      leaderboardItems.sort((a, b) => b.totalHydration - a.totalHydration)

      // Assign ranks
      leaderboardItems.forEach((item, index) => {
        item.rank = index + 1
      })

      setEntries(leaderboardItems)

      // Find current user's rank
      if (user) {
        const userEntry = leaderboardItems.find((item) => item.userId === user.uid)
        if (userEntry) {
          setCurrentUserRank(userEntry.rank)
        }
      }
    })
  }

  const loadLeaderboard = async () => {
    setIsRefreshing(true)
    try {
      // The subscription will handle updates
      setIsRefreshing(false)
    } catch (error) {
      console.error("Error loading leaderboard:", error)
      setIsRefreshing(false)
    }
  }

  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardItem; index: number }) => {
    const isCurrentUser = user?.uid === item.userId
    const isTopThree = index < 3

    const handleItemPress = () => {
      navigation.navigate("FriendPet", {
        userId: item.userId,
        displayName: item.displayName,
      })
    }

    return (
      <Pressable
        style={themed([
          $leaderboardItem,
          isCurrentUser && $currentUserItem,
          isTopThree && $topThreeItem,
        ])}
        onPress={handleItemPress}
      >
        <View style={themed($rankContainer)}>
          {isTopThree ? (
            <Text preset="heading" text={getRankEmoji(item.rank)} style={themed($rankEmoji)} />
          ) : (
            <Text preset="bold" text={`#${item.rank}`} style={themed($rankText)} />
          )}
        </View>

        {item.pet && (
          <View style={themed($petContainer)}>
            <Pet pet={item.pet} size="small" />
          </View>
        )}

        <View style={themed($infoContainer)}>
          <Text
            preset={isCurrentUser ? "bold" : "default"}
            text={item.displayName}
            style={themed($nameText)}
          />
          <Text size="sm" text={`${(item.totalHydration / 1000).toFixed(1)}L today`} />
          <Text size="xs" text={`${item.percentageOfGoal}% of goal`} style={themed($goalText)} />
        </View>

        <View style={themed($statsContainer)}>
          <Text preset="bold" text={`${item.totalHydration}ml`} style={themed($hydrationText)} />
          <View style={themed($healthIndicator)}>
            <Text size="xs" text={`❤️ ${item.petHealth}%`} />
          </View>
        </View>
      </Pressable>
    )
  }

  const getRankEmoji = (rank: number): string => {
    switch (rank) {
      case 1:
        return "🥇"
      case 2:
        return "🥈"
      case 3:
        return "🥉"
      default:
        return `#${rank}`
    }
  }

  return (
    <Screen preset="fixed" contentContainerStyle={themed($screenContentContainer)}>
      <View style={themed($header)}>
        <Text preset="heading" text="🏆 Leaderboard" />
        <Text size="md" text="Today's Top Hydrators" />
        {currentUserRank && (
          <View style={themed($userRankBanner)}>
            <Text
              preset="bold"
              text={`Your Rank: #${currentUserRank}`}
              style={themed($userRankText)}
            />
          </View>
        )}
      </View>

      <FlatList
        data={entries}
        renderItem={renderLeaderboardItem}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={themed($listContent)}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={loadLeaderboard}
            tintColor={theme.colors.palette.accent500}
          />
        }
        ListEmptyComponent={
          <View style={themed($emptyContainer)}>
            <Text text="No entries yet. Be the first to log water!" />
          </View>
        }
      />

      <Pressable style={themed($close)} onPress={() => navigation.navigate("Home")}>
        <Text style={themed($X)}>X</Text>
      </Pressable>
    </Screen>
  )
}

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  padding: spacing.lg,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $userRankBanner: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.accent100,
  padding: spacing.md,
  borderRadius: 8,
  marginTop: spacing.md,
  alignItems: "center",
})

const $userRankText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.accent900,
})

const $listContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.xl,
})

const $leaderboardItem: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: colors.palette.neutral100,
  padding: spacing.md,
  borderRadius: 12,
  marginBottom: spacing.sm,
  borderWidth: 1,
  borderColor: colors.palette.neutral200,
})

const $currentUserItem: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderWidth: 2,
  borderColor: colors.palette.accent500,
  backgroundColor: colors.palette.accent50,
})

const $topThreeItem: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderColor: colors.palette.success500,
})

const $rankContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: 40,
  alignItems: "center",
  marginRight: spacing.sm,
})

const $rankEmoji: ThemedStyle<TextStyle> = () => ({
  fontSize: 24,
})

const $rankText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral600,
})

const $petContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginRight: spacing.md,
})

const $infoContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  gap: spacing.xs,
})

const $nameText: ThemedStyle<TextStyle> = () => ({})

const $goalText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral600,
})

const $statsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "flex-end",
  gap: spacing.xs,
})

const $hydrationText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.accent500,
})

const $healthIndicator: ThemedStyle<ViewStyle> = () => ({})

const $emptyContainer: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  padding: spacing.xl,
  alignItems: "center",
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
})

const $close: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: 64,
  height: 64,
  display: "flex",
  alignSelf: "center",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: spacing.xxl,
  borderColor: "white",
  borderWidth: 5,
  borderRadius: "50%",
})

const $X: ThemedStyle<TextStyle> = () => ({
  fontSize: 32,
})

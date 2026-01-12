import { FC, useEffect, useState } from "react"
import { View, ViewStyle, TextStyle, FlatList, RefreshControl, Pressable } from "react-native"
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore" // Removed onSnapshot

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

// --- HARDCODED DATA START ---
const MOCK_LEADERBOARD: LeaderboardItem[] = [
  {
    userId: "fake-1",
    displayName: "AquaMan_99",
    totalHydration: 3200,
    percentageOfGoal: 106,
    petHealth: 100,
    rank: 1,
    pet: { health: 100, stage: 2, type: "turtle", experience: 500, lastFed: null },
  },
  {
    userId: "fake-2",
    displayName: "SarahSips",
    totalHydration: 2800,
    percentageOfGoal: 95,
    petHealth: 90,
    rank: 2,
    pet: { health: 90, stage: 1, type: "turtle", experience: 300, lastFed: null },
  },
  {
    userId: "fake-3",
    displayName: "HydroHomie_X",
    totalHydration: 2100,
    percentageOfGoal: 84,
    petHealth: 85,
    rank: 3,
    pet: { health: 85, stage: 1, type: "turtle", experience: 150, lastFed: null },
  },
  {
    userId: "fake-4",
    displayName: "DehydratedDave",
    totalHydration: 500,
    percentageOfGoal: 20,
    petHealth: 30,
    rank: 5,
    pet: { health: 30, stage: 0, type: "turtle", experience: 20, lastFed: null },
  },
]
// --- HARDCODED DATA END ---

export const LeaderboardScreen: FC<LeaderboardScreenProps> = ({ navigation }) => {
  const { themed, theme } = useAppTheme()
  const user = authService.getCurrentUser()

  const [entries, setEntries] = useState<LeaderboardItem[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null)

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const loadLeaderboard = async () => {
    setIsRefreshing(true)

    // 1. Start with Mock Data immediately
    let allItems: LeaderboardItem[] = [...MOCK_LEADERBOARD]

    try {
      // 2. Try to fetch Real User Data (Wrapped in its own try/catch)
      if (user) {
        try {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const todayStart = Timestamp.fromDate(today)

          const entriesQuery = query(
            collection(db, "hydrationEntries"),
            where("userId", "==", user.uid),
            where("timestamp", ">=", todayStart),
          )

          // This line often crashes if an Index is missing in Firebase Console
          const entriesSnapshot = await getDocs(entriesQuery)
          const hydrationEntries = entriesSnapshot.docs.map((doc) => doc.data())
          const totalHydration = hydrationEntries.reduce(
            (sum, entry) => sum + (entry.amount || 0),
            0,
          )

          const userDoc = await databaseService.getUser(user.uid)
          const dailyGoal = userDoc?.stats?.dailyWaterGoal || 2500
          const percentageOfGoal =
            dailyGoal > 0 ? Math.round((totalHydration / dailyGoal) * 100) : 0

          let pet: PetState | null = null
          try {
            pet = await databaseService.getPet(user.uid)
          } catch (e) {
            console.log("Pet fetch failed")
          }

          // Push REAL user to the list
          allItems.push({
            userId: user.uid,
            displayName: user.displayName || "You",
            totalHydration,
            percentageOfGoal,
            petHealth: pet?.health || 0,
            rank: 0,
            pet: pet || undefined,
          })
        } catch (firebaseError) {
          console.warn("⚠️ Firebase Error (Leaderboard still works):", firebaseError)
          // If fetching real user fails, we just show the mock data!
        }
      }

      // 3. Sort & Rank (Runs whether Firebase worked or not)
      allItems.sort((a, b) => b.totalHydration - a.totalHydration)

      allItems.forEach((item, index) => {
        item.rank = index + 1
      })

      setEntries(allItems)

      if (user) {
        const userEntry = allItems.find((item) => item.userId === user.uid)
        if (userEntry) setCurrentUserRank(userEntry.rank)
      }
    } catch (error) {
      console.error("Critical error:", error)
      // Emergency Fallback
      setEntries(MOCK_LEADERBOARD)
    } finally {
      setIsRefreshing(false)
    }
  }

  const renderLeaderboardItem = ({ item, index }: { item: LeaderboardItem; index: number }) => {
    const isCurrentUser = user?.uid === item.userId
    const isTopThree = index < 3

    const handleItemPress = () => {
      // Only navigate if it's a real user (or handle fake users differently if you want)
      if (item.userId.startsWith("fake-")) {
        alert(`That's ${item.displayName}! They are drinking lots of water!`)
        return
      }

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

        {/* --- ADDED DEFAULT PET ICON IF MISSING --- */}
        <View style={themed($petContainer)}>
          {item.pet ? (
            <Pet pet={item.pet} size="small" />
          ) : (
            <Text text="🐢" style={{ fontSize: 24 }} />
          )}
        </View>

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

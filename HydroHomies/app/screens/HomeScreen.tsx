import { FC, useEffect, useState } from "react"
import { View, ViewStyle, TextStyle, ScrollView, RefreshControl, Alert } from "react-native"
import { Text } from "@/components/Text"
import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { Pet } from "@/components/Pet"
import { useAuth } from "@/context/AuthContext"
import { databaseService, type UserProfile, type PetState, type HydrationEntry } from "@/services/firebase/database"
import { authService } from "@/services/firebase/auth"
import { calculateProgress, shouldFlagOverdrinking } from "@/utils/waterGoalCalculator"
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore"
import { db } from "@/services/firebase/config"

interface HomeScreenProps extends AppStackScreenProps<"Home"> {}

export const HomeScreen: FC<HomeScreenProps> = ({ navigation }) => {
  const { themed, theme } = useAppTheme()
  const { logout } = useAuth()
  const user = authService.getCurrentUser()

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [pet, setPet] = useState<PetState | null>(null)
  const [todayIntake, setTodayIntake] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [recentEntries, setRecentEntries] = useState<HydrationEntry[]>([])

  useEffect(() => {
    if (!user) {
      navigation.replace("Login")
      return
    }

    loadData()

    // Subscribe to real-time updates
    const unsubscribeEntries = subscribeToHydrationEntries(user.uid)
    const unsubscribePet = subscribeToPet(user.uid)

    return () => {
      unsubscribeEntries()
      unsubscribePet()
    }
  }, [user])

  const loadData = async () => {
    if (!user) return

    try {
      const profile = await databaseService.getUserProfile(user.uid)
      setUserProfile(profile)

      if (!profile?.stats) {
        // User hasn't completed onboarding
        navigation.replace("Onboarding")
        return
      }

      // Load initial pet state (real-time updates are handled by subscribeToPet)
      const petData = await databaseService.getPet(user.uid)
      setPet(petData)

      // Note: Hydration entries are handled by subscribeToHydrationEntries
      // No need to create a duplicate listener here
    } catch (error) {
      console.error("Error loading data:", error)
      Alert.alert("Error", "Failed to load data. Please try again.")
    }
  }

  const subscribeToHydrationEntries = (userId: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStart = Timestamp.fromDate(today)

    const entriesQuery = query(
      collection(db, "hydrationEntries"),
      where("userId", "==", userId),
      where("timestamp", ">=", todayStart),
    )

    return onSnapshot(entriesQuery, (snapshot) => {
      const entries = snapshot.docs.map((doc) => doc.data() as HydrationEntry)
      setRecentEntries(entries)
      const total = entries.reduce((sum, entry) => sum + entry.amount, 0)
      setTodayIntake(total)
    })
  }

  const subscribeToPet = (userId: string) => {
    const petRef = collection(db, "pets")
    const petQuery = query(petRef, where("userId", "==", userId))

    return onSnapshot(petQuery, (snapshot) => {
      if (!snapshot.empty) {
        const petData = snapshot.docs[0].data() as PetState
        setPet(petData)
      }
    })
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadData()
    setIsRefreshing(false)
  }

  const dailyGoal = userProfile?.stats?.dailyWaterGoal || 2500
  const progress = calculateProgress(todayIntake, dailyGoal)
  const shouldFlag = shouldFlagOverdrinking(todayIntake, dailyGoal)

  return (
    <Screen
      preset="scroll"
      contentContainerStyle={themed($screenContentContainer)}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.colors.palette.accent500} />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={themed($header)}>
          <Text preset="heading" text="HydroHype 💧" />
          <Text size="md" text={`Welcome back, ${userProfile?.displayName || user?.email || "User"}!`} />
        </View>

        {/* Pet Display */}
        {pet && (
          <View style={themed($petSection)}>
            <Pet pet={pet} size="large" />
          </View>
        )}

        {/* Hydration Progress */}
        <View style={themed($progressSection)}>
          <Text preset="subheading" text="Today's Progress" style={themed($sectionTitle)} />
          
          {shouldFlag && (
            <View style={themed($warningBanner)}>
              <Text text="⚠️ You're drinking a lot today! Stay safe." style={themed($warningText)} />
            </View>
          )}

          <View style={themed($progressContainer)}>
            <View style={themed($progressInfo)}>
              <Text preset="heading" text={`${(todayIntake / 1000).toFixed(1)} L`} />
              <Text size="sm" text={`of ${(dailyGoal / 1000).toFixed(1)} L`} />
            </View>

            <View style={themed($progressBarContainer)}>
              <View style={themed($progressBarBackground)}>
                <View
                  style={themed([
                    $progressBarFill,
                    {
                      width: `${progress}%`,
                      backgroundColor:
                        progress >= 100
                          ? theme.colors.palette.success500
                          : theme.colors.palette.accent500,
                    },
                  ])}
                />
              </View>
              <Text size="xs" text={`${progress}% Complete`} style={themed($progressText)} />
            </View>

            <Text size="sm" text={`${dailyGoal - todayIntake}ml remaining`} style={themed($remainingText)} />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={themed($actionsSection)}>
          <Button
            text="💧 Log Water"
            onPress={() => navigation.navigate("ScanBottle", { mode: "initial" })}
            style={themed($actionButton)}
            preset="default"
          />
          <Button
            text="🏆 Leaderboard"
            onPress={() => navigation.navigate("Leaderboard")}
            style={themed($actionButton)}
            preset="reversed"
          />
        </View>

        {/* Recent Entries */}
        {recentEntries.length > 0 && (
          <View style={themed($entriesSection)}>
            <Text preset="subheading" text="Recent Entries" style={themed($sectionTitle)} />
            {recentEntries.slice(0, 5).map((entry) => (
              <View key={entry.id} style={themed($entryItem)}>
                <View style={themed($entryInfo)}>
                  <Text preset="bold" text={`${entry.amount}ml`} />
                  {entry.bottleType && <Text size="sm" text={entry.bottleType} />}
                </View>
                <Text
                  size="xs"
                  text={new Date(entry.timestamp.toDate()).toLocaleTimeString()}
                  style={themed($entryTime)}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  )
}

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.lg,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.xl,
})

const $petSection: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  padding: spacing.lg,
  marginBottom: spacing.lg,
})

const $progressSection: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  padding: spacing.lg,
  marginBottom: spacing.lg,
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $warningBanner: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.warning100,
  padding: spacing.md,
  borderRadius: 8,
  marginBottom: spacing.md,
})

const $warningText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.warning900,
})

const $progressContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
})

const $progressInfo: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  marginBottom: spacing.md,
})

const $progressBarContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: "100%",
  marginBottom: spacing.sm,
})

const $progressBarBackground: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  height: 24,
  backgroundColor: colors.palette.neutral200,
  borderRadius: 12,
  overflow: "hidden",
  marginBottom: spacing.xs,
})

const $progressBarFill: ThemedStyle<ViewStyle> = () => ({
  height: "100%",
  borderRadius: 12,
  transition: "width 0.3s ease",
})

const $progressText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral600,
  textAlign: "center",
})

const $remainingText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral600,
  textAlign: "center",
})

const $actionsSection: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.md,
  marginBottom: spacing.lg,
})

const $actionButton: ThemedStyle<ViewStyle> = () => ({
  width: "100%",
})

const $entriesSection: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  padding: spacing.lg,
  marginBottom: spacing.lg,
})

const $entryItem: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: spacing.md,
  borderBottomWidth: 1,
  borderBottomColor: colors.palette.neutral200,
})

const $entryInfo: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.xs,
})

const $entryTime: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral600,
})

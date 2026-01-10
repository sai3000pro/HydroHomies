import { FC, useEffect, useState } from "react"
import {
  View,
  ViewStyle,
  TextStyle,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native"
import { Text } from "@/components/Text"
import { Screen } from "@/components/Screen"
import { Pet } from "@/components/Pet"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { databaseService, type PetState, type UserProfile } from "@/services/firebase/database"

interface FriendPetScreenProps extends AppStackScreenProps<"FriendPet"> {}

export const FriendPetScreen: FC<FriendPetScreenProps> = ({ navigation, route }) => {
  const { themed, theme } = useAppTheme()
  const { userId, displayName } = route.params

  const [pet, setPet] = useState<PetState | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadFriendData()
  }, [userId])

  const loadFriendData = async () => {
    setIsLoading(true)
    try {
      const [petData, profileData] = await Promise.all([
        databaseService.getFriendPet(userId),
        databaseService.getUserProfile(userId),
      ])

      setPet(petData)
      setUserProfile(profileData)
    } catch (error) {
      console.error("Error loading friend data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadFriendData()
    setIsRefreshing(false)
  }

  if (isLoading) {
    return (
      <Screen preset="fixed" contentContainerStyle={themed($screenContentContainer)}>
        <View style={themed($loadingContainer)}>
          <ActivityIndicator size="large" color={theme.colors.palette.accent500} />
          <Text text="Loading..." style={themed($loadingText)} />
        </View>
      </Screen>
    )
  }

  return (
    <Screen
      preset="scroll"
      contentContainerStyle={themed($screenContentContainer)}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={theme.colors.palette.accent500}
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={themed($header)}>
          <Text preset="heading" text={`${displayName}'s Pet`} />
          {userProfile?.stats && (
            <Text
              size="md"
              text={`Daily Goal: ${((userProfile.stats.dailyWaterGoal || 2500) / 1000).toFixed(1)}L`}
              style={themed($subtitle)}
            />
          )}
        </View>

        {pet ? (
          <>
            <View style={themed($petSection)}>
              <Pet pet={pet} size="large" />
            </View>

            <View style={themed($statsSection)}>
              <Text preset="subheading" text="Pet Stats" style={themed($sectionTitle)} />

              <View style={themed($statRow)}>
                <Text preset="bold" text="Level:" />
                <Text text={`${pet.level}`} style={themed($statValue)} />
              </View>

              <View style={themed($statRow)}>
                <Text preset="bold" text="Health:" />
                <Text text={`${pet.health}%`} style={themed($statValue)} />
              </View>

              <View style={themed($statRow)}>
                <Text preset="bold" text="Experience:" />
                <Text text={`${pet.experience} XP`} style={themed($statValue)} />
              </View>

              <View style={themed($statRow)}>
                <Text preset="bold" text="Type:" />
                <Text text={pet.type} style={[themed($statValue), themed($typeText)]} />
              </View>
            </View>
          </>
        ) : (
          <View style={themed($emptyContainer)}>
            <Text text="This user hasn't created a pet yet! 🌱" />
          </View>
        )}
      </ScrollView>
    </Screen>
  )
}

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.lg,
})

const $loadingContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  gap: spacing.md,
})

const $loadingText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral600,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.xl,
  alignItems: "center",
})

const $subtitle: ThemedStyle<TextStyle> = ({ spacing, colors }) => ({
  marginTop: spacing.sm,
  color: colors.palette.neutral600,
})

const $petSection: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  padding: spacing.xl,
  marginBottom: spacing.lg,
  alignItems: "center",
})

const $statsSection: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  padding: spacing.lg,
  marginBottom: spacing.lg,
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $statRow: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: spacing.sm,
  borderBottomWidth: 1,
  borderBottomColor: colors.palette.neutral200,
})

const $statValue: ThemedStyle<TextStyle> = () => ({})

const $typeText: ThemedStyle<TextStyle> = () => ({
  textTransform: "capitalize",
})

const $emptyContainer: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  padding: spacing.xl,
  alignItems: "center",
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
})

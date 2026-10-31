import { FC, useEffect, useState } from "react"
import { ActivityIndicator, TextStyle, View, ViewStyle } from "react-native"

import { Button } from "@/components/Button"
import { DrinkPhotoGallery } from "@/components/DrinkPhotoGallery"
import { Pet } from "@/components/Pet"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useSignedInUser } from "@/context/AuthContext"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { databaseService, type DailySummary, type PetState } from "@/services/firebase/database"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { calculateProgress } from "@/utils/waterGoalCalculator"

interface FriendPetScreenProps extends AppStackScreenProps<"FriendPet"> {}

/** Another user's pet and today's progress. Only public data (pets, dailySummaries) is read. */
export const FriendPetScreen: FC<FriendPetScreenProps> = ({ navigation, route }) => {
  const { themed, theme } = useAppTheme()
  const { userId, displayName } = route.params
  const { profile } = useSignedInUser()
  const isMe = userId === profile.uid

  const [pet, setPet] = useState<PetState | null | undefined>(undefined)
  const [summary, setSummary] = useState<DailySummary | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const onError = (e: Error) => setError(e.message)
    const unsubPet = databaseService.subscribeToPet(userId, setPet, onError)
    const unsubSummary = databaseService.subscribeToDailySummary(userId, setSummary, onError)
    return () => {
      unsubPet()
      unsubSummary()
    }
  }, [userId])

  const progress = summary ? calculateProgress(summary.totalMl, summary.goalMl) : 0

  return (
    <Screen
      preset="scroll"
      contentContainerStyle={themed($container)}
      safeAreaEdges={["top", "bottom"]}
    >
      <View style={themed($header)}>
        <Text
          preset="heading"
          text={isMe ? "Your profile" : `${displayName}'s pet`}
          style={$flex}
        />
        <Button text="Back" onPress={() => navigation.goBack()} />
      </View>

      {!!error && <Text style={{ color: theme.colors.error }} text={error} />}

      {pet === undefined && !error ? (
        <ActivityIndicator size="large" color={theme.colors.tint} />
      ) : pet ? (
        <View style={themed($card)}>
          <Pet pet={pet} size="large" />
        </View>
      ) : (
        <Text text={`${displayName} hasn't adopted a pet yet.`} />
      )}

      <View style={themed($card)}>
        <Text preset="subheading" text="Today" />
        {summary ? (
          <>
            <Text
              text={`${(summary.totalMl / 1000).toFixed(2)} L of ${(summary.goalMl / 1000).toFixed(1)} L · ${progress}%`}
            />
            <Text size="sm" style={themed($dim)} text={`${summary.entryCount} drinks logged`} />
          </>
        ) : (
          <Text style={themed($dim)} text="No drinks logged yet today." />
        )}
      </View>

      <DrinkPhotoGallery userId={userId} displayName={displayName} isMe={isMe} />
    </Screen>
  )
}

const $flex: TextStyle = { flex: 1 }

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.lg,
  gap: spacing.lg,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
})

const $card: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  padding: spacing.lg,
  gap: spacing.xs,
})

const $dim: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.textDim })

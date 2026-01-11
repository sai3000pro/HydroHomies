import { FC, useEffect, useState } from "react"
import { View, ViewStyle, Image, ImageStyle, TextStyle } from "react-native"
import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { PetState } from "@/services/firebase/database"

interface PetProps {
  pet: PetState
  size?: "small" | "medium" | "large"
}

export const Pet: FC<PetProps> = ({ pet, size = "medium" }) => {
  const { themed, theme } = useAppTheme()
  const [petEmoji, setPetEmoji] = useState("🌱")

  useEffect(() => {
    // Map pet type and health to emoji representation
    const healthEmoji = pet.health > 70 ? "😊" : pet.health > 40 ? "😐" : "😢"

    switch (pet.type) {
      case "seed":
        setPetEmoji(pet.health > 70 ? "🌱" : "🥀")
        break
      case "sprout":
        setPetEmoji(pet.health > 70 ? "🌿" : "🥀")
        break
      case "plant":
        setPetEmoji(pet.health > 70 ? "🌳" : "🍂")
        break
      case "flower":
        setPetEmoji(pet.health > 70 ? "🌸" : "🥀")
        break
      case "droplet":
        setPetEmoji(pet.health > 70 ? "💧" : "💦")
        break
      case "fish":
        setPetEmoji(pet.health > 70 ? "🐠" : "🐟")
        break
      default:
        setPetEmoji("🌱")
    }
  }, [pet.type, pet.health])

  const sizeStyles = {
    small: { fontSize: 48, containerSize: 80 },
    medium: { fontSize: 96, containerSize: 150 },
    large: { fontSize: 144, containerSize: 200 },
  }

  const currentSize = sizeStyles[size]

  return (
    <View style={themed($container)}>
      <View
        style={themed([
          $petContainer,
          {
            width: currentSize.containerSize,
            height: currentSize.containerSize,
          },
        ])}
      >
        <Text style={[{ fontSize: currentSize.fontSize }, themed($petEmoji)]}>{petEmoji}</Text>
      </View>
      <Text preset="subheading" text={pet.name} style={themed($petName)} />
      <Text size="sm" text={`Level ${pet.level} • ${pet.type}`} style={themed($petInfo)} />
      <View style={themed($healthBarContainer)}>
        <Text size="xs" text={`Health: ${pet.health}%`} style={themed($healthLabel)} />
        <View style={themed($healthBarBackground)}>
          <View
            style={themed([
              $healthBarFill,
              {
                width: `${pet.health}%`,
                backgroundColor:
                  pet.health > 70
                    ? theme.colors.palette.success500
                    : pet.health > 40
                      ? theme.colors.palette.warning500
                      : theme.colors.palette.error500,
              },
            ])}
          />
        </View>
      </View>
      <Text size="xs" text={`XP: ${pet.experience}`} style={themed($experienceText)} />
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  padding: spacing.lg,
})

const $petContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 100,
  justifyContent: "center",
  alignItems: "center",
  marginBottom: spacing.md,
  borderWidth: 3,
  borderColor: colors.palette.accent500,
  shadowColor: colors.palette.neutral900,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
})

const $petEmoji: ThemedStyle<TextStyle> = () => ({
  textAlign: "center",
})

const $petName: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $petInfo: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
  textTransform: "capitalize",
})

const $healthBarContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: "100%",
  marginTop: spacing.sm,
  marginBottom: spacing.xs,
})

const $healthLabel: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $healthBarBackground: ThemedStyle<ViewStyle> = ({ colors }) => ({
  height: 8,
  backgroundColor: colors.palette.neutral200,
  borderRadius: 4,
  overflow: "hidden",
})

const $healthBarFill: ThemedStyle<ViewStyle> = () => ({
  height: "100%",
  borderRadius: 4,
})

const $experienceText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral600,
})

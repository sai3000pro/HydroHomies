import { FC } from "react"
import { Image, ImageSourcePropType, ImageStyle, TextStyle, View, ViewStyle } from "react-native"

import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import {
  currentHealth,
  levelForXp,
  levelProgress,
  SPECIES_DISPLAY_NAMES,
  stageForLevel,
  THIRSTY_HEALTH,
  type PetSpecies,
} from "@/utils/petEvolution"

export const PET_IMAGES: Record<PetSpecies, ImageSourcePropType> = {
  elephant: require("../../assets/images/basic-pet-1.png"),
  alien: require("../../assets/images/basic-pet-2.png"),
  sphele: require("../../assets/images/basic-pet-3.png"),
}

const IMAGE_SIZE = { small: 44, medium: 120, large: 200 } as const

export interface PetViewModel {
  name: string
  species: PetSpecies
  experience: number
  health: number
  lastFed: Date | null
}

interface PetProps {
  pet: PetViewModel
  size?: keyof typeof IMAGE_SIZE
}

/** Small: just the avatar. Medium/large: avatar, name, stage, health and XP bars. */
export const Pet: FC<PetProps> = ({ pet, size = "medium" }) => {
  const { themed, theme } = useAppTheme()
  const { palette } = theme.colors

  const health = currentHealth(pet.health, pet.lastFed)
  const level = levelForXp(pet.experience)
  const stage = stageForLevel(level)
  const xp = levelProgress(pet.experience)
  const isThirsty = health < THIRSTY_HEALTH
  const dimension = IMAGE_SIZE[size]

  const avatar = (
    <Image
      source={PET_IMAGES[pet.species]}
      accessibilityLabel={`${pet.name} the ${SPECIES_DISPLAY_NAMES[pet.species]}`}
      style={[$image, { width: dimension, height: dimension }, isThirsty && $faded]}
    />
  )

  if (size === "small") return avatar

  const healthColor =
    health > 70
      ? palette.success500
      : health >= THIRSTY_HEALTH
        ? palette.warning500
        : palette.angry500

  return (
    <View style={themed($container)}>
      {avatar}
      <Text preset="subheading" text={pet.name} style={themed($centered)} />
      <Text
        size="sm"
        text={`Level ${level} ${stage} ${SPECIES_DISPLAY_NAMES[pet.species]}`}
        style={themed($dim)}
      />
      {isThirsty && <Text size="sm" text={`😵 ${pet.name} is thirsty!`} style={themed($thirsty)} />}

      <Bar label={`Health ${health}%`} fraction={health / 100} color={healthColor} />
      <Bar
        label={`XP ${xp.current} / ${xp.needed}`}
        fraction={xp.current / xp.needed}
        color={palette.water500}
      />
    </View>
  )
}

const Bar: FC<{ label: string; fraction: number; color: string }> = ({
  label,
  fraction,
  color,
}) => {
  const { themed } = useAppTheme()
  const pct = `${Math.round(Math.max(0, Math.min(1, fraction)) * 100)}%` as const
  return (
    <View style={themed($barContainer)}>
      <Text size="xs" text={label} />
      <View style={themed($barTrack)}>
        <View style={[$barFill, { width: pct, backgroundColor: color }]} />
      </View>
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  padding: spacing.sm,
  gap: spacing.xxs,
})

const $image: ImageStyle = { resizeMode: "contain" }

const $faded: ImageStyle = { opacity: 0.55 }

const $centered: ThemedStyle<TextStyle> = ({ spacing }) => ({
  textAlign: "center",
  marginTop: spacing.xs,
})

const $dim: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.textDim })

const $thirsty: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.error })

const $barContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: "100%",
  marginTop: spacing.xs,
  gap: spacing.xxs,
})

const $barTrack: ThemedStyle<ViewStyle> = ({ colors }) => ({
  height: 8,
  backgroundColor: colors.palette.neutral300,
  borderRadius: 4,
  overflow: "hidden",
})

const $barFill: ViewStyle = { height: "100%", borderRadius: 4 }

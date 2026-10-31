import { FC } from "react"
import { Pressable, TextStyle, ViewStyle } from "react-native"

import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface ActionTileProps {
  emoji: string
  label: string
  onPress: () => void
  /** Spans the full row */
  wide?: boolean
}

/** Shortcut button for Home's grid: emoji above a one-line label */
export const ActionTile: FC<ActionTileProps> = ({ emoji, label, onPress, wide }) => {
  const { themed } = useAppTheme()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [themed($tile), wide && $wide, pressed && themed($pressed)]}
    >
      <Text text={emoji} style={$emoji} />
      <Text preset="bold" size="xs" text={label} numberOfLines={1} />
    </Pressable>
  )
}

const $emoji: TextStyle = { fontSize: 26, lineHeight: 34 }
const $wide: ViewStyle = { flexBasis: "100%" }

const $tile: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexBasis: "47%",
  flexGrow: 1,
  alignItems: "center",
  justifyContent: "center",
  gap: spacing.xxs,
  paddingVertical: spacing.md,
  borderRadius: 16,
  backgroundColor: colors.palette.neutral100,
})

const $pressed: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral300,
})

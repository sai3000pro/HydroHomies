import { FC, ReactNode } from "react"
import { Pressable, TextStyle, View, ViewStyle } from "react-native"
import { useNavigation } from "@react-navigation/native"

import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface ScreenHeaderProps {
  title: string
  subtitle?: string
  /** Shows a compact "‹ Back" button */
  onBack?: () => void
  /** Optional element on the right, e.g. a small action button */
  right?: ReactNode
}

/** Title row used by every screen pushed on top of Home */
export const ScreenHeader: FC<ScreenHeaderProps> = ({ title, subtitle, onBack, right }) => {
  const { themed } = useAppTheme()
  const navigation = useNavigation()
  // After a browser refresh on a sub-screen there's nothing to go back to, so go Home instead
  const back = () => (navigation.canGoBack() ? onBack?.() : navigation.navigate("Home"))
  return (
    <View style={themed($container)}>
      {onBack && (
        <Pressable
          onPress={back}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={12}
          style={({ pressed }) => [themed($back), pressed && $pressed]}
        >
          <Text text="‹ Back" style={themed($backText)} />
        </Pressable>
      )}
      <View style={$row}>
        <View style={$flex}>
          <Text preset="heading" text={title} style={$title} numberOfLines={2} />
          {!!subtitle && <Text size="sm" text={subtitle} style={themed($subtitle)} />}
        </View>
        {right}
      </View>
    </View>
  )
}

const $flex: ViewStyle = { flex: 1 }
const $row: ViewStyle = { flexDirection: "row", alignItems: "center", gap: 8 }
const $title: TextStyle = { fontSize: 30, lineHeight: 38 }
const $pressed: ViewStyle = { opacity: 0.6 }

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({ gap: spacing.xxs })

const $back: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignSelf: "flex-start",
  paddingVertical: spacing.xxs,
})

const $backText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.water500,
  fontSize: 17,
})

const $subtitle: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.textDim })

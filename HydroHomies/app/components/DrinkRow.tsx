import { FC } from "react"
import { Pressable, TextStyle, View, ViewStyle } from "react-native"

import { Text } from "@/components/Text"
import { useSignedInUser } from "@/context/AuthContext"
import { databaseService, UNDO_WINDOW_MS, type HydrationEntry } from "@/services/firebase/database"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { confirmAction, notify } from "@/utils/confirm"
import { xpForWater } from "@/utils/petEvolution"

const SOURCE_LABEL: Record<HydrationEntry["source"], string> = {
  "ai": "AI",
  "on-device": "On-device",
  "manual": "By hand",
}

interface DrinkRowProps {
  entry: HydrationEntry
  /** Also show the day (for lists that span several days) */
  showDay?: boolean
  isLast?: boolean
}

/** One logged drink: amount, time and source, with Delete while it can still be undone */
export const DrinkRow: FC<DrinkRowProps> = ({ entry, showDay, isLast }) => {
  const { themed } = useAppTheme()
  const { profile, pet } = useSignedInUser()

  const canUndo = !!entry.timestamp && Date.now() - entry.timestamp.getTime() < UNDO_WINDOW_MS
  const when = entry.timestamp
    ? entry.timestamp.toLocaleString(
        [],
        showDay
          ? { weekday: "short", hour: "numeric", minute: "2-digit" }
          : { hour: "numeric", minute: "2-digit" },
      )
    : "Saving…"

  async function undo() {
    const ok = await confirmAction(
      `Delete this ${entry.amount} ml drink?`,
      pet
        ? `It comes off that day's total and ${pet.name} loses the ${xpForWater(entry.amount)} XP it earned.`
        : "It comes off that day's total.",
      "Delete",
    )
    if (!ok) return
    databaseService
      .deleteDrink(profile, entry.id)
      .catch((e) => notify("Couldn't delete", e?.message ?? String(e)))
  }

  return (
    <View style={[themed($row), isLast && $lastRow]}>
      <View style={$flexShrink}>
        <Text preset="bold" text={`${entry.amount} ml`} />
        <Text
          size="xs"
          style={themed($dim)}
          numberOfLines={1}
          text={`${when} · ${SOURCE_LABEL[entry.source]}`}
        />
      </View>
      {canUndo && (
        <Pressable
          onPress={undo}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${entry.amount} millilitre drink`}
          hitSlop={8}
          style={({ pressed }) => [themed($undo), pressed && $pressed]}
        >
          <Text size="xs" text="Delete" style={themed($undoText)} />
        </Pressable>
      )}
    </View>
  )
}

const $lastRow: ViewStyle = { borderBottomWidth: 0 }
const $flexShrink: ViewStyle = { flexShrink: 1 }
const $pressed: ViewStyle = { opacity: 0.6 }

const $row: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: spacing.sm,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
})

const $dim: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.textDim })

const $undo: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xxs,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: colors.palette.neutral300,
})

const $undoText: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.error })

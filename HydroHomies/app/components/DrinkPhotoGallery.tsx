import { FC, useEffect, useState } from "react"
import {
  ActivityIndicator,
  Image,
  ImageStyle,
  Modal,
  Pressable,
  TextStyle,
  View,
  ViewStyle,
} from "react-native"

import { Button } from "@/components/Button"
import { Text } from "@/components/Text"
import { databaseService, type DrinkPhotos } from "@/services/firebase/database"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { confirmAction, notify } from "@/utils/confirm"
import { fromDateKey } from "@/utils/dateKey"

interface DrinkPhotoGalleryProps {
  userId: string
  displayName: string
  /** The signed-in user's own gallery: shows delete buttons */
  isMe: boolean
}

/** Before/after photos of a user's recent drinks. Only the owner and their friends can load them. */
export const DrinkPhotoGallery: FC<DrinkPhotoGalleryProps> = ({ userId, displayName, isMe }) => {
  const { themed, theme } = useAppTheme()
  const [photos, setPhotos] = useState<DrinkPhotos[] | null>(null)
  const [error, setError] = useState<"denied" | string>("")
  const [zoomed, setZoomed] = useState<string | null>(null)

  useEffect(
    () =>
      databaseService.subscribeToDrinkPhotos(
        userId,
        (p) => {
          setPhotos(p)
          setError("")
        },
        (e) => setError(e.code === "permission-denied" ? "denied" : e.message),
      ),
    [userId],
  )

  async function confirmDelete(p: DrinkPhotos) {
    const ok = await confirmAction(
      "Delete these photos?",
      "The drink stays logged; only the photos are removed.",
      "Delete",
    )
    if (!ok) return
    databaseService
      .deleteDrinkPhotos(p.entryId)
      .catch((e) => notify("Couldn't delete", e?.message ?? String(e)))
  }

  const title = isMe ? "Your drink photos" : `${displayName}'s drink photos`

  return (
    <View style={themed($card)}>
      <Text preset="subheading" text={`📷 ${title}`} />
      {error === "denied" ? (
        <Text
          style={themed($dim)}
          text={`Add ${displayName} as a friend to see their drink photos.`}
        />
      ) : error ? (
        <Text style={{ color: theme.colors.error }} text={error} />
      ) : photos === null ? (
        <ActivityIndicator color={theme.colors.tint} />
      ) : photos.length === 0 ? (
        <Text
          style={themed($dim)}
          text={isMe ? "Drinks you log with photo sharing on show up here." : "No photos yet."}
        />
      ) : (
        photos.map((p) => (
          <View key={p.entryId} style={themed($entry)}>
            <View style={$rowBetween}>
              <Text preset="bold" text={`${p.amount} ml`} />
              <Text size="xs" style={themed($dim)} text={describeWhen(p)} />
            </View>
            <View style={themed($row)}>
              <Photo uri={p.before} label="Before" onPress={() => setZoomed(p.before)} />
              <Photo uri={p.after} label="After" onPress={() => setZoomed(p.after)} />
            </View>
            {isMe && (
              <Button
                text="Delete photos"
                style={themed($smallButton)}
                textStyle={$small}
                onPress={() => confirmDelete(p)}
              />
            )}
          </View>
        ))
      )}
      {!isMe && error !== "denied" && (photos?.length ?? 0) > 0 && (
        <Text size="xs" style={themed($dim)} text="Suspicious? Tell them about it. 😏" />
      )}

      <Modal
        visible={!!zoomed}
        transparent
        animationType="fade"
        onRequestClose={() => setZoomed(null)}
      >
        <Pressable
          style={$zoomBackdrop}
          onPress={() => setZoomed(null)}
          accessibilityLabel="Close photo"
        >
          {zoomed && <Image source={{ uri: zoomed }} style={$zoomImage} />}
        </Pressable>
      </Modal>
    </View>
  )
}

const Photo: FC<{ uri: string; label: string; onPress: () => void }> = ({
  uri,
  label,
  onPress,
}) => {
  const { themed } = useAppTheme()
  return (
    <Pressable
      style={$flex}
      onPress={onPress}
      accessibilityRole="imagebutton"
      accessibilityLabel={`${label} photo, tap to enlarge`}
    >
      <Image source={{ uri }} style={themed($thumb)} />
      <Text size="xs" text={label} style={$centerText} />
    </Pressable>
  )
}

function describeWhen(p: DrinkPhotos): string {
  if (p.createdAt) {
    return p.createdAt.toLocaleString([], {
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
    })
  }
  return p.dateKey ? fromDateKey(p.dateKey).toLocaleDateString() : ""
}

const $flex: ViewStyle = { flex: 1 }
const $small: TextStyle = { fontSize: 14 }
const $centerText: TextStyle = { textAlign: "center" }
const $rowBetween: ViewStyle = { flexDirection: "row", justifyContent: "space-between" }
const $zoomBackdrop: ViewStyle = {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.85)",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
}
const $zoomImage: ImageStyle = { width: "100%", height: "80%", resizeMode: "contain" }

const $card: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  padding: spacing.lg,
  gap: spacing.sm,
})

const $entry: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  gap: spacing.xs,
  paddingVertical: spacing.sm,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
})

const $row: ThemedStyle<ViewStyle> = ({ spacing }) => ({ flexDirection: "row", gap: spacing.sm })

const $thumb: ThemedStyle<ImageStyle> = ({ colors }) => ({
  width: "100%",
  height: 140,
  borderRadius: 10,
  resizeMode: "cover",
  backgroundColor: colors.palette.neutral300,
})

const $smallButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  minHeight: 36,
  paddingVertical: spacing.xxs,
  paddingHorizontal: spacing.sm,
})

const $dim: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.textDim })

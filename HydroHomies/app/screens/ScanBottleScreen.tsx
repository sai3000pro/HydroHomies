/**
 * Two-photo drink logging:
 *   1. "before": photo of the bottle -> estimated water volume
 *   2. "after":  photo once you've drunk -> remaining volume
 *   3. review:   logs (before - after) ml, feeds the pet, updates the leaderboard
 *
 * Every estimate can be corrected with the steppers. Corrected entries are
 * logged with source "manual" so they're labelled honestly.
 */
import { FC, ReactNode, useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Image,
  ImageStyle,
  Pressable,
  TextStyle,
  View,
  ViewStyle,
} from "react-native"
import { CameraView, useCameraPermissions } from "expo-camera"
import * as ImagePicker from "expo-image-picker"

import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Switch } from "@/components/Toggle/Switch"
import { useSignedInUser } from "@/context/AuthContext"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { loadPhotoSharing, makeThumbnail, savePhotoSharing } from "@/services/drinkPhotos"
import { databaseService, MAX_ENTRY_ML, type EstimateSource } from "@/services/firebase/database"
import { analyzeBottle, type BottleReading } from "@/services/vision/analyzeBottle"
import { clamp, consumedVolume, MAX_BOTTLE_ML, type ScanPhase } from "@/services/vision/estimate"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { notify } from "@/utils/confirm"
import { levelForXp, stageForLevel, xpForWater } from "@/utils/petEvolution"

interface ScanBottleScreenProps extends AppStackScreenProps<"ScanBottle"> {}

type Step = ScanPhase | "review"

interface Reading extends BottleReading {
  imageUri: string
  adjusted: boolean
}

const STEP_ML = 50

/** "500 ml. Zap gained 50 XP." plus a level-up or new-stage line when it happens */
function celebration(pet: { name: string; experience: number } | null, amount: number): string {
  if (!pet) return `${amount} ml.`
  const gained = xpForWater(amount)
  const before = levelForXp(pet.experience)
  const after = levelForXp(pet.experience + gained)
  let text = `${amount} ml. ${pet.name} gained ${gained} XP.`
  if (after > before) {
    const stage = stageForLevel(after)
    text +=
      stage !== stageForLevel(before)
        ? `\n\n🎉 ${pet.name} grew into a ${stage}! (Level ${after})`
        : `\n\n⭐ ${pet.name} reached level ${after}!`
  }
  return text
}

const SOURCE_TEXT: Record<EstimateSource, string> = {
  "ai": "AI estimate",
  "on-device": "On-device model",
  "manual": "Manual",
}

export const ScanBottleScreen: FC<ScanBottleScreenProps> = ({ navigation }) => {
  const { themed, theme } = useAppTheme()
  const { profile, pet } = useSignedInUser()
  const [permission, requestPermission] = useCameraPermissions()
  const cameraRef = useRef<CameraView>(null)
  const logging = useRef(false)

  const [step, setStep] = useState<Step>("before")
  const [capturing, setCapturing] = useState(true)
  const [isBusy, setIsBusy] = useState(false)
  const [before, setBefore] = useState<Reading | null>(null)
  const [after, setAfter] = useState<Reading | null>(null)
  const [sharePhotos, setSharePhotos] = useState(loadPhotoSharing)

  // Ask for the camera once on open; after that the user taps "Grant permission"
  const askedCamera = useRef(false)
  useEffect(() => {
    if (askedCamera.current || !permission || permission.granted || !permission.canAskAgain) return
    askedCamera.current = true
    requestPermission()
  }, [permission, requestPermission])

  // After a browser refresh on this screen there's no Home underneath to go back to
  const leave = () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate("Home"))

  const phase: ScanPhase = step === "after" ? "after" : "before"
  const current = phase === "before" ? before : after
  const setCurrent = phase === "before" ? setBefore : setAfter

  async function handleImage(uri: string) {
    setCapturing(false)
    setIsBusy(true)
    try {
      const reading = await analyzeBottle(
        uri,
        phase,
        phase === "after" ? (before?.bottleVolume ?? null) : null,
        phase === "after" ? (before?.waterVolume ?? null) : null,
      )
      setCurrent({ ...reading, imageUri: uri, adjusted: false })
    } catch (e: any) {
      notify("Couldn't read that photo", e?.message ?? "Please try another photo.")
      setCapturing(true)
    } finally {
      setIsBusy(false)
    }
  }

  async function takePhoto() {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 })
      if (photo?.uri) await handleImage(photo.uri)
    } catch (e: any) {
      notify("Camera error", e?.message ?? "Couldn't take a photo.")
    }
  }

  async function pickPhoto() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.7,
      })
      if (!result.canceled && result.assets[0]) await handleImage(result.assets[0].uri)
    } catch (e: any) {
      notify("Couldn't open your photos", e?.message ?? "Please try again.")
    }
  }

  function adjust(field: "waterVolume" | "bottleVolume", delta: number) {
    if (!current) return
    const next = { ...current, adjusted: true, source: "manual" as const }
    if (field === "bottleVolume") {
      next.bottleVolume = clamp(current.bottleVolume + delta, STEP_ML, MAX_BOTTLE_ML)
      next.waterVolume = Math.min(next.waterVolume, next.bottleVolume)
    } else {
      next.waterVolume = clamp(current.waterVolume + delta, 0, current.bottleVolume)
    }
    setCurrent(next)
  }

  function retake() {
    setCurrent(null)
    setCapturing(true)
  }

  const consumed = before && after ? consumedVolume(before.waterVolume, after.waterVolume) : 0
  const loggedAmount = Math.min(consumed, MAX_ENTRY_ML)

  async function logDrink() {
    // A ref, not state: a fast double tap fires twice before the re-render disables the button
    if (!before || !after || loggedAmount <= 0 || logging.current) return
    logging.current = true
    setIsBusy(true)
    try {
      const source: EstimateSource =
        before.adjusted || after.adjusted
          ? "manual"
          : before.source === "ai" && after.source === "ai"
            ? "ai"
            : before.source === "manual" || after.source === "manual"
              ? "manual"
              : "on-device"
      const logged = await databaseService.logHydration({
        profile,
        amount: loggedAmount,
        beforeVolume: before.waterVolume,
        afterVolume: after.waterVolume,
        bottleVolume: before.bottleVolume,
        source,
      })
      let photoNote = ""
      if (sharePhotos) {
        // The drink is already logged; a failed photo upload only loses the proof
        try {
          const [b, a] = await Promise.all([
            makeThumbnail(before.imageUri),
            makeThumbnail(after.imageUri),
          ])
          await databaseService.saveDrinkPhotos({
            userId: profile.uid,
            entryId: logged.entryId,
            amount: loggedAmount,
            dateKey: logged.dateKey,
            before: b,
            after: a,
          })
        } catch (e: any) {
          photoNote = ` Photos weren't shared: ${e?.message ?? "upload failed"}.`
        }
      }
      leave()
      notify("Logged! 💧", celebration(pet, loggedAmount) + photoNote)
    } catch (e: any) {
      logging.current = false
      setIsBusy(false)
      notify("Couldn't log drink", e?.message ?? "Please try again.")
    }
  }

  // ---------- Render ----------

  if (step !== "review" && capturing) {
    if (!permission)
      return (
        <Centered>
          <ActivityIndicator size="large" />
        </Centered>
      )
    if (!permission.granted) {
      return (
        <Screen
          preset="fixed"
          contentContainerStyle={themed($padded)}
          safeAreaEdges={["top", "bottom"]}
        >
          <Text preset="heading" text="Camera access needed" />
          <Text text="HydroHype uses the camera to estimate how much water is in your bottle." />
          <Button text="Grant permission" preset="reversed" onPress={requestPermission} />
          <Button text="Choose from gallery instead" onPress={pickPhoto} />
          <Button text="Cancel" onPress={() => leave()} />
        </Screen>
      )
    }
    return (
      <Screen
        preset="fixed"
        contentContainerStyle={themed($fill)}
        safeAreaEdges={["top", "bottom"]}
      >
        <CameraView ref={cameraRef} style={$camera} facing="back">
          <View style={themed($cameraOverlay)}>
            <Text
              preset="subheading"
              style={$white}
              text={`Step ${phase === "before" ? 1 : 2} of 2`}
            />
            <Text
              preset="heading"
              style={$white}
              text={phase === "before" ? "Photo before drinking" : "Photo after drinking"}
            />
            <Text
              style={$white}
              text={
                phase === "before"
                  ? "Fit the whole bottle in the frame, side-on."
                  : "Same bottle, same angle, after you've had your drink."
              }
            />
          </View>
        </CameraView>
        <View style={themed($controls)}>
          <Button text="📸 Take photo" preset="reversed" onPress={takePhoto} />
          <View style={themed($row)}>
            <Button text="Gallery" onPress={pickPhoto} style={$flex} />
            <Button
              text={phase === "after" ? "Back" : "Cancel"}
              onPress={() =>
                phase === "after" ? (setStep("before"), setCapturing(false)) : leave()
              }
              style={$flex}
            />
          </View>
        </View>
      </Screen>
    )
  }

  if (step === "review" && before && after) {
    return (
      <Screen
        preset="scroll"
        contentContainerStyle={themed($padded)}
        safeAreaEdges={["top", "bottom"]}
      >
        <Text preset="heading" text="Confirm your drink" />
        <View style={themed($row)}>
          <Thumb uri={before.imageUri} label={`Before: ${before.waterVolume} ml`} />
          <Thumb uri={after.imageUri} label={`After: ${after.waterVolume} ml`} />
        </View>
        <View style={themed($bigNumber)}>
          <Text text="You drank" />
          <Text preset="heading" text={`${consumed} ml`} />
          {consumed > MAX_ENTRY_ML && (
            <Text size="sm" text={`Single entries are capped at ${MAX_ENTRY_ML} ml.`} />
          )}
        </View>
        {loggedAmount <= 0 && (
          <Text
            text="The after photo shows as much water as before. Go back and adjust if that's wrong."
            style={{ color: theme.colors.error }}
          />
        )}
        <Switch
          label="Share photos with friends"
          helper="Your friends can see these two photos on your profile."
          value={sharePhotos}
          onValueChange={(v) => {
            setSharePhotos(v)
            savePhotoSharing(v)
          }}
          labelPosition="left"
          editable={!isBusy}
        />
        <Button
          text={isBusy ? "Saving…" : `Log ${loggedAmount} ml`}
          preset="reversed"
          onPress={logDrink}
          disabled={isBusy || loggedAmount <= 0}
        />
        <Button text="Back" onPress={() => setStep("after")} disabled={isBusy} />
      </Screen>
    )
  }

  // Reading view (after a photo in the before/after step)
  return (
    <Screen
      preset="scroll"
      contentContainerStyle={themed($padded)}
      safeAreaEdges={["top", "bottom"]}
    >
      <Text preset="heading" text={phase === "before" ? "Before drinking" : "After drinking"} />
      {current && <Image source={{ uri: current.imageUri }} style={themed($preview)} />}

      {isBusy || !current ? (
        <View style={themed($bigNumber)}>
          <ActivityIndicator size="large" color={theme.colors.tint} />
          <Text text="Estimating volume…" />
        </View>
      ) : (
        <>
          <Text
            size="sm"
            style={themed($dim)}
            text={
              `${SOURCE_TEXT[current.source]}` +
              (current.confidence !== null
                ? ` · ${Math.round(current.confidence * 100)}% confident`
                : "")
            }
          />
          {!!current.note && <Text size="sm" text={current.note} />}
          {current.confidence !== null && current.confidence < 0.5 && !current.adjusted && (
            <Text
              size="sm"
              style={{ color: theme.colors.error }}
              text="Low confidence. Check the numbers."
            />
          )}

          <Stepper
            label={phase === "before" ? "Water in bottle" : "Water left"}
            value={current.waterVolume}
            onChange={(d) => adjust("waterVolume", d)}
          />
          {phase === "before" && (
            <Stepper
              label="Bottle size"
              value={current.bottleVolume}
              onChange={(d) => adjust("bottleVolume", d)}
            />
          )}

          <Button
            text={phase === "before" ? "Next: photo after drinking" : "Review"}
            preset="reversed"
            disabled={phase === "before" && current.waterVolume <= 0}
            onPress={() => {
              if (phase === "before") {
                setStep("after")
                setCapturing(!after)
              } else {
                setStep("review")
              }
            }}
          />
          <Button text="Retake photo" onPress={retake} />
        </>
      )}
    </Screen>
  )
}

const Stepper: FC<{ label: string; value: number; onChange: (delta: number) => void }> = ({
  label,
  value,
  onChange,
}) => {
  const { themed } = useAppTheme()
  return (
    <View style={themed($stepper)}>
      <Text preset="bold" text={label} style={$flex} />
      <StepButton text="−" onPress={() => onChange(-STEP_ML)} label={`Decrease ${label}`} />
      <Text preset="subheading" text={`${value} ml`} style={$stepValue} />
      <StepButton text="+" onPress={() => onChange(STEP_ML)} label={`Increase ${label}`} />
    </View>
  )
}

const StepButton: FC<{ text: string; label: string; onPress: () => void }> = ({
  text,
  label,
  onPress,
}) => {
  const { themed } = useAppTheme()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={themed($stepButton)}
    >
      <Text preset="subheading" text={text} />
    </Pressable>
  )
}

const Thumb: FC<{ uri: string; label: string }> = ({ uri, label }) => {
  const { themed } = useAppTheme()
  return (
    <View style={$flex}>
      <Image source={{ uri }} style={themed($thumb)} />
      <Text size="sm" text={label} style={$centerText} />
    </View>
  )
}

const Centered: FC<{ children: ReactNode }> = ({ children }) => (
  <View style={[$flex, $center]}>{children}</View>
)

const $flex: ViewStyle = { flex: 1 }
const $center: ViewStyle = { alignItems: "center", justifyContent: "center" }
const $white: TextStyle = { color: "#FFFFFF", textAlign: "center" }
const $centerText: TextStyle = { textAlign: "center" }
const $camera: ViewStyle = { flex: 1 }
const $stepValue: TextStyle = { minWidth: 90, textAlign: "center" }

const $fill: ThemedStyle<ViewStyle> = () => ({ flex: 1 })

const $padded: ThemedStyle<ViewStyle> = ({ spacing }) => ({ padding: spacing.lg, gap: spacing.md })

const $cameraOverlay: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  backgroundColor: "rgba(0,0,0,0.45)",
  padding: spacing.md,
  gap: spacing.xxs,
})

const $controls: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.md,
  gap: spacing.sm,
})

const $row: ThemedStyle<ViewStyle> = ({ spacing }) => ({ flexDirection: "row", gap: spacing.sm })

const $preview: ThemedStyle<ImageStyle> = ({ colors }) => ({
  width: "100%",
  height: 280,
  borderRadius: 12,
  resizeMode: "contain",
  backgroundColor: colors.palette.neutral300,
})

const $thumb: ThemedStyle<ImageStyle> = ({ colors }) => ({
  width: "100%",
  height: 160,
  borderRadius: 12,
  resizeMode: "cover",
  backgroundColor: colors.palette.neutral300,
})

const $dim: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.textDim })

const $bigNumber: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  paddingVertical: spacing.md,
  gap: spacing.xs,
})

const $stepper: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.xs,
  padding: spacing.sm,
  borderRadius: 12,
  backgroundColor: colors.palette.neutral100,
})

const $stepButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: 44,
  height: 44,
  borderRadius: 22,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.palette.water100,
})

import { FC, useState, useRef, useEffect } from "react"
import {
  View,
  ViewStyle,
  TextStyle,
  ImageStyle,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native"
import { CameraView, useCameraPermissions } from "expo-camera"
import * as ImagePicker from "expo-image-picker"

import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useAuth } from "@/context/AuthContext"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { authService } from "@/services/firebase/auth"
import { databaseService } from "@/services/firebase/database"
import { detectBottleAndLevel, getTribunalEstimate } from "@/services/ml/waterLevelClassifier"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { updatePetAfterHydration } from "@/utils/petEvolution"

interface ScanBottleScreenProps extends AppStackScreenProps<"ScanBottle"> {}

export const ScanBottleScreen: FC<ScanBottleScreenProps> = ({ navigation, route }) => {
  const { themed, theme } = useAppTheme()
  const [permission, requestPermission] = useCameraPermissions()
  const [facing, setFacing] = useState<"front" | "back">("back")
  const [imageUri, setImageUri] = useState<string | null>(route.params?.initialImageUri || null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [estimatedVolume, setEstimatedVolume] = useState<number | null>(
    route.params?.estimatedVolume || null,
  )
  const [bottleType, setBottleType] = useState<string | null>(null)
  const [waterLevel, setWaterLevel] = useState<string | null>(null)
  const [detectionConfidence, setDetectionConfidence] = useState<number | null>(null)
  const cameraRef = useRef<CameraView>(null)

  const mode = route.params?.mode || "initial"
  const isVerification = mode === "verification"

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission()
    }
  }, [permission])

  const handleTakePicture = async () => {
    if (!cameraRef.current || !permission?.granted) {
      Alert.alert("Permission needed", "Camera permission is required to scan bottles")
      return
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      })

      if (photo?.uri) {
        setImageUri(photo.uri)
        // TODO: Process image with ML model to detect bottle type and water level
        // For now, we'll simulate detection
        await processImage(photo.uri)
      }
    } catch (error) {
      console.error("Error taking picture:", error)
      Alert.alert("Error", "Failed to take picture. Please try again.")
    }
  }

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri)
      await processImage(result.assets[0].uri)
    }
  }

  const processImage = async (uri: string) => {
    setIsProcessing(true)

    try {
      // Use ML model to detect bottle type and water level
      // This will use the real ML model in development builds, or fallback to simulated detection in Expo Go
      const detection = await detectBottleAndLevel(uri, isVerification)

      // Also get tribunal estimate from OpenRouter API (using Gemini model)
      let tribunalEstimate = null
      try {
        tribunalEstimate = await getTribunalEstimate(uri)
        console.log("🏛️ Tribunal estimate received:", tribunalEstimate)

        // Use tribunal estimate if available and confidence is good
        if (tribunalEstimate && tribunalEstimate.estimate.confidence > 0.5) {
          // Override with tribunal estimates
          setEstimatedVolume(tribunalEstimate.estimate.waterVolume)
          setDetectionConfidence(tribunalEstimate.estimate.confidence)
          // Update bottle type if we have volume info
          if (tribunalEstimate.estimate.bottleVolume > 0) {
            setBottleType(`Bottle (${tribunalEstimate.estimate.bottleVolume}ml)`)
          }
        } else {
          // Fall back to ML model detection
          setEstimatedVolume(detection.estimatedVolume)
          setDetectionConfidence(detection.confidence)
          setBottleType(detection.bottleType.name)
        }
      } catch (tribunalError) {
        console.warn("⚠️ Tribunal estimate failed, using ML model:", tribunalError)
        // Fall back to ML model detection if tribunal fails
        setEstimatedVolume(detection.estimatedVolume)
        setDetectionConfidence(detection.confidence)
        setBottleType(detection.bottleType.name)
      }

      // Update water level from detection (not from tribunal)
      setWaterLevel(detection.waterLevel)

      // Warn user if confidence is low
      const finalConfidence = tribunalEstimate?.estimate.confidence || detection.confidence
      if (finalConfidence < 0.5) {
        Alert.alert(
          "Low Confidence",
          `Detection confidence is low (${Math.round(finalConfidence * 100)}%). The result may not be accurate.`,
        )
      }
    } catch (error) {
      console.error("Error processing image:", error)
      Alert.alert("Error", "Failed to process image. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirm = async () => {
    // For initial scan, we need an estimated volume to proceed
    if (!isVerification && (estimatedVolume === null || estimatedVolume === 0)) {
      Alert.alert("Error", "Could not detect water volume. Please try again or take another photo.")
      return
    }

    if (isVerification) {
      // Verify empty bottle - complete the hydration entry
      // Use the estimated volume from the initial scan (passed via route params)
      await completeHydrationEntry()
    } else {
      // Navigate to verification screen
      navigation.navigate("ScanBottle", {
        mode: "verification",
        initialImageUri: imageUri || undefined,
        estimatedVolume: estimatedVolume || 0,
      })
    }
  }

  const completeHydrationEntry = async (overrideVolume?: number) => {
    setIsProcessing(true)

    try {
      const user = authService.getCurrentUser()
      if (!user) {
        throw new Error("User not authenticated")
      }

      // Get user profile to check daily goal
      const profile = await databaseService.getUserProfile(user.uid)
      if (!profile?.stats) {
        Alert.alert("Error", "User profile not found. Please complete onboarding.")
        navigation.replace("Onboarding")
        return
      }

      // Use override volume if provided
      // In verification mode, use the volume from the initial scan (route params)
      // Otherwise, use current estimated volume or fall back to route params
      const volumeToLog =
        overrideVolume ??
        (isVerification ? route.params?.estimatedVolume : estimatedVolume) ??
        route.params?.estimatedVolume ??
        0

      if (volumeToLog === 0) {
        Alert.alert("Error", "No water volume detected. Please scan your bottle first.")
        return
      }

      // Check for overdrinking
      const todayIntake = await databaseService.getUserHydrationToday(user.uid)
      const totalAfter = todayIntake + volumeToLog
      const shouldFlag = totalAfter > profile.stats.dailyWaterGoal * 1.5

      if (shouldFlag) {
        Alert.alert("⚠️ Slow Down!", "You're drinking a lot today! Stay safe and hydrated.")
      }

      // Filter out data URIs (base64 images) - they're too large for Firestore
      // Only store file:// URIs or Firebase Storage URLs
      const isDataUri = (uri: string | null | undefined) => uri?.startsWith("data:") ?? false
      const beforeImageUri =
        route.params?.initialImageUri && !isDataUri(route.params.initialImageUri)
          ? route.params.initialImageUri
          : undefined
      const afterImageUri = imageUri && !isDataUri(imageUri) ? imageUri : undefined

      // Add hydration entry
      await databaseService.addHydrationEntry({
        userId: user.uid,
        amount: volumeToLog,
        bottleType: bottleType || undefined,
        verified: true,
      })

      // Update pet
      const pet = await databaseService.getPet(user.uid)
      if (pet) {
        const petUpdates = updatePetAfterHydration(pet, volumeToLog)
        await databaseService.updatePet(user.uid, petUpdates)
      }

      // Navigate to Home screen first
      setIsProcessing(false)
      navigation.navigate("Home")

      // Show success alert after a short delay to ensure navigation completes
      setTimeout(() => {
        Alert.alert("Success! 💧", `Logged ${volumeToLog}ml of water!`)
      }, 300)
    } catch (error) {
      console.error("Error completing hydration entry:", error)
      setIsProcessing(false)

      // Navigate to Home screen even on error
      navigation.navigate("Home")

      // Show error alert after navigation
      setTimeout(() => {
        Alert.alert("Error", "Failed to log hydration. Please try again.")
      }, 300)
    }
  }

  if (!permission) {
    return (
      <Screen preset="fixed" contentContainerStyle={themed($screenContentContainer)}>
        <ActivityIndicator size="large" />
      </Screen>
    )
  }

  if (!permission.granted) {
    return (
      <Screen preset="fixed" contentContainerStyle={themed($screenContentContainer)}>
        <Text preset="heading" text="Camera Permission Required" />
        <Text text="We need camera access to scan your water bottle." />
        <Button text="Grant Permission" onPress={requestPermission} />
      </Screen>
    )
  }

  return (
    <Screen preset="fixed" contentContainerStyle={themed($screenContentContainer)}>
      <View style={themed($cameraContainer)}>
        {imageUri ? (
          <View style={themed($imageContainer)}>
            <Image source={{ uri: imageUri }} style={themed($previewImage)} />
            {isProcessing && (
              <View style={themed($processingOverlay)}>
                <ActivityIndicator size="large" color={theme.colors.palette.accent500} />
                <Text text="Processing..." style={themed($processingText)} />
              </View>
            )}

            {!isProcessing && estimatedVolume && (
              <View style={themed($detectionInfo)}>
                <Text
                  preset="subheading"
                  text={isVerification ? "Empty Bottle Detected" : "Bottle Detected"}
                />
                {bottleType ? <Text text={`Type: ${bottleType}`} /> : null}

                <Text preset="heading" text={`Volume: ${estimatedVolume}ml`} />
                {detectionConfidence !== null && (
                  <Text
                    text={`Confidence: ${Math.round(detectionConfidence * 100)}%`}
                    style={
                      detectionConfidence < 0.5
                        ? { color: theme.colors.palette.angry500 }
                        : undefined
                    }
                  />
                )}
              </View>
            )}
          </View>
        ) : (
          <CameraView
            ref={cameraRef}
            style={themed($camera)}
            facing={facing}
            onCameraReady={() => console.log("Camera ready")}
          >
            <View style={themed($cameraOverlay)}>
              <Text
                preset="heading"
                text={isVerification ? "Scan Empty Bottle" : "Scan Your Bottle"}
              />
              <Text
                text={
                  isVerification
                    ? "Take a photo showing the bottle is empty"
                    : "Point camera at your water bottle"
                }
              />
            </View>
          </CameraView>
        )}
      </View>

      <View style={themed($controls)}>
        {imageUri ? (
          <>
            <View style={themed($buttonRow)}>
              <Button
                text="Retake"
                onPress={() => {
                  setImageUri(null)
                  setEstimatedVolume(null)
                  setBottleType(null)
                  setWaterLevel(null)
                  setDetectionConfidence(null)
                }}
                style={themed($button)}
                preset="reversed"
              />
              {estimatedVolume && (
                <Button
                  text={isVerification ? "Confirm Empty" : "Confirm & Verify"}
                  onPress={handleConfirm}
                  style={themed($button)}
                  disabled={isProcessing}
                />
              )}
            </View>
          </>
        ) : (
          <>
            <Button
              text="Take Photo"
              onPress={handleTakePicture}
              style={themed($button)}
              preset="default"
            />
            <Button
              text="Choose from Gallery"
              onPress={handlePickImage}
              style={themed($button)}
              preset="reversed"
            />
            <Button
              text="Flip Camera"
              onPress={() => setFacing(facing === "back" ? "front" : "back")}
              style={themed($button)}
              preset="reversed"
            />
          </>
        )}
      </View>
    </Screen>
  )
}

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  padding: spacing.md,
})

const $cameraContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  marginBottom: 16,
})

const $camera: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $cameraOverlay: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.5)",
  justifyContent: "center",
  alignItems: "center",
  padding: spacing.lg,
})

const $imageContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  position: "relative",
})

const $previewImage: ThemedStyle<ImageStyle> = () => ({
  width: "100%",
  height: "100%",
  resizeMode: "contain",
})

const $processingOverlay: ThemedStyle<ViewStyle> = ({ colors }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.7)",
  justifyContent: "center",
  alignItems: "center",
})

const $processingText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  marginTop: 16,
  color: colors.palette.neutral100,
})

const $detectionInfo: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: colors.palette.neutral100,
  padding: spacing.lg,
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
})

const $controls: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.sm,
})

const $buttonRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  gap: spacing.sm,
})

const $button: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

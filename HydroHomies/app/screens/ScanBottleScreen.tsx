import { FC, useState, useRef, useEffect } from "react"
import { View, ViewStyle, TextStyle, Image, Alert, ActivityIndicator } from "react-native"
import { Text } from "@/components/Text"
import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { CameraView, useCameraPermissions } from "expo-camera"
import * as ImagePicker from "expo-image-picker"
import { databaseService } from "@/services/firebase/database"
import { useAuth } from "@/context/AuthContext"
import { authService } from "@/services/firebase/auth"
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
      // TODO: Integrate ML model here to:
      // 1. Detect bottle type (label reading or visual estimation)
      // 2. Classify water level (Full, Half, Low)
      // 3. Estimate volume

      // Simulated detection (replace with actual ML model)
      const simulatedBottleType = detectBottleTypeSimulated(uri)
      const simulatedLevel = detectWaterLevelSimulated(uri)
      const simulatedVolume = estimateVolumeSimulated(simulatedBottleType, simulatedLevel)

      setBottleType(simulatedBottleType)
      setEstimatedVolume(simulatedVolume)
    } catch (error) {
      console.error("Error processing image:", error)
      Alert.alert("Error", "Failed to process image. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Placeholder functions - to be replaced with actual ML model
  const detectBottleTypeSimulated = (uri: string): string => {
    // TODO: Use ML model or label detection API
    return "SmartWater 1L"
  }

  const detectWaterLevelSimulated = (uri: string): "full" | "half" | "low" | "empty" => {
    // TODO: Use ML model to classify water level
    return isVerification ? "empty" : "full"
  }

  const estimateVolumeSimulated = (
    type: string,
    level: "full" | "half" | "low" | "empty",
  ): number => {
    // Parse volume from bottle type (e.g., "SmartWater 1L" -> 1000ml)
    const volumeMatch = type.match(/(\d+(?:\.\d+)?)\s*(L|l|ml|ML)/i)
    if (volumeMatch) {
      let volume = parseFloat(volumeMatch[1])
      if (volumeMatch[2].toLowerCase() === "l") {
        volume *= 1000
      }

      // Adjust based on water level
      if (level === "full") return Math.round(volume)
      if (level === "half") return Math.round(volume * 0.5)
      if (level === "low") return Math.round(volume * 0.25)
      return 0
    }

    // Default estimation
    return isVerification ? 0 : 500
  }

  const handleConfirm = async () => {
    if (!estimatedVolume || estimatedVolume === 0) {
      Alert.alert("Error", "Could not detect water volume. Please try again.")
      return
    }

    if (isVerification) {
      // Verify empty bottle - complete the hydration entry
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

  const completeHydrationEntry = async () => {
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

      // Check for overdrinking
      const todayIntake = await databaseService.getUserHydrationToday(user.uid)
      const totalAfter = todayIntake + (estimatedVolume || 0)
      const shouldFlag = totalAfter > profile.stats.dailyWaterGoal * 1.5

      if (shouldFlag) {
        Alert.alert("⚠️ Slow Down!", "You're drinking a lot today! Stay safe and hydrated.")
      }

      // Add hydration entry
      await databaseService.addHydrationEntry({
        userId: user.uid,
        amount: estimatedVolume || 0,
        bottleType: bottleType || undefined,
        beforeImageUri: route.params?.initialImageUri,
        afterImageUri: imageUri || undefined,
        verified: true,
      })

      // Update pet
      const pet = await databaseService.getPet(user.uid)
      if (pet) {
        const petUpdates = updatePetAfterHydration(pet, estimatedVolume || 0)
        await databaseService.updatePet(user.uid, petUpdates)
      }

      Alert.alert("Success! 💧", `Logged ${estimatedVolume}ml of water!`, [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ])
    } catch (error) {
      console.error("Error completing hydration entry:", error)
      Alert.alert("Error", "Failed to log hydration. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSkipVerification = () => {
    Alert.alert(
      "Skip Verification?",
      "Verification helps prevent cheating. Are you sure you want to skip?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Skip",
          onPress: () => {
            if (estimatedVolume) {
              completeHydrationEntry()
            }
          },
        },
      ],
    )
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
                {bottleType && <Text text={`Type: ${bottleType}`} />}
                <Text preset="heading" text={`Volume: ${estimatedVolume}ml`} />
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
            {isVerification && (
              <Button
                text="Skip Verification"
                onPress={handleSkipVerification}
                style={themed($skipButton)}
                preset="reversed"
              />
            )}
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

const $previewImage: ThemedStyle<ViewStyle> = () => ({
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

const $skipButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
})

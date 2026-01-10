import { FC, useState } from "react"
import { View, ViewStyle, TextStyle, ScrollView, Alert } from "react-native"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { calculateDailyWaterGoal, type UserStats } from "@/utils/waterGoalCalculator"
import { useAuth } from "@/context/AuthContext"
import { databaseService } from "@/services/firebase/database"
import { authService } from "@/services/firebase/auth"

interface OnboardingScreenProps extends AppStackScreenProps<"Onboarding"> {}

export const OnboardingScreen: FC<OnboardingScreenProps> = ({ navigation }) => {
  const { themed } = useAppTheme()
  const { user } = useAuth()

  const [height, setHeight] = useState("")
  const [weight, setWeight] = useState("")
  const [age, setAge] = useState("")
  const [activityLevel, setActivityLevel] = useState<UserStats["activityLevel"]>("moderate")
  const [petName, setPetName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [calculatedGoal, setCalculatedGoal] = useState<number | null>(null)

  const handleCalculateGoal = () => {
    const heightNum = parseFloat(height)
    const weightNum = parseFloat(weight)
    const ageNum = parseFloat(age)

    if (!heightNum || !weightNum || !ageNum) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    if (heightNum < 50 || heightNum > 250) {
      Alert.alert("Error", "Please enter a valid height (50-250 cm)")
      return
    }

    if (weightNum < 20 || weightNum > 300) {
      Alert.alert("Error", "Please enter a valid weight (20-300 kg)")
      return
    }

    if (ageNum < 1 || ageNum > 120) {
      Alert.alert("Error", "Please enter a valid age (1-120)")
      return
    }

    const stats: UserStats = {
      height: heightNum,
      weight: weightNum,
      age: ageNum,
      activityLevel,
    }

    const goal = calculateDailyWaterGoal(stats)
    setCalculatedGoal(goal)
  }

  const handleComplete = async () => {
    if (!calculatedGoal) {
      Alert.alert("Error", "Please calculate your water goal first")
      return
    }

    if (!petName.trim()) {
      Alert.alert("Error", "Please name your pet")
      return
    }

    setIsLoading(true)

    try {
      const user = authService.getCurrentUser()
      if (!user) {
        throw new Error("User not authenticated")
      }

      const heightNum = parseFloat(height)
      const weightNum = parseFloat(weight)
      const ageNum = parseFloat(age)

      const stats: UserStats = {
        height: heightNum,
        weight: weightNum,
        age: ageNum,
        activityLevel,
      }

      // Update user profile with stats
      await databaseService.updateUserProfile(user.uid, {
        stats: {
          ...stats,
          dailyWaterGoal: calculatedGoal,
        },
      })

      // Initialize pet
      await databaseService.initializePet(user.uid, petName.trim())

      // Navigate to home
      navigation.replace("Home")
    } catch (error) {
      console.error("Error completing onboarding:", error)
      Alert.alert("Error", "Failed to complete onboarding. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Screen preset="scroll" contentContainerStyle={themed($screenContentContainer)}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text preset="heading" tx="onboardingScreen:title" style={themed($title)} />
        <Text tx="onboardingScreen:subtitle" style={themed($subtitle)} />

        <Text preset="subheading" text="Your Stats" style={themed($sectionTitle)} />

        <TextField
          label="Height (cm)"
          value={height}
          onChangeText={setHeight}
          keyboardType="numeric"
          containerStyle={themed($textField)}
          placeholder="175"
        />

        <TextField
          label="Weight (kg)"
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
          containerStyle={themed($textField)}
          placeholder="70"
        />

        <TextField
          label="Age"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
          containerStyle={themed($textField)}
          placeholder="25"
        />

        <Text preset="subheading" text="Activity Level" style={themed($sectionTitle)} />
        <View style={themed($activityButtons)}>
          {(["low", "moderate", "high", "very_high"] as const).map((level) => (
            <Button
              key={level}
              text={level.charAt(0).toUpperCase() + level.slice(1).replace("_", " ")}
              preset={activityLevel === level ? "default" : "reversed"}
              onPress={() => setActivityLevel(level)}
              style={themed($activityButton)}
            />
          ))}
        </View>

        {calculatedGoal && (
          <View style={themed($goalContainer)}>
            <Text preset="subheading" text="Your Daily Water Goal" />
            <Text preset="heading" text={`${(calculatedGoal / 1000).toFixed(1)} L`} />
            <Text size="sm" text="or" />
            <Text preset="heading" text={`${calculatedGoal} ml`} />
          </View>
        )}

        <Button
          text="Calculate Goal"
          onPress={handleCalculateGoal}
          style={themed($button)}
          preset="reversed"
        />

        <Text preset="subheading" text="Name Your Pet" style={themed($sectionTitle)} />
        <TextField
          label="Pet Name"
          value={petName}
          onChangeText={setPetName}
          containerStyle={themed($textField)}
          placeholder="Aqua"
        />

        <Button
          text="Complete Setup"
          onPress={handleComplete}
          style={themed($button)}
          disabled={isLoading || !calculatedGoal || !petName.trim()}
          preset="default"
        />
      </ScrollView>
    </Screen>
  )
}

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.xl,
  paddingHorizontal: spacing.lg,
})

const $title: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
})

const $subtitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.xl,
})

const $sectionTitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginTop: spacing.lg,
  marginBottom: spacing.md,
})

const $textField: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
})

const $activityButtons: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  flexWrap: "wrap",
  gap: spacing.sm,
  marginBottom: spacing.md,
})

const $activityButton: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  minWidth: "45%",
})

const $goalContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.neutral100,
  padding: spacing.lg,
  borderRadius: 12,
  alignItems: "center",
  marginVertical: spacing.lg,
})

const $button: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
})

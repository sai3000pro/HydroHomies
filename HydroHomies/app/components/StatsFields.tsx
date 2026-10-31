import { FC } from "react"
import { View, ViewStyle } from "react-native"

import { Dropdown } from "@/components/Dropdown"
import { TextField } from "@/components/TextField"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import {
  calculateDailyWaterGoal,
  validateStats,
  type ActivityLevel,
  type Sex,
  type UserStats,
} from "@/utils/waterGoalCalculator"

export interface StatsFormValues {
  sex: Sex
  age: string
  height: string
  weight: string
  activityLevel: ActivityLevel
}

export const DEFAULT_STATS_FORM: StatsFormValues = {
  sex: "male",
  age: "25",
  height: "170",
  weight: "70",
  activityLevel: "moderate",
}

const SEX_OPTIONS: { label: string; value: Sex }[] = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
]

const ACTIVITY_OPTIONS: { label: string; value: ActivityLevel }[] = [
  { label: "Low", value: "low" },
  { label: "Moderate", value: "moderate" },
  { label: "High", value: "high" },
  { label: "Very High", value: "very_high" },
]

/** Converts form strings to stats. Returns an error message instead if invalid. */
export function parseStatsForm(values: StatsFormValues): { stats: UserStats } | { error: string } {
  const candidate = {
    sex: values.sex,
    activityLevel: values.activityLevel,
    age: Number(values.age),
    height: Number(values.height),
    weight: Number(values.weight),
  }
  const error = validateStats(candidate)
  return error ? { error } : { stats: candidate }
}

/** Daily goal preview for the current form values, or null while invalid */
export function previewGoal(values: StatsFormValues): number | null {
  const parsed = parseStatsForm(values)
  return "stats" in parsed ? calculateDailyWaterGoal(parsed.stats) : null
}

interface StatsFieldsProps {
  values: StatsFormValues
  onChange: (values: StatsFormValues) => void
}

export const StatsFields: FC<StatsFieldsProps> = ({ values, onChange }) => {
  const { themed } = useAppTheme()
  const set =
    <K extends keyof StatsFormValues>(key: K) =>
    (v: StatsFormValues[K]) =>
      onChange({ ...values, [key]: v })

  return (
    <View style={themed($container)}>
      <View style={themed($row)}>
        <Dropdown
          label="Sex"
          options={SEX_OPTIONS}
          value={values.sex}
          onSelect={(v) => set("sex")(v as Sex)}
          containerStyle={$half}
        />
        <TextField
          label="Age"
          value={values.age}
          onChangeText={set("age")}
          keyboardType="number-pad"
          containerStyle={$half}
          placeholder="25"
        />
      </View>
      <View style={themed($row)}>
        <TextField
          label="Height (cm)"
          value={values.height}
          onChangeText={set("height")}
          keyboardType="decimal-pad"
          containerStyle={$half}
          placeholder="170"
        />
        <TextField
          label="Weight (kg)"
          value={values.weight}
          onChangeText={set("weight")}
          keyboardType="decimal-pad"
          containerStyle={$half}
          placeholder="70"
        />
      </View>
      <Dropdown
        label="Activity Level"
        options={ACTIVITY_OPTIONS}
        value={values.activityLevel}
        onSelect={(v) => set("activityLevel")(v as ActivityLevel)}
      />
    </View>
  )
}

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({ width: "100%", gap: spacing.sm })

const $row: ThemedStyle<ViewStyle> = () => ({
  width: "100%",
  flexDirection: "row",
  justifyContent: "space-between",
})

const $half: ViewStyle = { width: "48%" }

import { FC, useEffect, useState } from "react"
import { Linking, TextStyle, View, ViewStyle } from "react-native"

import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { ScreenHeader } from "@/components/ScreenHeader"
import { Text } from "@/components/Text"
import { Switch } from "@/components/Toggle/Switch"
import { useSignedInUser } from "@/context/AuthContext"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { databaseService } from "@/services/firebase/database"
import {
  loadReminderSettings,
  reminderTimes,
  remindersSupported,
  requestReminderPermission,
  saveReminderSettings,
  syncReminders,
  type ReminderSettings,
} from "@/services/reminders"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface RemindersScreenProps extends AppStackScreenProps<"Reminders"> {}

const INTERVALS = [1, 2, 3, 4]

const hourLabel = (h: number) =>
  new Date(2000, 0, 1, h).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })

export const RemindersScreen: FC<RemindersScreenProps> = ({ navigation }) => {
  const { themed, theme } = useAppTheme()
  const { profile, pet } = useSignedInUser()

  const [settings, setSettings] = useState<ReminderSettings>(loadReminderSettings)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [error, setError] = useState("")
  const [goalReached, setGoalReached] = useState(false)

  const goalMl = profile.stats?.dailyWaterGoal ?? 2500
  useEffect(
    () =>
      databaseService.subscribeToDailySummary(profile.uid, (s) =>
        setGoalReached((s?.totalMl ?? 0) >= goalMl),
      ),
    [profile.uid, goalMl],
  )

  // Save and reschedule on every change
  useEffect(() => {
    saveReminderSettings(settings)
    syncReminders(pet?.name ?? "", goalReached).catch((e) => setError(e?.message ?? String(e)))
  }, [settings, pet?.name, goalReached])

  async function setEnabled(enabled: boolean) {
    setError("")
    if (enabled && !(await requestReminderPermission())) {
      setPermissionDenied(true)
      return
    }
    setPermissionDenied(false)
    setSettings((s) => ({ ...s, enabled }))
  }

  const update = (patch: Partial<ReminderSettings>) => setSettings((s) => ({ ...s, ...patch }))
  const next = reminderTimes(settings, goalReached)[0]

  if (!remindersSupported) {
    return (
      <Screen preset="scroll" contentContainerStyle={themed($container)} safeAreaEdges={["top"]}>
        <ScreenHeader title="⏰ Reminders" onBack={() => navigation.goBack()} />
        <Text text="Reminders work in the Android and iOS apps, not on the web." />
      </Screen>
    )
  }

  return (
    <Screen
      preset="scroll"
      contentContainerStyle={themed($container)}
      safeAreaEdges={["top", "bottom"]}
    >
      <ScreenHeader title="⏰ Reminders" onBack={() => navigation.goBack()} />

      <View style={themed($card)}>
        <Switch
          label="Remind me to drink water"
          value={settings.enabled}
          onValueChange={setEnabled}
          labelPosition="left"
        />
        {permissionDenied && (
          <View style={themed($gap)}>
            <Text
              size="sm"
              style={{ color: theme.colors.error }}
              text="Notifications are turned off for HydroHype. Turn them on in your phone's settings."
            />
            <Button text="Open settings" onPress={() => Linking.openSettings()} />
          </View>
        )}
        {!!error && <Text size="sm" style={{ color: theme.colors.error }} text={error} />}
      </View>

      <View style={[themed($card), !settings.enabled && $disabled]}>
        <Text preset="subheading" text="How often" />
        <View style={themed($row)}>
          {INTERVALS.map((h) => (
            <Button
              key={h}
              text={`${h} h`}
              style={$flex}
              preset={settings.intervalHours === h ? "reversed" : "default"}
              disabled={!settings.enabled}
              onPress={() => update({ intervalHours: h })}
            />
          ))}
        </View>

        <Text preset="subheading" text="Between" />
        <HourStepper
          label="From"
          hour={settings.startHour}
          disabled={!settings.enabled}
          onChange={(h) => update({ startHour: h, endHour: Math.max(h, settings.endHour) })}
        />
        <HourStepper
          label="Until"
          hour={settings.endHour}
          disabled={!settings.enabled}
          onChange={(h) => update({ endHour: h, startHour: Math.min(h, settings.startHour) })}
        />

        {settings.enabled && (
          <Text
            size="sm"
            style={themed($dim)}
            text={
              next
                ? `Next reminder: ${next.toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })}. Reminders stop for the day once you hit your goal.`
                : "No reminders scheduled."
            }
          />
        )}
      </View>
    </Screen>
  )
}

const HourStepper: FC<{
  label: string
  hour: number
  disabled: boolean
  onChange: (h: number) => void
}> = ({ label, hour, disabled, onChange }) => {
  const { themed } = useAppTheme()
  return (
    <View style={themed($row)}>
      <Text text={label} style={$label} />
      <Button
        text="−"
        disabled={disabled || hour <= 0}
        onPress={() => onChange(hour - 1)}
        accessibilityLabel={`${label} earlier`}
      />
      <Text preset="bold" text={hourLabel(hour)} style={$hour} />
      <Button
        text="+"
        disabled={disabled || hour >= 23}
        onPress={() => onChange(hour + 1)}
        accessibilityLabel={`${label} later`}
      />
    </View>
  )
}

const $flex: ViewStyle = { flex: 1 }
const $disabled: ViewStyle = { opacity: 0.5 }
const $label: TextStyle = { width: 56 }
const $hour: TextStyle = { flex: 1, textAlign: "center" }

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.lg,
  gap: spacing.lg,
})

const $card: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  padding: spacing.lg,
  gap: spacing.md,
})

const $row: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
})

const $gap: ThemedStyle<ViewStyle> = ({ spacing }) => ({ gap: spacing.sm })

const $dim: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.textDim })

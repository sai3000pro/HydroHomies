/**
 * Local "drink water" reminders. Nothing goes through a server.
 *
 * Reminders are scheduled as one-off notifications for the next few days
 * rather than repeating ones, so today's remaining reminders can be dropped
 * once the daily goal is reached. Call syncReminders after each change
 * (app open, drink logged, settings saved) to refresh the schedule.
 */
import { Platform } from "react-native"
import * as Notifications from "expo-notifications"

import { load, save } from "@/utils/storage"

export interface ReminderSettings {
  enabled: boolean
  intervalHours: number
  /** First reminder of the day, 0-23 */
  startHour: number
  /** No reminders after this hour, 0-23 */
  endHour: number
}

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: false,
  intervalHours: 2,
  startHour: 9,
  endHour: 21,
}

const STORAGE_KEY = "reminders.v1"
const CHANNEL_ID = "reminders"
/** Days ahead to schedule. iOS keeps at most 64 pending notifications. */
const DAYS_AHEAD = 3

export const remindersSupported = Platform.OS !== "web"

export function loadReminderSettings(): ReminderSettings {
  return { ...DEFAULT_REMINDER_SETTINGS, ...(load<Partial<ReminderSettings>>(STORAGE_KEY) ?? {}) }
}

export function saveReminderSettings(settings: ReminderSettings) {
  save(STORAGE_KEY, settings)
}

/** Times to remind, after `now`. Skips the rest of today if the goal is already reached. */
export function reminderTimes(
  settings: ReminderSettings,
  goalReachedToday: boolean,
  now: Date = new Date(),
): Date[] {
  if (!settings.enabled || settings.intervalHours <= 0) return []
  const times: Date[] = []
  for (let day = goalReachedToday ? 1 : 0; day < DAYS_AHEAD; day++) {
    for (let h = settings.startHour; h <= settings.endHour; h += settings.intervalHours) {
      const t = new Date(now.getFullYear(), now.getMonth(), now.getDate() + day, h, 0, 0, 0)
      if (t > now) times.push(t)
    }
  }
  return times
}

let handlerSet = false
async function prepare() {
  if (!handlerSet) {
    handlerSet = true
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    })
  }
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Drink reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    })
  }
}

/** Asks for notification permission. Returns whether it was granted. */
export async function requestReminderPermission(): Promise<boolean> {
  if (!remindersSupported) return false
  await prepare()
  const current = await Notifications.getPermissionsAsync()
  if (current.granted) return true
  const asked = await Notifications.requestPermissionsAsync()
  return asked.granted
}

const MESSAGES = [
  "Time for a sip! 💧",
  "A glass of water now keeps the thirst away.",
  "Your pet is counting on you. Drink up!",
  "Quick water break?",
]

/** Cancels every scheduled reminder (e.g. on logout). Settings are kept. */
export async function cancelReminders() {
  if (remindersSupported) await Notifications.cancelAllScheduledNotificationsAsync()
}

/** Replaces all scheduled reminders. Safe to call often. */
export async function syncReminders(petName: string, goalReachedToday: boolean): Promise<number> {
  if (!remindersSupported) return 0
  await Notifications.cancelAllScheduledNotificationsAsync()
  const settings = loadReminderSettings()
  if (!settings.enabled) return 0
  if (!(await Notifications.getPermissionsAsync()).granted) return 0
  await prepare()

  const times = reminderTimes(settings, goalReachedToday)
  for (const [i, date] of times.entries()) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: petName ? `${petName} is thirsty!` : "Stay hydrated!",
        body: MESSAGES[i % MESSAGES.length],
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
        channelId: CHANNEL_ID,
      },
    })
  }
  return times.length
}

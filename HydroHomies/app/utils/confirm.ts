import { Alert, Platform } from "react-native"

/**
 * Asks the user to confirm a destructive action. Resolves true if they confirm.
 * React Native's Alert.alert does nothing on web, so web uses window.confirm.
 */
export function confirmAction(
  title: string,
  message: string,
  confirmText: string,
): Promise<boolean> {
  if (Platform.OS === "web") return Promise.resolve(window.confirm(`${title}\n\n${message}`))
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
      { text: confirmText, style: "destructive", onPress: () => resolve(true) },
    ]),
  )
}

/** Shows a message. Alert.alert does nothing on web, so web uses window.alert. */
export function notify(title: string, message: string) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${message}`)
  else Alert.alert(title, message)
}

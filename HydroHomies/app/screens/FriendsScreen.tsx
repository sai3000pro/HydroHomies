import { FC, useEffect, useRef, useState } from "react"
import { ActivityIndicator, Pressable, Share, TextStyle, View, ViewStyle } from "react-native"

import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { useSignedInUser } from "@/context/AuthContext"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import {
  databaseService,
  FRIEND_CODE_LENGTH,
  normalizeFriendCode,
  type Friend,
} from "@/services/firebase/database"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { confirmAction } from "@/utils/confirm"
import { useFriends } from "@/utils/useFriends"

interface FriendsScreenProps extends AppStackScreenProps<"Friends"> {}

export const FriendsScreen: FC<FriendsScreenProps> = ({ navigation }) => {
  const { themed, theme } = useAppTheme()
  const { profile } = useSignedInUser()
  const { friends, error: friendsError } = useFriends(profile.uid)

  const [myCode, setMyCode] = useState(profile.friendCode ?? "")
  const [codeError, setCodeError] = useState("")
  const [input, setInput] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null)
  const creatingCode = useRef(false)

  useEffect(() => {
    if (profile.friendCode) return setMyCode(profile.friendCode)
    // Profile snapshots re-run this effect; only create the code once
    if (creatingCode.current) return
    creatingCode.current = true
    databaseService
      .ensureFriendCode(profile)
      .then(setMyCode)
      .catch((e) => {
        creatingCode.current = false
        setCodeError(e?.message ?? "Couldn't load your code.")
      })
  }, [profile])

  async function addFriend() {
    setIsAdding(true)
    setMessage(null)
    try {
      const name = await databaseService.addFriendByCode(profile, input)
      setInput("")
      setMessage({ text: `${name} is now your friend! 🎉`, isError: false })
    } catch (e: any) {
      setMessage({ text: e?.message ?? "Couldn't add that friend.", isError: true })
    } finally {
      setIsAdding(false)
    }
  }

  async function confirmRemove(friend: Friend) {
    const ok = await confirmAction(
      "Remove friend?",
      `${friend.displayName} will be removed from your friends.`,
      "Remove",
    )
    if (!ok) return
    databaseService
      .removeFriend(profile.uid, friend.friendId)
      .catch((e) => setMessage({ text: e?.message ?? "Couldn't remove.", isError: true }))
  }

  const shareCode = () =>
    Share.share({ message: `Add me on HydroHype! My friend code is ${myCode} 💧` })

  const canAdd = normalizeFriendCode(input).length === FRIEND_CODE_LENGTH && !isAdding

  return (
    <Screen
      preset="scroll"
      contentContainerStyle={themed($container)}
      safeAreaEdges={["top", "bottom"]}
    >
      <View style={themed($header)}>
        <Text preset="heading" text="👥 Friends" style={$flex} />
        <Button text="Close" onPress={() => navigation.goBack()} />
      </View>

      <View style={themed($card)}>
        <Text preset="subheading" text="Your friend code" />
        {myCode ? (
          <>
            <Text preset="heading" text={myCode} style={themed($code)} selectable />
            <Button text="Share code" onPress={shareCode} />
          </>
        ) : codeError ? (
          <Text style={{ color: theme.colors.error }} text={codeError} />
        ) : (
          <ActivityIndicator color={theme.colors.tint} />
        )}
        <Text
          size="xs"
          style={themed($dim)}
          text="Anyone with your code can add you. You'll both see each other on the friends leaderboard."
        />
      </View>

      <View style={themed($card)}>
        <Text preset="subheading" text="Add a friend" />
        <TextField
          value={input}
          onChangeText={setInput}
          placeholder="ABC234"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={FRIEND_CODE_LENGTH + 2}
          onSubmitEditing={() => canAdd && addFriend()}
        />
        <Button
          text={isAdding ? "Adding…" : "Add friend"}
          preset="reversed"
          disabled={!canAdd}
          onPress={addFriend}
        />
        {message && (
          <Text
            size="sm"
            text={message.text}
            style={{
              color: message.isError ? theme.colors.error : theme.colors.palette.success500,
            }}
          />
        )}
      </View>

      <View style={themed($card)}>
        <Text
          preset="subheading"
          text={friends ? `Your friends (${friends.length})` : "Your friends"}
        />
        {!!friendsError && <Text style={{ color: theme.colors.error }} text={friendsError} />}
        {friends === null && !friendsError ? (
          <ActivityIndicator color={theme.colors.tint} />
        ) : friends?.length === 0 ? (
          <Text style={themed($dim)} text="No friends yet. Share your code to get started!" />
        ) : (
          friends?.map((f) => (
            <View key={f.friendId} style={themed($row)}>
              <Pressable
                style={$flex}
                accessibilityRole="button"
                accessibilityLabel={`View ${f.displayName}'s pet`}
                onPress={() =>
                  navigation.navigate("FriendPet", {
                    userId: f.friendId,
                    displayName: f.displayName,
                  })
                }
              >
                <Text preset="bold" text={f.displayName} />
                <Text size="xs" style={themed($dim)} text="Tap to see their pet" />
              </Pressable>
              <Button
                text="Remove"
                style={themed($smallButton)}
                textStyle={$small}
                onPress={() => confirmRemove(f)}
              />
            </View>
          ))
        )}
      </View>
    </Screen>
  )
}

const $flex: ViewStyle = { flex: 1 }
const $small: TextStyle = { fontSize: 14 }

const $container: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.lg,
  gap: spacing.lg,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
})

const $card: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  backgroundColor: colors.palette.neutral100,
  borderRadius: 16,
  padding: spacing.lg,
  gap: spacing.sm,
})

const $code: ThemedStyle<TextStyle> = ({ colors }) => ({
  letterSpacing: 6,
  textAlign: "center",
  color: colors.palette.water500,
})

const $row: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: spacing.sm,
  paddingVertical: spacing.sm,
  borderBottomWidth: 1,
  borderBottomColor: colors.separator,
})

const $smallButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  minHeight: 36,
  paddingVertical: spacing.xxs,
  paddingHorizontal: spacing.sm,
})

const $dim: ThemedStyle<TextStyle> = ({ colors }) => ({ color: colors.textDim })

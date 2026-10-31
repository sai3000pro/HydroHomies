import { FC, useState } from "react"
import { Image, ImageStyle, Pressable, TextStyle, View, ViewStyle } from "react-native"

import { Button } from "@/components/Button"
import { Container } from "@/components/Container"
import { PET_IMAGES } from "@/components/Pet"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { useSignedInUser } from "@/context/AuthContext"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { databaseService } from "@/services/firebase/database"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { PET_SPECIES, SPECIES_DISPLAY_NAMES, type PetSpecies } from "@/utils/petEvolution"

interface PetSelectScreenProps extends AppStackScreenProps<"PetSelect"> {}

export const PetSelectScreen: FC<PetSelectScreenProps> = () => {
  const { themed, theme } = useAppTheme()
  const { user, profile } = useSignedInUser()

  const [species, setSpecies] = useState<PetSpecies | null>(null)
  const [name, setName] = useState("")
  const [errorText, setErrorText] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function adopt() {
    if (!species) return setErrorText("Pick a companion first.")
    if (!name.trim()) return setErrorText("Give your new friend a name.")
    setErrorText("")
    setIsLoading(true)
    try {
      // The navigator switches to Home once the pet snapshot arrives
      await databaseService.adoptPet(user.uid, profile.username, species, name.trim())
    } catch (e: any) {
      setErrorText(e?.message ?? "Could not complete adoption. Try again.")
      setIsLoading(false)
    }
  }

  return (
    <Screen
      preset="auto"
      contentContainerStyle={themed($screenContentContainer)}
      safeAreaEdges={["top", "bottom"]}
    >
      <Container>
        <View style={themed($content)}>
          <Text preset="heading" text="Choose Your Partner!" style={themed($centered)} />

          <View style={themed($petsRow)}>
            {PET_SPECIES.map((s) => (
              <Pressable
                key={s}
                onPress={() => setSpecies(s)}
                accessibilityRole="button"
                accessibilityState={{ selected: species === s }}
                accessibilityLabel={SPECIES_DISPLAY_NAMES[s]}
                style={[
                  themed($petOption),
                  species === s && { borderColor: theme.colors.palette.water700 },
                ]}
              >
                <Image style={$petImage} source={PET_IMAGES[s]} />
                <Text size="xs" text={SPECIES_DISPLAY_NAMES[s]} style={themed($centered)} />
              </Pressable>
            ))}
          </View>

          {species && (
            <>
              <Text
                preset="subheading"
                text={`You picked ${SPECIES_DISPLAY_NAMES[species]}!`}
                style={themed($centered)}
              />
              <TextField
                value={name}
                onChangeText={setName}
                containerStyle={themed($textField)}
                autoCorrect={false}
                maxLength={20}
                label="Name"
                placeholder="Give them a name"
              />
              <Button
                testID="adopt-button"
                text="Adopt"
                style={themed($button)}
                preset="reversed"
                onPress={adopt}
                disabled={isLoading}
              />
            </>
          )}
          {!!errorText && <Text text={errorText} style={themed($error)} />}
        </View>
      </Container>
    </Screen>
  )
}

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flexGrow: 1,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.palette.water300,
})

const $content: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  gap: spacing.md,
  paddingVertical: spacing.lg,
})

const $centered: ThemedStyle<TextStyle> = () => ({ textAlign: "center" })

const $petsRow: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-between",
  gap: spacing.xs,
})

const $petOption: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  padding: spacing.xs,
  borderRadius: 16,
  borderWidth: 3,
  borderColor: "transparent",
})

const $petImage: ImageStyle = { width: 90, height: 90, resizeMode: "contain" }

const $textField: ThemedStyle<ViewStyle> = () => ({ width: "100%" })

const $button: ThemedStyle<ViewStyle> = () => ({ minWidth: 120, borderRadius: 33 })

const $error: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.error,
  textAlign: "center",
})

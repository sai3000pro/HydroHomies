import { FC, useState } from "react"
// eslint-disable-next-line no-restricted-imports
import { ViewStyle, Image, Text, View, ImageStyle, Pressable, Alert, TextStyle } from "react-native"
import { doc, setDoc } from "firebase/firestore"

import { Button } from "@/components/Button"
import { Container } from "@/components/Container"
import { Screen } from "@/components/Screen"
import { TextField } from "@/components/TextField"
import { useAuth } from "@/context/AuthContext"
import type { AppStackScreenProps } from "@/navigators/navigationTypes"
import { authService } from "@/services/firebase/auth"
import { db } from "@/services/firebase/config"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface PetSelectScreenProps extends AppStackScreenProps<"PetSelect"> {}

const defaultPets = [
  {
    image: require("../../assets/images/basic-pet-1.png"),
    value: "elephant",
    display: "Hydrophant",
  },
  {
    image: require("../../assets/images/basic-pet-2.png"),
    value: "alien",
    display: "Agualien",
  },
  {
    image: require("../../assets/images/basic-pet-3.png"),
    value: "sphele",
    display: "Sphele",
  },
]

export const PetSelectScreen: FC<PetSelectScreenProps> = ({ navigation }) => {
  const { themed } = useAppTheme()
  const { setPet, setUserProfile, userProfile } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState("")
  const [selectedPet, setSelectedPet] = useState("")
  const [selectedPetDisplay, setSelectedPetDisplay] = useState("")

  async function adopt() {
    // 1. Validation
    if (!selectedPet) {
      Alert.alert("Missing Companion", "Please select a pet to adopt!")
      return
    }

    if (!name.trim()) {
      Alert.alert("Missing Name", "Please give your new friend a name!")
      return
    }

    setIsLoading(true)

    try {
      // 2. Get the current logged-in user
      const user = authService.getCurrentUser()

      if (!user) {
        throw new Error("No user logged in.")
      }

      // 3. Save Pet Data to Firestore
      const pet = {
        type: selectedPet,
        name: name.trim(),
        level: 1,
        currentXp: 0,
        maxXp: 100,
        health: 100,
        userId: user.uid,
        lastFed: null,
        adoptedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await setDoc(doc(db, "users", user.uid), { pet: pet }, { merge: true })

      console.log("Pet adopted successfully!")

      setPet(pet)
      setUserProfile({
        ...userProfile,
        pet: pet,
      })
      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      })
    } catch (error: any) {
      console.error("Adoption error:", error)
      Alert.alert("Error", "Could not complete adoption. Please try again.")
    } finally {
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
        <View style={themed($bigContainer)}>
          <Text style={themed($header)}>Choose Your Partner!</Text>

          <View style={themed($petsContainer)}>
            {defaultPets.map((pet) => {
              return (
                <Pressable
                  key={`${pet.value}`}
                  onPress={() => {
                    setSelectedPet(pet.value)
                    setSelectedPetDisplay(pet.display)
                  }}
                >
                  <Image style={themed($petImage)} source={pet.image} />
                </Pressable>
              )
            })}
          </View>

          {selectedPet && (
            <>
              <Text style={themed($selectionText)}>
                You selected:{"\n"}
                {selectedPetDisplay}!
              </Text>

              <TextField
                value={name}
                onChangeText={setName}
                containerStyle={themed($textField)}
                autoCapitalize="none"
                autoCorrect={false}
                label="Name"
                placeholder="Give them a name"
                placeholderTextColor="#000000"
              />

              <Button
                testID="adopt-button"
                text="Adopt"
                style={themed($tapButton)}
                preset="reversed"
                onPress={() => {
                  console.log("Button onPress handler called!")
                  adopt().catch((error) => {
                    console.error("Adopt function error:", error)
                    Alert.alert("Unexpected Error", `Adopt failed: ${error.message || error}`)
                  })
                }}
                disabled={isLoading}
              />
            </>
          )}
        </View>
      </Container>
    </Screen>
  )
}

const $screenContentContainer: ThemedStyle<ViewStyle> = () => ({
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#89DDF9",
})

const $bigContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  height: 525,
  display: "flex",
  alignItems: "center",
  flexDirection: "column",
})

const $header: ThemedStyle<TextStyle> = ({ typography }) => ({
  fontSize: 30,
  alignSelf: "center",
  textAlign: "center",
  fontFamily: typography.fonts.spaceGrotesk.medium,
})

const $petsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "flex-start",
  justifyContent: "space-between",
})

const $petImage: ThemedStyle<ImageStyle> = () => ({
  width: 100,
  resizeMode: "contain",
})

const $selectionText: ThemedStyle<TextStyle> = ({ typography }) => ({
  alignSelf: "center",
  textAlign: "center",
  fontSize: 24,
  fontFamily: typography.fonts.spaceGrotesk.normal,
})

const $textField: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: "100%",
  marginTop: spacing.sm,
})

const $tapButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: 100,
  marginTop: spacing.xl,
  borderRadius: 33,
  backgroundColor: "#D9D9D9",
})

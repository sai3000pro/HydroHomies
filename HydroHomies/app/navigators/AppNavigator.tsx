/**
 * Root navigator. Which screens exist depends on the user's state:
 *   signed out            -> Login, SignUp
 *   no body stats         -> Onboarding
 *   no pet                -> PetSelect
 *   ready                 -> Home, ScanBottle, Leaderboard, FriendPet
 * Changing state (e.g. adopting a pet) swaps the stack automatically.
 */
import { ActivityIndicator, View, ViewStyle } from "react-native"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"

import Config from "@/config"
import { useAuth } from "@/context/AuthContext"
import { ErrorBoundary } from "@/screens/ErrorScreen/ErrorBoundary"
import { FriendPetScreen } from "@/screens/FriendPetScreen"
import { HomeScreen } from "@/screens/HomeScreen"
import { LeaderboardScreen } from "@/screens/LeaderboardScreen"
import { LoginScreen } from "@/screens/LoginScreen"
import { OnboardingScreen } from "@/screens/OnboardingScreen"
import { PetSelectScreen } from "@/screens/PetSelectScreen"
import { ScanBottleScreen } from "@/screens/ScanBottleScreen"
import { SignUpScreen } from "@/screens/SignUpScreen"
import { useAppTheme } from "@/theme/context"

import type { AppStackParamList, NavigationProps } from "./navigationTypes"
import { navigationRef, useBackButtonHandler } from "./navigationUtilities"

const exitRoutes = Config.exitRoutes

const Stack = createNativeStackNavigator<AppStackParamList>()

const AppStack = () => {
  const { isAuthenticated, profile, pet, isUserDataLoading, isSigningUp } = useAuth()
  const {
    theme: { colors },
  } = useAppTheme()

  if (isAuthenticated && (isUserDataLoading || isSigningUp)) {
    return (
      <View style={[$loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    )
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        navigationBarColor: colors.background,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </>
      ) : !profile?.stats ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : !pet ? (
        <Stack.Screen name="PetSelect" component={PetSelectScreen} />
      ) : (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="ScanBottle" component={ScanBottleScreen} />
          <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
          <Stack.Screen name="FriendPet" component={FriendPetScreen} />
        </>
      )}
      {/* IGNITE_GENERATOR_ANCHOR_APP_STACK_SCREENS */}
    </Stack.Navigator>
  )
}

export const AppNavigator = (props: NavigationProps) => {
  const { navigationTheme } = useAppTheme()

  useBackButtonHandler((routeName) => exitRoutes.includes(routeName))

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme} {...props}>
      <ErrorBoundary catchErrors={Config.catchErrors}>
        <AppStack />
      </ErrorBoundary>
    </NavigationContainer>
  )
}

const $loading: ViewStyle = { flex: 1, alignItems: "center", justifyContent: "center" }

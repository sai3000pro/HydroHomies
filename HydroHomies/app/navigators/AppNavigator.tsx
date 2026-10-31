/**
 * Root navigator. Which screens exist depends on the user's state:
 *   signed out            -> Login, SignUp
 *   no body stats         -> Onboarding
 *   no pet                -> PetSelect
 *   ready                 -> Home, ScanBottle, Leaderboard, Friends, Stats, Reminders, FriendPet
 * Changing state (e.g. adopting a pet) swaps the stack automatically.
 */
import { ActivityIndicator, TextStyle, View, ViewStyle } from "react-native"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { Button } from "@/components/Button"
import { Text } from "@/components/Text"
import Config from "@/config"
import { useAuth } from "@/context/AuthContext"
import { ErrorBoundary } from "@/screens/ErrorScreen/ErrorBoundary"
import { FriendPetScreen } from "@/screens/FriendPetScreen"
import { FriendsScreen } from "@/screens/FriendsScreen"
import { HistoryScreen } from "@/screens/HistoryScreen"
import { HomeScreen } from "@/screens/HomeScreen"
import { LeaderboardScreen } from "@/screens/LeaderboardScreen"
import { LoginScreen } from "@/screens/LoginScreen"
import { OnboardingScreen } from "@/screens/OnboardingScreen"
import { PetSelectScreen } from "@/screens/PetSelectScreen"
import { RemindersScreen } from "@/screens/RemindersScreen"
import { ScanBottleScreen } from "@/screens/ScanBottleScreen"
import { SettingsScreen } from "@/screens/SettingsScreen"
import { SignUpScreen } from "@/screens/SignUpScreen"
import { StatsScreen } from "@/screens/StatsScreen"
import { useAppTheme } from "@/theme/context"

import type { AppStackParamList, NavigationProps } from "./navigationTypes"
import { navigationRef, useBackButtonHandler } from "./navigationUtilities"

const exitRoutes = Config.exitRoutes

const Stack = createNativeStackNavigator<AppStackParamList>()

const AppStack = () => {
  const {
    isAuthenticated,
    profile,
    pet,
    isUserDataLoading,
    isSigningUp,
    userDataError,
    retryUserData,
    logout,
  } = useAuth()
  const {
    theme: { colors },
  } = useAppTheme()

  if (isAuthenticated && userDataError) {
    return (
      <View style={[$loading, $gap, { backgroundColor: colors.background }]}>
        <Text preset="subheading" text="Couldn't load your account" style={$center} />
        <Text size="sm" text={userDataError} style={[$center, { color: colors.textDim }]} />
        <Button text="Try again" preset="reversed" onPress={retryUserData} />
        <Button text="Log out" onPress={() => logout()} />
      </View>
    )
  }

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
          <Stack.Screen name="Friends" component={FriendsScreen} />
          <Stack.Screen name="Stats" component={StatsScreen} />
          <Stack.Screen name="Reminders" component={RemindersScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
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
const $gap: ViewStyle = { gap: 12, padding: 24 }
const $center: TextStyle = { textAlign: "center" }

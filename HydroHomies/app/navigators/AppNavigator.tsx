/**
 * The app navigator (formerly "AppNavigator" and "MainNavigator") is used for the primary
 * navigation flows of your app.
 * Generally speaking, it will contain an auth flow (registration, login, forgot password)
 * and a "main" flow which the user will use once logged in.
 */
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

/**
 * This is a list of all the route names that will exit the app if the back button
 * is pressed while in that screen. Only affects Android.
 */
const exitRoutes = Config.exitRoutes

// Documentation: https://reactnavigation.org/docs/stack-navigator/
const Stack = createNativeStackNavigator<AppStackParamList>()

const AppStack = () => {
  const { isAuthenticated, pet } = useAuth()

  console.log("MARI", pet)

  const {
    theme: { colors },
  } = useAppTheme()

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        navigationBarColor: colors.background,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
      initialRouteName={isAuthenticated ? (pet ? "Home" : "PetSelect") : "Login"}
    >
      {isAuthenticated ? (
        pet ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="ScanBottle" component={ScanBottleScreen} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
            <Stack.Screen name="FriendPet" component={FriendPetScreen} />
          </>
        ) : (
          <Stack.Screen name="PetSelect" component={PetSelectScreen} />
        )
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </>
      )}

      {/** 🔥 Your screens go here */}
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

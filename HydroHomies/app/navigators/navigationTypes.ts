import { ComponentProps } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"

// App Stack Navigator types
export type AppStackParamList = {
  Welcome: undefined
  Login: undefined
  SignUp: undefined
  Onboarding: undefined
  Home: undefined
  PetSelect: undefined
  ScanBottle: {
    mode?: "initial" | "verification"
    initialImageUri?: string
    estimatedVolume?: number
  }
  Leaderboard: undefined
  FriendPet: {
    userId: string
    displayName: string
  }
  // 🔥 Your screens go here
  // IGNITE_GENERATOR_ANCHOR_APP_STACK_PARAM_LIST
}

export type AppStackScreenProps<T extends keyof AppStackParamList> = NativeStackScreenProps<
  AppStackParamList,
  T
>

export interface NavigationProps extends Partial<
  ComponentProps<typeof NavigationContainer<AppStackParamList>>
> {}

import { ComponentProps } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"

export type AppStackParamList = {
  Login: undefined
  SignUp: undefined
  /** Collects body stats for accounts that don't have them yet */
  Onboarding: undefined
  PetSelect: undefined
  Home: undefined
  ScanBottle: undefined
  Leaderboard: undefined
  Friends: undefined
  Stats: undefined
  Reminders: undefined
  FriendPet: {
    userId: string
    displayName: string
  }
  // IGNITE_GENERATOR_ANCHOR_APP_STACK_PARAM_LIST
}

export type AppStackScreenProps<T extends keyof AppStackParamList> = NativeStackScreenProps<
  AppStackParamList,
  T
>

export interface NavigationProps extends Partial<
  ComponentProps<typeof NavigationContainer<AppStackParamList>>
> {}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // Types useNavigation() for every screen
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface RootParamList extends AppStackParamList {}
  }
}

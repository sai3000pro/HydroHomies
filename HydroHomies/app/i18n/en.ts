const en = {
  common: {
    ok: "OK!",
    cancel: "Cancel",
    back: "Back",
    logOut: "Log Out",
  },
  errorScreen: {
    title: "Something went wrong!",
    friendlySubtitle:
      "This is the screen that your users will see in production when an error is thrown. You'll want to customize this message (located in `app/i18n/en.ts`) and probably the layout as well (`app/screens/ErrorScreen`). If you want to remove this entirely, check `app/app.tsx` for the <ErrorBoundary> component.",
    reset: "RESET APP",
    traceTitle: "Error from %{name} stack",
  },
  emptyStateComponent: {
    generic: {
      heading: "So empty... so sad",
      content: "No data found yet. Try clicking the button to refresh or reload the app.",
      button: "Let's try this again",
    },
  },
  loginScreen: {
    logIn: "Log In",
    emailFieldLabel: "Email",
    passwordFieldLabel: "Password",
    emailFieldPlaceholder: "Enter your email address",
    passwordFieldPlaceholder: "Enter your password",
    tapToLogIn: "Login",
  },
  signUpScreen: {
    emailFieldLabel: "Email",
    usernameFieldLabel: "Username",
    passwordFieldLabel: "Password",
    passwordField2Label: "Re-enter Password",
    sexFieldLabel: "Sex",
    ageFieldLabel: "Age",
    heightFieldLabel: "Height (cm)",
    weightFieldLabel: "Weight (kg)",
    emailFieldPlaceholder: "Enter your email address",
    usernameFieldPlaceholder: "Enter your username",
    passwordFieldPlaceholder: "Enter your password",
    passwordField2Placeholder: "Re-enter your password",
    sexFieldPlaceholder: "Sex",
    ageFieldPlaceholder: "25",
    heightFieldPlaceholder: "170",
    weightFieldPlaceholder: "75",
    tapToSignUp: "Sign Up",
  },
}

export default en
export type Translations = typeof en

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] }
export type PartialTranslations = DeepPartial<Translations>

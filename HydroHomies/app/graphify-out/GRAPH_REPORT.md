# Graph Report - app  (2026-10-31)

## Corpus Check
- 100 files · ~37,877 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 802 nodes · 2176 edges · 40 communities (35 shown, 5 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 150 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `390ec955`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- context.tsx
- useAppTheme
- Card.tsx
- ScanBottleScreen.tsx
- PetSelectScreen.tsx
- Screen.tsx
- app.tsx
- database.ts
- Pet.tsx
- HomeScreen.tsx
- i18n/index.ts
- AppNavigator.tsx
- ref_react
- ReactotronConfig.ts
- SettingsScreen.tsx
- crashReporting.ts
- AuthContext.tsx
- ref_react
- StatsScreen.tsx
- config/index.ts
- RemindersScreen.tsx
- petEvolution.ts
- ThemedStyle
- Button.tsx
- Text.tsx
- EmptyState.tsx
- LoginScreen.tsx
- StatsFields.tsx
- AppStackScreenProps
- LeaderboardScreen.tsx
- SignUpScreen.tsx
- FriendPetScreen.tsx
- TextField.tsx
- OnboardingScreen.tsx
- waterGoalCalculator.ts
- formatDate.ts
- tfjsRN.ts

## God Nodes (most connected - your core abstractions)
1. `useAppTheme()` - 84 edges
2. `Text` - 63 edges
3. `HomeScreen()` - 35 edges
4. `Button()` - 32 edges
5. `Screen()` - 32 edges
6. `ScanBottleScreen()` - 32 edges
7. `ThemedStyle` - 31 edges
8. `StatsScreen()` - 27 edges
9. `AppStackScreenProps` - 25 edges
10. `TextField` - 24 edges

## Surprising Connections (you probably didn't know these)
- `Thumb()` --indirect_call--> `$thumb()`  [INFERRED]
  screens/ScanBottleScreen.tsx → components/DrinkPhotoGallery.tsx
- `confirmRemove()` --calls--> `confirmAction()`  [EXTRACTED]
  screens/FriendsScreen.tsx → utils/confirm.ts
- `App()` --calls--> `AppNavigator()`  [EXTRACTED]
  app.tsx → navigators/AppNavigator.tsx
- `App()` --calls--> `useNavigationPersistence()`  [EXTRACTED]
  app.tsx → navigators/navigationUtilities.ts
- `App()` --calls--> `ThemeProvider()`  [EXTRACTED]
  app.tsx → theme/context.tsx

## Import Cycles
- None detected.

## Communities (40 total, 5 thin omitted)

### Community 0 - "context.tsx"
Cohesion: 0.06
Nodes (36): colors, palette, colors, palette, ThemeContext, ThemeContextType, ThemeProvider(), ThemeProviderProps (+28 more)

### Community 1 - "useAppTheme"
Cohesion: 0.06
Nodes (47): BaseIconProps, IconProps, iconRegistry, IconTypes, $imageStyleBase, PressableIconProps, $iconContainer, ListItem (+39 more)

### Community 2 - "Card.tsx"
Cohesion: 0.20
Nodes (8): $alignmentWrapper, $alignmentWrapperFlexOptions, Card(), $containerPresets, $contentPresets, $footerPresets, $headingPresets, Presets

### Community 3 - "ScanBottleScreen.tsx"
Cohesion: 0.06
Nodes (59): Text, $bigNumber(), $camera, $cameraOverlay(), celebration(), $center, Centered(), $centerText (+51 more)

### Community 4 - "PetSelectScreen.tsx"
Cohesion: 0.20
Nodes (15): Container(), ContainerProps, $heading(), $innerBox(), $outerBox(), $button(), $centered(), $content() (+7 more)

### Community 5 - "Screen.tsx"
Cohesion: 0.07
Nodes (39): $actionFillerContainer, $actionIconContainer(), $actionText(), $actionTextContainer(), $container, Header(), HeaderAction(), HeaderProps (+31 more)

### Community 6 - "app.tsx"
Cohesion: 0.16
Nodes (9): App(), config, NAVIGATION_PERSISTENCE_KEY, prefix, AuthProvider(), initI18n(), loadModel(), cancelReminders() (+1 more)

### Community 7 - "database.ts"
Cohesion: 0.11
Nodes (28): $card(), $code(), $container(), $dim(), $flex, FriendsScreen(), confirmRemove(), $row() (+20 more)

### Community 8 - "Pet.tsx"
Cohesion: 0.20
Nodes (14): Bar(), $barContainer(), $barFill, $barTrack(), $centered(), $container(), $dim(), $faded (+6 more)

### Community 9 - "HomeScreen.tsx"
Cohesion: 0.05
Nodes (63): ActionTile(), ActionTileProps, $emoji, $pressed(), $tile(), $wide, $card(), $centerText (+55 more)

### Community 10 - "i18n/index.ts"
Cohesion: 0.11
Nodes (19): ar, DeepPartial, en, PartialTranslations, Translations, es, fr, hi (+11 more)

### Community 11 - "AppNavigator.tsx"
Cohesion: 0.26
Nodes (8): AppNavigator(), AppStack(), $loading, Stack, AppStackParamList, NavigationProps, ReactNavigation, RootParamList

### Community 12 - "ref_react"
Cohesion: 0.11
Nodes (17): AutoImage(), AutoImageProps, useAutoImage(), Icon(), ErrorBoundary, Props, State, $contentContainer() (+9 more)

### Community 13 - "ReactotronConfig.ts"
Cohesion: 0.14
Nodes (5): Console, reactotron, goBack(), navigate(), resetRoot()

### Community 14 - "SettingsScreen.tsx"
Cohesion: 0.23
Nodes (12): useAuth(), $card(), $container(), $darkText, $dim(), $flex, $goalBox(), $row() (+4 more)

### Community 15 - "crashReporting.ts"
Cohesion: 0.33
Nodes (3): ErrorType, FATAL, HANDLED

### Community 16 - "AuthContext.tsx"
Cohesion: 0.17
Nodes (11): AuthContext, AuthContextType, authService, app, auth, db, firebaseConfig, functions (+3 more)

### Community 18 - "ref_react"
Cohesion: 0.31
Nodes (7): getActiveRouteName(), navigationRef, navigationRestoredDefaultState(), Storage, useBackButtonHandler(), useNavigationPersistence(), useIsMounted()

### Community 20 - "StatsScreen.tsx"
Cohesion: 0.10
Nodes (37): $achievement(), $achievementEmoji, $bar, $barColumn, $card(), $chart(), $container(), DayBar() (+29 more)

### Community 22 - "config/index.ts"
Cohesion: 0.29
Nodes (4): BaseConfig, ConfigBaseProps, PersistNavigationConfig, Config

### Community 23 - "RemindersScreen.tsx"
Cohesion: 0.09
Nodes (35): Button(), $back(), $backText(), $container(), $flex, $pressed, $row, ScreenHeader() (+27 more)

### Community 24 - "petEvolution.ts"
Cohesion: 0.22
Nodes (12): clampHealth(), currentHealth(), feedPet(), HEALTH_DECAY_PER_HOUR, levelProgress(), PET_SPECIES, PetStage, SPECIES_DISPLAY_NAMES (+4 more)

### Community 25 - "ThemedStyle"
Cohesion: 0.17
Nodes (11): Dropdown(), $dropdownBox, DropdownProps, $label(), $menuContainer, Option, $optionItem, $optionText (+3 more)

### Community 26 - "Button.tsx"
Cohesion: 0.18
Nodes (6): ButtonAccessoryProps, Presets, $pressedTextPresets, $pressedViewPresets, $textPresets, $viewPresets

### Community 27 - "Text.tsx"
Cohesion: 0.25
Nodes (6): $fontWeightStyles, Presets, Sizes, $sizeStyles, Weights, ThemedStyleArray

### Community 28 - "EmptyState.tsx"
Cohesion: 0.19
Nodes (13): ButtonProps, CardProps, $content(), EmptyState(), EmptyStatePresetItem, EmptyStateProps, $heading(), $image (+5 more)

### Community 29 - "LoginScreen.tsx"
Cohesion: 0.29
Nodes (12): PressableIcon(), $error(), $formContainer(), $link(), LoginScreen(), login(), $mainContainer(), $screenContentContainer() (+4 more)

### Community 30 - "StatsFields.tsx"
Cohesion: 0.21
Nodes (12): ACTIVITY_OPTIONS, $container(), DEFAULT_STATS_FORM, $half, $row(), SEX_OPTIONS, StatsFields(), StatsFieldsProps (+4 more)

### Community 31 - "AppStackScreenProps"
Cohesion: 0.15
Nodes (13): AppStackScreenProps, FriendPetScreenProps, FriendsScreenProps, HomeScreenProps, LeaderboardScreenProps, LoginScreenProps, OnboardingScreenProps, PetSelectScreenProps (+5 more)

### Community 32 - "LeaderboardScreen.tsx"
Cohesion: 0.24
Nodes (12): $container(), $dim(), $empty(), $flex, LeaderboardScreen(), $list(), MEDALS, $petPlaceholder (+4 more)

### Community 33 - "SignUpScreen.tsx"
Cohesion: 0.30
Nodes (11): $error(), $formContainer(), $link(), $mainContainer(), $screenContentContainer(), SignUpScreen(), signup(), validate() (+3 more)

### Community 34 - "FriendPetScreen.tsx"
Cohesion: 0.29
Nodes (10): PetViewModel, useSignedInUser(), $card(), $container(), $dim(), FriendPetScreen(), DailySummary, PetState (+2 more)

### Community 35 - "TextField.tsx"
Cohesion: 0.33
Nodes (9): $helperStyle(), $inputStyle(), $inputWrapperStyle(), $labelStyle(), $leftAccessoryStyle(), $rightAccessoryStyle(), TextField, TextFieldAccessoryProps (+1 more)

### Community 36 - "OnboardingScreen.tsx"
Cohesion: 0.38
Nodes (9): parseStatsForm(), previewGoal(), $container(), $dim(), $error(), $goalBox(), OnboardingScreen(), save() (+1 more)

### Community 37 - "waterGoalCalculator.ts"
Cohesion: 0.31
Nodes (8): ACTIVITY_LEVELS, ACTIVITY_MULTIPLIERS, calculateDailyWaterGoal(), MAX_GOAL_ML, MIN_GOAL_ML, SEXES, shouldFlagOverdrinking(), validateStats()

## Knowledge Gaps
- **2 isolated node(s):** `FATAL`, `HANDLED`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 256 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAppTheme()` connect `useAppTheme` to `context.tsx`, `Card.tsx`, `ScanBottleScreen.tsx`, `PetSelectScreen.tsx`, `Screen.tsx`, `database.ts`, `Pet.tsx`, `HomeScreen.tsx`, `AppNavigator.tsx`, `ref_react`, `SettingsScreen.tsx`, `StatsScreen.tsx`, `RemindersScreen.tsx`, `ThemedStyle`, `Button.tsx`, `Text.tsx`, `EmptyState.tsx`, `LoginScreen.tsx`, `StatsFields.tsx`, `LeaderboardScreen.tsx`, `SignUpScreen.tsx`, `FriendPetScreen.tsx`, `TextField.tsx`, `OnboardingScreen.tsx`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Are the 16 inferred relationships involving `HomeScreen()` (e.g. with `$card()` and `$container()`) actually correct?**
  _`HomeScreen()` has 16 INFERRED edges - model-reasoned connections that need verification._
- **What connects `FATAL`, `HANDLED` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `context.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05727644652250146 - nodes in this community are weakly interconnected._
- **Why does `Text` connect `ScanBottleScreen.tsx` to `context.tsx`, `useAppTheme`, `Card.tsx`, `PetSelectScreen.tsx`, `Screen.tsx`, `database.ts`, `Pet.tsx`, `HomeScreen.tsx`, `ref_react`, `SettingsScreen.tsx`, `StatsScreen.tsx`, `RemindersScreen.tsx`, `Button.tsx`, `Text.tsx`, `EmptyState.tsx`, `LoginScreen.tsx`, `LeaderboardScreen.tsx`, `SignUpScreen.tsx`, `FriendPetScreen.tsx`, `TextField.tsx`, `OnboardingScreen.tsx`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Should `useAppTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.06187202538339503 - nodes in this community are weakly interconnected._
- **Why does `ScanBottleScreen()` connect `ScanBottleScreen.tsx` to `useAppTheme`, `FriendPetScreen.tsx`, `Screen.tsx`, `HomeScreen.tsx`, `AppNavigator.tsx`, `RemindersScreen.tsx`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
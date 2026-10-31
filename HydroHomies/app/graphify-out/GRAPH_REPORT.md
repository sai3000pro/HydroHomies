# Graph Report - app  (2026-10-31)

## Corpus Check
- 103 files · ~41,099 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 833 nodes · 2331 edges · 40 communities (37 shown, 3 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 157 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `35090537`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- context.tsx
- useAppTheme
- Card.tsx
- ScanBottleScreen.tsx
- DrinkPhotoGallery.tsx
- Screen.tsx
- app.tsx
- database.ts
- LeaderboardScreen.tsx
- HomeScreen.tsx
- i18n/index.ts
- AppNavigator.tsx
- useAppTheme
- ReactotronConfig.ts
- SettingsScreen.tsx
- crashReporting.ts
- AuthContext.tsx
- useNavigationPersistence
- StatsScreen.tsx
- config/index.ts
- RemindersScreen.tsx
- Header.tsx
- database.ts
- Button.tsx
- Text.tsx
- EmptyState.tsx
- LoginScreen.tsx
- StatsFields.tsx
- DrinkRow.tsx
- ref_react
- SignUpScreen.tsx
- confirmAction
- TextField.tsx
- OnboardingScreen.tsx
- IconTypes
- useSafeAreaInsetsStyle.ts
- tfjsRN.ts

## God Nodes (most connected - your core abstractions)
1. `useAppTheme()` - 89 edges
2. `Text` - 70 edges
3. `Button()` - 35 edges
4. `Screen()` - 34 edges
5. `ThemedStyle` - 33 edges
6. `ScanBottleScreen()` - 32 edges
7. `HomeScreen()` - 30 edges
8. `AppStackScreenProps` - 27 edges
9. `StatsScreen()` - 27 edges
10. `TextField` - 26 edges

## Surprising Connections (you probably didn't know these)
- `toggle()` --calls--> `notify()`  [EXTRACTED]
  components/DrinkPhotoGallery.tsx → utils/confirm.ts
- `RadioInput()` --calls--> `useAppTheme()`  [EXTRACTED]
  components/Toggle/Radio.tsx → theme/context.tsx
- `App()` --calls--> `AppNavigator()`  [EXTRACTED]
  app.tsx → navigators/AppNavigator.tsx
- `App()` --calls--> `useNavigationPersistence()`  [EXTRACTED]
  app.tsx → navigators/navigationUtilities.ts
- `App()` --calls--> `loadModel()`  [EXTRACTED]
  app.tsx → services/ml/waterLevelClassifier.ts

## Import Cycles
- None detected.

## Communities (40 total, 3 thin omitted)

### Community 0 - "context.tsx"
Cohesion: 0.06
Nodes (38): Dropdown(), $dropdownBox, DropdownProps, $label(), $menuContainer, Option, $optionItem, $optionText (+30 more)

### Community 1 - "useAppTheme"
Cohesion: 0.07
Nodes (37): BaseIconProps, IconProps, iconRegistry, $imageStyleBase, PressableIconProps, Checkbox(), $checkboxDetail, CheckboxInput() (+29 more)

### Community 2 - "Card.tsx"
Cohesion: 0.18
Nodes (9): $alignmentWrapper, $alignmentWrapperFlexOptions, $containerPresets, $contentPresets, $footerPresets, $headingPresets, Presets, ThemedStyle (+1 more)

### Community 3 - "ScanBottleScreen.tsx"
Cohesion: 0.06
Nodes (54): $bigNumber(), $camera, $cameraOverlay(), $center, Centered(), $centerText, $controls(), $dim() (+46 more)

### Community 4 - "DrinkPhotoGallery.tsx"
Cohesion: 0.13
Nodes (22): $card(), $centerText, $chip(), $chipTextSelected, describeWhen(), $dim(), DrinkPhotoGallery(), DrinkPhotoGalleryProps (+14 more)

### Community 5 - "Screen.tsx"
Cohesion: 0.08
Nodes (34): Container(), ContainerProps, $heading(), $innerBox(), $outerBox(), AutoScreenProps, BaseScreenProps, $containerStyle (+26 more)

### Community 6 - "app.tsx"
Cohesion: 0.16
Nodes (8): App(), config, NAVIGATION_PERSISTENCE_KEY, prefix, AuthProvider(), initI18n(), loadDateFnsLocale(), Options

### Community 7 - "database.ts"
Cohesion: 0.18
Nodes (15): $card(), $code(), $container(), $dim(), $flex, FriendsScreen(), $link(), $row() (+7 more)

### Community 8 - "LeaderboardScreen.tsx"
Cohesion: 0.08
Nodes (45): undo(), Bar(), $barContainer(), $barFill, $barTrack(), $centered(), $container(), $dim() (+37 more)

### Community 9 - "HomeScreen.tsx"
Cohesion: 0.09
Nodes (37): ActionTile(), ActionTileProps, $emoji, $pressed(), $tile(), $wide, $card(), $centered (+29 more)

### Community 10 - "i18n/index.ts"
Cohesion: 0.11
Nodes (19): ar, DeepPartial, en, PartialTranslations, Translations, es, fr, hi (+11 more)

### Community 11 - "AppNavigator.tsx"
Cohesion: 0.21
Nodes (10): $center, $gap, $loading, Stack, $wide, AppStackParamList, NavigationProps, ReactNavigation (+2 more)

### Community 12 - "useAppTheme"
Cohesion: 0.08
Nodes (33): Button(), Card(), Photo(), $thumb(), Icon(), $iconContainer, ListItem, ListItemAction() (+25 more)

### Community 13 - "ReactotronConfig.ts"
Cohesion: 0.17
Nodes (6): Console, reactotron, goBack(), navigate(), resetRoot(), Storage

### Community 14 - "SettingsScreen.tsx"
Cohesion: 0.18
Nodes (16): login(), resetPassword(), $card(), $container(), $darkText, $dim(), $flex, $goalBox() (+8 more)

### Community 15 - "crashReporting.ts"
Cohesion: 0.33
Nodes (3): ErrorType, FATAL, HANDLED

### Community 16 - "AuthContext.tsx"
Cohesion: 0.17
Nodes (11): AuthContext, AuthContextType, authService, app, auth, db, firebaseConfig, functions (+3 more)

### Community 18 - "useNavigationPersistence"
Cohesion: 0.50
Nodes (4): getActiveRouteName(), navigationRestoredDefaultState(), useBackButtonHandler(), useNavigationPersistence()

### Community 20 - "StatsScreen.tsx"
Cohesion: 0.05
Nodes (72): $back(), $backText(), $container(), $flex, $pressed, $row, ScreenHeader(), ScreenHeaderProps (+64 more)

### Community 22 - "config/index.ts"
Cohesion: 0.29
Nodes (4): BaseConfig, ConfigBaseProps, PersistNavigationConfig, Config

### Community 23 - "RemindersScreen.tsx"
Cohesion: 0.07
Nodes (38): $card(), $container(), $dim(), $disabled, $flex, $gap(), $hour, hourLabel() (+30 more)

### Community 24 - "Header.tsx"
Cohesion: 0.18
Nodes (16): $actionFillerContainer, $actionIconContainer(), $actionText(), $actionTextContainer(), $container, Header(), HeaderAction(), HeaderProps (+8 more)

### Community 25 - "database.ts"
Cohesion: 0.23
Nodes (13): DrinkPhotos, num(), parseEntry(), parsePet(), parseSummary(), parseUserProfile(), Reaction, ReactionEmoji (+5 more)

### Community 26 - "Button.tsx"
Cohesion: 0.18
Nodes (6): ButtonAccessoryProps, Presets, $pressedTextPresets, $pressedViewPresets, $textPresets, $viewPresets

### Community 27 - "Text.tsx"
Cohesion: 0.22
Nodes (7): $fontWeightStyles, Presets, Sizes, $sizeStyles, Weights, isRTL, TxKeyPath

### Community 28 - "EmptyState.tsx"
Cohesion: 0.24
Nodes (11): ButtonProps, CardProps, $content(), EmptyState(), EmptyStatePresetItem, EmptyStateProps, $heading(), $image (+3 more)

### Community 29 - "LoginScreen.tsx"
Cohesion: 0.29
Nodes (12): PressableIcon(), $error(), $forgot(), $formContainer(), $info(), $link(), LoginScreen(), $mainContainer() (+4 more)

### Community 30 - "StatsFields.tsx"
Cohesion: 0.21
Nodes (12): ACTIVITY_OPTIONS, $container(), DEFAULT_STATS_FORM, $half, $row(), SEX_OPTIONS, StatsFields(), StatsFieldsProps (+4 more)

### Community 31 - "DrinkRow.tsx"
Cohesion: 0.22
Nodes (12): $dim(), DrinkRow(), DrinkRowProps, $flexShrink, $lastRow, $pressed, $row(), SOURCE_LABEL (+4 more)

### Community 32 - "ref_react"
Cohesion: 0.33
Nodes (4): AutoImage(), AutoImageProps, useAutoImage(), useIsMounted()

### Community 33 - "SignUpScreen.tsx"
Cohesion: 0.38
Nodes (9): $error(), $formContainer(), $link(), $mainContainer(), $screenContentContainer(), SignUpScreen(), $tapButton(), $text() (+1 more)

### Community 34 - "confirmAction"
Cohesion: 0.40
Nodes (4): confirmDelete(), confirmRemove(), newCode(), confirmAction()

### Community 35 - "TextField.tsx"
Cohesion: 0.39
Nodes (8): $helperStyle(), $inputStyle(), $inputWrapperStyle(), $labelStyle(), $leftAccessoryStyle(), $rightAccessoryStyle(), TextField, TextFieldAccessoryProps

### Community 36 - "OnboardingScreen.tsx"
Cohesion: 0.32
Nodes (11): parseStatsForm(), previewGoal(), useAuth(), $container(), $dim(), $error(), $goalBox(), OnboardingScreen() (+3 more)

### Community 37 - "IconTypes"
Cohesion: 0.40
Nodes (5): HeaderActionProps, IconTypes, ListItemActionProps, ListItemProps, CheckboxToggleProps

### Community 38 - "useSafeAreaInsetsStyle.ts"
Cohesion: 0.40
Nodes (3): edgeInsetMap, propertySuffixMap, SafeAreaInsetsStyle

### Community 39 - "tfjsRN.ts"
Cohesion: 0.25
Nodes (3): bundleResourceIO, decodeJpeg, loadModel()

## Knowledge Gaps
- **2 isolated node(s):** `FATAL`, `HANDLED`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 262 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAppTheme()` connect `useAppTheme` to `context.tsx`, `useAppTheme`, `Card.tsx`, `ScanBottleScreen.tsx`, `DrinkPhotoGallery.tsx`, `Screen.tsx`, `database.ts`, `LeaderboardScreen.tsx`, `HomeScreen.tsx`, `AppNavigator.tsx`, `SettingsScreen.tsx`, `StatsScreen.tsx`, `RemindersScreen.tsx`, `Header.tsx`, `Button.tsx`, `Text.tsx`, `EmptyState.tsx`, `LoginScreen.tsx`, `StatsFields.tsx`, `DrinkRow.tsx`, `SignUpScreen.tsx`, `TextField.tsx`, `OnboardingScreen.tsx`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **What connects `FATAL`, `HANDLED` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `context.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.059932659932659935 - nodes in this community are weakly interconnected._
- **Why does `Text` connect `useAppTheme` to `context.tsx`, `useAppTheme`, `Card.tsx`, `ScanBottleScreen.tsx`, `DrinkPhotoGallery.tsx`, `Screen.tsx`, `database.ts`, `LeaderboardScreen.tsx`, `HomeScreen.tsx`, `AppNavigator.tsx`, `SettingsScreen.tsx`, `StatsScreen.tsx`, `RemindersScreen.tsx`, `Header.tsx`, `Button.tsx`, `Text.tsx`, `EmptyState.tsx`, `LoginScreen.tsx`, `DrinkRow.tsx`, `SignUpScreen.tsx`, `TextField.tsx`, `OnboardingScreen.tsx`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Should `useAppTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.07183673469387755 - nodes in this community are weakly interconnected._
- **Why does `ScanBottleScreen()` connect `ScanBottleScreen.tsx` to `useAppTheme`, `Screen.tsx`, `AppNavigator.tsx`, `useAppTheme`, `StatsScreen.tsx`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Should `ScanBottleScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0601404741000878 - nodes in this community are weakly interconnected._
# Graph Report - app  (2026-10-31)

## Corpus Check
- 94 files · ~34,045 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 728 nodes · 1902 edges · 34 communities (30 shown, 4 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 128 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2efa8d78`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- context.tsx
- Toggle.tsx
- Card.tsx
- ScanBottleScreen.tsx
- PetSelectScreen.tsx
- PetSelectScreen.tsx
- app.tsx
- Header.tsx
- LeaderboardScreen.tsx
- HomeScreen.tsx
- i18n/index.ts
- AppNavigator.tsx
- ErrorDetails.tsx
- ReactotronConfig.ts
- ref_react
- crashReporting.ts
- SignUpScreen.tsx
- ref_react
- StatsScreen.tsx
- config/index.ts
- RemindersScreen.tsx
- ListItem.tsx
- Switch.tsx
- Button.tsx
- Text.tsx
- EmptyState.tsx
- ref_react_native
- Checkbox.tsx
- useAppTheme
- ErrorBoundary
- useSafeAreaInsetsStyle.ts

## God Nodes (most connected - your core abstractions)
1. `useAppTheme()` - 74 edges
2. `Text` - 53 edges
3. `Button()` - 32 edges
4. `Screen()` - 30 edges
5. `ScanBottleScreen()` - 28 edges
6. `StatsScreen()` - 28 edges
7. `ThemedStyle` - 27 edges
8. `HomeScreen()` - 25 edges
9. `AppStackScreenProps` - 23 edges
10. `SignUpScreen()` - 23 edges

## Surprising Connections (you probably didn't know these)
- `RadioInput()` --calls--> `useAppTheme()`  [EXTRACTED]
  components/Toggle/Radio.tsx → theme/context.tsx
- `App()` --calls--> `AppNavigator()`  [EXTRACTED]
  app.tsx → navigators/AppNavigator.tsx
- `App()` --calls--> `useNavigationPersistence()`  [EXTRACTED]
  app.tsx → navigators/navigationUtilities.ts
- `App()` --calls--> `ThemeProvider()`  [EXTRACTED]
  app.tsx → theme/context.tsx
- `Button()` --calls--> `useAppTheme()`  [EXTRACTED]
  components/Button.tsx → theme/context.tsx

## Import Cycles
- None detected.

## Communities (34 total, 4 thin omitted)

### Community 0 - "context.tsx"
Cohesion: 0.06
Nodes (39): colors, palette, colors, palette, ThemeContext, ThemeContextType, ThemeProvider(), ThemeProviderProps (+31 more)

### Community 1 - "Toggle.tsx"
Cohesion: 0.15
Nodes (13): $inputOuter, Radio(), $radioDetail, RadioInput(), RadioToggleProps, $helper(), $inputOuterBase, $inputWrapper (+5 more)

### Community 2 - "Card.tsx"
Cohesion: 0.18
Nodes (10): $alignmentWrapper, $alignmentWrapperFlexOptions, CardProps, $containerPresets, $contentPresets, $footerPresets, $headingPresets, Presets (+2 more)

### Community 3 - "ScanBottleScreen.tsx"
Cohesion: 0.06
Nodes (52): $bigNumber(), $camera, $cameraOverlay(), $center, Centered(), $centerText, $controls(), $dim() (+44 more)

### Community 4 - "PetSelectScreen.tsx"
Cohesion: 0.10
Nodes (28): Container(), ContainerProps, $heading(), $innerBox(), $outerBox(), useSignedInUser(), AppStackScreenProps, FriendPetScreenProps (+20 more)

### Community 5 - "PetSelectScreen.tsx"
Cohesion: 0.10
Nodes (25): AutoScreenProps, BaseScreenProps, $containerStyle, DEFAULT_BOTTOM_OFFSET, FixedScreenProps, $innerStyle, isNonScrolling(), $justifyFlexEnd (+17 more)

### Community 6 - "app.tsx"
Cohesion: 0.13
Nodes (10): App(), config, NAVIGATION_PERSISTENCE_KEY, prefix, AuthProvider(), initI18n(), loadModel(), cancelReminders() (+2 more)

### Community 7 - "Header.tsx"
Cohesion: 0.18
Nodes (16): $actionFillerContainer, $actionIconContainer(), $actionText(), $actionTextContainer(), $container, Header(), HeaderAction(), HeaderProps (+8 more)

### Community 8 - "LeaderboardScreen.tsx"
Cohesion: 0.08
Nodes (46): Bar(), $barContainer(), $barFill, $barTrack(), $centered(), $container(), $dim(), $faded (+38 more)

### Community 9 - "HomeScreen.tsx"
Cohesion: 0.11
Nodes (28): $actionRow(), $actions(), $card(), $centered, $container(), $dim(), $dimCentered(), $entryRow() (+20 more)

### Community 10 - "i18n/index.ts"
Cohesion: 0.11
Nodes (19): ar, DeepPartial, en, PartialTranslations, Translations, es, fr, hi (+11 more)

### Community 11 - "AppNavigator.tsx"
Cohesion: 0.23
Nodes (9): AppNavigator(), AppStack(), $loading, Stack, AppStackParamList, NavigationProps, ReactNavigation, RootParamList (+1 more)

### Community 12 - "ErrorDetails.tsx"
Cohesion: 0.26
Nodes (11): Icon(), $contentContainer(), $errorBacktrace(), $errorContent(), ErrorDetails(), ErrorDetailsProps, $errorSection(), $errorSectionContentContainer() (+3 more)

### Community 13 - "ReactotronConfig.ts"
Cohesion: 0.17
Nodes (5): Console, reactotron, goBack(), navigate(), resetRoot()

### Community 14 - "ref_react"
Cohesion: 0.29
Nodes (5): AutoImage(), AutoImageProps, useAutoImage(), Props, State

### Community 15 - "crashReporting.ts"
Cohesion: 0.33
Nodes (3): ErrorType, FATAL, HANDLED

### Community 16 - "SignUpScreen.tsx"
Cohesion: 0.05
Nodes (72): Dropdown(), $dropdownBox, DropdownProps, $label(), $menuContainer, Option, $optionItem, $optionText (+64 more)

### Community 18 - "ref_react"
Cohesion: 0.36
Nodes (6): getActiveRouteName(), navigationRestoredDefaultState(), Storage, useBackButtonHandler(), useNavigationPersistence(), useIsMounted()

### Community 20 - "StatsScreen.tsx"
Cohesion: 0.05
Nodes (65): $card(), $code(), $container(), $dim(), $flex, FriendsScreen(), $header(), $row() (+57 more)

### Community 22 - "config/index.ts"
Cohesion: 0.29
Nodes (4): BaseConfig, ConfigBaseProps, PersistNavigationConfig, Config

### Community 23 - "RemindersScreen.tsx"
Cohesion: 0.12
Nodes (27): Button(), Switch(), $card(), $container(), $dim(), $disabled, $flex, $gap() (+19 more)

### Community 24 - "ListItem.tsx"
Cohesion: 0.20
Nodes (7): HeaderActionProps, IconTypes, $iconContainer, ListItemActionProps, ListItemProps, $touchableStyle, CheckboxToggleProps

### Community 25 - "Switch.tsx"
Cohesion: 0.20
Nodes (11): $inputOuter, $switchAccessibility, $switchAccessibilityCircle, $switchAccessibilityIcon, SwitchAccessibilityLabel(), $switchAccessibilityLine, $switchDetail, $switchInner() (+3 more)

### Community 26 - "Button.tsx"
Cohesion: 0.18
Nodes (6): ButtonAccessoryProps, Presets, $pressedTextPresets, $pressedViewPresets, $textPresets, $viewPresets

### Community 27 - "Text.tsx"
Cohesion: 0.22
Nodes (7): $fontWeightStyles, Presets, Sizes, $sizeStyles, Weights, TxKeyPath, ThemedStyleArray

### Community 28 - "EmptyState.tsx"
Cohesion: 0.29
Nodes (8): ButtonProps, $content(), EmptyState(), EmptyStatePresetItem, EmptyStateProps, $heading(), $image, translate()

### Community 29 - "ref_react_native"
Cohesion: 0.22
Nodes (5): BaseIconProps, IconProps, iconRegistry, $imageStyleBase, PressableIconProps

### Community 30 - "Checkbox.tsx"
Cohesion: 0.28
Nodes (8): Checkbox(), $checkboxDetail, CheckboxInput(), CheckboxInputProps, $inputOuter, RadioInputProps, SwitchInputProps, BaseToggleInputProps

### Community 31 - "useAppTheme"
Cohesion: 0.48
Nodes (7): Card(), ListItem, ListItemAction(), $textStyle(), Text, FieldLabel(), useAppTheme()

### Community 33 - "useSafeAreaInsetsStyle.ts"
Cohesion: 0.40
Nodes (3): edgeInsetMap, propertySuffixMap, SafeAreaInsetsStyle

## Knowledge Gaps
- **2 isolated node(s):** `FATAL`, `HANDLED`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 232 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAppTheme()` connect `useAppTheme` to `context.tsx`, `Toggle.tsx`, `Card.tsx`, `ScanBottleScreen.tsx`, `PetSelectScreen.tsx`, `PetSelectScreen.tsx`, `Header.tsx`, `LeaderboardScreen.tsx`, `HomeScreen.tsx`, `AppNavigator.tsx`, `ErrorDetails.tsx`, `SignUpScreen.tsx`, `StatsScreen.tsx`, `RemindersScreen.tsx`, `ListItem.tsx`, `Switch.tsx`, `Button.tsx`, `Text.tsx`, `EmptyState.tsx`, `ref_react_native`, `Checkbox.tsx`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **What connects `FATAL`, `HANDLED` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `context.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.059887005649717516 - nodes in this community are weakly interconnected._
- **Why does `Text` connect `useAppTheme` to `context.tsx`, `Toggle.tsx`, `Card.tsx`, `ScanBottleScreen.tsx`, `PetSelectScreen.tsx`, `PetSelectScreen.tsx`, `Header.tsx`, `LeaderboardScreen.tsx`, `HomeScreen.tsx`, `ErrorDetails.tsx`, `SignUpScreen.tsx`, `StatsScreen.tsx`, `RemindersScreen.tsx`, `ListItem.tsx`, `Button.tsx`, `Text.tsx`, `EmptyState.tsx`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Should `Toggle.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14736842105263157 - nodes in this community are weakly interconnected._
- **Why does `ScanBottleScreen()` connect `ScanBottleScreen.tsx` to `PetSelectScreen.tsx`, `PetSelectScreen.tsx`, `LeaderboardScreen.tsx`, `AppNavigator.tsx`, `RemindersScreen.tsx`, `useAppTheme`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Should `ScanBottleScreen.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0553116769095698 - nodes in this community are weakly interconnected._
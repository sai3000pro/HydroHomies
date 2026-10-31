# Graph Report - app  (2026-10-31)

## Corpus Check
- 88 files · ~29,438 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 635 nodes · 1607 edges · 23 communities (20 shown, 3 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 97 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `48a44c9a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- context.tsx
- useAppTheme
- Text.tsx
- ScanBottleScreen.tsx
- LoginScreen.tsx
- PetSelectScreen.tsx
- app.tsx
- Header.tsx
- LeaderboardScreen.tsx
- HomeScreen.tsx
- i18n/index.ts
- AppNavigator.tsx
- ErrorDetails.tsx
- ReactotronConfig.ts
- AutoImage.tsx
- crashReporting.ts
- SignUpScreen.tsx
- ref_react
- loadModel
- config/index.ts

## God Nodes (most connected - your core abstractions)
1. `useAppTheme()` - 65 edges
2. `Text` - 44 edges
3. `ScanBottleScreen()` - 28 edges
4. `Button()` - 25 edges
5. `Screen()` - 24 edges
6. `ThemedStyle` - 24 edges
7. `HomeScreen()` - 23 edges
8. `SignUpScreen()` - 23 edges
9. `TextField` - 20 edges
10. `LoginScreen()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `AppNavigator()`  [EXTRACTED]
  app.tsx → navigators/AppNavigator.tsx
- `App()` --calls--> `useNavigationPersistence()`  [EXTRACTED]
  app.tsx → navigators/navigationUtilities.ts
- `App()` --calls--> `loadModel()`  [EXTRACTED]
  app.tsx → services/ml/waterLevelClassifier.ts
- `App()` --calls--> `ThemeProvider()`  [EXTRACTED]
  app.tsx → theme/context.tsx
- `Button()` --calls--> `useAppTheme()`  [EXTRACTED]
  components/Button.tsx → theme/context.tsx

## Import Cycles
- None detected.

## Communities (23 total, 3 thin omitted)

### Community 0 - "context.tsx"
Cohesion: 0.06
Nodes (39): colors, palette, colors, palette, ThemeContext, ThemeContextType, ThemeProvider(), ThemeProviderProps (+31 more)

### Community 1 - "useAppTheme"
Cohesion: 0.06
Nodes (51): HeaderActionProps, BaseIconProps, Icon(), IconProps, iconRegistry, IconTypes, $imageStyleBase, PressableIconProps (+43 more)

### Community 2 - "Text.tsx"
Cohesion: 0.06
Nodes (40): ButtonAccessoryProps, ButtonProps, Presets, $pressedTextPresets, $pressedViewPresets, $textPresets, $viewPresets, $alignmentWrapper (+32 more)

### Community 3 - "ScanBottleScreen.tsx"
Cohesion: 0.06
Nodes (53): Text, $bigNumber(), $camera, $cameraOverlay(), $center, Centered(), $centerText, $controls() (+45 more)

### Community 4 - "LoginScreen.tsx"
Cohesion: 0.20
Nodes (17): Container(), ContainerProps, $heading(), $innerBox(), $outerBox(), PressableIcon(), $error(), $formContainer() (+9 more)

### Community 5 - "PetSelectScreen.tsx"
Cohesion: 0.06
Nodes (44): AutoScreenProps, BaseScreenProps, $containerStyle, DEFAULT_BOTTOM_OFFSET, FixedScreenProps, $innerStyle, isNonScrolling(), $justifyFlexEnd (+36 more)

### Community 6 - "app.tsx"
Cohesion: 0.15
Nodes (8): App(), config, NAVIGATION_PERSISTENCE_KEY, prefix, AuthProvider(), initI18n(), loadDateFnsLocale(), Options

### Community 7 - "Header.tsx"
Cohesion: 0.13
Nodes (20): $actionFillerContainer, $actionIconContainer(), $actionText(), $actionTextContainer(), $container, Header(), HeaderAction(), HeaderProps (+12 more)

### Community 8 - "LeaderboardScreen.tsx"
Cohesion: 0.08
Nodes (41): Bar(), $barContainer(), $barFill, $barTrack(), $centered(), $container(), $dim(), $faded (+33 more)

### Community 9 - "HomeScreen.tsx"
Cohesion: 0.06
Nodes (54): AuthContext, AuthContextType, useAuth(), useSignedInUser(), $actions(), $card(), $centered, $container() (+46 more)

### Community 10 - "i18n/index.ts"
Cohesion: 0.11
Nodes (19): ar, DeepPartial, en, PartialTranslations, Translations, es, fr, hi (+11 more)

### Community 11 - "AppNavigator.tsx"
Cohesion: 0.22
Nodes (10): AppNavigator(), AppStack(), $loading, Stack, AppStackParamList, NavigationProps, ReactNavigation, RootParamList (+2 more)

### Community 12 - "ErrorDetails.tsx"
Cohesion: 0.15
Nodes (13): ErrorBoundary, Props, State, $contentContainer(), $errorBacktrace(), $errorContent(), ErrorDetails(), ErrorDetailsProps (+5 more)

### Community 13 - "ReactotronConfig.ts"
Cohesion: 0.18
Nodes (5): Console, reactotron, goBack(), navigate(), resetRoot()

### Community 14 - "AutoImage.tsx"
Cohesion: 0.67
Nodes (3): AutoImage(), AutoImageProps, useAutoImage()

### Community 15 - "crashReporting.ts"
Cohesion: 0.33
Nodes (3): ErrorType, FATAL, HANDLED

### Community 16 - "SignUpScreen.tsx"
Cohesion: 0.08
Nodes (41): Button(), Dropdown(), $dropdownBox, DropdownProps, $label(), $menuContainer, Option, $optionItem (+33 more)

### Community 18 - "ref_react"
Cohesion: 0.36
Nodes (5): getActiveRouteName(), navigationRestoredDefaultState(), Storage, useNavigationPersistence(), useIsMounted()

### Community 20 - "loadModel"
Cohesion: 0.25
Nodes (3): bundleResourceIO, decodeJpeg, loadModel()

### Community 22 - "config/index.ts"
Cohesion: 0.29
Nodes (4): BaseConfig, ConfigBaseProps, PersistNavigationConfig, Config

## Knowledge Gaps
- **2 isolated node(s):** `FATAL`, `HANDLED`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 211 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAppTheme()` connect `useAppTheme` to `context.tsx`, `Text.tsx`, `ScanBottleScreen.tsx`, `LoginScreen.tsx`, `PetSelectScreen.tsx`, `Header.tsx`, `LeaderboardScreen.tsx`, `HomeScreen.tsx`, `AppNavigator.tsx`, `ErrorDetails.tsx`, `SignUpScreen.tsx`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `ScanBottleScreen()` (e.g. with `$bigNumber()` and `$cameraOverlay()`) actually correct?**
  _`ScanBottleScreen()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **What connects `FATAL`, `HANDLED` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `context.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.058469945355191254 - nodes in this community are weakly interconnected._
- **Why does `Text` connect `ScanBottleScreen.tsx` to `context.tsx`, `useAppTheme`, `Text.tsx`, `LoginScreen.tsx`, `PetSelectScreen.tsx`, `Header.tsx`, `LeaderboardScreen.tsx`, `HomeScreen.tsx`, `ErrorDetails.tsx`, `SignUpScreen.tsx`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Should `useAppTheme` be split into smaller, more focused modules?**
  _Cohesion score 0.057971014492753624 - nodes in this community are weakly interconnected._
- **Why does `ScanBottleScreen()` connect `ScanBottleScreen.tsx` to `useAppTheme`, `PetSelectScreen.tsx`, `HomeScreen.tsx`, `AppNavigator.tsx`, `SignUpScreen.tsx`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
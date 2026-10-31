# Graph Report - HydroHomies\app  (2026-10-31)

## Corpus Check
- 83 files · ~36,827 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 559 nodes · 1265 edges · 22 communities (20 shown, 2 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 135 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `72f1a9ad`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- context.tsx
- useAppTheme
- Text.tsx
- ScanBottleScreen.tsx
- LoginScreen.tsx
- HomeScreen.tsx
- navigationUtilities.ts
- Header.tsx
- FriendPetScreen.tsx
- SignUpScreen.tsx
- i18n/index.ts
- LeaderboardScreen.tsx
- ErrorDetails.tsx
- api/index.ts
- AutoImage.tsx
- crashReporting.ts
- tfjsRN.web.ts

## God Nodes (most connected - your core abstractions)
1. `useAppTheme()` - 59 edges
2. `HomeScreen()` - 26 edges
3. `ThemedStyle` - 23 edges
4. `Text` - 20 edges
5. `LeaderboardScreen()` - 20 edges
6. `TextProps` - 18 edges
7. `ScanBottleScreen()` - 18 edges
8. `AppStackScreenProps` - 17 edges
9. `FriendPetScreen()` - 15 edges
10. `Pet()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `Card()` --calls--> `useAppTheme()`  [EXTRACTED]
  HydroHomies/app/components/Card.tsx → HydroHomies/app/theme/context.tsx
- `Button()` --calls--> `useAppTheme()`  [EXTRACTED]
  HydroHomies/app/components/Button.tsx → HydroHomies/app/theme/context.tsx
- `CardProps` --references--> `TextProps`  [EXTRACTED]
  HydroHomies/app/components/Card.tsx → HydroHomies/app/components/Text.tsx
- `Container()` --calls--> `useAppTheme()`  [EXTRACTED]
  HydroHomies/app/components/Container.tsx → HydroHomies/app/theme/context.tsx
- `Dropdown()` --calls--> `useAppTheme()`  [EXTRACTED]
  HydroHomies/app/components/Dropdown.tsx → HydroHomies/app/theme/context.tsx

## Import Cycles
- None detected.

## Communities (22 total, 2 thin omitted)

### Community 0 - "context.tsx"
Cohesion: 0.05
Nodes (49): Dropdown(), $dropdownBox, DropdownProps, $label(), $menuContainer, Option, $optionItem, $overlay (+41 more)

### Community 1 - "useAppTheme"
Cohesion: 0.05
Nodes (48): HeaderActionProps, BaseIconProps, Icon(), IconProps, iconRegistry, IconTypes, $imageStyleBase, PressableIcon() (+40 more)

### Community 2 - "Text.tsx"
Cohesion: 0.06
Nodes (43): Button(), ButtonAccessoryProps, ButtonProps, Presets, $pressedTextPresets, $pressedViewPresets, $textPresets, $viewPresets (+35 more)

### Community 3 - "ScanBottleScreen.tsx"
Cohesion: 0.06
Nodes (41): $button(), $buttonRow(), $camera(), $cameraContainer(), $cameraOverlay(), $controls(), $detectionInfo(), $imageContainer() (+33 more)

### Community 4 - "LoginScreen.tsx"
Cohesion: 0.08
Nodes (39): Container(), ContainerProps, $heading(), $innerBox(), $outerBox(), TextFieldAccessoryProps, useAuth(), AppStack() (+31 more)

### Community 5 - "HomeScreen.tsx"
Cohesion: 0.09
Nodes (35): AuthContext, AuthContextType, AuthProvider(), AuthProviderProps, $actionButton(), $actionsSection(), $entriesSection(), $entryInfo() (+27 more)

### Community 6 - "navigationUtilities.ts"
Cohesion: 0.08
Nodes (25): App(), config, NAVIGATION_PERSISTENCE_KEY, prefix, BaseConfig, ConfigBaseProps, PersistNavigationConfig, Config (+17 more)

### Community 7 - "Header.tsx"
Cohesion: 0.08
Nodes (33): $actionFillerContainer, $actionIconContainer(), $actionText(), $actionTextContainer(), $container, Header(), HeaderAction(), HeaderProps (+25 more)

### Community 8 - "FriendPetScreen.tsx"
Cohesion: 0.13
Nodes (26): $container(), $experienceText(), $healthBarBackground(), $healthBarContainer(), $healthBarFill(), $healthLabel(), Pet(), $petContainer() (+18 more)

### Community 9 - "SignUpScreen.tsx"
Cohesion: 0.14
Nodes (25): $activityButton(), $activityButtons(), $button(), $goalContainer(), OnboardingScreen(), $screenContentContainer(), $sectionTitle(), $subtitle() (+17 more)

### Community 10 - "i18n/index.ts"
Cohesion: 0.15
Nodes (17): ar, en, Translations, es, fr, hi, locale, pickSupportedLocale() (+9 more)

### Community 11 - "LeaderboardScreen.tsx"
Cohesion: 0.14
Nodes (21): $close(), $goalText(), $header(), $healthIndicator(), $hydrationText(), $infoContainer(), LeaderboardItem, LeaderboardScreen() (+13 more)

### Community 12 - "ErrorDetails.tsx"
Cohesion: 0.14
Nodes (13): ErrorBoundary, Props, State, $contentContainer(), $errorBacktrace(), $errorContent(), ErrorDetails(), ErrorDetailsProps (+5 more)

### Community 13 - "api/index.ts"
Cohesion: 0.29
Nodes (7): GeneralApiProblem, getGeneralApiProblem(), Api, DEFAULT_API_CONFIG, ApiConfig, ApiFeedResponse, EpisodeItem

### Community 14 - "AutoImage.tsx"
Cohesion: 0.67
Nodes (3): AutoImage(), AutoImageProps, useAutoImage()

## Knowledge Gaps
- **117 isolated node(s):** `NAVIGATION_PERSISTENCE_KEY`, `prefix`, `config`, `AutoImageProps`, `Presets` (+112 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAppTheme()` connect `useAppTheme` to `context.tsx`, `Text.tsx`, `ScanBottleScreen.tsx`, `LoginScreen.tsx`, `HomeScreen.tsx`, `navigationUtilities.ts`, `Header.tsx`, `FriendPetScreen.tsx`, `SignUpScreen.tsx`, `LeaderboardScreen.tsx`, `ErrorDetails.tsx`?**
  _High betweenness centrality (0.151) - this node is a cross-community bridge._
- **Why does `ThemedStyle` connect `context.tsx` to `useAppTheme`, `Text.tsx`, `ScanBottleScreen.tsx`, `LoginScreen.tsx`, `HomeScreen.tsx`, `Header.tsx`, `FriendPetScreen.tsx`, `SignUpScreen.tsx`, `LeaderboardScreen.tsx`, `ErrorDetails.tsx`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `Config` connect `navigationUtilities.ts` to `LoginScreen.tsx`, `api/index.ts`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Are the 20 inferred relationships involving `HomeScreen()` (e.g. with `$actionButton()` and `$actionsSection()`) actually correct?**
  _`HomeScreen()` has 20 INFERRED edges - model-reasoned connections that need verification._
- **Are the 17 inferred relationships involving `LeaderboardScreen()` (e.g. with `$close()` and `$goalText()`) actually correct?**
  _`LeaderboardScreen()` has 17 INFERRED edges - model-reasoned connections that need verification._
- **What connects `NAVIGATION_PERSISTENCE_KEY`, `prefix`, `config` to the rest of the system?**
  _117 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `context.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05407925407925408 - nodes in this community are weakly interconnected._
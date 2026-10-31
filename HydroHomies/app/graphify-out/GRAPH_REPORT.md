# Graph Report - HydroHomies\app  (2026-10-31)

## Corpus Check
- 88 files · ~29,438 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 581 nodes · 1368 edges · 25 communities (23 shown, 2 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 95 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `72f1a9ad`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- context.tsx
- Toggle.tsx
- Text.tsx
- useAppTheme
- SignUpScreen.tsx
- HomeScreen.tsx
- AppNavigator.tsx
- Header.tsx
- PetSelectScreen.tsx
- database.ts
- i18n/index.ts
- ListItem.tsx
- ErrorDetails.tsx
- Switch.tsx
- AutoImage.tsx
- crashReporting.ts
- ThemedStyle
- Checkbox.tsx
- Icon.tsx
- styles.ts

## God Nodes (most connected - your core abstractions)
1. `useAppTheme()` - 65 edges
2. `ThemedStyle` - 24 edges
3. `Text` - 21 edges
4. `HomeScreen()` - 19 edges
5. `TextProps` - 18 edges
6. `AppStackScreenProps` - 17 edges
7. `ScanBottleScreen()` - 16 edges
8. `TextField` - 14 edges
9. `SignUpScreen()` - 14 edges
10. `Pet()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `Card()` --calls--> `useAppTheme()`  [EXTRACTED]
  HydroHomies/app/components/Card.tsx → HydroHomies/app/theme/context.tsx
- `ListItemAction()` --calls--> `useAppTheme()`  [EXTRACTED]
  HydroHomies/app/components/ListItem.tsx → HydroHomies/app/theme/context.tsx
- `CheckboxInput()` --calls--> `useAppTheme()`  [EXTRACTED]
  HydroHomies/app/components/Toggle/Checkbox.tsx → HydroHomies/app/theme/context.tsx
- `RadioInput()` --calls--> `useAppTheme()`  [EXTRACTED]
  HydroHomies/app/components/Toggle/Radio.tsx → HydroHomies/app/theme/context.tsx
- `SwitchAccessibilityLabel()` --calls--> `useAppTheme()`  [EXTRACTED]
  HydroHomies/app/components/Toggle/Switch.tsx → HydroHomies/app/theme/context.tsx

## Import Cycles
- None detected.

## Communities (25 total, 2 thin omitted)

### Community 0 - "context.tsx"
Cohesion: 0.07
Nodes (40): colors, palette, colors, palette, ThemeContext, ThemeContextType, ThemeProvider(), ThemeProviderProps (+32 more)

### Community 1 - "Toggle.tsx"
Cohesion: 0.16
Nodes (11): $inputOuter, $radioDetail, RadioInput(), RadioToggleProps, FieldLabel(), $helper(), $inputOuterBase, $inputWrapper (+3 more)

### Community 2 - "Text.tsx"
Cohesion: 0.06
Nodes (42): ButtonAccessoryProps, ButtonProps, Presets, $pressedTextPresets, $pressedViewPresets, $textPresets, $viewPresets, $alignmentWrapper (+34 more)

### Community 3 - "useAppTheme"
Cohesion: 0.07
Nodes (49): Button(), $bigNumber(), $camera, $cameraOverlay(), $center, $centerText, $controls(), $dim() (+41 more)

### Community 4 - "SignUpScreen.tsx"
Cohesion: 0.09
Nodes (35): Container(), ContainerProps, $heading(), $innerBox(), $outerBox(), AuthContext, AuthContextType, $error() (+27 more)

### Community 5 - "HomeScreen.tsx"
Cohesion: 0.09
Nodes (34): AppStackScreenProps, $card(), $container(), $dim(), $flex, FriendPetScreen(), FriendPetScreenProps, $header() (+26 more)

### Community 6 - "AppNavigator.tsx"
Cohesion: 0.07
Nodes (33): App(), config, NAVIGATION_PERSISTENCE_KEY, prefix, BaseConfig, ConfigBaseProps, PersistNavigationConfig, Config (+25 more)

### Community 7 - "Header.tsx"
Cohesion: 0.08
Nodes (33): $actionFillerContainer, $actionIconContainer(), $actionText(), $actionTextContainer(), $container, Header(), HeaderAction(), HeaderProps (+25 more)

### Community 8 - "PetSelectScreen.tsx"
Cohesion: 0.07
Nodes (54): Bar(), $barContainer(), $barFill, $barTrack(), $centered(), $container(), $dim(), $faded (+46 more)

### Community 9 - "database.ts"
Cohesion: 0.08
Nodes (41): ACTIVITY_OPTIONS, $container(), DEFAULT_STATS_FORM, $half, parseStatsForm(), previewGoal(), $row(), SEX_OPTIONS (+33 more)

### Community 10 - "i18n/index.ts"
Cohesion: 0.13
Nodes (19): ar, DeepPartial, en, PartialTranslations, Translations, es, fr, hi (+11 more)

### Community 11 - "ListItem.tsx"
Cohesion: 0.16
Nodes (10): HeaderActionProps, IconTypes, $iconContainer, ListItem, ListItemAction(), ListItemActionProps, ListItemProps, $textStyle() (+2 more)

### Community 12 - "ErrorDetails.tsx"
Cohesion: 0.14
Nodes (13): ErrorBoundary, Props, State, $contentContainer(), $errorBacktrace(), $errorContent(), ErrorDetails(), ErrorDetailsProps (+5 more)

### Community 13 - "Switch.tsx"
Cohesion: 0.17
Nodes (11): $inputOuter, $switchAccessibility, $switchAccessibilityCircle, $switchAccessibilityIcon, SwitchAccessibilityLabel(), $switchAccessibilityLine, $switchDetail, $switchInner() (+3 more)

### Community 14 - "AutoImage.tsx"
Cohesion: 0.67
Nodes (3): AutoImage(), AutoImageProps, useAutoImage()

### Community 16 - "ThemedStyle"
Cohesion: 0.18
Nodes (11): Dropdown(), $dropdownBox, DropdownProps, $label(), $menuContainer, Option, $optionItem, $optionText (+3 more)

### Community 22 - "Checkbox.tsx"
Cohesion: 0.25
Nodes (7): $checkboxDetail, CheckboxInput(), CheckboxInputProps, $inputOuter, RadioInputProps, SwitchInputProps, BaseToggleInputProps

### Community 23 - "Icon.tsx"
Cohesion: 0.25
Nodes (7): BaseIconProps, Icon(), IconProps, iconRegistry, $imageStyleBase, PressableIcon(), PressableIconProps

## Knowledge Gaps
- **146 isolated node(s):** `NAVIGATION_PERSISTENCE_KEY`, `prefix`, `config`, `AutoImageProps`, `Presets` (+141 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAppTheme()` connect `useAppTheme` to `context.tsx`, `Toggle.tsx`, `Text.tsx`, `SignUpScreen.tsx`, `HomeScreen.tsx`, `AppNavigator.tsx`, `Header.tsx`, `PetSelectScreen.tsx`, `database.ts`, `ListItem.tsx`, `ErrorDetails.tsx`, `Switch.tsx`, `ThemedStyle`, `Checkbox.tsx`, `Icon.tsx`?**
  _High betweenness centrality (0.148) - this node is a cross-community bridge._
- **Why does `ThemedStyle` connect `ThemedStyle` to `context.tsx`, `Toggle.tsx`, `Text.tsx`, `useAppTheme`, `SignUpScreen.tsx`, `HomeScreen.tsx`, `Header.tsx`, `PetSelectScreen.tsx`, `database.ts`, `ListItem.tsx`, `ErrorDetails.tsx`, `Switch.tsx`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `ErrorBoundary` connect `ErrorDetails.tsx` to `AppNavigator.tsx`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Are the 12 inferred relationships involving `HomeScreen()` (e.g. with `$actions()` and `$card()`) actually correct?**
  _`HomeScreen()` has 12 INFERRED edges - model-reasoned connections that need verification._
- **What connects `NAVIGATION_PERSISTENCE_KEY`, `prefix`, `config` to the rest of the system?**
  _146 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `context.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06641604010025062 - nodes in this community are weakly interconnected._
- **Should `Text.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06289308176100629 - nodes in this community are weakly interconnected._
/**
 * Default (web) implementation: @tensorflow/tfjs-react-native is native-only.
 * Metro and Jest load tfjsRN.native.ts on iOS/Android instead. This file also
 * provides the types TypeScript sees for both.
 */
import type * as TfjsRN from "@tensorflow/tfjs-react-native"

export const bundleResourceIO: typeof TfjsRN.bundleResourceIO | null = null
export const decodeJpeg: typeof TfjsRN.decodeJpeg | null = null

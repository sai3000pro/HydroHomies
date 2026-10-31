import type { EstimateSource } from "@/services/firebase/database"
import { classifyWaterLevel } from "@/services/ml/waterLevelClassifier"

import { requestAiEstimate } from "./aiEstimate"
import { volumeFromLevel, type ScanPhase } from "./estimate"

export const DEFAULT_BOTTLE_ML = 500

export interface BottleReading {
  bottleVolume: number
  waterVolume: number
  confidence: number | null
  source: EstimateSource
  /** Why the preferred method wasn't used, for display */
  note?: string
}

/**
 * Estimates the water in a bottle photo. Tries, in order:
 *   1. AI estimate (Firebase function -> OpenRouter vision model)
 *   2. On-device level classifier (before photo only; it has no "empty" class)
 *   3. Manual entry with a sensible default
 */
export async function analyzeBottle(
  imageUri: string,
  phase: ScanPhase,
  knownBottleVolume: number | null,
  knownBeforeVolume: number | null = null,
): Promise<BottleReading> {
  let aiError = ""
  try {
    const ai = await requestAiEstimate(imageUri, phase, knownBottleVolume)
    return { ...ai, source: "ai" }
  } catch (e: any) {
    aiError = e?.message ?? String(e)
    console.warn("AI estimate unavailable:", aiError)
  }

  const bottleVolume = knownBottleVolume ?? DEFAULT_BOTTLE_ML
  if (phase === "before") {
    const prediction = await classifyWaterLevel(imageUri).catch(() => null)
    if (prediction) {
      return {
        bottleVolume,
        waterVolume: volumeFromLevel(prediction.level, bottleVolume),
        confidence: prediction.confidence,
        source: "on-device",
        note: `AI estimate unavailable. On-device model says "${prediction.level}". Set your bottle size below.`,
      }
    }
  }

  return {
    bottleVolume,
    // Default "after" to unchanged so a failed estimate never over-logs; the user lowers it
    waterVolume: phase === "before" ? bottleVolume : (knownBeforeVolume ?? 0),
    confidence: null,
    source: "manual",
    note:
      phase === "before"
        ? "Couldn't estimate automatically. Adjust the amount below."
        : "Couldn't estimate automatically. Lower \"Water left\" to what's still in the bottle.",
  }
}

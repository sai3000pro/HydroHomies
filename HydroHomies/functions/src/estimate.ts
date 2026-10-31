/**
 * Prompt and reply parsing for the bottle estimate.
 * Keep in sync with app/services/vision/estimate.ts (used by the app's dev-only fallback).
 */
export type ScanPhase = "before" | "after"

export interface BottleEstimate {
  bottleVolume: number
  waterVolume: number
  confidence: number
}

export const MAX_BOTTLE_ML = 3000

export function buildEstimatePrompt(phase: ScanPhase, knownBottleVolume?: number | null): string {
  const context =
    phase === "after"
      ? "This photo was taken after the person drank from the bottle. It may be empty." +
        (knownBottleVolume
          ? ` It is the same bottle as before, with a capacity of about ${Math.round(knownBottleVolume)} ml.`
          : "")
      : "This photo was taken before the person drank from the bottle."
  return `You are estimating liquid volume in a drinking container from a photo. ${context}
Estimate:
1. bottleVolume: the total capacity of the container in milliliters.
2. waterVolume: the amount of liquid currently in it in milliliters (0 if empty).
3. confidence: 0.0 to 1.0. Use a low value if no container is visible.
Respond with JSON only, exactly: {"bottleVolume": <number>, "waterVolume": <number>, "confidence": <number>}`
}

export function parseEstimateText(text: string): BottleEstimate {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error("No JSON object in model reply")
  const raw = JSON.parse(match[0])
  const bottle = Number(raw.bottleVolume)
  const water = Number(raw.waterVolume)
  const confidence = Number(raw.confidence)
  if (![bottle, water, confidence].every(Number.isFinite)) {
    throw new Error("Model reply is missing bottleVolume, waterVolume or confidence")
  }
  const bottleVolume = clamp(Math.round(bottle), 0, MAX_BOTTLE_ML)
  return {
    bottleVolume,
    waterVolume: clamp(Math.round(water), 0, bottleVolume || MAX_BOTTLE_ML),
    confidence: clamp(confidence, 0, 1),
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

/**
 * AI bottle estimate.
 *
 * If EXPO_PUBLIC_OPENROUTER_API_KEY is set, the app calls OpenRouter directly.
 * This works on the free Spark plan. The key is embedded in the app bundle and
 * there's no per-user rate limit, so set a spending limit on the key in OpenRouter.
 *
 * Without that variable, the app calls the `estimateBottle` Firebase callable
 * function (functions/), which keeps the key server-side and rate-limits each
 * user. Deploying it needs the Blaze plan.
 */
import * as ImageManipulator from "expo-image-manipulator"
import { httpsCallable } from "firebase/functions"

import { functions } from "@/services/firebase/config"

import {
  buildEstimatePrompt,
  parseEstimateText,
  type BottleEstimate,
  type ScanPhase,
} from "./estimate"

interface EstimateRequest {
  image: string // base64 JPEG, no data: prefix
  phase: ScanPhase
  bottleVolume?: number | null
}

const estimateBottleFn = httpsCallable<EstimateRequest, BottleEstimate>(
  functions,
  "estimateBottle",
  {
    timeout: 45_000,
  },
)

/** Downscales the photo so requests stay small (~100 KB) */
async function toJpegBase64(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 768 } }], {
    compress: 0.7,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  })
  if (!result.base64) throw new Error("Could not encode image")
  return result.base64.replace(/^data:image\/\w+;base64,/, "")
}

export async function requestAiEstimate(
  imageUri: string,
  phase: ScanPhase,
  knownBottleVolume?: number | null,
): Promise<BottleEstimate> {
  const image = await toJpegBase64(imageUri)
  const directKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY
  if (directKey) return callOpenRouterDirect(directKey, image, phase, knownBottleVolume)

  const { data } = await estimateBottleFn({
    image,
    phase,
    bottleVolume: knownBottleVolume ?? null,
  })
  return data
}

async function callOpenRouterDirect(
  apiKey: string,
  image: string,
  phase: ScanPhase,
  knownBottleVolume?: number | null,
): Promise<BottleEstimate> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.EXPO_PUBLIC_OPENROUTER_MODEL || "google/gemini-2.5-flash",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: buildEstimatePrompt(phase, knownBottleVolume) },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}` } },
          ],
        },
      ],
    }),
  })
  if (!response.ok) throw new Error(`OpenRouter ${response.status}: ${await response.text()}`)
  const data = await response.json()
  const text = data?.choices?.[0]?.message?.content
  if (typeof text !== "string") throw new Error("OpenRouter returned no content")
  return parseEstimateText(text)
}

/**
 * estimateBottle: callable function that sends a bottle photo to a vision
 * model on OpenRouter and returns { bottleVolume, waterVolume, confidence }.
 *
 * The OpenRouter key is a Secret Manager secret, so it never ships in the app:
 *   firebase functions:secrets:set OPENROUTER_API_KEY
 */
import { initializeApp } from "firebase-admin/app"
import { FieldValue, getFirestore } from "firebase-admin/firestore"
import { defineSecret, defineString } from "firebase-functions/params"
import { HttpsError, onCall } from "firebase-functions/v2/https"

import { buildEstimatePrompt, parseEstimateText, type BottleEstimate } from "./estimate"

initializeApp()

const OPENROUTER_API_KEY = defineSecret("OPENROUTER_API_KEY")
const OPENROUTER_MODEL = defineString("OPENROUTER_MODEL", { default: "google/gemini-2.5-flash" })

/** Calls per user per UTC day; each scan is 2 calls */
const DAILY_LIMIT = 60
/** ~1.5 MB of JPEG. The app sends ~100 KB (768 px wide, 70% quality). */
const MAX_IMAGE_BASE64_CHARS = 2_000_000

export const estimateBottle = onCall(
  { secrets: [OPENROUTER_API_KEY], timeoutSeconds: 60, memory: "256MiB", maxInstances: 10 },
  async (request): Promise<BottleEstimate> => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError("unauthenticated", "Sign in to estimate bottles.")

    const { image, phase, bottleVolume } = (request.data ?? {}) as Record<string, unknown>
    if (typeof image !== "string" || image.length === 0 || image.length > MAX_IMAGE_BASE64_CHARS) {
      throw new HttpsError("invalid-argument", "image must be a base64 JPEG under 1.5 MB")
    }
    if (!/^[A-Za-z0-9+/=\s]+$/.test(image)) {
      throw new HttpsError("invalid-argument", "image must be plain base64 without a data: prefix")
    }
    if (phase !== "before" && phase !== "after") {
      throw new HttpsError("invalid-argument", "phase must be 'before' or 'after'")
    }
    const knownBottle =
      typeof bottleVolume === "number" && bottleVolume > 0 && bottleVolume <= 3000
        ? bottleVolume
        : null

    await enforceDailyLimit(uid)
    try {
      return await callVisionModel(image, phase, knownBottle)
    } catch (e) {
      // Don't charge the user's quota for our failures
      await refundDailyLimit(uid).catch(() => {})
      throw e
    }
  },
)

async function callVisionModel(
  image: string,
  phase: "before" | "after",
  knownBottle: number | null,
): Promise<BottleEstimate> {
  {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY.value()}`,
        "Content-Type": "application/json",
        "X-Title": "HydroHype",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL.value(),
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: buildEstimatePrompt(phase, knownBottle) },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}` } },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      console.error("OpenRouter error", response.status, await response.text())
      throw new HttpsError("unavailable", "The vision model is unavailable. Try again shortly.")
    }

    const data = (await response.json()) as any
    const text = data?.choices?.[0]?.message?.content
    try {
      if (typeof text !== "string") throw new Error("empty reply")
      return parseEstimateText(text)
    } catch (e) {
      console.error("Unparseable model reply", text, e)
      throw new HttpsError("internal", "Couldn't read the model's answer.")
    }
  }
}

const usageRef = (uid: string) =>
  getFirestore().doc(`aiUsage/${uid}_${new Date().toISOString().slice(0, 10)}`)

/** Per-user daily counter in aiUsage/{uid}_{YYYY-MM-DD}. Clients can't read or write it (see firestore.rules). */
async function enforceDailyLimit(uid: string): Promise<void> {
  const ref = usageRef(uid)
  await getFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const count = (snap.get("count") as number | undefined) ?? 0
    if (count >= DAILY_LIMIT) {
      throw new HttpsError("resource-exhausted", `Daily limit of ${DAILY_LIMIT} estimates reached.`)
    }
    tx.set(ref, { uid, count: FieldValue.increment(1) }, { merge: true })
  })
}

async function refundDailyLimit(uid: string): Promise<void> {
  await usageRef(uid).set({ count: FieldValue.increment(-1) }, { merge: true })
}

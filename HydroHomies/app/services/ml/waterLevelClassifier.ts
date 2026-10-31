/**
 * On-device water level classifier (TF.js, MobileNetV2 fine-tuned on the
 * Kaggle "water bottle" dataset; see ml_training/).
 *
 * Classes: half, full, overflowing. The dataset has no "empty" class, so this
 * model is only used for the *before* photo, and only when the AI estimate is
 * unavailable. Validation accuracy was ~80% on 356 images.
 *
 * Needs a development or production build: @tensorflow/tfjs-react-native uses
 * expo-gl and native modules. In Expo Go, loadModel() fails and the app falls
 * back to manual entry.
 *
 * The bundled model.json was exported from Keras 3 and rewritten for tfjs by
 * scripts/patch-keras3-model.js. Check it with `npm run model:verify`.
 */
import { Platform } from "react-native"
import * as ImageManipulator from "expo-image-manipulator"
import * as tf from "@tensorflow/tfjs"

import { LEVEL_FRACTION, type ModelWaterLevel } from "@/services/vision/estimate"

type TfjsRN = typeof import("./tfjsRN")

const INPUT_SIZE = 224
const CLASSES = ["half", "full", "overflowing"] as const satisfies readonly ModelWaterLevel[]

let model: tf.LayersModel | null = null
let decodeJpeg: TfjsRN["decodeJpeg"] = null
let loading: Promise<tf.LayersModel | null> | null = null

export interface LevelPrediction {
  level: ModelWaterLevel
  fraction: number
  confidence: number
}

/** Loads the model once. Resolves to false if it can't run on this platform. */
export function loadModel(): Promise<boolean> {
  if (!loading) {
    loading = (async () => {
      try {
        if (Platform.OS === "web") return null
        // Required lazily so a missing native module (e.g. in Expo Go) is caught here
        // instead of crashing at startup. Metro resolves tfjsRN.native.ts on iOS/Android.
        const rn: TfjsRN = require("./tfjsRN")
        if (!rn.bundleResourceIO || !rn.decodeJpeg) return null
        await tf.ready()
        const { bundleResourceIO } = rn
        decodeJpeg = rn.decodeJpeg
        const modelJson = require("../../../assets/models/water-level-classifier/model.json")
        const weights = require("../../../assets/models/water-level-classifier/group1-shard1of1.bin")
        model = await tf.loadLayersModel(bundleResourceIO(modelJson, weights))
        return model
      } catch (error: any) {
        console.warn("On-device water level model unavailable:", error?.message ?? error)
        return null
      }
    })()
  }
  return loading.then((m) => m !== null)
}

export function isModelReady(): boolean {
  return model !== null
}

/** Classifies the water level in a photo, or returns null if the model isn't loaded */
export async function classifyWaterLevel(imageUri: string): Promise<LevelPrediction | null> {
  if (!model || !decodeJpeg) return null

  const resized = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: INPUT_SIZE, height: INPUT_SIZE } }],
    { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  )
  if (!resized.base64) return null
  const bytes = base64ToBytes(resized.base64)

  const decode = decodeJpeg
  const current = model
  const probs = tf.tidy(() => {
    const image = decode(bytes, 3)
    // Training normalized pixels to [0, 1] (train_water_level_model.py)
    const input = tf.image
      .resizeBilinear(image, [INPUT_SIZE, INPUT_SIZE])
      .toFloat()
      .div(255)
      .expandDims(0)
    return current.predict(input) as tf.Tensor
  })
  const values = Array.from(await probs.data())
  probs.dispose()

  let best = 0
  for (let i = 1; i < values.length; i++) if (values[i] > values[best]) best = i
  const level = CLASSES[best]
  return { level, fraction: LEVEL_FRACTION[level], confidence: values[best] }
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64.replace(/^data:image\/\w+;base64,/, ""))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

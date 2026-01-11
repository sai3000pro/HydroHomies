/**
 * ML Model for Water Level Classification
 *
 * This service loads and uses a TensorFlow.js model trained to classify water bottle levels:
 * - half, full, overflowing
 *
 * Model training: See ../../ml_training/train_water_level_model.py
 * Dataset: https://www.kaggle.com/datasets/chethuhn/water-bottle-dataset
 *
 * ⚠️ IMPORTANT: This requires a development build or production build.
 * Expo Go does NOT support TensorFlow.js React Native (requires native code).
 * To use the ML model, create a development build:
 *   npx expo prebuild
 *   npm run android  # or npm run ios
 */

import * as tf from "@tensorflow/tfjs"
import { Platform } from "react-native"
import { Asset } from "expo-asset"
import * as ImageManipulator from "expo-image-manipulator"

// Platform-specific TensorFlow.js React Native imports
// Metro bundler automatically selects the right file based on platform:
// - tfjsRN.native.ts for iOS/Android (contains actual imports)
// - tfjsRN.web.ts for web (returns null)
// @ts-ignore - Metro resolves platform-specific files automatically
import { bundleResourceIO, decodeJpeg } from "./tfjsRN"

export type WaterLevel = "empty" | "low" | "half" | "full" | "overflowing"
export type BottleType = {
  name: string
  volume: number // in ml
  brand?: string
}

export interface BottleDetection {
  bottleType: BottleType
  waterLevel: WaterLevel
  estimatedVolume: number // in ml
  confidence: number // 0-1
}

export interface TribunalEstimate {
  bottleVolume: number // in ml
  waterVolume: number // in ml
  confidence: number // 0-1
  source: "openrouter"
}

export interface TribunalResult {
  estimate: TribunalEstimate
}

// Model configuration
const MODEL_INPUT_SIZE = 224 // Match training configuration
// Note: The trained model only has 3 classes: half, full, overflowing
// "empty" and "low" are handled separately in simulated detection
const CLASSES: WaterLevel[] = ["half", "full", "overflowing"] // Actual model classes
const NUM_CLASSES = CLASSES.length

// Model instance (loaded once, reused for all predictions)
let model: tf.LayersModel | null = null
let isModelLoading = false
let modelLoadError: Error | null = null
let isTensorFlowReady = false

/**
 * Initialize TensorFlow.js backend for React Native
 * Call this once at app startup, before loading the model
 */
export async function initializeTensorFlow(): Promise<void> {
  if (isTensorFlowReady) {
    return
  }

  try {
    // Initialize TensorFlow.js for React Native
    await tf.ready()
    isTensorFlowReady = true
    console.log("✅ TensorFlow.js initialized successfully")
  } catch (error) {
    console.error("❌ Error initializing TensorFlow.js:", error)
    isTensorFlowReady = false
    throw error
  }
}

/**
 * Load the trained water level classification model
 * Model should be placed in assets/models/water-level-classifier/
 */
export async function loadMLModel(): Promise<void> {
  if (model !== null) {
    console.log("✅ Model already loaded")
    return
  }

  if (isModelLoading) {
    console.log("⏳ Model is already loading, waiting...")
    // Wait for loading to complete
    while (isModelLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    if (model === null && modelLoadError) {
      throw modelLoadError
    }
    return
  }

  isModelLoading = true
  modelLoadError = null

  try {
    console.log("📥 Loading water level classification model...")

    // Initialize TensorFlow.js if not already done
    await initializeTensorFlow()

    // Check if we're in Expo Go (which doesn't support native modules)
    if (Platform.OS !== "web" && !bundleResourceIO) {
      throw new Error(
        "TensorFlow.js React Native is not available. " +
          "This requires a development build or production build. " +
          "Expo Go does not support custom native modules. " +
          "Run: npx expo prebuild && npm run android",
      )
    }

    // Load model from assets
    // The model should be placed in: assets/models/water-level-classifier/model.json
    // According to TensorFlow.js React Native docs, bundleResourceIO works with require() statements
    try {
      if (Platform.OS === "web") {
        // On web, use Asset.fromModule with require
        const modelJson = require("../../../assets/models/water-level-classifier/model.json")
        const modelJsonAsset = Asset.fromModule(modelJson)
        await modelJsonAsset.downloadAsync()

        if (!modelJsonAsset.localUri) {
          throw new Error("Failed to get local URI for model.json")
        }

        model = await tf.loadLayersModel(modelJsonAsset.localUri)
      } else if (bundleResourceIO) {
        // On native with bundleResourceIO (development build)
        // bundleResourceIO expects the model JSON and weights as require() module references
        // Note: require() for JSON returns the parsed object, but bundleResourceIO should handle it
        // For .bin files, Metro bundles them as assets when they're in assetExts
        try {
          // Require model JSON and weights
          // According to TensorFlow.js React Native docs, this should work with bundleResourceIO
          const modelJson = require("../../../assets/models/water-level-classifier/model.json")
          const modelWeights = require("../../../assets/models/water-level-classifier/group1-shard1of1.bin")

          // Use bundleResourceIO to create an IO handler
          // bundleResourceIO(modelJson, modelWeights) where modelWeights can be a single file or array
          const modelHandler = bundleResourceIO(modelJson, modelWeights)

          // Load the model using bundleResourceIO
          model = await tf.loadLayersModel(modelHandler)
        } catch (bundleError: any) {
          // If bundleResourceIO fails (e.g., require() for .bin doesn't work),
          // fall back to error handling
          console.warn("⚠️  bundleResourceIO failed:", bundleError.message)
          throw bundleError
        }
      } else {
        // Fallback for Expo Go (shouldn't reach here due to earlier check)
        throw new Error("bundleResourceIO is not available")
      }

      console.log("✅ Model loaded successfully from assets")
      console.log(`   Input shape: ${model.inputs[0].shape}`)
      console.log(`   Output shape: ${model.outputs[0].shape}`)
    } catch (assetError: any) {
      // If Asset URI loading fails, the model can't be loaded in this environment
      // This is expected in Expo Go since TensorFlow.js can't load weights files
      // Note: bundleResourceIO requires native modules and doesn't work in Expo Go
      // Also, Metro bundler can't resolve .bin files with require() in Expo
      console.warn("⚠️  Could not load model from assets:", assetError.message)

      // Check if this is a model architecture error (which happens in dev builds)
      // vs Expo Go error (which happens in Expo Go)
      if (
        assetError.message?.includes("InputLayer") ||
        assetError.message?.includes("inputShape") ||
        assetError.message?.includes("batchInputShape")
      ) {
        console.warn("    This is a model architecture compatibility issue.")
        console.warn(
          "    The model files are loading correctly, but there's a format compatibility issue.",
        )
        console.warn("    The app will use simulated detection as a fallback.")
        // Don't throw - let it fall through to set model = null and use fallback
        throw new Error(`Model architecture compatibility issue. Using fallback detection.`)
      } else {
        console.warn("    This is expected in Expo Go. The ML model requires native code.")
        console.warn(
          "    To use the ML model, create a development build: npx expo prebuild && npm run android",
        )
        console.warn("    The app will use simulated detection as a fallback.")
        // Don't throw - let it fall through to set model = null and use fallback
        throw new Error(`Model loading failed. Using fallback detection.`)
      }
    }
  } catch (error: any) {
    modelLoadError = error
    model = null

    // Don't throw for expected errors - just log and continue with fallback
    if (
      error.message?.includes("Expo Go") ||
      error.message?.includes("native modules") ||
      error.message?.includes("Using fallback detection") ||
      error.message?.includes("architecture compatibility") ||
      error.message?.includes("InputLayer") ||
      error.message?.includes("inputShape") ||
      error.message?.includes("batchInputShape")
    ) {
      // Expected errors - model not available, use fallback
      if (
        error.message?.includes("architecture compatibility") ||
        error.message?.includes("InputLayer")
      ) {
        console.warn("⚠️  ML model architecture compatibility issue. Using fallback detection.")
      } else if (error.message?.includes("Expo Go")) {
        console.warn(
          "⚠️  ML model not available in Expo Go. Use a development build to enable ML features.",
        )
      } else {
        console.warn("⚠️  ML model not available, using fallback detection.")
      }
      return
    }

    // Unexpected error - log as warning but don't throw (use fallback)
    console.warn("⚠️  Unexpected error loading model:", error.message)
    console.warn("    Using fallback detection due to model loading error.")
    return
  } finally {
    isModelLoading = false
  }
}

/**
 * Unload the ML model and free memory
 */
export async function unloadMLModel(): Promise<void> {
  if (model !== null) {
    model.dispose()
    model = null
    console.log("🗑️  Model unloaded and memory freed")
  }
}

/**
 * Preprocess image for model input
 *
 * Properly decodes JPEG images and converts them to tensors for the ML model.
 * Uses decodeJpeg for native platforms and tf.browser.fromPixels for web.
 */
async function preprocessImageToTensor(imageUri: string): Promise<tf.Tensor4D> {
  try {
    // Resize image to model input size (224x224)
    const resized = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: MODEL_INPUT_SIZE, height: MODEL_INPUT_SIZE } }],
      {
        compress: 0.9, // Good quality for ML inference
        format: ImageManipulator.SaveFormat.JPEG,
        base64: Platform.OS === "web" ? true : false, // Only need base64 for web
      },
    )

    if (Platform.OS === "web") {
      // Web platform: Use tf.browser.fromPixels with HTML Image element
      return await preprocessImageWeb(resized.uri, resized.base64 || "")
    } else {
      // Native platform: Use decodeJpeg from @tensorflow/tfjs-react-native
      return await preprocessImageNative(resized.uri)
    }
  } catch (error) {
    console.error("Error preprocessing image:", error)
    throw new Error(`Failed to preprocess image: ${error}`)
  }
}

/**
 * Preprocess image on native platforms using decodeJpeg
 */
async function preprocessImageNative(imageUri: string): Promise<tf.Tensor4D> {
  if (!decodeJpeg) {
    throw new Error("decodeJpeg is not available on this platform")
  }

  try {
    // Read image as bytes
    let imageBytes: Uint8Array

    try {
      const response = await fetch(imageUri)
      const imageData = await response.arrayBuffer()
      imageBytes = new Uint8Array(imageData)
    } catch (fetchError) {
      // If fetch fails, try getting base64 from ImageManipulator
      const resized = await ImageManipulator.manipulateAsync(imageUri, [], {
        base64: true,
        compress: 1,
      })

      if (!resized.base64) {
        throw new Error("Failed to get base64 image data")
      }

      // Convert base64 to Uint8Array
      const base64Data = resized.base64.replace(/^data:image\/\w+;base64,/, "")
      const binaryString = atob(base64Data)
      imageBytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        imageBytes[i] = binaryString.charCodeAt(i)
      }
    }

    // Decode JPEG to tensor using TensorFlow.js React Native
    const decodedTensor = decodeJpeg(imageBytes, 3) // 3 = RGB channels

    // Resize to model input size if needed
    let processedTensor: tf.Tensor3D
    const [height, width] = decodedTensor.shape

    if (height !== MODEL_INPUT_SIZE || width !== MODEL_INPUT_SIZE) {
      processedTensor = tf.image.resizeBilinear(decodedTensor, [MODEL_INPUT_SIZE, MODEL_INPUT_SIZE])
      decodedTensor.dispose()
    } else {
      processedTensor = decodedTensor as tf.Tensor3D
    }

    // Normalize pixel values from [0, 255] to [0, 1]
    const normalized = processedTensor.div(255.0)

    // Ensure the shape is [1, 224, 224, 3] (batch, height, width, channels)
    const batched = normalized.expandDims(0) as tf.Tensor4D

    // Dispose intermediate tensors to free memory
    processedTensor.dispose()
    normalized.dispose()

    return batched
  } catch (error) {
    console.error("Error preprocessing image on native:", error)
    throw error
  }
}

/**
 * Preprocess image on web platform using tf.browser.fromPixels
 */
async function preprocessImageWeb(imageUri: string, base64Data?: string): Promise<tf.Tensor4D> {
  try {
    // Create an HTML Image element and load the image
    const img = new Image()

    const imageSrc = base64Data
      ? `data:image/jpeg;base64,${base64Data.replace(/^data:image\/\w+;base64,/, "")}`
      : imageUri

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = (error) => reject(new Error(`Failed to load image: ${error}`))
      img.src = imageSrc
    })

    // Create a canvas element to draw the image
    const canvas = document.createElement("canvas")
    canvas.width = MODEL_INPUT_SIZE
    canvas.height = MODEL_INPUT_SIZE
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      throw new Error("Failed to get canvas context")
    }

    // Draw and resize image on canvas
    ctx.drawImage(img, 0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE)

    // Convert canvas pixels to tensor
    const imageTensor = tf.browser.fromPixels(canvas, 3)

    // Normalize pixel values from [0, 255] to [0, 1]
    const normalized = imageTensor.div(255.0)

    // Ensure the shape is [1, 224, 224, 3]
    const batched = normalized.expandDims(0) as tf.Tensor4D

    // Dispose intermediate tensors
    imageTensor.dispose()
    normalized.dispose()

    return batched
  } catch (error) {
    console.error("Error preprocessing image on web:", error)
    throw error
  }
}

/**
 * Detect water level in a bottle image using the ML model
 */
async function detectWaterLevelWithModel(imageUri: string): Promise<{
  waterLevel: WaterLevel
  confidence: number
}> {
  if (model === null) {
    throw new Error("Model not loaded. Call loadMLModel() first.")
  }

  try {
    // Preprocess image
    const preprocessedImage = await preprocessImageToTensor(imageUri)

    // Run inference
    const predictions = model.predict(preprocessedImage) as tf.Tensor

    // Get predicted class and confidence
    const predictionArray = await predictions.data()
    const maxIndex = predictionArray.indexOf(Math.max(...predictionArray))
    const confidence = predictionArray[maxIndex]

    // Map model output index to WaterLevel
    // Model classes: [0: "half", 1: "full", 2: "overflowing"]
    if (maxIndex < 0 || maxIndex >= CLASSES.length) {
      throw new Error(`Invalid model output index: ${maxIndex}. Expected 0-${CLASSES.length - 1}`)
    }

    const waterLevel = CLASSES[maxIndex] as WaterLevel

    console.log(
      `Model prediction: index=${maxIndex}, class=${waterLevel}, confidence=${confidence.toFixed(3)}`,
    )

    // Clean up tensors
    preprocessedImage.dispose()
    predictions.dispose()

    return {
      waterLevel,
      confidence: Number(confidence),
    }
  } catch (error) {
    console.error("Error detecting water level:", error)
    throw new Error(`Failed to detect water level: ${error}`)
  }
}

/**
 * Simulated water level detection (fallback when model is not available)
 */
function detectWaterLevelSimulated(
  imageUri: string,
  isVerification: boolean = false,
): {
  waterLevel: WaterLevel
  confidence: number
} {
  // Simulate detection based on verification mode
  if (isVerification) {
    // In verification mode, we expect an empty bottle
    return {
      waterLevel: "empty", // Not detected by model, but valid for simulation
      confidence: 0.8,
    }
  }

  // Simulate random detection (for testing)
  const levels: WaterLevel[] = [...CLASSES, "empty", "low"] // Model classes + fallback
  const randomLevel = levels[Math.floor(Math.random() * levels.length)]

  return {
    waterLevel: randomLevel,
    confidence: 0.6, // Lower confidence for simulated detection
  }
}

/**
 * Detect bottle type from label (placeholder - can be enhanced with OCR)
 */
async function detectBottleLabel(imageUri: string): Promise<BottleType | null> {
  // TODO: Implement OCR/Text Recognition
  // Options:
  // - @react-native-ml-kit/text-recognition
  // - expo-document-scanner
  // - Google Cloud Vision API

  // For now, return null to fall back to visual estimation
  return null
}

/**
 * Search bottle type from database or web (placeholder)
 */
async function searchBottleType(query: string): Promise<BottleType | null> {
  // TODO: Implement web search or database lookup
  return null
}

/**
 * Estimate volume from visual dimensions (placeholder)
 */
async function estimateVolumeFromDimensions(
  imageUri: string,
  heightPx: number,
  widthPx: number,
): Promise<number> {
  // TODO: Implement volume estimation based on pixel dimensions
  // Would need calibration with known reference objects
  // Could use ARKit/ARCore for more accurate measurements

  // Placeholder: return average bottle size
  return 500 // ml
}

/**
 * Main function to detect bottle and water level
 * Uses ML model if available, otherwise falls back to simulated detection
 */
export async function detectBottleAndLevel(
  imageUri: string,
  isVerification: boolean = false,
): Promise<BottleDetection> {
  try {
    // Try to use ML model if available
    if (model !== null) {
      try {
        // Detect water level using ML model
        const { waterLevel, confidence } = await detectWaterLevelWithModel(imageUri)

        // Detect bottle type from label (if possible)
        let bottleType: BottleType | null = await detectBottleLabel(imageUri)

        // If label detection fails, use default estimation
        if (!bottleType) {
          bottleType = {
            name: "Unknown Bottle",
            volume: 500, // Default estimate
          }
        }

        // Estimate volume based on water level and bottle type
        let estimatedVolume = calculateVolumeFromLevel(waterLevel, bottleType.volume)

        return {
          bottleType,
          waterLevel,
          estimatedVolume,
          confidence,
        }
      } catch (modelError) {
        console.warn("⚠️  ML model prediction failed, using fallback:", modelError)
        // Fall through to simulated detection
      }
    }

    // Fallback to simulated detection if model is not available or fails
    console.log("⚠️  Using simulated detection (model not available or failed)")
    const { waterLevel, confidence } = detectWaterLevelSimulated(imageUri, isVerification)

    // Default bottle type
    const bottleType: BottleType = {
      name: "SmartWater 1L",
      volume: 1000,
      brand: "SmartWater",
    }

    const estimatedVolume = calculateVolumeFromLevel(waterLevel, bottleType.volume)

    return {
      bottleType,
      waterLevel,
      estimatedVolume,
      confidence, // Lower confidence for simulated detection
    }
  } catch (error: any) {
    console.error("Error in detectBottleAndLevel:", error)

    // Final fallback
    return {
      bottleType: {
        name: "Unknown Bottle",
        volume: 500,
      },
      waterLevel: isVerification ? "empty" : "full",
      estimatedVolume: isVerification ? 0 : 500,
      confidence: 0.3, // Very low confidence for error case
    }
  }
}

/**
 * Calculate volume from water level
 */
function calculateVolumeFromLevel(waterLevel: WaterLevel, bottleVolume: number): number {
  switch (waterLevel) {
    case "empty":
      return 0
    case "low":
      return Math.round(bottleVolume * 0.25)
    case "half":
      return Math.round(bottleVolume * 0.5)
    case "full":
      return bottleVolume
    case "overflowing":
      return Math.round(bottleVolume * 1.2) // 20% overflow
    default:
      return Math.round(bottleVolume * 0.5) // Default to half if unknown
  }
}

/**
 * Preprocess image for ML model input (exported for external use)
 */
export async function preprocessImageForML(imageUri: string): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: MODEL_INPUT_SIZE, height: MODEL_INPUT_SIZE } }],
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    )
    return result.uri
  } catch (error) {
    console.error("Error preprocessing image:", error)
    return imageUri // Return original if preprocessing fails
  }
}

/**
 * Check if ML model is loaded and ready
 */
export function isModelReady(): boolean {
  return model !== null
}

/**
 * Convert image URI to base64 string
 */
async function imageUriToBase64(imageUri: string): Promise<string> {
  try {
    // On web, the URI might already be base64
    if (Platform.OS === "web" && imageUri.startsWith("data:image")) {
      return imageUri
    }

    // Get base64 from ImageManipulator
    const result = await ImageManipulator.manipulateAsync(imageUri, [], {
      base64: true,
      compress: 0.8, // Compress to reduce size for API calls
      format: ImageManipulator.SaveFormat.JPEG,
    })

    if (!result.base64) {
      throw new Error("Failed to get base64 from image")
    }

    // Return as data URI
    return `data:image/jpeg;base64,${result.base64}`
  } catch (error) {
    console.error("Error converting image to base64:", error)
    throw new Error(`Failed to convert image to base64: ${error}`)
  }
}

/**
 * Call OpenRouter API to analyze water bottle image
 */
async function callOpenRouterAPI(imageBase64: string): Promise<TribunalEstimate> {
  const apiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY

  if (!apiKey) {
    throw new Error("OpenRouter API key not configured. Set EXPO_PUBLIC_OPENROUTER_API_KEY environment variable")
  }

  try {
    // Use Google Gemini 3 Flash Preview model (supports images)
    const model = process.env.EXPO_PUBLIC_OPENROUTER_MODEL || "google/gemini-3-flash-preview"

    // Ensure imageBase64 is a proper data URI (already should be from imageUriToBase64)
    // OpenRouter expects the full data URI format: data:image/jpeg;base64,...
    const imageUrl = imageBase64.startsWith("data:") 
      ? imageBase64 
      : `data:image/jpeg;base64,${imageBase64}`

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this image of a water bottle. Please provide:
1. The estimated total capacity/volume of the bottle in milliliters (ml)
2. The estimated amount of water currently in the bottle in milliliters (ml)
3. Your confidence level (0.0 to 1.0) in these estimates

Please respond in JSON format only, with this exact structure:
{
  "bottleVolume": <number in ml>,
  "waterVolume": <number in ml>,
  "confidence": <number between 0.0 and 1.0>
}`,
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()

    // Extract JSON from response
    const textContent = data.choices?.[0]?.message?.content

    if (!textContent) {
      throw new Error("No content in OpenRouter API response")
    }

    // Parse JSON from response
    let jsonText = textContent.trim()
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()

    const estimate = JSON.parse(jsonText)

    // Validate response structure
    if (
      typeof estimate.bottleVolume !== "number" ||
      typeof estimate.waterVolume !== "number" ||
      typeof estimate.confidence !== "number"
    ) {
      throw new Error("Invalid response format from OpenRouter API")
    }

    return {
      bottleVolume: Math.round(estimate.bottleVolume),
      waterVolume: Math.round(estimate.waterVolume),
      confidence: Math.max(0, Math.min(1, estimate.confidence)),
      source: "openrouter",
    }
  } catch (error: any) {
    console.error("Error calling OpenRouter API:", error)
    throw new Error(`OpenRouter API call failed: ${error.message}`)
  }
}

/**
 * Simple test function to verify OpenRouter API connection
 * This just tests basic API connectivity without processing images
 */
export async function testTribunalAPI(): Promise<{
  success: boolean
  message: string
  error?: string
}> {
  const result: {
    success: boolean
    message: string
    error?: string
  } = {
    success: false,
    message: "",
  }

  // Test OpenRouter API
  const openRouterApiKey = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY
  console.log("🔍 OpenRouter API Key check:", openRouterApiKey ? "Found" : "NOT FOUND")

  if (!openRouterApiKey) {
    result.message = "API key not found (EXPO_PUBLIC_OPENROUTER_API_KEY). Please set it in your .env file."
    console.warn("⚠️ OpenRouter API key missing")
    return result
  }

  try {
    const model = process.env.EXPO_PUBLIC_OPENROUTER_MODEL || "openai/gpt-4o-mini"
    console.log("🧪 Testing OpenRouter with model:", model)

    const requestBody = {
      model: model,
      messages: [
        {
          role: "user",
          content: "Say 'Hello, I am working!' if you can read this.",
        },
      ],
    }

    console.log("📤 OpenRouter request:", JSON.stringify(requestBody, null, 2))

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openRouterApiKey}`,
        "HTTP-Referer": process.env.EXPO_PUBLIC_APP_URL || "https://hydrohomies.app",
        "X-Title": "HydroHomies",
      },
      body: JSON.stringify(requestBody),
    })

    console.log("📥 OpenRouter response status:", response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ OpenRouter error response:", errorText)
      result.error = `HTTP ${response.status}: ${errorText}`
      result.message = `API call failed: ${response.status} ${response.statusText}`
      return result
    }

    const data = await response.json()
    console.log("✅ OpenRouter response data:", JSON.stringify(data, null, 2))

    const text = data.choices?.[0]?.message?.content
    if (text) {
      result.success = true
      result.message = `Success! Response: ${text.substring(0, 100)}`
      console.log("✅ OpenRouter success:", result.message)
    } else {
      result.message = "API responded but no content in response"
      console.warn("⚠️ OpenRouter: No content in response")
    }
  } catch (error: any) {
    console.error("❌ OpenRouter exception:", error)
    result.error = error.message || String(error)
    result.message = `Error: ${error.message || String(error)}`
  }

  return result
}

/**
 * Tribunal: Get estimate from OpenRouter API (using Gemini model)
 */
export async function getTribunalEstimate(imageUri: string): Promise<TribunalResult> {
  try {
    console.log("🏛️  Tribunal: Analyzing image with OpenRouter API (Gemini model)...")
    const imageBase64 = await imageUriToBase64(imageUri)
    const estimate = await callOpenRouterAPI(imageBase64)
    console.log("✅ OpenRouter API estimate:", estimate)
    return { estimate }
  } catch (error: any) {
    console.error("Error in tribunal estimate:", error)
    throw new Error(`Tribunal estimate failed: ${error.message}`)
  }
}

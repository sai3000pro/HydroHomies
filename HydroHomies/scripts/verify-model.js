#!/usr/bin/env node
/* eslint-env node */
/**
 * Loads the bundled water-level model with @tensorflow/tfjs (CPU backend) and
 * runs one prediction, so model format problems surface before you build the app.
 *
 * Usage: node scripts/verify-model.js [path/to/model.json]
 */
const tf = require("@tensorflow/tfjs")
const fs = require("fs")
const path = require("path")

const modelPath = path.resolve(
  process.argv[2] || path.join(__dirname, "../assets/models/water-level-classifier/model.json"),
)
const dir = path.dirname(modelPath)

const fileIO = {
  async load() {
    const json = JSON.parse(fs.readFileSync(modelPath, "utf8"))
    const specs = []
    const buffers = []
    for (const group of json.weightsManifest) {
      specs.push(...group.weights)
      for (const p of group.paths) buffers.push(fs.readFileSync(path.join(dir, p)))
    }
    const all = Buffer.concat(buffers)
    return {
      modelTopology: json.modelTopology,
      weightSpecs: specs,
      weightData: all.buffer.slice(all.byteOffset, all.byteOffset + all.byteLength),
      format: json.format,
    }
  },
}

async function main() {
  await tf.setBackend("cpu")
  const model = await tf.loadLayersModel(fileIO)
  const labels = JSON.parse(fs.readFileSync(path.join(dir, "class_labels.json"), "utf8"))
  console.log(
    `Loaded: input ${JSON.stringify(model.inputs[0].shape)}, output ${JSON.stringify(model.outputs[0].shape)}`,
  )

  const input = tf.randomUniform([1, 224, 224, 3], 0, 1, "float32", 42)
  const out = model.predict(input)
  const probs = Array.from(await out.data())
  const sum = probs.reduce((a, b) => a + b, 0)
  console.log("Probabilities:", Object.fromEntries(labels.map((l, i) => [l, probs[i].toFixed(4)])))
  if (probs.length !== labels.length || Math.abs(sum - 1) > 1e-3 || probs.some(Number.isNaN)) {
    throw new Error(`Unexpected output (len=${probs.length}, sum=${sum})`)
  }
  console.log("OK")
}

main().catch((e) => {
  console.error("FAILED:", e.message)
  process.exit(1)
})

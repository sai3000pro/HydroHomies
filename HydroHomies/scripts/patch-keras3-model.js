#!/usr/bin/env node
/* eslint-env node */
/**
 * Rewrites a TF.js layers-model exported from Keras 3 into the Keras 2 style
 * topology that @tensorflow/tfjs 4.x can deserialize.
 *
 * Keras 3 differences handled here:
 *  - InputLayer uses `batch_shape` instead of `batch_input_shape`
 *  - `dtype` is a DTypePolicy object instead of a string
 *  - `inbound_nodes` use `{ args, kwargs }` with `__keras_tensor__` entries
 *    instead of `[[layerName, nodeIndex, tensorIndex, kwargs], ...]`
 *  - weight names are not prefixed with the nested model name
 *
 * Usage: node scripts/patch-keras3-model.js [path/to/model.json]
 * The file is rewritten in place. Running it twice is a no-op.
 */
const fs = require("fs")
const path = require("path")

const modelPath = path.resolve(
  process.argv[2] || path.join(__dirname, "../assets/models/water-level-classifier/model.json"),
)

function fixDtype(config) {
  if (config && typeof config.dtype === "object" && config.dtype !== null) {
    config.dtype = config.dtype.config?.name ?? "float32"
  }
}

function kerasTensorToNode(t) {
  const [layerName, nodeIndex, tensorIndex] = t.config.keras_history
  return [layerName, nodeIndex, tensorIndex, {}]
}

function convertInboundNodes(nodes) {
  if (!Array.isArray(nodes)) return nodes
  return nodes.map((node) => {
    // Already Keras 2 style
    if (Array.isArray(node)) return node
    const args = node.args ?? []
    const tensors = []
    for (const arg of args) {
      if (Array.isArray(arg)) {
        for (const t of arg) if (t?.class_name === "__keras_tensor__") tensors.push(t)
      } else if (arg?.class_name === "__keras_tensor__") {
        tensors.push(arg)
      }
    }
    return tensors.map(kerasTensorToNode)
  })
}

function patchLayers(layers) {
  for (const layer of layers) {
    const cfg = layer.config
    fixDtype(cfg)
    if (layer.class_name === "InputLayer" && cfg.batch_shape && !cfg.batch_input_shape) {
      cfg.batch_input_shape = cfg.batch_shape
      delete cfg.batch_shape
    }
    layer.inbound_nodes = convertInboundNodes(layer.inbound_nodes)
    // Nested functional models (e.g. the MobileNetV2 backbone)
    if (layer.class_name === "Functional" || layer.class_name === "Model") {
      patchModelConfig(cfg)
    }
  }
}

function patchModelConfig(cfg) {
  patchLayers(cfg.layers)
  // Keras 3 may store single input/output as a flat [name, 0, 0] triple
  for (const key of ["input_layers", "output_layers"]) {
    const v = cfg[key]
    if (Array.isArray(v) && typeof v[0] === "string") cfg[key] = [v]
  }
}

/**
 * tfjs fails to rebuild a Keras 3 nested Functional model ("Graph disconnected"),
 * so splice the nested model's layers into the outer graph. Keras 3 weight names
 * are not prefixed by the nested model name, so the weights still line up.
 */
function flattenNestedModels(cfg) {
  const out = []
  for (const layer of cfg.layers) {
    if (layer.class_name !== "Functional" && layer.class_name !== "Model") {
      out.push(layer)
      continue
    }
    const inner = layer.config
    flattenNestedModels(inner)
    if (inner.input_layers.length !== 1 || inner.output_layers.length !== 1) {
      throw new Error(`Cannot flatten ${layer.name}: expected exactly one input and output`)
    }
    const innerInput = inner.input_layers[0][0]
    const innerOutput = inner.output_layers[0][0]
    const outerSource = layer.inbound_nodes[0][0] // [name, node, tensor, kwargs]

    const rename = (nodes, from, to) =>
      nodes.forEach((n) =>
        n.forEach((t) => t[0] === from && ((t[0] = to[0]), (t[1] = to[1]), (t[2] = to[2]))),
      )

    for (const l of inner.layers) {
      if (l.name === innerInput) continue
      rename(l.inbound_nodes, innerInput, outerSource)
      out.push(l)
    }
    // Later outer layers that consumed the nested model now consume its output layer
    const target = [innerOutput, 0, 0]
    for (const l of cfg.layers) rename(l.inbound_nodes, layer.name, target)
    for (const o of cfg.output_layers) if (o[0] === layer.name) o.splice(0, 3, ...target)
  }
  cfg.layers = out
}

const model = JSON.parse(fs.readFileSync(modelPath, "utf8"))
const topology = model.modelTopology
patchModelConfig(topology.model_config.config)
flattenNestedModels(topology.model_config.config)

// Keras 3 names the DepthwiseConv2D weight "kernel"; tfjs expects "depthwise_kernel"
const depthwise = new Set(
  topology.model_config.config.layers
    .filter((l) => l.class_name === "DepthwiseConv2D")
    .map((l) => l.name),
)
for (const group of model.weightsManifest) {
  for (const w of group.weights) {
    const [layerName, weightName] = w.name.split("/")
    if (depthwise.has(layerName) && weightName === "kernel")
      w.name = `${layerName}/depthwise_kernel`
  }
}

// Training config is not needed for inference and uses Keras 3 optimizer configs
delete topology.training_config

fs.writeFileSync(modelPath, JSON.stringify(model))
console.log(`Patched ${modelPath}`)

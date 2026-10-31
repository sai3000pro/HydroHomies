#!/usr/bin/env bash
# Copies the trained TF.js model into the app, rewrites it for tfjs 4.x, and
# checks that it loads. Run from anywhere after train_water_level_model.py.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
SRC="$HERE/models/tensorflowjs_model"
APP="$HERE/../HydroHomies"
DEST="$APP/assets/models/water-level-classifier"

for f in model.json group1-shard1of1.bin class_labels.json model_metadata.json; do
  [ -f "$SRC/$f" ] || { echo "Missing $SRC/$f. Train the model first." >&2; exit 1; }
done

mkdir -p "$DEST"
cp "$SRC"/model.json "$SRC"/group1-shard1of1.bin "$SRC"/class_labels.json "$SRC"/model_metadata.json "$DEST/"

# Keras 3 exports need rewriting before @tensorflow/tfjs can load them
node "$APP/scripts/patch-keras3-model.js" "$DEST/model.json"
(cd "$APP" && node scripts/verify-model.js)

echo "Model installed in $DEST"

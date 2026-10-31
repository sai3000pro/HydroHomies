# Water level classifier (TF.js)

MobileNetV2 (alpha 0.35, 224×224 input) fine-tuned on the Kaggle `chethuhn/water-bottle-dataset`.

- Classes, in output order: `half`, `full`, `overflowing` (see `class_labels.json`)
- Input: RGB scaled to [0, 1]
- About 80% validation accuracy on 356 images

`model.json` was exported from Keras 3 and rewritten by `scripts/patch-keras3-model.js` so tfjs 4.x can load it. Run `npm run model:verify` after replacing these files.

Loaded by `app/services/ml/waterLevelClassifier.ts`. It only runs in dev or production builds, not Expo Go.

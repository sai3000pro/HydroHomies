# 🔄 Retrain/Convert Model with Compatible Settings

## ✅ What I've Fixed

I've updated the `convert_to_tensorflowjs()` function in `train_water_level_model.py` to:
1. **Try direct conversion first** (`save_keras_model`) - faster
2. **Fall back to SavedModel conversion** if direct fails - better compatibility with TensorFlow.js

This should fix the InputLayer compatibility issue!

---

## ⚠️ Important: About "Empty" Class

**The Kaggle dataset only has 3 classes:**
- ✅ **half** - Half filled water bottles
- ✅ **full** - Full water bottles  
- ✅ **overflowing** - Overflowing water bottles
- ❌ **empty** - NOT in the dataset

**To get "empty" class, you have options:**
1. **Use simulated detection for empty** (current approach - works fine)
2. **Collect your own empty bottle images** and add them to the dataset
3. **Accept that empty isn't in the model** (detect empty separately)

For now, the code handles "empty" via fallback detection (simulated), which works fine for the app.

---

## 🚀 Option 1: Just Re-convert Existing Model (Quick - ~1 minute)

If you already have a trained model:

```bash
cd /Users/re/Desktop/HydroHomies/ml_training

# Create a simple conversion script
python3 << 'EOF'
from pathlib import Path
import tensorflow as tf
from tensorflow import keras
import sys
sys.path.insert(0, '.')
from train_water_level_model import convert_to_tensorflowjs, TENSORFLOWJS_OUTPUT_DIR

# Load existing model
model_path = Path('models/best_model.keras')
if not model_path.exists():
    model_path = Path('models/final_model.keras')

if model_path.exists():
    print(f'📥 Loading model from {model_path}')
    model = keras.models.load_model(str(model_path))
    print('🔄 Converting to TensorFlow.js...')
    convert_to_tensorflowjs(model, TENSORFLOWJS_OUTPUT_DIR)
    print('✅ Conversion complete!')
    print(f'📦 Model files in: {TENSORFLOWJS_OUTPUT_DIR}')
    print('')
    print('Next step: Copy to app')
    print(f'  ./setup_model_for_app.sh')
else:
    print('❌ No trained model found. Please train first with: python3 train_water_level_model.py')
EOF
```

Then copy to app:
```bash
./setup_model_for_app.sh
```

---

## 🚀 Option 2: Full Retrain (Recommended - ~30-60 minutes)

Retrain the model from scratch with the new conversion method:

```bash
cd /Users/re/Desktop/HydroHomies/ml_training

# Make sure dependencies are installed
pip install tensorflow tensorflowjs kagglehub numpy pillow scikit-learn

# Run training script (will automatically convert at the end)
python3 train_water_level_model.py
```

This will:
1. Download the dataset
2. Train the model (~30-60 minutes depending on your machine)
3. Convert to TensorFlow.js with the new compatible method
4. Save model files to `models/tensorflowjs_model/`

---

## 📦 Step 3: Copy Model to App

After conversion:

```bash
cd /Users/re/Desktop/HydroHomies/ml_training

# Use the setup script (easiest)
./setup_model_for_app.sh

# OR manually copy
cp -r models/tensorflowjs_model/* ../HydroHomies/assets/models/water-level-classifier/
```

---

## 🧪 Step 4: Test in App

```bash
cd /Users/re/Desktop/HydroHomies/HydroHomies

# Clear Metro cache
rm -rf .expo .metro node_modules/.cache

# Build and run on Android
npm run android
```

**Expected result:**
- ✅ Model loads successfully
- ✅ No InputLayer errors
- ✅ Model can classify: half, full, overflowing
- ✅ Works in development builds

---

## 📝 What Changed in the Code

The `convert_to_tensorflowjs()` function now:

```python
# Try direct conversion first (fast)
tfjs.converters.save_keras_model(model, output_dir)

# If that fails, use SavedModel conversion (more compatible)
model.save(savedmodel_dir, save_format="tf")
tfjs.converters.convert_tf_saved_model(savedmodel_dir, output_dir)
```

The SavedModel approach is more reliable for compatibility between Keras 3.x and TensorFlow.js.

---

## ✅ Summary

1. **Updated conversion function** - Now uses SavedModel fallback for better compatibility
2. **Classes: 3 (half, full, overflowing)** - "empty" not in dataset, handled via simulated detection
3. **Quick option:** Re-convert existing model (~1 minute)
4. **Full option:** Retrain from scratch (~30-60 minutes)

Both options will create a compatible TensorFlow.js model that should load successfully in your React Native app!

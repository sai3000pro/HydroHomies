# 🔄 Retrain/Convert Model with Compatible Settings

## The Problem

The current model has a compatibility issue with TensorFlow.js:
- Error: "An InputLayer should be passed either a `batchInputShape` or an `inputShape`"
- This happens because Keras 3.x uses `batch_shape` but TensorFlow.js expects `input_shape` or `inputShape`

## ✅ Solution: Updated Conversion Function

I've updated the `convert_to_tensorflowjs()` function in `train_water_level_model.py` to:
1. Try direct conversion first (faster)
2. Fall back to SavedModel conversion if direct conversion fails (more compatible)

## 📋 Classes Note

**Important:** The Kaggle dataset only has **3 classes**:
- ✅ **half** - Half filled water bottles
- ✅ **full** - Full water bottles  
- ✅ **overflowing** - Overflowing water bottles
- ❌ **empty** - NOT in the dataset

The user wants 4 classes (full, half, empty, overflowing), but **"empty" is not available** in the training dataset. We'll need to:
- Train with the 3 available classes
- Handle "empty" detection separately in the code (or use simulated detection for empty)

## 🚀 Steps to Retrain/Convert

### Option 1: Just Re-convert Existing Model (Quick)

If you already have a trained model:

```bash
cd /Users/re/Desktop/HydroHomies/ml_training

# Run Python script to just convert the model
python3 -c "
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
    print(f'Loading model from {model_path}')
    model = keras.models.load_model(str(model_path))
    convert_to_tensorflowjs(model, TENSORFLOWJS_OUTPUT_DIR)
    print('✅ Conversion complete!')
else:
    print('❌ No trained model found. Please train first.')
"
```

### Option 2: Full Retrain (Recommended)

Retrain the model from scratch:

```bash
cd /Users/re/Desktop/HydroHomies/ml_training

# Install dependencies if needed
pip install tensorflow tensorflowjs kagglehub numpy pillow scikit-learn

# Run training script (will automatically convert at the end)
python3 train_water_level_model.py
```

This will:
1. Download the dataset
2. Train the model
3. Convert to TensorFlow.js with the new compatible method

### Step 3: Copy Model to App

After conversion:

```bash
cd /Users/re/Desktop/HydroHomies/ml_training

# Use the setup script
./setup_model_for_app.sh

# Or manually copy
cp -r models/tensorflowjs_model/* ../HydroHomies/assets/models/water-level-classifier/
```

### Step 4: Test in App

```bash
cd /Users/re/Desktop/HydroHomies/HydroHomies

# Clear Metro cache
rm -rf .expo .metro node_modules/.cache

# Start app
npm start -- --clear

# Or build and run
npm run android
```

## 🔍 What Changed

The conversion function now:
1. Tries `tfjs.converters.save_keras_model()` first (direct conversion)
2. Falls back to SavedModel conversion if needed:
   - Saves model as SavedModel format
   - Converts SavedModel to TensorFlow.js
   - Cleans up temporary files

SavedModel conversion is more reliable for compatibility between Keras 3.x and TensorFlow.js.

## ⚠️ About "Empty" Class

**The dataset doesn't have "empty" water bottles.** 

Options:
1. **Use 3 classes** (half, full, overflowing) - model will detect these accurately
2. **Add "empty" detection separately** - use heuristics or a separate model
3. **Collect "empty" data** - gather your own dataset of empty bottles and retrain

For now, the code handles "empty" via simulated detection (fallback logic).

## 📝 Expected Result

After retraining/converting:
- ✅ Model loads successfully in TensorFlow.js
- ✅ No InputLayer errors
- ✅ Model can classify: half, full, overflowing
- ✅ Works in development builds

# Water Level Classification Model

This directory should contain the trained TensorFlow.js model files for water level classification.

## 📦 Model Files Required

After training the model (see `../../../../ml_training/train_water_level_model.py`), copy these files here:

- `model.json` - Model architecture
- `*.bin` - Model weights (multiple files)
- `class_labels.json` - Class labels mapping
- `model_metadata.json` - Model configuration

## 🚀 Quick Setup

After training the model:

```bash
# From the ml_training directory
./setup_model_for_app.sh

# Or manually:
cp -r ml_training/models/tensorflowjs_model/* HydroHomies/assets/models/water-level-classifier/
```

## 📚 See Also

- `ML_MODEL_SETUP.md` - Complete setup guide
- `ml_training/README.md` - Training documentation
- `ml_training/train_water_level_model.py` - Training script

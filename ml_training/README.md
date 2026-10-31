# Water Bottle Level Classification - Model Training

This directory contains scripts to train a machine learning model for classifying water bottle levels (empty, low, half, full, overflowing) using the [Water Bottle Dataset](https://www.kaggle.com/datasets/chethuhn/water-bottle-dataset) from Kaggle.

## 🎯 Overview

The trained model uses MobileNetV2 as the base architecture, optimized for mobile devices. It will be exported in TensorFlow.js format for use in the React Native HydroHype app.

## 📋 Prerequisites

1. **Python 3.8+** installed on your system
2. **Kaggle account** and API credentials set up
3. **pip** package manager

## 🚀 Setup

### 1. Install Kaggle API

First, set up Kaggle API credentials:

```bash
# Install kaggle CLI
pip install kaggle

# Set up credentials (download from https://www.kaggle.com/settings -> API)
mkdir -p ~/.kaggle
# Place your kaggle.json file in ~/.kaggle/
chmod 600 ~/.kaggle/kaggle.json
```

### 2. Install Python Dependencies

```bash
cd ml_training
pip install -r requirements.txt
```

Or install manually:

```bash
pip install tensorflow tensorflowjs kagglehub numpy pillow scikit-learn
```

### 3. Verify Kaggle Access

```bash
python -c "import kagglehub; print('Kaggle access configured')"
```

## 🏃 Training the Model

### Option 1: Using KaggleHub (Recommended)

The training script automatically downloads the dataset using `kagglehub`:

```bash
python train_water_level_model.py
```

### Option 2: Manual Dataset Download

If automatic download fails, manually download the dataset:

1. Go to [Water Bottle Dataset](https://www.kaggle.com/datasets/chethuhn/water-bottle-dataset)
2. Click "Download" (you'll need to accept the dataset license)
3. Extract the ZIP file
4. Place the dataset folder in the `ml_training` directory
5. Update the `download_dataset()` function in `train_water_level_model.py` to use the local path

## 📊 Expected Dataset Structure

The script expects the dataset to have the following structure:

```
water-bottle-dataset/
├── empty/
│   ├── image1.jpg
│   ├── image2.jpg
│   └── ...
├── low/
│   └── ...
├── half/
│   └── ...
├── full/
│   └── ...
└── overflowing/
    └── ...
```

If your dataset has a different structure, modify the `load_and_preprocess_data()` function accordingly.

## ⚙️ Configuration

You can modify these parameters in `train_water_level_model.py`:

- `IMG_SIZE = 224`: Input image size (224x224 is standard for MobileNetV2)
- `BATCH_SIZE = 32`: Training batch size
- `EPOCHS = 50`: Maximum number of training epochs
- `LEARNING_RATE = 0.001`: Initial learning rate
- `CLASSES`: List of water level classes

## 📦 Output

After training, you'll find:

1. **TensorFlow.js Model**: `models/tensorflowjs_model/`
   - `model.json`: Model architecture
   - `*.bin`: Model weights (multiple files)
   - `class_labels.json`: Class labels mapping
   - `model_metadata.json`: Model configuration

2. **Keras Model**: `models/final_model.keras`
   - Full Keras model for reference/testing

## 📈 Model Performance

The model uses:
- **Base Architecture**: MobileNetV2 (α=0.35) for mobile optimization
- **Training Strategy**: Transfer learning + fine-tuning
- **Data Augmentation**: Random flips, rotations, zooms, brightness adjustments
- **Regularization**: Dropout layers to prevent overfitting

## 🔄 Integration with React Native

After training, install the model into the app. The script copies the files, rewrites the Keras 3 export so tfjs 4.x can load it, and runs a test prediction:

```bash
bash ml_training/setup_model_for_app.sh
```

The app loads it in `HydroHomies/app/services/ml/waterLevelClassifier.ts` (dev and production builds only).

## 🐛 Troubleshooting

### Dataset Download Issues

- Ensure you're logged into Kaggle: `kagglehub login`
- Check your Kaggle API credentials are valid
- Try downloading the dataset manually and updating the script

### Memory Issues

- Reduce `BATCH_SIZE` if you run out of memory
- Reduce `IMG_SIZE` (e.g., to 128) for smaller model
- Use data generators instead of loading all images at once

### Training Issues

- If validation accuracy plateaus early, try:
  - Adjusting learning rate
  - Adding more data augmentation
  - Changing model architecture
- If overfitting (high train accuracy, low validation accuracy):
  - Add more dropout
  - Reduce model complexity
  - Get more training data

## 📚 Resources

- [TensorFlow.js Documentation](https://www.tensorflow.org/js)
- [MobileNetV2 Paper](https://arxiv.org/abs/1801.04381)
- [Kaggle Dataset](https://www.kaggle.com/datasets/chethuhn/water-bottle-dataset)
- [React Native TensorFlow.js Guide](https://github.com/tensorflow/tfjs/tree/master/tfjs-react-native)

## 📝 License

Ensure you comply with the Kaggle dataset license when using this model.

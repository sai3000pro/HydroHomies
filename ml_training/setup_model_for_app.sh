#!/bin/bash

# Script to copy trained TensorFlow.js model files to React Native app assets
# Run this after training the model

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "📦 Setting up ML model for React Native app..."

# Check if model files exist
MODEL_DIR="models/tensorflowjs_model"
if [ ! -d "$MODEL_DIR" ]; then
    echo -e "${RED}❌ Error: Model files not found in $MODEL_DIR${NC}"
    echo "Please run 'python train_water_level_model.py' first to train the model."
    exit 1
fi

# Check if model.json exists
if [ ! -f "$MODEL_DIR/model.json" ]; then
    echo -e "${RED}❌ Error: model.json not found in $MODEL_DIR${NC}"
    exit 1
fi

# Create assets directory if it doesn't exist
ASSETS_DIR="../HydroHomies/assets/models/water-level-classifier"
mkdir -p "$ASSETS_DIR"

# Copy model files
echo "📂 Copying model files to $ASSETS_DIR..."
cp -r "$MODEL_DIR"/* "$ASSETS_DIR/"

# Verify files were copied
if [ -f "$ASSETS_DIR/model.json" ]; then
    echo -e "${GREEN}✅ Model files copied successfully!${NC}"
    
    # List copied files
    echo ""
    echo "📋 Copied files:"
    ls -lh "$ASSETS_DIR" | grep -v "^total"
    
    echo ""
    echo -e "${YELLOW}💡 Next steps:${NC}"
    echo "1. Install React Native dependencies:"
    echo "   cd ../HydroHomies/HydroHomies && npm install @tensorflow/tfjs @tensorflow/tfjs-react-native @tensorflow/tfjs-platform-react-native expo-asset"
    echo ""
    echo "2. Restart your Expo development server"
    echo ""
    echo "3. The model will be loaded automatically when the app starts"
    echo ""
    echo -e "${GREEN}✅ Setup complete!${NC}"
else
    echo -e "${RED}❌ Error: Files were not copied successfully${NC}"
    exit 1
fi

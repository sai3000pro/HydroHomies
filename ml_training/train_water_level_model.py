"""
Water Bottle Level Classification Model Training Script

This script:
1. Downloads the water bottle dataset from Kaggle
2. Preprocesses images and labels
3. Trains a CNN model to classify water levels: empty, low, half, full, overflowing
4. Exports the model to TensorFlow.js format for React Native

Requirements:
- Python 3.8+
- tensorflow>=2.13.0
- tensorflowjs>=4.10.0
- kagglehub
- numpy
- Pillow
- scikit-learn

Install dependencies:
pip install tensorflow tensorflowjs kagglehub numpy pillow scikit-learn
"""

import os
import json
import shutil
from pathlib import Path
import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from sklearn.model_selection import train_test_split
import kagglehub

# Model configuration
IMG_SIZE = 224  # Standard input size for mobile models
BATCH_SIZE = 32
EPOCHS = 50
LEARNING_RATE = 0.001
MODEL_OUTPUT_DIR = Path(__file__).parent / "models"
TENSORFLOWJS_OUTPUT_DIR = Path(__file__).parent / "models" / "tensorflowjs_model"

# Water level classes
# Note: The Kaggle dataset has: "Full Water level", "Half water level", "Overflowing"
# The dataset doesn't have "empty" or "low" classes, so we'll train on available classes
# We'll use 3 classes: half, full, overflowing
CLASSES = ["half", "full", "overflowing"]  # Only classes available in the dataset
NUM_CLASSES = len(CLASSES)

# Map dataset folder names to our class names
# Note: The actual dataset folders have spaces and may have inconsistent capitalization
FOLDER_NAME_MAPPING = {
    "full water level": "full",
    "full  water level": "full",  # Handle double space
    "half water level": "half",
    "half  water level": "half",  # Handle double space for half too
    "overflowing": "overflowing",
    # Note: "empty" and "low" are not in the dataset - we'll skip them or use existing classes
}


def download_dataset():
    """Download the water bottle dataset from Kaggle"""
    print("📥 Downloading dataset from Kaggle...")
    try:
        # Download latest version of the dataset
        path = kagglehub.dataset_download("chethuhn/water-bottle-dataset")
        print(f"✅ Dataset downloaded to: {path}")
        return Path(path)
    except Exception as e:
        print(f"❌ Error downloading dataset: {e}")
        print("\nPlease ensure:")
        print("1. You have kagglehub installed: pip install kagglehub")
        print("2. You're logged into Kaggle: kagglehub login")
        raise


def load_and_preprocess_data(dataset_path: Path):
    """
    Load and preprocess images from the dataset
    
    The actual dataset structure has nested folders:
    dataset/
    ├── "Full Water level"/
    │   └── "Full Water level"/
    │       ├── image1.jpg
    │       └── image2.jpg
    ├── "Half water level"/
    │   └── "Half water level"/
    │       └── ...
    └── "Overflowing"/
        └── "Overflowing"/
            └── ...
    """
    print("📂 Loading and preprocessing images...")
    
    images = []
    labels = []
    label_to_index = {cls: idx for idx, cls in enumerate(CLASSES)}
    
    # Check if dataset has the expected structure
    dataset_dirs = [d for d in dataset_path.iterdir() if d.is_dir()]
    
    for class_dir in dataset_dirs:
        folder_name = class_dir.name.lower().strip()
        # Normalize multiple spaces to single space
        folder_name = " ".join(folder_name.split())
        
        # Map folder name to our class name
        class_name = FOLDER_NAME_MAPPING.get(folder_name)
        if not class_name:
            print(f"⚠️  Skipping unknown class directory: {class_dir.name} (normalized: '{folder_name}')")
            continue
            
        if class_name not in label_to_index:
            print(f"⚠️  Skipping unmapped class: {class_name}")
            continue
            
        label_idx = label_to_index[class_name]
        
        # Handle nested directory structure: class_dir/class_dir/images
        # First, check if images are directly in class_dir
        image_files = list(class_dir.glob("*.jpg")) + list(class_dir.glob("*.png")) + list(class_dir.glob("*.jpeg"))
        
        # If no images found, check nested subdirectories
        if not image_files:
            subdirs = [d for d in class_dir.iterdir() if d.is_dir()]
            for subdir in subdirs:
                image_files.extend(list(subdir.glob("*.jpg")))
                image_files.extend(list(subdir.glob("*.png")))
                image_files.extend(list(subdir.glob("*.jpeg")))
                
                # Also check recursively in case of deeper nesting
                image_files.extend(list(subdir.rglob("*.jpg")))
                image_files.extend(list(subdir.rglob("*.png")))
                image_files.extend(list(subdir.rglob("*.jpeg")))
        
        if not image_files:
            print(f"⚠️  No images found in {class_dir}")
            continue
            
        print(f"  Loading {len(image_files)} images from '{class_name}' class (folder: {class_dir.name})...")
        
        for img_path in image_files:
            try:
                # Load and preprocess image
                img = Image.open(img_path).convert("RGB")
                img = img.resize((IMG_SIZE, IMG_SIZE))
                img_array = np.array(img, dtype=np.float32) / 255.0  # Normalize to [0, 1]
                
                images.append(img_array)
                labels.append(label_idx)
            except Exception as e:
                print(f"⚠️  Error loading image {img_path}: {e}")
                continue
    
    if not images:
        raise ValueError("No images were loaded! Please check the dataset structure.")
    
    print(f"✅ Loaded {len(images)} images across {len(set(labels))} classes")
    
    # Convert to numpy arrays
    X = np.array(images)
    y = np.array(labels)
    
    # Convert labels to categorical (one-hot encoding)
    y_categorical = keras.utils.to_categorical(y, num_classes=NUM_CLASSES)
    
    return X, y_categorical, y


def create_model():
    """Create a MobileNetV2-based model optimized for mobile devices"""
    print("🏗️  Creating model architecture...")
    
    # Disable SSL verification for downloading weights (if needed)
    # This is a workaround for SSL certificate issues
    import ssl
    ssl._create_default_https_context = ssl._create_unverified_context
    
    try:
        # Use MobileNetV2 as base (pre-trained on ImageNet)
        base_model = keras.applications.MobileNetV2(
            input_shape=(IMG_SIZE, IMG_SIZE, 3),
            include_top=False,
            weights="imagenet",
            alpha=0.35,  # Width multiplier (smaller = faster, less accurate)
        )
    except Exception as e:
        print(f"⚠️  Error loading pre-trained weights: {e}")
        print("💡 Loading model without pre-trained weights (will train from scratch)...")
        # Load without pre-trained weights if download fails
        base_model = keras.applications.MobileNetV2(
            input_shape=(IMG_SIZE, IMG_SIZE, 3),
            include_top=False,
            weights=None,  # Train from scratch
            alpha=0.35,
        )
    
    # Freeze base model layers initially
    base_model.trainable = False
    
    # Add custom classification head
    inputs = keras.Input(shape=(IMG_SIZE, IMG_SIZE, 3))
    x = base_model(inputs, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(0.2)(x)
    x = layers.Dense(128, activation="relu")(x)
    x = layers.Dropout(0.2)(x)
    outputs = layers.Dense(NUM_CLASSES, activation="softmax")(x)
    
    model = keras.Model(inputs, outputs)
    
    # Compile model
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=LEARNING_RATE),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    
    print(f"✅ Model created: {model.count_params()} parameters")
    return model


def train_model(model, X_train, y_train, X_val, y_val):
    """Train the model with data augmentation"""
    print("🚀 Starting training...")
    
    # Data augmentation
    data_augmentation = keras.Sequential([
        layers.RandomFlip("horizontal"),
        layers.RandomRotation(0.1),
        layers.RandomZoom(0.1),
        layers.RandomBrightness(0.1),
    ])
    
    # Callbacks
    callbacks = [
        keras.callbacks.EarlyStopping(
            monitor="val_accuracy",
            patience=10,
            restore_best_weights=True,
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=5,
            min_lr=1e-7,
        ),
        keras.callbacks.ModelCheckpoint(
            str(MODEL_OUTPUT_DIR / "best_model.keras"),
            monitor="val_accuracy",
            save_best_only=True,
        ),
    ]
    
    # Create training dataset with augmentation
    def augmented_generator(X, y):
        while True:
            indices = np.random.permutation(len(X))
            for i in range(0, len(X), BATCH_SIZE):
                batch_indices = indices[i:i+BATCH_SIZE]
                X_batch = X[batch_indices]
                y_batch = y[batch_indices]
                
                # Apply augmentation
                X_batch = data_augmentation(X_batch, training=True)
                yield X_batch, y_batch
    
    # Train model
    train_gen = augmented_generator(X_train, y_train)
    steps_per_epoch = len(X_train) // BATCH_SIZE
    
    history = model.fit(
        train_gen,
        steps_per_epoch=steps_per_epoch,
        epochs=EPOCHS,
        validation_data=(X_val, y_val),
        callbacks=callbacks,
        verbose=1,
    )
    
    # Fine-tuning: Unfreeze some layers and retrain with lower learning rate
    print("🔧 Fine-tuning model...")
    base_model = model.layers[1]  # MobileNetV2 layer
    base_model.trainable = True
    
    # Freeze bottom layers, unfreeze top layers
    for layer in base_model.layers[:-30]:
        layer.trainable = False
    
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=LEARNING_RATE / 10),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    
    history_finetune = model.fit(
        train_gen,
        steps_per_epoch=steps_per_epoch,
        epochs=EPOCHS // 2,  # Fewer epochs for fine-tuning
        validation_data=(X_val, y_val),
        callbacks=callbacks,
        verbose=1,
    )
    
    print("✅ Training completed!")
    return history, history_finetune


def convert_to_tensorflowjs(model, output_dir: Path):
    """Convert Keras model to TensorFlow.js format with compatibility settings"""
    print("🔄 Converting model to TensorFlow.js format...")
    
    try:
        import tensorflowjs as tfjs
    except ImportError:
        print("❌ tensorflowjs not installed. Installing...")
        os.system("pip install tensorflowjs")
        import tensorflowjs as tfjs
    
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Convert using save_keras_model (direct conversion)
    # This should work better with newer TensorFlow.js versions
    # If this fails, we can try SavedModel approach
    try:
        print("   Converting model directly to TensorFlow.js format...")
        tfjs.converters.save_keras_model(model, str(output_dir))
        print("   ✅ Direct conversion successful")
    except Exception as e:
        print(f"   ⚠️  Direct conversion failed: {e}")
        print("   Trying SavedModel conversion method...")
        
        # Fallback: Convert via SavedModel for better compatibility
        savedmodel_dir = output_dir.parent / "savedmodel_temp"
        savedmodel_dir.mkdir(parents=True, exist_ok=True)
        
        try:
            print("   Step 1: Saving model as SavedModel...")
            # Save as SavedModel first (better compatibility with TensorFlow.js)
            model.save(str(savedmodel_dir), save_format="tf")
            
            print("   Step 2: Converting SavedModel to TensorFlow.js...")
            # Convert SavedModel to TensorFlow.js
            tfjs.converters.convert_tf_saved_model(
                str(savedmodel_dir),
                str(output_dir),
                quantization_dtype=None,
            )
            
            print("   ✅ SavedModel conversion successful")
            
            # Clean up SavedModel directory
            shutil.rmtree(savedmodel_dir)
            print("   ✅ Temporary SavedModel files cleaned up")
        except Exception as e2:
            # Clean up on error
            if savedmodel_dir.exists():
                shutil.rmtree(savedmodel_dir)
            raise Exception(f"Both conversion methods failed. Direct: {e}, SavedModel: {e2}")
    
    # Save class labels for the React Native app
    class_labels_path = output_dir / "class_labels.json"
    with open(class_labels_path, "w") as f:
        json.dump(CLASSES, f, indent=2)
    
    # Save model metadata
    metadata = {
        "input_size": IMG_SIZE,
        "classes": CLASSES,
        "num_classes": NUM_CLASSES,
        "model_type": "MobileNetV2",
    }
    
    metadata_path = output_dir / "model_metadata.json"
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    
    print(f"✅ Model converted to TensorFlow.js format")
    print(f"   Output directory: {output_dir}")
    print(f"   Files created:")
    for file in output_dir.rglob("*"):
        if file.is_file():
            size_mb = file.stat().st_size / (1024 * 1024)
            print(f"     - {file.relative_to(output_dir)} ({size_mb:.2f} MB)")


def main():
    """Main training pipeline"""
    print("=" * 60)
    print("💧 Water Bottle Level Classification Model Training")
    print("=" * 60)
    
    # Create output directories
    MODEL_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Step 1: Download dataset
    dataset_path = download_dataset()
    
    # Step 2: Load and preprocess data
    X, y_categorical, y = load_and_preprocess_data(dataset_path)
    
    # Step 3: Split data
    print("📊 Splitting data into train/validation sets...")
    X_train, X_val, y_train, y_val = train_test_split(
        X, y_categorical, test_size=0.2, random_state=42, stratify=y
    )
    print(f"   Training samples: {len(X_train)}")
    print(f"   Validation samples: {len(X_val)}")
    
    # Step 4: Create model
    model = create_model()
    
    # Step 5: Train model
    history, history_finetune = train_model(model, X_train, y_train, X_val, y_val)
    
    # Step 6: Load best model
    best_model_path = MODEL_OUTPUT_DIR / "best_model.keras"
    if best_model_path.exists():
        print(f"📥 Loading best model from {best_model_path}")
        model = keras.models.load_model(best_model_path)
    else:
        print("⚠️  Best model checkpoint not found, using current model")
    
    # Step 7: Evaluate final model
    print("📊 Evaluating final model...")
    val_loss, val_accuracy = model.evaluate(X_val, y_val, verbose=0)
    print(f"   Validation Accuracy: {val_accuracy:.4f} ({val_accuracy*100:.2f}%)")
    print(f"   Validation Loss: {val_loss:.4f}")
    
    # Step 8: Convert to TensorFlow.js
    convert_to_tensorflowjs(model, TENSORFLOWJS_OUTPUT_DIR)
    
    # Step 9: Save Keras model for reference
    keras_model_path = MODEL_OUTPUT_DIR / "final_model.keras"
    model.save(keras_model_path)
    print(f"💾 Keras model saved to: {keras_model_path}")
    
    print("\n" + "=" * 60)
    print("✅ Training pipeline completed successfully!")
    print("=" * 60)
    print(f"\n📦 Next steps:")
    print(f"1. Copy the TensorFlow.js model to your React Native app:")
    print(f"   cp -r {TENSORFLOWJS_OUTPUT_DIR}/* <your-react-native-app>/assets/models/")
    print(f"\n2. Update your React Native code to load and use the model")
    print(f"\n3. Model location: {TENSORFLOWJS_OUTPUT_DIR}")


if __name__ == "__main__":
    main()

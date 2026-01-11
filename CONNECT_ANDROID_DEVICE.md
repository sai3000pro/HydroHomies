# 📱 Connect Android Device Guide

This guide shows you how to connect your physical Android device to run the HydroHype app.

## Quick Steps

1. **Enable USB Debugging** on your Android device
2. **Connect device via USB** to your computer
3. **Verify device is detected** with `adb devices`
4. **Run the app** with `npm run android`

---

## Step-by-Step Instructions

### Step 1: Enable Developer Options on Android Device

1. **Open Settings** on your Android device
2. **Go to "About phone"** (or "About device")
3. **Find "Build number"** (usually at the bottom)
4. **Tap "Build number" 7 times** (you'll see a message like "You are now a developer!")
5. **Go back** to main Settings
6. **You'll now see "Developer options"** (usually under System or Advanced)

### Step 2: Enable USB Debugging

1. **Open "Developer options"** in Settings
2. **Toggle "USB debugging"** to ON
3. **If you see "Allow USB debugging?" dialog**, check "Always allow from this computer" and tap **"Allow"**

### Step 3: Connect Device via USB

1. **Connect your Android device** to your Mac using a USB cable
2. **On your Android device**, you may see a notification: **"USB for file transfer"** or **"USB debugging connected"**
3. **If prompted**, select **"File Transfer"** or **"MTP"** mode (not "Charge only")

### Step 4: Verify Device is Detected

Open a terminal and run:

```bash
# Check if adb can see your device
adb devices
```

**Expected output if device is connected:**
```
List of devices attached
ABC123XYZ    device
```

**If you see "unauthorized":**
- Check your Android device for a popup asking "Allow USB debugging?"
- Tap "Allow" and check "Always allow from this computer"

**If you see "no permissions":**
- Try running: `adb kill-server && adb start-server`
- Then check again: `adb devices`

### Step 5: Install ADB Tools (If Not Installed)

If `adb` command is not found, install it:

```bash
# Install via Homebrew (recommended for Mac)
brew install --cask android-platform-tools

# Or install Android Studio which includes ADB
# Download from: https://developer.android.com/studio
```

### Step 6: Set Up Port Forwarding (For Expo)

Set up port forwarding so your device can connect to the Expo dev server:

```bash
cd /Users/re/Desktop/HydroHomies/HydroHomies

# Run the adb port forwarding script
npm run adb

# Or manually forward ports:
adb reverse tcp:8081 tcp:8081
adb reverse tcp:19000 tcp:19000
adb reverse tcp:19001 tcp:19001
```

### Step 7: Run the App

Now you can run the app on your connected device:

```bash
cd /Users/re/Desktop/HydroHomies/HydroHomies

# Option 1: Build and install directly (recommended for development builds)
npm run android

# Option 2: Start Expo server and connect via Expo Go
npm start
# Then on your device, open Expo Go app and scan the QR code
# OR press 'a' in the Expo terminal to open on Android
```

---

## Troubleshooting

### Issue: "adb: command not found"

**Solution:**
```bash
# Install ADB tools
brew install --cask android-platform-tools

# Add to PATH (add to ~/.zshrc)
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Reload shell
source ~/.zshrc

# Verify
adb --version
```

### Issue: "No devices found" or "unauthorized"

**Solutions:**

1. **Check USB cable**: Use a data cable, not a charging-only cable
2. **Check USB mode**: On your device, change USB mode to "File Transfer" or "MTP"
3. **Revoke USB debugging**: In Developer options, tap "Revoke USB debugging authorizations"
4. **Restart ADB**:
   ```bash
   adb kill-server
   adb start-server
   adb devices
   ```
5. **Check device notification**: Your device may have a notification asking to allow USB debugging - tap it

### Issue: "Device offline"

**Solution:**
```bash
# Restart ADB server
adb kill-server
adb start-server
adb devices

# If still offline, disconnect and reconnect USB cable
# Or try a different USB port
```

### Issue: "Failed to resolve Android SDK path"

**Solution:**
This is a warning, but you can set it explicitly:

```bash
# Add to ~/.zshrc
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin

# Reload shell
source ~/.zshrc
```

**Note:** If you don't have Android Studio installed, you only need `platform-tools` for `adb`. The SDK path warning won't prevent `adb` from working.

### Issue: "No Android connected device found"

**Solutions:**

1. **Check `adb devices`** - Make sure device shows as "device" (not "unauthorized" or "offline")
2. **Restart Expo server**: Stop and restart with `npm start`
3. **Try Expo Go instead**: If building fails, use Expo Go:
   ```bash
   npm start
   # Then on device, open Expo Go and scan QR code
   ```
4. **Check device is unlocked**: Keep your device unlocked while connecting
5. **Try different USB port**: Some USB ports work better than others

### Issue: Device connects but app won't install/run

**Solutions:**

1. **Check if device has enough storage**
2. **Check if device allows installation from unknown sources** (if needed):
   - Settings → Security → Enable "Install unknown apps" for the terminal/IDE you're using
3. **Try Expo Go instead**:
   ```bash
   npm start
   # Then scan QR code with Expo Go app
   ```

---

## Alternative: Use Android Emulator

If you prefer not to use a physical device, you can use an Android emulator instead:

### Option 1: Android Studio Emulator (Recommended)

1. **Install Android Studio**: https://developer.android.com/studio
2. **Create an Android Virtual Device (AVD)**:
   - Open Android Studio
   - Go to Tools → Device Manager
   - Click "Create Device"
   - Select a device (e.g., Pixel 5)
   - Select System Image (API 33 or 34)
   - Click Finish
3. **Start the emulator**:
   - In Device Manager, click ▶️ Play button
   - Wait for emulator to boot
4. **Run the app**:
   ```bash
   npm run android
   # OR
   npm start
   # Then press 'a' in Expo terminal
   ```

### Option 2: Expo Go (Easiest for Testing)

1. **Install Expo Go** on your Android device from Google Play Store
2. **Start Expo server**:
   ```bash
   npm start
   ```
3. **Connect device**:
   - Make sure device and computer are on the **same WiFi network**
   - Open Expo Go app
   - Scan the QR code shown in terminal
   - OR enter URL manually: `exp://YOUR_IP:8081`

**Note:** Expo Go has limitations - ML model won't work, but other features will.

---

## Quick Commands Reference

```bash
# Check connected devices
adb devices

# Restart ADB server
adb kill-server && adb start-server

# Set up port forwarding for Expo
npm run adb

# Run app on connected device
npm run android

# Start Expo server (for Expo Go)
npm start

# View ADB logs
adb logcat

# Install APK directly (if you have one)
adb install app.apk
```

---

## ✅ Success Indicators

You'll know it's working when:

- ✅ `adb devices` shows your device as "device" (not "unauthorized")
- ✅ Device appears in Expo terminal when you run `npm start`
- ✅ App installs and launches on your device
- ✅ You see console logs from your app

---

## 📝 Notes

- **Keep device unlocked** while developing for easier debugging
- **USB debugging must stay enabled** while connected
- **First connection** may take a few seconds to authorize
- **Development builds** (via `npm run android`) work best for native features like ML model
- **Expo Go** is easier to use but has limitations (no ML model support)

---

## 🔗 Additional Resources

- [Android Developer - Run apps on a hardware device](https://developer.android.com/studio/run/device)
- [Expo - Running on a physical device](https://docs.expo.dev/workflow/android-studio-emulator/)
- [ADB Documentation](https://developer.android.com/studio/command-line/adb)

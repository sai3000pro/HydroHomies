# 📱 Android USB Settings Guide

## Recommended USB Settings for Development

When connecting your Android device to your Mac for development, use these settings:

---

## USB Mode / USB Configuration

**Recommended: "File Transfer" or "MTP" (Media Transfer Protocol)**

1. **When you connect your device**, you'll see a notification like:
   - "USB for file transfer"
   - "USB charging this device"
   - "Tap for more USB options"

2. **Tap the notification** (or go to Settings → Connected devices → USB)

3. **Select "File Transfer" or "MTP"** from the options:
   - ✅ **File Transfer** (MTP) - **Recommended**
   - ✅ **PTP** (Picture Transfer Protocol) - Also works
   - ❌ **Charge only** - Won't work for development
   - ❌ **MIDI** - Won't work for development
   - ❌ **No data transfer** - Won't work for development

**Why File Transfer/MTP?**
- Allows ADB to communicate with your device
- Allows file transfers if needed
- Most compatible with development tools
- Works with Expo and Android Studio

---

## USB Controlled By

**Recommended: "This device" or "Phone"**

1. **Go to Settings** on your Android device
2. **Developer options** (if enabled)
3. **Look for "USB debugging"** or "Default USB configuration"
4. **Set "USB controlled by"** to:
   - ✅ **"This device"** or **"Phone"** - **Recommended**
   - ✅ **"USB debugging"** - Also works (if available)

**Why "This device"?**
- Gives the phone control over the USB connection
- Allows ADB to properly communicate
- Prevents connection issues
- More reliable for development

**If you don't see "USB controlled by" option:**
- This setting might not be available on all devices
- As long as "USB debugging" is enabled, it should work
- Focus on the USB mode (File Transfer/MTP) instead

---

## Complete Setup Checklist

### On Your Android Device:

1. ✅ **Enable Developer Options**:
   - Settings → About phone → Tap "Build number" 7 times

2. ✅ **Enable USB Debugging**:
   - Settings → Developer options → Enable "USB debugging"
   - Check "Always allow from this computer" (when prompted)

3. ✅ **Set USB Mode to "File Transfer" (MTP)**:
   - When connected, tap USB notification
   - Select "File Transfer" or "MTP"

4. ✅ **Set USB Controlled By** (if available):
   - Settings → Developer options → "USB controlled by"
   - Select "This device" or "Phone"

5. ✅ **Keep Device Unlocked**:
   - Keep your device unlocked while developing
   - Some devices require screen to be on for ADB

---

## Step-by-Step: Changing USB Settings

### Method 1: Via Notification (Easiest)

1. **Connect your device** via USB
2. **Look for USB notification** in notification panel
3. **Tap the notification**
4. **Select "File Transfer" or "MTP"**
5. **Done!**

### Method 2: Via Settings

1. **Go to Settings** on your Android device
2. **Search for "USB"** or go to:
   - **Connected devices** → **USB** (Android 11+)
   - **Storage** → **USB computer connection** (Older Android)
   - **Developer options** → **Default USB configuration** (Developer options)
3. **Select "File Transfer" or "MTP"**
4. **Tap back** or close Settings

### Method 3: Via Developer Options (Advanced)

1. **Enable Developer Options** (tap Build number 7 times)
2. **Go to Settings → Developer options**
3. **Find "Default USB configuration"**
4. **Select "File Transfer (MTP)"**
5. **Now when you connect**, it will automatically use File Transfer mode

---

## Verification

After setting up, verify it works:

```bash
# Check if device is detected
adb devices

# You should see:
# List of devices attached
# ABC123XYZ    device
```

If you see "device" (not "unauthorized" or "offline"), you're all set! ✅

---

## Troubleshooting

### Issue: USB mode keeps changing to "Charge only"

**Solutions:**
1. **Change in Developer Options**:
   - Settings → Developer options → Default USB configuration → File Transfer (MTP)
   - This sets it as the default

2. **Check USB cable**: Use a data cable, not a charging-only cable
3. **Try different USB port**: Some ports work better than others
4. **Check device settings**: Some devices have "USB optimization" that needs to be disabled

### Issue: Device not detected by ADB

**Solutions:**
1. **Make sure USB mode is "File Transfer"** (not "Charge only")
2. **Check USB debugging is enabled**
3. **Try different USB cable**
4. **Restart ADB**:
   ```bash
   adb kill-server
   adb start-server
   adb devices
   ```
5. **Unplug and replug USB cable**

### Issue: "USB controlled by" option not available

**Solutions:**
- This option isn't available on all Android devices
- It's not required - focus on USB mode (File Transfer) instead
- As long as "USB debugging" is enabled, it should work
- Some devices handle this automatically

### Issue: Device connects but disconnects frequently

**Solutions:**
1. **Check USB cable** - Use a good quality data cable
2. **Try different USB port** - USB 3.0 ports sometimes have issues
3. **Disable USB optimization** (if available):
   - Settings → Developer options → "Disable USB audio routing" (if available)
   - Settings → Battery → "USB optimization" → Disable (if available)
4. **Keep device screen on** - Some devices disconnect when screen turns off

---

## Device-Specific Notes

### Samsung Devices
- Usually uses "MTP" or "File Transfer"
- May have "Samsung USB driver" option - use "File Transfer" instead
- Check Settings → Developer options → "USB debugging"

### Google Pixel Devices
- Usually uses "File Transfer"
- Very reliable with ADB
- Check Settings → System → Developer options

### OnePlus Devices
- Usually uses "File Transfer" or "MTP"
- Check Settings → Developer options → "Default USB configuration"

### Xiaomi/MIUI Devices
- May need to enable "USB debugging (Security settings)" in Developer options
- Check Settings → Additional settings → Developer options
- USB mode: "File Transfer (MTP)"

---

## Quick Reference

**USB Mode:** File Transfer (MTP) ✅  
**USB Controlled By:** This device / Phone ✅  
**USB Debugging:** Enabled ✅  
**Always allow from this computer:** Checked ✅  

---

## Summary

**For development with Expo/React Native:**

1. ✅ **USB Mode**: "File Transfer" or "MTP"
2. ✅ **USB Controlled By**: "This device" (if available)
3. ✅ **USB Debugging**: Enabled
4. ✅ **Device**: Keep unlocked during development

These settings will allow ADB to communicate with your device properly and enable development tools to work correctly.

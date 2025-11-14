# 🎯 Next Steps - After Android Studio Installation

## ✅ Current Status

- [x] Flutter SDK installed (3.38.0)
- [x] Flutter added to PATH
- [ ] Android Studio installed (in progress...)
- [ ] Android SDK configured
- [ ] Emulator created
- [ ] App running with hot reload

---

## 📱 Step-by-Step Guide

### 1. Launch Android Studio (After Installation Completes)

```bash
android-studio
```

**First Launch Wizard:**
1. Welcome Screen → Click "Next"
2. Install Type → Choose "Standard"
3. Select UI Theme → Light or Dark
4. Verify Settings → Click "Finish"
5. Wait for components download (~5-10 minutes):
   - Android SDK
   - Android SDK Platform
   - Android SDK Build-Tools
   - Android Emulator
   - Android SDK Platform-Tools

---

### 2. Install Flutter Plugin

1. Open Android Studio
2. **Configure** (or **File**) → **Plugins**
3. Search: **"Flutter"**
4. Click **Install** (Dart will auto-install)
5. **Restart Android Studio**

---

### 3. Accept Android Licenses

```bash
export PATH="$HOME/development/flutter/bin:$PATH"
flutter doctor --android-licenses
# Type 'y' for all prompts
```

---

### 4. Create Lightweight Emulator

**Via Android Studio:**

1. **Tools** → **Device Manager**
2. Click **"Create Device"**
3. Select **Pixel 4** → Next
4. Download **Android 11 (API 30)** → Next
5. Name: `flutter_emulator`
6. **Show Advanced Settings:**
   - RAM: **2048 MB**
   - Graphics: **Hardware - GLES 2.0**
7. Click **Finish**

**Or use command line:**

```bash
# Download system image
sdkmanager "system-images;android-30;google_apis;x86_64"

# Create AVD
avdmanager create avd \
  -n flutter_emulator \
  -k "system-images;android-30;google_apis;x86_64" \
  -d "pixel_4"
```

---

### 5. Run EPR Mobile App

**Option A: Using Quick Start Script (Recommended)**

```bash
cd /home/dieplai/Documents/luanvan/epr-saas-platform/mobile
./scripts/quick_start.sh
```

**Option B: Manual Steps**

```bash
# Terminal 1: Start backend
cd /home/dieplai/Documents/luanvan/epr-saas-platform
docker-compose up -d

# Terminal 2: Run mobile app
cd /home/dieplai/Documents/luanvan/epr-saas-platform/mobile

# Add Flutter to PATH
export PATH="$HOME/development/flutter/bin:$PATH"

# Install dependencies
flutter pub get

# Generate code
flutter pub run build_runner build --delete-conflicting-outputs

# Launch emulator
flutter emulators --launch flutter_emulator

# Wait 30 seconds for boot, then run app
flutter run
```

---

## 🔥 Hot Reload Commands

Once app is running:

```
r  → Hot reload (0.5s - keeps state)
R  → Hot restart (2s - resets state)
p  → Performance overlay
i  → Widget inspector
o  → Toggle iOS/Android mode
q  → Quit
```

---

## 📊 Verify Setup

```bash
# Check Flutter
flutter doctor

# Expected output:
# [✓] Flutter (Channel stable, 3.38.0)
# [✓] Android toolchain
# [✓] Android Studio
# [✓] Linux toolchain
# [✓] Connected device

# List emulators
flutter emulators

# List connected devices
flutter devices
```

---

## 🎨 Your First Hot Reload

1. App running on emulator
2. Open `lib/features/auth/presentation/screens/login_screen.dart`
3. Change something (e.g., text color)
4. Press `Ctrl+S` (save)
5. **See changes in 0.5 seconds!** 🔥

---

## 🚀 Quick Commands

```bash
# Check installation
flutter --version
flutter doctor

# List emulators
flutter emulators

# Launch emulator
flutter emulators --launch flutter_emulator

# Run app
flutter run

# Clean build
flutter clean

# Update dependencies
flutter pub get

# Generate code
flutter pub run build_runner build --delete-conflicting-outputs
```

---

## 📚 Helpful Scripts

```bash
cd /home/dieplai/Documents/luanvan/epr-saas-platform/mobile/scripts

# Quick start (all-in-one)
./quick_start.sh

# Setup helper (interactive menu)
./setup_flutter_emulator.sh

# Development helper
./dev.sh
```

---

## 🐛 Common Issues

### Emulator won't start?

```bash
# Enable KVM
sudo pacman -S qemu-desktop libvirt
sudo usermod -aG libvirt $USER
newgrp libvirt

# Restart libvirtd
sudo systemctl restart libvirtd
```

### Hot reload not working?

```bash
# Press 'R' (capital R) in terminal
# Or restart app completely
```

### Can't find device?

```bash
# Check emulator running
flutter devices

# If not listed, restart emulator
```

---

## ✨ What's Next?

After getting app running:

1. ✅ Test login flow
2. ✅ Experiment with hot reload
3. 🚧 Implement Register screen
4. 🚧 Build Chatbot feature
5. 🚧 Add Subscription management

---

## 📖 Documentation

- Full Setup Guide: `EMULATOR_SETUP.md`
- Project Structure: `PROJECT_STRUCTURE.md`
- Quick Start: `QUICKSTART.md`
- Flutter Install: `INSTALL.md`

---

**Enjoy hot reload development! 🔥**

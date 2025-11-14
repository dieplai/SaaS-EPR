# 🚀 Setup Flutter + Lightweight Emulator

Hướng dẫn chi tiết setup Flutter với emulator tối ưu cho hot reload workflow.

## ✅ Bước 1: Verify Flutter Installation

```bash
# Add Flutter to PATH (thêm vào ~/.bashrc)
export PATH="$HOME/development/flutter/bin:$PATH"
source ~/.bashrc

# Check Flutter version
flutter --version

# Run diagnostic
flutter doctor
```

**Expected first run output:**
```
Doctor summary:
[✓] Flutter (Channel stable, 3.x.x)
[✗] Android toolchain - develop for Android devices
[✗] Android Studio (not installed)
```

---

## 📱 Bước 2: Install Android Studio

### Option A: Using yay (Automatic)

```bash
cd /home/dieplai/Documents/luanvan/epr-saas-platform/mobile
./scripts/install_android_studio.sh
```

### Option B: Manual Installation

```bash
# Install yay first if not available
sudo pacman -S --needed git base-devel
cd /tmp
git clone https://aur.archlinux.org/yay.git
cd yay
makepkg -si
cd ~

# Install Android Studio
yay -S android-studio
```

---

## ⚙️ Bước 3: Initial Android Studio Setup

```bash
# Launch Android Studio
android-studio
```

**Setup Wizard Steps:**

1. **Welcome Screen** → Click "Next"

2. **Install Type** → Choose "Standard"

3. **Select UI Theme** → Choose Light hoặc Dark

4. **Verify Settings** → Review and click "Finish"

5. **Downloading Components** (sẽ mất 5-10 phút):
   - Android SDK
   - Android SDK Platform
   - Android SDK Build-Tools
   - Android Emulator
   - Android SDK Platform-Tools

---

## 🛠️ Bước 4: Install Flutter Plugin in Android Studio

1. Open Android Studio

2. **Configure** (hoặc File) → **Plugins**

3. Search: **"Flutter"**

4. Click **Install** (sẽ tự install Dart plugin)

5. **Restart Android Studio**

---

## 📦 Bước 5: Setup Android SDK

### 5.1 Accept Android Licenses

```bash
flutter doctor --android-licenses

# Type 'y' for all prompts
```

### 5.2 Verify SDK Installation

```bash
flutter doctor
```

**Expected output:**
```
[✓] Flutter (Channel stable)
[✓] Android toolchain - develop for Android devices
[✓] Android Studio
[!] Connected device (No devices available)
```

---

## 🎮 Bước 6: Create Lightweight Emulator

### Method 1: Via Android Studio (Recommended)

1. Open Android Studio

2. **Tools** → **Device Manager**

3. Click **"Create Device"**

4. **Select Hardware:**
   - Category: **Phone**
   - Device: **Pixel 4** (NOT Pixel 4 XL - nhẹ hơn)
   - Click **Next**

5. **Select System Image:**
   - Release Name: **R** (Android 11, API 30)
   - Click **Download** (nếu chưa có)
   - Click **Next**

6. **Android Virtual Device (AVD):**
   - Name: `flutter_emulator`
   - Startup orientation: Portrait
   - Click **"Show Advanced Settings"**

7. **Advanced Settings (IMPORTANT for performance):**
   ```
   Camera:
   - Front: None
   - Back: None

   Network:
   - Speed: Full
   - Latency: None

   Memory and Storage:
   - RAM: 2048 MB (2GB - đủ dùng)
   - VM heap: 256 MB
   - Internal Storage: 2048 MB
   - SD card: None

   Emulated Performance:
   - Graphics: Hardware - GLES 2.0
   - Boot option: Cold boot
   - Multi-Core CPU: 4 cores
   ```

8. Click **Finish**

### Method 2: Via Command Line

```bash
# List available system images
sdkmanager --list | grep system-images

# Download Android 11 image (if not exist)
sdkmanager "system-images;android-30;google_apis;x86_64"

# Create AVD
avdmanager create avd \
  -n flutter_emulator \
  -k "system-images;android-30;google_apis;x86_64" \
  -d "pixel_4"

# Configure RAM
echo "hw.ramSize=2048" >> ~/.android/avd/flutter_emulator.avd/config.ini
```

---

## 🚀 Bước 7: Launch Emulator & Run App

### 7.1 Start Emulator

**Option A: From Android Studio**
- Tools → Device Manager
- Click **Play** button next to `flutter_emulator`

**Option B: Command Line**
```bash
# List emulators
flutter emulators

# Launch emulator
flutter emulators --launch flutter_emulator
```

**Wait for emulator to fully boot** (30-60 seconds)
- You'll see Android home screen
- Status bar shows time, battery, signal

### 7.2 Verify Device Connected

```bash
flutter devices
```

**Expected output:**
```
2 connected devices:

flutter_emulator (mobile) • emulator-5554 • android-x86 • Android 11 (API 30)
Chrome (web)              • chrome        • web-javascript • Google Chrome 120.0
```

### 7.3 Run EPR Mobile App

```bash
cd /home/dieplai/Documents/luanvan/epr-saas-platform/mobile

# Install dependencies (first time only)
flutter pub get

# Generate code
flutter pub run build_runner build --delete-conflicting-outputs

# Run app with hot reload
flutter run
```

**You should see:**
```
Launching lib/main.dart on flutter_emulator in debug mode...
Running Gradle task 'assembleDebug'...
✓ Built build/app/outputs/flutter-apk/app-debug.apk
Installing build/app/outputs/flutter-apk/app-debug.apk...
Flutter run key commands.
r Hot reload. 🔥🔥🔥
R Hot restart.
h List all available interactive commands.
d Detach (terminate "flutter run" but leave application running).
c Clear the screen
q Quit (terminate the application on the device).
```

**App will appear on emulator** - EPR Legal login screen!

---

## 🔥 HOT RELOAD WORKFLOW

### The Magic of Hot Reload

```dart
// 1. App đang chạy, bạn thấy màu xanh
color: Colors.blue,

// 2. Đổi thành đỏ, nhấn Ctrl+S (save)
color: Colors.red,

// 3. Sau 0.5 giây → Màu đổi thành đỏ trên emulator!
// KHÔNG CẦN rebuild, KHÔNG CẦN restart app
```

### Hot Reload Commands (trong terminal đang chạy flutter run)

```bash
# Press 'r' → Hot reload (0.3-1s)
# Giữ state, chỉ rebuild UI

# Press 'R' → Hot restart (2-3s)
# Clear state, restart từ đầu

# Press 'p' → Toggle performance overlay
# Xem FPS, render time

# Press 'i' → Toggle widget inspector
# Debug layout issues

# Press 'o' → Toggle platform (iOS/Android)
# Switch giữa Material và Cupertino

# Press 'q' → Quit
# Stop app
```

---

## 📊 Performance Tips

### Emulator Performance Optimization

1. **Enable KVM (Hardware Acceleration)**
   ```bash
   # Check if KVM enabled
   lscpu | grep Virtualization

   # Install KVM packages
   sudo pacman -S qemu-desktop libvirt virt-manager

   # Add user to libvirt group
   sudo usermod -aG libvirt $USER
   newgrp libvirt
   ```

2. **Close Unused Apps**
   - Đóng Chrome tabs không dùng
   - Đóng Docker Desktop nếu không cần
   - Monitoring: `htop`

3. **Emulator Settings**
   - Graphics: Hardware (NOT Software)
   - Snapshot: Enable (boot nhanh hơn)
   - Multi-core: 4 cores

### Expected Performance

```
Cold start: 30-60s (lần đầu boot emulator)
Hot reload: 0.3-1s (thay đổi UI)
Hot restart: 2-3s (restart app)
Build APK: 30-60s (debug), 2-3 phút (release)
```

---

## 🐛 Troubleshooting

### Issue 1: Emulator không start

```bash
# Check virtualization
lscpu | grep Virtualization

# If "VT-x" or "AMD-V" not shown:
# Enable in BIOS → Advanced → CPU Configuration → Virtualization

# Restart libvirtd
sudo systemctl restart libvirtd
```

### Issue 2: Emulator rất lag

```bash
# Solution 1: Reduce RAM
# Device Manager → Edit → RAM: 1536 MB

# Solution 2: Use Pixel 3 (smaller screen)

# Solution 3: Close background apps
```

### Issue 3: "adb: device offline"

```bash
# Restart adb
adb kill-server
adb start-server

# Restart emulator
```

### Issue 4: Hot reload không work

```bash
# Trong terminal flutter run, press 'R' (capital R)
# Hoặc restart app completely
```

### Issue 5: Gradle build failed

```bash
flutter clean
flutter pub get
flutter run
```

---

## ✅ Verification Checklist

Sau khi setup xong, check:

- [  ] Flutter version shows correctly: `flutter --version`
- [  ] No errors in flutter doctor: `flutter doctor`
- [  ] Emulator listed: `flutter emulators`
- [  ] Emulator boots successfully
- [  ] Flutter recognizes device: `flutter devices`
- [  ] App runs on emulator: `flutter run`
- [  ] Hot reload works (press 'r')
- [  ] Login screen displays correctly

---

## 🚀 Quick Start (After Setup)

**Daily workflow:**

```bash
# Terminal 1: Start backend services
cd /home/dieplai/Documents/luanvan/epr-saas-platform
docker-compose up -d

# Terminal 2: Start emulator & run app
cd /home/dieplai/Documents/luanvan/epr-saas-platform/mobile
flutter emulators --launch flutter_emulator  # Wait 30s
flutter run  # App starts with hot reload

# Now: Code → Save → See changes in 0.5s! 🔥
```

---

## 📚 Useful Resources

- Flutter Docs: https://docs.flutter.dev
- Emulator Setup: https://developer.android.com/studio/run/emulator
- Performance: https://docs.flutter.dev/perf
- Hot Reload: https://docs.flutter.dev/tools/hot-reload

---

**Happy coding with hot reload! 🔥**

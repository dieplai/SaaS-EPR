# Hướng Dẫn Cài Đặt Flutter

## 📋 Yêu Cầu Hệ Thống

### Linux (Arch Linux)
- **OS**: Arch Linux (bạn đang dùng)
- **Disk Space**: Ít nhất 2.5 GB
- **Tools**: `bash`, `curl`, `git`, `unzip`, `xz-utils`

## 🚀 Cài Đặt Flutter SDK

### Bước 1: Download Flutter SDK

```bash
cd ~
mkdir -p development
cd development

# Download Flutter SDK (stable channel)
git clone https://github.com/flutter/flutter.git -b stable
```

### Bước 2: Add Flutter to PATH

```bash
# Mở file .bashrc hoặc .zshrc
nano ~/.bashrc

# Thêm dòng này vào cuối file:
export PATH="$HOME/development/flutter/bin:$PATH"

# Save và reload
source ~/.bashrc
```

### Bước 3: Verify Installation

```bash
flutter doctor
```

Bạn sẽ thấy output như này:
```
Doctor summary (to see all details, run flutter doctor -v):
[✓] Flutter (Channel stable, 3.19.0, on Arch Linux...)
[✗] Android toolchain - develop for Android devices
[✗] Chrome - develop for the web
[✗] Android Studio (not installed)
```

## 📱 Cài Đặt Android Development Tools

### Bước 4: Install Android Studio

```bash
# Download Android Studio
yay -S android-studio

# Hoặc từ AUR
paru -S android-studio
```

**Launch Android Studio:**
```bash
android-studio
```

### Bước 5: Install Android SDK via Android Studio

1. Open Android Studio
2. Click "More Actions" → "SDK Manager"
3. Install:
   - ✅ Android SDK Platform (API 33 or higher)
   - ✅ Android SDK Command-line Tools
   - ✅ Android SDK Build-Tools
   - ✅ Android SDK Platform-Tools
   - ✅ Android Emulator

### Bước 6: Accept Android Licenses

```bash
flutter doctor --android-licenses

# Type 'y' to accept all licenses
```

### Bước 7: Setup Android Emulator

1. Open Android Studio
2. Tools → Device Manager
3. Click "Create Device"
4. Select "Pixel 6" hoặc device bất kỳ
5. Download system image (API 33 recommended)
6. Click "Finish"

## ✅ Verify Setup

```bash
flutter doctor
```

**Expected output:**
```
Doctor summary (to see all details, run flutter doctor -v):
[✓] Flutter (Channel stable, 3.19.0, on Arch Linux)
[✓] Android toolchain - develop for Android devices (Android SDK version 33.0.0)
[✓] Chrome - develop for the web
[✓] Android Studio (version 2023.1)
[✓] Connected device (1 available)
```

## 🏃‍♂️ Test Flutter Installation

### Create Test Project

```bash
cd /tmp
flutter create test_app
cd test_app
```

### Run on Emulator

```bash
# Start emulator
flutter emulators --launch <emulator_name>

# Run app
flutter run
```

Nếu thấy app chạy thành công → Flutter đã sẵn sàng!

## 📦 Run EPR Legal Mobile Project

```bash
cd /home/dieplai/Documents/luanvan/epr-saas-platform/mobile

# Install dependencies
flutter pub get

# Generate code (for JSON serialization)
flutter pub run build_runner build --delete-conflicting-outputs

# Run app
flutter run
```

## 🐛 Troubleshooting

### Issue 1: "cmdline-tools component is missing"

```bash
# Open Android Studio
# Tools → SDK Manager → SDK Tools
# ✅ Check "Android SDK Command-line Tools (latest)"
# Click "Apply"
```

### Issue 2: "Unable to locate Android SDK"

```bash
# Set ANDROID_HOME environment variable
echo 'export ANDROID_HOME=$HOME/Android/Sdk' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools' >> ~/.bashrc
source ~/.bashrc
```

### Issue 3: Emulator not starting

```bash
# Check virtualization enabled
lscpu | grep Virtualization

# Install KVM packages (if needed)
sudo pacman -S qemu-desktop libvirt virt-manager

# Add user to libvirt group
sudo usermod -aG libvirt $USER
```

### Issue 4: "Gradle build failed"

```bash
# Update Gradle wrapper
cd android
./gradlew wrapper --gradle-version 8.0
cd ..
```

## 📚 Useful Flutter Commands

```bash
# Check Flutter version
flutter --version

# Upgrade Flutter
flutter upgrade

# List devices
flutter devices

# Clean build
flutter clean

# Build APK
flutter build apk

# Run in release mode
flutter run --release

# Hot reload (press 'r' in terminal)
# Hot restart (press 'R' in terminal)
```

## 💡 IDE Setup (Optional)

### VS Code Extensions

```bash
code --install-extension Dart-Code.dart-code
code --install-extension Dart-Code.flutter
```

### Android Studio Plugins

1. File → Settings → Plugins
2. Search and install:
   - ✅ Flutter
   - ✅ Dart

## 🎯 Next Steps

Sau khi cài đặt xong Flutter:

1. ✅ Chạy `flutter doctor` để verify
2. ✅ Test với app mẫu
3. ✅ Chạy EPR Legal mobile project:
   ```bash
   cd /home/dieplai/Documents/luanvan/epr-saas-platform/mobile
   flutter pub get
   flutter pub run build_runner build --delete-conflicting-outputs
   flutter run
   ```

## 📞 Support

Nếu gặp vấn đề:
- Flutter Documentation: https://docs.flutter.dev
- Flutter Arch Linux Wiki: https://wiki.archlinux.org/title/Flutter
- Stack Overflow: https://stackoverflow.com/questions/tagged/flutter

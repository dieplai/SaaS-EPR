# 🚀 Quick Start Guide

Hướng dẫn nhanh để chạy EPR Legal Mobile App trong 5 phút!

## ⚡ Prerequisites

Cần cài đặt trước:
- ✅ Flutter SDK (xem `INSTALL.md` nếu chưa có)
- ✅ Android Studio + Android SDK
- ✅ Android Emulator hoặc Physical Device

## 📱 Steps to Run

### 1. Cài đặt Flutter (nếu chưa có)

```bash
# Check nếu đã có Flutter
flutter --version

# Nếu chưa có, xem hướng dẫn chi tiết trong INSTALL.md
```

### 2. Navigate to Project

```bash
cd /home/dieplai/Documents/luanvan/epr-saas-platform/mobile
```

### 3. Install Dependencies

```bash
flutter pub get
```

### 4. Generate Code

```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

### 5. Start Backend Services

Backend services phải chạy trước:

```bash
# Mở terminal mới, chạy backend
cd /home/dieplai/Documents/luanvan/epr-saas-platform
docker-compose up -d

# Verify services running
docker ps
```

Expected services:
- ✅ epr-user-service (port 8001)
- ✅ epr-package-service (port 8002)
- ✅ epr-ai-chatbot (port 8004)

### 6. Start Emulator

```bash
# List available emulators
flutter emulators

# Launch emulator (replace with your emulator name)
flutter emulators --launch Pixel_6_API_33

# Wait for emulator to fully boot
```

### 7. Run App

```bash
flutter run
```

You should see:
```
Launching lib/main.dart on Pixel 6 in debug mode...
✓ Built build/app/outputs/flutter-apk/app-debug.apk
Installing build/app/outputs/flutter-apk/app-debug.apk...
D/FlutterActivity: Using the launch theme as normal theme.
Syncing files to device Pixel 6...
```

## 🎯 Quick Commands

```bash
# Run with hot reload
flutter run

# Run on specific device
flutter run -d emulator-5554

# Run in release mode
flutter run --release

# Build APK
flutter build apk --release

# Clean build
flutter clean && flutter pub get
```

## 🔧 Using Helper Script

```bash
# Make script executable (first time only)
chmod +x scripts/dev.sh

# Run interactive menu
./scripts/dev.sh
```

Menu options:
1. Install dependencies
2. Generate code
3. Clean project
4. Run app
5. Build APK (debug)
6. Build APK (release)
7. Run tests
8. Analyze code
9. Format code

## 🐛 Troubleshooting

### Issue: "Flutter not found"

```bash
# Add Flutter to PATH
export PATH="$HOME/development/flutter/bin:$PATH"
source ~/.bashrc
```

### Issue: "No connected devices"

```bash
# Check devices
flutter devices

# Start emulator
flutter emulators --launch <emulator_name>

# For physical device: Enable USB Debugging in Developer Options
```

### Issue: "Gradle build failed"

```bash
# Clean and rebuild
flutter clean
flutter pub get
flutter run
```

### Issue: "Cannot connect to backend"

**For Android Emulator:**
```bash
# Android emulator uses 10.0.2.2 for localhost
# Edit .env.dev:
USER_SERVICE_URL=http://10.0.2.2:8001/api/v1
PACKAGE_SERVICE_URL=http://10.0.2.2:8002/api/v1
AI_CHATBOT_URL=http://10.0.2.2:8004/api/v1
```

**For Physical Device:**
```bash
# Use your computer's IP address
# Find IP: ip addr show
# Edit .env.dev:
USER_SERVICE_URL=http://192.168.1.100:8001/api/v1
```

## ✅ Verify Installation

Test if everything works:

```bash
# 1. Check Flutter
flutter doctor

# 2. Check backend services
curl http://localhost:8001/health

# 3. List devices
flutter devices

# 4. Run app
flutter run
```

## 📖 Next Steps

1. ✅ App running successfully
2. 🔐 Test login with credentials from backend
3. 💬 Explore chatbot feature (coming soon)
4. 📱 Build APK for testing: `flutter build apk --release`

## 📚 More Documentation

- `README.md` - Full project documentation
- `INSTALL.md` - Detailed Flutter installation guide
- `PROJECT_STRUCTURE.md` - Architecture explanation

## 🆘 Need Help?

Common resources:
- Flutter Docs: https://docs.flutter.dev
- Project Issues: Check backend service logs
- Stack Overflow: https://stackoverflow.com/questions/tagged/flutter

---

**Happy coding! 🎉**

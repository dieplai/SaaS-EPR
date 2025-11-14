# EPR Legal Mobile App

Mobile application for EPR Legal SaaS Platform - AI-powered legal consultation for businesses.

## 🏗️ Architecture

This project follows **Clean Architecture** principles with a **Feature-First** structure:

```
lib/
├── app/                    # App-level configuration
│   ├── routes/            # Navigation
│   ├── theme/             # Theming
│   └── constants/         # Constants
├── core/                   # Core utilities
│   ├── network/           # HTTP client (Dio)
│   ├── storage/           # Local & Secure storage
│   ├── error/             # Error handling
│   ├── utils/             # Utilities
│   └── di/                # Dependency Injection (GetIt)
└── features/               # Features (Auth, Chatbot, etc.)
    └── {feature}/
        ├── data/          # Data layer (API, models, repositories)
        ├── domain/        # Business logic (entities, usecases)
        └── presentation/  # UI (screens, widgets, providers)
```

## 🚀 Getting Started

### Prerequisites

1. **Install Flutter SDK** (version 3.2.0 or higher)
   ```bash
   # Download from: https://flutter.dev/docs/get-started/install
   # Or use fvm: fvm install 3.19.0
   ```

2. **Install Android Studio** (for Android development)
   - Install Android SDK
   - Setup Android Emulator

3. **Verify installation**
   ```bash
   flutter doctor
   ```

### Setup Project

1. **Navigate to project directory**
   ```bash
   cd /home/dieplai/Documents/luanvan/epr-saas-platform/mobile
   ```

2. **Install dependencies**
   ```bash
   flutter pub get
   ```

3. **Generate code** (for JSON serialization, Freezed models)
   ```bash
   flutter pub run build_runner build --delete-conflicting-outputs
   ```

4. **Configure environment**
   - Edit `.env.dev` for development
   - Edit `.env.prod` for production
   - Update API URLs to point to your backend services

### Run the App

**Development mode (with hot reload):**
```bash
flutter run
```

**Specific device:**
```bash
# List devices
flutter devices

# Run on specific device
flutter run -d <device_id>

# Run on Android emulator
flutter run -d emulator-5554

# Run on physical device
flutter run -d <device_serial>
```

**Build APK for testing:**
```bash
# Debug APK
flutter build apk --debug

# Release APK
flutter build apk --release

# APK will be at: build/app/outputs/flutter-apk/app-release.apk
```

**Install APK on device:**
```bash
flutter install
```

## 🛠️ Development

### Code Generation

When you modify models with `@JsonSerializable` or `@freezed`:

```bash
# Watch mode (auto-generate on save)
flutter pub run build_runner watch

# One-time generation
flutter pub run build_runner build --delete-conflicting-outputs
```

### Linting

```bash
flutter analyze
```

### Testing

```bash
# Run all tests
flutter test

# Run specific test file
flutter test test/features/auth/login_test.dart

# Run with coverage
flutter test --coverage
```

## 📦 Backend Services

Make sure your backend services are running:

```bash
cd /home/dieplai/Documents/luanvan/epr-saas-platform
docker-compose up -d
```

**Services:**
- User Service: http://localhost:8001
- Package Service: http://localhost:8002
- AI Chatbot Service: http://localhost:8004

## 🏃‍♂️ Running on Physical Device

### Android

1. Enable Developer Options on your device
2. Enable USB Debugging
3. Connect device via USB
4. Run `flutter run`

### iOS (requires macOS)

1. Open `ios/Runner.xcworkspace` in Xcode
2. Select your device
3. Click Run

## 🔨 Build for Production

### Android

```bash
# Build release APK
flutter build apk --release

# Build App Bundle (for Google Play)
flutter build appbundle --release

# Output: build/app/outputs/bundle/release/app-release.aab
```

### iOS (requires macOS)

```bash
flutter build ios --release
```

## 📱 Google Play Deployment

1. **Register Google Play Developer Account** ($25 one-time fee)
   - https://play.google.com/console/signup

2. **Create App in Play Console**
   - Add app details, screenshots, description
   - Set up content rating, target audience

3. **Upload App Bundle**
   ```bash
   flutter build appbundle --release
   ```
   - Upload `build/app/outputs/bundle/release/app-release.aab`

4. **Submit for Review** (1-7 days)

## 🧪 Testing API Integration

Update backend URLs in `.env.dev`:

```bash
# For Android Emulator (localhost = 10.0.2.2)
USER_SERVICE_URL=http://10.0.2.2:8001/api/v1
PACKAGE_SERVICE_URL=http://10.0.2.2:8002/api/v1
AI_CHATBOT_URL=http://10.0.2.2:8004/api/v1

# For Physical Device (use your computer's IP)
USER_SERVICE_URL=http://192.168.1.100:8001/api/v1
```

## 🔑 Key Dependencies

- **State Management**: `provider`
- **Networking**: `dio`, `pretty_dio_logger`
- **Storage**: `flutter_secure_storage`, `shared_preferences`
- **DI**: `get_it`, `injectable`
- **Routing**: `go_router`
- **Code Gen**: `freezed`, `json_serializable`
- **Chat UI**: `flutter_chat_ui`
- **Utils**: `dartz`, `equatable`, `intl`, `uuid`

## 📝 Project Status

✅ **Completed:**
- Clean Architecture structure
- Core layer (network, storage, error handling, DI)
- Authentication feature (login, register, logout)
- Theme system (light/dark mode)
- Environment configuration

🚧 **TODO:**
- Register screen UI
- Home screen
- Chatbot feature
- Subscription management
- User profile
- PDF viewer for legal documents
- Push notifications
- Unit tests
- Widget tests

## 🤝 Contributing

1. Create feature branch
2. Follow Clean Architecture pattern
3. Write tests
4. Run `flutter analyze` and `flutter test`
5. Submit pull request

## 📄 License

Proprietary - EPR Legal SaaS Platform

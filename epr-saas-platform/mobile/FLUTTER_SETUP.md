# Flutter Mobile App - Setup & Structure

> **iOS-first design** với Material 3 + Cupertino widgets

---

## 📱 App Structure

```
mobile/
├── lib/
│   ├── main.dart                    # App entry point
│   │
│   ├── core/                        # Core utilities & config
│   │   ├── config/
│   │   │   ├── app_config.dart     # Environment config
│   │   │   └── api_config.dart     # API endpoints
│   │   ├── network/
│   │   │   ├── api_client.dart     # Dio HTTP client
│   │   │   ├── interceptors/
│   │   │   │   ├── auth_interceptor.dart
│   │   │   │   ├── logging_interceptor.dart
│   │   │   │   └── error_interceptor.dart
│   │   │   └── api_exception.dart
│   │   ├── theme/
│   │   │   ├── app_theme.dart      # Material + Cupertino themes
│   │   │   ├── app_colors.dart     # Color palette
│   │   │   ├── app_typography.dart # Text styles
│   │   │   └── app_spacing.dart    # Spacing constants
│   │   ├── utils/
│   │   │   ├── secure_storage.dart # flutter_secure_storage
│   │   │   ├── validators.dart     # Form validation
│   │   │   ├── date_formatter.dart
│   │   │   └── logger.dart
│   │   └── constants/
│   │       ├── app_constants.dart
│   │       └── storage_keys.dart
│   │
│   ├── features/                    # Feature-based organization
│   │   │
│   │   ├── auth/                   # Authentication feature
│   │   │   ├── data/
│   │   │   │   ├── models/
│   │   │   │   │   ├── user_model.dart
│   │   │   │   │   ├── login_request.dart
│   │   │   │   │   └── auth_response.dart
│   │   │   │   ├── repositories/
│   │   │   │   │   └── auth_repository_impl.dart
│   │   │   │   └── datasources/
│   │   │   │       ├── auth_remote_datasource.dart
│   │   │   │       └── auth_local_datasource.dart
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   └── user.dart
│   │   │   │   ├── repositories/
│   │   │   │   │   └── auth_repository.dart
│   │   │   │   └── usecases/
│   │   │   │       ├── login_usecase.dart
│   │   │   │       ├── register_usecase.dart
│   │   │   │       └── logout_usecase.dart
│   │   │   └── presentation/
│   │   │       ├── pages/
│   │   │       │   ├── login_page.dart
│   │   │       │   ├── register_page.dart
│   │   │       │   └── forgot_password_page.dart
│   │   │       ├── widgets/
│   │   │       │   ├── auth_text_field.dart
│   │   │       │   ├── auth_button.dart
│   │   │       │   └── social_login_button.dart
│   │   │       └── providers/
│   │   │           └── auth_provider.dart  # Riverpod
│   │   │
│   │   ├── chat/                   # Chat feature
│   │   │   ├── data/
│   │   │   │   ├── models/
│   │   │   │   │   ├── message_model.dart
│   │   │   │   │   ├── chat_request.dart
│   │   │   │   │   └── chat_response.dart
│   │   │   │   ├── repositories/
│   │   │   │   │   └── chat_repository_impl.dart
│   │   │   │   └── datasources/
│   │   │   │       ├── chat_remote_datasource.dart
│   │   │   │       └── chat_local_datasource.dart  # Cache
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   ├── message.dart
│   │   │   │   │   ├── conversation.dart
│   │   │   │   │   └── source_document.dart
│   │   │   │   ├── repositories/
│   │   │   │   │   └── chat_repository.dart
│   │   │   │   └── usecases/
│   │   │   │       ├── send_message_usecase.dart
│   │   │   │       ├── get_history_usecase.dart
│   │   │   │       └── clear_history_usecase.dart
│   │   │   └── presentation/
│   │   │       ├── pages/
│   │   │       │   ├── chat_page.dart
│   │   │       │   └── chat_history_page.dart
│   │   │       ├── widgets/
│   │   │       │   ├── message_bubble.dart       # iOS-style
│   │   │       │   ├── chat_input_field.dart
│   │   │       │   ├── typing_indicator.dart
│   │   │       │   ├── source_card.dart
│   │   │       │   └── empty_state.dart
│   │   │       └── providers/
│   │   │           ├── chat_provider.dart
│   │   │           └── messages_provider.dart
│   │   │
│   │   ├── profile/                # User profile
│   │   │   ├── data/
│   │   │   ├── domain/
│   │   │   └── presentation/
│   │   │       ├── pages/
│   │   │       │   ├── profile_page.dart
│   │   │       │   ├── edit_profile_page.dart
│   │   │       │   └── settings_page.dart
│   │   │       └── widgets/
│   │   │
│   │   └── subscription/           # Package management
│   │       ├── data/
│   │       ├── domain/
│   │       └── presentation/
│   │           ├── pages/
│   │           │   ├── packages_page.dart
│   │           │   └── subscription_detail_page.dart
│   │           └── widgets/
│   │               └── package_card.dart
│   │
│   ├── shared/                      # Shared widgets & utilities
│   │   ├── widgets/
│   │   │   ├── custom_app_bar.dart
│   │   │   ├── loading_indicator.dart
│   │   │   ├── error_widget.dart
│   │   │   ├── custom_button.dart
│   │   │   └── custom_text_field.dart
│   │   ├── constants/
│   │   │   ├── api_endpoints.dart
│   │   │   └── app_strings.dart
│   │   └── extensions/
│   │       ├── context_extension.dart
│   │       └── string_extension.dart
│   │
│   └── routes/
│       ├── app_router.dart          # Go Router
│       └── route_names.dart
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
│       └── SF-Pro-Display/          # iOS system font
│
├── test/
│   ├── unit/
│   ├── widget/
│   └── integration/
│
├── pubspec.yaml                     # Dependencies
├── analysis_options.yaml            # Linting rules
└── README.md
```

---

## 📦 Dependencies (pubspec.yaml)

```yaml
name: epr_legal_mobile
description: EPR Legal SaaS Mobile App
publish_to: 'none'

version: 1.0.0+1

environment:
  sdk: '>=3.2.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter

  # State Management
  flutter_riverpod: ^2.4.9
  riverpod_annotation: ^2.3.3

  # Navigation
  go_router: ^13.0.0

  # Network
  dio: ^5.4.0
  retrofit: ^4.0.3
  pretty_dio_logger: ^1.3.1

  # Local Storage
  flutter_secure_storage: ^9.0.0
  shared_preferences: ^2.2.2
  hive: ^2.2.3
  hive_flutter: ^1.1.0

  # UI
  cupertino_icons: ^1.0.6
  flutter_screenutil: ^5.9.0  # Responsive
  cached_network_image: ^3.3.0
  shimmer: ^3.0.0
  lottie: ^2.7.0

  # Utils
  intl: ^0.18.1
  uuid: ^4.2.1
  equatable: ^2.0.5
  dartz: ^0.10.1  # Functional programming

  # Firebase (optional)
  # firebase_core: ^2.24.2
  # firebase_messaging: ^14.7.10
  # firebase_analytics: ^10.8.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

  # Code generation
  build_runner: ^2.4.7
  retrofit_generator: ^8.0.4
  riverpod_generator: ^2.3.9
  hive_generator: ^2.0.1

flutter:
  uses-material-design: true

  assets:
    - assets/images/
    - assets/icons/
    - assets/animations/

  fonts:
    - family: SF Pro Display
      fonts:
        - asset: assets/fonts/SF-Pro-Display-Regular.otf
        - asset: assets/fonts/SF-Pro-Display-Bold.otf
          weight: 700
```

---

## 🎨 iOS-First Theme

```dart
// lib/core/theme/app_theme.dart

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

class AppTheme {
  // iOS-style colors
  static const primaryColor = CupertinoColors.systemBlue;
  static const backgroundColor = CupertinoColors.systemBackground;

  // Material Theme (for Android compatibility)
  static ThemeData materialTheme = ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: primaryColor,
      brightness: Brightness.light,
    ),
    fontFamily: 'SF Pro Display',
  );

  // Cupertino Theme (iOS)
  static CupertinoThemeData cupertinoTheme = CupertinoThemeData(
    primaryColor: primaryColor,
    barBackgroundColor: backgroundColor,
    scaffoldBackgroundColor: backgroundColor,
    textTheme: CupertinoTextThemeData(
      textStyle: TextStyle(
        fontFamily: 'SF Pro Display',
        fontSize: 17,
      ),
    ),
  );
}
```

---

## 🔐 API Client Setup

```dart
// lib/core/network/api_client.dart

import 'package:dio/dio.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';
import 'interceptors/auth_interceptor.dart';

class ApiClient {
  static const String baseUrl = 'https://api.yourdomain.com/v1';

  late final Dio dio;

  ApiClient() {
    dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: Duration(seconds: 30),
        receiveTimeout: Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Add interceptors
    dio.interceptors.addAll([
      AuthInterceptor(),      // Add JWT token
      LoggingInterceptor(),   // Log requests/responses
      ErrorInterceptor(),     // Handle errors
      PrettyDioLogger(       // Pretty print logs (dev only)
        requestHeader: true,
        requestBody: true,
        responseHeader: true,
      ),
    ]);
  }

  // GET request
  Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async {
    try {
      final response = await dio.get(
        path,
        queryParameters: queryParameters,
      );
      return response;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // POST request
  Future<Response> post(
    String path, {
    dynamic data,
  }) async {
    try {
      final response = await dio.post(path, data: data);
      return response;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  ApiException _handleError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return ApiException('Connection timeout');

      case DioExceptionType.badResponse:
        if (error.response?.statusCode == 401) {
          return ApiException('Unauthorized', code: 'UNAUTHORIZED');
        } else if (error.response?.statusCode == 429) {
          return ApiException('Quota exceeded', code: 'QUOTA_EXCEEDED');
        }
        return ApiException(
          error.response?.data['error']?['message'] ?? 'Unknown error',
        );

      default:
        return ApiException('Network error');
    }
  }
}

class ApiException implements Exception {
  final String message;
  final String? code;

  ApiException(this.message, {this.code});

  @override
  String toString() => message;
}
```

---

## 💬 Chat Page Example (iOS-style)

```dart
// lib/features/chat/presentation/pages/chat_page.dart

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ChatPage extends ConsumerStatefulWidget {
  const ChatPage({super.key});

  @override
  ConsumerState<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends ConsumerState<ChatPage> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  @override
  Widget build(BuildContext context) {
    final messagesAsyncValue = ref.watch(messagesProvider);

    return CupertinoPageScaffold(
      navigationBar: CupertinoNavigationBar(
        middle: Text('EPR Legal Assistant'),
        trailing: CupertinoButton(
          padding: EdgeInsets.zero,
          child: Icon(CupertinoIcons.ellipsis),
          onPressed: () {
            // Show options
          },
        ),
      ),
      child: SafeArea(
        child: Column(
          children: [
            // Messages list
            Expanded(
              child: messagesAsyncValue.when(
                data: (messages) => ListView.builder(
                  controller: _scrollController,
                  reverse: true,
                  padding: EdgeInsets.all(16),
                  itemCount: messages.length,
                  itemBuilder: (context, index) {
                    final message = messages[index];
                    return MessageBubble(
                      message: message,
                      isUser: message.role == 'user',
                    );
                  },
                ),
                loading: () => Center(
                  child: CupertinoActivityIndicator(),
                ),
                error: (error, stack) => Center(
                  child: Text('Error: $error'),
                ),
              ),
            ),

            // Input field
            Container(
              decoration: BoxDecoration(
                color: CupertinoColors.systemBackground,
                border: Border(
                  top: BorderSide(
                    color: CupertinoColors.separator,
                    width: 0.5,
                  ),
                ),
              ),
              child: Padding(
                padding: EdgeInsets.all(8),
                child: Row(
                  children: [
                    Expanded(
                      child: CupertinoTextField(
                        controller: _messageController,
                        placeholder: 'Ask a question...',
                        maxLines: null,
                        textInputAction: TextInputAction.send,
                        onSubmitted: (_) => _sendMessage(),
                      ),
                    ),
                    SizedBox(width: 8),
                    CupertinoButton(
                      padding: EdgeInsets.zero,
                      child: Icon(
                        CupertinoIcons.arrow_up_circle_fill,
                        size: 32,
                        color: CupertinoColors.activeBlue,
                      ),
                      onPressed: _sendMessage,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _sendMessage() {
    final message = _messageController.text.trim();
    if (message.isEmpty) return;

    ref.read(chatProvider.notifier).sendMessage(message);
    _messageController.clear();

    // Scroll to bottom
    _scrollController.animateTo(
      0,
      duration: Duration(milliseconds: 300),
      curve: Curves.easeOut,
    );
  }
}
```

---

## 🚀 Getting Started

```bash
# 1. Create Flutter project
flutter create epr_legal_mobile
cd epr_legal_mobile

# 2. Copy structure above
# (or use Mason templates for scaffolding)

# 3. Install dependencies
flutter pub get

# 4. Generate code
flutter pub run build_runner build --delete-conflicting-outputs

# 5. Run on iOS
flutter run -d ios

# 6. Build for release
flutter build ipa --release
```

---

**Key Points:**
- ✅ **Clean Architecture** - Separation of concerns
- ✅ **iOS-first UI** - Cupertino widgets + SF Pro font
- ✅ **Riverpod** - Modern state management
- ✅ **Dio + Retrofit** - Type-safe API calls
- ✅ **Secure Storage** - JWT tokens encrypted
- ✅ **Offline Support** - Hive local database

Bạn đã có **complete base structure**! 🎉

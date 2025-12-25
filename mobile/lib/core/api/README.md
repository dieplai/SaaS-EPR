# Mobile API Client - Usage Guide

## 🚀 Quick Start

### 1. Add dependencies to `pubspec.yaml`

```yaml
dependencies:
  dio: ^5.4.0
  flutter_secure_storage: ^9.0.0
```

### 2. Import and use

```dart
import 'package:your_app/core/api/api_client.dart';
import 'package:your_app/core/config/api_config.dart';

// Create client
final apiClient = ApiClient();

// Login
try {
  final result = await apiClient.login(
    'user@example.com',
    'password123',
  );

  print('Logged in: ${result['user']['email']}');
} catch (e) {
  print('Login failed: $e');
}
```

## 🌍 Environments

The API client supports 3 environments:

### Local Development
```dart
// In api_config.dart
static const Environment currentEnvironment = Environment.local;

// Connects to:
// - Android Emulator: http://10.0.2.2:8001
// - iOS Simulator: http://localhost:8001
```

### Staging
```dart
static const Environment currentEnvironment = Environment.staging;

// Connects to: https://staging.epr.dieplai.io.vn
```

### Production
```dart
static const Environment currentEnvironment = Environment.production;

// Connects to: https://epr.dieplai.io.vn
```

## 📖 API Methods

### Authentication

```dart
// Login
final result = await apiClient.login('email@example.com', 'password');

// Register
final user = await apiClient.register(
  email: 'new@example.com',
  password: 'securepass123',
  fullName: 'John Doe',
);

// Check if logged in
final isLoggedIn = await apiClient.isLoggedIn();

// Logout
await apiClient.logout();
```

### Generic HTTP Methods

```dart
// GET request
final response = await apiClient.get('/packages');

// POST request
final response = await apiClient.post(
  '/subscriptions',
  data: {'package_id': '123'},
);

// PUT request
final response = await apiClient.put(
  '/profile',
  data: {'full_name': 'Jane Doe'},
);

// DELETE request
final response = await apiClient.delete('/account');
```

### Health Check

```dart
final isHealthy = await apiClient.healthCheck();
if (isHealthy) {
  print('✅ API is reachable');
} else {
  print('❌ API is down');
}
```

## 🔐 Authentication Flow

The client handles authentication automatically:

1. **Login** → Tokens stored securely
2. **Requests** → Auto-attach Bearer token
3. **401 Error** → Auto-refresh token
4. **Refresh fails** → Auto-logout

```dart
// After login, all requests automatically include auth header
await apiClient.login('user@example.com', 'pass');

// This request will have Authorization: Bearer <token>
final profile = await apiClient.get('/profile');
```

## 🛠️ Advanced Usage

### Custom Environment

```dart
// Override default environment
final prodClient = ApiClient(environment: Environment.production);
final stagingClient = ApiClient(environment: Environment.staging);
```

### Error Handling

```dart
try {
  await apiClient.post('/subscriptions', data: {...});
} on DioException catch (e) {
  if (e.response?.statusCode == 400) {
    print('Bad request: ${e.message}');
  } else if (e.response?.statusCode == 401) {
    print('Unauthorized - please login');
  } else if (e.type == DioExceptionType.connectionTimeout) {
    print('Connection timeout');
  } else {
    print('Error: ${e.message}');
  }
}
```

### Manual Token Management

```dart
// Get current token
final token = await apiClient.getAccessToken();

// Logout (clears tokens)
await apiClient.logout();
```

## 📱 Testing with Production API

To test your local mobile app with production API:

1. **Set environment to staging:**
```dart
// In api_config.dart
static const Environment currentEnvironment = Environment.staging;
```

2. **Run app:**
```bash
flutter run
```

3. **App will connect to:**
   - API: https://staging.epr.dieplai.io.vn/api/v1
   - Chatbot: https://staging.epr.dieplai.io.vn/chat/api/v1

### Switching to Production

```dart
// In api_config.dart
static const Environment currentEnvironment = Environment.production;
```

**⚠️ Warning:** Only use production for final testing!

## 🔧 Configuration

All config is in `lib/core/config/api_config.dart`:

```dart
class ApiConfig {
  // Change this to switch environments
  static const Environment currentEnvironment = Environment.staging;

  // Timeouts
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);

  // Environment checks
  static bool get isProduction => currentEnvironment == Environment.production;
  static bool get isLocal => currentEnvironment == Environment.local;
}
```

## 🐛 Troubleshooting

### Can't connect to local backend

**Android Emulator:**
- Use `10.0.2.2` instead of `localhost`
- Ensure backend is running on host machine

**iOS Simulator:**
- Use `localhost` or `127.0.0.1`
- Check firewall settings

### SSL Certificate errors (Production)

Production uses Let's Encrypt certificates which are automatically trusted by mobile OS.

If you see certificate errors:
- Check device date/time is correct
- Ensure using HTTPS (not HTTP)

### CORS errors

CORS is handled by backend, not mobile app. If you see CORS errors:
- Contact backend team
- Verify `CORS_ALLOWED_ORIGINS` env var includes mobile origins

### 401 Unauthorized loop

If you're stuck in login loop:
```dart
// Clear tokens and try again
await apiClient.logout();
await apiClient.login(email, password);
```

## 📚 Examples

See `mobile/lib/features/auth/` for complete authentication example.

See `mobile/lib/features/chat/` for chatbot integration example.

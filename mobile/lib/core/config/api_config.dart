/// API Configuration for different environments
/// Supports local, staging, and production environments
library;

enum Environment {
  /// Local development - connects to localhost backend
  local,

  /// Staging environment - connects to staging.epr.dieplai.io.vn
  staging,

  /// Production environment - connects to epr.dieplai.io.vn
  production,
}

class ApiConfig {
  /// Current environment (change this to switch environments)
  static const Environment currentEnvironment = Environment.staging;

  /// Base URLs for different environments
  static const Map<Environment, String> _baseUrls = {
    // Android Emulator uses 10.0.2.2 for localhost
    // iOS Simulator uses localhost
    Environment.local: 'http://10.0.2.2:8001',
    Environment.staging: 'https://staging.epr.dieplai.io.vn',
    Environment.production: 'https://epr.dieplai.io.vn',
  };

  /// Chatbot URLs for different environments
  static const Map<Environment, String> _chatbotUrls = {
    Environment.local: 'http://10.0.2.2:8000',
    Environment.staging: 'https://staging.epr.dieplai.io.vn',
    Environment.production: 'https://epr.dieplai.io.vn',
  };

  /// Get base API URL for current environment
  static String get baseUrl => _baseUrls[currentEnvironment]!;

  /// Get chatbot API URL for current environment
  static String get chatbotUrl => _chatbotUrls[currentEnvironment]!;

  /// API endpoints
  static const String apiVersion = '/api/v1';

  /// Full API path
  static String get apiPath => '$baseUrl$apiVersion';

  /// Chatbot API path
  static String get chatbotPath => '$chatbotUrl/chat/api/v1';

  /// WebSocket path for chatbot streaming
  static String get chatbotWsPath =>
      '${chatbotUrl.replaceFirst('https', 'wss').replaceFirst('http', 'ws')}/chat/ws';

  /// Connection timeout (30 seconds)
  static const Duration connectTimeout = Duration(seconds: 30);

  /// Receive timeout (30 seconds for regular API, 120 for chatbot)
  static const Duration receiveTimeout = Duration(seconds: 30);

  /// Chatbot receive timeout (longer for AI processing)
  static const Duration chatbotReceiveTimeout = Duration(seconds: 120);

  /// Check if using production environment
  static bool get isProduction => currentEnvironment == Environment.production;

  /// Check if using local development
  static bool get isLocal => currentEnvironment == Environment.local;

  /// Check if using staging
  static bool get isStaging => currentEnvironment == Environment.staging;

  /// Get environment name as string
  static String get environmentName => currentEnvironment.name;
}

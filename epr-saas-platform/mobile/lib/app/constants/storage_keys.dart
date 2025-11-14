/// Storage keys for local and secure storage
class StorageKeys {
  // Private constructor
  StorageKeys._();

  // ==================== SECURE STORAGE (JWT, sensitive data) ====================
  /// Access token
  static const String accessToken = 'access_token';

  /// Refresh token
  static const String refreshToken = 'refresh_token';

  /// User ID
  static const String userId = 'user_id';

  /// User email
  static const String userEmail = 'user_email';

  // ==================== SHARED PREFERENCES (non-sensitive data) ====================
  /// Is first launch
  static const String isFirstLaunch = 'is_first_launch';

  /// Is logged in
  static const String isLoggedIn = 'is_logged_in';

  /// User name
  static const String userName = 'user_name';

  /// User avatar URL
  static const String userAvatar = 'user_avatar';

  /// User phone number
  static const String userPhone = 'user_phone';

  /// Current subscription package ID
  static const String currentPackageId = 'current_package_id';

  /// Current subscription package name
  static const String currentPackageName = 'current_package_name';

  /// Subscription expiry date
  static const String subscriptionExpiryDate = 'subscription_expiry_date';

  /// Quota remaining
  static const String quotaRemaining = 'quota_remaining';

  /// Quota total
  static const String quotaTotal = 'quota_total';

  // ==================== SETTINGS ====================
  /// Theme mode (light/dark)
  static const String themeMode = 'theme_mode';

  /// Language code
  static const String languageCode = 'language_code';

  /// Notifications enabled
  static const String notificationsEnabled = 'notifications_enabled';

  /// Biometric auth enabled
  static const String biometricAuthEnabled = 'biometric_auth_enabled';

  // ==================== ONBOARDING ====================
  /// Onboarding completed
  static const String onboardingCompleted = 'onboarding_completed';

  /// Splash screen shown
  static const String splashScreenShown = 'splash_screen_shown';

  // ==================== CHAT ====================
  /// Active conversation ID
  static const String activeConversationId = 'active_conversation_id';

  /// Suggested prompts shown
  static const String suggestedPromptsShown = 'suggested_prompts_shown';

  /// Voice input enabled
  static const String voiceInputEnabled = 'voice_input_enabled';

  // ==================== CACHE ====================
  /// Last sync timestamp
  static const String lastSyncTimestamp = 'last_sync_timestamp';

  /// Cached conversations
  static const String cachedConversations = 'cached_conversations';

  /// Cached packages
  static const String cachedPackages = 'cached_packages';

  // ==================== ANALYTICS ====================
  /// Device ID (for analytics)
  static const String deviceId = 'device_id';

  /// App version
  static const String appVersion = 'app_version';

  /// Build number
  static const String buildNumber = 'build_number';

  /// Last app open timestamp
  static const String lastAppOpenTimestamp = 'last_app_open_timestamp';
}

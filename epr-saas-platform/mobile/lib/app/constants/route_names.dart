/// Route names for navigation
class RouteNames {
  // Private constructor
  RouteNames._();

  // ==================== AUTH ROUTES ====================
  /// Splash screen
  static const String splash = '/';

  /// Onboarding screen
  static const String onboarding = '/onboarding';

  /// Login screen
  static const String login = '/login';

  /// Register screen
  static const String register = '/register';

  /// Forgot password screen
  static const String forgotPassword = '/forgot-password';

  /// OTP verification screen
  static const String verifyOtp = '/verify-otp';

  /// Reset password screen
  static const String resetPassword = '/reset-password';

  // ==================== MAIN TABS ====================
  /// Main screen (with bottom tabs)
  static const String main = '/main';

  /// Home tab (index 0)
  static const String home = '/main/home';

  /// Chat tab (index 1)
  static const String chat = '/main/chat';

  /// Subscription tab (index 2)
  static const String subscription = '/main/subscription';

  /// Profile tab (index 3)
  static const String profile = '/main/profile';

  // ==================== CHAT ROUTES ====================
  /// Chat conversation screen
  static const String chatConversation = '/chat/:conversationId';

  /// New chat screen
  static const String newChat = '/chat/new';

  /// Chat history/list
  static const String chatList = '/chat/list';

  /// Citation detail screen
  static const String citationDetail = '/chat/citation/:citationId';

  /// Legal document viewer
  static const String documentViewer = '/chat/document/:documentId';

  // ==================== SUBSCRIPTION ROUTES ====================
  /// Package detail screen
  static const String packageDetail = '/subscription/:packageId';

  /// Payment screen
  static const String payment = '/subscription/payment';

  /// Payment success screen
  static const String paymentSuccess = '/subscription/payment/success';

  /// Payment failed screen
  static const String paymentFailed = '/subscription/payment/failed';

  /// Subscription history
  static const String subscriptionHistory = '/subscription/history';

  // ==================== PROFILE ROUTES ====================
  /// Edit profile screen
  static const String editProfile = '/profile/edit';

  /// Change password screen
  static const String changePassword = '/profile/change-password';

  /// Notification settings
  static const String notificationSettings = '/profile/notifications';

  /// Language settings
  static const String languageSettings = '/profile/language';

  /// Payment methods
  static const String paymentMethods = '/profile/payment-methods';

  /// Transaction history
  static const String transactionHistory = '/profile/transactions';

  /// Help center
  static const String helpCenter = '/profile/help';

  /// Contact support
  static const String contactSupport = '/profile/contact';

  /// Terms of service
  static const String termsOfService = '/profile/terms';

  /// Privacy policy
  static const String privacyPolicy = '/profile/privacy';

  /// About app
  static const String about = '/profile/about';

  // ==================== OTHER ROUTES ====================
  /// Search screen
  static const String search = '/search';

  /// Notifications screen
  static const String notifications = '/notifications';

  /// Settings screen
  static const String settings = '/settings';

  // ==================== HELPER METHODS ====================
  /// Get chat conversation route with ID
  static String getChatConversationRoute(String conversationId) {
    return chatConversation.replaceAll(':conversationId', conversationId);
  }

  /// Get citation detail route with ID
  static String getCitationDetailRoute(String citationId) {
    return citationDetail.replaceAll(':citationId', citationId);
  }

  /// Get document viewer route with ID
  static String getDocumentViewerRoute(String documentId) {
    return documentViewer.replaceAll(':documentId', documentId);
  }

  /// Get package detail route with ID
  static String getPackageDetailRoute(String packageId) {
    return packageDetail.replaceAll(':packageId', packageId);
  }
}

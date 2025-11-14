import 'dart:io';

/// API endpoints and configuration
class ApiConstants {
  // Private constructor
  ApiConstants._();

  // ==================== BASE URLS ====================
  /// Get the correct host - use localhost for desktop, 10.0.2.2 for Android emulator
  static String get _baseHost {
    if (Platform.isAndroid) {
      return '10.0.2.2';
    }
    return 'localhost';
  }

  /// User service base URL
  static String get userServiceUrl =>
      String.fromEnvironment('USER_SERVICE_URL', defaultValue: 'http://$_baseHost:8001/api/v1');

  /// Package service base URL
  static String get packageServiceUrl =>
      String.fromEnvironment('PACKAGE_SERVICE_URL', defaultValue: 'http://$_baseHost:8002/api/v1');

  /// AI Chatbot service base URL
  static String get chatbotServiceUrl =>
      String.fromEnvironment('AI_CHATBOT_URL', defaultValue: 'http://$_baseHost:8004/api/v1');

  // ==================== AUTH ENDPOINTS ====================
  /// Login endpoint
  static const String login = '/auth/login';

  /// Register endpoint
  static const String register = '/auth/register';

  /// Logout endpoint
  static const String logout = '/auth/logout';

  /// Refresh token endpoint
  static const String refreshToken = '/auth/refresh';

  /// Forgot password endpoint
  static const String forgotPassword = '/auth/forgot-password';

  /// Reset password endpoint
  static const String resetPassword = '/auth/reset-password';

  /// Verify OTP endpoint
  static const String verifyOtp = '/auth/verify-otp';

  // ==================== USER ENDPOINTS ====================
  /// Get user profile
  static const String getUserProfile = '/users/me';

  /// Update user profile
  static const String updateUserProfile = '/users/me';

  /// Upload avatar
  static const String uploadAvatar = '/users/me/avatar';

  /// Change password
  static const String changePassword = '/users/me/password';

  // ==================== CHATBOT ENDPOINTS ====================

  // Conversations (Backend may not support all endpoints)
  /// Create conversation - NOT IMPLEMENTED IN BACKEND
  static const String createConversation = '/conversations';

  /// Get conversations list - NOT IMPLEMENTED IN BACKEND
  static const String getConversations = '/conversations';

  /// Get conversation by ID - NOT IMPLEMENTED IN BACKEND
  static const String getConversationById = '/conversations';

  /// Update conversation - NOT IMPLEMENTED IN BACKEND
  static const String updateConversation = '/conversations';

  /// Delete conversation - NOT IMPLEMENTED IN BACKEND
  static const String deleteConversation = '/conversations';

  /// Search conversations - NOT IMPLEMENTED IN BACKEND
  static const String searchConversations = '/conversations/search';

  /// Get conversation statistics - NOT IMPLEMENTED IN BACKEND
  static const String getConversationStats = '/conversations/stats';

  // Messages
  /// Send query/message
  static const String sendQuery = '/query';

  /// Stream chat response (Server-Sent Events)
  static const String streamChat = '/stream';

  /// Get chat history
  static const String getChatHistory = '/conversations';

  /// Get message by ID
  static const String getMessage = '/messages';

  /// Delete message
  static const String deleteMessage = '/messages';

  /// Regenerate AI response
  static const String regenerateResponse = '/messages';

  // Citations
  /// Get citations for a message
  static const String getCitations = '/messages';

  /// Get citation by ID
  static const String getCitation = '/citations';

  // ==================== PACKAGE/SUBSCRIPTION ENDPOINTS ====================
  /// Get all packages
  static const String getPackages = '/packages';

  /// Get package by ID
  static String getPackageById(String id) => '/packages/$id';

  /// Get user subscription
  static const String getUserSubscription = '/subscriptions/me';

  /// Subscribe to package
  static const String subscribe = '/subscriptions';

  /// Cancel subscription
  static String cancelSubscription(String id) => '/subscriptions/$id/cancel';

  /// Get subscription usage/quota
  static const String getSubscriptionUsage = '/subscriptions/me/usage';

  /// Payment webhook
  static const String paymentWebhook = '/webhooks/payment';

  // ==================== LEGAL DOCUMENTS ENDPOINTS ====================
  /// Search legal documents
  static const String searchDocuments = '/legal/search';

  /// Get document by ID
  static String getDocumentById(String id) => '/legal/documents/$id';

  /// Get document articles
  static String getDocumentArticles(String docId) => '/legal/documents/$docId/articles';

  /// Get specific article
  static String getArticle(String docId, String articleId) =>
      '/legal/documents/$docId/articles/$articleId';

  // ==================== NOTIFICATION ENDPOINTS ====================
  /// Get notifications
  static const String getNotifications = '/notifications';

  /// Mark notification as read
  static String markNotificationRead(String id) => '/notifications/$id/read';

  /// Mark all as read
  static const String markAllNotificationsRead = '/notifications/read-all';

  /// Delete notification
  static String deleteNotification(String id) => '/notifications/$id';

  // ==================== ANALYTICS ENDPOINTS ====================
  /// Track event
  static const String trackEvent = '/analytics/events';

  /// Get dashboard stats
  static const String getDashboardStats = '/analytics/dashboard';

  // ==================== HTTP HEADERS ====================
  static const String headerContentType = 'Content-Type';
  static const String headerAuthorization = 'Authorization';
  static const String headerAccept = 'Accept';
  static const String headerAcceptLanguage = 'Accept-Language';

  // ==================== CONTENT TYPES ====================
  static const String contentTypeJson = 'application/json';
  static const String contentTypeFormData = 'multipart/form-data';

  // ==================== TIMEOUT DURATIONS ====================
  /// Connection timeout (30 seconds)
  static const Duration connectTimeout = Duration(seconds: 30);

  /// Receive timeout (60 seconds for normal requests)
  static const Duration receiveTimeout = Duration(seconds: 60);

  /// Receive timeout for streaming (5 minutes)
  static const Duration streamReceiveTimeout = Duration(minutes: 5);

  /// Send timeout (30 seconds)
  static const Duration sendTimeout = Duration(seconds: 30);

  // ==================== PAGINATION ====================
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;

  // ==================== API VERSIONS ====================
  static const String apiVersion = 'v1';
}

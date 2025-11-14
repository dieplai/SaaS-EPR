/// Base exception class (Data layer)
/// All exceptions extend this
class AppException implements Exception {
  final String message;
  final String? code;

  AppException(this.message, [this.code]);

  @override
  String toString() => message;
}

// ==================== SERVER EXCEPTIONS ====================

/// Server exception (5xx errors)
class ServerException extends AppException {
  ServerException([String message = 'Server error']) : super(message);
}

/// Authentication exception (401)
class AuthenticationException extends AppException {
  AuthenticationException([String message = 'Authentication failed'])
      : super(message);
}

/// Authorization exception (403)
class AuthorizationException extends AppException {
  AuthorizationException([String message = 'Authorization failed'])
      : super(message);
}

/// Not found exception (404)
class NotFoundException extends AppException {
  NotFoundException([String message = 'Resource not found']) : super(message);
}

/// Bad request exception (400)
class BadRequestException extends AppException {
  BadRequestException([String message = 'Bad request']) : super(message);
}

/// Conflict exception (409)
class ConflictException extends AppException {
  ConflictException([String message = 'Resource conflict']) : super(message);
}

/// Validation exception (422)
class ValidationException extends AppException {
  final Map<String, dynamic>? errors;

  ValidationException(String message, [this.errors]) : super(message);
}

// ==================== NETWORK EXCEPTIONS ====================

/// Network exception (no internet)
class NetworkException extends AppException {
  NetworkException([String message = 'No internet connection'])
      : super(message);
}

/// Timeout exception
class TimeoutException extends AppException {
  TimeoutException([String message = 'Request timeout']) : super(message);
}

// ==================== DATA EXCEPTIONS ====================

/// Cache exception (local storage error)
class CacheException extends AppException {
  CacheException([String message = 'Cache error']) : super(message);
}

/// Parse exception (JSON parsing error)
class ParseException extends AppException {
  ParseException([String message = 'Parse error']) : super(message);
}

// ==================== PERMISSION EXCEPTIONS ====================

/// Permission denied exception
class PermissionDeniedException extends AppException {
  PermissionDeniedException([String message = 'Permission denied'])
      : super(message);
}

// ==================== QUOTA EXCEPTIONS ====================

/// Quota exceeded exception
class QuotaExceededException extends AppException {
  QuotaExceededException([String message = 'Quota exceeded']) : super(message);
}

// ==================== SUBSCRIPTION EXCEPTIONS ====================

/// Subscription expired exception
class SubscriptionExpiredException extends AppException {
  SubscriptionExpiredException([String message = 'Subscription expired'])
      : super(message);
}

/// Payment failed exception
class PaymentFailedException extends AppException {
  PaymentFailedException([String message = 'Payment failed']) : super(message);
}

// ==================== REQUEST EXCEPTIONS ====================

/// Rate limit exception (429)
class RateLimitException extends AppException {
  RateLimitException([String message = 'Rate limit exceeded']) : super(message);
}

/// Cancelled exception (request cancelled by user)
class CancelledException extends AppException {
  CancelledException([String message = 'Request cancelled']) : super(message);
}

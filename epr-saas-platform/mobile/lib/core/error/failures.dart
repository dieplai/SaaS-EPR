import 'package:equatable/equatable.dart';

/// Base failure class (Domain layer)
/// All failures extend this
abstract class Failure extends Equatable {
  final String message;
  final String? code;

  const Failure(this.message, [this.code]);

  @override
  List<Object?> get props => [message, code];
}

// ==================== SERVER FAILURES ====================

/// Server failure (5xx errors)
class ServerFailure extends Failure {
  const ServerFailure([String message = 'Lỗi máy chủ. Vui lòng thử lại sau.'])
      : super(message);
}

/// Authentication failure (401)
class AuthenticationFailure extends Failure {
  const AuthenticationFailure(
      [String message = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'])
      : super(message);
}

/// Authorization failure (403)
class AuthorizationFailure extends Failure {
  const AuthorizationFailure(
      [String message = 'Bạn không có quyền truy cập.'])
      : super(message);
}

/// Not found failure (404)
class NotFoundFailure extends Failure {
  const NotFoundFailure([String message = 'Không tìm thấy dữ liệu.'])
      : super(message);
}

/// Bad request failure (400)
class BadRequestFailure extends Failure {
  const BadRequestFailure([String message = 'Yêu cầu không hợp lệ.'])
      : super(message);
}

/// Conflict failure (409)
class ConflictFailure extends Failure {
  const ConflictFailure([String message = 'Dữ liệu đã tồn tại.'])
      : super(message);
}

/// Validation failure (422)
class ValidationFailure extends Failure {
  final Map<String, dynamic>? errors;

  const ValidationFailure(
    String message, [
    this.errors,
  ]) : super(message);

  @override
  List<Object?> get props => [message, errors];
}

// ==================== NETWORK FAILURES ====================

/// Network failure (no internet connection)
class NetworkFailure extends Failure {
  const NetworkFailure([String message = 'Không có kết nối internet.'])
      : super(message);
}

/// Timeout failure
class TimeoutFailure extends Failure {
  const TimeoutFailure([String message = 'Yêu cầu hết thời gian chờ.'])
      : super(message);
}

// ==================== DATA FAILURES ====================

/// Cache failure (local storage error)
class CacheFailure extends Failure {
  const CacheFailure([String message = 'Lỗi lưu trữ dữ liệu cục bộ.'])
      : super(message);
}

/// Parse failure (JSON parsing error)
class ParseFailure extends Failure {
  const ParseFailure([String message = 'Lỗi xử lý dữ liệu.']) : super(message);
}

// ==================== PERMISSION FAILURES ====================

/// Permission denied failure
class PermissionDeniedFailure extends Failure {
  const PermissionDeniedFailure(
      [String message = 'Không có quyền truy cập tính năng này.'])
      : super(message);
}

// ==================== QUOTA FAILURES ====================

/// Quota exceeded failure
class QuotaExceededFailure extends Failure {
  const QuotaExceededFailure(
      [String message = 'Bạn đã hết quota sử dụng. Vui lòng nâng cấp gói.'])
      : super(message);
}

/// Rate limit exceeded failure (429)
class RateLimitFailure extends Failure {
  const RateLimitFailure(
      [String message = 'Bạn đang gửi yêu cầu quá nhanh. Vui lòng chờ một chút.'])
      : super(message);
}

// ==================== SUBSCRIPTION FAILURES ====================

/// Subscription expired failure
class SubscriptionExpiredFailure extends Failure {
  const SubscriptionExpiredFailure(
      [String message = 'Gói dịch vụ đã hết hạn. Vui lòng gia hạn.'])
      : super(message);
}

/// Payment failed failure
class PaymentFailedFailure extends Failure {
  const PaymentFailedFailure([String message = 'Thanh toán thất bại.'])
      : super(message);
}

// ==================== GENERIC FAILURE ====================

/// Generic failure for unknown errors
class GenericFailure extends Failure {
  const GenericFailure([String message = 'Đã xảy ra lỗi. Vui lòng thử lại.'])
      : super(message);
}

// ==================== HELPER FUNCTIONS ====================

/// Map error code to failure
Failure mapErrorCodeToFailure(int statusCode, String message) {
  switch (statusCode) {
    case 400:
      return BadRequestFailure(message);
    case 401:
      return AuthenticationFailure(message);
    case 403:
      return AuthorizationFailure(message);
    case 404:
      return NotFoundFailure(message);
    case 409:
      return ConflictFailure(message);
    case 422:
      return ValidationFailure(message);
    case 429:
      return QuotaExceededFailure(message);
    case >= 500:
      return ServerFailure(message);
    default:
      return GenericFailure(message);
  }
}

import '../../app/constants/app_constants.dart';

/// Form validation utilities
class Validators {
  // Private constructor
  Validators._();

  // ==================== EMAIL VALIDATION ====================

  /// Validate email
  static String? validateEmail(String? value) {
    if (value == null || value.isEmpty) {
      return 'Email không được để trống';
    }

    final emailRegex = RegExp(AppConstants.emailRegexPattern);
    if (!emailRegex.hasMatch(value)) {
      return AppConstants.errorInvalidEmail;
    }

    return null;
  }

  /// Check if email is valid (returns bool)
  static bool isValidEmail(String email) {
    final emailRegex = RegExp(AppConstants.emailRegexPattern);
    return emailRegex.hasMatch(email);
  }

  // ==================== PASSWORD VALIDATION ====================

  /// Validate password
  static String? validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Mật khẩu không được để trống';
    }

    if (value.length < AppConstants.minPasswordLength) {
      return AppConstants.errorWeakPassword;
    }

    if (value.length > AppConstants.maxPasswordLength) {
      return 'Mật khẩu quá dài';
    }

    return null;
  }

  /// Validate password strength
  static PasswordStrength checkPasswordStrength(String password) {
    if (password.isEmpty) {
      return PasswordStrength.empty;
    }

    if (password.length < AppConstants.minPasswordLength) {
      return PasswordStrength.weak;
    }

    int strength = 0;

    // Has lowercase
    if (password.contains(RegExp(r'[a-z]'))) {
      strength++;
    }

    // Has uppercase
    if (password.contains(RegExp(r'[A-Z]'))) {
      strength++;
    }

    // Has number
    if (password.contains(RegExp(r'[0-9]'))) {
      strength++;
    }

    // Has special character
    if (password.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>]'))) {
      strength++;
    }

    // Length > 12
    if (password.length >= 12) {
      strength++;
    }

    if (strength <= 2) {
      return PasswordStrength.weak;
    } else if (strength == 3) {
      return PasswordStrength.medium;
    } else {
      return PasswordStrength.strong;
    }
  }

  /// Validate password confirmation
  static String? validatePasswordConfirmation(
    String? value,
    String password,
  ) {
    if (value == null || value.isEmpty) {
      return 'Vui lòng xác nhận mật khẩu';
    }

    if (value != password) {
      return 'Mật khẩu xác nhận không khớp';
    }

    return null;
  }

  // ==================== NAME VALIDATION ====================

  /// Validate name
  static String? validateName(String? value) {
    if (value == null || value.isEmpty) {
      return 'Tên không được để trống';
    }

    if (value.trim().length < AppConstants.minNameLength) {
      return 'Tên quá ngắn';
    }

    if (value.trim().length > AppConstants.maxNameLength) {
      return 'Tên quá dài';
    }

    // Check if contains numbers (optional)
    if (value.contains(RegExp(r'[0-9]'))) {
      return 'Tên không được chứa số';
    }

    return null;
  }

  // ==================== PHONE VALIDATION ====================

  /// Validate Vietnamese phone number
  static String? validatePhone(String? value) {
    if (value == null || value.isEmpty) {
      return 'Số điện thoại không được để trống';
    }

    // Remove spaces and dashes
    final cleanedPhone = value.replaceAll(RegExp(r'[\s-]'), '');

    final phoneRegex = RegExp(AppConstants.phoneRegexPattern);
    if (!phoneRegex.hasMatch(cleanedPhone)) {
      return AppConstants.errorInvalidPhone;
    }

    return null;
  }

  /// Check if phone is valid (returns bool)
  static bool isValidPhone(String phone) {
    final cleanedPhone = phone.replaceAll(RegExp(r'[\s-]'), '');
    final phoneRegex = RegExp(AppConstants.phoneRegexPattern);
    return phoneRegex.hasMatch(cleanedPhone);
  }

  // ==================== REQUIRED FIELD VALIDATION ====================

  /// Validate required field
  static String? validateRequired(String? value, [String? fieldName]) {
    if (value == null || value.trim().isEmpty) {
      return '${fieldName ?? 'Trường này'} không được để trống';
    }
    return null;
  }

  // ==================== LENGTH VALIDATION ====================

  /// Validate minimum length
  static String? validateMinLength(
    String? value,
    int minLength, [
    String? fieldName,
  ]) {
    if (value == null || value.isEmpty) {
      return '${fieldName ?? 'Trường này'} không được để trống';
    }

    if (value.length < minLength) {
      return '${fieldName ?? 'Trường này'} phải có ít nhất $minLength ký tự';
    }

    return null;
  }

  /// Validate maximum length
  static String? validateMaxLength(
    String? value,
    int maxLength, [
    String? fieldName,
  ]) {
    if (value != null && value.length > maxLength) {
      return '${fieldName ?? 'Trường này'} không được vượt quá $maxLength ký tự';
    }

    return null;
  }

  /// Validate length range
  static String? validateLengthRange(
    String? value,
    int minLength,
    int maxLength, [
    String? fieldName,
  ]) {
    if (value == null || value.isEmpty) {
      return '${fieldName ?? 'Trường này'} không được để trống';
    }

    if (value.length < minLength || value.length > maxLength) {
      return '${fieldName ?? 'Trường này'} phải có từ $minLength đến $maxLength ký tự';
    }

    return null;
  }

  // ==================== NUMERIC VALIDATION ====================

  /// Validate number
  static String? validateNumber(String? value, [String? fieldName]) {
    if (value == null || value.isEmpty) {
      return '${fieldName ?? 'Trường này'} không được để trống';
    }

    if (int.tryParse(value) == null) {
      return '${fieldName ?? 'Trường này'} phải là số';
    }

    return null;
  }

  /// Validate positive number
  static String? validatePositiveNumber(String? value, [String? fieldName]) {
    if (value == null || value.isEmpty) {
      return '${fieldName ?? 'Trường này'} không được để trống';
    }

    final number = int.tryParse(value);
    if (number == null) {
      return '${fieldName ?? 'Trường này'} phải là số';
    }

    if (number <= 0) {
      return '${fieldName ?? 'Trường này'} phải là số dương';
    }

    return null;
  }

  // ==================== URL VALIDATION ====================

  /// Validate URL
  static String? validateUrl(String? value, [String? fieldName]) {
    if (value == null || value.isEmpty) {
      return '${fieldName ?? 'URL'} không được để trống';
    }

    final urlPattern = RegExp(
      r'^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$',
    );

    if (!urlPattern.hasMatch(value)) {
      return '${fieldName ?? 'URL'} không hợp lệ';
    }

    return null;
  }

  // ==================== COMPOSITE VALIDATORS ====================

  /// Combine multiple validators
  static String? combineValidators(
    String? value,
    List<String? Function(String?)> validators,
  ) {
    for (final validator in validators) {
      final result = validator(value);
      if (result != null) {
        return result;
      }
    }
    return null;
  }
}

// ==================== PASSWORD STRENGTH ENUM ====================
enum PasswordStrength {
  empty,
  weak,
  medium,
  strong,
}

extension PasswordStrengthExtension on PasswordStrength {
  String get label {
    switch (this) {
      case PasswordStrength.empty:
        return '';
      case PasswordStrength.weak:
        return 'Yếu';
      case PasswordStrength.medium:
        return 'Trung bình';
      case PasswordStrength.strong:
        return 'Mạnh';
    }
  }

  double get value {
    switch (this) {
      case PasswordStrength.empty:
        return 0.0;
      case PasswordStrength.weak:
        return 0.33;
      case PasswordStrength.medium:
        return 0.66;
      case PasswordStrength.strong:
        return 1.0;
    }
  }
}

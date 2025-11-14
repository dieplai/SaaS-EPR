import 'package:flutter/foundation.dart';
import '../../../../core/utils/logger.dart';
import '../../domain/entities/user.dart';
import '../../domain/usecases/login_usecase.dart';
import '../../domain/usecases/register_usecase.dart';
import '../../domain/usecases/logout_usecase.dart';
import '../../domain/usecases/get_current_user_usecase.dart';

/// Auth provider (state management using Provider pattern)
/// Manages authentication state and user data
class AuthProvider extends ChangeNotifier {
  final LoginUsecase loginUsecase;
  final RegisterUsecase registerUsecase;
  final LogoutUsecase logoutUsecase;
  final GetCurrentUserUsecase getCurrentUserUsecase;

  final _logger = Logger('AuthProvider');

  // State
  User? _user;
  bool _isLoading = false;
  String? _errorMessage;
  bool _isAuthenticated = false;

  // Getters
  User? get user => _user;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _isAuthenticated;

  AuthProvider({
    required this.loginUsecase,
    required this.registerUsecase,
    required this.logoutUsecase,
    required this.getCurrentUserUsecase,
  });

  /// Login
  Future<bool> login({
    required String email,
    required String password,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      _logger.i('Attempting login for: $email');

      final result = await loginUsecase(
        email: email,
        password: password,
      );

      return result.fold(
        (failure) {
          _setError(failure.message);
          _setLoading(false);
          _logger.e('Login failed: ${failure.message}');
          return false;
        },
        (user) {
          _user = user;
          _isAuthenticated = true;
          _setLoading(false);
          _logger.i('Login successful: ${user.email}');
          notifyListeners();
          return true;
        },
      );
    } catch (e) {
      _setError('Đã xảy ra lỗi không mong đợi');
      _setLoading(false);
      _logger.e('Unexpected error during login', e);
      return false;
    }
  }

  /// Register
  Future<bool> register({
    required String name,
    required String email,
    required String password,
    String? phone,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      _logger.i('Attempting registration for: $email');

      final result = await registerUsecase(
        name: name,
        email: email,
        password: password,
        phone: phone,
      );

      return result.fold(
        (failure) {
          _setError(failure.message);
          _setLoading(false);
          _logger.e('Registration failed: ${failure.message}');
          return false;
        },
        (user) {
          _user = user;
          _isAuthenticated = true;
          _setLoading(false);
          _logger.i('Registration successful: ${user.email}');
          notifyListeners();
          return true;
        },
      );
    } catch (e) {
      _setError('Đã xảy ra lỗi không mong đợi');
      _setLoading(false);
      _logger.e('Unexpected error during registration', e);
      return false;
    }
  }

  /// Logout
  Future<void> logout() async {
    _setLoading(true);

    try {
      _logger.i('Attempting logout');

      await logoutUsecase();

      _user = null;
      _isAuthenticated = false;
      _setLoading(false);
      _logger.i('Logout successful');
      notifyListeners();
    } catch (e) {
      _setLoading(false);
      _logger.e('Error during logout', e);
      // Force logout even on error
      _user = null;
      _isAuthenticated = false;
      notifyListeners();
    }
  }

  /// Get current user
  Future<void> getCurrentUser() async {
    _setLoading(true);

    try {
      _logger.i('Fetching current user');

      final result = await getCurrentUserUsecase();

      result.fold(
        (failure) {
          _setError(failure.message);
          _setLoading(false);
          _logger.e('Failed to get current user: ${failure.message}');
        },
        (user) {
          _user = user;
          _isAuthenticated = true;
          _setLoading(false);
          _logger.i('Got current user: ${user.email}');
          notifyListeners();
        },
      );
    } catch (e) {
      _setLoading(false);
      _logger.e('Unexpected error getting current user', e);
    }
  }

  /// Clear error
  void clearError() {
    _clearError();
  }

  // Private helpers
  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  void _setError(String message) {
    _errorMessage = message;
    notifyListeners();
  }

  void _clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}

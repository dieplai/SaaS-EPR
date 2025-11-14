import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/user.dart';

/// Auth repository interface (domain layer)
/// Abstract contract that data layer must implement
abstract class AuthRepository {
  /// Login with email and password
  /// Returns Either<Failure, User>
  Future<Either<Failure, User>> login({
    required String email,
    required String password,
  });

  /// Register new user
  /// Returns Either<Failure, User>
  Future<Either<Failure, User>> register({
    required String name,
    required String email,
    required String password,
    String? phone,
  });

  /// Logout current user
  /// Returns Either<Failure, void>
  Future<Either<Failure, void>> logout();

  /// Check if user is authenticated
  /// Returns true if access token exists and valid
  Future<bool> isAuthenticated();

  /// Get current user info
  /// Returns Either<Failure, User>
  Future<Either<Failure, User>> getCurrentUser();

  /// Refresh access token
  /// Returns Either<Failure, void>
  Future<Either<Failure, void>> refreshToken();
}

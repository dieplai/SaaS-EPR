import 'package:dartz/dartz.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../../../core/storage/local_storage.dart';
import '../../../../core/utils/logger.dart';
import '../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_datasource.dart';

/// Auth repository implementation (data layer)
/// Implements AuthRepository interface from domain layer
class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDatasource remoteDatasource;
  final SecureStorage secureStorage;
  final LocalStorage localStorage;
  final _logger = Logger('AuthRepositoryImpl');

  AuthRepositoryImpl({
    required this.remoteDatasource,
    required this.secureStorage,
    required this.localStorage,
  });

  @override
  Future<Either<Failure, User>> login({
    required String email,
    required String password,
  }) async {
    try {
      // Call API
      final response = await remoteDatasource.login(
        email: email,
        password: password,
      );

      // Save tokens to secure storage
      await secureStorage.saveTokens(
        response.accessToken,
        response.refreshToken,
      );

      // Save user info to local storage
      await localStorage.setLoggedIn(true);
      await localStorage.setUserName(response.user.name);
      if (response.user.avatar != null) {
        await localStorage.setUserAvatar(response.user.avatar!);
      }

      // Convert model to entity
      final user = response.user.toEntity();

      _logger.i('Login successful for user: ${user.email}');

      return Right(user);
    } on NetworkException catch (e) {
      _logger.e('Network error during login', e);
      return Left(NetworkFailure(e.message));
    } on AuthenticationException catch (e) {
      _logger.e('Authentication error during login', e);
      return Left(AuthenticationFailure(e.message));
    } on ValidationException catch (e) {
      _logger.e('Validation error during login', e);
      return Left(ValidationFailure(e.message, e.errors));
    } on ServerException catch (e) {
      _logger.e('Server error during login', e);
      return Left(ServerFailure(e.message));
    } catch (e) {
      _logger.e('Unexpected error during login', e);
      return Left(GenericFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, User>> register({
    required String name,
    required String email,
    required String password,
    String? phone,
  }) async {
    try {
      // Call API
      final response = await remoteDatasource.register(
        name: name,
        email: email,
        password: password,
        phone: phone,
      );

      // Save tokens to secure storage
      await secureStorage.saveTokens(
        response.accessToken,
        response.refreshToken,
      );

      // Save user info to local storage
      await localStorage.setLoggedIn(true);
      await localStorage.setUserName(response.user.name);
      if (response.user.avatar != null) {
        await localStorage.setUserAvatar(response.user.avatar!);
      }

      // Convert model to entity
      final user = response.user.toEntity();

      _logger.i('Registration successful for user: ${user.email}');

      return Right(user);
    } on NetworkException catch (e) {
      _logger.e('Network error during registration', e);
      return Left(NetworkFailure(e.message));
    } on ConflictException catch (e) {
      _logger.e('Conflict error during registration', e);
      return Left(ConflictFailure(e.message));
    } on ValidationException catch (e) {
      _logger.e('Validation error during registration', e);
      return Left(ValidationFailure(e.message, e.errors));
    } on ServerException catch (e) {
      _logger.e('Server error during registration', e);
      return Left(ServerFailure(e.message));
    } catch (e) {
      _logger.e('Unexpected error during registration', e);
      return Left(GenericFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> logout() async {
    try {
      // Call API (fire and forget)
      await remoteDatasource.logout();

      // Clear tokens from secure storage
      await secureStorage.clearTokens();

      // Clear user info from local storage
      await localStorage.setLoggedIn(false);
      await localStorage.remove('user_name');
      await localStorage.remove('user_avatar');

      _logger.i('Logout successful');

      return const Right(null);
    } catch (e) {
      _logger.e('Error during logout', e);
      // Always succeed logout on client side
      return const Right(null);
    }
  }

  @override
  Future<bool> isAuthenticated() async {
    try {
      final token = await secureStorage.getAccessToken();
      return token != null && token.isNotEmpty;
    } catch (e) {
      _logger.e('Error checking authentication', e);
      return false;
    }
  }

  @override
  Future<Either<Failure, User>> getCurrentUser() async {
    try {
      // Call API
      final userModel = await remoteDatasource.getCurrentUser();

      // Convert model to entity
      final user = userModel.toEntity();

      _logger.i('Got current user: ${user.email}');

      return Right(user);
    } on NetworkException catch (e) {
      _logger.e('Network error getting user', e);
      return Left(NetworkFailure(e.message));
    } on AuthenticationException catch (e) {
      _logger.e('Authentication error getting user', e);
      return Left(AuthenticationFailure(e.message));
    } on ServerException catch (e) {
      _logger.e('Server error getting user', e);
      return Left(ServerFailure(e.message));
    } catch (e) {
      _logger.e('Unexpected error getting user', e);
      return Left(GenericFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> refreshToken() async {
    try {
      // Token refresh is handled automatically by DioClient interceptor
      return const Right(null);
    } catch (e) {
      _logger.e('Error refreshing token', e);
      return Left(AuthenticationFailure('Failed to refresh token'));
    }
  }
}

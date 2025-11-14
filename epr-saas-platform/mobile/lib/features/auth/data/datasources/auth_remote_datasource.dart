import 'package:dio/dio.dart';
import '../../../../app/constants/api_constants.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/utils/logger.dart';
import '../models/login_response_model.dart';
import '../models/user_model.dart';

/// Auth remote datasource
/// Handles all API calls related to authentication
class AuthRemoteDatasource {
  final DioClient dioClient;
  final _logger = Logger('AuthRemoteDatasource');

  AuthRemoteDatasource(this.dioClient);

  /// Login with email and password
  Future<LoginResponseModel> login({
    required String email,
    required String password,
  }) async {
    try {
      _logger.logRequest('POST', ApiConstants.login, {
        'email': email,
        'password': '***',
      });

      final response = await dioClient.post(
        '${ApiConstants.userServiceUrl}${ApiConstants.login}',
        data: {
          'email': email,
          'password': password,
        },
      );

      _logger.logResponse('POST', ApiConstants.login, response.statusCode ?? 0);

      if (response.statusCode == 200 && response.data['success'] == true) {
        return LoginResponseModel.fromJson(response.data['data']);
      } else {
        throw ServerException(
          response.data['message'] ?? 'Login failed',
        );
      }
    } on DioException catch (e) {
      _logger.logApiError('POST', ApiConstants.login, e);
      _handleDioError(e);
      rethrow;
    } catch (e) {
      _logger.e('Unexpected error during login', e);
      throw ServerException(e.toString());
    }
  }

  /// Register new user
  Future<LoginResponseModel> register({
    required String name,
    required String email,
    required String password,
    String? phone,
  }) async {
    try {
      _logger.logRequest('POST', ApiConstants.register, {
        'full_name': name,
        'email': email,
        'phone': phone,
      });

      final response = await dioClient.post(
        '${ApiConstants.userServiceUrl}${ApiConstants.register}',
        data: {
          'full_name': name,
          'email': email,
          'password': password,
          if (phone != null) 'phone': phone,
        },
      );

      _logger.logResponse('POST', ApiConstants.register, response.statusCode ?? 0);

      if (response.statusCode == 201 && response.data['success'] == true) {
        return LoginResponseModel.fromJson(response.data['data']);
      } else {
        throw ServerException(
          response.data['message'] ?? 'Registration failed',
        );
      }
    } on DioException catch (e) {
      _logger.logApiError('POST', ApiConstants.register, e);
      _handleDioError(e);
      rethrow;
    } catch (e) {
      _logger.e('Unexpected error during registration', e);
      throw ServerException(e.toString());
    }
  }

  /// Logout
  Future<void> logout() async {
    try {
      _logger.logRequest('POST', ApiConstants.logout);

      await dioClient.post(
        '${ApiConstants.userServiceUrl}${ApiConstants.logout}',
      );

      _logger.i('Logout successful');
    } on DioException catch (e) {
      _logger.logApiError('POST', ApiConstants.logout, e);
      // Don't throw on logout, just log
    } catch (e) {
      _logger.e('Error during logout', e);
      // Don't throw on logout
    }
  }

  /// Get current user
  Future<UserModel> getCurrentUser() async {
    try {
      _logger.logRequest('GET', ApiConstants.getUserProfile);

      final response = await dioClient.get(
        '${ApiConstants.userServiceUrl}${ApiConstants.getUserProfile}',
      );

      _logger.logResponse('GET', ApiConstants.getUserProfile, response.statusCode ?? 0);

      if (response.statusCode == 200 && response.data['success'] == true) {
        return UserModel.fromJson(response.data['data']);
      } else {
        throw ServerException(
          response.data['message'] ?? 'Failed to get user',
        );
      }
    } on DioException catch (e) {
      _logger.logApiError('GET', ApiConstants.getUserProfile, e);
      _handleDioError(e);
      rethrow;
    } catch (e) {
      _logger.e('Unexpected error getting user', e);
      throw ServerException(e.toString());
    }
  }

  /// Handle Dio errors and convert to appropriate exceptions
  void _handleDioError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        throw TimeoutException('Request timeout');

      case DioExceptionType.connectionError:
        throw NetworkException('No internet connection');

      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode;
        final message = error.response?.data['message'] ?? 'Request failed';

        switch (statusCode) {
          case 400:
            throw BadRequestException(message);
          case 401:
            throw AuthenticationException(message);
          case 403:
            throw AuthorizationException(message);
          case 404:
            throw NotFoundException(message);
          case 409:
            throw ConflictException(message);
          case 422:
            throw ValidationException(
              message,
              error.response?.data['errors'],
            );
          case 429:
            throw QuotaExceededException(message);
          case var x when x != null && x >= 500:
            throw ServerException(message);
          default:
            throw ServerException(message);
        }

      default:
        throw ServerException(error.message ?? 'Unknown error');
    }
  }
}

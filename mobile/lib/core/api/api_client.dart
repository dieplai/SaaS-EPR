/// HTTP API Client using Dio
/// Handles authentication, error handling, and logging
library;

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/api_config.dart';

class ApiClient {
  late final Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  static const String _accessTokenKey = 'access_token';
  static const String _refreshTokenKey = 'refresh_token';

  ApiClient({Environment? environment}) {
    final env = environment ?? ApiConfig.currentEnvironment;
    final baseUrl = env == Environment.local
        ? 'http://10.0.2.2:8001'
        : ApiConfig._baseUrls[env]!;

    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl + ApiConfig.apiVersion,
        connectTimeout: ApiConfig.connectTimeout,
        receiveTimeout: ApiConfig.receiveTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Add interceptors
    _dio.interceptors.addAll([
      _authInterceptor(),
      _loggingInterceptor(),
      _errorInterceptor(),
    ]);
  }

  /// Auth interceptor - adds JWT token to requests
  Interceptor _authInterceptor() {
    return InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Get token from secure storage
        final token = await _storage.read(key: _accessTokenKey);

        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }

        return handler.next(options);
      },
      onError: (error, handler) async {
        // Handle 401 Unauthorized - refresh token
        if (error.response?.statusCode == 401) {
          try {
            // Attempt to refresh token
            final refreshed = await _refreshAccessToken();

            if (refreshed) {
              // Retry original request with new token
              final opts = error.requestOptions;
              final token = await _storage.read(key: _accessTokenKey);
              opts.headers['Authorization'] = 'Bearer $token';

              final response = await _dio.fetch(opts);
              return handler.resolve(response);
            }
          } catch (e) {
            // Refresh failed - user needs to login again
            await logout();
          }
        }

        return handler.next(error);
      },
    );
  }

  /// Logging interceptor - logs requests and responses (dev only)
  Interceptor _loggingInterceptor() {
    return InterceptorsWrapper(
      onRequest: (options, handler) {
        if (!ApiConfig.isProduction) {
          print('→ ${options.method} ${options.uri}');
          print('→ Headers: ${options.headers}');
          if (options.data != null) {
            print('→ Body: ${options.data}');
          }
        }
        return handler.next(options);
      },
      onResponse: (response, handler) {
        if (!ApiConfig.isProduction) {
          print('← ${response.statusCode} ${response.requestOptions.uri}');
          print('← Data: ${response.data}');
        }
        return handler.next(response);
      },
      onError: (error, handler) {
        if (!ApiConfig.isProduction) {
          print('✗ ${error.response?.statusCode} ${error.requestOptions.uri}');
          print('✗ Error: ${error.message}');
        }
        return handler.next(error);
      },
    );
  }

  /// Error interceptor - handles common errors
  Interceptor _errorInterceptor() {
    return InterceptorsWrapper(
      onError: (error, handler) {
        String message = 'An error occurred';

        if (error.response != null) {
          switch (error.response!.statusCode) {
            case 400:
              message = 'Bad request';
              break;
            case 401:
              message = 'Unauthorized - please login';
              break;
            case 403:
              message = 'Forbidden - insufficient permissions';
              break;
            case 404:
              message = 'Resource not found';
              break;
            case 500:
              message = 'Server error - please try again later';
              break;
          }

          // Try to get error message from response
          final data = error.response!.data;
          if (data is Map && data.containsKey('error')) {
            message = data['error'];
          } else if (data is Map && data.containsKey('message')) {
            message = data['message'];
          }
        } else if (error.type == DioExceptionType.connectionTimeout) {
          message = 'Connection timeout';
        } else if (error.type == DioExceptionType.receiveTimeout) {
          message = 'Receive timeout';
        } else if (error.type == DioExceptionType.connectionError) {
          message = 'No internet connection';
        }

        // Attach custom error message
        error = error.copyWith(
          message: message,
        );

        return handler.next(error);
      },
    );
  }

  /// Refresh access token using refresh token
  Future<bool> _refreshAccessToken() async {
    try {
      final refreshToken = await _storage.read(key: _refreshTokenKey);

      if (refreshToken == null) {
        return false;
      }

      final response = await _dio.post(
        '/auth/refresh',
        data: {'refresh_token': refreshToken},
      );

      if (response.statusCode == 200) {
        final data = response.data;
        await _storage.write(key: _accessTokenKey, value: data['access_token']);

        if (data.containsKey('refresh_token')) {
          await _storage.write(
              key: _refreshTokenKey, value: data['refresh_token']);
        }

        return true;
      }

      return false;
    } catch (e) {
      return false;
    }
  }

  // ============================================
  // Authentication Methods
  // ============================================

  /// Login with email and password
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await _dio.post(
        '/auth/login',
        data: {
          'email': email,
          'password': password,
        },
      );

      if (response.statusCode == 200) {
        final data = response.data;

        // Store tokens securely
        await _storage.write(key: _accessTokenKey, value: data['access_token']);
        await _storage.write(
            key: _refreshTokenKey, value: data['refresh_token']);

        return data;
      }

      throw DioException(
        requestOptions: response.requestOptions,
        response: response,
        message: 'Login failed',
      );
    } catch (e) {
      rethrow;
    }
  }

  /// Register new user
  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String fullName,
  }) async {
    try {
      final response = await _dio.post(
        '/auth/register',
        data: {
          'email': email,
          'password': password,
          'full_name': fullName,
        },
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        return response.data;
      }

      throw DioException(
        requestOptions: response.requestOptions,
        response: response,
        message: 'Registration failed',
      );
    } catch (e) {
      rethrow;
    }
  }

  /// Logout - clear tokens
  Future<void> logout() async {
    await _storage.delete(key: _accessTokenKey);
    await _storage.delete(key: _refreshTokenKey);
  }

  /// Check if user is logged in
  Future<bool> isLoggedIn() async {
    final token = await _storage.read(key: _accessTokenKey);
    return token != null;
  }

  /// Get current access token
  Future<String?> getAccessToken() async {
    return await _storage.read(key: _accessTokenKey);
  }

  // ============================================
  // Generic HTTP Methods
  // ============================================

  Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.get(
      path,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response> post(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.post(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response> put(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.put(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }

  Future<Response> delete(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    return await _dio.delete(
      path,
      data: data,
      queryParameters: queryParameters,
      options: options,
    );
  }

  /// Health check endpoint
  Future<bool> healthCheck() async {
    try {
      final response = await _dio.get('/health');
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}

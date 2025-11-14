import 'package:dio/dio.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';
import '../../app/constants/api_constants.dart';
import '../storage/secure_storage.dart';

/// HTTP client using Dio with interceptors
/// Handles authentication, logging, and error handling
class DioClient {
  late final Dio _dio;
  final SecureStorage _secureStorage;

  DioClient(this._secureStorage) {
    _dio = Dio(
      BaseOptions(
        connectTimeout: ApiConstants.connectTimeout,
        receiveTimeout: ApiConstants.receiveTimeout,
        sendTimeout: ApiConstants.sendTimeout,
        headers: {
          ApiConstants.headerContentType: ApiConstants.contentTypeJson,
          ApiConstants.headerAccept: ApiConstants.contentTypeJson,
        },
      ),
    );

    _setupInterceptors();
  }

  /// Setup interceptors
  void _setupInterceptors() {
    _dio.interceptors.addAll([
      // Authentication interceptor
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Add access token to headers
          final token = await _secureStorage.getAccessToken();
          if (token != null && token.isNotEmpty) {
            options.headers[ApiConstants.headerAuthorization] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (error, handler) async {
          // Handle 401 Unauthorized - refresh token
          if (error.response?.statusCode == 401) {
            try {
              // Attempt to refresh token
              final refreshed = await _refreshToken();
              if (refreshed) {
                // Retry original request
                final options = error.requestOptions;
                final token = await _secureStorage.getAccessToken();
                options.headers[ApiConstants.headerAuthorization] = 'Bearer $token';

                final response = await _dio.fetch(options);
                return handler.resolve(response);
              }
            } catch (e) {
              // Refresh failed, logout user
              await _secureStorage.clearTokens();
              return handler.next(error);
            }
          }
          return handler.next(error);
        },
      ),

      // Logging interceptor (only in debug mode)
      PrettyDioLogger(
        requestHeader: true,
        requestBody: true,
        responseBody: true,
        responseHeader: false,
        error: true,
        compact: true,
        maxWidth: 90,
      ),
    ]);
  }

  /// Refresh access token
  Future<bool> _refreshToken() async {
    try {
      final refreshToken = await _secureStorage.getRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) {
        return false;
      }

      final response = await _dio.post(
        '${ApiConstants.userServiceUrl}${ApiConstants.refreshToken}',
        data: {'refreshToken': refreshToken},
      );

      if (response.statusCode == 200) {
        final data = response.data['data'];
        await _secureStorage.saveAccessToken(data['accessToken']);
        await _secureStorage.saveRefreshToken(data['refreshToken']);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  // ==================== HTTP METHODS ====================

  /// GET request
  Future<Response> get(
    String url, {
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    ProgressCallback? onReceiveProgress,
  }) async {
    try {
      final response = await _dio.get(
        url,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
        onReceiveProgress: onReceiveProgress,
      );
      return response;
    } on DioException {
      rethrow;
    }
  }

  /// POST request
  Future<Response> post(
    String url, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    ProgressCallback? onSendProgress,
    ProgressCallback? onReceiveProgress,
  }) async {
    try {
      final response = await _dio.post(
        url,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
        onSendProgress: onSendProgress,
        onReceiveProgress: onReceiveProgress,
      );
      return response;
    } on DioException {
      rethrow;
    }
  }

  /// PUT request
  Future<Response> put(
    String url, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    ProgressCallback? onSendProgress,
    ProgressCallback? onReceiveProgress,
  }) async {
    try {
      final response = await _dio.put(
        url,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
        onSendProgress: onSendProgress,
        onReceiveProgress: onReceiveProgress,
      );
      return response;
    } on DioException {
      rethrow;
    }
  }

  /// PATCH request
  Future<Response> patch(
    String url, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    ProgressCallback? onSendProgress,
    ProgressCallback? onReceiveProgress,
  }) async {
    try {
      final response = await _dio.patch(
        url,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
        onSendProgress: onSendProgress,
        onReceiveProgress: onReceiveProgress,
      );
      return response;
    } on DioException {
      rethrow;
    }
  }

  /// DELETE request
  Future<Response> delete(
    String url, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    try {
      final response = await _dio.delete(
        url,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      );
      return response;
    } on DioException {
      rethrow;
    }
  }

  /// Upload file (multipart/form-data)
  Future<Response> uploadFile(
    String url,
    String filePath,
    String fileKey, {
    Map<String, dynamic>? data,
    ProgressCallback? onSendProgress,
  }) async {
    try {
      final formData = FormData.fromMap({
        fileKey: await MultipartFile.fromFile(filePath),
        ...?data,
      });

      final response = await _dio.post(
        url,
        data: formData,
        onSendProgress: onSendProgress,
        options: Options(
          contentType: ApiConstants.contentTypeFormData,
        ),
      );
      return response;
    } on DioException {
      rethrow;
    }
  }

  /// Stream response (for Server-Sent Events)
  Stream<dynamic> streamResponse(
    String url, {
    Map<String, dynamic>? queryParameters,
    dynamic data,
  }) async* {
    try {
      final response = await _dio.post(
        url,
        data: data,
        queryParameters: queryParameters,
        options: Options(
          responseType: ResponseType.stream,
          receiveTimeout: ApiConstants.streamReceiveTimeout,
        ),
      );

      final stream = response.data.stream;
      await for (final chunk in stream) {
        yield chunk;
      }
    } on DioException {
      rethrow;
    }
  }

  /// Get Dio instance (for advanced usage)
  Dio get instance => _dio;
}

import 'dart:developer' as developer;

/// Simple logger utility for debugging
/// In production, consider using logger package
class Logger {
  final String _className;

  Logger(this._className);

  /// Log debug message
  void d(String message, [Object? error, StackTrace? stackTrace]) {
    _log('DEBUG', message, error, stackTrace);
  }

  /// Log info message
  void i(String message, [Object? error, StackTrace? stackTrace]) {
    _log('INFO', message, error, stackTrace);
  }

  /// Log warning message
  void w(String message, [Object? error, StackTrace? stackTrace]) {
    _log('WARNING', message, error, stackTrace);
  }

  /// Log error message
  void e(String message, [Object? error, StackTrace? stackTrace]) {
    _log('ERROR', message, error, stackTrace);
  }

  /// Log info message (alias for i)
  void info(String message, [Object? error, StackTrace? stackTrace]) {
    _log('INFO', message, error, stackTrace);
  }

  /// Log error message (alias for e)
  void error(String message, [Object? error, StackTrace? stackTrace]) {
    _log('ERROR', message, error, stackTrace);
  }

  /// Internal log method
  void _log(
    String level,
    String message, [
    Object? error,
    StackTrace? stackTrace,
  ]) {
    final timestamp = DateTime.now().toIso8601String();
    final logMessage = '[$timestamp] [$level] [$_className] $message';

    developer.log(
      logMessage,
      name: _className,
      error: error,
      stackTrace: stackTrace,
    );

    // In debug mode, also print to console
    if (level == 'ERROR') {
      print('❌ $logMessage');
      if (error != null) {
        print('   Error: $error');
      }
      if (stackTrace != null) {
        print('   StackTrace: $stackTrace');
      }
    } else if (level == 'WARNING') {
      print('⚠️  $logMessage');
    } else if (level == 'INFO') {
      print('ℹ️  $logMessage');
    } else {
      print('🔍 $logMessage');
    }
  }

  /// Log API request
  void logRequest(String method, String url, [Map<String, dynamic>? data]) {
    i('→ $method $url', data);
  }

  /// Log API response
  void logResponse(String method, String url, int statusCode, [dynamic data]) {
    i('← $method $url [$statusCode]', data);
  }

  /// Log API error
  void logApiError(String method, String url, Object error) {
    e('✗ $method $url', error);
  }
}

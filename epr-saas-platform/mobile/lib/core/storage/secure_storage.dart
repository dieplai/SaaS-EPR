import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../app/constants/storage_keys.dart';

/// Secure storage for sensitive data (JWT tokens, credentials)
/// Uses flutter_secure_storage (iOS Keychain, Android KeyStore)
class SecureStorage {
  late final FlutterSecureStorage _storage;

  SecureStorage() {
    _storage = const FlutterSecureStorage(
      aOptions: AndroidOptions(
        encryptedSharedPreferences: true,
      ),
      iOptions: IOSOptions(
        accessibility: KeychainAccessibility.first_unlock,
      ),
    );
  }

  // ==================== TOKEN MANAGEMENT ====================

  /// Save access token
  Future<void> saveAccessToken(String token) async {
    await _storage.write(key: StorageKeys.accessToken, value: token);
  }

  /// Get access token
  Future<String?> getAccessToken() async {
    return await _storage.read(key: StorageKeys.accessToken);
  }

  /// Save refresh token
  Future<void> saveRefreshToken(String token) async {
    await _storage.write(key: StorageKeys.refreshToken, value: token);
  }

  /// Get refresh token
  Future<String?> getRefreshToken() async {
    return await _storage.read(key: StorageKeys.refreshToken);
  }

  /// Save both tokens
  Future<void> saveTokens(String accessToken, String refreshToken) async {
    await Future.wait([
      saveAccessToken(accessToken),
      saveRefreshToken(refreshToken),
    ]);
  }

  /// Clear tokens (logout)
  Future<void> clearTokens() async {
    await Future.wait([
      _storage.delete(key: StorageKeys.accessToken),
      _storage.delete(key: StorageKeys.refreshToken),
    ]);
  }

  /// Check if user is authenticated
  Future<bool> isAuthenticated() async {
    final token = await getAccessToken();
    return token != null && token.isNotEmpty;
  }

  // ==================== USER DATA ====================

  /// Save user ID
  Future<void> saveUserId(String userId) async {
    await _storage.write(key: StorageKeys.userId, value: userId);
  }

  /// Get user ID
  Future<String?> getUserId() async {
    return await _storage.read(key: StorageKeys.userId);
  }

  /// Save user email
  Future<void> saveUserEmail(String email) async {
    await _storage.write(key: StorageKeys.userEmail, value: email);
  }

  /// Get user email
  Future<String?> getUserEmail() async {
    return await _storage.read(key: StorageKeys.userEmail);
  }

  // ==================== GENERAL METHODS ====================

  /// Write any key-value pair
  Future<void> write(String key, String value) async {
    await _storage.write(key: key, value: value);
  }

  /// Read any key
  Future<String?> read(String key) async {
    return await _storage.read(key: key);
  }

  /// Delete a key
  Future<void> delete(String key) async {
    await _storage.delete(key: key);
  }

  /// Clear all secure storage
  Future<void> clearAll() async {
    await _storage.deleteAll();
  }

  /// Check if key exists
  Future<bool> containsKey(String key) async {
    final value = await _storage.read(key: key);
    return value != null;
  }

  /// Get all keys
  Future<Map<String, String>> readAll() async {
    return await _storage.readAll();
  }
}

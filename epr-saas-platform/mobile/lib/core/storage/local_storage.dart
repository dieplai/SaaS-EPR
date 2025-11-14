import 'package:shared_preferences/shared_preferences.dart';
import '../../app/constants/storage_keys.dart';

/// Local storage for non-sensitive data
/// Uses SharedPreferences
class LocalStorage {
  late final SharedPreferences _prefs;
  bool _initialized = false;

  /// Initialize storage (call this before using)
  Future<void> init() async {
    if (!_initialized) {
      _prefs = await SharedPreferences.getInstance();
      _initialized = true;
    }
  }

  /// Ensure initialized
  void _ensureInitialized() {
    if (!_initialized) {
      throw Exception('LocalStorage not initialized. Call init() first.');
    }
  }

  // ==================== STRING METHODS ====================

  /// Save string
  Future<bool> setString(String key, String value) async {
    _ensureInitialized();
    return await _prefs.setString(key, value);
  }

  /// Get string
  String? getString(String key) {
    _ensureInitialized();
    return _prefs.getString(key);
  }

  // ==================== INT METHODS ====================

  /// Save int
  Future<bool> setInt(String key, int value) async {
    _ensureInitialized();
    return await _prefs.setInt(key, value);
  }

  /// Get int
  int? getInt(String key) {
    _ensureInitialized();
    return _prefs.getInt(key);
  }

  // ==================== BOOL METHODS ====================

  /// Save bool
  Future<bool> setBool(String key, bool value) async {
    _ensureInitialized();
    return await _prefs.setBool(key, value);
  }

  /// Get bool
  bool? getBool(String key) {
    _ensureInitialized();
    return _prefs.getBool(key);
  }

  // ==================== DOUBLE METHODS ====================

  /// Save double
  Future<bool> setDouble(String key, double value) async {
    _ensureInitialized();
    return await _prefs.setDouble(key, value);
  }

  /// Get double
  double? getDouble(String key) {
    _ensureInitialized();
    return _prefs.getDouble(key);
  }

  // ==================== STRING LIST METHODS ====================

  /// Save string list
  Future<bool> setStringList(String key, List<String> value) async {
    _ensureInitialized();
    return await _prefs.setStringList(key, value);
  }

  /// Get string list
  List<String>? getStringList(String key) {
    _ensureInitialized();
    return _prefs.getStringList(key);
  }

  // ==================== USER PREFERENCES ====================

  /// Check if first launch
  bool isFirstLaunch() {
    return getBool(StorageKeys.isFirstLaunch) ?? true;
  }

  /// Set first launch completed
  Future<bool> setFirstLaunchCompleted() async {
    return await setBool(StorageKeys.isFirstLaunch, false);
  }

  /// Check if logged in
  bool isLoggedIn() {
    return getBool(StorageKeys.isLoggedIn) ?? false;
  }

  /// Set logged in
  Future<bool> setLoggedIn(bool value) async {
    return await setBool(StorageKeys.isLoggedIn, value);
  }

  /// Get user name
  String? getUserName() {
    return getString(StorageKeys.userName);
  }

  /// Set user name
  Future<bool> setUserName(String name) async {
    return await setString(StorageKeys.userName, name);
  }

  /// Get user avatar
  String? getUserAvatar() {
    return getString(StorageKeys.userAvatar);
  }

  /// Set user avatar
  Future<bool> setUserAvatar(String url) async {
    return await setString(StorageKeys.userAvatar, url);
  }

  // ==================== SUBSCRIPTION DATA ====================

  /// Get quota remaining
  int getQuotaRemaining() {
    return getInt(StorageKeys.quotaRemaining) ?? 0;
  }

  /// Set quota remaining
  Future<bool> setQuotaRemaining(int quota) async {
    return await setInt(StorageKeys.quotaRemaining, quota);
  }

  /// Get quota total
  int getQuotaTotal() {
    return getInt(StorageKeys.quotaTotal) ?? 0;
  }

  /// Set quota total
  Future<bool> setQuotaTotal(int quota) async {
    return await setInt(StorageKeys.quotaTotal, quota);
  }

  /// Get current package name
  String? getCurrentPackageName() {
    return getString(StorageKeys.currentPackageName);
  }

  /// Set current package name
  Future<bool> setCurrentPackageName(String name) async {
    return await setString(StorageKeys.currentPackageName, name);
  }

  // ==================== SETTINGS ====================

  /// Get theme mode (light/dark)
  String getThemeMode() {
    return getString(StorageKeys.themeMode) ?? 'light';
  }

  /// Set theme mode
  Future<bool> setThemeMode(String mode) async {
    return await setString(StorageKeys.themeMode, mode);
  }

  /// Get language code
  String getLanguageCode() {
    return getString(StorageKeys.languageCode) ?? 'vi';
  }

  /// Set language code
  Future<bool> setLanguageCode(String code) async {
    return await setString(StorageKeys.languageCode, code);
  }

  /// Check if notifications enabled
  bool isNotificationsEnabled() {
    return getBool(StorageKeys.notificationsEnabled) ?? true;
  }

  /// Set notifications enabled
  Future<bool> setNotificationsEnabled(bool enabled) async {
    return await setBool(StorageKeys.notificationsEnabled, enabled);
  }

  // ==================== GENERAL METHODS ====================

  /// Remove a key
  Future<bool> remove(String key) async {
    _ensureInitialized();
    return await _prefs.remove(key);
  }

  /// Clear all data
  Future<bool> clearAll() async {
    _ensureInitialized();
    return await _prefs.clear();
  }

  /// Check if key exists
  bool containsKey(String key) {
    _ensureInitialized();
    return _prefs.containsKey(key);
  }

  /// Get all keys
  Set<String> getAllKeys() {
    _ensureInitialized();
    return _prefs.getKeys();
  }

  /// Reload from disk
  Future<void> reload() async {
    _ensureInitialized();
    await _prefs.reload();
  }
}

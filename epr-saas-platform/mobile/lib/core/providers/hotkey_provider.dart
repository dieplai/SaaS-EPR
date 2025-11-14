import 'package:flutter/foundation.dart';

/// Stub hotkey provider - desktop-only feature disabled for Android build
class HotkeyProvider extends ChangeNotifier {
  static const _prefsKeyCommands = 'desktop_hotkeys_commands_v1';
  static const _prefsKeyEnabled = 'desktop_hotkeys_enabled_v1';

  final Map<String, dynamic> _items = {};
  bool _initialized = false;
  bool get initialized => _initialized;

  List<dynamic> get items => _items.values.toList(growable: false);

  Future<void> initialize() async {
    _initialized = true;
    notifyListeners();
  }

  Future<void> resetAllToDefaults() async {
    notifyListeners();
  }

  Future<void> resetToDefault(String id) async {
    notifyListeners();
  }

  Future<void> clearCommand(String id) async {
    notifyListeners();
  }

  Future<void> setCommand(String id, String command) async {
    notifyListeners();
  }

  Future<void> setEnabled(String id, bool value) async {
    notifyListeners();
  }

  static String formatCommandForDisplay(String? cmd) {
    return cmd ?? '';
  }
}

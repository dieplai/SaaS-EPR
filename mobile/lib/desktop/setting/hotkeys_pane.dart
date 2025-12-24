import 'package:flutter/material.dart';

/// Stub desktop hotkeys pane - desktop-only feature not available in Android build
class DesktopHotkeysPane extends StatefulWidget {
  const DesktopHotkeysPane({super.key});

  @override
  State<DesktopHotkeysPane> createState() => _DesktopHotkeysPaneState();
}

class _DesktopHotkeysPaneState extends State<DesktopHotkeysPane> {
  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Text('Hotkeys Pane Not Available on Android'),
    );
  }
}

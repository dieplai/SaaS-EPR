import 'package:flutter/material.dart';

/// Stub window title bar - desktop-only feature disabled for Android build
class WindowTitleBar extends StatefulWidget {
  const WindowTitleBar({super.key, this.leftChildren = const <Widget>[]});

  final List<Widget> leftChildren;

  @override
  State<WindowTitleBar> createState() => _WindowTitleBarState();
}

class _WindowTitleBarState extends State<WindowTitleBar> {
  @override
  Widget build(BuildContext context) {
    return const SizedBox.shrink();
  }
}

/// Stub for WindowCaptionButton - not available on Android
class WindowCaptionButton extends StatelessWidget {
  const WindowCaptionButton.minimize({
    this.brightness = Brightness.light,
    this.onPressed,
  });

  const WindowCaptionButton.maximize({
    this.brightness = Brightness.light,
    this.onPressed,
  });

  const WindowCaptionButton.unmaximize({
    this.brightness = Brightness.light,
    this.onPressed,
  });

  const WindowCaptionButton.close({
    this.brightness = Brightness.light,
    this.onPressed,
  });

  final Brightness brightness;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return const SizedBox.shrink();
  }
}

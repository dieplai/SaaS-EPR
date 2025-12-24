import 'package:flutter/material.dart';

/// Stub desktop home page - not available in Android build
class DesktopHomePage extends StatefulWidget {
  const DesktopHomePage({
    super.key,
    this.initialTabIndex,
    this.initialProviderKey,
  });

  final int? initialTabIndex;
  final String? initialProviderKey;

  @override
  State<DesktopHomePage> createState() => _DesktopHomePageState();
}

class _DesktopHomePageState extends State<DesktopHomePage> {
  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Text('Desktop Home Not Available'),
      ),
    );
  }
}

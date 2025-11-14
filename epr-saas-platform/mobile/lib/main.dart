import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'app/theme/app_theme.dart';
import 'app/constants/app_constants.dart';
import 'core/di/injection.dart';

void main() async {
  // Ensure Flutter bindings are initialized
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize dependencies
  await initDependencies();

  // Set system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(AppTheme.darkOverlay);

  // Set preferred orientations (portrait only)
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Run app
  runApp(const EPRLegalApp());
}

class EPRLegalApp extends StatelessWidget {
  const EPRLegalApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      // App configuration
      title: AppConstants.appName,
      debugShowCheckedModeBanner: false,

      // Theme
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.light,

      // Home (temporary - will be replaced with routing)
      home: const SplashScreen(),
    );
  }
}

/// Temporary splash screen (will be replaced with actual implementation)
class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFF1E3A8A),  // Primary
              Color(0xFF1E293B),  // Primary Dark
            ],
          ),
        ),
        child: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Logo placeholder
              Icon(
                Icons.balance,
                size: 120,
                color: Colors.white,
              ),
              SizedBox(height: 24),

              // App name
              Text(
                AppConstants.appName,
                style: TextStyle(
                  fontSize: 34,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              SizedBox(height: 8),

              // Tagline
              Text(
                AppConstants.appTagline,
                style: TextStyle(
                  fontSize: 17,
                  color: Colors.white70,
                ),
              ),
              SizedBox(height: 48),

              // Loading indicator
              SizedBox(
                width: 44,
                height: 44,
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  strokeWidth: 3,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

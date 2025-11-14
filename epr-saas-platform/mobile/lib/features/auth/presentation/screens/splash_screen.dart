import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_text_styles.dart';
import '../../../../app/theme/app_dimensions.dart';
import '../../../../app/constants/app_constants.dart';
import '../../../../core/storage/local_storage.dart';
import '../../../../core/storage/secure_storage.dart';
import '../../../../core/di/injection.dart';

/// Splash screen (initial loading screen)
/// Shows app logo, checks auth status, navigates to appropriate screen
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _initAnimations();
    _checkAuthAndNavigate();
  }

  void _initAnimations() {
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: const Interval(0.0, 0.6, curve: Curves.easeOut),
    ));

    _scaleAnimation = Tween<double>(
      begin: 0.8,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: const Interval(0.0, 0.6, curve: Curves.easeOutBack),
    ));

    _animationController.forward();
  }

  Future<void> _checkAuthAndNavigate() async {
    // Wait for animation to complete
    await Future.delayed(const Duration(milliseconds: 2000));

    if (!mounted) return;

    try {
      final secureStorage = getIt<SecureStorage>();
      final localStorage = getIt<LocalStorage>();

      // Check if user is authenticated
      final token = await secureStorage.getAccessToken();
      final isLoggedIn = localStorage.isLoggedIn();

      if (token != null && token.isNotEmpty && isLoggedIn) {
        // User is authenticated, navigate to main screen
        // TODO: Navigate to main screen when implemented
        if (mounted) {
          // Navigator.pushReplacementNamed(context, RouteNames.main);
          // For now, navigate to login
          Navigator.pushReplacementNamed(context, '/login');
        }
      } else {
        // User is not authenticated, navigate to login
        if (mounted) {
          Navigator.pushReplacementNamed(context, '/login');
        }
      }
    } catch (e) {
      // On error, navigate to login
      if (mounted) {
        Navigator.pushReplacementNamed(context, '/login');
      }
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppColors.splashGradient,
        ),
        child: Center(
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: ScaleTransition(
              scale: _scaleAnimation,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo
                  Container(
                    width: AppDimensions.avatarSizeXL,
                    height: AppDimensions.avatarSizeXL,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(
                        AppDimensions.radiusLG,
                      ),
                    ),
                    child: const Icon(
                      Icons.balance,
                      size: 80,
                      color: Colors.white,
                    ),
                  ),

                  const SizedBox(height: AppDimensions.spacingLG),

                  // App name
                  Text(
                    AppConstants.appName,
                    style: AppTextStyles.displayLarge.copyWith(
                      color: Colors.white,
                    ),
                  ),

                  const SizedBox(height: AppDimensions.spacingXS),

                  // Tagline
                  Text(
                    AppConstants.appTagline,
                    style: AppTextStyles.bodyLarge.copyWith(
                      color: Colors.white.withOpacity(0.9),
                    ),
                  ),

                  const SizedBox(height: AppDimensions.spacing2XL),

                  // Loading indicator
                  const SizedBox(
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
        ),
      ),
    );
  }
}

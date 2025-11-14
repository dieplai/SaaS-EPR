import 'package:flutter/material.dart';

/// App color palette inspired by Perplexity & ChatGPT clean design
/// Using minimal, professional colors for legal tech
class AppColors {
  // Private constructor to prevent instantiation
  AppColors._();

  // ==================== PRIMARY COLORS ====================
  /// Main brand color - Professional Blue (inspired by legal industry)
  static const Color primary = Color(0xFF1E3A8A); // Dark Blue
  static const Color primaryLight = Color(0xFF3B82F6); // Blue
  static const Color primaryDark = Color(0xFF1E293B); // Navy

  // ==================== NEUTRAL COLORS ====================
  /// Text colors
  static const Color textPrimary = Color(0xFF111827); // Gray 900
  static const Color textSecondary = Color(0xFF374151); // Gray 700
  static const Color textTertiary = Color(0xFF6B7280); // Gray 500
  static const Color textDisabled = Color(0xFF9CA3AF); // Gray 400

  /// Background colors
  static const Color background = Color(0xFFFAFAFA); // Off-white (like ChatGPT)
  static const Color surface = Color(0xFFFFFFFF); // White
  static const Color surfaceVariant = Color(0xFFF3F4F6); // Gray 100

  /// Border colors
  static const Color border = Color(0xFFD1D5DB); // Gray 300
  static const Color borderLight = Color(0xFFE5E7EB); // Gray 200
  static const Color divider = Color(0xFFE5E7EB); // Gray 200

  // ==================== SEMANTIC COLORS ====================
  /// Success (confirmations, positive actions)
  static const Color success = Color(0xFF10B981); // Green 500
  static const Color successLight = Color(0xFFD1FAE5); // Green 100

  /// Error (errors, destructive actions)
  static const Color error = Color(0xFFEF4444); // Red 500
  static const Color errorLight = Color(0xFFFEE2E2); // Red 100

  /// Warning (alerts, quota warnings)
  static const Color warning = Color(0xFFF59E0B); // Amber 500
  static const Color warningLight = Color(0xFFFEF3C7); // Amber 100

  /// Info (tips, information)
  static const Color info = Color(0xFF06B6D4); // Cyan 500
  static const Color infoLight = Color(0xFFCFFAFE); // Cyan 100

  // ==================== CHAT COLORS ====================
  /// User message bubble (like ChatGPT)
  static const Color userMessageBg = Color(0xFF1E3A8A); // Primary blue
  static const Color userMessageText = Color(0xFFFFFFFF); // White

  /// AI message bubble (like ChatGPT light gray)
  static const Color aiMessageBg = Color(0xFFF3F4F6); // Gray 100
  static const Color aiMessageText = Color(0xFF111827); // Gray 900

  /// Citation card (like Perplexity)
  static const Color citationBg = Color(0xFFF9FAFB); // Gray 50
  static const Color citationBorder = Color(0xFFD1D5DB); // Gray 300
  static const Color citationAccent = Color(0xFF3B82F6); // Blue

  // ==================== SPECIAL COLORS ====================
  /// Shadow colors
  static const Color shadow = Color(0x0F000000); // 6% black
  static const Color shadowDark = Color(0x1A000000); // 10% black

  /// Overlay colors
  static const Color overlay = Color(0x80000000); // 50% black
  static const Color overlayLight = Color(0x33000000); // 20% black

  /// Shimmer loading (skeleton)
  static const Color shimmerBase = Color(0xFFE5E7EB); // Gray 200
  static const Color shimmerHighlight = Color(0xFFF3F4F6); // Gray 100

  // ==================== DARK MODE COLORS ====================
  /// Dark mode palette (future use)
  static const Color darkBackground = Color(0xFF111827); // Gray 900
  static const Color darkSurface = Color(0xFF1F2937); // Gray 800
  static const Color darkTextPrimary = Color(0xFFF9FAFB); // Gray 50
  static const Color darkBorder = Color(0xFF374151); // Gray 700

  // ==================== GRADIENT COLORS ====================
  /// Splash screen gradient
  static const LinearGradient splashGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [primary, primaryDark],
  );

  /// Premium badge gradient
  static const LinearGradient premiumGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFFFD700), Color(0xFFFFA500)], // Gold
  );

  // ==================== HELPER METHODS ====================
  /// Get color with opacity
  static Color withOpacity(Color color, double opacity) {
    return color.withOpacity(opacity);
  }

  /// Get shadow color for elevation
  static Color getShadowColor(int elevation) {
    switch (elevation) {
      case 1:
        return shadow;
      case 2:
        return Color(0x14000000); // 8%
      case 3:
        return Color(0x1F000000); // 12%
      default:
        return shadowDark;
    }
  }
}

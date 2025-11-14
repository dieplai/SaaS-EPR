import 'package:flutter/material.dart';

/// App color palette - EPR Legal Brand Guideline
/// Eco Green theme with professional, clean design
class AppColors {
  // Private constructor to prevent instantiation
  AppColors._();

  // ==================== PRIMARY COLORS ====================
  /// Main brand color - Eco Green (logo, buttons, icons)
  static const Color primary = Color(0xFF22C55E); // Eco Green
  static const Color primaryLight = Color(0xFFA7F3D0); // Fresh Mint
  static const Color primaryDark = Color(0xFF15803D); // Deep Green

  // ==================== SECONDARY COLORS ====================
  /// Secondary brand colors
  static const Color secondary = Color(0xFF15803D); // Deep Green (headings, borders)
  static const Color secondaryLight = Color(0xFFA7F3D0); // Fresh Mint (tags, backgrounds)

  // ==================== NEUTRAL COLORS ====================
  /// Text colors
  static const Color textPrimary = Color(0xFF111827); // Gray Dark (main text)
  static const Color textSecondary = Color(0xFF6B7280); // Gray Medium (secondary text)
  static const Color textTertiary = Color(0xFF9CA3AF); // Gray Light (hints)
  static const Color textDisabled = Color(0xFFD1D5DB); // Gray Lighter (disabled)

  /// Background colors
  static const Color background = Color(0xFFF9FAFB); // Off White
  static const Color surface = Color(0xFFFFFFFF); // White
  static const Color surfaceVariant = Color(0xFFF3F4F6); // Gray 100
  static const Color inputBackground = Color(0xFFFAFAFA); // Off-white (for input fields)

  /// Border colors
  static const Color border = Color(0xFFE5E7EB); // Gray Light
  static const Color borderLight = Color(0xFFF3F4F6); // Gray Lighter
  static const Color divider = Color(0xFFE5E7EB); // Gray Light

  // ==================== SEMANTIC COLORS ====================
  /// Success (達成 - chỉ tiêu đạt)
  static const Color success = Color(0xFF22C55E); // Eco Green
  static const Color successLight = Color(0xFFDCFCE7); // Light Green

  /// Error (違反 - vi phạm / thiếu dữ liệu)
  static const Color error = Color(0xFFEF4444); // Red 500
  static const Color errorLight = Color(0xFFFEE2E2); // Red 100

  /// Warning (制限 - sắp vượt, sắp hết hạn)
  static const Color warning = Color(0xFFFACC15); // Yellow/Amber
  static const Color warningLight = Color(0xFFFEF08A); // Light Yellow

  /// Info (通知 - thông báo chung)
  static const Color info = Color(0xFF0EA5E9); // Sky Blue
  static const Color infoLight = Color(0xFFCFFAFE); // Light Sky Blue

  // ==================== CHAT COLORS ====================
  /// User message bubble
  static const Color userMessageBg = Color(0xFF22C55E); // Eco Green
  static const Color userMessageText = Color(0xFFFFFFFF); // White

  /// AI message bubble
  static const Color aiMessageBg = Color(0xFFF9FAFB); // Off White
  static const Color aiMessageText = Color(0xFF111827); // Gray Dark

  /// Citation card
  static const Color citationBg = Color(0xFFFFFFFF); // White
  static const Color citationBorder = Color(0xFFE5E7EB); // Gray Light
  static const Color citationAccent = Color(0xFF22C55E); // Eco Green

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
  /// Splash screen gradient - Eco Green theme
  static const LinearGradient splashGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFF22C55E), Color(0xFF15803D)], // Eco Green to Deep Green
  );

  /// Premium badge gradient - Green
  static const LinearGradient premiumGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF22C55E), Color(0xFFA7F3D0)], // Eco Green to Fresh Mint
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

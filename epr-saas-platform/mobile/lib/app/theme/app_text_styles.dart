import 'package:flutter/material.dart';
import 'app_colors.dart';

/// Typography system inspired by iOS and ChatGPT mobile
/// Using SF Pro Text for iOS, Roboto for Android
class AppTextStyles {
  // Private constructor
  AppTextStyles._();

  // Font families
  static const String _primaryFont = 'SF Pro Text'; // iOS
  static const String _fallbackFont = 'Roboto'; // Android
  static const String _monospaceFont = 'SF Mono'; // Legal citations

  // ==================== DISPLAY STYLES ====================
  /// Display Large - for splash screens, onboarding
  /// 34px / Bold / Primary
  static const TextStyle displayLarge = TextStyle(
    fontFamily: _primaryFont,
    fontSize: 34,
    fontWeight: FontWeight.bold,
    height: 1.2,
    color: AppColors.textPrimary,
    letterSpacing: -0.5,
  );

  /// Display Medium - for empty states
  /// 28px / Bold / Primary
  static const TextStyle displayMedium = TextStyle(
    fontFamily: _primaryFont,
    fontSize: 28,
    fontWeight: FontWeight.bold,
    height: 1.2,
    color: AppColors.textPrimary,
    letterSpacing: -0.3,
  );

  // ==================== HEADLINE STYLES ====================
  /// Headline 1 - Screen titles (like ChatGPT)
  /// 28px / Bold / Primary
  static const TextStyle headline1 = TextStyle(
    fontFamily: _primaryFont,
    fontSize: 28,
    fontWeight: FontWeight.bold,
    height: 1.2,
    color: AppColors.textPrimary,
    letterSpacing: -0.3,
  );

  /// Headline 2 - Section headers
  /// 24px / SemiBold / Primary
  static const TextStyle headline2 = TextStyle(
    fontFamily: _primaryFont,
    fontSize: 24,
    fontWeight: FontWeight.w600,
    height: 1.25,
    color: AppColors.textPrimary,
    letterSpacing: -0.2,
  );

  /// Headline 3 - Card titles, subsection headers
  /// 20px / SemiBold / Primary
  static const TextStyle headline3 = TextStyle(
    fontFamily: _primaryFont,
    fontSize: 20,
    fontWeight: FontWeight.w600,
    height: 1.3,
    color: AppColors.textPrimary,
    letterSpacing: -0.1,
  );

  /// Headline 4 - Small headers
  /// 18px / SemiBold / Primary
  static const TextStyle headline4 = TextStyle(
    fontFamily: _primaryFont,
    fontSize: 18,
    fontWeight: FontWeight.w600,
    height: 1.3,
    color: AppColors.textPrimary,
  );

  // ==================== BODY STYLES ====================
  /// Body Large - Primary content (iOS standard)
  /// 17px / Regular / Secondary
  static const TextStyle bodyLarge = TextStyle(
    fontFamily: _primaryFont,
    fontSize: 17,
    fontWeight: FontWeight.w400,
    height: 1.5,
    color: AppColors.textSecondary,
  );

  /// Body Large SemiBold - for emphasis
  /// 17px / SemiBold / Primary
  static const TextStyle bodyLargeSemiBold = TextStyle(
    fontFamily: _primaryFont,
    fontSize: 17,
    fontWeight: FontWeight.w600,
    height: 1.5,
    color: AppColors.textPrimary,
  );

  /// Body Medium - Secondary content
  /// 15px / Regular / Secondary
  static const TextStyle bodyMedium = TextStyle(
    fontFamily: _primaryFont,
    fontSize: 15,
    fontWeight: FontWeight.w400,
    height: 1.5,
    color: AppColors.textSecondary,
  );

  /// Body Medium SemiBold
  /// 15px / SemiBold / Primary
  static const TextStyle bodyMediumSemiBold = TextStyle(
    fontFamily: _primaryFont,
    fontSize: 15,
    fontWeight: FontWeight.w600,
    height: 1.5,
    color: AppColors.textPrimary,
  );

  /// Body Small - Captions, timestamps
  /// 13px / Regular / Tertiary
  static const TextStyle bodySmall = TextStyle(
    fontFamily: _primaryFont,
    fontSize: 13,
    fontWeight: FontWeight.w400,
    height: 1.4,
    color: AppColors.textTertiary,
  );

  // ==================== BUTTON STYLES ====================
  /// Button Large - Primary buttons
  /// 17px / SemiBold / White
  static const TextStyle buttonLarge = TextStyle(
    fontFamily: _primaryFont,
    fontSize: 17,
    fontWeight: FontWeight.w600,
    height: 1.2,
    letterSpacing: 0.2,
  );

  /// Button Medium - Secondary buttons
  /// 15px / SemiBold
  static const TextStyle buttonMedium = TextStyle(
    fontFamily: _primaryFont,
    fontSize: 15,
    fontWeight: FontWeight.w600,
    height: 1.2,
    letterSpacing: 0.2,
  );

  /// Button Small - Text buttons, links
  /// 15px / SemiBold / Primary
  static const TextStyle buttonSmall = TextStyle(
    fontFamily: _primaryFont,
    fontSize: 15,
    fontWeight: FontWeight.w600,
    height: 1.2,
    color: AppColors.primaryLight,
  );

  // ==================== LABEL STYLES ====================
  /// Label - Input labels, form labels
  /// 15px / Regular / Secondary
  static const TextStyle label = TextStyle(
    fontFamily: _primaryFont,
    fontSize: 15,
    fontWeight: FontWeight.w400,
    height: 1.3,
    color: AppColors.textSecondary,
  );

  /// Label SemiBold
  /// 15px / SemiBold / Primary
  static const TextStyle labelSemiBold = TextStyle(
    fontFamily: _primaryFont,
    fontSize: 15,
    fontWeight: FontWeight.w600,
    height: 1.3,
    color: AppColors.textPrimary,
  );

  // ==================== CAPTION STYLES ====================
  /// Caption - Helper text, footnotes
  /// 11px / Regular / Tertiary
  static const TextStyle caption = TextStyle(
    fontFamily: _primaryFont,
    fontSize: 11,
    fontWeight: FontWeight.w400,
    height: 1.4,
    color: AppColors.textTertiary,
  );

  /// Caption SemiBold
  /// 11px / SemiBold / Tertiary
  static const TextStyle captionSemiBold = TextStyle(
    fontFamily: _primaryFont,
    fontSize: 11,
    fontWeight: FontWeight.w600,
    height: 1.4,
    color: AppColors.textTertiary,
  );

  // ==================== CHAT-SPECIFIC STYLES ====================
  /// Chat User Message - white text on blue
  /// 15px / Regular / White
  static const TextStyle chatUserMessage = TextStyle(
    fontFamily: _primaryFont,
    fontSize: 15,
    fontWeight: FontWeight.w400,
    height: 1.5,
    color: AppColors.userMessageText,
  );

  /// Chat AI Message - dark text on light gray (like ChatGPT)
  /// 15px / Regular / Primary
  static const TextStyle chatAiMessage = TextStyle(
    fontFamily: _primaryFont,
    fontSize: 15,
    fontWeight: FontWeight.w400,
    height: 1.5,
    color: AppColors.aiMessageText,
  );

  /// Chat Timestamp
  /// 11px / Regular / Tertiary
  static const TextStyle chatTimestamp = TextStyle(
    fontFamily: _primaryFont,
    fontSize: 11,
    fontWeight: FontWeight.w400,
    height: 1.3,
    color: AppColors.textTertiary,
  );

  /// Citation Title (like Perplexity)
  /// 13px / SemiBold / Primary
  static const TextStyle citationTitle = TextStyle(
    fontFamily: _primaryFont,
    fontSize: 13,
    fontWeight: FontWeight.w600,
    height: 1.4,
    color: AppColors.textPrimary,
  );

  /// Citation Content - legal text (monospace)
  /// 13px / Regular / Monospace / Secondary
  static const TextStyle citationContent = TextStyle(
    fontFamily: _monospaceFont,
    fontSize: 13,
    fontWeight: FontWeight.w400,
    height: 1.6,
    color: AppColors.textSecondary,
  );

  // ==================== PLACEHOLDER STYLES ====================
  /// Input Placeholder
  /// 17px / Regular / Tertiary
  static const TextStyle placeholder = TextStyle(
    fontFamily: _primaryFont,
    fontSize: 17,
    fontWeight: FontWeight.w400,
    height: 1.5,
    color: AppColors.textTertiary,
  );

  // ==================== TAB BAR STYLES ====================
  /// Tab Label Active
  /// 11px / Regular / Primary
  static const TextStyle tabLabelActive = TextStyle(
    fontFamily: _primaryFont,
    fontSize: 11,
    fontWeight: FontWeight.w400,
    height: 1.2,
    color: AppColors.primary,
  );

  /// Tab Label Inactive
  /// 11px / Regular / Disabled
  static const TextStyle tabLabelInactive = TextStyle(
    fontFamily: _primaryFont,
    fontSize: 11,
    fontWeight: FontWeight.w400,
    height: 1.2,
    color: AppColors.textDisabled,
  );

  // ==================== NAVBAR STYLES ====================
  /// Navigation Bar Title
  /// 17px / SemiBold / Primary
  static const TextStyle navBarTitle = TextStyle(
    fontFamily: _primaryFont,
    fontSize: 17,
    fontWeight: FontWeight.w600,
    height: 1.2,
    color: AppColors.textPrimary,
  );

  /// Navigation Bar Button
  /// 17px / Regular / Primary Blue
  static const TextStyle navBarButton = TextStyle(
    fontFamily: _primaryFont,
    fontSize: 17,
    fontWeight: FontWeight.w400,
    height: 1.2,
    color: AppColors.primaryLight,
  );

  // ==================== ERROR STYLES ====================
  /// Error Text
  /// 13px / Regular / Error
  static const TextStyle error = TextStyle(
    fontFamily: _primaryFont,
    fontSize: 13,
    fontWeight: FontWeight.w400,
    height: 1.4,
    color: AppColors.error,
  );

  /// Success Text
  /// 13px / Regular / Success
  static const TextStyle success = TextStyle(
    fontFamily: _primaryFont,
    fontSize: 13,
    fontWeight: FontWeight.w400,
    height: 1.4,
    color: AppColors.success,
  );

  // ==================== HELPER METHODS ====================
  /// Apply color to any text style
  static TextStyle withColor(TextStyle style, Color color) {
    return style.copyWith(color: color);
  }

  /// Apply opacity to any text style
  static TextStyle withOpacity(TextStyle style, double opacity) {
    return style.copyWith(color: style.color?.withOpacity(opacity));
  }

  /// Make text bold
  static TextStyle bold(TextStyle style) {
    return style.copyWith(fontWeight: FontWeight.bold);
  }

  /// Make text semibold
  static TextStyle semiBold(TextStyle style) {
    return style.copyWith(fontWeight: FontWeight.w600);
  }
}

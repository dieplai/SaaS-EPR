import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'app_colors.dart';
import 'app_text_styles.dart';
import 'app_dimensions.dart';

/// App theme configuration
/// Light theme inspired by ChatGPT clean design
/// Dark theme for future implementation
class AppTheme {
  // Private constructor
  AppTheme._();

  // ==================== LIGHT THEME ====================
  static ThemeData get lightTheme {
    return ThemeData(
      // ===== Brightness =====
      brightness: Brightness.light,
      useMaterial3: true,

      // ===== Color Scheme =====
      colorScheme: const ColorScheme.light(
        primary: AppColors.primary,
        secondary: AppColors.primaryLight,
        surface: AppColors.surface,
        background: AppColors.background,
        error: AppColors.error,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: AppColors.textPrimary,
        onBackground: AppColors.textPrimary,
        onError: Colors.white,
      ),

      // ===== Scaffold =====
      scaffoldBackgroundColor: AppColors.background,

      // ===== AppBar Theme =====
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.surface,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: AppTextStyles.navBarTitle,
        iconTheme: IconThemeData(
          color: AppColors.primaryLight,
          size: AppDimensions.iconSizeMD,
        ),
        systemOverlayStyle: SystemUiOverlayStyle(
          statusBarBrightness: Brightness.light,
          statusBarIconBrightness: Brightness.dark,
          statusBarColor: Colors.transparent,
        ),
      ),

      // ===== Bottom Navigation Bar =====
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.surface,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.textDisabled,
        selectedLabelStyle: AppTextStyles.tabLabelActive,
        unselectedLabelStyle: AppTextStyles.tabLabelInactive,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
        showSelectedLabels: true,
        showUnselectedLabels: true,
      ),

      // ===== Card Theme =====
      cardTheme: CardThemeData(
        color: AppColors.surface,
        elevation: AppDimensions.elevationLow,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppDimensions.radiusMD),
        ),
        margin: const EdgeInsets.all(AppDimensions.spacingMD),
        shadowColor: AppColors.shadow,
      ),

      // ===== Button Themes =====
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          elevation: AppDimensions.elevationLow,
          padding: const EdgeInsets.symmetric(
            horizontal: AppDimensions.buttonPaddingH,
            vertical: AppDimensions.buttonPaddingV,
          ),
          textStyle: AppTextStyles.buttonLarge,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppDimensions.radiusMD),
          ),
          minimumSize: const Size(
            double.infinity,
            AppDimensions.buttonHeight,
          ),
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primary,
          side: const BorderSide(
            color: AppColors.border,
            width: AppDimensions.borderWidthDefault,
          ),
          padding: const EdgeInsets.symmetric(
            horizontal: AppDimensions.buttonPaddingH,
            vertical: AppDimensions.buttonPaddingV,
          ),
          textStyle: AppTextStyles.buttonLarge,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppDimensions.radiusMD),
          ),
          minimumSize: const Size(
            double.infinity,
            AppDimensions.buttonHeight,
          ),
        ),
      ),

      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primaryLight,
          textStyle: AppTextStyles.buttonSmall,
          padding: const EdgeInsets.symmetric(
            horizontal: AppDimensions.spacingMD,
            vertical: AppDimensions.spacingSM,
          ),
        ),
      ),

      // ===== Input Decoration Theme =====
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surface,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: AppDimensions.inputPaddingH,
          vertical: AppDimensions.spacingMD,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppDimensions.radiusMD),
          borderSide: const BorderSide(
            color: AppColors.border,
            width: AppDimensions.borderWidthDefault,
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppDimensions.radiusMD),
          borderSide: const BorderSide(
            color: AppColors.border,
            width: AppDimensions.borderWidthDefault,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppDimensions.radiusMD),
          borderSide: const BorderSide(
            color: AppColors.primaryLight,
            width: AppDimensions.borderWidthThick,
          ),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppDimensions.radiusMD),
          borderSide: const BorderSide(
            color: AppColors.error,
            width: AppDimensions.borderWidthDefault,
          ),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppDimensions.radiusMD),
          borderSide: const BorderSide(
            color: AppColors.error,
            width: AppDimensions.borderWidthThick,
          ),
        ),
        disabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppDimensions.radiusMD),
          borderSide: const BorderSide(
            color: AppColors.borderLight,
            width: AppDimensions.borderWidthDefault,
          ),
        ),
        labelStyle: AppTextStyles.label,
        hintStyle: AppTextStyles.placeholder,
        errorStyle: AppTextStyles.error,
        prefixIconColor: AppColors.textTertiary,
        suffixIconColor: AppColors.textTertiary,
      ),

      // ===== Divider Theme =====
      dividerTheme: const DividerThemeData(
        color: AppColors.divider,
        thickness: AppDimensions.borderWidthThin,
        space: 0,
      ),

      // ===== List Tile Theme =====
      listTileTheme: const ListTileThemeData(
        contentPadding: EdgeInsets.symmetric(
          horizontal: AppDimensions.spacingMD,
          vertical: AppDimensions.spacingSM,
        ),
        minLeadingWidth: AppDimensions.iconSizeLG,
        iconColor: AppColors.textTertiary,
        textColor: AppColors.textPrimary,
      ),

      // ===== Dialog Theme =====
      dialogTheme: DialogThemeData(
        backgroundColor: AppColors.surface,
        elevation: AppDimensions.elevationModal,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppDimensions.radiusLG),
        ),
        titleTextStyle: AppTextStyles.headline3,
        contentTextStyle: AppTextStyles.bodyMedium,
      ),

      // ===== Bottom Sheet Theme =====
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: AppColors.surface,
        elevation: AppDimensions.elevationModal,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(AppDimensions.radiusXL),
            topRight: Radius.circular(AppDimensions.radiusXL),
          ),
        ),
      ),

      // ===== Snackbar Theme =====
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.textPrimary,
        contentTextStyle: AppTextStyles.bodyMedium.copyWith(
          color: Colors.white,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppDimensions.radiusMD),
        ),
        behavior: SnackBarBehavior.floating,
        elevation: AppDimensions.elevationMedium,
      ),

      // ===== Chip Theme =====
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.surfaceVariant,
        deleteIconColor: AppColors.textTertiary,
        labelStyle: AppTextStyles.bodySmall,
        padding: const EdgeInsets.symmetric(
          horizontal: AppDimensions.spacingSM,
          vertical: AppDimensions.spacingXS,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppDimensions.radiusSM),
        ),
      ),

      // ===== Icon Theme =====
      iconTheme: const IconThemeData(
        color: AppColors.textTertiary,
        size: AppDimensions.iconSizeMD,
      ),

      // ===== Text Theme =====
      textTheme: const TextTheme(
        displayLarge: AppTextStyles.displayLarge,
        displayMedium: AppTextStyles.displayMedium,
        headlineLarge: AppTextStyles.headline1,
        headlineMedium: AppTextStyles.headline2,
        headlineSmall: AppTextStyles.headline3,
        bodyLarge: AppTextStyles.bodyLarge,
        bodyMedium: AppTextStyles.bodyMedium,
        bodySmall: AppTextStyles.bodySmall,
        labelLarge: AppTextStyles.labelSemiBold,
        labelMedium: AppTextStyles.label,
        labelSmall: AppTextStyles.caption,
      ),

      // ===== Typography =====
      fontFamily: 'SF Pro Text',

      // ===== Visual Density =====
      visualDensity: VisualDensity.adaptivePlatformDensity,
    );
  }

  // ==================== DARK THEME ====================
  static ThemeData get darkTheme {
    // TODO: Implement dark theme
    return lightTheme.copyWith(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.darkBackground,
      colorScheme: const ColorScheme.dark(
        primary: AppColors.primaryLight,
        secondary: AppColors.primary,
        surface: AppColors.darkSurface,
        background: AppColors.darkBackground,
        error: AppColors.error,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: AppColors.darkTextPrimary,
        onBackground: AppColors.darkTextPrimary,
        onError: Colors.white,
      ),
    );
  }

  // ==================== SYSTEM OVERLAY STYLES ====================
  /// Light status bar (for dark backgrounds)
  static const SystemUiOverlayStyle lightOverlay = SystemUiOverlayStyle(
    statusBarBrightness: Brightness.dark,
    statusBarIconBrightness: Brightness.light,
    statusBarColor: Colors.transparent,
    systemNavigationBarColor: Colors.transparent,
    systemNavigationBarIconBrightness: Brightness.light,
  );

  /// Dark status bar (for light backgrounds)
  static const SystemUiOverlayStyle darkOverlay = SystemUiOverlayStyle(
    statusBarBrightness: Brightness.light,
    statusBarIconBrightness: Brightness.dark,
    statusBarColor: Colors.transparent,
    systemNavigationBarColor: Colors.transparent,
    systemNavigationBarIconBrightness: Brightness.dark,
  );
}

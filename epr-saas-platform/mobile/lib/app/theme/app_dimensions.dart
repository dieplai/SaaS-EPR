/// Spacing and dimension system using 8px base grid
/// Inspired by iOS HIG and Material Design
class AppDimensions {
  // Private constructor
  AppDimensions._();

  // ==================== SPACING (8px base) ====================
  /// Micro spacing - for icon padding
  static const double spacingMicro = 4.0;

  /// XS spacing - between related elements
  static const double spacingXS = 8.0;

  /// SM spacing - compact lists
  static const double spacingSM = 12.0;

  /// MD spacing - default spacing (most common)
  static const double spacingMD = 16.0;

  /// LG spacing - section spacing
  static const double spacingLG = 24.0;

  /// XL spacing - major sections
  static const double spacingXL = 32.0;

  /// 2XL spacing - screen margins
  static const double spacing2XL = 48.0;

  /// 3XL spacing - splash screens
  static const double spacing3XL = 64.0;

  // ==================== PADDING ====================
  /// Screen horizontal padding
  static const double screenPaddingH = 16.0;

  /// Screen vertical padding
  static const double screenPaddingV = 16.0;

  /// Card padding
  static const double cardPadding = 16.0;

  /// Button padding horizontal
  static const double buttonPaddingH = 24.0;

  /// Button padding vertical
  static const double buttonPaddingV = 14.0;

  /// Input field padding
  static const double inputPaddingH = 16.0;

  /// Chat message padding
  static const double chatMessagePadding = 12.0;

  // ==================== COMPONENT HEIGHTS ====================
  /// Button height (iOS standard)
  static const double buttonHeight = 50.0;

  /// Button height small
  static const double buttonHeightSmall = 40.0;

  /// Input field height
  static const double inputHeight = 50.0;

  /// Navigation bar height (iOS)
  static const double navBarHeight = 44.0;

  /// Status bar height (approximate)
  static const double statusBarHeight = 44.0;

  /// Tab bar height (iOS)
  static const double tabBarHeight = 49.0;

  /// Tab bar safe area (home indicator)
  static const double tabBarSafeArea = 34.0;

  /// Bottom sheet header height
  static const double bottomSheetHeaderHeight = 60.0;

  // ==================== BORDER RADIUS ====================
  /// Border radius XS - for small elements
  static const double radiusXS = 4.0;

  /// Border radius SM - for buttons, inputs
  static const double radiusSM = 8.0;

  /// Border radius MD - for cards
  static const double radiusMD = 12.0;

  /// Border radius LG - for larger cards
  static const double radiusLG = 16.0;

  /// Border radius XL - for bottom sheets
  static const double radiusXL = 24.0;

  /// Border radius full - for circular elements
  static const double radiusFull = 999.0;

  // ==================== BORDER WIDTH ====================
  /// Border width thin
  static const double borderWidthThin = 0.5;

  /// Border width default
  static const double borderWidthDefault = 1.0;

  /// Border width thick (for focus states)
  static const double borderWidthThick = 2.0;

  // ==================== ICON SIZES ====================
  /// Icon size XS - for inline icons
  static const double iconSizeXS = 16.0;

  /// Icon size SM - for list items
  static const double iconSizeSM = 20.0;

  /// Icon size MD - for buttons
  static const double iconSizeMD = 24.0;

  /// Icon size LG - for tab bar
  static const double iconSizeLG = 28.0;

  /// Icon size XL - for feature cards
  static const double iconSizeXL = 48.0;

  /// Icon size 2XL - for empty states
  static const double iconSize2XL = 64.0;

  // ==================== AVATAR SIZES ====================
  /// Avatar size small
  static const double avatarSizeSM = 32.0;

  /// Avatar size medium
  static const double avatarSizeMD = 48.0;

  /// Avatar size large (profile)
  static const double avatarSizeLG = 80.0;

  /// Avatar size XL (splash)
  static const double avatarSizeXL = 120.0;

  // ==================== ELEVATION (Shadow) ====================
  /// Elevation 0 - no shadow
  static const double elevationNone = 0.0;

  /// Elevation 1 - subtle shadow
  static const double elevationLow = 1.0;

  /// Elevation 2 - card shadow
  static const double elevationMedium = 2.0;

  /// Elevation 3 - elevated card
  static const double elevationHigh = 3.0;

  /// Elevation 4 - modal shadow
  static const double elevationModal = 4.0;

  // ==================== OPACITY ====================
  /// Opacity disabled
  static const double opacityDisabled = 0.5;

  /// Opacity hover
  static const double opacityHover = 0.8;

  /// Opacity subtle
  static const double opacitySubtle = 0.6;

  // ==================== CHAT-SPECIFIC ====================
  /// Chat message max width (% of screen)
  static const double chatMessageMaxWidthRatio = 0.75;

  /// Chat bubble radius
  static const double chatBubbleRadius = 16.0;

  /// Chat bubble tail radius (corner)
  static const double chatBubbleTailRadius = 4.0;

  /// Citation card padding
  static const double citationCardPadding = 12.0;

  /// Citation card border radius
  static const double citationCardRadius = 8.0;

  // ==================== ANIMATION DURATIONS ====================
  /// Animation duration fast (button press)
  static const Duration animationFast = Duration(milliseconds: 150);

  /// Animation duration medium (screen transition)
  static const Duration animationMedium = Duration(milliseconds: 300);

  /// Animation duration slow (complex animations)
  static const Duration animationSlow = Duration(milliseconds: 500);

  /// Animation duration toast
  static const Duration animationToast = Duration(seconds: 3);

  // ==================== BREAKPOINTS ====================
  /// Small device width (iPhone SE)
  static const double breakpointSmall = 375.0;

  /// Medium device width (iPhone 13)
  static const double breakpointMedium = 390.0;

  /// Large device width (iPhone Pro Max)
  static const double breakpointLarge = 428.0;

  // ==================== ASPECT RATIOS ====================
  /// Feature card aspect ratio (square)
  static const double featureCardAspectRatio = 1.0;

  /// Banner aspect ratio
  static const double bannerAspectRatio = 16 / 9;

  /// Image aspect ratio
  static const double imageAspectRatio = 4 / 3;

  // ==================== CONSTRAINTS ====================
  /// Minimum touch target size (accessibility)
  static const double minTouchTarget = 44.0;

  /// Maximum content width (for tablets)
  static const double maxContentWidth = 600.0;

  /// List item height minimum
  static const double listItemHeightMin = 56.0;

  /// List item height with subtitle
  static const double listItemHeightSubtitle = 72.0;
}

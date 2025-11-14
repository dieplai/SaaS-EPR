import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_text_styles.dart';
import '../../app/theme/app_dimensions.dart';
import 'primary_button.dart';

/// Error view component
/// Used to display errors with retry option
class ErrorView extends StatelessWidget {
  final String message;
  final String? title;
  final VoidCallback? onRetry;
  final IconData? icon;

  const ErrorView({
    super.key,
    required this.message,
    this.title,
    this.onRetry,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppDimensions.spacingLG),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Error icon
            Icon(
              icon ?? Icons.error_outline,
              size: AppDimensions.iconSize2XL,
              color: AppColors.error,
            ),

            const SizedBox(height: AppDimensions.spacingLG),

            // Title (if provided)
            if (title != null) ...[
              Text(
                title!,
                style: AppTextStyles.headline3,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppDimensions.spacingMD),
            ],

            // Error message
            Text(
              message,
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),

            // Retry button (if onRetry provided)
            if (onRetry != null) ...[
              const SizedBox(height: AppDimensions.spacingXL),
              SizedBox(
                width: 200,
                child: PrimaryButton(
                  text: 'Thử lại',
                  onPressed: onRetry,
                  icon: Icons.refresh,
                  isFullWidth: false,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

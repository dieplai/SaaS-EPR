import 'package:flutter/material.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_text_styles.dart';
import '../../app/theme/app_dimensions.dart';

/// Empty state component
/// Used when there's no data to display
class EmptyState extends StatelessWidget {
  final String message;
  final String? title;
  final IconData? icon;
  final Widget? action;

  const EmptyState({
    super.key,
    required this.message,
    this.title,
    this.icon,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppDimensions.spacingLG),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Icon
            Icon(
              icon ?? Icons.inbox_outlined,
              size: AppDimensions.iconSize2XL,
              color: AppColors.textDisabled,
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

            // Message
            Text(
              message,
              style: AppTextStyles.bodyMedium.copyWith(
                color: AppColors.textTertiary,
              ),
              textAlign: TextAlign.center,
            ),

            // Action button (if provided)
            if (action != null) ...[
              const SizedBox(height: AppDimensions.spacingXL),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}

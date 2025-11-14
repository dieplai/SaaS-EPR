import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_text_styles.dart';
import '../../../../app/theme/app_dimensions.dart';

/// Feature grid widget
/// Grid of main app features
class FeatureGrid extends StatelessWidget {
  const FeatureGrid({super.key});

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: AppDimensions.spacingMD,
      crossAxisSpacing: AppDimensions.spacingMD,
      childAspectRatio: 1.0,
      children: [
        _FeatureCard(
          icon: Icons.chat_bubble_outline,
          iconColor: AppColors.primary,
          title: 'Tư vấn AI',
          description: 'Hỏi đáp pháp lý',
          onTap: () {
            Navigator.pushNamed(context, '/chat');
          },
        ),
        _FeatureCard(
          icon: Icons.history,
          iconColor: AppColors.success,
          title: 'Lịch sử',
          description: 'Xem lại câu hỏi',
          onTap: () {
            // Navigate to history
          },
        ),
        _FeatureCard(
          icon: Icons.card_membership,
          iconColor: AppColors.warning,
          title: 'Gói dịch vụ',
          description: 'Nâng cấp tài khoản',
          onTap: () {
            // Navigate to subscription
          },
        ),
        _FeatureCard(
          icon: Icons.help_outline,
          iconColor: AppColors.info,
          title: 'Trợ giúp',
          description: 'Hướng dẫn sử dụng',
          onTap: () {
            // Navigate to help
          },
        ),
      ],
    );
  }
}

class _FeatureCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String description;
  final VoidCallback onTap;

  const _FeatureCard({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.description,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(AppDimensions.radiusLG),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppDimensions.radiusLG),
        child: Container(
          padding: const EdgeInsets.all(AppDimensions.spacingLG),
          decoration: BoxDecoration(
            border: Border.all(
              color: AppColors.border,
              width: 1,
            ),
            borderRadius: BorderRadius.circular(AppDimensions.radiusLG),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Icon
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: iconColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(AppDimensions.radiusMD),
                ),
                child: Icon(
                  icon,
                  color: iconColor,
                  size: 28,
                ),
              ),

              const SizedBox(height: AppDimensions.spacingMD),

              // Title
              Text(
                title,
                style: AppTextStyles.bodyLargeSemiBold,
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: AppDimensions.spacingXS),

              // Description
              Text(
                description,
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.textSecondary,
                ),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

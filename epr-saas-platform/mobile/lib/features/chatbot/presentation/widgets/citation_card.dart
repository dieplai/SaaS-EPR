import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_text_styles.dart';
import '../../../../app/theme/app_dimensions.dart';
import '../../domain/entities/citation.dart';

/// Citation card widget
/// Displays legal document citation (Perplexity-style)
class CitationCard extends StatelessWidget {
  final Citation citation;
  final VoidCallback? onTap;

  const CitationCard({
    super.key,
    required this.citation,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppDimensions.radiusMD),
        child: Container(
          padding: const EdgeInsets.all(AppDimensions.spacingMD),
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border.all(
              color: AppColors.border,
              width: 1,
            ),
            borderRadius: BorderRadius.circular(AppDimensions.radiusMD),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Document type and number
              Row(
                children: [
                  Text(
                    citation.documentType.icon,
                    style: const TextStyle(fontSize: 16),
                  ),
                  const SizedBox(width: AppDimensions.spacingXS),
                  Expanded(
                    child: Text(
                      citation.formattedReference,
                      style: AppTextStyles.bodySmallSemiBold.copyWith(
                        color: AppColors.primary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  // Relevance score
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppDimensions.spacingXS,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: _getRelevanceColor().withOpacity(0.1),
                      borderRadius: BorderRadius.circular(AppDimensions.radiusSM),
                    ),
                    child: Text(
                      '${(citation.relevanceScore * 100).toInt()}%',
                      style: AppTextStyles.caption.copyWith(
                        color: _getRelevanceColor(),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: AppDimensions.spacingXS),

              // Title
              Text(
                citation.title,
                style: AppTextStyles.bodyMedium.copyWith(
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),

              const SizedBox(height: AppDimensions.spacingXS),

              // Excerpt
              Text(
                citation.shortExcerpt,
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.textSecondary,
                ),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),

              // Issue info
              if (citation.formattedIssueInfo != null) ...[
                const SizedBox(height: AppDimensions.spacingXS),
                Row(
                  children: [
                    Icon(
                      Icons.calendar_today,
                      size: 12,
                      color: AppColors.textTertiary,
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        citation.formattedIssueInfo!,
                        style: AppTextStyles.caption.copyWith(
                          color: AppColors.textTertiary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Color _getRelevanceColor() {
    if (citation.relevanceScore >= 0.8) {
      return AppColors.success;
    } else if (citation.relevanceScore >= 0.5) {
      return AppColors.warning;
    } else {
      return AppColors.textSecondary;
    }
  }
}

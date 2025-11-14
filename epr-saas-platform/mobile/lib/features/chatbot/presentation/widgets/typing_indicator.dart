import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_dimensions.dart';

/// Typing indicator widget
/// Shows animated dots when AI is typing
class TypingIndicator extends StatefulWidget {
  const TypingIndicator({super.key});

  @override
  State<TypingIndicator> createState() => _TypingIndicatorState();
}

class _TypingIndicatorState extends State<TypingIndicator>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppDimensions.screenPaddingH,
        vertical: AppDimensions.spacingMD,
      ),
      child: Row(
        children: [
          // AI avatar
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(AppDimensions.radiusFull),
            ),
            child: const Icon(
              Icons.smart_toy_outlined,
              color: Colors.white,
              size: 20,
            ),
          ),

          const SizedBox(width: AppDimensions.spacingMD),

          // Typing animation
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppDimensions.spacingLG,
              vertical: AppDimensions.spacingMD,
            ),
            decoration: BoxDecoration(
              color: AppColors.aiMessageBg,
              borderRadius: BorderRadius.circular(AppDimensions.radiusLG),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildDot(0),
                const SizedBox(width: 4),
                _buildDot(1),
                const SizedBox(width: 4),
                _buildDot(2),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDot(int index) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        // Calculate delay for each dot
        final delay = index * 0.2;
        final value = (_controller.value - delay).clamp(0.0, 1.0);

        // Create bouncing animation
        final scale = 1.0 + (0.5 * (value < 0.5 ? value * 2 : (1 - value) * 2));

        return Transform.scale(
          scale: scale,
          child: Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: AppColors.textSecondary,
              borderRadius: BorderRadius.circular(AppDimensions.radiusFull),
            ),
          ),
        );
      },
    );
  }
}

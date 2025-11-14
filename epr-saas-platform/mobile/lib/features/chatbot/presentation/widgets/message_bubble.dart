import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_text_styles.dart';
import '../../../../app/theme/app_dimensions.dart';
import '../../domain/entities/chat_message.dart';
import '../../domain/entities/citation.dart';
import 'citation_card.dart';

/// Message bubble widget
/// Displays a single chat message (user or AI)
class MessageBubble extends StatelessWidget {
  final ChatMessage message;
  final List<Citation>? citations;

  const MessageBubble({
    super.key,
    required this.message,
    this.citations,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppDimensions.spacingMD,
        vertical: AppDimensions.spacingSM,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Flexible(
            child: Column(
              crossAxisAlignment: message.isUserMessage
                  ? CrossAxisAlignment.end
                  : CrossAxisAlignment.start,
              children: [
                _buildMessageContent(),
                if (message.isAiMessage && citations != null && citations!.isNotEmpty) ...[
                  const SizedBox(height: AppDimensions.spacingMD),
                  _buildCitations(),
                ],
                const SizedBox(height: AppDimensions.spacingXS),
                _buildTimestamp(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageContent() {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppDimensions.spacingMD,
        vertical: AppDimensions.spacingSM,
      ),
      decoration: BoxDecoration(
        color: message.isUserMessage
            ? AppColors.userMessageBg
            : AppColors.aiMessageBg,
        borderRadius: BorderRadius.circular(12),
      ),
      child: SelectableText(
        message.content,
        style: (message.isUserMessage
                ? AppTextStyles.chatUserMessage
                : AppTextStyles.chatAiMessage)
            .copyWith(
          fontSize: 14,
          fontWeight: FontWeight.w500, // Bold để cảm giác to
          height: 1.4,
        ),
      ),
    );
  }

  Widget _buildCitations() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Tài liệu tham khảo:',
          style: AppTextStyles.caption.copyWith(
            color: AppColors.textSecondary,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: AppDimensions.spacingXS),
        ...citations!.map((citation) => Padding(
              padding: const EdgeInsets.only(bottom: AppDimensions.spacingXS),
              child: CitationCard(citation: citation),
            )),
      ],
    );
  }

  Widget _buildTimestamp() {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final messageDate = DateTime(
      message.createdAt.year,
      message.createdAt.month,
      message.createdAt.day,
    );

    String timeText;
    if (messageDate == today) {
      timeText = '${message.createdAt.hour.toString().padLeft(2, '0')}:'
          '${message.createdAt.minute.toString().padLeft(2, '0')}';
    } else {
      timeText = '${message.createdAt.day}/${message.createdAt.month} '
          '${message.createdAt.hour.toString().padLeft(2, '0')}:'
          '${message.createdAt.minute.toString().padLeft(2, '0')}';
    }

    return Text(
      timeText,
      style: AppTextStyles.caption.copyWith(
        color: AppColors.textTertiary,
      ),
    );
  }
}

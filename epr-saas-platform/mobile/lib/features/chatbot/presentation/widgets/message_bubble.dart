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
      padding: const EdgeInsets.only(bottom: AppDimensions.spacingLG),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (message.isAiMessage) ...[
            _buildAvatar(),
            const SizedBox(width: AppDimensions.spacingMD),
          ],
          Expanded(
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
          if (message.isUserMessage) ...[
            const SizedBox(width: AppDimensions.spacingMD),
            _buildUserAvatar(),
          ],
        ],
      ),
    );
  }

  Widget _buildAvatar() {
    return Container(
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
    );
  }

  Widget _buildUserAvatar() {
    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        color: AppColors.textSecondary,
        borderRadius: BorderRadius.circular(AppDimensions.radiusFull),
      ),
      child: const Icon(
        Icons.person_outline,
        color: Colors.white,
        size: 20,
      ),
    );
  }

  Widget _buildMessageContent() {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppDimensions.spacingLG,
        vertical: AppDimensions.spacingMD,
      ),
      decoration: BoxDecoration(
        color: message.isUserMessage
            ? AppColors.userMessageBg
            : AppColors.aiMessageBg,
        borderRadius: BorderRadius.circular(AppDimensions.radiusLG),
      ),
      child: SelectableText(
        message.content,
        style: message.isUserMessage
            ? AppTextStyles.chatUserMessage
            : AppTextStyles.chatAiMessage,
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

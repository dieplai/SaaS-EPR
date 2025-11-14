import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_text_styles.dart';
import '../../../../app/theme/app_dimensions.dart';
import '../../../../shared/widgets/empty_state.dart';
import '../../../../shared/widgets/loading_indicator.dart';
import '../../../chatbot/presentation/providers/chatbot_provider.dart';
import '../../../chatbot/domain/entities/conversation.dart';

/// Recent conversations list widget
/// Shows user's recent conversations
class RecentConversationsList extends StatelessWidget {
  const RecentConversationsList({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<ChatbotProvider>(
      builder: (context, provider, child) {
        // Loading state
        if (provider.isLoadingConversations && provider.conversations.isEmpty) {
          return const Center(
            child: Padding(
              padding: EdgeInsets.all(AppDimensions.spacingXL),
              child: LoadingIndicator(),
            ),
          );
        }

        // Empty state
        if (provider.conversations.isEmpty) {
          return const EmptyState(
            icon: Icons.chat_bubble_outline,
            title: 'Chưa có cuộc trò chuyện',
            message: 'Bắt đầu cuộc trò chuyện đầu tiên của bạn',
          );
        }

        // Show first 5 conversations
        final recentConversations = provider.conversations.take(5).toList();

        return Column(
          children: recentConversations
              .map((conversation) => _ConversationListItem(
                    conversation: conversation,
                    onTap: () {
                      provider.setCurrentConversation(conversation);
                      Navigator.pushNamed(context, '/chat');
                    },
                  ))
              .toList(),
        );
      },
    );
  }
}

class _ConversationListItem extends StatelessWidget {
  final Conversation conversation;
  final VoidCallback onTap;

  const _ConversationListItem({
    required this.conversation,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(AppDimensions.spacingMD),
          margin: const EdgeInsets.only(bottom: AppDimensions.spacingMD),
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border.all(
              color: AppColors.border,
              width: 1,
            ),
            borderRadius: BorderRadius.circular(AppDimensions.radiusMD),
          ),
          child: Row(
            children: [
              // Icon
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(AppDimensions.radiusMD),
                ),
                child: Icon(
                  Icons.chat_bubble_outline,
                  color: AppColors.primary,
                  size: 20,
                ),
              ),

              const SizedBox(width: AppDimensions.spacingMD),

              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title
                    Text(
                      conversation.shortTitle,
                      style: AppTextStyles.bodyMediumSemiBold,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),

                    const SizedBox(height: 4),

                    // Last message or message count
                    Text(
                      conversation.lastMessage ?? conversation.messageCountText,
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.textSecondary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),

              const SizedBox(width: AppDimensions.spacingMD),

              // Time
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    conversation.formattedUpdatedTime,
                    style: AppTextStyles.caption.copyWith(
                      color: AppColors.textTertiary,
                    ),
                  ),
                  if (conversation.isPinned)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Icon(
                        Icons.push_pin,
                        size: 14,
                        color: AppColors.primary,
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_text_styles.dart';
import '../../../../app/theme/app_dimensions.dart';
import '../../../../shared/widgets/custom_app_bar.dart';
import '../../../../shared/widgets/loading_indicator.dart';
import '../../../../shared/widgets/empty_state.dart';
import '../providers/chatbot_provider.dart';
import '../widgets/message_bubble.dart';
import '../widgets/chat_input_field.dart';
import '../widgets/typing_indicator.dart';

/// Chat screen
/// Main chatbot conversation interface (ChatGPT/Claude-style)
class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _scrollController = ScrollController();
  final _messageController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadChatHistory();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _loadChatHistory() async {
    final provider = context.read<ChatbotProvider>();
    if (provider.hasCurrentConversation) {
      await provider.getChatHistory(
        conversationId: provider.currentConversation!.id,
      );
    }
  }

  Future<void> _sendMessage() async {
    final message = _messageController.text.trim();
    if (message.isEmpty) return;

    // Clear input immediately
    _messageController.clear();

    // Send query
    final provider = context.read<ChatbotProvider>();
    final success = await provider.sendQuery(query: message);

    if (success) {
      // Scroll to bottom
      _scrollToBottom();
    }
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      Future.delayed(const Duration(milliseconds: 100), () {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: AppDimensions.animationMedium,
          curve: Curves.easeOut,
        );
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Messages list or empty state
            Expanded(
              child: _buildMessagesList(),
            ),

            // Typing indicator
            Consumer<ChatbotProvider>(
              builder: (context, provider, child) {
                if (provider.isStreaming) {
                  return const Padding(
                    padding: EdgeInsets.all(16),
                    child: TypingIndicator(),
                  );
                }
                return const SizedBox.shrink();
              },
            ),

            // Input field - Perplexity Pro style
            _buildInputField(),
          ],
        ),
      ),
    );
  }

  Widget _buildMessagesList() {
    return Consumer<ChatbotProvider>(
      builder: (context, provider, child) {
        // Loading state
        if (provider.isLoadingHistory && !provider.hasMessages) {
          return const Center(child: LoadingIndicator());
        }

        // Empty state - Show EPR Legal logo
        if (!provider.hasMessages && !provider.isSending) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                RichText(
                  text: TextSpan(
                    style: TextStyle(
                      fontSize: 36,
                      fontWeight: FontWeight.w400,
                      color: AppColors.textSecondary,
                    ),
                    children: [
                      const TextSpan(text: 'EPR '),
                      TextSpan(
                        text: 'Legal',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'AI Tư vấn pháp lý',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.textTertiary,
                  ),
                ),
              ],
            ),
          );
        }

        // Messages
        return ListView.builder(
          controller: _scrollController,
          padding: const EdgeInsets.only(
            top: AppDimensions.spacingMD,
            bottom: AppDimensions.spacingMD,
          ),
          itemCount: provider.messages.length,
          itemBuilder: (context, index) {
            final message = provider.messages[index];
            final citations = provider.getCitationsForMessage(message.id);

            return MessageBubble(
              message: message,
              citations: citations,
            );
          },
        );
      },
    );
  }

  Widget _buildInputField() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            // Input field
            Expanded(
              child: TextField(
                controller: _messageController,
                decoration: InputDecoration(
                  hintText: 'Hỏi về pháp lý EPR...',
                  hintStyle: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.textTertiary,
                  ),
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  disabledBorder: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                ),
                style: AppTextStyles.bodyMedium,
                onSubmitted: (_) => _sendMessage(),
              ),
            ),

            // Send button
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                ),
                child: IconButton(
                  icon: const Icon(Icons.arrow_upward),
                  color: Colors.white,
                  iconSize: 20,
                  onPressed: _sendMessage,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showOptionsMenu(BuildContext context) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ListTile(
            leading: const Icon(Icons.share),
            title: const Text('Chia sẻ cuộc trò chuyện'),
            onTap: () {
              Navigator.pop(context);
              // TODO: Implement share functionality
            },
          ),
          ListTile(
            leading: const Icon(Icons.archive),
            title: const Text('Lưu trữ cuộc trò chuyện'),
            onTap: () {
              Navigator.pop(context);
              // TODO: Implement archive functionality
            },
          ),
          ListTile(
            leading: const Icon(Icons.delete, color: AppColors.error),
            title: const Text(
              'Xóa cuộc trò chuyện',
              style: TextStyle(color: AppColors.error),
            ),
            onTap: () {
              Navigator.pop(context);
              _confirmDelete(context);
            },
          ),
        ],
      ),
    );
  }

  void _confirmDelete(BuildContext context) {
    final provider = context.read<ChatbotProvider>();
    final conversationId = provider.currentConversation?.id;

    if (conversationId == null) return;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xóa cuộc trò chuyện'),
        content: const Text(
          'Bạn có chắc chắn muốn xóa cuộc trò chuyện này? '
          'Hành động này không thể hoàn tác.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              final success = await provider.deleteConversation(
                conversationId: conversationId,
              );
              if (success && context.mounted) {
                Navigator.pop(context);
              }
            },
            child: const Text(
              'Xóa',
              style: TextStyle(color: AppColors.error),
            ),
          ),
        ],
      ),
    );
  }
}

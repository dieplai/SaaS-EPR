import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/chat_message.dart';
import '../repositories/chatbot_repository.dart';

/// Get chat history use case
/// Business logic for retrieving chat history
class GetChatHistoryUsecase {
  final ChatbotRepository repository;

  GetChatHistoryUsecase(this.repository);

  /// Execute the use case
  /// [conversationId] - ID of the conversation
  /// [limit] - Optional limit on number of messages to retrieve
  /// [beforeMessageId] - Optional message ID for pagination
  Future<Either<Failure, List<ChatMessage>>> call({
    required String conversationId,
    int? limit,
    String? beforeMessageId,
  }) async {
    // Validate conversation ID
    if (conversationId.isEmpty) {
      return const Left(
        ValidationFailure('ID cuộc trò chuyện không được để trống'),
      );
    }

    // Validate limit if provided
    if (limit != null && limit <= 0) {
      return const Left(
        ValidationFailure('Giới hạn phải lớn hơn 0'),
      );
    }

    // Limit max messages to 100 per request
    final effectiveLimit = limit != null && limit > 100 ? 100 : limit;

    // Call repository
    return await repository.getChatHistory(
      conversationId: conversationId,
      limit: effectiveLimit,
      beforeMessageId: beforeMessageId,
    );
  }
}

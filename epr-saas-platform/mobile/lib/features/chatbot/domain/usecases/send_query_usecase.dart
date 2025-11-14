import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/chat_message.dart';
import '../repositories/chatbot_repository.dart';

/// Send query to AI chatbot use case
/// Business logic for sending user queries
class SendQueryUsecase {
  final ChatbotRepository repository;

  SendQueryUsecase(this.repository);

  /// Execute the use case
  /// [conversationId] - ID of the conversation
  /// [query] - User's question/query
  /// [onStreamChunk] - Optional callback for streaming responses
  Future<Either<Failure, ChatMessage>> call({
    required String conversationId,
    required String query,
    Function(String chunk)? onStreamChunk,
  }) async {
    // Validate conversation ID
    if (conversationId.isEmpty) {
      return const Left(
        ValidationFailure('ID cuộc trò chuyện không được để trống'),
      );
    }

    // Validate query
    if (query.trim().isEmpty) {
      return const Left(
        ValidationFailure('Câu hỏi không được để trống'),
      );
    }

    // Validate query length (max 2000 characters)
    if (query.trim().length > 2000) {
      return const Left(
        ValidationFailure('Câu hỏi không được vượt quá 2000 ký tự'),
      );
    }

    // Clean and normalize query
    final cleanQuery = query.trim();

    // Call repository
    return await repository.sendQuery(
      conversationId: conversationId,
      query: cleanQuery,
      onStreamChunk: onStreamChunk,
    );
  }
}

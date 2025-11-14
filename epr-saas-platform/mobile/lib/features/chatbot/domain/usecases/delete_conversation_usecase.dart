import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../repositories/chatbot_repository.dart';

/// Delete conversation use case
/// Business logic for deleting conversations
class DeleteConversationUsecase {
  final ChatbotRepository repository;

  DeleteConversationUsecase(this.repository);

  /// Execute the use case
  /// [conversationId] - ID of the conversation to delete
  Future<Either<Failure, void>> call({
    required String conversationId,
  }) async {
    // Validate conversation ID
    if (conversationId.isEmpty) {
      return const Left(
        ValidationFailure('ID cuộc trò chuyện không được để trống'),
      );
    }

    // Call repository
    return await repository.deleteConversation(
      conversationId: conversationId,
    );
  }
}

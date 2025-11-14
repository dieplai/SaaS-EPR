import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/conversation.dart';
import '../repositories/chatbot_repository.dart';

/// Get conversations use case
/// Business logic for retrieving user's conversations
class GetConversationsUsecase {
  final ChatbotRepository repository;

  GetConversationsUsecase(this.repository);

  /// Execute the use case
  /// [includeArchived] - Whether to include archived conversations
  Future<Either<Failure, List<Conversation>>> call({
    bool includeArchived = false,
  }) async {
    // Call repository
    final result = await repository.getConversations(
      includeArchived: includeArchived,
    );

    // Sort conversations by updated date (newest first)
    return result.fold(
      (failure) => Left(failure),
      (conversations) {
        final sorted = List<Conversation>.from(conversations);
        sorted.sort((a, b) {
          // Pinned conversations always on top
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;

          // Then sort by updated date
          return b.updatedAt.compareTo(a.updatedAt);
        });
        return Right(sorted);
      },
    );
  }
}

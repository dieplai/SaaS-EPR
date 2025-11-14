import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/conversation.dart';
import '../repositories/chatbot_repository.dart';

/// Create conversation use case
/// Business logic for creating new conversations
class CreateConversationUsecase {
  final ChatbotRepository repository;

  CreateConversationUsecase(this.repository);

  /// Execute the use case
  /// [title] - Conversation title
  /// [tags] - Optional tags for categorization
  Future<Either<Failure, Conversation>> call({
    required String title,
    List<String>? tags,
  }) async {
    // Validate title
    if (title.trim().isEmpty) {
      return const Left(
        ValidationFailure('Tiêu đề cuộc trò chuyện không được để trống'),
      );
    }

    // Validate title length (max 200 characters)
    if (title.trim().length > 200) {
      return const Left(
        ValidationFailure('Tiêu đề không được vượt quá 200 ký tự'),
      );
    }

    // Validate tags if provided
    if (tags != null && tags.length > 10) {
      return const Left(
        ValidationFailure('Không được có quá 10 thẻ'),
      );
    }

    // Clean title
    final cleanTitle = title.trim();

    // Clean tags
    final cleanTags = tags
        ?.where((tag) => tag.trim().isNotEmpty)
        .map((tag) => tag.trim())
        .toList();

    // Call repository
    return await repository.createConversation(
      title: cleanTitle,
      tags: cleanTags,
    );
  }
}

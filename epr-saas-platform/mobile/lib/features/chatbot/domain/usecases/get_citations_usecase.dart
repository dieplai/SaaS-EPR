import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/citation.dart';
import '../repositories/chatbot_repository.dart';

/// Get citations use case
/// Business logic for retrieving legal document citations
class GetCitationsUsecase {
  final ChatbotRepository repository;

  GetCitationsUsecase(this.repository);

  /// Execute the use case
  /// [messageId] - ID of the AI message containing citations
  Future<Either<Failure, List<Citation>>> call({
    required String messageId,
  }) async {
    // Validate message ID
    if (messageId.isEmpty) {
      return const Left(
        ValidationFailure('ID tin nhắn không được để trống'),
      );
    }

    // Call repository
    final result = await repository.getCitationsForMessage(
      messageId: messageId,
    );

    // Sort citations by relevance score (highest first)
    return result.fold(
      (failure) => Left(failure),
      (citations) {
        final sorted = List<Citation>.from(citations);
        sorted.sort((a, b) => b.relevanceScore.compareTo(a.relevanceScore));
        return Right(sorted);
      },
    );
  }
}

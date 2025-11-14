import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/utils/logger.dart';
import '../../domain/entities/chat_message.dart';
import '../../domain/entities/citation.dart';
import '../../domain/entities/conversation.dart';
import '../../domain/repositories/chatbot_repository.dart';
import '../datasources/chatbot_remote_datasource.dart';

/// Chatbot repository implementation
/// Implements the ChatbotRepository interface with error handling
class ChatbotRepositoryImpl implements ChatbotRepository {
  final ChatbotRemoteDatasource remoteDatasource;
  final _logger = Logger('ChatbotRepositoryImpl');

  ChatbotRepositoryImpl({
    required this.remoteDatasource,
  });

  // ==================== CONVERSATIONS ====================

  @override
  Future<Either<Failure, Conversation>> createConversation({
    required String title,
    List<String>? tags,
  }) async {
    try {
      final conversation = await remoteDatasource.createConversation(
        title: title,
        tags: tags,
      );
      return Right(conversation.toEntity());
    } on NetworkException catch (e) {
      _logger.error('Network error: ${e.message}');
      return Left(NetworkFailure(e.message));
    } on ValidationException catch (e) {
      _logger.error('Validation error: ${e.message}');
      return Left(ValidationFailure(e.message, e.errors));
    } on AuthenticationException catch (e) {
      _logger.error('Authentication error: ${e.message}');
      return Left(AuthenticationFailure(e.message));
    } on AuthorizationException catch (e) {
      _logger.error('Authorization error: ${e.message}');
      return Left(AuthorizationFailure(e.message));
    } on ServerException catch (e) {
      _logger.error('Server error: ${e.message}');
      return Left(ServerFailure(e.message));
    } catch (e) {
      _logger.error('Unknown error: $e');
      return Left(GenericFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<Conversation>>> getConversations({
    bool includeArchived = false,
  }) async {
    try {
      final conversations = await remoteDatasource.getConversations(
        includeArchived: includeArchived,
      );
      return Right(conversations.map((c) => c.toEntity()).toList());
    } on NetworkException catch (e) {
      _logger.error('Network error: ${e.message}');
      return Left(NetworkFailure(e.message));
    } on AuthenticationException catch (e) {
      _logger.error('Authentication error: ${e.message}');
      return Left(AuthenticationFailure(e.message));
    } on ServerException catch (e) {
      _logger.error('Server error: ${e.message}');
      return Left(ServerFailure(e.message));
    } catch (e) {
      _logger.error('Unknown error: $e');
      return Left(GenericFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, Conversation>> getConversationById({
    required String conversationId,
  }) async {
    try {
      final conversation = await remoteDatasource.getConversationById(
        conversationId: conversationId,
      );
      return Right(conversation.toEntity());
    } on NetworkException catch (e) {
      _logger.error('Network error: ${e.message}');
      return Left(NetworkFailure(e.message));
    } on NotFoundException catch (e) {
      _logger.error('Not found: ${e.message}');
      return Left(NotFoundFailure(e.message));
    } on AuthenticationException catch (e) {
      _logger.error('Authentication error: ${e.message}');
      return Left(AuthenticationFailure(e.message));
    } on ServerException catch (e) {
      _logger.error('Server error: ${e.message}');
      return Left(ServerFailure(e.message));
    } catch (e) {
      _logger.error('Unknown error: $e');
      return Left(GenericFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, Conversation>> updateConversation({
    required String conversationId,
    String? title,
    bool? isArchived,
    bool? isPinned,
    List<String>? tags,
  }) async {
    try {
      final conversation = await remoteDatasource.updateConversation(
        conversationId: conversationId,
        title: title,
        isArchived: isArchived,
        isPinned: isPinned,
        tags: tags,
      );
      return Right(conversation.toEntity());
    } on NetworkException catch (e) {
      _logger.error('Network error: ${e.message}');
      return Left(NetworkFailure(e.message));
    } on ValidationException catch (e) {
      _logger.error('Validation error: ${e.message}');
      return Left(ValidationFailure(e.message, e.errors));
    } on NotFoundException catch (e) {
      _logger.error('Not found: ${e.message}');
      return Left(NotFoundFailure(e.message));
    } on AuthenticationException catch (e) {
      _logger.error('Authentication error: ${e.message}');
      return Left(AuthenticationFailure(e.message));
    } on ServerException catch (e) {
      _logger.error('Server error: ${e.message}');
      return Left(ServerFailure(e.message));
    } catch (e) {
      _logger.error('Unknown error: $e');
      return Left(GenericFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> deleteConversation({
    required String conversationId,
  }) async {
    try {
      await remoteDatasource.deleteConversation(
        conversationId: conversationId,
      );
      return const Right(null);
    } on NetworkException catch (e) {
      _logger.error('Network error: ${e.message}');
      return Left(NetworkFailure(e.message));
    } on NotFoundException catch (e) {
      _logger.error('Not found: ${e.message}');
      return Left(NotFoundFailure(e.message));
    } on AuthenticationException catch (e) {
      _logger.error('Authentication error: ${e.message}');
      return Left(AuthenticationFailure(e.message));
    } on ServerException catch (e) {
      _logger.error('Server error: ${e.message}');
      return Left(ServerFailure(e.message));
    } catch (e) {
      _logger.error('Unknown error: $e');
      return Left(GenericFailure(e.toString()));
    }
  }

  // ==================== MESSAGES ====================

  @override
  Future<Either<Failure, ChatMessage>> sendQuery({
    required String conversationId,
    required String query,
    Function(String chunk)? onStreamChunk,
  }) async {
    try {
      final response = await remoteDatasource.sendQuery(
        conversationId: conversationId,
        query: query,
        onStreamChunk: onStreamChunk,
      );
      return Right(response.message.toEntity());
    } on NetworkException catch (e) {
      _logger.error('Network error: ${e.message}');
      return Left(NetworkFailure(e.message));
    } on ValidationException catch (e) {
      _logger.error('Validation error: ${e.message}');
      return Left(ValidationFailure(e.message, e.errors));
    } on RateLimitException catch (e) {
      _logger.error('Rate limit: ${e.message}');
      return Left(RateLimitFailure(e.message));
    } on AuthenticationException catch (e) {
      _logger.error('Authentication error: ${e.message}');
      return Left(AuthenticationFailure(e.message));
    } on ServerException catch (e) {
      _logger.error('Server error: ${e.message}');
      return Left(ServerFailure(e.message));
    } on TimeoutException catch (e) {
      _logger.error('Timeout: ${e.message}');
      return Left(TimeoutFailure(e.message));
    } catch (e) {
      _logger.error('Unknown error: $e');
      return Left(GenericFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<ChatMessage>>> getChatHistory({
    required String conversationId,
    int? limit,
    String? beforeMessageId,
  }) async {
    try {
      final messages = await remoteDatasource.getChatHistory(
        conversationId: conversationId,
        limit: limit,
        beforeMessageId: beforeMessageId,
      );
      return Right(messages.map((m) => m.toEntity()).toList());
    } on NetworkException catch (e) {
      _logger.error('Network error: ${e.message}');
      return Left(NetworkFailure(e.message));
    } on NotFoundException catch (e) {
      _logger.error('Not found: ${e.message}');
      return Left(NotFoundFailure(e.message));
    } on AuthenticationException catch (e) {
      _logger.error('Authentication error: ${e.message}');
      return Left(AuthenticationFailure(e.message));
    } on ServerException catch (e) {
      _logger.error('Server error: ${e.message}');
      return Left(ServerFailure(e.message));
    } catch (e) {
      _logger.error('Unknown error: $e');
      return Left(GenericFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, ChatMessage>> getMessageById({
    required String messageId,
  }) async {
    try {
      final message = await remoteDatasource.getMessageById(
        messageId: messageId,
      );
      return Right(message.toEntity());
    } on NetworkException catch (e) {
      _logger.error('Network error: ${e.message}');
      return Left(NetworkFailure(e.message));
    } on NotFoundException catch (e) {
      _logger.error('Not found: ${e.message}');
      return Left(NotFoundFailure(e.message));
    } on AuthenticationException catch (e) {
      _logger.error('Authentication error: ${e.message}');
      return Left(AuthenticationFailure(e.message));
    } on ServerException catch (e) {
      _logger.error('Server error: ${e.message}');
      return Left(ServerFailure(e.message));
    } catch (e) {
      _logger.error('Unknown error: $e');
      return Left(GenericFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> deleteMessage({
    required String messageId,
  }) async {
    try {
      await remoteDatasource.deleteMessage(messageId: messageId);
      return const Right(null);
    } on NetworkException catch (e) {
      _logger.error('Network error: ${e.message}');
      return Left(NetworkFailure(e.message));
    } on NotFoundException catch (e) {
      _logger.error('Not found: ${e.message}');
      return Left(NotFoundFailure(e.message));
    } on AuthenticationException catch (e) {
      _logger.error('Authentication error: ${e.message}');
      return Left(AuthenticationFailure(e.message));
    } on ServerException catch (e) {
      _logger.error('Server error: ${e.message}');
      return Left(ServerFailure(e.message));
    } catch (e) {
      _logger.error('Unknown error: $e');
      return Left(GenericFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, ChatMessage>> regenerateResponse({
    required String messageId,
    Function(String chunk)? onStreamChunk,
  }) async {
    try {
      final response = await remoteDatasource.regenerateResponse(
        messageId: messageId,
        onStreamChunk: onStreamChunk,
      );
      return Right(response.message.toEntity());
    } on NetworkException catch (e) {
      _logger.error('Network error: ${e.message}');
      return Left(NetworkFailure(e.message));
    } on NotFoundException catch (e) {
      _logger.error('Not found: ${e.message}');
      return Left(NotFoundFailure(e.message));
    } on RateLimitException catch (e) {
      _logger.error('Rate limit: ${e.message}');
      return Left(RateLimitFailure(e.message));
    } on AuthenticationException catch (e) {
      _logger.error('Authentication error: ${e.message}');
      return Left(AuthenticationFailure(e.message));
    } on ServerException catch (e) {
      _logger.error('Server error: ${e.message}');
      return Left(ServerFailure(e.message));
    } catch (e) {
      _logger.error('Unknown error: $e');
      return Left(GenericFailure(e.toString()));
    }
  }

  // ==================== CITATIONS ====================

  @override
  Future<Either<Failure, List<Citation>>> getCitationsForMessage({
    required String messageId,
  }) async {
    try {
      final citations = await remoteDatasource.getCitationsForMessage(
        messageId: messageId,
      );
      return Right(citations.map((c) => c.toEntity()).toList());
    } on NetworkException catch (e) {
      _logger.error('Network error: ${e.message}');
      return Left(NetworkFailure(e.message));
    } on NotFoundException catch (e) {
      _logger.error('Not found: ${e.message}');
      return Left(NotFoundFailure(e.message));
    } on AuthenticationException catch (e) {
      _logger.error('Authentication error: ${e.message}');
      return Left(AuthenticationFailure(e.message));
    } on ServerException catch (e) {
      _logger.error('Server error: ${e.message}');
      return Left(ServerFailure(e.message));
    } catch (e) {
      _logger.error('Unknown error: $e');
      return Left(GenericFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, Citation>> getCitationById({
    required String citationId,
  }) async {
    try {
      final citation = await remoteDatasource.getCitationById(
        citationId: citationId,
      );
      return Right(citation.toEntity());
    } on NetworkException catch (e) {
      _logger.error('Network error: ${e.message}');
      return Left(NetworkFailure(e.message));
    } on NotFoundException catch (e) {
      _logger.error('Not found: ${e.message}');
      return Left(NotFoundFailure(e.message));
    } on AuthenticationException catch (e) {
      _logger.error('Authentication error: ${e.message}');
      return Left(AuthenticationFailure(e.message));
    } on ServerException catch (e) {
      _logger.error('Server error: ${e.message}');
      return Left(ServerFailure(e.message));
    } catch (e) {
      _logger.error('Unknown error: $e');
      return Left(GenericFailure(e.toString()));
    }
  }

  // ==================== SEARCH & HISTORY ====================

  @override
  Future<Either<Failure, List<Conversation>>> searchConversations({
    required String query,
  }) async {
    try {
      final conversations = await remoteDatasource.searchConversations(
        query: query,
      );
      return Right(conversations.map((c) => c.toEntity()).toList());
    } on NetworkException catch (e) {
      _logger.error('Network error: ${e.message}');
      return Left(NetworkFailure(e.message));
    } on AuthenticationException catch (e) {
      _logger.error('Authentication error: ${e.message}');
      return Left(AuthenticationFailure(e.message));
    } on ServerException catch (e) {
      _logger.error('Server error: ${e.message}');
      return Left(ServerFailure(e.message));
    } catch (e) {
      _logger.error('Unknown error: $e');
      return Left(GenericFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, Map<String, dynamic>>> getConversationStats() async {
    try {
      final stats = await remoteDatasource.getConversationStats();
      return Right(stats);
    } on NetworkException catch (e) {
      _logger.error('Network error: ${e.message}');
      return Left(NetworkFailure(e.message));
    } on AuthenticationException catch (e) {
      _logger.error('Authentication error: ${e.message}');
      return Left(AuthenticationFailure(e.message));
    } on ServerException catch (e) {
      _logger.error('Server error: ${e.message}');
      return Left(ServerFailure(e.message));
    } catch (e) {
      _logger.error('Unknown error: $e');
      return Left(GenericFailure(e.toString()));
    }
  }
}

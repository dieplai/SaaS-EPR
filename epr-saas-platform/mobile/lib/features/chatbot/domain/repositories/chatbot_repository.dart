import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/chat_message.dart';
import '../entities/citation.dart';
import '../entities/conversation.dart';

/// Chatbot repository interface
/// Defines the contract for chatbot data operations
abstract class ChatbotRepository {
  // ==================== CONVERSATIONS ====================

  /// Create a new conversation
  /// Returns the created conversation or failure
  Future<Either<Failure, Conversation>> createConversation({
    required String title,
    List<String>? tags,
  });

  /// Get all conversations for current user
  /// Returns list of conversations or failure
  Future<Either<Failure, List<Conversation>>> getConversations({
    bool includeArchived = false,
  });

  /// Get a specific conversation by ID
  /// Returns conversation or failure
  Future<Either<Failure, Conversation>> getConversationById({
    required String conversationId,
  });

  /// Update conversation metadata
  /// Returns updated conversation or failure
  Future<Either<Failure, Conversation>> updateConversation({
    required String conversationId,
    String? title,
    bool? isArchived,
    bool? isPinned,
    List<String>? tags,
  });

  /// Delete a conversation
  /// Returns void or failure
  Future<Either<Failure, void>> deleteConversation({
    required String conversationId,
  });

  // ==================== MESSAGES ====================

  /// Send a query to the AI chatbot
  /// Returns AI response message with citations or failure
  /// Supports streaming responses
  Future<Either<Failure, ChatMessage>> sendQuery({
    required String conversationId,
    required String query,
    Function(String chunk)? onStreamChunk,
  });

  /// Get chat history for a conversation
  /// Returns list of messages or failure
  Future<Either<Failure, List<ChatMessage>>> getChatHistory({
    required String conversationId,
    int? limit,
    String? beforeMessageId,
  });

  /// Get a specific message by ID
  /// Returns message or failure
  Future<Either<Failure, ChatMessage>> getMessageById({
    required String messageId,
  });

  /// Delete a message
  /// Returns void or failure
  Future<Either<Failure, void>> deleteMessage({
    required String messageId,
  });

  /// Regenerate AI response for a message
  /// Returns new AI response or failure
  Future<Either<Failure, ChatMessage>> regenerateResponse({
    required String messageId,
    Function(String chunk)? onStreamChunk,
  });

  // ==================== CITATIONS ====================

  /// Get citations for a specific message
  /// Returns list of citations or failure
  Future<Either<Failure, List<Citation>>> getCitationsForMessage({
    required String messageId,
  });

  /// Get citation details by ID
  /// Returns citation or failure
  Future<Either<Failure, Citation>> getCitationById({
    required String citationId,
  });

  // ==================== SEARCH & HISTORY ====================

  /// Search conversations by title or content
  /// Returns list of matching conversations or failure
  Future<Either<Failure, List<Conversation>>> searchConversations({
    required String query,
  });

  /// Get conversation statistics
  /// Returns stats map or failure
  Future<Either<Failure, Map<String, dynamic>>> getConversationStats();
}

import 'dart:async';
import 'dart:convert';
import 'package:dio/dio.dart';
import '../../../../app/constants/api_constants.dart';
import '../../../../core/network/dio_client.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/utils/logger.dart';
import '../models/chat_message_model.dart';
import '../models/citation_model.dart';
import '../models/conversation_model.dart';
import '../models/query_response_model.dart';

/// Chatbot remote data source
/// Handles all API calls for chatbot feature
class ChatbotRemoteDatasource {
  final DioClient dioClient;
  final _logger = Logger('ChatbotRemoteDatasource');

  ChatbotRemoteDatasource(this.dioClient);

  // ==================== CONVERSATIONS ====================

  /// Create a new conversation
  Future<ConversationModel> createConversation({
    required String title,
    List<String>? tags,
  }) async {
    try {
      _logger.info('Creating conversation: $title');

      final response = await dioClient.post(
        '${ApiConstants.chatbotServiceUrl}${ApiConstants.createConversation}',
        data: {
          'title': title,
          if (tags != null) 'tags': tags,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (response.data['success'] == true) {
          return ConversationModel.fromJson(response.data['data']);
        } else {
          throw ServerException(
            response.data['message'] ?? 'Failed to create conversation',
          );
        }
      } else {
        throw ServerException('Failed to create conversation');
      }
    } on DioException catch (e) {
      _logger.error('Create conversation failed: ${e.message}');
      _handleDioError(e);
      rethrow;
    } catch (e) {
      _logger.error('Create conversation error: $e');
      throw ServerException(e.toString());
    }
  }

  /// Get all conversations
  Future<List<ConversationModel>> getConversations({
    bool includeArchived = false,
  }) async {
    try {
      _logger.info('Getting conversations (includeArchived: $includeArchived)');

      final response = await dioClient.get(
        '${ApiConstants.chatbotServiceUrl}${ApiConstants.getConversations}',
        queryParameters: {
          'includeArchived': includeArchived,
        },
      );

      if (response.statusCode == 200) {
        if (response.data['success'] == true) {
          final List<dynamic> conversationsJson = response.data['data'];
          return conversationsJson
              .map((json) => ConversationModel.fromJson(json))
              .toList();
        } else {
          throw ServerException(
            response.data['message'] ?? 'Failed to get conversations',
          );
        }
      } else {
        throw ServerException('Failed to get conversations');
      }
    } on DioException catch (e) {
      _logger.error('Get conversations failed: ${e.message}');
      _handleDioError(e);
      rethrow;
    } catch (e) {
      _logger.error('Get conversations error: $e');
      throw ServerException(e.toString());
    }
  }

  /// Get conversation by ID
  Future<ConversationModel> getConversationById({
    required String conversationId,
  }) async {
    try {
      _logger.info('Getting conversation: $conversationId');

      final response = await dioClient.get(
        '${ApiConstants.chatbotServiceUrl}${ApiConstants.getConversationById}/$conversationId',
      );

      if (response.statusCode == 200) {
        if (response.data['success'] == true) {
          return ConversationModel.fromJson(response.data['data']);
        } else {
          throw ServerException(
            response.data['message'] ?? 'Failed to get conversation',
          );
        }
      } else {
        throw ServerException('Failed to get conversation');
      }
    } on DioException catch (e) {
      _logger.error('Get conversation failed: ${e.message}');
      _handleDioError(e);
      rethrow;
    } catch (e) {
      _logger.error('Get conversation error: $e');
      throw ServerException(e.toString());
    }
  }

  /// Update conversation
  Future<ConversationModel> updateConversation({
    required String conversationId,
    String? title,
    bool? isArchived,
    bool? isPinned,
    List<String>? tags,
  }) async {
    try {
      _logger.info('Updating conversation: $conversationId');

      final response = await dioClient.put(
        '${ApiConstants.chatbotServiceUrl}${ApiConstants.updateConversation}/$conversationId',
        data: {
          if (title != null) 'title': title,
          if (isArchived != null) 'isArchived': isArchived,
          if (isPinned != null) 'isPinned': isPinned,
          if (tags != null) 'tags': tags,
        },
      );

      if (response.statusCode == 200) {
        if (response.data['success'] == true) {
          return ConversationModel.fromJson(response.data['data']);
        } else {
          throw ServerException(
            response.data['message'] ?? 'Failed to update conversation',
          );
        }
      } else {
        throw ServerException('Failed to update conversation');
      }
    } on DioException catch (e) {
      _logger.error('Update conversation failed: ${e.message}');
      _handleDioError(e);
      rethrow;
    } catch (e) {
      _logger.error('Update conversation error: $e');
      throw ServerException(e.toString());
    }
  }

  /// Delete conversation
  Future<void> deleteConversation({
    required String conversationId,
  }) async {
    try {
      _logger.info('Deleting conversation: $conversationId');

      final response = await dioClient.delete(
        '${ApiConstants.chatbotServiceUrl}${ApiConstants.deleteConversation}/$conversationId',
      );

      if (response.statusCode == 200) {
        if (response.data['success'] != true) {
          throw ServerException(
            response.data['message'] ?? 'Failed to delete conversation',
          );
        }
      } else {
        throw ServerException('Failed to delete conversation');
      }
    } on DioException catch (e) {
      _logger.error('Delete conversation failed: ${e.message}');
      _handleDioError(e);
      rethrow;
    } catch (e) {
      _logger.error('Delete conversation error: $e');
      throw ServerException(e.toString());
    }
  }

  // ==================== MESSAGES ====================

  /// Send query to chatbot
  /// Supports streaming responses
  Future<QueryResponseModel> sendQuery({
    required String conversationId,
    required String query,
    Function(String chunk)? onStreamChunk,
  }) async {
    try {
      _logger.info('Sending query to conversation: $conversationId');

      // If streaming callback provided, use SSE/WebSocket (TODO: implement streaming)
      // For now, use regular POST request
      final response = await dioClient.post(
        '${ApiConstants.chatbotServiceUrl}${ApiConstants.sendQuery}',
        data: {
          'conversationId': conversationId,
          'query': query,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (response.data['success'] == true) {
          return QueryResponseModel.fromJson(response.data['data']);
        } else {
          throw ServerException(
            response.data['message'] ?? 'Failed to send query',
          );
        }
      } else {
        throw ServerException('Failed to send query');
      }
    } on DioException catch (e) {
      _logger.error('Send query failed: ${e.message}');
      _handleDioError(e);
      rethrow;
    } catch (e) {
      _logger.error('Send query error: $e');
      throw ServerException(e.toString());
    }
  }

  /// Get chat history
  Future<List<ChatMessageModel>> getChatHistory({
    required String conversationId,
    int? limit,
    String? beforeMessageId,
  }) async {
    try {
      _logger.info('Getting chat history: $conversationId');

      final response = await dioClient.get(
        '${ApiConstants.chatbotServiceUrl}${ApiConstants.getChatHistory}/$conversationId',
        queryParameters: {
          if (limit != null) 'limit': limit,
          if (beforeMessageId != null) 'beforeMessageId': beforeMessageId,
        },
      );

      if (response.statusCode == 200) {
        if (response.data['success'] == true) {
          final List<dynamic> messagesJson = response.data['data'];
          return messagesJson
              .map((json) => ChatMessageModel.fromJson(json))
              .toList();
        } else {
          throw ServerException(
            response.data['message'] ?? 'Failed to get chat history',
          );
        }
      } else {
        throw ServerException('Failed to get chat history');
      }
    } on DioException catch (e) {
      _logger.error('Get chat history failed: ${e.message}');
      _handleDioError(e);
      rethrow;
    } catch (e) {
      _logger.error('Get chat history error: $e');
      throw ServerException(e.toString());
    }
  }

  /// Get message by ID
  Future<ChatMessageModel> getMessageById({
    required String messageId,
  }) async {
    try {
      _logger.info('Getting message: $messageId');

      final response = await dioClient.get(
        '${ApiConstants.chatbotServiceUrl}${ApiConstants.getMessage}/$messageId',
      );

      if (response.statusCode == 200) {
        if (response.data['success'] == true) {
          return ChatMessageModel.fromJson(response.data['data']);
        } else {
          throw ServerException(
            response.data['message'] ?? 'Failed to get message',
          );
        }
      } else {
        throw ServerException('Failed to get message');
      }
    } on DioException catch (e) {
      _logger.error('Get message failed: ${e.message}');
      _handleDioError(e);
      rethrow;
    } catch (e) {
      _logger.error('Get message error: $e');
      throw ServerException(e.toString());
    }
  }

  /// Delete message
  Future<void> deleteMessage({
    required String messageId,
  }) async {
    try {
      _logger.info('Deleting message: $messageId');

      final response = await dioClient.delete(
        '${ApiConstants.chatbotServiceUrl}${ApiConstants.deleteMessage}/$messageId',
      );

      if (response.statusCode == 200) {
        if (response.data['success'] != true) {
          throw ServerException(
            response.data['message'] ?? 'Failed to delete message',
          );
        }
      } else {
        throw ServerException('Failed to delete message');
      }
    } on DioException catch (e) {
      _logger.error('Delete message failed: ${e.message}');
      _handleDioError(e);
      rethrow;
    } catch (e) {
      _logger.error('Delete message error: $e');
      throw ServerException(e.toString());
    }
  }

  /// Regenerate AI response
  Future<QueryResponseModel> regenerateResponse({
    required String messageId,
    Function(String chunk)? onStreamChunk,
  }) async {
    try {
      _logger.info('Regenerating response for message: $messageId');

      final response = await dioClient.post(
        '${ApiConstants.chatbotServiceUrl}${ApiConstants.regenerateResponse}/$messageId',
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (response.data['success'] == true) {
          return QueryResponseModel.fromJson(response.data['data']);
        } else {
          throw ServerException(
            response.data['message'] ?? 'Failed to regenerate response',
          );
        }
      } else {
        throw ServerException('Failed to regenerate response');
      }
    } on DioException catch (e) {
      _logger.error('Regenerate response failed: ${e.message}');
      _handleDioError(e);
      rethrow;
    } catch (e) {
      _logger.error('Regenerate response error: $e');
      throw ServerException(e.toString());
    }
  }

  // ==================== CITATIONS ====================

  /// Get citations for a message
  Future<List<CitationModel>> getCitationsForMessage({
    required String messageId,
  }) async {
    try {
      _logger.info('Getting citations for message: $messageId');

      final response = await dioClient.get(
        '${ApiConstants.chatbotServiceUrl}${ApiConstants.getCitations}/$messageId',
      );

      if (response.statusCode == 200) {
        if (response.data['success'] == true) {
          final List<dynamic> citationsJson = response.data['data'];
          return citationsJson
              .map((json) => CitationModel.fromJson(json))
              .toList();
        } else {
          throw ServerException(
            response.data['message'] ?? 'Failed to get citations',
          );
        }
      } else {
        throw ServerException('Failed to get citations');
      }
    } on DioException catch (e) {
      _logger.error('Get citations failed: ${e.message}');
      _handleDioError(e);
      rethrow;
    } catch (e) {
      _logger.error('Get citations error: $e');
      throw ServerException(e.toString());
    }
  }

  /// Get citation by ID
  Future<CitationModel> getCitationById({
    required String citationId,
  }) async {
    try {
      _logger.info('Getting citation: $citationId');

      final response = await dioClient.get(
        '${ApiConstants.chatbotServiceUrl}${ApiConstants.getCitation}/$citationId',
      );

      if (response.statusCode == 200) {
        if (response.data['success'] == true) {
          return CitationModel.fromJson(response.data['data']);
        } else {
          throw ServerException(
            response.data['message'] ?? 'Failed to get citation',
          );
        }
      } else {
        throw ServerException('Failed to get citation');
      }
    } on DioException catch (e) {
      _logger.error('Get citation failed: ${e.message}');
      _handleDioError(e);
      rethrow;
    } catch (e) {
      _logger.error('Get citation error: $e');
      throw ServerException(e.toString());
    }
  }

  // ==================== SEARCH & STATS ====================

  /// Search conversations
  Future<List<ConversationModel>> searchConversations({
    required String query,
  }) async {
    try {
      _logger.info('Searching conversations: $query');

      final response = await dioClient.get(
        '${ApiConstants.chatbotServiceUrl}${ApiConstants.searchConversations}',
        queryParameters: {'query': query},
      );

      if (response.statusCode == 200) {
        if (response.data['success'] == true) {
          final List<dynamic> conversationsJson = response.data['data'];
          return conversationsJson
              .map((json) => ConversationModel.fromJson(json))
              .toList();
        } else {
          throw ServerException(
            response.data['message'] ?? 'Failed to search conversations',
          );
        }
      } else {
        throw ServerException('Failed to search conversations');
      }
    } on DioException catch (e) {
      _logger.error('Search conversations failed: ${e.message}');
      _handleDioError(e);
      rethrow;
    } catch (e) {
      _logger.error('Search conversations error: $e');
      throw ServerException(e.toString());
    }
  }

  /// Get conversation statistics
  Future<Map<String, dynamic>> getConversationStats() async {
    try {
      _logger.info('Getting conversation stats');

      final response = await dioClient.get(
        '${ApiConstants.chatbotServiceUrl}${ApiConstants.getConversationStats}',
      );

      if (response.statusCode == 200) {
        if (response.data['success'] == true) {
          return response.data['data'] as Map<String, dynamic>;
        } else {
          throw ServerException(
            response.data['message'] ?? 'Failed to get conversation stats',
          );
        }
      } else {
        throw ServerException('Failed to get conversation stats');
      }
    } on DioException catch (e) {
      _logger.error('Get conversation stats failed: ${e.message}');
      _handleDioError(e);
      rethrow;
    } catch (e) {
      _logger.error('Get conversation stats error: $e');
      throw ServerException(e.toString());
    }
  }

  // ==================== ERROR HANDLING ====================

  void _handleDioError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        throw TimeoutException('Request timeout. Please try again.');

      case DioExceptionType.connectionError:
        throw NetworkException('No internet connection');

      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode;
        final message = error.response?.data?['message'] ?? 'Unknown error';

        switch (statusCode) {
          case 400:
            throw ValidationException(message);
          case 401:
            throw AuthenticationException(message);
          case 403:
            throw AuthorizationException(message);
          case 404:
            throw NotFoundException(message);
          case 409:
            throw ConflictException(message);
          case 429:
            throw RateLimitException(message);
          case 500:
          case 502:
          case 503:
            throw ServerException(message);
          default:
            throw ServerException(message);
        }

      case DioExceptionType.cancel:
        throw CancelledException('Request cancelled');

      default:
        throw ServerException(error.message ?? 'Unknown error occurred');
    }
  }
}

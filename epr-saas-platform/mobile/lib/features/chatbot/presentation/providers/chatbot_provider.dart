import 'package:flutter/foundation.dart';
import '../../domain/entities/chat_message.dart';
import '../../domain/entities/citation.dart';
import '../../domain/entities/conversation.dart';
import '../../domain/usecases/send_query_usecase.dart';
import '../../domain/usecases/get_chat_history_usecase.dart';
import '../../domain/usecases/create_conversation_usecase.dart';
import '../../domain/usecases/get_conversations_usecase.dart';
import '../../domain/usecases/get_citations_usecase.dart';
import '../../domain/usecases/delete_conversation_usecase.dart';

/// Chatbot provider
/// Manages chatbot state for the presentation layer
class ChatbotProvider extends ChangeNotifier {
  final SendQueryUsecase sendQueryUsecase;
  final GetChatHistoryUsecase getChatHistoryUsecase;
  final CreateConversationUsecase createConversationUsecase;
  final GetConversationsUsecase getConversationsUsecase;
  final GetCitationsUsecase getCitationsUsecase;
  final DeleteConversationUsecase deleteConversationUsecase;

  ChatbotProvider({
    required this.sendQueryUsecase,
    required this.getChatHistoryUsecase,
    required this.createConversationUsecase,
    required this.getConversationsUsecase,
    required this.getCitationsUsecase,
    required this.deleteConversationUsecase,
  });

  // ==================== STATE ====================

  /// Current conversation
  Conversation? _currentConversation;

  /// List of all conversations
  List<Conversation> _conversations = [];

  /// Current chat messages
  List<ChatMessage> _messages = [];

  /// Citations for current conversation
  Map<String, List<Citation>> _citationsByMessageId = {};

  /// Loading states
  bool _isLoading = false;
  bool _isSending = false;
  bool _isLoadingConversations = false;
  bool _isLoadingHistory = false;
  bool _isStreaming = false;

  /// Error message
  String? _errorMessage;

  /// Streaming buffer for AI response
  String _streamingBuffer = '';

  // ==================== GETTERS ====================

  Conversation? get currentConversation => _currentConversation;
  List<Conversation> get conversations => _conversations;
  List<ChatMessage> get messages => _messages;
  Map<String, List<Citation>> get citationsByMessageId => _citationsByMessageId;
  bool get isLoading => _isLoading;
  bool get isSending => _isSending;
  bool get isLoadingConversations => _isLoadingConversations;
  bool get isLoadingHistory => _isLoadingHistory;
  bool get isStreaming => _isStreaming;
  String? get errorMessage => _errorMessage;
  String get streamingBuffer => _streamingBuffer;

  /// Check if there's a current conversation
  bool get hasCurrentConversation => _currentConversation != null;

  /// Check if current conversation has messages
  bool get hasMessages => _messages.isNotEmpty;

  // ==================== CONVERSATIONS ====================

  /// Create a new conversation
  Future<bool> createConversation({
    required String title,
    List<String>? tags,
  }) async {
    _setLoading(true);
    _clearError();

    final result = await createConversationUsecase(
      title: title,
      tags: tags,
    );

    return result.fold(
      (failure) {
        _setError(failure.message);
        _setLoading(false);
        return false;
      },
      (conversation) {
        _currentConversation = conversation;
        _messages = [];
        _citationsByMessageId = {};
        _conversations.insert(0, conversation);
        _setLoading(false);
        notifyListeners();
        return true;
      },
    );
  }

  /// Get all conversations
  Future<void> getConversations({bool includeArchived = false}) async {
    _isLoadingConversations = true;
    _clearError();
    notifyListeners();

    final result = await getConversationsUsecase(
      includeArchived: includeArchived,
    );

    result.fold(
      (failure) {
        _setError(failure.message);
        _isLoadingConversations = false;
        notifyListeners();
      },
      (conversations) {
        _conversations = conversations;
        _isLoadingConversations = false;
        notifyListeners();
      },
    );
  }

  /// Set current conversation
  Future<void> setCurrentConversation(Conversation conversation) async {
    _currentConversation = conversation;
    _messages = [];
    _citationsByMessageId = {};
    notifyListeners();

    // Load chat history
    await getChatHistory(conversationId: conversation.id);
  }

  /// Delete a conversation
  Future<bool> deleteConversation({required String conversationId}) async {
    _setLoading(true);
    _clearError();

    final result = await deleteConversationUsecase(
      conversationId: conversationId,
    );

    return result.fold(
      (failure) {
        _setError(failure.message);
        _setLoading(false);
        return false;
      },
      (_) {
        _conversations.removeWhere((c) => c.id == conversationId);
        if (_currentConversation?.id == conversationId) {
          _currentConversation = null;
          _messages = [];
          _citationsByMessageId = {};
        }
        _setLoading(false);
        notifyListeners();
        return true;
      },
    );
  }

  // ==================== MESSAGES ====================

  /// Send a query to the chatbot
  Future<bool> sendQuery({
    required String query,
    String? conversationId,
  }) async {
    // If no conversation ID provided, use current conversation
    var targetConversationId = conversationId ?? _currentConversation?.id;

    // If no conversation exists, use a temporary ID
    // Backend will create/associate the message with a conversation
    if (targetConversationId == null) {
      targetConversationId = 'temp_${DateTime.now().millisecondsSinceEpoch}';
    }

    _isSending = true;
    _isStreaming = true;
    _streamingBuffer = '';
    _clearError();

    // Add user message to UI immediately
    final userMessage = ChatMessage(
      id: 'temp_${DateTime.now().millisecondsSinceEpoch}',
      conversationId: targetConversationId,
      content: query,
      sender: MessageSender.user,
      createdAt: DateTime.now(),
    );
    _messages.add(userMessage);
    notifyListeners();

    final result = await sendQueryUsecase(
      conversationId: targetConversationId,
      query: query,
      onStreamChunk: (chunk) {
        // Handle streaming response
        _streamingBuffer += chunk;
        notifyListeners();
      },
    );

    return result.fold(
      (failure) {
        _setError(failure.message);
        _isSending = false;
        _isStreaming = false;
        _streamingBuffer = '';
        notifyListeners();
        return false;
      },
      (aiMessage) {
        // Replace user message with real one from server
        _messages.removeLast();

        // Add user and AI messages
        _messages.add(userMessage.copyWith(id: aiMessage.conversationId));
        _messages.add(aiMessage);

        // Load citations if any
        if (aiMessage.hasCitations) {
          _loadCitationsForMessage(aiMessage.id);
        }

        _isSending = false;
        _isStreaming = false;
        _streamingBuffer = '';
        notifyListeners();
        return true;
      },
    );
  }

  /// Get chat history
  Future<void> getChatHistory({
    required String conversationId,
    int? limit,
  }) async {
    _isLoadingHistory = true;
    _clearError();
    notifyListeners();

    final result = await getChatHistoryUsecase(
      conversationId: conversationId,
      limit: limit,
    );

    result.fold(
      (failure) {
        _setError(failure.message);
        _isLoadingHistory = false;
        notifyListeners();
      },
      (messages) {
        _messages = messages;
        _isLoadingHistory = false;
        notifyListeners();

        // Load citations for all AI messages
        for (final message in messages) {
          if (message.isAiMessage && message.hasCitations) {
            _loadCitationsForMessage(message.id);
          }
        }
      },
    );
  }

  /// Load citations for a specific message
  Future<void> _loadCitationsForMessage(String messageId) async {
    final result = await getCitationsUsecase(messageId: messageId);

    result.fold(
      (failure) {
        // Silently fail - citations are not critical
      },
      (citations) {
        _citationsByMessageId[messageId] = citations;
        notifyListeners();
      },
    );
  }

  /// Get citations for a message
  List<Citation>? getCitationsForMessage(String messageId) {
    return _citationsByMessageId[messageId];
  }

  // ==================== HELPER METHODS ====================

  /// Clear current conversation
  void clearCurrentConversation() {
    _currentConversation = null;
    _messages = [];
    _citationsByMessageId = {};
    _streamingBuffer = '';
    notifyListeners();
  }

  /// Set loading state
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  /// Set error message
  void _setError(String message) {
    _errorMessage = message;
    notifyListeners();
  }

  /// Clear error message
  void _clearError() {
    _errorMessage = null;
  }

  /// Clear all state
  void clear() {
    _currentConversation = null;
    _conversations = [];
    _messages = [];
    _citationsByMessageId = {};
    _isLoading = false;
    _isSending = false;
    _isLoadingConversations = false;
    _isLoadingHistory = false;
    _isStreaming = false;
    _errorMessage = null;
    _streamingBuffer = '';
    notifyListeners();
  }

  @override
  void dispose() {
    clear();
    super.dispose();
  }
}

import 'package:equatable/equatable.dart';

/// Chat message entity
/// Represents a single message in a conversation
class ChatMessage extends Equatable {
  /// Unique message ID
  final String id;

  /// Conversation ID this message belongs to
  final String conversationId;

  /// Message content/text
  final String content;

  /// Message sender type (user or ai)
  final MessageSender sender;

  /// Timestamp when message was created
  final DateTime createdAt;

  /// Citations for AI responses (legal document references)
  final List<String>? citationIds;

  /// Whether this message is still being generated (streaming)
  final bool isStreaming;

  /// Whether this message has an error
  final bool hasError;

  /// Error message if any
  final String? errorMessage;

  const ChatMessage({
    required this.id,
    required this.conversationId,
    required this.content,
    required this.sender,
    required this.createdAt,
    this.citationIds,
    this.isStreaming = false,
    this.hasError = false,
    this.errorMessage,
  });

  /// Check if this message is from user
  bool get isUserMessage => sender == MessageSender.user;

  /// Check if this message is from AI
  bool get isAiMessage => sender == MessageSender.ai;

  /// Check if this message has citations
  bool get hasCitations =>
      citationIds != null && citationIds!.isNotEmpty;

  /// Copy with method for immutability
  ChatMessage copyWith({
    String? id,
    String? conversationId,
    String? content,
    MessageSender? sender,
    DateTime? createdAt,
    List<String>? citationIds,
    bool? isStreaming,
    bool? hasError,
    String? errorMessage,
  }) {
    return ChatMessage(
      id: id ?? this.id,
      conversationId: conversationId ?? this.conversationId,
      content: content ?? this.content,
      sender: sender ?? this.sender,
      createdAt: createdAt ?? this.createdAt,
      citationIds: citationIds ?? this.citationIds,
      isStreaming: isStreaming ?? this.isStreaming,
      hasError: hasError ?? this.hasError,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }

  @override
  List<Object?> get props => [
        id,
        conversationId,
        content,
        sender,
        createdAt,
        citationIds,
        isStreaming,
        hasError,
        errorMessage,
      ];
}

/// Message sender type
enum MessageSender {
  /// Message from user
  user,

  /// Message from AI assistant
  ai,
}

import 'package:json_annotation/json_annotation.dart';
import '../../domain/entities/chat_message.dart';

part 'chat_message_model.g.dart';

/// Chat message data model
/// JSON serializable model for API responses
@JsonSerializable()
class ChatMessageModel extends ChatMessage {
  const ChatMessageModel({
    required super.id,
    required super.conversationId,
    required super.content,
    required super.sender,
    required super.createdAt,
    super.citationIds,
    super.isStreaming,
    super.hasError,
    super.errorMessage,
  });

  /// Create from JSON
  factory ChatMessageModel.fromJson(Map<String, dynamic> json) =>
      _$ChatMessageModelFromJson(json);

  /// Convert to JSON
  Map<String, dynamic> toJson() => _$ChatMessageModelToJson(this);

  /// Convert to domain entity
  ChatMessage toEntity() => ChatMessage(
        id: id,
        conversationId: conversationId,
        content: content,
        sender: sender,
        createdAt: createdAt,
        citationIds: citationIds,
        isStreaming: isStreaming,
        hasError: hasError,
        errorMessage: errorMessage,
      );

  /// Create from domain entity
  factory ChatMessageModel.fromEntity(ChatMessage message) {
    return ChatMessageModel(
      id: message.id,
      conversationId: message.conversationId,
      content: message.content,
      sender: message.sender,
      createdAt: message.createdAt,
      citationIds: message.citationIds,
      isStreaming: message.isStreaming,
      hasError: message.hasError,
      errorMessage: message.errorMessage,
    );
  }

  /// Copy with for model updates
  ChatMessageModel copyWithModel({
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
    return ChatMessageModel(
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
}

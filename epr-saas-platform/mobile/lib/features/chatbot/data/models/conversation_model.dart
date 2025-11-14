import 'package:json_annotation/json_annotation.dart';
import '../../domain/entities/conversation.dart';

part 'conversation_model.g.dart';

/// Conversation data model
/// JSON serializable model for conversation responses
@JsonSerializable()
class ConversationModel extends Conversation {
  const ConversationModel({
    required super.id,
    required super.userId,
    required super.title,
    super.firstMessage,
    super.lastMessage,
    required super.messageCount,
    required super.createdAt,
    required super.updatedAt,
    super.isArchived,
    super.isPinned,
    super.tags,
  });

  /// Create from JSON
  factory ConversationModel.fromJson(Map<String, dynamic> json) =>
      _$ConversationModelFromJson(json);

  /// Convert to JSON
  Map<String, dynamic> toJson() => _$ConversationModelToJson(this);

  /// Convert to domain entity
  Conversation toEntity() => Conversation(
        id: id,
        userId: userId,
        title: title,
        firstMessage: firstMessage,
        lastMessage: lastMessage,
        messageCount: messageCount,
        createdAt: createdAt,
        updatedAt: updatedAt,
        isArchived: isArchived,
        isPinned: isPinned,
        tags: tags,
      );

  /// Create from domain entity
  factory ConversationModel.fromEntity(Conversation conversation) {
    return ConversationModel(
      id: conversation.id,
      userId: conversation.userId,
      title: conversation.title,
      firstMessage: conversation.firstMessage,
      lastMessage: conversation.lastMessage,
      messageCount: conversation.messageCount,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      isArchived: conversation.isArchived,
      isPinned: conversation.isPinned,
      tags: conversation.tags,
    );
  }
}

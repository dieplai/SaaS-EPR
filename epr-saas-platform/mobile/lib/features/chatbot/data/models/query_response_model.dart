import 'package:json_annotation/json_annotation.dart';
import 'chat_message_model.dart';
import 'citation_model.dart';
import '../../domain/entities/chat_message.dart';

part 'query_response_model.g.dart';

/// Query response data model
/// Represents the API response when sending a query to the chatbot
@JsonSerializable()
class QueryResponseModel {
  /// The AI's response text (from backend: 'answer')
  @JsonKey(name: 'answer')
  final String answer;

  /// Original query text
  @JsonKey(name: 'query')
  final String query;

  /// List of source documents (from backend: 'sources')
  @JsonKey(name: 'sources')
  final List<Map<String, dynamic>>? sources;

  /// Number of sources returned
  @JsonKey(name: 'num_sources')
  final int? numSources;

  /// Whether query is off-topic
  @JsonKey(name: 'is_off_topic')
  final bool? isOffTopic;

  /// Off-topic counter
  @JsonKey(name: 'off_topic_count')
  final int? offTopicCount;

  /// Remaining off-topic queries allowed
  @JsonKey(name: 'remaining_off_topic')
  final int? remainingOffTopic;

  /// Scope information
  @JsonKey(name: 'scope_info')
  final Map<String, dynamic>? scopeInfo;

  const QueryResponseModel({
    required this.answer,
    required this.query,
    this.sources,
    this.numSources,
    this.isOffTopic,
    this.offTopicCount,
    this.remainingOffTopic,
    this.scopeInfo,
  });

  /// Create from JSON
  factory QueryResponseModel.fromJson(Map<String, dynamic> json) =>
      _$QueryResponseModelFromJson(json);

  /// Convert to JSON
  Map<String, dynamic> toJson() => _$QueryResponseModelToJson(this);

  /// Convert to ChatMessage for display
  ChatMessageModel toChatMessage({
    required String conversationId,
  }) {
    return ChatMessageModel(
      id: 'msg_${DateTime.now().millisecondsSinceEpoch}',
      conversationId: conversationId,
      content: answer,
      sender: MessageSender.ai,
      createdAt: DateTime.now(),
      citationIds: sources != null && sources!.isNotEmpty
          ? List.generate(sources!.length, (i) => 'citation_$i')
          : null,
    );
  }
}

import 'package:json_annotation/json_annotation.dart';
import 'chat_message_model.dart';
import 'citation_model.dart';

part 'query_response_model.g.dart';

/// Query response data model
/// Represents the API response when sending a query to the chatbot
@JsonSerializable()
class QueryResponseModel {
  /// The AI's response message
  @JsonKey(name: 'message')
  final ChatMessageModel message;

  /// List of citations (legal document references)
  @JsonKey(name: 'citations')
  final List<CitationModel> citations;

  /// Conversation ID
  @JsonKey(name: 'conversationId')
  final String conversationId;

  /// Tokens used in this query
  @JsonKey(name: 'tokensUsed')
  final int? tokensUsed;

  /// Processing time in milliseconds
  @JsonKey(name: 'processingTime')
  final int? processingTime;

  const QueryResponseModel({
    required this.message,
    required this.citations,
    required this.conversationId,
    this.tokensUsed,
    this.processingTime,
  });

  /// Create from JSON
  factory QueryResponseModel.fromJson(Map<String, dynamic> json) =>
      _$QueryResponseModelFromJson(json);

  /// Convert to JSON
  Map<String, dynamic> toJson() => _$QueryResponseModelToJson(this);
}

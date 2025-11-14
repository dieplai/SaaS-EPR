import 'package:json_annotation/json_annotation.dart';
import '../../domain/entities/citation.dart';

part 'citation_model.g.dart';

/// Citation data model
/// JSON serializable model for legal document citations
@JsonSerializable()
class CitationModel extends Citation {
  const CitationModel({
    required super.id,
    required super.title,
    required super.url,
    required super.excerpt,
    required super.documentType,
    super.documentNumber,
    super.issueDate,
    super.issuingAuthority,
    required super.relevanceScore,
    required super.createdAt,
  });

  /// Create from JSON
  factory CitationModel.fromJson(Map<String, dynamic> json) =>
      _$CitationModelFromJson(json);

  /// Convert to JSON
  Map<String, dynamic> toJson() => _$CitationModelToJson(this);

  /// Convert to domain entity
  Citation toEntity() => Citation(
        id: id,
        title: title,
        url: url,
        excerpt: excerpt,
        documentType: documentType,
        documentNumber: documentNumber,
        issueDate: issueDate,
        issuingAuthority: issuingAuthority,
        relevanceScore: relevanceScore,
        createdAt: createdAt,
      );

  /// Create from domain entity
  factory CitationModel.fromEntity(Citation citation) {
    return CitationModel(
      id: citation.id,
      title: citation.title,
      url: citation.url,
      excerpt: citation.excerpt,
      documentType: citation.documentType,
      documentNumber: citation.documentNumber,
      issueDate: citation.issueDate,
      issuingAuthority: citation.issuingAuthority,
      relevanceScore: citation.relevanceScore,
      createdAt: citation.createdAt,
    );
  }
}

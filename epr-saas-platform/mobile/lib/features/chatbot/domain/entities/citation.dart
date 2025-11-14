import 'package:equatable/equatable.dart';

/// Citation entity
/// Represents a legal document reference (Perplexity-style)
class Citation extends Equatable {
  /// Unique citation ID
  final String id;

  /// Title of the legal document
  final String title;

  /// URL to the full document
  final String url;

  /// Relevant excerpt from the document
  final String excerpt;

  /// Document type (law, decree, circular, etc.)
  final DocumentType documentType;

  /// Document number (e.g., "68/2006/QH11")
  final String? documentNumber;

  /// Issue date of the document
  final DateTime? issueDate;

  /// Issuing authority (e.g., "Quốc hội", "Chính phủ")
  final String? issuingAuthority;

  /// Relevance score (0.0 to 1.0)
  final double relevanceScore;

  /// Timestamp when citation was created
  final DateTime createdAt;

  const Citation({
    required this.id,
    required this.title,
    required this.url,
    required this.excerpt,
    required this.documentType,
    this.documentNumber,
    this.issueDate,
    this.issuingAuthority,
    required this.relevanceScore,
    required this.createdAt,
  });

  /// Get formatted document reference
  /// Example: "Luật Dân sự số 68/2006/QH11"
  String get formattedReference {
    final buffer = StringBuffer();
    buffer.write(documentType.displayName);
    if (documentNumber != null && documentNumber!.isNotEmpty) {
      buffer.write(' số $documentNumber');
    }
    return buffer.toString();
  }

  /// Get formatted issue info
  /// Example: "Ban hành: 29/11/2006 bởi Quốc hội"
  String? get formattedIssueInfo {
    if (issueDate == null && issuingAuthority == null) return null;

    final buffer = StringBuffer('Ban hành: ');
    if (issueDate != null) {
      buffer.write('${issueDate!.day}/${issueDate!.month}/${issueDate!.year}');
    }
    if (issuingAuthority != null && issuingAuthority!.isNotEmpty) {
      if (issueDate != null) buffer.write(' bởi ');
      buffer.write(issuingAuthority);
    }
    return buffer.toString();
  }

  /// Get short excerpt (first 150 characters)
  String get shortExcerpt {
    if (excerpt.length <= 150) return excerpt;
    return '${excerpt.substring(0, 150)}...';
  }

  @override
  List<Object?> get props => [
        id,
        title,
        url,
        excerpt,
        documentType,
        documentNumber,
        issueDate,
        issuingAuthority,
        relevanceScore,
        createdAt,
      ];
}

/// Document type enum
enum DocumentType {
  /// Luật (Law)
  law,

  /// Nghị định (Decree)
  decree,

  /// Thông tư (Circular)
  circular,

  /// Nghị quyết (Resolution)
  resolution,

  /// Quyết định (Decision)
  decision,

  /// Pháp lệnh (Ordinance)
  ordinance,

  /// Other document types
  other;

  /// Get display name in Vietnamese
  String get displayName {
    switch (this) {
      case DocumentType.law:
        return 'Luật';
      case DocumentType.decree:
        return 'Nghị định';
      case DocumentType.circular:
        return 'Thông tư';
      case DocumentType.resolution:
        return 'Nghị quyết';
      case DocumentType.decision:
        return 'Quyết định';
      case DocumentType.ordinance:
        return 'Pháp lệnh';
      case DocumentType.other:
        return 'Văn bản';
    }
  }

  /// Get icon for document type
  String get icon {
    switch (this) {
      case DocumentType.law:
        return '📜';
      case DocumentType.decree:
        return '📋';
      case DocumentType.circular:
        return '📄';
      case DocumentType.resolution:
        return '✅';
      case DocumentType.decision:
        return '⚖️';
      case DocumentType.ordinance:
        return '📑';
      case DocumentType.other:
        return '📃';
    }
  }
}

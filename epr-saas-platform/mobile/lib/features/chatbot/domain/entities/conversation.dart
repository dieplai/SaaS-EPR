import 'package:equatable/equatable.dart';

/// Conversation entity
/// Represents a chat conversation/thread
class Conversation extends Equatable {
  /// Unique conversation ID
  final String id;

  /// User ID who owns this conversation
  final String userId;

  /// Conversation title (auto-generated from first message)
  final String title;

  /// First message preview (for list display)
  final String? firstMessage;

  /// Last message preview
  final String? lastMessage;

  /// Total number of messages in this conversation
  final int messageCount;

  /// Timestamp when conversation was created
  final DateTime createdAt;

  /// Timestamp when conversation was last updated
  final DateTime updatedAt;

  /// Whether conversation is archived
  final bool isArchived;

  /// Whether conversation is pinned
  final bool isPinned;

  /// Tags/labels for categorization
  final List<String>? tags;

  const Conversation({
    required this.id,
    required this.userId,
    required this.title,
    this.firstMessage,
    this.lastMessage,
    required this.messageCount,
    required this.createdAt,
    required this.updatedAt,
    this.isArchived = false,
    this.isPinned = false,
    this.tags,
  });

  /// Get formatted created date
  /// Example: "Hôm nay", "Hôm qua", "25/11/2024"
  String get formattedCreatedDate {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final createdDate = DateTime(
      createdAt.year,
      createdAt.month,
      createdAt.day,
    );

    if (createdDate == today) {
      return 'Hôm nay';
    } else if (createdDate == yesterday) {
      return 'Hôm qua';
    } else if (now.difference(createdDate).inDays < 7) {
      // Show day of week for last 7 days
      return _getVietnameseDayOfWeek(createdDate.weekday);
    } else {
      return '${createdAt.day}/${createdAt.month}/${createdAt.year}';
    }
  }

  /// Get formatted updated time
  /// Example: "14:30", "Hôm qua 14:30"
  String get formattedUpdatedTime {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final updatedDate = DateTime(
      updatedAt.year,
      updatedAt.month,
      updatedAt.day,
    );

    final timeStr = '${updatedAt.hour.toString().padLeft(2, '0')}:'
        '${updatedAt.minute.toString().padLeft(2, '0')}';

    if (updatedDate == today) {
      return timeStr;
    } else {
      return '$formattedCreatedDate $timeStr';
    }
  }

  /// Get short title (first 50 characters)
  String get shortTitle {
    if (title.length <= 50) return title;
    return '${title.substring(0, 50)}...';
  }

  /// Get message count text
  /// Example: "5 tin nhắn"
  String get messageCountText {
    if (messageCount == 0) return 'Chưa có tin nhắn';
    if (messageCount == 1) return '1 tin nhắn';
    return '$messageCount tin nhắn';
  }

  /// Check if conversation is empty
  bool get isEmpty => messageCount == 0;

  /// Check if conversation is active (updated in last 24 hours)
  bool get isActive {
    final now = DateTime.now();
    return now.difference(updatedAt).inHours < 24;
  }

  /// Copy with method for immutability
  Conversation copyWith({
    String? id,
    String? userId,
    String? title,
    String? firstMessage,
    String? lastMessage,
    int? messageCount,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? isArchived,
    bool? isPinned,
    List<String>? tags,
  }) {
    return Conversation(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      title: title ?? this.title,
      firstMessage: firstMessage ?? this.firstMessage,
      lastMessage: lastMessage ?? this.lastMessage,
      messageCount: messageCount ?? this.messageCount,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      isArchived: isArchived ?? this.isArchived,
      isPinned: isPinned ?? this.isPinned,
      tags: tags ?? this.tags,
    );
  }

  @override
  List<Object?> get props => [
        id,
        userId,
        title,
        firstMessage,
        lastMessage,
        messageCount,
        createdAt,
        updatedAt,
        isArchived,
        isPinned,
        tags,
      ];

  /// Helper: Get Vietnamese day of week
  String _getVietnameseDayOfWeek(int weekday) {
    switch (weekday) {
      case DateTime.monday:
        return 'Thứ 2';
      case DateTime.tuesday:
        return 'Thứ 3';
      case DateTime.wednesday:
        return 'Thứ 4';
      case DateTime.thursday:
        return 'Thứ 5';
      case DateTime.friday:
        return 'Thứ 6';
      case DateTime.saturday:
        return 'Thứ 7';
      case DateTime.sunday:
        return 'Chủ nhật';
      default:
        return '';
    }
  }
}

import 'package:json_annotation/json_annotation.dart';
import '../../domain/entities/user.dart';

part 'user_model.g.dart';

/// User model (data layer)
/// JSON serializable, extends domain entity
@JsonSerializable()
class UserModel extends User {
  const UserModel({
    required super.id,
    required super.email,
    required super.name,
    super.phone,
    super.avatar,
    required super.createdAt,
    super.updatedAt,
  });

  /// From JSON
  factory UserModel.fromJson(Map<String, dynamic> json) =>
      _$UserModelFromJson(json);

  /// To JSON
  Map<String, dynamic> toJson() => _$UserModelToJson(this);

  /// Convert model to entity
  User toEntity() => User(
        id: id,
        email: email,
        name: name,
        phone: phone,
        avatar: avatar,
        createdAt: createdAt,
        updatedAt: updatedAt,
      );

  /// Create from entity
  factory UserModel.fromEntity(User user) => UserModel(
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      );
}

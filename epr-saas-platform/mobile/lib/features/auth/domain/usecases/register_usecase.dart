import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/user.dart';
import '../repositories/auth_repository.dart';

/// Register usecase
/// Single responsibility: Handle registration business logic
class RegisterUsecase {
  final AuthRepository repository;

  RegisterUsecase(this.repository);

  /// Execute registration
  Future<Either<Failure, User>> call({
    required String name,
    required String email,
    required String password,
    String? phone,
  }) async {
    // Validate inputs
    if (name.isEmpty) {
      return const Left(ValidationFailure('Tên không được để trống'));
    }

    if (email.isEmpty) {
      return const Left(ValidationFailure('Email không được để trống'));
    }

    if (password.isEmpty) {
      return const Left(ValidationFailure('Mật khẩu không được để trống'));
    }

    if (password.length < 8) {
      return const Left(ValidationFailure('Mật khẩu phải có ít nhất 8 ký tự'));
    }

    // Call repository
    return await repository.register(
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password,
      phone: phone?.trim(),
    );
  }
}

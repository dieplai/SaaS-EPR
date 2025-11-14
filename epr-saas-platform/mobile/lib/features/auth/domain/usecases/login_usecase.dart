import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/user.dart';
import '../repositories/auth_repository.dart';

/// Login usecase
/// Single responsibility: Handle login business logic
class LoginUsecase {
  final AuthRepository repository;

  LoginUsecase(this.repository);

  /// Execute login
  Future<Either<Failure, User>> call({
    required String email,
    required String password,
  }) async {
    // Validate inputs
    if (email.isEmpty) {
      return const Left(ValidationFailure('Email không được để trống'));
    }

    if (password.isEmpty) {
      return const Left(ValidationFailure('Mật khẩu không được để trống'));
    }

    // Call repository
    return await repository.login(
      email: email.trim().toLowerCase(),
      password: password,
    );
  }
}

import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/user.dart';
import '../repositories/auth_repository.dart';

/// Get current user usecase
/// Single responsibility: Get currently logged in user
class GetCurrentUserUsecase {
  final AuthRepository repository;

  GetCurrentUserUsecase(this.repository);

  /// Execute get current user
  Future<Either<Failure, User>> call() async {
    return await repository.getCurrentUser();
  }
}

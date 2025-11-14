import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../repositories/auth_repository.dart';

/// Logout usecase
/// Single responsibility: Handle logout business logic
class LogoutUsecase {
  final AuthRepository repository;

  LogoutUsecase(this.repository);

  /// Execute logout
  Future<Either<Failure, void>> call() async {
    return await repository.logout();
  }
}

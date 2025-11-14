import 'package:get_it/get_it.dart';
import '../network/dio_client.dart';
import '../storage/secure_storage.dart';
import '../storage/local_storage.dart';
import '../../features/auth/data/datasources/auth_remote_datasource.dart';
import '../../features/auth/data/repositories/auth_repository_impl.dart';
import '../../features/auth/domain/repositories/auth_repository.dart';
import '../../features/auth/domain/usecases/login_usecase.dart';
import '../../features/auth/domain/usecases/register_usecase.dart';
import '../../features/auth/domain/usecases/logout_usecase.dart';
import '../../features/auth/domain/usecases/get_current_user_usecase.dart';
import '../../features/auth/presentation/providers/auth_provider.dart';

/// Dependency Injection container using GetIt
/// All dependencies are registered here
final getIt = GetIt.instance;

/// Initialize all dependencies
Future<void> initDependencies() async {
  // ==================== CORE ====================

  // Storage
  getIt.registerLazySingleton<SecureStorage>(() => SecureStorage());
  getIt.registerLazySingleton<LocalStorage>(() => LocalStorage());

  // Initialize local storage
  await getIt<LocalStorage>().init();

  // Network
  getIt.registerLazySingleton<DioClient>(
    () => DioClient(getIt<SecureStorage>()),
  );

  // ==================== DATA SOURCES ====================
  // Auth
  getIt.registerLazySingleton<AuthRemoteDatasource>(
    () => AuthRemoteDatasource(getIt<DioClient>()),
  );

  // ==================== REPOSITORIES ====================
  // Auth
  getIt.registerLazySingleton<AuthRepository>(
    () => AuthRepositoryImpl(
      remoteDatasource: getIt<AuthRemoteDatasource>(),
      secureStorage: getIt<SecureStorage>(),
      localStorage: getIt<LocalStorage>(),
    ),
  );

  // ==================== USE CASES ====================
  // Auth
  getIt.registerLazySingleton<LoginUsecase>(
    () => LoginUsecase(getIt<AuthRepository>()),
  );
  getIt.registerLazySingleton<RegisterUsecase>(
    () => RegisterUsecase(getIt<AuthRepository>()),
  );
  getIt.registerLazySingleton<LogoutUsecase>(
    () => LogoutUsecase(getIt<AuthRepository>()),
  );
  getIt.registerLazySingleton<GetCurrentUserUsecase>(
    () => GetCurrentUserUsecase(getIt<AuthRepository>()),
  );

  // ==================== PROVIDERS ====================
  // Auth (Factory - new instance each time)
  getIt.registerFactory<AuthProvider>(
    () => AuthProvider(
      loginUsecase: getIt<LoginUsecase>(),
      registerUsecase: getIt<RegisterUsecase>(),
      logoutUsecase: getIt<LogoutUsecase>(),
      getCurrentUserUsecase: getIt<GetCurrentUserUsecase>(),
    ),
  );
}

/// Clear all dependencies (for testing)
Future<void> clearDependencies() async {
  await getIt.reset();
}

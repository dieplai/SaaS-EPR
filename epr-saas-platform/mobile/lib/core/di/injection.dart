import 'package:get_it/get_it.dart';
import '../network/dio_client.dart';
import '../storage/secure_storage.dart';
import '../storage/local_storage.dart';

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
  // Will be added later when implementing features:
  // - AuthRemoteDatasource
  // - ChatbotRemoteDatasource
  // - SubscriptionRemoteDatasource
  // - ProfileRemoteDatasource

  // ==================== REPOSITORIES ====================
  // Will be added later when implementing features:
  // - AuthRepository
  // - ChatbotRepository
  // - SubscriptionRepository
  // - ProfileRepository

  // ==================== USE CASES ====================
  // Will be added later when implementing features:
  // - LoginUsecase
  // - RegisterUsecase
  // - SendQueryUsecase
  // - etc.

  // ==================== PROVIDERS ====================
  // Will be added later when implementing features:
  // - AuthProvider
  // - ChatbotProvider
  // - SubscriptionProvider
  // - ProfileProvider
}

/// Clear all dependencies (for testing)
Future<void> clearDependencies() async {
  await getIt.reset();
}

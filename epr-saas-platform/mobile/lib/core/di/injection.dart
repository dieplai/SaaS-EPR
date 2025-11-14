import 'package:get_it/get_it.dart';
import '../network/dio_client.dart';
import '../storage/secure_storage.dart';
import '../storage/local_storage.dart';

// Auth
import '../../features/auth/data/datasources/auth_remote_datasource.dart';
import '../../features/auth/data/repositories/auth_repository_impl.dart';
import '../../features/auth/domain/repositories/auth_repository.dart';
import '../../features/auth/domain/usecases/login_usecase.dart';
import '../../features/auth/domain/usecases/register_usecase.dart';
import '../../features/auth/domain/usecases/logout_usecase.dart';
import '../../features/auth/domain/usecases/get_current_user_usecase.dart';
import '../../features/auth/presentation/providers/auth_provider.dart';

// Chatbot
import '../../features/chatbot/data/datasources/chatbot_remote_datasource.dart';
import '../../features/chatbot/data/repositories/chatbot_repository_impl.dart';
import '../../features/chatbot/domain/repositories/chatbot_repository.dart';
import '../../features/chatbot/domain/usecases/send_query_usecase.dart';
import '../../features/chatbot/domain/usecases/get_chat_history_usecase.dart';
import '../../features/chatbot/domain/usecases/create_conversation_usecase.dart';
import '../../features/chatbot/domain/usecases/get_conversations_usecase.dart';
import '../../features/chatbot/domain/usecases/get_citations_usecase.dart';
import '../../features/chatbot/domain/usecases/delete_conversation_usecase.dart';
import '../../features/chatbot/presentation/providers/chatbot_provider.dart';

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

  // Chatbot
  getIt.registerLazySingleton<ChatbotRemoteDatasource>(
    () => ChatbotRemoteDatasource(getIt<DioClient>()),
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

  // Chatbot
  getIt.registerLazySingleton<ChatbotRepository>(
    () => ChatbotRepositoryImpl(
      remoteDatasource: getIt<ChatbotRemoteDatasource>(),
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

  // Chatbot
  getIt.registerLazySingleton<SendQueryUsecase>(
    () => SendQueryUsecase(getIt<ChatbotRepository>()),
  );
  getIt.registerLazySingleton<GetChatHistoryUsecase>(
    () => GetChatHistoryUsecase(getIt<ChatbotRepository>()),
  );
  getIt.registerLazySingleton<CreateConversationUsecase>(
    () => CreateConversationUsecase(getIt<ChatbotRepository>()),
  );
  getIt.registerLazySingleton<GetConversationsUsecase>(
    () => GetConversationsUsecase(getIt<ChatbotRepository>()),
  );
  getIt.registerLazySingleton<GetCitationsUsecase>(
    () => GetCitationsUsecase(getIt<ChatbotRepository>()),
  );
  getIt.registerLazySingleton<DeleteConversationUsecase>(
    () => DeleteConversationUsecase(getIt<ChatbotRepository>()),
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

  // Chatbot (Factory - new instance each time)
  getIt.registerFactory<ChatbotProvider>(
    () => ChatbotProvider(
      sendQueryUsecase: getIt<SendQueryUsecase>(),
      getChatHistoryUsecase: getIt<GetChatHistoryUsecase>(),
      createConversationUsecase: getIt<CreateConversationUsecase>(),
      getConversationsUsecase: getIt<GetConversationsUsecase>(),
      getCitationsUsecase: getIt<GetCitationsUsecase>(),
      deleteConversationUsecase: getIt<DeleteConversationUsecase>(),
    ),
  );
}

/// Clear all dependencies (for testing)
Future<void> clearDependencies() async {
  await getIt.reset();
}

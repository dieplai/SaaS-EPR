# EPR Legal Mobile - Project Structure

## 📂 Complete Directory Structure

```
mobile/
├── lib/
│   ├── app/
│   │   ├── app.dart                          # MaterialApp root
│   │   ├── routes/
│   │   │   ├── app_router.dart               # GoRouter configuration
│   │   │   └── route_names.dart              # Route constants
│   │   ├── theme/
│   │   │   ├── app_theme.dart                # Light/Dark themes ✅
│   │   │   ├── app_colors.dart               # Color palette ✅
│   │   │   └── app_text_styles.dart          # Typography ✅
│   │   └── constants/
│   │       ├── api_constants.dart            # API endpoints ✅
│   │       ├── app_constants.dart            # App configs ✅
│   │       └── storage_keys.dart             # Storage keys ✅
│   │
│   ├── core/
│   │   ├── network/
│   │   │   ├── dio_client.dart               # HTTP client ✅
│   │   │   └── network_info.dart             # Connectivity check
│   │   ├── storage/
│   │   │   ├── secure_storage.dart           # JWT tokens ✅
│   │   │   └── local_storage.dart            # SharedPreferences ✅
│   │   ├── error/
│   │   │   ├── failures.dart                 # Domain failures ✅
│   │   │   └── exceptions.dart               # Data exceptions ✅
│   │   ├── utils/
│   │   │   ├── validators.dart               # Input validation ✅
│   │   │   └── logger.dart                   # Debug logger ✅
│   │   └── di/
│   │       └── injection.dart                # GetIt DI setup ✅
│   │
│   ├── features/
│   │   ├── auth/                             # ✅ COMPLETED
│   │   │   ├── data/
│   │   │   │   ├── models/
│   │   │   │   │   ├── user_model.dart       # JSON model ✅
│   │   │   │   │   └── login_response_model.dart ✅
│   │   │   │   ├── datasources/
│   │   │   │   │   └── auth_remote_datasource.dart ✅
│   │   │   │   └── repositories/
│   │   │   │       └── auth_repository_impl.dart ✅
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   └── user.dart             # Domain entity ✅
│   │   │   │   ├── repositories/
│   │   │   │   │   └── auth_repository.dart  # Interface ✅
│   │   │   │   └── usecases/
│   │   │   │       ├── login_usecase.dart    ✅
│   │   │   │       ├── register_usecase.dart ✅
│   │   │   │       └── logout_usecase.dart   ✅
│   │   │   └── presentation/
│   │   │       ├── providers/
│   │   │       │   └── auth_provider.dart    # State mgmt ✅
│   │   │       ├── screens/
│   │   │       │   ├── login_screen.dart     ✅
│   │   │       │   └── register_screen.dart  # TODO
│   │   │       └── widgets/
│   │   │           └── auth_text_field.dart  # TODO
│   │   │
│   │   ├── chatbot/                          # 🚧 TODO
│   │   │   ├── data/
│   │   │   │   ├── models/
│   │   │   │   │   ├── chat_message_model.dart
│   │   │   │   │   ├── citation_model.dart
│   │   │   │   │   └── query_response_model.dart
│   │   │   │   ├── datasources/
│   │   │   │   │   └── chatbot_remote_datasource.dart
│   │   │   │   └── repositories/
│   │   │   │       └── chatbot_repository_impl.dart
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   ├── chat_message.dart
│   │   │   │   │   └── citation.dart
│   │   │   │   ├── repositories/
│   │   │   │   │   └── chatbot_repository.dart
│   │   │   │   └── usecases/
│   │   │   │       ├── send_query_usecase.dart
│   │   │   │       └── get_chat_history_usecase.dart
│   │   │   └── presentation/
│   │   │       ├── providers/
│   │   │       │   └── chatbot_provider.dart
│   │   │       ├── screens/
│   │   │       │   └── chat_screen.dart
│   │   │       └── widgets/
│   │   │           ├── message_bubble.dart
│   │   │           ├── typing_indicator.dart
│   │   │           └── citation_card.dart
│   │   │
│   │   ├── subscription/                     # 🚧 TODO
│   │   │   ├── data/
│   │   │   ├── domain/
│   │   │   └── presentation/
│   │   │
│   │   └── profile/                          # 🚧 TODO
│   │       ├── data/
│   │       ├── domain/
│   │       └── presentation/
│   │
│   ├── shared/
│   │   └── widgets/
│   │       ├── loading_indicator.dart
│   │       ├── error_view.dart
│   │       ├── custom_app_bar.dart
│   │       └── empty_state.dart
│   │
│   └── main.dart                             # App entry point ✅
│
├── test/
│   ├── unit/
│   ├── widget/
│   └── integration/
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── pubspec.yaml                              # Dependencies ✅
├── analysis_options.yaml                     # Lint rules ✅
├── build.yaml                                # Code gen config ✅
├── .env.dev                                  # Dev environment ✅
├── .env.prod                                 # Prod environment ✅
├── .gitignore                                ✅
├── README.md                                 # Documentation ✅
├── INSTALL.md                                # Flutter setup guide ✅
└── PROJECT_STRUCTURE.md                      # This file ✅
```

## 🏗️ Architecture Layers

### 1. **Presentation Layer**
**Path**: `lib/features/{feature}/presentation/`

**Purpose**: UI components and state management

**Components**:
- **Screens**: Full-page UI (LoginScreen, ChatScreen)
- **Widgets**: Reusable UI components (MessageBubble, CitationCard)
- **Providers**: State management with Provider pattern

**Example**:
```dart
// Screen
class LoginScreen extends StatefulWidget {
  // Build UI, handle user interactions
}

// Provider
class AuthProvider extends ChangeNotifier {
  // Manage auth state, call usecases
  Future<bool> login(String email, String password) {
    final result = await loginUsecase(email, password);
    notifyListeners();
  }
}
```

**Rules**:
- ❌ NO business logic in screens
- ❌ NO direct API calls
- ✅ Call usecases via providers
- ✅ Listen to state changes

---

### 2. **Domain Layer**
**Path**: `lib/features/{feature}/domain/`

**Purpose**: Business logic, independent of UI and data sources

**Components**:
- **Entities**: Pure domain models (User, ChatMessage)
- **Repositories**: Abstract interfaces (AuthRepository)
- **Usecases**: Single-responsibility business actions (LoginUsecase)

**Example**:
```dart
// Entity
class User extends Equatable {
  final String id;
  final String email;
  final String name;
}

// Repository interface
abstract class AuthRepository {
  Future<Either<Failure, User>> login(String email, String password);
}

// Usecase
class LoginUsecase {
  final AuthRepository repository;

  Future<Either<Failure, User>> call(String email, String password) {
    return repository.login(email, password);
  }
}
```

**Rules**:
- ❌ NO dependencies on data layer or presentation
- ❌ NO framework-specific code (Flutter, Dio, etc.)
- ✅ Pure Dart code
- ✅ Testable

---

### 3. **Data Layer**
**Path**: `lib/features/{feature}/data/`

**Purpose**: Data management (API, database, cache)

**Components**:
- **Models**: JSON-serializable DTOs (UserModel)
- **Datasources**: API clients, local database (AuthRemoteDatasource)
- **Repositories**: Implementation of domain interfaces (AuthRepositoryImpl)

**Example**:
```dart
// Model (API response)
@JsonSerializable()
class UserModel extends User {
  factory UserModel.fromJson(Map<String, dynamic> json);

  User toEntity() => User(id, email, name);
}

// Datasource (API calls)
class AuthRemoteDatasource {
  Future<LoginResponseModel> login(String email, String password) async {
    final response = await dioClient.post('/auth/login', data: {...});
    return LoginResponseModel.fromJson(response.data);
  }
}

// Repository implementation
class AuthRepositoryImpl implements AuthRepository {
  Future<Either<Failure, User>> login(String email, String password) async {
    try {
      final response = await datasource.login(email, password);
      await storage.saveTokens(response.tokens);
      return Right(response.user.toEntity());
    } catch (e) {
      return Left(ServerFailure(e.message));
    }
  }
}
```

**Rules**:
- ✅ Handle exceptions and convert to Failures
- ✅ Use models for JSON serialization
- ✅ Implement domain repository interfaces

---

## 🔄 Data Flow

```
User Action (UI)
    ↓
Provider (Presentation)
    ↓
Usecase (Domain)
    ↓
Repository Interface (Domain)
    ↓
Repository Implementation (Data)
    ↓
Datasource (API/Local)
    ↓
API Response
    ↓
Model → Entity
    ↓
Usecase
    ↓
Provider (notifyListeners)
    ↓
UI Update
```

## 🧪 Example: Login Flow

```dart
// 1. User taps "Login" button
void _handleLogin() {
  final provider = context.read<AuthProvider>();
  provider.login(email, password);
}

// 2. Provider calls usecase
class AuthProvider {
  Future<bool> login(String email, String password) {
    final result = await loginUsecase(email: email, password: password);
    // Handle result...
  }
}

// 3. Usecase calls repository
class LoginUsecase {
  Future<Either<Failure, User>> call({email, password}) {
    return repository.login(email: email, password: password);
  }
}

// 4. Repository calls datasource
class AuthRepositoryImpl {
  Future<Either<Failure, User>> login({email, password}) async {
    try {
      final response = await datasource.login(email, password);
      await storage.saveTokens(response.accessToken, response.refreshToken);
      return Right(response.user.toEntity());
    } catch (e) {
      return Left(ServerFailure(e.message));
    }
  }
}

// 5. Datasource makes API call
class AuthRemoteDatasource {
  Future<LoginResponseModel> login(email, password) async {
    final response = await dioClient.post('/auth/login', data: {...});
    return LoginResponseModel.fromJson(response.data['data']);
  }
}
```

## 🎯 Feature Checklist

### ✅ Authentication (Completed)
- [x] Domain layer (entities, usecases, repository interface)
- [x] Data layer (models, datasource, repository impl)
- [x] Presentation layer (provider, login screen)
- [x] Dependency injection setup
- [ ] Register screen
- [ ] Forgot password
- [ ] Unit tests

### 🚧 Chatbot (TODO)
- [ ] Domain layer
- [ ] Data layer
- [ ] Presentation layer (chat UI)
- [ ] Session management
- [ ] Citation display
- [ ] PDF viewer integration

### 🚧 Subscription (TODO)
- [ ] Domain layer
- [ ] Data layer
- [ ] Presentation layer (package list, subscribe)
- [ ] Quota display

### 🚧 Profile (TODO)
- [ ] Domain layer
- [ ] Data layer
- [ ] Presentation layer (user profile, edit profile)

## 📝 Development Guidelines

### Adding a New Feature

1. **Create feature folder structure**
   ```bash
   mkdir -p lib/features/my_feature/{data,domain,presentation}/{models,datasources,repositories,entities,usecases,providers,screens,widgets}
   ```

2. **Start with Domain layer** (entities, repository interface, usecases)

3. **Implement Data layer** (models, datasource, repository impl)

4. **Build Presentation layer** (screens, widgets, providers)

5. **Register in DI** (injection.dart)

6. **Write tests**

### Code Generation

After creating/modifying models with `@JsonSerializable`:

```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

### Best Practices

- ✅ Single Responsibility Principle
- ✅ Dependency Inversion (depend on abstractions)
- ✅ Separation of Concerns
- ✅ Immutable entities
- ✅ Either<Failure, Success> for error handling
- ✅ Provider for state management
- ✅ GetIt for dependency injection

## 🚀 Next Steps

1. **Cài đặt Flutter SDK** (xem INSTALL.md)
2. **Run project**:
   ```bash
   flutter pub get
   flutter pub run build_runner build --delete-conflicting-outputs
   flutter run
   ```
3. **Implement Register screen**
4. **Implement Chatbot feature** (high priority)
5. **Write tests**

## 📚 Resources

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Flutter Documentation](https://docs.flutter.dev)
- [Provider State Management](https://pub.dev/packages/provider)
- [GetIt Dependency Injection](https://pub.dev/packages/get_it)

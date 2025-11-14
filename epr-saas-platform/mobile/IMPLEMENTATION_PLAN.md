# EPR Legal Mobile - Implementation Plan

## 📊 Tổng Quan

**Tổng số files cần tạo**: ~95 files Dart
**Ước tính thời gian**: 2-3 ngày development
**Độ phức tạp**: Medium-High

---

## 📂 Cấu Trúc Files Sẽ Tạo

```
lib/
├── main.dart                                    # [1] Entry point
│
├── app/                                         # [12 files] App configuration
│   ├── app.dart
│   ├── routes/
│   │   ├── app_router.dart
│   │   └── route_names.dart
│   ├── theme/
│   │   ├── app_theme.dart
│   │   ├── app_colors.dart
│   │   ├── app_text_styles.dart
│   │   └── app_dimensions.dart
│   └── constants/
│       ├── api_constants.dart
│       ├── app_constants.dart
│       ├── storage_keys.dart
│       └── asset_paths.dart
│
├── core/                                        # [14 files] Core utilities
│   ├── network/
│   │   ├── dio_client.dart
│   │   ├── network_info.dart
│   │   └── api_interceptors.dart
│   ├── storage/
│   │   ├── secure_storage.dart
│   │   └── local_storage.dart
│   ├── error/
│   │   ├── failures.dart
│   │   ├── exceptions.dart
│   │   └── error_handler.dart
│   ├── utils/
│   │   ├── validators.dart
│   │   ├── logger.dart
│   │   ├── date_formatter.dart
│   │   └── string_extensions.dart
│   └── di/
│       └── injection.dart
│       └── injection.config.dart (generated)
│
├── features/                                    # [68 files] Feature modules
│   │
│   ├── auth/                                    # [17 files] Authentication
│   │   ├── data/
│   │   │   ├── models/
│   │   │   │   ├── user_model.dart
│   │   │   │   ├── user_model.g.dart (generated)
│   │   │   │   ├── login_request_model.dart
│   │   │   │   ├── login_response_model.dart
│   │   │   │   └── login_response_model.g.dart (generated)
│   │   │   ├── datasources/
│   │   │   │   └── auth_remote_datasource.dart
│   │   │   └── repositories/
│   │   │       └── auth_repository_impl.dart
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── user.dart
│   │   │   ├── repositories/
│   │   │   │   └── auth_repository.dart
│   │   │   └── usecases/
│   │   │       ├── login_usecase.dart
│   │   │       ├── register_usecase.dart
│   │   │       └── logout_usecase.dart
│   │   └── presentation/
│   │       ├── providers/
│   │       │   └── auth_provider.dart
│   │       ├── screens/
│   │       │   ├── splash_screen.dart
│   │       │   ├── login_screen.dart
│   │       │   └── register_screen.dart
│   │       └── widgets/
│   │           ├── auth_text_field.dart
│   │           ├── password_strength_indicator.dart
│   │           └── social_login_button.dart
│   │
│   ├── home/                                    # [10 files] Dashboard
│   │   ├── data/
│   │   │   ├── models/
│   │   │   │   └── dashboard_stats_model.dart
│   │   │   ├── datasources/
│   │   │   │   └── home_remote_datasource.dart
│   │   │   └── repositories/
│   │   │       └── home_repository_impl.dart
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── dashboard_stats.dart
│   │   │   ├── repositories/
│   │   │   │   └── home_repository.dart
│   │   │   └── usecases/
│   │   │       └── get_dashboard_stats_usecase.dart
│   │   └── presentation/
│   │       ├── providers/
│   │       │   └── home_provider.dart
│   │       ├── screens/
│   │       │   └── home_screen.dart
│   │       └── widgets/
│   │           ├── quota_card.dart
│   │           ├── feature_grid.dart
│   │           └── recent_conversations_list.dart
│   │
│   ├── chatbot/                                 # [20 files] AI Chat (MAIN FEATURE)
│   │   ├── data/
│   │   │   ├── models/
│   │   │   │   ├── chat_message_model.dart
│   │   │   │   ├── chat_message_model.g.dart (generated)
│   │   │   │   ├── citation_model.dart
│   │   │   │   ├── citation_model.g.dart (generated)
│   │   │   │   └── query_response_model.dart
│   │   │   ├── datasources/
│   │   │   │   └── chatbot_remote_datasource.dart
│   │   │   └── repositories/
│   │   │       └── chatbot_repository_impl.dart
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── chat_message.dart
│   │   │   │   ├── citation.dart
│   │   │   │   └── conversation.dart
│   │   │   ├── repositories/
│   │   │   │   └── chatbot_repository.dart
│   │   │   └── usecases/
│   │   │       ├── send_query_usecase.dart
│   │   │       ├── get_chat_history_usecase.dart
│   │   │       └── create_conversation_usecase.dart
│   │   └── presentation/
│   │       ├── providers/
│   │       │   └── chatbot_provider.dart
│   │       ├── screens/
│   │       │   ├── chat_screen.dart
│   │       │   ├── chat_list_screen.dart
│   │       │   └── citation_detail_screen.dart
│   │       └── widgets/
│   │           ├── message_bubble.dart
│   │           ├── typing_indicator.dart
│   │           ├── citation_card.dart
│   │           └── chat_input_field.dart
│   │
│   ├── subscription/                            # [12 files] Package Management
│   │   ├── data/
│   │   │   ├── models/
│   │   │   │   ├── package_model.dart
│   │   │   │   └── subscription_model.dart
│   │   │   ├── datasources/
│   │   │   │   └── subscription_remote_datasource.dart
│   │   │   └── repositories/
│   │   │       └── subscription_repository_impl.dart
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   ├── package.dart
│   │   │   │   └── subscription.dart
│   │   │   ├── repositories/
│   │   │   │   └── subscription_repository.dart
│   │   │   └── usecases/
│   │   │       ├── get_packages_usecase.dart
│   │   │       └── subscribe_usecase.dart
│   │   └── presentation/
│   │       ├── providers/
│   │       │   └── subscription_provider.dart
│   │       ├── screens/
│   │       │   └── subscription_screen.dart
│   │       └── widgets/
│   │           └── package_card.dart
│   │
│   └── profile/                                 # [9 files] User Profile
│       ├── data/
│       │   ├── models/
│       │   │   └── profile_model.dart
│       │   ├── datasources/
│       │   │   └── profile_remote_datasource.dart
│       │   └── repositories/
│       │       └── profile_repository_impl.dart
│       ├── domain/
│       │   ├── entities/
│       │   │   └── profile.dart
│       │   ├── repositories/
│       │   │   └── profile_repository.dart
│       │   └── usecases/
│       │       └── get_profile_usecase.dart
│       └── presentation/
│           ├── providers/
│           │   └── profile_provider.dart
│           ├── screens/
│           │   └── profile_screen.dart
│           └── widgets/
│               ├── profile_header.dart
│               └── settings_list.dart
│
└── shared/                                      # [8 files] Shared widgets
    └── widgets/
        ├── loading_indicator.dart
        ├── error_view.dart
        ├── empty_state.dart
        ├── custom_app_bar.dart
        ├── primary_button.dart
        ├── secondary_button.dart
        ├── custom_text_field.dart
        └── custom_card.dart
```

**Total**: 1 + 12 + 14 + 68 + 8 = **103 files**

---

## 📅 Implementation Phases

### Phase 1: Foundation (Day 1 Morning) ⏱️ 3-4 hours
**Priority**: P0 (Critical)

- [ ] 1. Setup `main.dart` với MaterialApp
- [ ] 2. Create theme system
  - `app_colors.dart` - Định nghĩa màu sắc
  - `app_text_styles.dart` - Typography
  - `app_theme.dart` - ThemeData
  - `app_dimensions.dart` - Spacing constants
- [ ] 3. Create constants
  - `api_constants.dart` - API endpoints
  - `storage_keys.dart` - Storage keys
  - `route_names.dart` - Route paths
- [ ] 4. Setup core utilities
  - `dio_client.dart` - HTTP client
  - `secure_storage.dart` - JWT storage
  - `local_storage.dart` - SharedPreferences
  - `validators.dart` - Form validation
  - `logger.dart` - Debug logging
- [ ] 5. Setup dependency injection
  - `injection.dart` - GetIt setup
- [ ] 6. Create shared widgets
  - `primary_button.dart`
  - `secondary_button.dart`
  - `custom_text_field.dart`
  - `loading_indicator.dart`
  - `error_view.dart`

**Output**: App runs with basic theme ✅

---

### Phase 2: Authentication (Day 1 Afternoon) ⏱️ 4-5 hours
**Priority**: P0 (Critical)

- [ ] 7. Create auth domain layer
  - `user.dart` entity
  - `auth_repository.dart` interface
  - `login_usecase.dart`
  - `register_usecase.dart`
  - `logout_usecase.dart`
- [ ] 8. Create auth data layer
  - `user_model.dart` + JSON serialization
  - `login_request_model.dart`
  - `login_response_model.dart`
  - `auth_remote_datasource.dart` - API calls
  - `auth_repository_impl.dart` - Implementation
- [ ] 9. Create auth presentation
  - `auth_provider.dart` - State management
  - `splash_screen.dart` - App launch screen
  - `login_screen.dart` - Login UI
  - `register_screen.dart` - Register UI
  - `auth_text_field.dart` - Reusable input
  - `password_strength_indicator.dart`
- [ ] 10. Setup routing
  - `app_router.dart` - GoRouter configuration
- [ ] 11. Run code generation
  ```bash
  flutter pub run build_runner build --delete-conflicting-outputs
  ```

**Output**: User can login/register/logout ✅

---

### Phase 3: Home Dashboard (Day 2 Morning) ⏱️ 3-4 hours
**Priority**: P0 (Critical)

- [ ] 12. Create home domain
  - `dashboard_stats.dart` entity
  - `home_repository.dart` interface
  - `get_dashboard_stats_usecase.dart`
- [ ] 13. Create home data layer
  - `dashboard_stats_model.dart`
  - `home_remote_datasource.dart`
  - `home_repository_impl.dart`
- [ ] 14. Create home presentation
  - `home_provider.dart`
  - `home_screen.dart` - Dashboard UI
  - `quota_card.dart` - Subscription status
  - `feature_grid.dart` - 4 feature cards
  - `recent_conversations_list.dart` - Chat history
- [ ] 15. Create tab bar navigation
  - Update `app_router.dart` with bottom tabs

**Output**: Home screen với dashboard ✅

---

### Phase 4: AI Chatbot (Day 2 Afternoon + Evening) ⏱️ 6-7 hours
**Priority**: P0 (Critical - MAIN FEATURE)

- [ ] 16. Create chatbot domain
  - `chat_message.dart` entity
  - `citation.dart` entity
  - `conversation.dart` entity
  - `chatbot_repository.dart` interface
  - `send_query_usecase.dart`
  - `get_chat_history_usecase.dart`
  - `create_conversation_usecase.dart`
- [ ] 17. Create chatbot data layer
  - `chat_message_model.dart` + JSON
  - `citation_model.dart` + JSON
  - `query_response_model.dart`
  - `chatbot_remote_datasource.dart` - Streaming API
  - `chatbot_repository_impl.dart`
- [ ] 18. Create chatbot presentation
  - `chatbot_provider.dart` - Complex state management
  - `chat_screen.dart` - Main chat UI
  - `chat_list_screen.dart` - Conversation list
  - `citation_detail_screen.dart` - Legal document viewer
  - `message_bubble.dart` - User/AI message
  - `typing_indicator.dart` - AI typing animation
  - `citation_card.dart` - Citation display
  - `chat_input_field.dart` - Message input
- [ ] 19. Integrate `flutter_chat_ui` package
- [ ] 20. Test real-time chat functionality

**Output**: Full chat functionality với citations ✅

---

### Phase 5: Subscription (Day 3 Morning) ⏱️ 3-4 hours
**Priority**: P1 (High)

- [ ] 21. Create subscription domain
  - `package.dart` entity
  - `subscription.dart` entity
  - `subscription_repository.dart` interface
  - `get_packages_usecase.dart`
  - `subscribe_usecase.dart`
- [ ] 22. Create subscription data layer
  - `package_model.dart`
  - `subscription_model.dart`
  - `subscription_remote_datasource.dart`
  - `subscription_repository_impl.dart`
- [ ] 23. Create subscription presentation
  - `subscription_provider.dart`
  - `subscription_screen.dart` - Plan list
  - `package_card.dart` - Individual plan card
- [ ] 24. Add payment integration (if needed)

**Output**: Subscription screen với 3 tiers ✅

---

### Phase 6: Profile (Day 3 Afternoon) ⏱️ 2-3 hours
**Priority**: P1 (High)

- [ ] 25. Create profile domain
  - `profile.dart` entity
  - `profile_repository.dart` interface
  - `get_profile_usecase.dart`
  - `update_profile_usecase.dart`
- [ ] 26. Create profile data layer
  - `profile_model.dart`
  - `profile_remote_datasource.dart`
  - `profile_repository_impl.dart`
- [ ] 27. Create profile presentation
  - `profile_provider.dart`
  - `profile_screen.dart` - Settings UI
  - `profile_header.dart` - Avatar + name
  - `settings_list.dart` - Settings items
- [ ] 28. Add logout functionality

**Output**: Profile screen với settings ✅

---

### Phase 7: Polish & Testing (Day 3 Evening) ⏱️ 2-3 hours
**Priority**: P2 (Medium)

- [ ] 29. Add error handling
  - `failures.dart` - Domain errors
  - `exceptions.dart` - Data errors
  - `error_handler.dart` - Global error handling
- [ ] 30. Add animations
  - Screen transitions
  - Button interactions
  - Loading states
  - Toast notifications
- [ ] 31. Test flows
  - Login → Home → Chat → Send query
  - View quota → Upgrade subscription
  - View profile → Logout
- [ ] 32. Fix bugs
- [ ] 33. Optimize performance
  - Add pagination for chat history
  - Lazy loading
  - Image caching

**Output**: Production-ready app ✅

---

## 🚀 Development Commands

### Initial Setup
```bash
# Navigate to project
cd epr-saas-platform/mobile

# Install dependencies
flutter pub get

# Run code generation (after creating models)
flutter pub run build_runner build --delete-conflicting-outputs

# Run app
flutter run
```

### During Development
```bash
# Watch mode (auto-generate on file changes)
flutter pub run build_runner watch

# Hot reload: Press 'r' in terminal
# Hot restart: Press 'R' in terminal

# Clean build
flutter clean
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```

### Testing
```bash
# Run all tests
flutter test

# Run specific test
flutter test test/features/auth/login_test.dart

# Coverage
flutter test --coverage
```

### Build
```bash
# Debug APK
flutter build apk --debug

# Release APK
flutter build apk --release

# App Bundle (for Play Store)
flutter build appbundle --release
```

---

## 📦 Dependencies to Add

These are already in `pubspec.yaml`:
- ✅ provider (state management)
- ✅ dio (HTTP client)
- ✅ flutter_secure_storage (JWT storage)
- ✅ get_it + injectable (DI)
- ✅ go_router (navigation)
- ✅ freezed + json_serializable (code gen)
- ✅ flutter_chat_ui (chat UI)
- ✅ dartz (Either pattern)
- ✅ equatable (value equality)

Additional packages to consider:
```yaml
# Add to pubspec.yaml if needed
dependencies:
  shimmer: ^3.0.0                # Skeleton loading
  pull_to_refresh: ^2.0.0        # Pull to refresh
  image_picker: ^1.0.7           # Upload images in chat

dev_dependencies:
  mockito: ^5.4.4                # Mocking for tests
  bloc_test: ^9.1.5              # If using Bloc (optional)
```

---

## ⚠️ Important Notes

### Code Generation
Whenever you create/modify files with these annotations:
- `@JsonSerializable()` (json_serializable)
- `@freezed` (freezed)
- `@injectable` (injectable)

You MUST run:
```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

### Environment Variables
Make sure backend services are running:
```bash
# In epr-saas-platform directory
docker-compose up -d

# Verify services
curl http://localhost:8001/api/v1/health  # User service
curl http://localhost:8002/api/v1/health  # Package service
curl http://localhost:8004/api/v1/health  # AI chatbot
```

### Android Emulator Network
If testing on Android emulator, use `10.0.2.2` instead of `localhost`:
```dart
// .env.dev
USER_SERVICE_URL=http://10.0.2.2:8001/api/v1
```

### iOS Simulator
For iOS simulator, `localhost` works fine.

---

## 🎯 Success Criteria

### MVP (Minimum Viable Product)
- [x] User can register
- [x] User can login
- [x] User can see dashboard with quota
- [x] User can ask questions to AI chatbot
- [x] User can view legal citations
- [x] User can view subscription plans
- [x] User can view/edit profile
- [x] User can logout

### Nice to Have (Post-MVP)
- [ ] Dark mode toggle works
- [ ] Push notifications
- [ ] PDF viewer for legal documents
- [ ] Share conversations
- [ ] Export chat to PDF
- [ ] Multi-language support
- [ ] Offline mode with local cache

---

## 📊 Progress Tracking

Use this checklist during implementation:

```
Foundation:      [ ] 0/6
Authentication:  [ ] 0/5
Home:            [ ] 0/4
Chatbot:         [ ] 0/5
Subscription:    [ ] 0/4
Profile:         [ ] 0/4
Polish:          [ ] 0/5

Total Progress: 0/33 tasks (0%)
```

---

## 🤝 Ready to Start?

Tôi đã lên kế hoạch chi tiết cho 103 files cần tạo, chia thành 7 phases qua 3 ngày.

**Bạn muốn tôi:**
1. ✅ **Bắt đầu Phase 1** (Foundation - Theme + Core utilities)?
2. 📝 **Thay đổi kế hoạch** (ví dụ: làm feature nào trước)?
3. ❓ **Giải thích thêm** về một phase cụ thể?

Hoặc chỉ cần nói: **"OK, start Phase 1!"** 🚀

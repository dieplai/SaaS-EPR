import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'app/theme/app_theme.dart';
import 'app/constants/app_constants.dart';
import 'core/di/injection.dart';
import 'features/auth/presentation/providers/auth_provider.dart';
import 'features/auth/presentation/screens/splash_screen.dart';
import 'features/auth/presentation/screens/login_screen.dart';
import 'features/auth/presentation/screens/register_screen.dart';
import 'features/chatbot/presentation/providers/chatbot_provider.dart';
import 'features/chatbot/presentation/screens/chat_screen.dart';

void main() async {
  // Ensure Flutter bindings are initialized
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize dependencies
  await initDependencies();

  // Set system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(AppTheme.darkOverlay);

  // Set preferred orientations (portrait only)
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Run app
  runApp(const EPRLegalApp());
}

class EPRLegalApp extends StatelessWidget {
  const EPRLegalApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        // Auth Provider
        ChangeNotifierProvider<AuthProvider>(
          create: (_) => getIt<AuthProvider>(),
        ),
        // Chatbot Provider
        ChangeNotifierProvider<ChatbotProvider>(
          create: (_) => getIt<ChatbotProvider>(),
        ),
        // TODO: Add more providers here when implementing other features
        // - SubscriptionProvider
        // - ProfileProvider
      ],
      child: MaterialApp(
        // App configuration
        title: AppConstants.appName,
        debugShowCheckedModeBanner: false,

        // Theme
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.light,

        // Routes
        initialRoute: '/',
        routes: {
          '/': (context) => const SplashScreen(),
          '/login': (context) => const LoginScreen(),
          '/register': (context) => const RegisterScreen(),
          '/chat': (context) => const ChatScreen(),
          // TODO: Add more routes when implementing other features
          // '/main': (context) => const MainScreen(),
        },
      ),
    );
  }
}

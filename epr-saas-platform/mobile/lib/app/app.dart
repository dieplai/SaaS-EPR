import 'package:flutter/material.dart';

import 'theme/app_theme.dart';
import '../features/auth/presentation/screens/login_screen.dart';
import '../features/auth/presentation/screens/register_screen.dart';
import '../features/auth/presentation/screens/splash_screen.dart';
import '../features/main/presentation/screens/main_screen.dart';
import '../features/home/presentation/screens/home_screen.dart';
import '../features/chatbot/presentation/screens/chat_screen.dart';

/// EPR Legal Mobile App
class EPRLegalApp extends StatelessWidget {
  const EPRLegalApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'EPR Legal',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.light,
      home: const SplashScreen(),
      routes: {
        '/splash': (context) => const SplashScreen(),
        '/login': (context) => const LoginScreen(),
        '/register': (context) => const RegisterScreen(),
        '/main': (context) => const MainScreen(),
        '/home': (context) => const HomeScreen(),
        '/chat': (context) => const ChatScreen(),
      },
    );
  }
}

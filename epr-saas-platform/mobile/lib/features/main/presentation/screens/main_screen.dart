import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_text_styles.dart';
import '../../../../shared/widgets/app_drawer.dart';
import '../../../chatbot/presentation/screens/chat_screen.dart';

/// Main screen - Perplexity Pro style layout
/// Clean design: top bar + chat + input
class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  final _scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: AppColors.background,
      drawer: const AppDrawer(),
      body: SafeArea(
        child: Column(
          children: [
            // Top bar - Hamburger menu, Settings & History icons
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  // Hamburger menu
                  IconButton(
                    icon: const Icon(Icons.menu),
                    color: AppColors.textSecondary,
                    onPressed: () {
                      _scaffoldKey.currentState?.openDrawer();
                    },
                  ),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.history_outlined),
                    color: AppColors.textSecondary,
                    onPressed: () {
                      // TODO: Show conversation history
                    },
                  ),
                  IconButton(
                    icon: const Icon(Icons.settings_outlined),
                    color: AppColors.textSecondary,
                    onPressed: () {
                      // TODO: Settings
                    },
                  ),
                ],
              ),
            ),

            const Divider(height: 1),

            // Chat area
            const Expanded(
              child: ChatScreen(),
            ),
          ],
        ),
      ),
    );
  }
}

// Placeholder screens (to be implemented)
class _SubscriptionPlaceholder extends StatelessWidget {
  const _SubscriptionPlaceholder();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Gói dịch vụ'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.card_membership,
              size: 64,
              color: AppColors.textSecondary,
            ),
            const SizedBox(height: 16),
            Text(
              'Chức năng đang được phát triển',
              style: AppTextStyles.bodyLarge.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfilePlaceholder extends StatelessWidget {
  const _ProfilePlaceholder();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Hồ sơ'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.person,
              size: 64,
              color: AppColors.textSecondary,
            ),
            const SizedBox(height: 16),
            Text(
              'Chức năng đang được phát triển',
              style: AppTextStyles.bodyLarge.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

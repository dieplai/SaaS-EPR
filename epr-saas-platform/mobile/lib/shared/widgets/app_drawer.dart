import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_text_styles.dart';
import '../../features/auth/presentation/providers/auth_provider.dart';

/// Custom app drawer (sidebar menu)
class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: const BorderRadius.only(
                  bottomRight: Radius.circular(16),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.balance_outlined,
                      color: Colors.white,
                      size: 28,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'EPR Legal',
                          style: AppTextStyles.headline3.copyWith(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          'AI Pháp lý',
                          style: AppTextStyles.bodySmall.copyWith(
                            color: Colors.white.withOpacity(0.8),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Menu items
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 16),
                children: [
                  _DrawerItem(
                    icon: Icons.home_outlined,
                    label: 'Trang chủ',
                    onTap: () {
                      Navigator.pop(context);
                      // TODO: Navigate to home
                    },
                  ),
                  _DrawerItem(
                    icon: Icons.chat_bubble_outline,
                    label: 'Trò chuyện',
                    onTap: () {
                      Navigator.pop(context);
                      // Already on chat
                    },
                  ),
                  _DrawerItem(
                    icon: Icons.card_membership_outlined,
                    label: 'Gói dịch vụ',
                    onTap: () {
                      Navigator.pop(context);
                      // TODO: Navigate to subscription
                    },
                  ),
                  _DrawerItem(
                    icon: Icons.history_outlined,
                    label: 'Lịch sử cuộc trò chuyện',
                    onTap: () {
                      Navigator.pop(context);
                      // TODO: Navigate to history
                    },
                  ),
                  _DrawerItem(
                    icon: Icons.settings_outlined,
                    label: 'Cài đặt',
                    onTap: () {
                      Navigator.pop(context);
                      // TODO: Navigate to settings
                    },
                  ),
                ],
              ),
            ),

            // Footer
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  const Divider(),
                  const SizedBox(height: 12),
                  _DrawerItem(
                    icon: Icons.person_outline,
                    label: 'Hồ sơ',
                    onTap: () {
                      Navigator.pop(context);
                      // TODO: Navigate to profile
                    },
                  ),
                  _DrawerItem(
                    icon: Icons.logout,
                    label: 'Đăng xuất',
                    onTap: () {
                      Navigator.pop(context);
                      _confirmLogout(context);
                    },
                    color: AppColors.error,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _confirmLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Đăng xuất'),
        content: const Text('Bạn có chắc chắn muốn đăng xuất?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              context.read<AuthProvider>().logout();
              Navigator.of(context).pushNamedAndRemoveUntil(
                '/login',
                (route) => false,
              );
            },
            child: const Text(
              'Đăng xuất',
              style: TextStyle(color: AppColors.error),
            ),
          ),
        ],
      ),
    );
  }
}

/// Single drawer item
class _DrawerItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color color;

  const _DrawerItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.color = AppColors.textPrimary,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: color),
      title: Text(label, style: AppTextStyles.bodyMedium),
      onTap: onTap,
      minLeadingWidth: 24,
    );
  }
}

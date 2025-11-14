import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_text_styles.dart';
import '../../../../app/theme/app_dimensions.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../chatbot/presentation/providers/chatbot_provider.dart';
import '../widgets/quota_card.dart';
import '../widgets/feature_grid.dart';
import '../widgets/recent_conversations_list.dart';

/// Home screen / Dashboard
/// Shows user stats, quota, and quick access to features
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    // Load user's recent conversations
    final chatProvider = context.read<ChatbotProvider>();
    await chatProvider.getConversations();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadData,
          child: CustomScrollView(
            slivers: [
              // App Bar
              _buildAppBar(),

              // Content
              SliverPadding(
                padding: const EdgeInsets.all(AppDimensions.screenPaddingH),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    // Welcome message
                    _buildWelcomeMessage(),

                    const SizedBox(height: AppDimensions.spacingXL),

                    // Quota card
                    const QuotaCard(
                      used: 45,
                      total: 100,
                      planName: 'Gói cơ bản',
                    ),

                    const SizedBox(height: AppDimensions.spacingXL),

                    // Search bar
                    _buildSearchBar(),

                    const SizedBox(height: AppDimensions.spacingXL),

                    // Feature grid
                    const FeatureGrid(),

                    const SizedBox(height: AppDimensions.spacingXL),

                    // Recent conversations header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Cuộc trò chuyện gần đây',
                          style: AppTextStyles.headline3,
                        ),
                        TextButton(
                          onPressed: () {
                            // Navigate to chat history
                          },
                          child: const Text('Xem tất cả'),
                        ),
                      ],
                    ),

                    const SizedBox(height: AppDimensions.spacingMD),

                    // Recent conversations list
                    const RecentConversationsList(),
                  ]),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAppBar() {
    return SliverAppBar(
      floating: true,
      backgroundColor: Colors.white,
      elevation: 0,
      title: Image.asset(
        'assets/images/logo.png',
        height: 32,
        errorBuilder: (context, error, stackTrace) {
          return Row(
            children: [
              Icon(Icons.balance, color: AppColors.primary),
              const SizedBox(width: 8),
              Text(
                'EPR Legal',
                style: AppTextStyles.headline3.copyWith(
                  color: AppColors.primary,
                ),
              ),
            ],
          );
        },
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.notifications_outlined),
          color: AppColors.textPrimary,
          onPressed: () {
            // Navigate to notifications
          },
        ),
        IconButton(
          icon: const Icon(Icons.person_outline),
          color: AppColors.textPrimary,
          onPressed: () {
            // Navigate to profile
          },
        ),
      ],
    );
  }

  Widget _buildWelcomeMessage() {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        final userName = authProvider.user?.name ?? 'Người dùng';
        final firstName = userName.split(' ').first;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Xin chào, $firstName 👋',
              style: AppTextStyles.headline1,
            ),
            const SizedBox(height: AppDimensions.spacingXS),
            Text(
              'Hôm nay bạn cần tư vấn pháp lý gì?',
              style: AppTextStyles.bodyLarge.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildSearchBar() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppDimensions.radiusXL),
        border: Border.all(
          color: AppColors.border,
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: TextField(
        controller: _searchController,
        decoration: InputDecoration(
          hintText: 'Tìm kiếm cuộc trò chuyện...',
          hintStyle: AppTextStyles.bodyMedium.copyWith(
            color: AppColors.textTertiary,
          ),
          prefixIcon: Icon(
            Icons.search,
            color: AppColors.textTertiary,
          ),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: AppDimensions.spacingLG,
            vertical: AppDimensions.spacingMD,
          ),
        ),
        onSubmitted: (query) {
          // TODO: Implement search
        },
      ),
    );
  }
}

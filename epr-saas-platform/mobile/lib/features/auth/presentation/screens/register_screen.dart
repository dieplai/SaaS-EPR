import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_text_styles.dart';
import '../../../../app/theme/app_dimensions.dart';
import '../../../../app/constants/app_constants.dart';
import '../../../../core/utils/validators.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../../shared/widgets/custom_text_field.dart';
import '../../../../shared/widgets/custom_app_bar.dart';
import '../providers/auth_provider.dart';

/// Register screen
/// Clean registration form
class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    context.read<AuthProvider>().clearError();

    if (!_formKey.currentState!.validate()) {
      return;
    }

    final success = await context.read<AuthProvider>().register(
          name: _nameController.text.trim(),
          email: _emailController.text.trim(),
          password: _passwordController.text,
          phone: _phoneController.text.trim().isNotEmpty
              ? _phoneController.text.trim()
              : null,
        );

    if (!mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(AppConstants.successRegister),
          backgroundColor: AppColors.success,
        ),
      );
      // Navigate to main
      // Navigator.pushReplacementNamed(context, RouteNames.main);
    } else {
      final error = context.read<AuthProvider>().errorMessage;
      if (error != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(error),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const CustomAppBar(
        title: 'Đăng ký',
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppDimensions.screenPaddingH),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: AppDimensions.spacingLG),

                // Title
                Text(
                  'Tạo tài khoản mới',
                  style: AppTextStyles.headline2,
                ),

                const SizedBox(height: AppDimensions.spacingMD),

                Text(
                  'Điền thông tin để bắt đầu',
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.textTertiary,
                  ),
                ),

                const SizedBox(height: AppDimensions.spacingXL),

                // Name
                CustomTextField(
                  label: 'Họ và tên *',
                  placeholder: AppConstants.placeholderName,
                  controller: _nameController,
                  textInputAction: TextInputAction.next,
                  prefixIcon: const Icon(Icons.person_outline),
                  validator: Validators.validateName,
                ),

                const SizedBox(height: AppDimensions.spacingLG),

                // Email
                CustomTextField(
                  label: 'Email *',
                  placeholder: AppConstants.placeholderEmail,
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  prefixIcon: const Icon(Icons.email_outlined),
                  validator: Validators.validateEmail,
                ),

                const SizedBox(height: AppDimensions.spacingLG),

                // Phone (optional)
                CustomTextField(
                  label: 'Số điện thoại',
                  placeholder: AppConstants.placeholderPhone,
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  textInputAction: TextInputAction.next,
                  prefixIcon: const Icon(Icons.phone_outlined),
                  validator: (value) {
                    if (value == null || value.isEmpty) return null;
                    return Validators.validatePhone(value);
                  },
                ),

                const SizedBox(height: AppDimensions.spacingLG),

                // Password
                CustomTextField(
                  label: 'Mật khẩu *',
                  placeholder: AppConstants.placeholderPassword,
                  controller: _passwordController,
                  obscureText: true,
                  textInputAction: TextInputAction.next,
                  prefixIcon: const Icon(Icons.lock_outline),
                  validator: Validators.validatePassword,
                ),

                const SizedBox(height: AppDimensions.spacingMD),

                // Password requirements
                _buildPasswordRequirements(),

                const SizedBox(height: AppDimensions.spacingLG),

                // Confirm password
                CustomTextField(
                  label: 'Xác nhận mật khẩu *',
                  placeholder: AppConstants.placeholderPassword,
                  controller: _confirmPasswordController,
                  obscureText: true,
                  textInputAction: TextInputAction.done,
                  prefixIcon: const Icon(Icons.lock_outline),
                  validator: (value) => Validators.validatePasswordConfirmation(
                    value,
                    _passwordController.text,
                  ),
                  onSubmitted: (_) => _handleRegister(),
                ),

                const SizedBox(height: AppDimensions.spacingXL),

                // Register button
                Consumer<AuthProvider>(
                  builder: (context, authProvider, child) {
                    return PrimaryButton(
                      text: AppConstants.buttonRegister,
                      onPressed: _handleRegister,
                      isLoading: authProvider.isLoading,
                    );
                  },
                ),

                const SizedBox(height: AppDimensions.spacingXL),

                // Login link
                Center(
                  child: TextButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: RichText(
                      text: TextSpan(
                        text: 'Đã có tài khoản? ',
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: AppColors.textSecondary,
                        ),
                        children: [
                          TextSpan(
                            text: 'Đăng nhập ngay',
                            style: AppTextStyles.bodyMediumSemiBold.copyWith(
                              color: AppColors.primaryLight,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPasswordRequirements() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildRequirement('✓ Ít nhất 8 ký tự'),
        _buildRequirement('✓ Có chữ hoa và chữ thường'),
        _buildRequirement('✓ Có số'),
      ],
    );
  }

  Widget _buildRequirement(String text) {
    return Padding(
      padding: const EdgeInsets.only(top: AppDimensions.spacingXS),
      child: Text(
        text,
        style: AppTextStyles.bodySmall.copyWith(
          color: AppColors.success,
        ),
      ),
    );
  }
}

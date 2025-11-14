import 'package:flutter/material.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_text_styles.dart';
import '../../../../app/theme/app_dimensions.dart';

/// Chat input field widget
/// Clean input field for sending messages (ChatGPT-style)
class ChatInputField extends StatefulWidget {
  final TextEditingController controller;
  final VoidCallback onSend;
  final bool isEnabled;

  const ChatInputField({
    super.key,
    required this.controller,
    required this.onSend,
    this.isEnabled = true,
  });

  @override
  State<ChatInputField> createState() => _ChatInputFieldState();
}

class _ChatInputFieldState extends State<ChatInputField> {
  bool _hasText = false;

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_onTextChanged);
  }

  @override
  void dispose() {
    widget.controller.removeListener(_onTextChanged);
    super.dispose();
  }

  void _onTextChanged() {
    final hasText = widget.controller.text.trim().isNotEmpty;
    if (hasText != _hasText) {
      setState(() {
        _hasText = hasText;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppDimensions.spacingMD,
        vertical: AppDimensions.spacingMD,
      ),
      decoration: BoxDecoration(
        color: AppColors.background,
        border: Border(
          top: BorderSide(
            color: AppColors.borderLight,
            width: 1,
          ),
        ),
      ),
      child: SafeArea(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            // Text input - Simple & Clean
            Expanded(
              child: TextField(
                controller: widget.controller,
                enabled: widget.isEnabled,
                maxLines: null,
                minLines: 1,
                textCapitalization: TextCapitalization.sentences,
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.textPrimary,
                ),
                decoration: InputDecoration(
                  hintText: 'Câu hỏi của bạn...',
                  hintStyle: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.textTertiary,
                  ),
                  border: UnderlineInputBorder(
                    borderSide: BorderSide(
                      color: AppColors.border,
                      width: 1,
                    ),
                  ),
                  enabledBorder: UnderlineInputBorder(
                    borderSide: BorderSide(
                      color: AppColors.borderLight,
                      width: 1,
                    ),
                  ),
                  focusedBorder: UnderlineInputBorder(
                    borderSide: BorderSide(
                      color: AppColors.primary,
                      width: 2,
                    ),
                  ),
                  disabledBorder: UnderlineInputBorder(
                    borderSide: BorderSide(
                      color: AppColors.borderLight,
                      width: 1,
                    ),
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    vertical: AppDimensions.spacingXS,
                  ),
                ),
                onSubmitted: (_) {
                  if (_hasText && widget.isEnabled) {
                    widget.onSend();
                  }
                },
              ),
            ),

            const SizedBox(width: AppDimensions.spacingMD),

            // Send button - Minimalist
            GestureDetector(
              onTap: _hasText && widget.isEnabled ? widget.onSend : null,
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: _hasText && widget.isEnabled
                      ? AppColors.primary
                      : AppColors.borderLight,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  Icons.send_rounded,
                  color: _hasText && widget.isEnabled
                      ? Colors.white
                      : AppColors.textTertiary,
                  size: 18,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

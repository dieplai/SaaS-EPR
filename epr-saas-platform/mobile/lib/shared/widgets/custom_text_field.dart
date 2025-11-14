import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../app/theme/app_colors.dart';
import '../../app/theme/app_text_styles.dart';
import '../../app/theme/app_dimensions.dart';

/// Custom text field component (like ChatGPT input)
/// Clean, minimal, with icon support
class CustomTextField extends StatefulWidget {
  final String? label;
  final String? placeholder;
  final String? initialValue;
  final TextEditingController? controller;
  final String? Function(String?)? validator;
  final void Function(String)? onChanged;
  final void Function()? onEditingComplete;
  final void Function(String)? onSubmitted;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final bool obscureText;
  final bool enabled;
  final bool readOnly;
  final int? maxLines;
  final int? minLines;
  final int? maxLength;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  final String? errorText;
  final String? helperText;
  final List<TextInputFormatter>? inputFormatters;
  final FocusNode? focusNode;
  final bool autofocus;

  const CustomTextField({
    super.key,
    this.label,
    this.placeholder,
    this.initialValue,
    this.controller,
    this.validator,
    this.onChanged,
    this.onEditingComplete,
    this.onSubmitted,
    this.keyboardType,
    this.textInputAction,
    this.obscureText = false,
    this.enabled = true,
    this.readOnly = false,
    this.maxLines = 1,
    this.minLines,
    this.maxLength,
    this.prefixIcon,
    this.suffixIcon,
    this.errorText,
    this.helperText,
    this.inputFormatters,
    this.focusNode,
    this.autofocus = false,
  });

  @override
  State<CustomTextField> createState() => _CustomTextFieldState();
}

class _CustomTextFieldState extends State<CustomTextField> {
  late bool _obscureText;

  @override
  void initState() {
    super.initState();
    _obscureText = widget.obscureText;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        // Label
        if (widget.label != null) ...[
          Text(
            widget.label!,
            style: AppTextStyles.label,
          ),
          const SizedBox(height: AppDimensions.spacingXS),
        ],

        // Text Field
        TextFormField(
          controller: widget.controller,
          initialValue: widget.initialValue,
          validator: widget.validator,
          onChanged: widget.onChanged,
          onEditingComplete: widget.onEditingComplete,
          onFieldSubmitted: widget.onSubmitted,
          keyboardType: widget.keyboardType,
          textInputAction: widget.textInputAction,
          obscureText: _obscureText,
          enabled: widget.enabled,
          readOnly: widget.readOnly,
          maxLines: _obscureText ? 1 : widget.maxLines,
          minLines: widget.minLines,
          maxLength: widget.maxLength,
          inputFormatters: widget.inputFormatters,
          focusNode: widget.focusNode,
          autofocus: widget.autofocus,
          style: AppTextStyles.bodyLarge,
          decoration: InputDecoration(
            hintText: widget.placeholder,
            hintStyle: AppTextStyles.placeholder,
            errorText: widget.errorText,
            helperText: widget.helperText,
            errorStyle: AppTextStyles.error,
            helperStyle: AppTextStyles.caption,
            filled: true,
            fillColor: widget.enabled ? AppColors.surface : AppColors.surfaceVariant,
            contentPadding: EdgeInsets.symmetric(
              horizontal: widget.prefixIcon != null
                  ? AppDimensions.spacingXS
                  : AppDimensions.inputPaddingH,
              vertical: AppDimensions.spacingMD,
            ),
            prefixIcon: widget.prefixIcon,
            prefixIconColor: AppColors.textTertiary,
            suffixIcon: widget.obscureText
                ? IconButton(
                    icon: Icon(
                      _obscureText ? Icons.visibility_off : Icons.visibility,
                      size: AppDimensions.iconSizeMD,
                    ),
                    onPressed: () {
                      setState(() {
                        _obscureText = !_obscureText;
                      });
                    },
                  )
                : widget.suffixIcon,
            suffixIconColor: AppColors.textTertiary,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppDimensions.radiusMD),
              borderSide: const BorderSide(
                color: AppColors.border,
                width: AppDimensions.borderWidthDefault,
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppDimensions.radiusMD),
              borderSide: const BorderSide(
                color: AppColors.border,
                width: AppDimensions.borderWidthDefault,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppDimensions.radiusMD),
              borderSide: const BorderSide(
                color: AppColors.primaryLight,
                width: AppDimensions.borderWidthThick,
              ),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppDimensions.radiusMD),
              borderSide: const BorderSide(
                color: AppColors.error,
                width: AppDimensions.borderWidthDefault,
              ),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppDimensions.radiusMD),
              borderSide: const BorderSide(
                color: AppColors.error,
                width: AppDimensions.borderWidthThick,
              ),
            ),
            disabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppDimensions.radiusMD),
              borderSide: const BorderSide(
                color: AppColors.borderLight,
                width: AppDimensions.borderWidthDefault,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

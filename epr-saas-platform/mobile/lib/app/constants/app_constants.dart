/// General app constants
class AppConstants {
  // Private constructor
  AppConstants._();

  // ==================== APP INFO ====================
  /// App name
  static const String appName = 'EPR Legal';

  /// App tagline
  static const String appTagline = 'Tư vấn pháp lý thông minh';

  /// App version
  static const String appVersion = '1.0.0';

  /// Build number
  static const int buildNumber = 1;

  /// Package name (bundle ID)
  static const String packageName = 'com.eprlegal.mobile';

  // ==================== COMPANY INFO ====================
  /// Company name
  static const String companyName = 'EPR Legal';

  /// Support email
  static const String supportEmail = 'support@epr-legal.com';

  /// Support phone
  static const String supportPhone = '+84 123 456 789';

  /// Website URL
  static const String websiteUrl = 'https://epr-legal.com';

  /// Terms of service URL
  static const String termsUrl = 'https://epr-legal.com/terms';

  /// Privacy policy URL
  static const String privacyUrl = 'https://epr-legal.com/privacy';

  // ==================== SOCIAL LINKS ====================
  static const String facebookUrl = 'https://facebook.com/eprlegal';
  static const String twitterUrl = 'https://twitter.com/eprlegal';
  static const String linkedinUrl = 'https://linkedin.com/company/eprlegal';

  // ==================== CHAT CONFIG ====================
  /// Max message length
  static const int maxMessageLength = 2000;

  /// Typing indicator delay (ms)
  static const int typingIndicatorDelay = 500;

  /// Message load limit per page
  static const int messageLoadLimit = 50;

  /// Suggested prompts (like ChatGPT)
  static const List<String> suggestedPrompts = [
    'Hợp đồng lao động có những loại nào?',
    'Cách thành lập công ty TNHH?',
    'Quyền lợi của người lao động theo luật?',
    'Thủ tục ly hôn đơn phương?',
  ];

  /// AI assistant name
  static const String aiAssistantName = 'EPR Assistant';

  /// AI assistant greeting
  static const String aiGreeting =
      '👋 Xin chào! Tôi là trợ lý AI pháp lý của EPR Legal.\n\n'
      'Tôi có thể giúp bạn:\n'
      '• Tư vấn pháp luật lao động\n'
      '• Soạn thảo hợp đồng\n'
      '• Tra cứu văn bản pháp luật\n'
      '• Giải đáp thắc mắc pháp lý';

  // ==================== SUBSCRIPTION CONFIG ====================
  /// Package names
  static const String packageBasic = 'BASIC';
  static const String packageProfessional = 'PROFESSIONAL';
  static const String packageEnterprise = 'ENTERPRISE';

  /// Trial period days
  static const int trialPeriodDays = 7;

  // ==================== VALIDATION ====================
  /// Min password length
  static const int minPasswordLength = 8;

  /// Max password length
  static const int maxPasswordLength = 64;

  /// Min name length
  static const int minNameLength = 2;

  /// Max name length
  static const int maxNameLength = 100;

  /// Phone number regex pattern
  static const String phoneRegexPattern = r'^(\+84|0)[0-9]{9}$';

  /// Email regex pattern
  static const String emailRegexPattern =
      r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$';

  // ==================== DATE FORMATS ====================
  static const String dateFormatShort = 'dd/MM/yyyy';
  static const String dateFormatLong = 'dd MMMM yyyy';
  static const String dateFormatWithTime = 'dd/MM/yyyy HH:mm';
  static const String timeFormat = 'HH:mm';

  // ==================== LANGUAGES ====================
  static const String langVietnamese = 'vi';
  static const String langEnglish = 'en';

  static const List<Map<String, String>> supportedLanguages = [
    {'code': langVietnamese, 'name': 'Tiếng Việt', 'flag': '🇻🇳'},
    {'code': langEnglish, 'name': 'English', 'flag': '🇬🇧'},
  ];

  // ==================== ERROR MESSAGES ====================
  static const String errorGeneric = 'Đã xảy ra lỗi. Vui lòng thử lại.';
  static const String errorNetwork = 'Không có kết nối internet.';
  static const String errorServerError = 'Lỗi máy chủ. Vui lòng thử lại sau.';
  static const String errorUnauthorized = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
  static const String errorNotFound = 'Không tìm thấy dữ liệu.';
  static const String errorInvalidCredentials = 'Email hoặc mật khẩu không đúng.';
  static const String errorEmailExists = 'Email đã được sử dụng.';
  static const String errorWeakPassword = 'Mật khẩu phải có ít nhất 8 ký tự.';
  static const String errorInvalidEmail = 'Email không hợp lệ.';
  static const String errorInvalidPhone = 'Số điện thoại không hợp lệ.';

  // ==================== SUCCESS MESSAGES ====================
  static const String successLogin = 'Đăng nhập thành công!';
  static const String successRegister = 'Đăng ký thành công!';
  static const String successLogout = 'Đăng xuất thành công!';
  static const String successProfileUpdated = 'Cập nhật thông tin thành công!';
  static const String successPasswordChanged = 'Đổi mật khẩu thành công!';
  static const String successSubscribed = 'Đăng ký gói dịch vụ thành công!';

  // ==================== DIALOG MESSAGES ====================
  static const String confirmLogout = 'Bạn có chắc chắn muốn đăng xuất?';
  static const String confirmDeleteConversation = 'Bạn có chắc chắn muốn xóa cuộc trò chuyện này?';
  static const String confirmCancelSubscription = 'Bạn có chắc chắn muốn hủy gói dịch vụ?';

  // ==================== BUTTON LABELS ====================
  static const String buttonLogin = 'Đăng nhập';
  static const String buttonRegister = 'Đăng ký';
  static const String buttonContinue = 'Tiếp tục';
  static const String buttonCancel = 'Hủy';
  static const String buttonConfirm = 'Xác nhận';
  static const String buttonSave = 'Lưu';
  static const String buttonDelete = 'Xóa';
  static const String buttonEdit = 'Chỉnh sửa';
  static const String buttonUpgrade = 'Nâng cấp';
  static const String buttonSubscribe = 'Đăng ký ngay';
  static const String buttonContactSupport = 'Liên hệ tư vấn';
  static const String buttonSend = 'Gửi';
  static const String buttonRetry = 'Thử lại';
  static const String buttonBack = 'Quay lại';

  // ==================== PLACEHOLDERS ====================
  static const String placeholderEmail = 'name@company.com';
  static const String placeholderPassword = '••••••••';
  static const String placeholderName = 'Nguyễn Văn A';
  static const String placeholderPhone = '+84 123 456 789';
  static const String placeholderSearch = 'Tìm kiếm vấn đề pháp lý...';
  static const String placeholderChatInput = 'Nhập câu hỏi của bạn...';

  // ==================== EMPTY STATES ====================
  static const String emptyConversations = 'Chưa có cuộc trò chuyện nào';
  static const String emptyNotifications = 'Không có thông báo mới';
  static const String emptySearchResults = 'Không tìm thấy kết quả';

  // ==================== LIMITS ====================
  /// Max file upload size (MB)
  static const int maxFileUploadSizeMB = 10;

  /// Max images per message
  static const int maxImagesPerMessage = 5;

  /// Cache duration (hours)
  static const int cacheDurationHours = 24;
}

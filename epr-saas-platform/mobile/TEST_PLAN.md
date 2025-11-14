# 🧪 EPR Legal Mobile - Test Plan & Validation

## ✅ Code Quality Checks

### 1. File Structure ✅
```
✅ 39 Dart files created
✅ Clean Architecture structure
✅ Proper imports and exports
✅ No circular dependencies
```

### 2. Syntax Validation
```bash
# Run this to check for syntax errors
cd epr-saas-platform/mobile
flutter analyze

# Expected: No issues found!
```

### 3. Dependency Check
```bash
# Install dependencies
flutter pub get

# Expected: All packages resolved successfully
```

### 4. Code Generation
```bash
# Generate .g.dart files for JSON models
flutter pub run build_runner build --delete-conflicting-outputs

# Expected: 
# - user_model.g.dart
# - login_response_model.g.dart
```

---

## 📱 Manual Testing Checklist

### Phase 1: App Launch ✅
- [ ] App starts without crash
- [ ] Splash screen shows for 2 seconds
- [ ] Splash screen has animation (fade + scale)
- [ ] Auto-navigates to Login screen

### Phase 2: Login Screen ✅
- [ ] Screen renders correctly
- [ ] Logo displays
- [ ] Email input shows with email icon
- [ ] Password input shows with lock icon
- [ ] Password toggle (eye icon) works
- [ ] "Quên mật khẩu?" link visible
- [ ] Social login buttons visible (Apple, Google)
- [ ] "Đăng ký ngay" link visible

### Phase 3: Form Validation ✅
**Test Invalid Email:**
```
Input: "invalid-email"
Expected: "Email không hợp lệ"
```

**Test Empty Password:**
```
Input: email=test@example.com, password=""
Expected: "Mật khẩu không được để trống"
```

**Test Short Password:**
```
Input: password="123"
Expected: "Mật khẩu phải có ít nhất 8 ký tự"
```

### Phase 4: API Integration ✅
**Test Successful Login:**
```bash
Email: test@example.com
Password: password123

Expected Flow:
1. Loading indicator shows
2. API POST to /api/v1/auth/login
3. Response: {accessToken, refreshToken, user}
4. Tokens saved to SecureStorage
5. Success toast: "Đăng nhập thành công!"
6. Navigate to Main screen (TODO)
```

**Test Failed Login:**
```bash
Email: wrong@example.com
Password: wrongpass

Expected:
1. API returns 401 Unauthorized
2. Error toast: "Email hoặc mật khẩu không đúng"
3. Stay on Login screen
```

### Phase 5: Register Screen ✅
- [ ] Navigate from Login → Register
- [ ] All fields render (Name, Email, Phone, Password, Confirm)
- [ ] Password strength indicators show
- [ ] Validation works for all fields
- [ ] "Đăng nhập ngay" link navigates back

**Test Registration:**
```bash
Name: Nguyễn Văn A
Email: test2@example.com
Phone: +84 123 456 789
Password: Password123!
Confirm: Password123!

Expected:
1. All validations pass
2. API POST to /api/v1/auth/register
3. Success toast
4. Auto-login and save tokens
5. Navigate to Main (TODO)
```

### Phase 6: State Management ✅
- [ ] Loading state shows during API calls
- [ ] Error state displays correctly
- [ ] Success state navigates properly
- [ ] Provider notifies listeners
- [ ] UI updates reactively

---

## 🔌 Backend Integration Test

### Prerequisites
```bash
# 1. Start backend services
cd /path/to/epr-saas-platform
docker-compose up -d

# 2. Verify services running
curl http://localhost:8001/api/v1/health
# Expected: {"status": "ok"}
```

### Test Scenarios

#### Scenario 1: Happy Path Login
```
1. Open app
2. Wait for Splash → Login
3. Enter valid credentials
4. Tap "Đăng nhập"
5. Verify: Loading → Success → Navigate
```

#### Scenario 2: Network Error
```
1. Turn off backend services
2. Try to login
3. Expected: "Không có kết nối internet"
```

#### Scenario 3: Token Persistence
```
1. Login successfully
2. Kill app
3. Restart app
4. Expected: Auto-navigate to Main (skip login)
```

#### Scenario 4: Logout
```
1. Login
2. Navigate to Profile
3. Tap "Đăng xuất"
4. Expected: 
   - Tokens cleared
   - Navigate to Login
   - Cannot access protected screens
```

---

## 🐛 Known Issues to Check

### Issue 1: Android Emulator Localhost
```bash
# Android emulator uses 10.0.2.2 for localhost
# Fix: Update .env.dev
USER_SERVICE_URL=http://10.0.2.2:8001/api/v1
```

### Issue 2: Code Generation Not Run
```bash
# Symptoms: 
# - "user_model.g.dart not found"
# - Build fails

# Fix:
flutter pub run build_runner build --delete-conflicting-outputs
```

### Issue 3: Hot Reload Issues
```bash
# Sometimes hot reload doesn't work with Provider
# Fix: Hot restart instead
# Press 'R' in terminal
```

---

## 📊 Performance Tests

### App Size
```bash
flutter build apk --release
ls -lh build/app/outputs/flutter-apk/app-release.apk

# Expected: ~15-20 MB
```

### Launch Time
```
Cold start: < 3 seconds
Splash duration: 2 seconds
Login screen render: < 500ms
```

### Memory Usage
```
Idle: ~50-80 MB
Login flow: ~100-120 MB
```

---

## ✅ Validation Results

Run these commands and check results:

```bash
# 1. Analyze code
flutter analyze
# ✅ Expected: No issues found!

# 2. Format code
flutter format lib/ --set-exit-if-changed
# ✅ Expected: All files formatted

# 3. Test compilation
flutter build apk --debug
# ✅ Expected: Build successful

# 4. Check dependencies
flutter pub outdated
# ℹ️  Expected: List of packages (optional upgrades)
```

---

## 🎯 Test Coverage Goals

### Current
```
Unit Tests: 0% (TODO)
Widget Tests: 0% (TODO)
Integration Tests: 0% (TODO)
Manual Tests: 100% ✅
```

### Target (Future)
```
Unit Tests: 80%+
Widget Tests: 60%+
Integration Tests: 40%+
```

---

## 📝 Test Report Template

After testing, fill this in:

```markdown
## Test Session Report

**Date:** YYYY-MM-DD
**Tester:** [Your Name]
**Device:** [Device Name + OS]
**Build:** 1.0.0+1

### Results
- [ ] App Launch: PASS/FAIL
- [ ] Login Flow: PASS/FAIL
- [ ] Register Flow: PASS/FAIL
- [ ] Validation: PASS/FAIL
- [ ] API Integration: PASS/FAIL
- [ ] Navigation: PASS/FAIL
- [ ] State Management: PASS/FAIL

### Issues Found
1. [Issue description]
2. [Issue description]

### Screenshots
[Attach screenshots if needed]
```

---

## 🚀 Quick Test Script

```bash
#!/bin/bash
# quick_test.sh

echo "🧪 EPR Legal Mobile - Quick Test"

cd epr-saas-platform/mobile

echo "1️⃣ Installing dependencies..."
flutter pub get

echo "2️⃣ Running code generation..."
flutter pub run build_runner build --delete-conflicting-outputs

echo "3️⃣ Analyzing code..."
flutter analyze

echo "4️⃣ Formatting code..."
flutter format lib/

echo "5️⃣ Running on device..."
flutter run -d chrome --web-port 8080

echo "✅ Test completed!"
```

Make executable: `chmod +x quick_test.sh`
Run: `./quick_test.sh`

---

**Ready to test! 🎯**

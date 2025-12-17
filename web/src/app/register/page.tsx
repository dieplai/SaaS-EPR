"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Leaf, Mail, Lock, User, Building2, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    password: "",
    confirmPassword: "",
    agreedToTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (!formData.agreedToTerms) {
      setError('Bạn cần đồng ý với điều khoản dịch vụ');
      return;
    }

    if (formData.password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        full_name: `${formData.firstName} ${formData.lastName}`.trim(),
        company_name: formData.company || undefined,
      });
      router.push('/'); // Redirect to home after successful registration
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-luxury-cream relative overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-chart-2/4 rounded-full blur-3xl" />
      </div>

      {/* Logo - Top Left */}
      <div className="absolute top-8 left-8 z-20 animate-slide-up">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full group-hover:bg-primary/30 transition-all duration-300" />
            <div className="relative h-11 w-11 rounded-2xl gradient-chat-bubble flex items-center justify-center shadow-lg">
              <Leaf className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-elegant font-bold text-foreground tracking-tight">
              EPR SaaS
            </span>
            <span className="text-xs text-muted-foreground font-refined">
              Sustainable Solutions
            </span>
          </div>
        </Link>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-20">
        <div className="w-full max-w-[520px]">
          {/* Progress Indicator */}
          <div className="mb-10 animate-slide-up">
            <div className="flex items-center justify-center gap-2 mb-6">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    s <= step
                      ? "w-12 bg-gradient-chat-bubble shadow-sm"
                      : "w-8 bg-border"
                  }`}
                />
              ))}
            </div>
            <p className="text-center text-sm font-refined text-muted-foreground">
              Bước {step} / 3
            </p>
          </div>

          {/* Registration Card */}
          <div
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-luxury hover:shadow-luxury-hover transition-all duration-500 overflow-hidden animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="p-10 md:p-12">
              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
              )}

              {/* Header */}
              <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-elegant font-bold text-foreground mb-3 tracking-tight">
                  {step === 1 && "Thông tin cá nhân"}
                  {step === 2 && "Thông tin công ty"}
                  {step === 3 && "Bảo mật"}
                </h1>
                <p className="text-base font-refined text-muted-foreground">
                  {step === 1 && "Hãy cho chúng tôi biết về bạn"}
                  {step === 2 && "Một vài thông tin về tổ chức của bạn"}
                  {step === 3 && "Thiết lập mật khẩu an toàn"}
                </p>
              </div>

              {/* Form Steps */}
              <div className="space-y-6">
                {/* Step 1: Personal Info */}
                {step === 1 && (
                  <div className="space-y-6 animate-slide-up">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2.5">
                        <Label
                          htmlFor="firstName"
                          className="text-sm font-refined font-medium text-foreground"
                        >
                          Họ
                        </Label>
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                          <Input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => updateField("firstName", e.target.value)}
                            placeholder="Nguyễn"
                            className="pl-11 h-12 rounded-xl border-border/50 bg-background/50 font-refined transition-all duration-300 focus:border-primary/50 focus:bg-white input-focus-glow"
                          />
                        </div>
                      </div>
                      <div className="space-y-2.5">
                        <Label
                          htmlFor="lastName"
                          className="text-sm font-refined font-medium text-foreground"
                        >
                          Tên
                        </Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => updateField("lastName", e.target.value)}
                          placeholder="Văn A"
                          className="h-12 rounded-xl border-border/50 bg-background/50 font-refined transition-all duration-300 focus:border-primary/50 focus:bg-white input-focus-glow"
                        />
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <Label
                        htmlFor="email"
                        className="text-sm font-refined font-medium text-foreground"
                      >
                        Email công việc
                      </Label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => updateField("email", e.target.value)}
                          placeholder="email@company.com"
                          className="pl-11 h-12 rounded-xl border-border/50 bg-background/50 font-refined transition-all duration-300 focus:border-primary/50 focus:bg-white input-focus-glow"
                        />
                      </div>
                      <p className="text-xs font-refined text-muted-foreground">
                        Chúng tôi sẽ gửi xác nhận đến địa chỉ này
                      </p>
                    </div>
                  </div>
                )}

                {/* Step 2: Company Info */}
                {step === 2 && (
                  <div className="space-y-6 animate-slide-up">
                    <div className="space-y-2.5">
                      <Label
                        htmlFor="company"
                        className="text-sm font-refined font-medium text-foreground"
                      >
                        Tên công ty
                      </Label>
                      <div className="relative group">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <Input
                          id="company"
                          value={formData.company}
                          onChange={(e) => updateField("company", e.target.value)}
                          placeholder="Công ty ABC"
                          className="pl-11 h-12 rounded-xl border-border/50 bg-background/50 font-refined transition-all duration-300 focus:border-primary/50 focus:bg-white input-focus-glow"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 p-6 bg-primary/5 rounded-2xl border border-primary/10">
                      <h3 className="text-sm font-refined font-semibold text-foreground">
                        Gói dùng thử 30 ngày bao gồm:
                      </h3>
                      <ul className="space-y-3">
                        {[
                          "Truy cập đầy đủ tính năng",
                          "Hỗ trợ 24/7 bằng tiếng Việt",
                          "Không cần thẻ tín dụng",
                          "Hủy bất cứ lúc nào",
                        ].map((item, index) => (
                          <li
                            key={index}
                            className="flex items-center gap-3 text-sm font-refined text-foreground"
                          >
                            <div className="flex-shrink-0 h-5 w-5 rounded-full gradient-chat-bubble flex items-center justify-center shadow-sm">
                              <Check className="h-3 w-3 text-white" strokeWidth={3} />
                            </div>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Step 3: Security */}
                {step === 3 && (
                  <div className="space-y-6 animate-slide-up">
                    <div className="space-y-2.5">
                      <Label
                        htmlFor="password"
                        className="text-sm font-refined font-medium text-foreground"
                      >
                        Mật khẩu
                      </Label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => updateField("password", e.target.value)}
                          placeholder="••••••••"
                          className="pl-11 h-12 rounded-xl border-border/50 bg-background/50 font-refined transition-all duration-300 focus:border-primary/50 focus:bg-white input-focus-glow"
                        />
                      </div>
                      <p className="text-xs font-refined text-muted-foreground">
                        Tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và số
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      <Label
                        htmlFor="confirmPassword"
                        className="text-sm font-refined font-medium text-foreground"
                      >
                        Xác nhận mật khẩu
                      </Label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) =>
                            updateField("confirmPassword", e.target.value)
                          }
                          placeholder="••••••••"
                          className="pl-11 h-12 rounded-xl border-border/50 bg-background/50 font-refined transition-all duration-300 focus:border-primary/50 focus:bg-white input-focus-glow"
                        />
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-xl border border-border/30">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={formData.agreedToTerms}
                        onChange={(e) => updateField("agreedToTerms", e.target.checked)}
                        className="h-4 w-4 rounded border-border mt-0.5 accent-primary cursor-pointer"
                      />
                      <label
                        htmlFor="terms"
                        className="text-sm font-refined text-muted-foreground cursor-pointer leading-relaxed"
                      >
                        Tôi đồng ý với{" "}
                        <Link
                          href="#"
                          className="text-primary hover:underline font-medium"
                        >
                          Điều khoản dịch vụ
                        </Link>{" "}
                        và{" "}
                        <Link
                          href="#"
                          className="text-primary hover:underline font-medium"
                        >
                          Chính sách bảo mật
                        </Link>
                      </label>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-3 pt-4">
                  {step > 1 && (
                    <Button
                      onClick={() => setStep(step - 1)}
                      variant="outline"
                      size="lg"
                      className="flex-1 h-12 rounded-xl border-2 font-refined font-medium hover:bg-muted/50 transition-all duration-300"
                    >
                      Quay lại
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      if (step < 3) {
                        setStep(step + 1);
                      } else {
                        handleSubmit();
                      }
                    }}
                    size="lg"
                    disabled={isLoading}
                    className="flex-1 h-12 rounded-xl gradient-chat-bubble text-white font-refined font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Đang tạo tài khoản...' : (step === 3 ? "Tạo tài khoản" : "Tiếp tục")}
                    {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* OAuth Options - Only on Step 1 */}
              {step === 1 && (
                <>
                  <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/30" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white px-4 text-xs font-refined text-muted-foreground">
                        Hoặc đăng ký với
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-12 rounded-xl border-2 font-refined font-medium hover:bg-muted/50 transition-all duration-300"
                    >
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Google
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-12 rounded-xl border-2 font-refined font-medium hover:bg-muted/50 transition-all duration-300"
                    >
                      <svg
                        className="h-4 w-4 mr-2"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      Facebook
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <p className="text-sm font-refined text-muted-foreground">
              Đã có tài khoản?{" "}
              <Link
                href="/login"
                className="text-primary hover:underline font-semibold transition-colors"
              >
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

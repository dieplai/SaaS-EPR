"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Leaf, Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login(formData.email, formData.password, formData.remember);

      // Get user data after login to check role
      const response = await fetch(`/api/users/profile`, {
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        const user = userData.data;

        // Redirect based on role
        if (user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      } else {
        router.push('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-luxury-cream relative overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/3 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-chart-2/4 rounded-full blur-3xl" />
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
        <div className="w-full max-w-[480px]">
          {/* Login Card */}
          <div
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-luxury hover:shadow-luxury-hover transition-all duration-500 overflow-hidden animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="p-10 md:p-12">
              {/* Header */}
              <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-elegant font-bold text-foreground mb-3 tracking-tight">
                  Chào mừng trở lại
                </h1>
                <p className="text-base font-refined text-muted-foreground">
                  Đăng nhập để tiếp tục quản lý EPR
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2.5">
                  <Label
                    htmlFor="email"
                    className="text-sm font-refined font-medium text-foreground"
                  >
                    Email
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
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="text-sm font-refined font-medium text-foreground"
                    >
                      Mật khẩu
                    </Label>
                    <Link
                      href="/forgot-password"
                      className="text-sm font-refined font-medium text-primary hover:underline transition-colors"
                    >
                      Quên mật khẩu?
                    </Link>
                  </div>
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
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={formData.remember}
                    onChange={(e) => updateField("remember", e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm font-refined text-muted-foreground cursor-pointer"
                  >
                    Ghi nhớ đăng nhập
                  </label>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isLoading || !formData.email || !formData.password}
                  className="w-full h-12 rounded-xl gradient-chat-bubble text-white font-refined font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                  {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </form>

              {/* OAuth Options */}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/30" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-xs font-refined text-muted-foreground">
                    Hoặc tiếp tục với
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
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <p className="text-sm font-refined text-muted-foreground">
              Chưa có tài khoản?{" "}
              <Link
                href="/register"
                className="text-primary hover:underline font-semibold transition-colors"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

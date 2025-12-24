import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { gsap } from "gsap";
import authBg from "@/assets/auth-bg-login.jpg";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const { login, isLoggingIn, loginError } = useAuth();
  
  const leftContentRef = useRef<HTMLDivElement>(null);
  const rightContentRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Image animation
      gsap.fromTo(imageRef.current,
        { scale: 1.1, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.5, ease: "power2.out" }
      );

      // Left side content animation
      if (leftContentRef.current) {
        const leftElements = leftContentRef.current.children;
        gsap.fromTo(leftElements,
          { y: 60, opacity: 0 },
          { 
            y: 0, 
            opacity: 1, 
            duration: 0.8, 
            stagger: 0.15, 
            ease: "power3.out",
            delay: 0.3
          }
        );
      }

      // Right side form animation
      if (rightContentRef.current) {
        const rightElements = rightContentRef.current.children;
        gsap.fromTo(rightElements,
          { x: 40, opacity: 0 },
          { 
            x: 0, 
            opacity: 1, 
            duration: 0.7, 
            stagger: 0.1, 
            ease: "power2.out",
            delay: 0.2
          }
        );
      }

      // Stats cards hover effect setup
      const statCards = document.querySelectorAll('.stat-card');
      statCards.forEach((card) => {
        card.addEventListener('mouseenter', () => {
          gsap.to(card, { scale: 1.05, duration: 0.3, ease: "power2.out" });
        });
        card.addEventListener('mouseleave', () => {
          gsap.to(card, { scale: 1, duration: 0.3, ease: "power2.out" });
        });
      });
    });

    return () => ctx.revert();
  }, []);

  // Show error toast when login fails
  useEffect(() => {
    if (loginError) {
      toast({
        title: "Đăng nhập thất bại",
        description: loginError.message || "Vui lòng kiểm tra lại email và mật khẩu.",
        variant: "destructive",
      });
    }
  }, [loginError, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      login({ email, password });
      toast({
        title: "Đăng nhập thành công",
        description: "Chào mừng bạn quay lại!",
      });
    } catch (error) {
      // Error will be handled by useEffect above
    }
  };

  const handleGoogleLogin = () => {
    toast({
      title: "Google OAuth",
      description: "Kết nối backend để bật xác thực Google.",
    });
  };

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left Side - Image Background */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Image */}
        <img 
          ref={imageRef}
          src={authBg} 
          alt="Environmental background" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        
        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/30 rounded-full animate-float"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 3) * 20}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${4 + i}s`
              }}
            />
          ))}
        </div>
        
        {/* Content */}
        <div ref={leftContentRef} className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Hơn 10,000+ doanh nghiệp tin dùng
            </div>
          </div>
          
          <h1 className="text-4xl xl:text-5xl font-display font-bold mb-4 leading-tight drop-shadow-lg">
            Tra cứu pháp luật
            <span className="block mt-2">thông minh với AI</span>
          </h1>
          
          <p className="text-lg text-white/90 mb-8 max-w-md leading-relaxed drop-shadow">
            EPR AI giúp bạn tra cứu, phân tích và hiểu rõ các quy định pháp luật về môi trường chỉ trong vài giây.
          </p>
          
          {/* Stats */}
          <div className="flex gap-4">
            <div className="stat-card text-center p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 cursor-pointer transition-all">
              <div className="text-2xl font-bold mb-1">98%</div>
              <div className="text-sm text-white/80">Độ chính xác</div>
            </div>
            <div className="stat-card text-center p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 cursor-pointer transition-all">
              <div className="text-2xl font-bold mb-1">24/7</div>
              <div className="text-sm text-white/80">Hỗ trợ AI</div>
            </div>
            <div className="stat-card text-center p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 cursor-pointer transition-all">
              <div className="text-2xl font-bold mb-1">5s</div>
              <div className="text-sm text-white/80">Phản hồi</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-background">
        <div ref={rightContentRef} className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              EPR AI Assistant
            </div>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
              Đăng nhập
            </h2>
            <p className="text-muted-foreground">
              Nhập thông tin của bạn để tiếp tục
            </p>
          </div>

          {/* Google Login */}
          <Button
            type="button"
            variant="outline"
            className="w-full mb-6 py-6 bg-card hover:bg-muted border-border text-foreground transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:scale-[1.02]"
            onClick={handleGoogleLogin}
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Tiếp tục với Google
          </Button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-4 text-muted-foreground">
                hoặc đăng nhập với email
              </span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">
                Email
              </Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 py-6 bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground font-medium">
                  Mật khẩu
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:text-primary/80 hover:underline transition-colors"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12 py-6 bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full btn-glow text-primary-foreground py-6 text-base font-semibold hover:scale-[1.02] transition-transform"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  Đăng Nhập
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              Chưa có tài khoản?{" "}
              <Link to="/signup" className="text-primary hover:text-primary/80 font-semibold hover:underline transition-colors">
                Đăng ký miễn phí
              </Link>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-border">
            <p className="text-xs text-center text-muted-foreground">
              Bằng việc đăng nhập, bạn đồng ý với{" "}
              <Link to="/terms" className="text-primary hover:underline">Điều khoản dịch vụ</Link>
              {" "}và{" "}
              <Link to="/privacy" className="text-primary hover:underline">Chính sách bảo mật</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

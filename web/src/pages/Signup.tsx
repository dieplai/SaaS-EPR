import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Check, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { gsap } from "gsap";
import authBg from "@/assets/auth-bg-signup.jpg";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const { register, isRegistering, registerError } = useAuth();

  const leftContentRef = useRef<HTMLDivElement>(null);
  const rightContentRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const passwordRequirements = [
    { met: password.length >= 8, text: "Ít nhất 8 ký tự" },
    { met: /[A-Z]/.test(password), text: "Một chữ cái viết hoa" },
    { met: /[0-9]/.test(password), text: "Một chữ số" },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Image animation with parallax effect
      gsap.fromTo(imageRef.current,
        { scale: 1.15, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.8, ease: "power2.out" }
      );

      // Left side content animation
      if (leftContentRef.current) {
        const leftElements = leftContentRef.current.children;
        gsap.fromTo(leftElements,
          { y: 80, opacity: 0, rotateX: 15 },
          { 
            y: 0, 
            opacity: 1, 
            rotateX: 0,
            duration: 1, 
            stagger: 0.2, 
            ease: "power3.out",
            delay: 0.4
          }
        );
      }

      // Right side form animation with slide effect
      if (rightContentRef.current) {
        const rightElements = rightContentRef.current.children;
        gsap.fromTo(rightElements,
          { x: 60, opacity: 0 },
          { 
            x: 0, 
            opacity: 1, 
            duration: 0.8, 
            stagger: 0.08, 
            ease: "power2.out",
            delay: 0.3
          }
        );
      }

      // Avatar animation
      const avatars = document.querySelectorAll('.avatar-item');
      gsap.fromTo(avatars,
        { scale: 0, opacity: 0 },
        { 
          scale: 1, 
          opacity: 1, 
          duration: 0.5, 
          stagger: 0.1, 
          ease: "back.out(1.7)",
          delay: 1
        }
      );
    });

    return () => ctx.revert();
  }, []);

  // Show error toast when registration fails
  useEffect(() => {
    if (registerError) {
      toast({
        title: "Đăng ký thất bại",
        description: registerError.message || "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    }
  }, [registerError, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password requirements
    const isPasswordValid = passwordRequirements.every((req) => req.met);
    if (!isPasswordValid) {
      toast({
        title: "Mật khẩu không hợp lệ",
        description: "Vui lòng đáp ứng tất cả yêu cầu về mật khẩu.",
        variant: "destructive",
      });
      return;
    }

    try {
      register({ email, password, full_name: name });
      toast({
        title: "Đăng ký thành công",
        description: "Chào mừng bạn đến với EPR AI!",
      });
    } catch (error) {
      // Error will be handled by useEffect above
    }
  };

  const handleGoogleSignup = () => {
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
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white/20 rounded-full animate-float"
              style={{
                width: `${6 + (i % 3) * 4}px`,
                height: `${6 + (i % 3) * 4}px`,
                left: `${10 + i * 12}%`,
                top: `${20 + (i % 4) * 18}%`,
                animationDelay: `${i * 0.7}s`,
                animationDuration: `${5 + i}s`
              }}
            />
          ))}
        </div>
        
        {/* Content */}
        <div ref={leftContentRef} className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium">
              <Gift className="w-4 h-4" />
              Dùng thử miễn phí - Không cần thẻ
            </div>
          </div>
          
          <h1 className="text-4xl xl:text-5xl font-display font-bold mb-4 leading-tight drop-shadow-lg">
            Bắt đầu hành trình
            <span className="block mt-2">tuân thủ pháp luật</span>
          </h1>
          
          <p className="text-lg text-white/90 mb-8 max-w-md leading-relaxed drop-shadow">
            Đăng ký ngay để trải nghiệm sức mạnh của AI trong việc tra cứu và phân tích pháp luật môi trường.
          </p>
          
          {/* Social Proof */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
            <div className="flex -space-x-3">
              {['NV', 'TH', 'LM', 'PD'].map((initials, i) => (
                <div 
                  key={i}
                  className="avatar-item w-10 h-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-sm font-medium"
                >
                  {initials}
                </div>
              ))}
            </div>
            <div>
              <div className="font-medium">+2,500 người dùng mới</div>
              <div className="text-sm text-white/70">trong tháng này</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-background overflow-y-auto">
        <div ref={rightContentRef} className="w-full max-w-md py-8">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-medium mb-4">
              <Gift className="w-4 h-4" />
              50 câu hỏi miễn phí
            </div>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left mb-8">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
              Tạo tài khoản
            </h2>
            <p className="text-muted-foreground">
              Bắt đầu dùng thử miễn phí 14 ngày
            </p>
          </div>

          {/* Google Signup */}
          <Button
            type="button"
            variant="outline"
            className="w-full mb-6 py-6 bg-card hover:bg-muted border-border text-foreground transition-all duration-300 hover:border-secondary/50 hover:shadow-lg hover:scale-[1.02]"
            onClick={handleGoogleSignup}
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
                hoặc đăng ký với email
              </span>
            </div>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground font-medium">
                Họ và tên
              </Label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-12 py-6 bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">
                Email công việc
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
              <Label htmlFor="password" className="text-foreground font-medium">
                Mật khẩu
              </Label>
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
              {/* Password Requirements */}
              <div className="flex flex-wrap gap-3 pt-2">
                {passwordRequirements.map((req, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full transition-all duration-300 ${
                      req.met 
                        ? "bg-primary/10 text-primary" 
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all duration-300 ${
                      req.met ? "bg-primary text-primary-foreground scale-110" : "bg-muted-foreground/30"
                    }`}>
                      {req.met && <Check className="w-2.5 h-2.5" />}
                    </div>
                    {req.text}
                  </div>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full btn-glow text-primary-foreground py-6 text-base font-semibold hover:scale-[1.02] transition-transform"
              disabled={isRegistering}
            >
              {isRegistering ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  Tạo tài khoản
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </form>

          {/* Terms */}
          <p className="text-xs text-muted-foreground text-center mt-6">
            Bằng việc đăng ký, bạn đồng ý với{" "}
            <Link to="/terms" className="text-primary hover:underline">
              Điều khoản dịch vụ
            </Link>{" "}
            và{" "}
            <Link to="/privacy" className="text-primary hover:underline">
              Chính sách bảo mật
            </Link>
          </p>

          {/* Sign In Link */}
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              Đã có tài khoản?{" "}
              <Link to="/login" className="text-primary hover:text-primary/80 font-semibold hover:underline transition-colors">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check, Star, ArrowRight, Shield, Zap, Award,
  Clock, ChevronDown, Leaf, Sparkles, Users, CheckCircle2
} from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useAuth } from "@/contexts/auth-context";
import { API_URL } from "@/lib/config";

interface Package {
  id: string;
  name: string;
  description: string;
  price: number;
  token_limit: number;
  duration_days: number;
  features?: string[];
  is_active: boolean;
}

export default function PricingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [subscribingPackageId, setSubscribingPackageId] = useState<string | null>(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await fetch(`${API_URL}/packages`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setPackages(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (pkg: Package) => {
    // Nếu chưa đăng nhập, chuyển đến trang đăng ký
    if (!isAuthenticated) {
      router.push(`/register?plan=${pkg.name.toLowerCase()}`);
      return;
    }

    // Xác nhận trước khi đăng ký
    const isFree = pkg.price === 0;
    const confirmMessage = isFree
      ? `Bạn có chắc muốn đăng ký gói "${pkg.name}" miễn phí?`
      : `Bạn có chắc muốn đăng ký gói "${pkg.name}" với giá ${formatPrice(pkg.price)}đ/${pkg.duration_days} ngày?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setSubscribingPackageId(pkg.id);

      // Bước 1: Kiểm tra subscription hiện tại
      const currentSubResponse = await fetch(`${API_URL}/subscriptions/current`, {
        credentials: 'include',
      });

      let currentSubscriptionId: string | null = null;

      if (currentSubResponse.ok) {
        const currentSubData = await currentSubResponse.json();
        if (currentSubData.data && currentSubData.data.id) {
          currentSubscriptionId = currentSubData.data.id;

          // Hỏi xem có muốn thay đổi gói không
          const changeConfirm = confirm(
            `Bạn đang có gói đăng ký active. Bạn có muốn chuyển sang gói "${pkg.name}" không?\n\n` +
            `Lưu ý: Gói cũ sẽ bị hủy và bạn sẽ nhận được gói mới ngay lập tức.`
          );

          if (!changeConfirm) {
            setSubscribingPackageId(null);
            return;
          }

          // Bước 2: Hủy subscription cũ
          const cancelResponse = await fetch(`${API_URL}/subscriptions/${currentSubscriptionId}`, {
            method: 'DELETE',
            credentials: 'include',
          });

          if (!cancelResponse.ok) {
            throw new Error('Không thể hủy gói cũ');
          }
        }
      }

      // Bước 3: Tạo subscription mới
      const response = await fetch(`${API_URL}/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          package_id: pkg.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Không thể tạo subscription');
      }

      // Thành công - chuyển đến trang account
      alert(`✅ Đăng ký gói "${pkg.name}" thành công!`);
      router.push('/account');
    } catch (error) {
      console.error('Failed to subscribe:', error);
      alert(`❌ Lỗi: ${error instanceof Error ? error.message : 'Không thể đăng ký gói'}`);
    } finally {
      setSubscribingPackageId(null);
    }
  };

  const formatPrice = (price: number) => {
    if (price === 0) return "Miễn phí";
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    } else if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(0)}K`;
    }
    return tokens.toString();
  };

  const benefits = [
    {
      icon: Shield,
      title: "Hoàn tiền 30 ngày",
      description: "Cam kết hoàn tiền 100% nếu không hài lòng",
    },
    {
      icon: Users,
      title: "Hỗ trợ 24/7",
      description: "Đội ngũ chuyên gia sẵn sàng hỗ trợ",
    },
    {
      icon: Clock,
      title: "Thiết lập 5 phút",
      description: "Bắt đầu ngay không cần cài đặt phức tạp",
    },
    {
      icon: Award,
      title: "Tuân thủ 100%",
      description: "Đảm bảo tuân thủ quy định EPR Việt Nam",
    },
  ];

  const faqs = [
    {
      question: "Token AI là gì và cách tính như thế nào?",
      answer: "Token AI là đơn vị đo lường lượng văn bản được xử lý bởi hệ thống AI. Mỗi câu trả lời từ chatbot tiêu tốn một lượng token tùy thuộc vào độ dài và độ phức tạp của câu trả lời.",
    },
    {
      question: "Tôi có thể thay đổi gói dịch vụ sau khi đăng ký không?",
      answer: "Có, bạn có thể nâng cấp hoặc hạ cấp gói dịch vụ bất cứ lúc nào. Tokens chưa sử dụng sẽ được bảo lưu khi nâng cấp.",
    },
    {
      question: "Chuyện gì xảy ra khi tôi hết tokens?",
      answer: "Khi hết tokens, bạn sẽ nhận thông báo và có thể nâng cấp gói hoặc chờ đến chu kỳ thanh toán tiếp theo. Tokens sẽ được làm mới vào đầu mỗi chu kỳ.",
    },
    {
      question: "Có giảm giá khi thanh toán theo năm không?",
      answer: "Có, bạn sẽ được giảm 20% (tương đương 2 tháng miễn phí) khi thanh toán theo năm cho tất cả các gói có phí.",
    },
    {
      question: "Phương thức thanh toán nào được hỗ trợ?",
      answer: "Chúng tôi chấp nhận thanh toán qua chuyển khoản ngân hàng, thẻ tín dụng (Visa, Mastercard), và ví điện tử (Momo, ZaloPay).",
    },
  ];

  // Find most popular package (highest price or middle package)
  const getMostPopularIndex = () => {
    if (packages.length === 0) return -1;
    if (packages.length <= 2) return 0;
    return Math.floor(packages.length / 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-emerald-50/20">
      <Header />

      <main className="relative">
        {/* Floating eco particles background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-emerald-400/20 rounded-full animate-float-slow" />
          <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-teal-400/20 rounded-full animate-float-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-emerald-500/20 rounded-full animate-float-slow" style={{ animationDelay: '2s' }} />
          <div className="absolute top-2/3 right-1/4 w-2 h-2 bg-teal-500/20 rounded-full animate-float-slow" style={{ animationDelay: '3s' }} />
        </div>

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-6 overflow-hidden">
          {/* Organic gradient orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-60">
            <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-emerald-200/40 to-teal-200/40 rounded-full blur-3xl animate-blob-float" />
            <div className="absolute -bottom-40 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-amber-200/30 to-orange-200/30 rounded-full blur-3xl animate-blob-float" style={{ animationDelay: "3s" }} />
          </div>

          <div className="relative max-w-5xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white/80 backdrop-blur-md border border-emerald-200/50 shadow-lg animate-slide-up">
              <Leaf className="w-4 h-4 text-emerald-600" strokeWidth={2.5} />
              <span className="text-sm font-bold text-emerald-900 tracking-wide">Giá cả minh bạch & Linh hoạt</span>
            </div>

            {/* Heading */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-serif font-bold tracking-tight animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <span className="block text-stone-900">Chọn gói phù hợp</span>
              <span className="block mt-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent">
                cho doanh nghiệp
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-stone-600 max-w-3xl mx-auto leading-relaxed font-light animate-slide-up" style={{ animationDelay: "0.2s" }}>
              Bắt đầu với gói miễn phí, nâng cấp bất cứ lúc nào.
              <br className="hidden md:block" />
              Thanh toán linh hoạt theo mức sử dụng token AI.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-5 pt-6 animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <span className={`text-base font-semibold transition-all duration-300 ${
                billingPeriod === "monthly"
                  ? "text-stone-900 scale-105"
                  : "text-stone-500"
              }`}>
                Theo tháng
              </span>
              <button
                onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "annual" : "monthly")}
                className="relative w-16 h-9 rounded-full bg-gradient-to-r from-stone-200 to-stone-300 transition-all hover:shadow-lg"
              >
                <div className={`absolute top-1 w-7 h-7 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg transition-all duration-500 ${
                  billingPeriod === "annual" ? "translate-x-8" : "translate-x-1"
                }`} />
              </button>
              <div className={`flex items-center gap-2 transition-all duration-300 ${
                billingPeriod === "annual" ? "scale-105" : ""
              }`}>
                <span className={`text-base font-semibold transition-colors ${
                  billingPeriod === "annual" ? "text-stone-900" : "text-stone-500"
                }`}>
                  Theo năm
                </span>
                <span className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full shadow-md">
                  -20%
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="relative px-6 pb-24 overflow-visible">
          <div className="max-w-7xl mx-auto relative z-10">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                  <Leaf className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-emerald-600 animate-pulse" />
                </div>
              </div>
            ) : (
              <div className={`grid gap-8 ${
                packages.length === 1 ? 'md:grid-cols-1 max-w-md mx-auto' :
                packages.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' :
                packages.length === 3 ? 'md:grid-cols-3' :
                'md:grid-cols-2 lg:grid-cols-4'
              }`}>
                {packages.map((pkg, index) => {
                  const isPopular = index === getMostPopularIndex() && packages.length > 1;
                  const isFree = pkg.price === 0;

                  return (
                    <div
                      key={pkg.id}
                      className={`relative group ${isPopular ? 'md:scale-105 md:-mt-4' : ''}`}
                      onMouseEnter={() => setHoveredCard(pkg.id)}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      {/* Popular Badge */}
                      {isPopular && (
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 blur-lg opacity-60" />
                            <div className="relative flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full shadow-xl">
                              <Star className="w-4 h-4 fill-current" />
                              <span className="text-sm font-bold">Phổ biến nhất</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Card */}
                      <div
                        className={`relative h-full rounded-3xl transition-all duration-700 ${
                          isPopular
                            ? 'bg-gradient-to-br from-white via-amber-50/50 to-orange-50/50 border-2 border-amber-200/60 shadow-2xl shadow-amber-500/20'
                            : 'bg-white/80 backdrop-blur-sm border border-stone-200/60 shadow-lg hover:shadow-2xl'
                        } ${hoveredCard === pkg.id ? 'scale-[1.02] -translate-y-2' : ''}`}
                        style={{
                          animationDelay: `${index * 0.1}s`,
                        }}
                      >
                        {/* Gradient overlay on hover */}
                        <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 transition-opacity duration-500 ${
                          hoveredCard === pkg.id ? 'opacity-100' : ''
                        }`} />

                        <div className="relative p-8 md:p-10">
                          {/* Header */}
                          <div className="mb-6">
                            <h3 className="text-3xl font-serif font-bold text-stone-900 mb-2">
                              {pkg.name}
                            </h3>
                            <p className="text-stone-600 leading-relaxed">
                              {pkg.description || "Gói dịch vụ chuyên nghiệp"}
                            </p>
                          </div>

                          {/* Token Badge */}
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 border border-emerald-200/50 mb-6">
                            <Zap className="w-4 h-4 text-emerald-700" />
                            <span className="text-sm font-bold text-emerald-900">
                              {formatTokens(pkg.token_limit)} tokens
                            </span>
                          </div>

                          {/* Price */}
                          <div className="mb-8 pb-8 border-b border-stone-200">
                            {isFree ? (
                              <div className="flex items-baseline gap-2">
                                <span className="text-6xl font-serif font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                  Miễn phí
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {billingPeriod === "annual" && (
                                  <div className="inline-flex items-center gap-2 px-3 py-1 text-xs bg-emerald-100 text-emerald-800 font-bold rounded-full">
                                    <Sparkles className="w-3 h-3" />
                                    Tiết kiệm 20%
                                  </div>
                                )}
                                <div className="flex items-baseline gap-2">
                                  <span className="text-5xl font-serif font-bold bg-gradient-to-r from-stone-900 to-stone-700 bg-clip-text text-transparent">
                                    {formatPrice(billingPeriod === "annual" ? pkg.price * 0.8 : pkg.price)}
                                  </span>
                                  <div className="text-stone-600">
                                    <span className="text-xl font-semibold">đ</span>
                                    <span className="text-base">/tháng</span>
                                  </div>
                                </div>
                                {billingPeriod === "annual" && (
                                  <p className="text-sm text-stone-500">
                                    Thanh toán {formatPrice(pkg.price * 0.8 * 12)}đ/năm
                                  </p>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Features */}
                          <div className="mb-8 space-y-4">
                            <div className="flex items-center gap-3">
                              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                                isPopular
                                  ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                  : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                              }`}>
                                <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3} />
                              </div>
                              <span className="text-stone-900 font-semibold">
                                {formatTokens(pkg.token_limit)} tokens AI/tháng
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                                isPopular
                                  ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                  : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                              }`}>
                                <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3} />
                              </div>
                              <span className="text-stone-900 font-semibold">
                                Thời hạn {pkg.duration_days} ngày
                              </span>
                            </div>

                            {pkg.features && pkg.features.map((feature, idx) => (
                              <div key={idx} className="flex items-start gap-3">
                                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                                  isPopular
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                    : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                }`}>
                                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                </div>
                                <span className="text-stone-700 leading-relaxed">{feature}</span>
                              </div>
                            ))}

                            {/* Default features if none provided */}
                            {(!pkg.features || pkg.features.length === 0) && (
                              <>
                                <div className="flex items-start gap-3">
                                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                                    isPopular
                                      ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                      : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                  }`}>
                                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                  </div>
                                  <span className="text-stone-700 leading-relaxed">Truy cập hệ thống chatbot AI</span>
                                </div>
                                <div className="flex items-start gap-3">
                                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                                    isPopular
                                      ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                      : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                  }`}>
                                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                  </div>
                                  <span className="text-stone-700 leading-relaxed">Tư vấn pháp luật EPR</span>
                                </div>
                                <div className="flex items-start gap-3">
                                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                                    isPopular
                                      ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                      : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                  }`}>
                                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                  </div>
                                  <span className="text-stone-700 leading-relaxed">Hỗ trợ email</span>
                                </div>
                              </>
                            )}
                          </div>

                          {/* CTA */}
                          <button
                            onClick={() => handleSelectPlan(pkg)}
                            disabled={subscribingPackageId === pkg.id}
                            className={`group w-full h-14 rounded-xl font-bold transition-all duration-500 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                              isPopular
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xl shadow-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/40 hover:scale-[1.02]'
                                : isFree
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.02]'
                                : 'border-2 border-stone-300 text-stone-900 hover:bg-stone-50 hover:border-emerald-500 hover:scale-[1.02]'
                            }`}
                          >
                            {subscribingPackageId === pkg.id ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Đang xử lý...</span>
                              </>
                            ) : (
                              <>
                                <span>{isFree ? 'Bắt đầu miễn phí' : 'Chọn gói này'}</span>
                                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Trust Signals */}
        <section className="relative px-6 py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-transparent to-teal-50/50" />

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid md:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => (
                <div
                  key={benefit.title}
                  className="group text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl border border-stone-200/60 hover:border-emerald-200 hover:shadow-xl transition-all duration-500 hover:-translate-y-2 animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-xl mb-5 transition-all duration-500 group-hover:scale-110">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                    <div className="relative bg-gradient-to-br from-emerald-500 to-teal-500 w-14 h-14 rounded-xl flex items-center justify-center shadow-lg">
                      <benefit.icon className="w-7 h-7 text-white" strokeWidth={2} />
                    </div>
                  </div>
                  <h3 className="font-serif font-bold text-stone-900 mb-2 text-lg">{benefit.title}</h3>
                  <p className="text-stone-600 leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="relative px-6 py-20 overflow-hidden">
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="text-center mb-16 animate-slide-up">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-md border border-emerald-200/50 shadow-lg mb-6">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-900">Giải đáp thắc mắc</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-serif font-bold text-stone-900 mb-6">
                Câu hỏi thường gặp
              </h2>
              <p className="text-xl text-stone-600 font-light">
                Giải đáp thắc mắc về giá cả và dịch vụ
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl border border-stone-200/60 overflow-hidden transition-all duration-500 hover:shadow-xl hover:border-emerald-200 animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full px-8 py-6 flex items-center justify-between text-left group"
                  >
                    <span className="font-serif font-bold text-stone-900 pr-4 text-lg group-hover:text-emerald-700 transition-colors">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-6 h-6 text-emerald-600 flex-shrink-0 transition-all duration-500 ${
                        expandedFaq === index ? "rotate-180 scale-110" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-500 ${
                      expandedFaq === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-8 pb-6 text-stone-600 leading-relaxed">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section - Vibrant gradient */}
        <section className="relative px-6 py-24 md:py-32 overflow-hidden">
          <div className="absolute inset-0 gradient-vibrant-hero" />
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-blob-float" />
            <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-chart-2/20 rounded-full blur-3xl animate-blob-float" style={{ animationDelay: "2s" }} />
          </div>

          <div className="mx-auto max-w-4xl text-center relative z-10">
            <div className="animate-slide-up">
              <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tight text-foreground mb-8">
                Sẵn sàng bắt đầu?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-12">
                Tham gia cùng hàng trăm doanh nghiệp đang xây dựng tương lai bền vững
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <Link href="/register">
                <button className="h-14 px-10 gradient-chat-bubble text-white shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all duration-300 rounded-xl font-semibold flex items-center gap-2">
                  Dùng thử miễn phí 30 ngày
                  <ArrowRight className="h-5 w-5" />
                </button>
              </Link>
              <Link href="/contact">
                <button className="h-14 px-10 glass-effect hover:bg-white/60 border-2 transition-all duration-300 rounded-xl font-semibold">
                  Liên hệ tư vấn
                </button>
              </Link>
            </div>

            <p className="text-sm text-muted-foreground animate-slide-up" style={{ animationDelay: "0.2s" }}>
              Không cần thẻ tín dụng • Hủy bất cứ lúc nào • Hỗ trợ 24/7
            </p>
          </div>
        </section>
      </main>

      <Footer />

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        .font-serif {
          font-family: 'Crimson Pro', serif;
        }

        @keyframes blob-float {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-30px) scale(1.1);
          }
        }

        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.4;
          }
          50% {
            transform: translateY(-100px) translateX(50px);
            opacity: 0.8;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-blob-float {
          animation: blob-float 8s ease-in-out infinite;
        }

        .animate-float-slow {
          animation: float-slow 15s ease-in-out infinite;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}

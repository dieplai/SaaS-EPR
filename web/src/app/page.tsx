"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Leaf, Check, Sparkles, TrendingUp, Shield, Users, Zap, Globe, LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function HomePage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const features = [
    {
      icon: Sparkles,
      title: "Phân tích AI thông minh",
      description: "Hệ thống AI tiên tiến phân tích và tư vấn pháp lý EPR tức thì với độ chính xác cao",
    },
    {
      icon: Shield,
      title: "Tuân thủ 100% pháp luật",
      description: "Đảm bảo doanh nghiệp tuân thủ đầy đủ các quy định EPR Việt Nam",
    },
    {
      icon: TrendingUp,
      title: "Tối ưu quy trình",
      description: "Tự động hóa quy trình quản lý EPR, giảm 60% thời gian xử lý giấy tờ",
    },
    {
      icon: Zap,
      title: "Hỗ trợ 24/7",
      description: "Đội ngũ chuyên gia pháp lý EPR sẵn sàng hỗ trợ mọi lúc mọi nơi",
    },
  ];

  const stats = [
    { value: "500+", label: "Doanh nghiệp tin tưởng", icon: Users },
    { value: "2.5M", label: "Tấn chất thải quản lý", icon: Globe },
    { value: "99.9%", label: "Độ chính xác AI", icon: Shield },
    { value: "60%", label: "Tiết kiệm thời gian", icon: LineChart },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-emerald-50/20 overflow-hidden">
      <Header />

      {/* Floating eco particles background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-emerald-400/20 rounded-full animate-float-slow" />
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-teal-400/20 rounded-full animate-float-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-emerald-500/20 rounded-full animate-float-slow" style={{ animationDelay: '2s' }} />
        <div className="absolute top-2/3 right-1/4 w-2 h-2 bg-teal-500/20 rounded-full animate-float-slow" style={{ animationDelay: '3s' }} />
      </div>

      <main className="relative">
        {/* Hero Section */}
        <section className="relative px-6 pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
          {/* Organic gradient orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-60">
            <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-emerald-200/40 to-teal-200/40 rounded-full blur-3xl animate-blob-float" />
            <div className="absolute -bottom-40 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-amber-200/30 to-orange-200/30 rounded-full blur-3xl animate-blob-float" style={{ animationDelay: "3s" }} />
          </div>

          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              {/* Left Column - Content */}
              <div className="lg:col-span-7 space-y-8">
                {/* Badge */}
                <div className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white/80 backdrop-blur-md border border-emerald-200/50 shadow-lg animate-slide-up">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-emerald-500 blur-md opacity-50 rounded-full" />
                    <Leaf className="relative w-4 h-4 text-emerald-600" strokeWidth={2.5} />
                  </div>
                  <span className="text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Nền tảng EPR hàng đầu Việt Nam
                  </span>
                </div>

                {/* Main Heading */}
                <div className="space-y-4 animate-slide-up" style={{ animationDelay: "0.1s" }}>
                  <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.05] tracking-tight text-stone-900">
                    Tương lai
                    <span className="block mt-1">
                      <span className="relative inline-block">
                        <span className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 blur-xl opacity-20" />
                        <span className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent">
                          bền vững
                        </span>
                      </span>
                    </span>
                    <span className="block mt-1">cho doanh nghiệp</span>
                  </h1>
                </div>

                {/* Description */}
                <p className="text-xl md:text-2xl text-stone-600 leading-relaxed max-w-2xl animate-slide-up" style={{ animationDelay: "0.2s" }}>
                  Giải pháp quản lý trách nhiệm mở rộng của nhà sản xuất.{" "}
                  <span className="font-semibold text-stone-900">Đơn giản, minh bạch và hiệu quả.</span>
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-wrap gap-4 pt-4 animate-slide-up" style={{ animationDelay: "0.3s" }}>
                  <Link href="/register">
                    <button className="group h-14 px-8 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold text-lg shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-105">
                      <div className="flex items-center gap-2">
                        <span>Bắt đầu miễn phí</span>
                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                      </div>
                    </button>
                  </Link>

                  <Link href="/contact">
                    <button className="h-14 px-8 bg-white/80 backdrop-blur-md border border-stone-200 text-stone-900 rounded-xl font-semibold text-lg hover:bg-stone-50 hover:border-emerald-500 transition-all duration-300">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Xem demo</span>
                      </div>
                    </button>
                  </Link>
                </div>

                {/* Trust Badge */}
                <div className="flex items-center gap-6 pt-6 animate-slide-up" style={{ animationDelay: "0.4s" }}>
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 border-2 border-white shadow-md"
                      />
                    ))}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-900">500+ doanh nghiệp</p>
                    <p className="text-sm text-stone-600">đã tin tưởng EPR SaaS</p>
                  </div>
                </div>
              </div>

              {/* Right Column - Stats Cards */}
              <div className="lg:col-span-5 relative animate-slide-up" style={{ animationDelay: "0.2s" }}>
                <div className="relative">
                  {/* Main Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {stats.map((stat, index) => {
                      const Icon = stat.icon;
                      return (
                        <div
                          key={index}
                          className="group bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-stone-200/60 hover:shadow-xl hover:border-emerald-200 transition-all duration-500 hover:-translate-y-1"
                          style={{
                            animationDelay: `${0.3 + index * 0.1}s`,
                          }}
                        >
                          <Icon className="w-8 h-8 text-emerald-600 mb-3 group-hover:scale-110 transition-transform" strokeWidth={2} />
                          <div className="text-4xl font-bold text-stone-900 mb-1">
                            {stat.value}
                          </div>
                          <div className="text-sm text-stone-600 leading-tight">{stat.label}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Floating Accent Card */}
                  <div className="absolute -bottom-6 -right-6 bg-white/80 backdrop-blur-sm px-6 py-4 rounded-2xl border border-stone-200/60 shadow-xl animate-float">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-sm font-semibold text-stone-900">Hoạt động 24/7</span>
                    </div>
                  </div>

                  {/* Decorative Blur */}
                  <div className="absolute -z-10 -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full opacity-20 blur-3xl" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative px-6 py-24 md:py-32">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16 animate-slide-up">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-md border border-emerald-200/50 shadow-lg mb-6">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-900">Tính năng nổi bật</span>
              </div>
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-stone-900 mb-4">
                Hệ sinh thái{" "}
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  toàn diện
                </span>
              </h2>
              <p className="text-xl text-stone-600 max-w-2xl mx-auto">
                Mọi công cụ bạn cần để tuân thủ và tối ưu hóa quy trình EPR
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="group relative overflow-hidden bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-stone-200/60 hover:shadow-2xl hover:border-emerald-200 transition-all duration-500 hover:-translate-y-2 animate-slide-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Gradient Background on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Content */}
                    <div className="relative">
                      {/* Icon */}
                      <div className="mb-6">
                        <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-xl transition-all duration-500 group-hover:scale-110">
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                          <div className="relative bg-gradient-to-br from-emerald-500 to-teal-500 w-14 h-14 rounded-xl flex items-center justify-center shadow-lg">
                            <Icon className="w-7 h-7 text-white" strokeWidth={2} />
                          </div>
                        </div>
                      </div>

                      {/* Text */}
                      <h3 className="text-2xl font-bold text-stone-900 mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-lg text-stone-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="relative px-6 py-24 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-transparent to-teal-50/50" />

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left - Visual */}
              <div className="relative order-2 lg:order-1 animate-slide-up">
                <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-stone-200/60">
                  <div className="space-y-6">
                    {/* Progress Items */}
                    {[
                      { label: "Tiết kiệm thời gian", value: 60 },
                      { label: "Tăng hiệu quả", value: 45 },
                      { label: "Giảm chi phí", value: 30 },
                    ].map((item, index) => (
                      <div key={index} className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-base font-semibold text-stone-900">{item.label}</span>
                          <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                            {item.value}%
                          </span>
                        </div>
                        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full animate-progress-bar"
                            style={{
                              width: `${item.value}%`,
                              animationDelay: `${index * 0.2}s`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating Badge */}
                <div className="absolute -top-4 -right-4 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-xl border border-stone-200/60 shadow-lg animate-float">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-emerald-600" strokeWidth={3} />
                    <span className="font-semibold text-stone-900">Tuân thủ 100%</span>
                  </div>
                </div>

                {/* Decorative Element */}
                <div className="absolute -z-10 -bottom-10 -left-10 w-40 h-40 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-full opacity-20 blur-3xl" />
              </div>

              {/* Right - Content */}
              <div className="order-1 lg:order-2 space-y-6 animate-slide-up">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-md border border-emerald-200/50 shadow-lg">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-900">Hiệu quả vượt trội</span>
                </div>

                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-stone-900 leading-tight">
                  Giá trị thiết thực cho{" "}
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    doanh nghiệp
                  </span>
                </h2>

                <p className="text-xl text-stone-600 leading-relaxed">
                  EPR SaaS mang đến hiệu quả thực tế, giúp doanh nghiệp tối ưu hóa quy trình và tuân thủ đầy đủ các quy định về môi trường.
                </p>

                {/* Check Items */}
                <div className="space-y-4 pt-4">
                  {[
                    "Giảm 60% thời gian xử lý giấy tờ",
                    "Tăng 45% hiệu quả quản lý chất thải",
                    "Tiết kiệm 30% chi phí vận hành",
                    "100% tuân thủ quy định pháp luật",
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 animate-slide-up"
                      style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md">
                        <Check className="w-5 h-5 text-white" strokeWidth={3} />
                      </div>
                      <span className="text-lg text-stone-900 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative px-6 py-24 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700" />

          {/* Animated Gradient Mesh */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.4),transparent_50%)]" />
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.3),transparent_50%)]" />
          </div>

          {/* Floating Orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
          </div>

          <div className="mx-auto max-w-4xl text-center relative z-10">
            <div className="animate-slide-up">
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Sẵn sàng bắt đầu?
              </h2>
              <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed mb-10">
                Tham gia cùng hàng trăm doanh nghiệp đang xây dựng tương lai bền vững
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <Link href="/register">
                <button className="h-14 px-10 bg-white text-emerald-700 rounded-xl font-semibold text-lg shadow-2xl hover:shadow-white/30 transition-all duration-300 hover:scale-105 flex items-center gap-2">
                  <span>Dùng thử miễn phí 30 ngày</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>

              <Link href="/contact">
                <button className="h-14 px-10 bg-white/10 backdrop-blur-xl border-2 border-white/30 text-white rounded-xl font-semibold text-lg hover:bg-white/20 transition-all duration-300 hover:scale-105">
                  Liên hệ tư vấn
                </button>
              </Link>
            </div>

            <p className="text-white/80 text-sm animate-slide-up" style={{ animationDelay: "0.2s" }}>
              Không cần thẻ tín dụng • Hủy bất cứ lúc nào • Hỗ trợ 24/7
            </p>
          </div>
        </section>
      </main>

      <Footer />

      <style jsx global>{`
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

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-12px);
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

        @keyframes progress-bar {
          from {
            width: 0;
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        /* Animation Classes */
        .animate-blob-float {
          animation: blob-float 8s ease-in-out infinite;
        }

        .animate-float-slow {
          animation: float-slow 15s ease-in-out infinite;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out;
        }

        .animate-progress-bar {
          animation: progress-bar 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* Smooth Scrolling */
        html {
          scroll-behavior: smooth;
        }

        /* Custom Scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #10b981, #14b8a6);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #059669, #0d9488);
        }
      `}</style>
    </div>
  );
}

import Link from "next/link";
import { Calendar, Clock, ArrowRight, Leaf, Newspaper, TrendingUp, FileText, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Tin tức - EPR SaaS",
  description: "Cập nhật tin tức mới nhất về EPR, môi trường và bền vững từ EPR SaaS",
};

export default function NewsPage() {
  const categories = [
    { name: "Tất cả", icon: Newspaper },
    { name: "Sản phẩm", icon: TrendingUp },
    { name: "Môi trường", icon: Leaf },
    { name: "Chính sách", icon: FileText },
    { name: "Hướng dẫn", icon: BookOpen },
  ];

  const featuredNews = {
    title: "EPR SaaS ra mắt tính năng AI phân tích dữ liệu tái chế",
    excerpt: "Công nghệ trí tuệ nhân tạo mới giúp doanh nghiệp tối ưu hóa quy trình quản lý chất thải và dự đoán xu hướng tái chế chính xác hơn.",
    category: "Sản phẩm",
    date: "10/12/2025",
    readTime: "5 phút đọc",
  };

  const news = [
    {
      title: "Quy định mới về EPR có hiệu lực từ tháng 1/2025",
      excerpt: "Chính phủ ban hành quy định mới về trách nhiệm mở rộng của nhà sản xuất, yêu cầu các doanh nghiệp phải báo cáo định kỳ...",
      category: "Chính sách",
      date: "08/12/2025",
      readTime: "4 phút đọc",
    },
    {
      title: "5 bước tối ưu hóa quy trình quản lý EPR cho doanh nghiệp",
      excerpt: "Hướng dẫn chi tiết giúp doanh nghiệp xây dựng quy trình quản lý EPR hiệu quả, tiết kiệm chi phí và tuân thủ quy định...",
      category: "Hướng dẫn",
      date: "05/12/2025",
      readTime: "6 phút đọc",
    },
    {
      title: "Việt Nam đặt mục tiêu tái chế 80% rác thải nhựa vào năm 2030",
      excerpt: "Bộ Tài nguyên và Môi trường công bố kế hoạch hành động quốc gia về quản lý rác thải nhựa và tái chế...",
      category: "Môi trường",
      date: "03/12/2025",
      readTime: "5 phút đọc",
    },
    {
      title: "Case study: Công ty ABC tiết kiệm 40% chi phí với EPR SaaS",
      excerpt: "Tìm hiểu cách một doanh nghiệp sản xuất hàng tiêu dùng áp dụng EPR SaaS để tối ưu quy trình và giảm chi phí...",
      category: "Sản phẩm",
      date: "01/12/2025",
      readTime: "7 phút đọc",
    },
    {
      title: "Webinar: Xu hướng EPR và Kinh tế tuần hoàn 2025",
      excerpt: "Tham gia webinar miễn phí với các chuyên gia hàng đầu về EPR, tái chế và kinh tế tuần hoàn...",
      category: "Môi trường",
      date: "28/11/2025",
      readTime: "3 phút đọc",
    },
    {
      title: "Cập nhật tính năng mới: Dashboard phân tích nâng cao",
      excerpt: "EPR SaaS giới thiệu dashboard phân tích mới với trực quan hóa dữ liệu trực tiếp và báo cáo tự động...",
      category: "Sản phẩm",
      date: "25/11/2025",
      readTime: "4 phút đọc",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero Section - Vibrant Gradient */}
        <section className="relative overflow-hidden py-24 md:py-32 gradient-vibrant-hero">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 -right-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-blob-float" />
            <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-chart-2/20 rounded-full blur-3xl animate-blob-float" style={{ animationDelay: "2s" }} />
          </div>

          <div className="relative mx-auto max-w-7xl px-6 lg:px-8 z-10">
            <div className="text-center space-y-8 animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect shadow-lg mb-6">
                <Newspaper className="h-4 w-4 text-primary" />
                <span className="text-sm font-refined font-semibold text-primary">Tin tức & Blog</span>
              </div>
              <h1 className="text-4xl font-display font-bold tracking-tight sm:text-6xl lg:text-7xl">
                Tin tức & <span className="text-gradient-vibrant">Cập nhật</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Theo dõi những tin tức mới nhất về EPR, môi trường, và các cập nhật từ nền tảng
              </p>
            </div>
          </div>
        </section>

        {/* Categories - Glass-morphism Sticky */}
        <section className="sticky top-[73px] z-40 py-6 glass-effect border-b border-border/50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((category, index) => (
                <Button
                  key={category.name}
                  variant={index === 0 ? "default" : "outline"}
                  size="sm"
                  className={`rounded-full font-refined font-medium whitespace-nowrap ${
                    index === 0
                      ? "gradient-chat-bubble text-white shadow-lg shadow-primary/25"
                      : "border-2 hover:bg-muted/50"
                  }`}
                >
                  <category.icon className="h-3.5 w-3.5 mr-1.5" />
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Article - Magazine Hero */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-1/5" />
          <div className="absolute top-40 left-0 w-96 h-96 bg-chart-2/10 rounded-full blur-3xl animate-pulse-soft" />

          <div className="relative mx-auto max-w-7xl px-6 lg:px-8 z-10">
            <Card className="overflow-hidden glass-chat-bubble hover:shadow-luxury-hover transition-all duration-500 animate-slide-up border-border/50">
              <div className="grid lg:grid-cols-2 gap-0">
                {/* Image Area */}
                <div className="relative h-80 lg:h-auto bg-gradient-to-br from-primary/20 via-chart-1/20 to-chart-2/20 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                      <div className="relative h-32 w-32 rounded-3xl gradient-chat-bubble flex items-center justify-center shadow-xl">
                        <Leaf className="h-16 w-16 text-white" strokeWidth={2} />
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-6 left-6">
                    <Badge className="gradient-chat-bubble text-white px-4 py-2 shadow-lg shadow-primary/30 font-refined font-semibold">
                      {featuredNews.category}
                    </Badge>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <h2 className="text-3xl md:text-4xl font-elegant font-bold mb-6 text-foreground leading-tight">
                    {featuredNews.title}
                  </h2>
                  <p className="font-refined text-muted-foreground mb-8 leading-relaxed text-lg">
                    {featuredNews.excerpt}
                  </p>
                  <div className="flex items-center gap-6 text-sm font-refined text-muted-foreground mb-8 pb-8 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>{featuredNews.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>{featuredNews.readTime}</span>
                    </div>
                  </div>
                  <Link href="/news/1" className="w-fit">
                    <Button
                      size="lg"
                      className="h-12 px-8 gradient-chat-bubble text-white font-refined font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 transition-all duration-300"
                    >
                      Đọc bài viết
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* News Grid - Magazine Layout */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map((item, index) => (
                <Card
                  key={item.title}
                  className="group flex flex-col overflow-hidden glass-chat-bubble hover:shadow-luxury-hover transition-all duration-500 animate-slide-up hover:-translate-y-1 border-border/50"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Image Area */}
                  <div className="relative h-56 bg-gradient-to-br from-primary/15 via-chart-1/15 to-chart-2/15 overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center opacity-40 group-hover:scale-110 transition-transform duration-500">
                      <Leaf className="h-24 w-24 text-primary" strokeWidth={1.5} />
                    </div>
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-white/90 backdrop-blur-sm text-primary border border-primary/20 font-refined font-semibold">
                        {item.category}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-xl font-elegant font-bold mb-3 text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm font-refined text-muted-foreground mb-6 line-clamp-3 flex-1 leading-relaxed">
                      {item.excerpt}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="flex items-center gap-4 text-xs font-refined text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{item.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{item.readTime}</span>
                        </div>
                      </div>
                      <Link href={`/news/${index + 2}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:bg-primary/10 font-refined font-medium"
                        >
                          Đọc
                          <ArrowRight className="ml-1 h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Load More */}
            <div className="text-center mt-12 animate-slide-up" style={{ animationDelay: "0.4s" }}>
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 rounded-xl border-2 font-refined font-semibold hover:bg-muted/50 transition-all duration-300"
              >
                Xem thêm tin tức
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Newsletter - Glass-morphism */}
        <section className="relative py-24 md:py-32 overflow-hidden">
          <div className="absolute inset-0 gradient-vibrant-hero" />
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-blob-float" />
            <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-chart-2/20 rounded-full blur-3xl animate-blob-float" style={{ animationDelay: "2s" }} />
          </div>

          <div className="relative mx-auto max-w-4xl px-6 lg:px-8 z-10">
            <Card className="glass-chat-bubble border-border/50 overflow-hidden animate-slide-up">
              <div className="p-10 md:p-14 text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl gradient-chat-bubble mb-6 shadow-lg shadow-primary/20">
                  <Newspaper className="h-8 w-8 text-white" strokeWidth={2} />
                </div>
                <h2 className="text-3xl md:text-4xl font-elegant font-bold mb-4 text-foreground">
                  Đăng ký nhận tin tức
                </h2>
                <p className="font-refined text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed text-lg">
                  Nhận cập nhật mới nhất về EPR, môi trường và các tính năng mới từ EPR SaaS
                </p>
                <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <Input
                    type="email"
                    placeholder="email@company.com"
                    className="flex-1 h-12 rounded-xl border-border/50 bg-background/50 font-refined transition-all duration-300 focus:border-primary/50 focus:bg-white input-focus-glow"
                  />
                  <Button
                    size="lg"
                    className="h-12 px-8 gradient-chat-bubble text-white font-refined font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 transition-all duration-300 whitespace-nowrap"
                  >
                    Đăng ký
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

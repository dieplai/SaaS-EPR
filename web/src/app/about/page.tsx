import { Target, Users2, Award, TrendingUp, Leaf, Heart, Sparkles, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Giới thiệu - EPR SaaS",
  description: "Tìm hiểu về EPR SaaS - Nền tảng quản lý trách nhiệm mở rộng của nhà sản xuất hàng đầu Việt Nam",
};

export default function AboutPage() {
  const values = [
    {
      icon: Leaf,
      title: "Bền vững",
      description: "Cam kết bảo vệ môi trường và phát triển bền vững cho thế hệ tương lai",
    },
    {
      icon: Heart,
      title: "Tận tâm",
      description: "Đặt khách hàng làm trọng tâm, mang đến trải nghiệm tốt nhất",
    },
    {
      icon: Award,
      title: "Chất lượng",
      description: "Cam kết chất lượng dịch vụ và sản phẩm xuất sắc",
    },
    {
      icon: TrendingUp,
      title: "Đổi mới",
      description: "Không ngừng cải tiến và ứng dụng công nghệ tiên tiến",
    },
  ];

  const stats = [
    { value: "500+", label: "Doanh nghiệp tin dùng" },
    { value: "2.5M+", label: "Tấn chất thải được quản lý" },
    { value: "99.9%", label: "Độ chính xác" },
    { value: "24/7", label: "Hỗ trợ khách hàng" },
  ];

  const team = [
    {
      name: "Nguyễn Văn A",
      role: "Giám đốc Điều hành",
      bio: "15 năm kinh nghiệm trong lĩnh vực công nghệ và môi trường",
    },
    {
      name: "Trần Thị B",
      role: "Giám đốc Công nghệ",
      bio: "Chuyên gia về SaaS và hệ thống quản lý doanh nghiệp",
    },
    {
      name: "Lê Văn C",
      role: "Giám đốc Phát triển Kinh doanh",
      bio: "Chuyên gia tư vấn giải pháp EPR cho doanh nghiệp",
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
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-refined font-semibold text-primary">Về chúng tôi</span>
              </div>
              <h1 className="text-4xl font-display font-bold tracking-tight sm:text-6xl lg:text-7xl">
                Xây dựng <span className="text-gradient-vibrant">tương lai xanh</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Chúng tôi là đơn vị tiên phong trong việc cung cấp giải pháp công nghệ toàn diện
                cho quản lý trách nhiệm mở rộng của nhà sản xuất tại Việt Nam.
              </p>
            </div>
          </div>
        </section>

        {/* Mission & Vision - Side by side */}
        <section className="relative py-24 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5" />
          <div className="absolute top-40 right-0 w-96 h-96 bg-chart-1/10 rounded-full blur-3xl animate-pulse-soft" />

          <div className="relative mx-auto max-w-7xl px-6 lg:px-8 z-10">
            <div className="grid lg:grid-cols-2 gap-8">
              <Card className="glass-chat-bubble hover:shadow-luxury-hover transition-all duration-500 animate-slide-up border-border/50 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent -z-10" />
                <div className="p-10">
                  <div className="h-14 w-14 rounded-2xl gradient-chat-bubble flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
                    <Target className="h-7 w-7 text-white" />
                  </div>
                  <h2 className="text-3xl font-elegant font-bold mb-6 text-foreground">Sứ mệnh</h2>
                  <p className="font-refined text-muted-foreground leading-relaxed text-lg">
                    Mang đến giải pháp công nghệ tiên tiến, giúp doanh nghiệp Việt Nam dễ dàng
                    tuân thủ các quy định về trách nhiệm mở rộng của nhà sản xuất, đồng thời
                    góp phần bảo vệ môi trường và phát triển bền vững.
                  </p>
                </div>
              </Card>

              <Card className="glass-chat-bubble hover:shadow-luxury-hover transition-all duration-500 animate-slide-up border-border/50 overflow-hidden" style={{ animationDelay: "0.1s" }}>
                <div className="absolute inset-0 bg-gradient-to-br from-chart-2/5 to-transparent -z-10" />
                <div className="p-10">
                  <div className="h-14 w-14 rounded-2xl gradient-chat-bubble flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
                    <Zap className="h-7 w-7 text-white" />
                  </div>
                  <h2 className="text-3xl font-elegant font-bold mb-6 text-foreground">Tầm nhìn</h2>
                  <p className="font-refined text-muted-foreground leading-relaxed text-lg">
                    Trở thành nền tảng quản lý EPR hàng đầu Đông Nam Á, được tin dùng bởi
                    hàng ngàn doanh nghiệp, góp phần quan trọng vào việc xây dựng một
                    tương lai xanh và bền vững cho thế hệ mai sau.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Stats - Colorful gradient cards */}
        <section className="relative py-24 md:py-32 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-chart-1/20 via-primary/10 to-chart-3/20" />
            <div className="absolute bottom-0 left-20 w-96 h-96 bg-chart-2/20 rounded-full blur-3xl animate-blob-float" />
          </div>

          <div className="relative mx-auto max-w-7xl px-6 lg:px-8 z-10">
            <div className="text-center mb-16 animate-slide-up">
              <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight text-foreground mb-4">
                Con số ấn tượng
              </h2>
              <p className="text-lg font-refined text-muted-foreground">
                Những thành tựu chúng tôi đạt được
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <Card
                  key={stat.label}
                  className="glass-chat-bubble hover:shadow-luxury-hover transition-all duration-500 animate-slide-up hover:-translate-y-2 border-border/50 text-center"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="p-8">
                    <p className="text-5xl font-display font-bold text-gradient-vibrant mb-3">
                      {stat.value}
                    </p>
                    <p className="font-refined text-muted-foreground">{stat.label}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Values - Glass cards */}
        <section className="py-24 md:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="text-center mb-16 animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Heart className="h-4 w-4 text-primary" />
                <span className="text-sm font-refined font-semibold text-primary">Giá trị cốt lõi</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 tracking-tight">
                Những giá trị định hướng
              </h2>
              <p className="text-lg font-refined text-muted-foreground max-w-2xl mx-auto">
                Mọi hoạt động của chúng tôi đều dựa trên những giá trị này
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <Card
                  key={value.title}
                  className="glass-chat-bubble hover:shadow-lg transition-all duration-300 animate-slide-up hover:-translate-y-1 border-border/50 text-center"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="p-8">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                      <value.icon className="h-8 w-8 text-primary" strokeWidth={2} />
                    </div>
                    <h3 className="text-xl font-elegant font-bold mb-3 text-foreground">
                      {value.title}
                    </h3>
                    <p className="text-sm font-refined text-muted-foreground leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Team - Vibrant gradient background */}
        <section className="relative py-24 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-1/5" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-soft" />

          <div className="relative mx-auto max-w-7xl px-6 lg:px-8 z-10">
            <div className="text-center mb-16 animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Users2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-refined font-semibold text-primary">Đội ngũ</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 tracking-tight">
                Đội ngũ lãnh đạo
              </h2>
              <p className="text-lg font-refined text-muted-foreground max-w-2xl mx-auto">
                Những con người tâm huyết và giàu kinh nghiệm
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {team.map((member, index) => (
                <Card
                  key={member.name}
                  className="glass-chat-bubble hover:shadow-luxury-hover transition-all duration-500 animate-slide-up hover:-translate-y-2 border-border/50 text-center overflow-hidden"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="p-10">
                    <div className="relative inline-block mb-6">
                      <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full" />
                      <div className="relative h-28 w-28 rounded-2xl gradient-chat-bubble flex items-center justify-center text-white text-4xl font-display font-bold shadow-lg mx-auto">
                        {member.name[0]}
                      </div>
                    </div>
                    <h3 className="text-2xl font-elegant font-bold mb-2 text-foreground">
                      {member.name}
                    </h3>
                    <p className="text-sm font-refined text-primary font-semibold mb-4">{member.role}</p>
                    <p className="text-sm font-refined text-muted-foreground leading-relaxed">{member.bio}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

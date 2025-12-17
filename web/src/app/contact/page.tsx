import { Mail, Phone, MapPin, Clock, Send, MessageCircle, Sparkles, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Liên hệ - EPR SaaS",
  description: "Liên hệ với đội ngũ EPR SaaS để được tư vấn và hỗ trợ",
};

export default function ContactPage() {
  const contactInfo = [
    {
      icon: Mail,
      title: "Email",
      content: "contact@eprsaas.vn",
      detail: "Gửi email bất cứ lúc nào",
    },
    {
      icon: Phone,
      title: "Điện thoại",
      content: "+84 123 456 789",
      detail: "T2-T6: 8:00 - 18:00",
    },
    {
      icon: MapPin,
      title: "Địa chỉ",
      content: "123 Đường ABC, Quận XYZ",
      detail: "Hà Nội, Việt Nam",
    },
    {
      icon: Clock,
      title: "Giờ làm việc",
      content: "Thứ 2 - Thứ 6",
      detail: "8:00 - 18:00",
    },
  ];

  const faqs = [
    {
      question: "Tôi có thể dùng thử miễn phí không?",
      answer: "Có, chúng tôi cung cấp gói dùng thử miễn phí 30 ngày với đầy đủ tính năng.",
    },
    {
      question: "Thời gian phản hồi là bao lâu?",
      answer: "Chúng tôi cam kết phản hồi trong vòng 24 giờ làm việc.",
    },
    {
      question: "Có hỗ trợ đào tạo không?",
      answer: "Có, chúng tôi cung cấp đào tạo miễn phí cho tất cả khách hàng.",
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
                <MessageCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-refined font-semibold text-primary">Liên hệ</span>
              </div>
              <h1 className="text-4xl font-display font-bold tracking-tight sm:text-6xl lg:text-7xl">
                Liên hệ với <span className="text-gradient-vibrant">chúng tôi</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Đội ngũ chuyên gia của chúng tôi luôn sẵn sàng hỗ trợ và tư vấn giải pháp EPR phù hợp nhất cho doanh nghiệp
              </p>
            </div>
          </div>
        </section>

        {/* Contact Info Cards - Glass-morphism */}
        <section className="py-16 -mt-16 relative z-10">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactInfo.map((info, index) => (
                <Card
                  key={info.title}
                  className="text-center glass-chat-bubble hover:shadow-luxury-hover transition-all duration-500 animate-slide-up hover:-translate-y-1 border-border/50"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="p-8">
                    <div className="relative inline-block mb-6">
                      <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full" />
                      <div className="relative h-14 w-14 rounded-2xl gradient-chat-bubble flex items-center justify-center shadow-lg">
                        <info.icon className="h-7 w-7 text-white" strokeWidth={2} />
                      </div>
                    </div>
                    <h3 className="text-sm font-refined font-bold mb-2 text-primary uppercase tracking-wide">
                      {info.title}
                    </h3>
                    <p className="text-foreground font-elegant font-semibold mb-1 text-lg">
                      {info.content}
                    </p>
                    <p className="text-sm font-refined text-muted-foreground">
                      {info.detail}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form & Info - Two Column */}
        <section className="relative py-24 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-1/5" />
          <div className="absolute top-40 right-0 w-96 h-96 bg-chart-2/10 rounded-full blur-3xl animate-pulse-soft" />

          <div className="relative mx-auto max-w-7xl px-6 lg:px-8 z-10">
            <div className="grid lg:grid-cols-5 gap-12">
              {/* Form - Takes 3 columns */}
              <div className="lg:col-span-3 animate-slide-up">
                <Card className="glass-chat-bubble border-border/50 overflow-hidden">
                  <div className="p-8 md:p-10">
                    <div className="mb-8">
                      <h2 className="text-3xl md:text-4xl font-elegant font-bold mb-4 text-foreground">
                        Gửi tin nhắn cho chúng tôi
                      </h2>
                      <p className="font-refined text-muted-foreground leading-relaxed text-lg">
                        Điền thông tin vào form bên dưới và chúng tôi sẽ liên hệ lại với bạn trong thời gian sớm nhất.
                      </p>
                    </div>

                    <form className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2.5">
                          <Label htmlFor="firstName" className="text-sm font-refined font-medium text-foreground">
                            Họ
                          </Label>
                          <Input
                            id="firstName"
                            placeholder="Nguyễn"
                            className="h-12 rounded-xl border-border/50 bg-background/50 font-refined transition-all duration-300 focus:border-primary/50 focus:bg-white input-focus-glow"
                          />
                        </div>
                        <div className="space-y-2.5">
                          <Label htmlFor="lastName" className="text-sm font-refined font-medium text-foreground">
                            Tên
                          </Label>
                          <Input
                            id="lastName"
                            placeholder="Văn A"
                            className="h-12 rounded-xl border-border/50 bg-background/50 font-refined transition-all duration-300 focus:border-primary/50 focus:bg-white input-focus-glow"
                          />
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <Label htmlFor="email" className="text-sm font-refined font-medium text-foreground">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="email@company.com"
                          className="h-12 rounded-xl border-border/50 bg-background/50 font-refined transition-all duration-300 focus:border-primary/50 focus:bg-white input-focus-glow"
                        />
                      </div>

                      <div className="space-y-2.5">
                        <Label htmlFor="phone" className="text-sm font-refined font-medium text-foreground">
                          Số điện thoại
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+84 123 456 789"
                          className="h-12 rounded-xl border-border/50 bg-background/50 font-refined transition-all duration-300 focus:border-primary/50 focus:bg-white input-focus-glow"
                        />
                      </div>

                      <div className="space-y-2.5">
                        <Label htmlFor="company" className="text-sm font-refined font-medium text-foreground">
                          Công ty
                        </Label>
                        <Input
                          id="company"
                          placeholder="Tên công ty"
                          className="h-12 rounded-xl border-border/50 bg-background/50 font-refined transition-all duration-300 focus:border-primary/50 focus:bg-white input-focus-glow"
                        />
                      </div>

                      <div className="space-y-2.5">
                        <Label htmlFor="message" className="text-sm font-refined font-medium text-foreground">
                          Tin nhắn
                        </Label>
                        <Textarea
                          id="message"
                          placeholder="Hãy cho chúng tôi biết bạn cần hỗ trợ điều gì..."
                          rows={5}
                          className="rounded-xl border-border/50 bg-background/50 font-refined transition-all duration-300 focus:border-primary/50 focus:bg-white input-focus-glow resize-none"
                        />
                      </div>

                      <Button
                        size="lg"
                        className="w-full h-12 rounded-xl gradient-chat-bubble text-white font-refined font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 transition-all duration-300"
                      >
                        Gửi tin nhắn
                        <Send className="ml-2 h-4 w-4" />
                      </Button>

                      <p className="text-xs font-refined text-muted-foreground text-center leading-relaxed">
                        Bằng việc gửi form này, bạn đồng ý với{" "}
                        <a href="#" className="text-primary hover:underline font-medium">
                          Chính sách bảo mật
                        </a>{" "}
                        của chúng tôi.
                      </p>
                    </form>
                  </div>
                </Card>
              </div>

              {/* Sidebar - Takes 2 columns */}
              <div className="lg:col-span-2 space-y-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
                {/* Map Card */}
                <Card className="overflow-hidden glass-chat-bubble border-border/50">
                  <div className="h-[300px] relative bg-gradient-to-br from-primary/20 via-chart-1/20 to-chart-2/20">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="relative inline-block mb-4">
                          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                          <div className="relative h-20 w-20 rounded-2xl gradient-chat-bubble flex items-center justify-center shadow-xl">
                            <MapPin className="h-10 w-10 text-white" strokeWidth={2} />
                          </div>
                        </div>
                        <p className="font-refined text-muted-foreground font-medium">Bản đồ văn phòng</p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* FAQ Card */}
                <Card className="glass-chat-bubble border-border/50">
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-10 w-10 rounded-xl gradient-chat-bubble flex items-center justify-center shadow-lg shadow-primary/20">
                        <HelpCircle className="h-5 w-5 text-white" strokeWidth={2} />
                      </div>
                      <h3 className="text-xl font-elegant font-bold text-foreground">
                        Câu hỏi thường gặp
                      </h3>
                    </div>
                    <div className="space-y-6">
                      {faqs.map((faq, index) => (
                        <div key={index} className="pb-6 border-b border-border/50 last:border-0 last:pb-0">
                          <p className="font-refined font-semibold text-foreground mb-2 leading-relaxed">
                            {faq.question}
                          </p>
                          <p className="text-sm font-refined text-muted-foreground leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section - Vibrant */}
        <section className="relative py-24 md:py-32 overflow-hidden">
          <div className="absolute inset-0 gradient-vibrant-hero" />
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-blob-float" />
            <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-chart-2/20 rounded-full blur-3xl animate-blob-float" style={{ animationDelay: "2s" }} />
          </div>

          <div className="relative mx-auto max-w-7xl px-6 lg:px-8 z-10">
            <div className="text-center space-y-8 animate-slide-up">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl gradient-chat-bubble mb-2 shadow-xl shadow-primary/30">
                <Sparkles className="h-8 w-8 text-white" strokeWidth={2} />
              </div>
              <h2 className="text-3xl md:text-5xl font-elegant font-bold tracking-tight text-foreground">
                Cần hỗ trợ ngay?
              </h2>
              <p className="text-xl font-refined text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Liên hệ hotline hoặc chat trực tiếp với chúng tôi
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="h-14 px-10 gradient-chat-bubble text-white font-refined font-semibold shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all duration-300"
                >
                  <Phone className="mr-2 h-5 w-5" />
                  Gọi ngay: +84 123 456 789
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-10 glass-effect hover:bg-white/60 border-2 font-refined font-semibold transition-all duration-300"
                >
                  <Mail className="mr-2 h-5 w-5" />
                  Email: contact@eprsaas.vn
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

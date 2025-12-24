import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Send, User, Sparkles, Zap, Brain, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import aiExpert from "@/assets/ai-expert.png";
import chatbotAvatar from "@/assets/chatbot-avatar.png";

gsap.registerPlugin(ScrollTrigger);

const AIDemoSection = () => {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [displayedMessages, setDisplayedMessages] = useState<Array<{role: string; message: string}>>([]);
  const [isTyping, setIsTyping] = useState(false);

  const demoConversation = [
    {
      role: "user",
      message: t('aiDemo.userMessage'),
    },
    {
      role: "assistant",
      message: t('aiDemo.botMessage'),
    },
  ];

  const features = [
    { icon: Brain, label: t('aiDemo.feature1') },
    { icon: Zap, label: t('aiDemo.feature2') },
    { icon: Scale, label: t('aiDemo.feature3') },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".demo-container",
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".demo-container",
            start: "top 80%",
            onEnter: () => {
              setTimeout(() => {
                setDisplayedMessages([demoConversation[0]]);
                setIsTyping(true);
                setTimeout(() => {
                  setIsTyping(false);
                  setDisplayedMessages(demoConversation);
                }, 2000);
              }, 500);
            },
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            {t('aiDemo.badge')}
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            {t('aiDemo.title')} <span className="text-gradient">{t('aiDemo.titleHighlight')}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('aiDemo.subtitle')}
          </p>
        </div>

        <div className="demo-container max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-3xl blur-3xl scale-90" />
              
              <div className="relative rounded-3xl overflow-hidden border border-primary/20 bg-background/50 backdrop-blur-sm">
                <img
                  src={aiExpert}
                  alt="AI EPR Expert"
                  className="w-full h-auto rounded-3xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
              </div>
              
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
                {features.map((feature, index) => (
                  <div 
                    key={index}
                    className="glass-card px-4 py-2 flex items-center gap-2 animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <feature.icon className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-foreground whitespace-nowrap">{feature.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="glass-card p-6 rounded-3xl border-primary/20">
              <div className="flex items-center gap-3 pb-4 border-b border-border/50 mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/30">
                  <img src={chatbotAvatar} alt="EPR Advisor" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{t('aiDemo.chatbotName')}</h4>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <p className="text-xs text-primary">{t('aiDemo.chatbotStatus')}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 min-h-[300px]">
                {displayedMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    } animate-fade-in`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-primary/30">
                        <img src={chatbotAvatar} alt="AI" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/80 text-foreground border border-border/50"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-line">{msg.message}</p>
                    </div>
                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border/50">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3 animate-fade-in">
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-primary/30">
                      <img src={chatbotAvatar} alt="AI" className="w-full h-full object-cover" />
                    </div>
                    <div className="bg-muted/80 rounded-2xl px-4 py-3 border border-border/50">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" />
                        <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:0.1s]" />
                        <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:0.2s]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-border/50 mt-4">
                <input
                  type="text"
                  placeholder={t('aiDemo.inputPlaceholder')}
                  className="flex-1 bg-muted/50 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
                  disabled
                />
                <Button size="icon" className="btn-glow h-11 w-11 shrink-0">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="text-center mt-8">
              <Link to="/chat">
                <Button className="btn-glow text-primary-foreground px-8 py-6 text-lg">
                  {t('aiDemo.cta')}
                  <Sparkles className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIDemoSection;
